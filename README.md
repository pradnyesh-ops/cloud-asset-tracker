# Cloud Asset Tracker (AWS + GitHub Actions)

This project includes:
- React frontend in `frontend/`
- Flask backend in `app.py`
- CI pipeline in `.github/workflows/ci.yml`
- AWS Elastic Beanstalk deploy workflow in `.github/workflows/deploy-aws-eb.yml`

## Step 5: Secure secrets and environment handling

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

## GitHub secrets (for AWS deploy workflow)
Set these in repository settings -> Secrets and variables -> Actions:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `EB_APP_NAME`
- `EB_ENV_NAME`
- `EB_HEALTHCHECK_URL` (optional, e.g. your EB URL or `/health` endpoint)

## Elastic Beanstalk environment variables
Set these in AWS Elastic Beanstalk environment configuration:
- `SECRET_KEY`
- `DATABASE_URL`
- `FLASK_DEBUG=false`

## CI pipeline
CI runs:
- Ruff lint
- Bandit SAST
- Safety dependency scan
- Pytest + coverage (if tests exist)
- Uploads reports as artifacts

## Step 7: AWS deploy workflow
Deployment workflow in `.github/workflows/deploy-aws-eb.yml` now supports:
- Automatic deploy on push to `main`/`master`
- Manual deploy trigger (`workflow_dispatch`)
- Version labels: `release-<run_number>-<sha>`
- Optional post-deploy health check using `EB_HEALTHCHECK_URL`
