# SAST / SCA Report

This document will collect Bandit, Safety, and test findings plus remediation steps.

## CI design
- Linting: Ruff
- SAST: Bandit
- SCA: Safety
- Tests: Pytest + Coverage
- Deployment: GitHub Actions -> AWS Elastic Beanstalk

## How to reproduce locally
```bash
# install python deps
/Users/pradnyesh/.pyenv/versions/myproject/bin/python -m pip install -r requirements.txt
# run bandit
bandit -r . -x ./.github,./venv -f json -o bandit-report.json
# run safety
safety check -r requirements.txt --full-report > safety-report.txt
# run ruff
ruff check .
# run tests
coverage run -m pytest
coverage report
```

## Findings
- (Add Bandit findings and remediation here)

## References
- Bandit: https://bandit.readthedocs.io/
- Safety: https://pyup.io/safety/
