# Cloud Asset Tracker

A Flask-based cloud asset tracking app with authentication, CRUD, and input validation.

## Run locally

1. Create a virtual environment and install dependencies:

- `pip install -r requirements.txt`

2. Set environment variables (optional):

- `SECRET_KEY`
- `DATABASE_URL` (default: sqlite:///cloud_asset_tracker.db)

3. Start the app:

- `python app.py`

The app will be available at http://127.0.0.1:5000

## React frontend

The React rewrite lives in the frontend folder and includes:
- Authentication (local-only)
- Asset CRUD
- Search, filters, tags, status, provider dropdowns
- Pagination, CSV export, created date
- User profile

To run locally, install frontend dependencies and start the dev server from the frontend directory.

## Deploy to AWS Elastic Beanstalk (CI/CD)

1. Create an Elastic Beanstalk application and environment (Python platform).
2. Add these GitHub Secrets:
	- `AWS_ACCESS_KEY_ID`
	- `AWS_SECRET_ACCESS_KEY`
	- `AWS_REGION`
	- `EB_APP_NAME`
	- `EB_ENV_NAME`
3. Push to `main`/`master` to trigger deployment.

Your public URL will be the Elastic Beanstalk environment URL.
