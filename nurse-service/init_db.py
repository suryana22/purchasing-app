#!/usr/bin/env python3
"""
Database Initialization Script
Creates database and tables for Nurse Call System
"""
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

from config import DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME, DATABASE_URL
from models import Base, get_engine, create_tables


def create_database():
    """Create database if not exists"""
    try:
        # Connect to default postgres database
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database="postgres"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = '{DB_NAME}'")
        exists = cursor.fetchone()
        
        if not exists:
            cursor.execute(f"CREATE DATABASE {DB_NAME}")
            print(f"✅ Database '{DB_NAME}' created successfully!")
        else:
            print(f"ℹ️  Database '{DB_NAME}' already exists.")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        return False


def init_tables():
    """Create all tables"""
    try:
        engine = get_engine(DATABASE_URL)
        create_tables(engine)
        print("✅ All tables created successfully!")
        return True
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False


def seed_demo_data():
    """Seed some demo data (optional)"""
    try:
        from sqlalchemy.orm import sessionmaker
        from models import NurseStation, Room
        
        engine = get_engine(DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Check if nurse stations exist
        existing = db.query(NurseStation).first()
        if existing:
            print("ℹ️  Demo data already exists, skipping seed.")
            db.close()
            return True
        
        # Create demo nurse station
        station = NurseStation(
            name="NS-301",
            description="Nurse Station Lantai 3 - Bangsal Mawar",
            location="Gedung A, Lantai 3",
            is_active=True
        )
        db.add(station)
        db.commit()
        db.refresh(station)
        
        # Create demo rooms
        rooms_data = [
            {"room_number": "301", "room_name": "Mawar 1", "bed_number": "A", "bed_type": "Standard"},
            {"room_number": "301", "room_name": "Mawar 1", "bed_number": "B", "bed_type": "Standard"},
            {"room_number": "302", "room_name": "Mawar 2", "bed_number": "A", "bed_type": "VIP"},
            {"room_number": "303", "room_name": "Mawar 3", "bed_number": "A", "bed_type": "ICU"},
        ]
        
        for room_data in rooms_data:
            room = Room(
                nurse_station_id=station.id,
                **room_data
            )
            db.add(room)
        
        db.commit()
        print(f"✅ Demo data seeded: 1 nurse station + {len(rooms_data)} rooms")
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        return False


def main():
    print("=" * 50)
    print("🏥 NURSE CALL SYSTEM - Database Initialization")
    print("=" * 50)
    print()
    
    # Step 1: Create database
    print("📦 Step 1: Creating database...")
    if not create_database():
        sys.exit(1)
    
    # Step 2: Create tables
    print("\n📋 Step 2: Creating tables...")
    if not init_tables():
        sys.exit(1)
    
    # Step 3: Seed demo data (optional)
    print("\n🌱 Step 3: Seeding demo data...")
    seed_demo_data()
    
    print("\n" + "=" * 50)
    print("✅ Database initialization complete!")
    print(f"   Database: {DB_NAME}")
    print(f"   Host: {DB_HOST}:{DB_PORT}")
    print("=" * 50)


if __name__ == "__main__":
    main()
