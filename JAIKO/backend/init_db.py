"""
Script de inicialización de la base de datos JAIKO!

Uso:
    cd backend
    python init_db.py

Esto crea todas las tablas y un usuario admin inicial.
"""
import os
from dotenv import load_dotenv
load_dotenv()

from app import create_app
from app.extensions import db
from app.models import User, Profile

app = create_app()

with app.app_context():
    print("⚙️  Creando tablas...")
    db.create_all()
    print("✅  Tablas creadas")

    # Seed admin user (optional, only if not exists)
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@jaiko.com.py")
    if not User.query.filter_by(email=admin_email).first():
        admin = User(email=admin_email, role="admin", status="active")
        db.session.add(admin)
        db.session.flush()
        profile = Profile(user_id=admin.id, name="Admin JAIKO", city="Asunción")
        db.session.add(profile)
        db.session.commit()
        print(f"👤  Admin creado: {admin_email}")
    else:
        print("ℹ️   Admin ya existe")

    print("🚀  Base de datos lista")
