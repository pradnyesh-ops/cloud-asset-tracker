import os
import re
import ipaddress
from datetime import datetime

from flask import Flask, jsonify, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import (
    LoginManager,
    UserMixin,
    login_user,
    login_required,
    logout_user,
    current_user,
)
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv
from jinja2 import TemplateNotFound

load_dotenv()


def require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


app = Flask(__name__)
app.config["SECRET_KEY"] = require_env("SECRET_KEY")
app.config["SQLALCHEMY_DATABASE_URI"] = require_env("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

bcrypt = Bcrypt(app)
db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = "login"
login_manager.login_message_category = "warning"

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PASSWORD_REGEX = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$")


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    assets = db.relationship("Asset", backref="owner", lazy=True)


class Asset(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    asset_name = db.Column(db.String(120), nullable=False)
    ip_address = db.Column(db.String(45), nullable=False)
    cloud_provider = db.Column(db.String(50), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


def validate_ip(value: str) -> bool:
    try:
        ip = ipaddress.ip_address(value)
        return ip.version == 4
    except ValueError:
        return False


def validate_password(value: str) -> bool:
    return bool(PASSWORD_REGEX.match(value))


def render_or_message(template_name: str, **context):
    try:
        return render_template(template_name, **context)
    except TemplateNotFound:
        return (
            jsonify(
                {
                    "message": "Flask templates are not present. Use the React frontend at http://localhost:5173.",
                    "missing_template": template_name,
                }
            ),
            200,
        )


@app.route("/")
def index():
    return jsonify({"status": "ok", "service": "cloud-asset-tracker-backend"}), 200


@app.route("/health")
def health():
    return jsonify({"status": "healthy"}), 200


@app.route("/register", methods=["GET", "POST"])
def register():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        confirm_password = request.form.get("confirm_password", "")

        if not email or not password or not confirm_password:
            flash("All fields are required.", "danger")
            return render_or_message("register.html")

        if not EMAIL_REGEX.match(email):
            flash("Enter a valid email address.", "danger")
            return render_or_message("register.html")

        if not validate_password(password):
            flash(
                "Password must be 8+ chars with upper, lower, number, and symbol.",
                "danger",
            )
            return render_or_message("register.html")

        if password != confirm_password:
            flash("Passwords do not match.", "danger")
            return render_or_message("register.html")

        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash("Email already registered. Please log in.", "warning")
            return redirect(url_for("login"))

        hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")
        user = User(email=email, password_hash=hashed_password)
        db.session.add(user)
        db.session.commit()

        flash("Registration successful. Please log in.", "success")
        return redirect(url_for("login"))

    return render_or_message("register.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")

        user = User.query.filter_by(email=email).first()
        if user and bcrypt.check_password_hash(user.password_hash, password):
            login_user(user)
            flash("Welcome back!", "success")
            return redirect(url_for("dashboard"))

        flash("Invalid credentials.", "danger")

    return render_or_message("login.html")


@app.route("/logout")
@login_required
def logout():
    logout_user()
    flash("You have been logged out.", "info")
    return redirect(url_for("login"))


@app.route("/dashboard")
@login_required
def dashboard():
    assets = Asset.query.filter_by(owner_id=current_user.id).all()
    return render_or_message("dashboard.html", assets=assets)


@app.route("/asset/new", methods=["GET", "POST"])
@login_required
def create_asset():
    if request.method == "POST":
        asset_name = request.form.get("asset_name", "").strip()
        ip_address = request.form.get("ip_address", "").strip()
        cloud_provider = request.form.get("cloud_provider", "").strip()

        if not asset_name:
            flash("Asset name is required.", "danger")
            return render_or_message("asset_form.html", action="Create")

        if not validate_ip(ip_address):
            flash("Enter a valid IPv4 address.", "danger")
            return render_or_message("asset_form.html", action="Create")

        if not cloud_provider:
            flash("Cloud provider is required.", "danger")
            return render_or_message("asset_form.html", action="Create")

        asset = Asset(
            asset_name=asset_name,
            ip_address=ip_address,
            cloud_provider=cloud_provider,
            owner_id=current_user.id,
        )
        db.session.add(asset)
        db.session.commit()

        flash("Asset created successfully.", "success")
        return redirect(url_for("dashboard"))

    return render_or_message("asset_form.html", action="Create")


@app.route("/asset/<int:asset_id>/edit", methods=["GET", "POST"])
@login_required
def edit_asset(asset_id):
    asset = Asset.query.filter_by(id=asset_id, owner_id=current_user.id).first_or_404()

    if request.method == "POST":
        asset_name = request.form.get("asset_name", "").strip()
        ip_address = request.form.get("ip_address", "").strip()
        cloud_provider = request.form.get("cloud_provider", "").strip()

        if not asset_name:
            flash("Asset name is required.", "danger")
            return render_or_message("asset_form.html", action="Update", asset=asset)

        if not validate_ip(ip_address):
            flash("Enter a valid IPv4 address.", "danger")
            return render_or_message("asset_form.html", action="Update", asset=asset)

        if not cloud_provider:
            flash("Cloud provider is required.", "danger")
            return render_or_message("asset_form.html", action="Update", asset=asset)

        asset.asset_name = asset_name
        asset.ip_address = ip_address
        asset.cloud_provider = cloud_provider
        db.session.commit()

        flash("Asset updated successfully.", "success")
        return redirect(url_for("dashboard"))

    return render_or_message("asset_form.html", action="Update", asset=asset)


@app.route("/asset/<int:asset_id>/delete", methods=["POST"])
@login_required
def delete_asset(asset_id):
    asset = Asset.query.filter_by(id=asset_id, owner_id=current_user.id).first_or_404()
    db.session.delete(asset)
    db.session.commit()
    flash("Asset deleted successfully.", "info")
    return redirect(url_for("dashboard"))


with app.app_context():
    db.create_all()


if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "false").strip().lower() == "true"
    app.run(debug=debug_mode)
