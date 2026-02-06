import os

# Database Configuration - Using existing auth_db
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://hospital_admin:secure_hospital_pass@localhost:5432/user_db")

APP_NAME = "User Management Service"
APP_VERSION = "1.0.0"
