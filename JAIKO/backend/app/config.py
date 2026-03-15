import os
from dotenv import load_dotenv

# Obtiene la ruta absoluta de la carpeta donde está este archivo
basedir = os.path.abspath(os.path.dirname(__file__))
# Carga el .env forzando la ruta para evitar errores de lectura
load_dotenv(os.path.join(basedir, '.env'))

class Config:
    # Si no hay SECRET_KEY en el .env, usa la de desarrollo
    SECRET_KEY = os.environ.get("SECRET_KEY", "jaiko-dev-secret-123")
    
    # PRIORIDAD: 
    # 1. DATABASE_URL del .env
    # 2. SQLite local (jaiko_dev.db) como respaldo seguro
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", 
        f"sqlite:///{os.path.join(basedir, 'jaiko_dev.db')}"
    )
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jaiko-jwt-secret-456")
    JWT_ACCESS_TOKEN_EXPIRES = 86400 * 7  # 7 días

    GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")

    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
    SUPABASE_BUCKET = os.environ.get("SUPABASE_BUCKET", "jaiko-media")

    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

    # Configuración de lógica de negocio
    MATCH_THRESHOLD = 0.80
    MAX_GROUP_MEMBERS = 6

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False
    # En producción, DATABASE_URL DEBE existir (ej. Postgres en Render/Heroku)
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")

config_map = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}
