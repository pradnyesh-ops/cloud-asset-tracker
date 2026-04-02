import os

import pytest

os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

import app as backend


def test_validate_ip_accepts_ipv4():
    assert backend.validate_ip("192.168.1.10") is True


def test_validate_ip_rejects_invalid_or_ipv6():
    assert backend.validate_ip("not-an-ip") is False
    assert backend.validate_ip("2001:db8::1") is False


def test_validate_password_policy():
    assert backend.validate_password("StrongP@ss1") is True
    assert backend.validate_password("weak") is False


def test_require_env_raises_when_missing(monkeypatch):
    monkeypatch.delenv("MISSING_TEST_ENV", raising=False)
    with pytest.raises(RuntimeError):
        backend.require_env("MISSING_TEST_ENV")
