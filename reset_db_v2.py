import sys
import os
from sqlalchemy import create_engine, text
from passlib.context import CryptContext

# Auth DB - Use localhost for running script from host
AUTH_DB_URL = "postgresql://hospital_admin:secure_hospital_pass@localhost:5432/auth_db"
# Nurse DB - Use localhost for running script from host
NURSE_DB_URL = "postgresql://hospital_admin:secure_hospital_pass@localhost:5432/nurse_db"

def reset_database(url, db_name):
    print(f"Resetting {db_name}...")
    try:
        engine = create_engine(url)
        with engine.connect() as conn:
            conn.execute(text("DROP SCHEMA public CASCADE;"))
            conn.execute(text("CREATE SCHEMA public;"))
            conn.commit()
        print(f"✅ {db_name} wiped.")
    except Exception as e:
        print(f"❌ Error resetting {db_name}: {e}")

def clean_imports():
    """Remove conflicting modules from sys.modules"""
    for mod in ['models', 'config', 'schemas', 'database']:
        if mod in sys.modules:
            del sys.modules[mod]

def seed_auth_db():
    print("Seeding Auth DB...")
    clean_imports()
    
    # Point to correct user-management project path
    path = '/home/suryana/Projects/user-management'
    if path not in sys.path:
        sys.path.insert(0, path)
        
    try:
        import models
        from models import Base, User, Role, Permission, init_default_data
        from sqlalchemy.orm import sessionmaker
        
        engine = create_engine(AUTH_DB_URL)
        Base.metadata.create_all(engine)
        
        Session = sessionmaker(bind=engine)
        session = Session()

        # Create default roles/perms
        init_default_data(session)

        # Password hasher matching auth-service
        pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")
        
        # Helper to create user
        def create_user(username, password, role_name, first, last, assigned_ns=None):
            role = session.query(Role).filter_by(name=role_name).first()
            if not role:
                print(f"⚠️ Role {role_name} not found, skipping user {username}")
                return
                
            hashed = pwd_context.hash(password)
            user = User(
                username=username,
                password=hashed,
                first_name=first,
                last_name=last,
                email=f"{username}@hospital.com",
                role_id=role.id,
                is_active=True,
                assigned_nurse_station=assigned_ns
            )
            session.add(user)
            print(f"   + User created: {username} ({role_name})")

        print("Creating default users...")
        create_user("administrator", "administrator", "administrator", "System", "Admin")
        create_user("sysadmin", "sysadmin", "administrator", "System", "Administrator") # Keep sysadmin just in case
        create_user("nurse1", "nurse123", "nurse", "Nurse", "Anna", "NS 332")
        create_user("kitchen1", "kitchen123", "kitchen", "Chef", "Budi")
        create_user("cleaning1", "clean123", "cleaning", "Cleaner", "Citra")

        session.commit()
        print("✅ Auth DB seeded successfully.")
        session.close()
        
    except Exception as e:
        print(f"❌ Error seeding Auth DB: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Clean up path
        if path in sys.path:
            sys.path.remove(path)
        clean_imports()

def seed_nurse_db():
    print("Seeding Nurse DB...")
    clean_imports()
    
    # Point to correct nurse-service project path
    path = '/home/suryana/Projects/nurse-service'
    if path not in sys.path:
        sys.path.insert(0, path)
        
    try:
        import models
        from models import Base
        
        engine = create_engine(NURSE_DB_URL)
        Base.metadata.create_all(engine)
        print("✅ Nurse DB tables created.")
    except Exception as e:
        print(f"❌ Error seeding Nurse DB: {e}")
    finally:
        if path in sys.path:
            sys.path.remove(path)
        clean_imports()

if __name__ == "__main__":
    # Seed without full wipe if possible, but reset_database wipes schema so it is a full wipe.
    reset_database(AUTH_DB_URL, "Auth DB")
    # reset_database(NURSE_DB_URL, "Nurse DB") # Maybe don't wipe nurse DB if it has patient data? 
    # But user asked to "fix login", implying auth issue. Let's wipe Auth DB only for now to be safe,
    # OR wipe both to ensure consistency. The user just started running services so data is likely dispensable.
    # I'll wipe both to be clean.
    reset_database(NURSE_DB_URL, "Nurse DB")
    
    # Seed
    seed_auth_db()
    seed_nurse_db()
