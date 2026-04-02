import os
import re
import ipaddress
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder="frontend/dist", static_url_path="/")
CORS(app, supports_credentials=True)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///cloud_asset_tracker.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

bcrypt = Bcrypt(app)
db = SQLAlchemy(app)
login_manager = LoginManager(app)

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

@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({"error": "Unauthorized"}), 401

def validate_ip(value: str) -> bool:
    try:
        ip = ipaddress.ip_address(value)
        return ip.version == 4
    except ValueError:
        return False

def validate_password(value: str) -> bool:
    return bool(PASSWORD_REGEX.match(value))

@app.route("/api/auth/me", methods=["GET"])
def current_user_info():
    if current_user.is_authenticated:
        return jsonify({"id": current_user.id, "email": current_user.email})
    return jsonify({"error": "Unauthorized"}), 401

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    confirm_password = data.get("confirm_password", "")

    if not email or not password or not confirm_password:
        return jsonify({"error": "All fields are required."}), 400

    if not EMAIL_REGEX.match(email):
        return jsonify({"error": "Enter a valid email address."}), 400

    if not validate_password(password):
        return jsonify({"error": "Password must be 8+ chars ...", "message": "Password requires 8+ chars and symbol."}), 400

    if password != confirm_password:
        return jsonify({"error": "Passwords do not match."}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"error": "Email already registered."}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")
    user = User(email=email, password_hash=hashed_password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "Registration successful"}), 201

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()
    if user and bcrypt.check_password_hash(user.password_hash, password):
        login_user(user)
        return jsonify({"message": "Login successful", "user": {"id": user.id, "email": user.email}}), 200

    return jsonify({"error": "Invalid credentials."}), 401

@app.route("/api/auth/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out"}), 200

@app.route("/api/assets", methods=["GET"])
@login_required
def get_assets():
    assets = Asset.query.filter_by(owner_id=current_user.id).all()
    return jsonify([{
        "id": a.id,
        "asset_name": a.asset_name,
        "ip_address": a.ip_address,
        "cloud_provider": a.cloud_provider,
        "created_at": a.created_at.isoformat()
    } for a in assets]), 200

@app.route("/api/assets", methods=["POST"])
@login_required
def create_asset():
    data = request.get_json() or {}
    asset_name = data.get("asset_name", "").strip()
    ip_address = data.get("ip_address", "").strip()
    cloud_provider = data.get("cloud_provider", "").strip()

    if not asset_name or not cloud_provider:
        return jsonify({"error": "Fields are required."}), 400

    if not validate_ip(ip_address):
        return jsonify({"error": "Enter a valid IPv4 address."}), 400

    asset = Asset(
        asset_name=asset_name,
        ip_address=ip_address,
        cloud_provider=cloud_provider,
        owner_id=current_user.id,
    )
    db.session.add(asset)
    db.session.commit()
    return jsonify({"id": asset.id, "asset_name": asset.asset_name, "ip_address": asset.ip_address, "cloud_provider": asset.cloud_provider}), 201

@app.route("/api/assets/<int:asset_id>", methods=["PUT"])
@login_required
def update_asset(asset_id):
    asset = Asset.query.filter_by(id=asset_id, owner_id=current_user.id).first()
    if not asset:
        return jsonify({"error": "Asset not found"}), 404
    data = request.get_json() or {}
    asset.asset_name = data.get("asset_name", asset.asset_name).strip()
    asset.ip_address = data.get("ip_address", asset.ip_address).strip()
    asset.cloud_provider = data.get("cloud_provider", asset.cloud_provider).strip()
    db.session.commit()
    return jsonify({"id": asset.id}), 200

@app.route("/api/assets/<int:asset_id>", methods=["DELETE"])
@login_required
def delete_asset(asset_id):
    asset = Asset.query.filter_by(id=asset_id, owner_id=current_user.id).first()
    if not asset:
        return jsonify({"error": "Asset not found"}), 404
    db.session.delete(asset)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(app.static_folder + "/" + path):
        return app.send_static_file(path)
    else:
        return app.send_static_file("index.html")

with app.app_context():
    db.create_all()

if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "false").strip().lower() == "true"
    app.run(debug=debug_mode, port=5000)
