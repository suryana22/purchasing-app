
from sqlalchemy import create_engine, text
import os

# Use the same URL as the running service
DATABASE_URL = "postgresql://hospital_admin:secure_hospital_pass@localhost:5432/nurse_db"

engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        print("Connected to DB")
        # Check tables
        result = conn.execute(text("SELECT count(*) FROM nurse_stations"))
        print(f"Nurse Stations: {result.scalar()}")
        
        result = conn.execute(text("SELECT count(*) FROM rooms"))
        print(f"Rooms: {result.scalar()}")
        
        result = conn.execute(text("SELECT * FROM rooms LIMIT 5"))
        print("Rooms sample:", result.fetchall())

except Exception as e:
    print(f"Error: {e}")
