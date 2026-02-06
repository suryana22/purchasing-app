import sys
import os

# Ensure we can import from current directory
sys.path.append(os.getcwd())

from config import DATABASE_URL
from models import Room, get_engine, get_session_local

def fix_room():
    engine = get_engine(DATABASE_URL)
    SessionLocal = get_session_local(engine)
    db = SessionLocal()
    try:
        room = db.query(Room).filter(Room.id == 3).first()
        if room:
            print(f"Room 302 Status Before: {room.bed_status}, Occupied: {room.is_occupied}")
            room.is_occupied = False
            room.bed_status = "Available"
            db.commit()
            print(f"Room 302 Status After: {room.bed_status}, Occupied: {room.is_occupied}")
        else:
            print("Room ID 3 not found")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_room()
