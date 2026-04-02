# Cloud Asset Tracker (Netlify + GitHub Actions)

This project includes:
- React frontend in `frontend/`
- Flask backend in `app.py`
- CI pipeline in `.github/workflows/ci.yml`
- Netlify deploy workflow in `.github/workflows/deploy-netlify.yml`

## Secure secrets and environment handling

The backend now requires these environment variables:
- `SECRET_KEY`
- `DATABASE_URL`

If missing, app startup fails by design.

### Local setup (backend)
1. Copy `.env.example` to `.env`
2. Set strong values
3. Run backend

```bash
cd "/Users/pradnyesh/CloudSecOps/Cloud Asset Tracker"
cp .env.example .env
/Users/pradnyesh/.pyenv/versions/myproject/bin/python app.py
```

### Local setup (frontend)
```bash
cd "/Users/pradnyesh/CloudSecOps/Cloud Asset Tracker/frontend"
npm install
npm run dev
```

## Instant deployment with Netlify + GitHub Actions
Deployment workflow file:
- `.github/workflows/deploy-netlify.yml`

One-time setup:
1. Create a Netlify site connected to this repository.
2. In Netlify, copy:
	- Personal access token (or team token)
	- Site ID
3. In GitHub repository secrets, add:
	- `NETLIFY_AUTH_TOKEN`
	- `NETLIFY_SITE_ID`

After that, pushes to `main`/`master` (frontend changes) build and deploy automatically with clear GitHub Actions visuals.

## Backend note
The app serves built React files from Flask directly, so it runs as one service.

## CI pipeline
CI runs:
- Ruff lint
- Bandit SAST
- Safety dependency scan
- Pytest + coverage (if tests exist)
- Uploads reports as artifacts

## Deployment visuals in GitHub Actions
For presentation, use these runs:
- `CI`
- `pre-commit`
- `Deploy Frontend (Netlify)`

> Note: No `.pem` key is required for deployment when using SSM.

## One-time EC2 setup
Copy deployment templates from `deploy/`:
- `deploy/cloud-asset-tracker.service` to `/etc/systemd/system/cloud-asset-tracker.service`
- `deploy/nginx-cloud-asset-tracker.conf` to `/etc/nginx/conf.d/cloud-asset-tracker.conf`

Then run:
1. `sudo systemctl daemon-reload`
2. `sudo systemctl enable cloud-asset-tracker`
3. `sudo systemctl start cloud-asset-tracker`
4. `sudo systemctl restart nginx`
