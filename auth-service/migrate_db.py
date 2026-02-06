
import os
from sqlalchemy import create_engine, text

# Use the same connection string as main.py
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://hospital_admin:secure_hospital_pass@db:5432/auth_db")

# For running locally (outside docker link), we might need localhost
# But this script is intended to run inside the container or where 'db' is resolvable
# If running from host machine, use localhost
# Trust the environment variable
pass

print(f"Connecting to {DATABASE_URL}")
engine = create_engine(DATABASE_URL)

def run_migration():
    with engine.connect() as connection:
        try:
            # Check if column exists
            result = connection.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='staff' AND column_name='is_active'"))
            if result.rowcount > 0:
                print("Column is_active already exists.")
            else:
                print("Adding is_active column...")
                connection.execute(text("ALTER TABLE staff ADD COLUMN is_active BOOLEAN DEFAULT TRUE"))
                print("Column added successfully.")
                
            # Make sure existing users are active
            connection.execute(text("UPDATE staff SET is_active = TRUE WHERE is_active IS NULL"))
            connection.commit()
            print("Migration complete.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    run_migration()
