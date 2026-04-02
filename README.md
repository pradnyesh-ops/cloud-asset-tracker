# Cloud Asset Tracker (Flask + React + EC2 CI/CD)

Cloud Asset Tracker is a full-stack app for managing cloud assets with authentication, filtering, reporting, and export.

## Tech Stack

- Backend: Flask, Flask-SQLAlchemy, Flask-Login, Flask-Bcrypt
- Frontend: React + Vite
- Database: SQLite (default)
- Deployment: AWS EC2 (Gunicorn + Nginx)
- CI/CD: GitHub Actions

## Project Structure

- Backend entrypoint: `app.py`
- WSGI entrypoint: `application.py`
- Frontend: `frontend/`
- CI/CD workflow: `.github/workflows/cicd.yml`

## Local Development

### 1) Backend

From the project root, create `.env`:

```env
SECRET_KEY=replace_with_strong_random_secret
DATABASE_URL=sqlite:///cloud_asset_tracker.db
FLASK_DEBUG=true
```

Install and run:

```bash
python -m pip install -r requirements.txt
python app.py
```

Backend runs on `http://127.0.0.1:5000`.

### 2) Frontend (Vite dev mode)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on Vite dev server (usually `http://127.0.0.1:5173`).

### 3) Frontend production build (served by Flask)

```bash
cd frontend
npm run build
```

Flask serves `frontend/dist` in production-style run.

## CI/CD Pipeline (GitHub Actions)

Workflow file: `.github/workflows/cicd.yml`

Pipeline jobs:
1. **backend-checks**
	- compile check
	- pytest (skips if no tests)
	- bandit
	- pip-audit
2. **frontend-checks**
	- npm install/ci
	- vite build
3. **deploy** (only on push to `main`/`master`)
	- sync project to EC2
	- install Python deps
	- build frontend on EC2
	- restart `gunicorn` and `nginx`

## Required GitHub Secrets

Add these under repository **Settings → Secrets and variables → Actions**:

- `EC2_SSH_KEY`
- `EC2_USER`
- `EC2_HOST`
- `PROJECT_PATH`

## EC2 Server Notes

- App directory on server should match `PROJECT_PATH`.
- `.env` must exist on server with at least:

```env
SECRET_KEY=replace_with_strong_random_secret
DATABASE_URL=sqlite:///cloud_asset_tracker.db
FLASK_DEBUG=false
```

- Services expected on server:
  - `gunicorn`
  - `nginx`

Detailed EC2 setup steps are available in `docs/EC2_DEPLOYMENT_GUIDE.md`.
