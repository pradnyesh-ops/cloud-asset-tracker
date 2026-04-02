#!/bin/bash
set -e

echo "Running apt update and installing base packages..."
sudo apt update
sudo DEBIAN_FRONTEND=noninteractive apt upgrade -y -q
sudo DEBIAN_FRONTEND=noninteractive apt install -y -q python3 python3-pip python3-venv nginx git

echo "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo DEBIAN_FRONTEND=noninteractive apt install -y -q nodejs

echo "Cloning repository..."
rm -rf /home/ubuntu/cloud-asset-tracker
git clone https://github.com/pradnyesh-ops/cloud-asset-tracker.git /home/ubuntu/cloud-asset-tracker
cd /home/ubuntu/cloud-asset-tracker

echo "Setting up Python environment..."
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn

echo "Creating .env file..."
cat << 'ENV_EOF' > /home/ubuntu/cloud-asset-tracker/.env
SECRET_KEY=94b292c34cb80eb7f2d3a3cd92ff410292c3c6f2a3dc263e8b4e4ecde79c3d4e
DATABASE_URL=sqlite:///cloud_asset_tracker.db
FLASK_DEBUG=false
ENV_EOF

echo "Building React frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Creating Gunicorn systemd service..."
sudo tee /etc/systemd/system/gunicorn.service > /dev/null << 'UNIT_EOF'
[Unit]
Description=Gunicorn for cloud-asset-tracker
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/cloud-asset-tracker
EnvironmentFile=/home/ubuntu/cloud-asset-tracker/.env
ExecStart=/home/ubuntu/cloud-asset-tracker/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 application:application

[Install]
WantedBy=multi-user.target
UNIT_EOF

sudo systemctl daemon-reload
sudo systemctl enable gunicorn
sudo systemctl restart gunicorn

echo "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/cloud-asset-tracker > /dev/null << 'NGINX_EOF'
server {
    listen 80;
    server_name _;

    location / {
        include proxy_params;
        proxy_pass http://127.0.0.1:8000;
    }
}
NGINX_EOF

sudo ln -sf /etc/nginx/sites-available/cloud-asset-tracker /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "Setting up visudo for CI/CD passwordless restarts..."
sudo bash -c 'echo "ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl restart gunicorn, /bin/systemctl restart nginx" > /etc/sudoers.d/cloud-asset-tracker'

echo "===================================="
echo "DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "===================================="
