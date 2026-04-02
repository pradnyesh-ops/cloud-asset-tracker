# EC2 Deployment Guide — cloud-asset-tracker

---

## 1. GitHub Secrets Required

**GitHub → repo → Settings → Secrets and variables → Actions:**

| Secret | Example value |
|--------|--------------|
| `EC2_SSH_KEY` | Full contents of your `.pem` file |
| `EC2_USER` | `ubuntu` |
| `EC2_HOST` | `13.63.65.125` |
| `PROJECT_PATH` | `/home/ubuntu/cloud-asset-tracker` |

Flask env vars (`SECRET_KEY`, `DATABASE_URL`) live in a `.env` file
on the server — **not** as GitHub secrets. See step 4c below.

---

## 2. Pipeline Flow

```
push to main
       │
       ├─────────────────────────┐
       ▼                         ▼
┌──────────────────┐    ┌─────────────────┐
│ backend-checks   │    │ frontend-checks │
│ • syntax check   │    │ • pytest         │
│ • pytest         │    │ • npm ci        │
│ • bandit         │    │ • vite build    │
│ • pip-audit      │    └────────┬────────┘
└────────┬─────────┘             │
         │     both pass         │
         └──────────┬────────────┘
                    ▼
          ┌──────────────────┐
          │  deploy (SSH)    │
          │  git pull        │
          │  pip install     │
          │  npm ci + build  │  ← Vite rebuilds frontend/dist/ on EC2
          │  restart gunicorn│
          │  restart nginx   │
          └──────────────────┘
```

The Vite build runs **on the EC2 instance** during deploy. This means
`frontend/dist/` is always fresh and you never need to commit built
files or transfer artifacts.

---

## 3. EC2 Instance Setup (one-time)

### a) Launch EC2

- **AMI:** Ubuntu 24.04 LTS
- **Instance type:** t3.micro (free tier)
- **Security group inbound rules:**
  - Port 22 (SSH) — your IP only
  - Port 80 (HTTP)
  - Port 443 (HTTPS) — optional

### b) Install system dependencies

```bash
ssh -i your-key.pem ubuntu@<EC2_IP>

sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv nginx git

# Node.js 20 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### c) Clone the repo and set up Python

```bash
cd /home/ubuntu
git clone https://github.com/<you>/cloud-asset-tracker.git
cd cloud-asset-tracker

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn
```

### d) Create the `.env` file

```bash
nano /home/ubuntu/cloud-asset-tracker/.env
```

```env
SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_hex(32))">
DATABASE_URL=sqlite:///cloud_asset_tracker.db
FLASK_DEBUG=false
```

> ⚠️ The repo's current `.env` has `SECRET_KEY=1234567890` — replace it.

### e) Do the first frontend build

```bash
cd /home/ubuntu/cloud-asset-tracker/frontend
npm install
npm run build      # creates frontend/dist/
cd ..
```

### f) Configure Gunicorn systemd service

Create `/etc/systemd/system/gunicorn.service`:

```ini
[Unit]
Description=Gunicorn for cloud-asset-tracker
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/cloud-asset-tracker
EnvironmentFile=/home/ubuntu/cloud-asset-tracker/.env
ExecStart=/home/ubuntu/cloud-asset-tracker/venv/bin/gunicorn \
    --workers 3 \
    --bind unix:/run/gunicorn.sock \
    application:application

[Install]
WantedBy=multi-user.target
```

> `application:application` matches `application.py` which does
> `from app import app as application` — this is the correct entry point.

```bash
sudo systemctl daemon-reload
sudo systemctl enable gunicorn
sudo systemctl start gunicorn
sudo systemctl status gunicorn   # confirm it's running
```

### g) Configure Nginx

Since Flask itself serves `frontend/dist/` as static files, Nginx
just needs to proxy everything through to Gunicorn:

Create `/etc/nginx/sites-available/cloud-asset-tracker`:

```nginx
server {
    listen 80;
    server_name <EC2_IP> yourdomain.com;

    location / {
        include proxy_params;
        proxy_pass http://unix:/run/gunicorn.sock;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/cloud-asset-tracker \
           /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### h) Allow passwordless service restarts (required by CI/CD)

```bash
sudo visudo
```

Add this line:
```
ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl restart gunicorn, /bin/systemctl restart nginx
```

---

## 4. Verify It Works

```bash
# Check gunicorn socket exists
ls -la /run/gunicorn.sock

# Check nginx is proxying correctly
curl -I http://localhost

# Tail logs if something's wrong
sudo journalctl -u gunicorn -f
sudo tail -f /var/log/nginx/error.log
```

---