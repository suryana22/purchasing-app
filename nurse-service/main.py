from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional, Dict
import os

from config import DATABASE_URL, APP_NAME, APP_VERSION
from models import (
    Base, NurseStation, Room, Patient, DischargeRequest, LogCall, RoomTransferRequest, Doctor,
    get_engine, get_session_local, create_tables
)
from schemas import (
    NurseStationCreate, NurseStationUpdate, NurseStationResponse,
    RoomCreate, RoomUpdate, RoomResponse, RoomWithStation,
    PatientCreate, PatientUpdate, PatientResponse, PatientWithRoom,
    DischargeRequestCreate, DischargeRequestUpdate, DischargeRequestResponse,
    LogCallCreate, LogCallResolve, LogCallResponse, LogCallWithRoom,
    RoomStatus, NurseStationStatus,
    RoomTransferRequestCreate, RoomTransferRequestResponse,
    DoctorCreate, DoctorUpdate, DoctorResponse
)


# --- DATABASE SETUP ---
engine = get_engine(DATABASE_URL)
SessionLocal = get_session_local(engine)

# Create tables on startup
create_tables(engine)


# --- DEPENDENCY ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- FASTAPI APP ---
app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="Smart Nurse Call System API - Designed for Kiosk Deployment"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Mount static files for sounds
if os.path.exists("sounds"):
    app.mount("/sounds", StaticFiles(directory="sounds"), name="sounds")


# ==========================================
# ROOT & LOGIN ENDPOINTS
# ==========================================

@app.get("/", response_class=JSONResponse)
async def root():
    return {"service": APP_NAME, "version": APP_VERSION, "docs": "/docs"}





@app.get("/api/status")
async def api_status():
    """API status endpoint"""
    return {
        "service": APP_NAME,
        "version": APP_VERSION,
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}



# ==========================================
# NURSE STATION ENDPOINTS
# ==========================================

@app.post("/nurse-stations", response_model=NurseStationResponse)
async def create_nurse_station(data: NurseStationCreate, db: Session = Depends(get_db)):
    """Create a new nurse station"""
    from sqlalchemy.exc import IntegrityError
    
    # Check for duplicate name first
    existing = db.query(NurseStation).filter(NurseStation.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Nurse station with name '{data.name}' already exists")
    
    try:
        station = NurseStation(**data.dict())
        db.add(station)
        db.commit()
        db.refresh(station)
        return station
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Nurse station with name '{data.name}' already exists")


@app.get("/nurse-stations", response_model=List[NurseStationResponse])
async def get_nurse_stations(active_only: bool = True, db: Session = Depends(get_db)):
    """Get all nurse stations"""
    query = db.query(NurseStation)
    if active_only:
        query = query.filter(NurseStation.is_active == True)
    return query.order_by(NurseStation.name).all()


@app.get("/nurse-stations/{station_id}", response_model=NurseStationResponse)
async def get_nurse_station(station_id: int, db: Session = Depends(get_db)):
    """Get nurse station by ID"""
    station = db.query(NurseStation).filter(NurseStation.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Nurse station not found")
    return station


@app.put("/nurse-stations/{station_id}", response_model=NurseStationResponse)
async def update_nurse_station(station_id: int, data: NurseStationUpdate, db: Session = Depends(get_db)):
    """Update nurse station"""
    station = db.query(NurseStation).filter(NurseStation.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Nurse station not found")
    
    for key, value in data.dict(exclude_unset=True).items():
        setattr(station, key, value)
    
    db.commit()
    db.refresh(station)
    return station


@app.delete("/nurse-stations/{station_id}")
async def delete_nurse_station(station_id: int, db: Session = Depends(get_db)):
    """Delete nurse station"""
    station = db.query(NurseStation).filter(NurseStation.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Nurse station not found")
    
    db.delete(station)
    db.commit()
    return {"success": True, "message": "Nurse station deleted"}


# ==========================================
# ROOM ENDPOINTS
# ==========================================

@app.post("/rooms", response_model=RoomResponse)
async def create_room(data: RoomCreate, db: Session = Depends(get_db)):
    """Create a new room"""
    # Verify nurse station exists
    station = db.query(NurseStation).filter(NurseStation.id == data.nurse_station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Nurse station not found")
    
    room = Room(**data.dict())
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


@app.get("/rooms", response_model=List[RoomResponse])
async def get_rooms(
    station_id: Optional[int] = None,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get all rooms, optionally filtered by station"""
    query = db.query(Room)
    
    if station_id:
        query = query.filter(Room.nurse_station_id == station_id)
    if active_only:
        query = query.filter(Room.is_active == True)
    
    return query.order_by(Room.room_number, Room.bed_number).all()


@app.get("/rooms/all")
async def get_all_rooms_simple(
    station: Optional[str] = None, 
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get all rooms in simple format (compatible with existing frontend)"""
    query = db.query(Room)
    
    if active_only:
        query = query.filter(Room.is_active == True)
    
    if station and station not in ['undefined', 'null']:
        # Filter by nurse station name
        query = query.join(NurseStation).filter(NurseStation.name == station)
    
    rooms = query.order_by(Room.room_number, Room.bed_number).all()
    
    # Get all active patients to determine occupancy details
    active_patients = db.query(Patient).filter(Patient.status.in_(["admitted", "booked"])).all()
    patient_map = {}
    for p in active_patients:
        patient_map[p.room_id] = p
    
    result = []
    for room in rooms:
        patient = patient_map.get(room.id)
        
        room_data = {
            "id": room.id,
            "nurse_station_id": room.nurse_station_id, # Added for edit functionality
            "room_number": room.room_number,
            "bed_number": room.bed_number or f"{room.room_number}-A",
            "room_name": room.room_name,
            "bed_type": room.bed_type,
            "bed_status": room.bed_status,
            "is_occupied": room.is_occupied or (patient is not None),
            "is_active": room.is_active
        }
        
        if patient:
            room_data["patient_id"] = patient.id
            room_data["patient_name"] = patient.full_name_with_title
            room_data["medical_record_number"] = patient.medical_record_number
            room_data["doctor_in_charge"] = patient.doctor_in_charge
            room_data["diagnosis"] = patient.diagnosis
            room_data["diet_info"] = patient.diet_info
            room_data["qr_code_token"] = patient.qr_code_token
             # Convert date to string if exists
            room_data["admission_date"] = patient.admission_date.isoformat() if patient.admission_date else None
        else:
            room_data["patient_id"] = None
            room_data["patient_name"] = None
            
        result.append(room_data)
    
    return result





@app.put("/rooms/{room_id}", response_model=RoomResponse)
async def update_room(room_id: int, data: RoomUpdate, db: Session = Depends(get_db)):
    """Update room details"""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Update fields
    for key, value in data.dict(exclude_unset=True).items():
        setattr(room, key, value)
        
    # Special Handling: If status changed to Available, ensure occupancy matches
    if data.bed_status == 'Available':
        # Also unlink any 'booked' patients (since we are freeing the room)
        booked_patients = db.query(Patient).filter(Patient.room_id == room_id, Patient.status == 'booked').all()
        for p in booked_patients:
            p.status = 'registered'
            p.room_id = None
        
        # If no admitted patient, set occupied false
        admitted = db.query(Patient).filter(Patient.room_id == room_id, Patient.status == 'admitted').first()
        if not admitted:
            room.is_occupied = False

    db.commit()
    db.refresh(room)
    return room


@app.get("/rooms/by-station/{station_name}")
async def get_rooms_by_station(station_name: str, db: Session = Depends(get_db)):
    """Get available rooms filtered by nurse station (compatible with gateway)"""
    # Get rooms for this nurse station
    rooms = db.query(Room).join(NurseStation).filter(
        NurseStation.name == station_name,
        Room.is_active == True
    ).all()
    
    # Filter only available rooms (not occupied)
    available_rooms = []
    
    for room in rooms:
        # Check if occupied (by is_occupied flag or patient presence)
        # Note: In a cleaner impl, is_occupied should correspond to existence of admitted patient
        is_occupied_db = room.is_occupied
        patient_exists = db.query(Patient).filter(
            Patient.room_id == room.id, 
            Patient.status == "admitted"
        ).first() is not None
        
        if not is_occupied_db and not patient_exists:
            bed_num = room.bed_number or f"{room.room_number}-A"
            # Format expected by frontend dropdowns
            available_rooms.append({
                "room_number": f"{room.room_number}-{bed_num}", # Combined identifier often used
                "bed_number": bed_num,
                "bed_type": room.bed_type,
                "display_text": f"Room {room.room_number} - Bed {bed_num} ({room.bed_type or 'Standard'})",
                "id": room.id # meaningful ID
            })
    
    return {"rooms": available_rooms}


@app.get("/rooms/{room_id}", response_model=RoomWithStation)
async def get_room(room_id: int, db: Session = Depends(get_db)):
    """Get room by ID"""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


@app.put("/rooms/{room_id}", response_model=RoomResponse)
async def update_room(room_id: int, data: RoomUpdate, db: Session = Depends(get_db)):
    """Update room"""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    for key, value in data.dict(exclude_unset=True).items():
        setattr(room, key, value)
    
    db.commit()
    db.refresh(room)
    return room


@app.delete("/rooms/{room_id}")
async def delete_room(room_id: int, db: Session = Depends(get_db)):
    """Delete room"""
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Soft delete
    room.is_active = False
    
    # Also release any assigned patients (optional, depending on business logic)
    # For now, we keep patients assigned but maybe they should be discharged?
    # Let's just mark room as inactive.
    
    db.commit()
    return {"success": True, "message": "Room deleted (soft delete)"}


# ==========================================
# PATIENT ENDPOINTS
# ==========================================

@app.post("/patients", response_model=PatientResponse)
async def create_patient(data: PatientCreate, db: Session = Depends(get_db)):
    """Create a new patient"""
    import uuid
    
    patient = Patient(**data.dict())
    patient.qr_code_token = str(uuid.uuid4())[:8].upper()
    patient.status = "admitted"
    
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@app.get("/patients", response_model=List[PatientResponse])
async def get_patients(
    status: Optional[str] = None,
    room_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get all patients"""
    query = db.query(Patient)
    
    if status:
        query = query.filter(Patient.status == status)
    if room_id:
        query = query.filter(Patient.room_id == room_id)
    
    return query.order_by(Patient.first_name).all()


@app.get("/patients/booked")
async def get_booked_patients_list(db: Session = Depends(get_db)):
    """Get all booked patients (waiting for admission)"""
    patients = db.query(Patient).filter(Patient.status == "booked").all()
    return patients


@app.get("/patients/admitted")
async def get_admitted_patients(db: Session = Depends(get_db)):
    """Get all admitted patients with room info (compatible with existing frontend)"""
    patients = db.query(Patient).filter(Patient.status == "admitted").all()
    
    result = []
    for p in patients:
        room = p.room
        result.append({
            "id": p.id,
            "name": p.full_name_with_title,
            "first_name": p.first_name,
            "last_name": p.last_name,
            "room_number": room.room_number if room else None,
            "bed_number": room.bed_number if room else None,
            "birth_date": p.birth_date.isoformat() if p.birth_date else None,
            "diagnosis": p.diagnosis,
            "doctor_in_charge": p.doctor_in_charge,
            "diet_info": p.diet_info,
            "qr_code_token": p.qr_code_token,
            "medical_record_number": p.medical_record_number
        })
    
    return result


@app.get("/patients/{patient_id}", response_model=PatientWithRoom)
async def get_patient(patient_id: int, db: Session = Depends(get_db)):
    """Get patient by ID"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@app.put("/patients/{patient_id}", response_model=PatientResponse)
async def update_patient(patient_id: int, data: PatientUpdate, db: Session = Depends(get_db)):
    """Update patient"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    for key, value in data.dict(exclude_unset=True).items():
        setattr(patient, key, value)
    
    db.commit()
    db.refresh(patient)
    return patient


@app.delete("/patients/{patient_id}")
async def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    """Delete patient"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    db.delete(patient)
    db.commit()
    return {"success": True, "message": "Patient deleted"}


# ==========================================
# DISCHARGE REQUEST ENDPOINTS
# ==========================================

@app.post("/discharge-requests", response_model=DischargeRequestResponse)
async def create_discharge_request(data: DischargeRequestCreate, db: Session = Depends(get_db)):
    """Create a new discharge request"""
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    request = DischargeRequest(**data.dict())
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


@app.get("/discharge-requests", response_model=List[DischargeRequestResponse])
async def get_discharge_requests(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all discharge requests"""
    query = db.query(DischargeRequest)
    
    if status:
        query = query.filter(DischargeRequest.status == status)
    
    return query.order_by(DischargeRequest.created_at.desc()).all()


@app.put("/discharge-requests/{request_id}/approve")
async def approve_discharge_request(
    request_id: int,
    data: DischargeRequestUpdate,
    db: Session = Depends(get_db)
):
    """Approve a discharge request"""
    request = db.query(DischargeRequest).filter(DischargeRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Discharge request not found")
    
    request.status = "approved"
    request.approved_by = data.approved_by
    request.approved_at = datetime.utcnow()
    
    # Update patient status
    # Update patient status
    patient = db.query(Patient).filter(Patient.id == request.patient_id).first()
    if patient:
        # Get room to release it
        room_id = patient.room_id
        
        patient.status = "discharged"
        patient.discharge_date = datetime.utcnow().date()
        patient.room_id = None  # Release room link
        
        # Reset Room Status
        if room_id:
            room = db.query(Room).filter(Room.id == room_id).first()
            if room:
                room.is_occupied = False
                room.bed_status = "Available"
    
    db.commit()
    return {"success": True, "message": "Discharge request approved"}


@app.put("/discharge-requests/{request_id}/reject")
async def reject_discharge_request(
    request_id: int,
    data: DischargeRequestUpdate,
    db: Session = Depends(get_db)
):
    """Reject a discharge request"""
    request = db.query(DischargeRequest).filter(DischargeRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Discharge request not found")
    
    request.status = "rejected"
    request.approved_by = data.approved_by
    request.approved_at = datetime.utcnow()
    
    db.commit()
    return {"success": True, "message": "Discharge request rejected"}


# ==========================================
# ROOM TRANSFER REQUEST ENDPOINTS
# ==========================================

@app.post("/room-transfer-requests", response_model=RoomTransferRequestResponse)
async def create_room_transfer_request(data: RoomTransferRequestCreate, db: Session = Depends(get_db)):
    """Create a new room transfer request"""
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    request = RoomTransferRequest(**data.dict())
    db.add(request)
    db.commit()
    db.refresh(request)
    
    # Inject patient name for response
    response_data = request.__dict__
    response_data["patient_name"] = patient.full_name_with_title
    return response_data


@app.get("/room-transfer-requests", response_model=List[RoomTransferRequestResponse])
async def get_room_transfer_requests(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all room transfer requests"""
    query = db.query(RoomTransferRequest)
    
    if status:
        query = query.filter(RoomTransferRequest.status == status)
    
    requests = query.order_by(RoomTransferRequest.request_date.desc()).all()
    
    # Enrich with patient names
    results = []
    if requests:
        # Batch fetch patients
        patient_ids = [r.patient_id for r in requests]
        patients = db.query(Patient).filter(Patient.id.in_(patient_ids)).all()
        patient_map = {p.id: p.full_name_with_title for p in patients}
        
        for req in requests:
            req_data = {
                "id": req.id,
                "patient_id": req.patient_id,
                "current_room_number": req.current_room_number,
                "current_bed_number": req.current_bed_number,
                "target_room_number": req.target_room_number,
                "target_bed_number": req.target_bed_number,
                "requested_by": req.requested_by,
                "request_date": req.request_date,
                "status": req.status,
                "reason": req.reason,
                "patient_name": patient_map.get(req.patient_id, "Unknown")
            }
            results.append(req_data)
            
    return results


@app.post("/room-transfer-requests/{request_id}/approve")
async def approve_room_transfer_request(
    request_id: int,
    data: Dict = None, # Expecting body with target room/bed if needed, or update logic
    db: Session = Depends(get_db)
):
    """Approve a room transfer request"""
    # Note: data might contain target_room_number and target_bed_number
    request = db.query(RoomTransferRequest).filter(RoomTransferRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Transfer request not found")
        
    request.status = "approved"
    
    # If target room data came in body, verify and update
    # For now, we assume frontend logic sends details or handles flow.
    # We update patient room assignment here.
    
    # In a full impl, we'd release old room and occupy new room
    
    db.commit()
    return {"success": True, "message": "Transfer request approved"}


@app.post("/room-transfer-requests/{request_id}/reject")
async def reject_room_transfer_request(
    request_id: int,
    db: Session = Depends(get_db)
):
    """Reject a room transfer request"""
    request = db.query(RoomTransferRequest).filter(RoomTransferRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Transfer request not found")
        
    request.status = "rejected"
    db.commit()
    return {"success": True, "message": "Transfer request rejected"}


# ==========================================
# LOG CALL ENDPOINTS (Emergency Calls)
# ==========================================

@app.post("/calls", response_model=LogCallResponse)
async def create_call(data: LogCallCreate, db: Session = Depends(get_db)):
    """Create a new emergency call"""
    # Verify room exists
    room = db.query(Room).filter(Room.id == data.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    call = LogCall(**data.dict())
    db.add(call)
    db.commit()
    db.refresh(call)
    
    # Broadcast to WebSocket
    room_key = f"{room.room_number}-{room.bed_number}" if room.bed_number else room.room_number
    await manager.broadcast({
        "type": "new_call",
        "call_id": call.id,
        "room_id": room.id,
        "room_number": room_key,
        "urgency_level": call.urgency_level
    }, room_key, sender=None)
    
    return call


@app.get("/calls", response_model=List[LogCallResponse])
async def get_calls(active_only: bool = True, db: Session = Depends(get_db)):
    """Get all calls (default: active only)"""
    query = db.query(LogCall)
    
    if active_only:
        query = query.filter(LogCall.is_resolved == False)
    
    return query.order_by(LogCall.created_at.desc()).all()


@app.post("/calls/{call_id}/resolve")
async def resolve_call(call_id: int, data: LogCallResolve = None, db: Session = Depends(get_db)):
    """Mark a call as resolved"""
    call = db.query(LogCall).filter(LogCall.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    call.is_resolved = True
    call.responded_at = datetime.utcnow()
    if data and data.responded_by:
        call.responded_by = data.responded_by
    
    db.commit()
    
    # Broadcast call ended
    room = db.query(Room).filter(Room.id == call.room_id).first()
    if room:
        room_key = f"{room.room_number}-{room.bed_number}" if room.bed_number else room.room_number
        await manager.broadcast({"type": "call_ended", "call_id": call_id}, room_key, sender=None)
    
    return {"success": True, "message": "Call resolved successfully", "call_id": call_id}


# ==========================================
# NURSE MONITOR DASHBOARD (Compatible Endpoint)
# ==========================================

@app.get("/rooms-with-calls", response_model=List[RoomStatus])
async def get_rooms_with_calls(station: Optional[str] = None, db: Session = Depends(get_db)):
    """Get rooms with call status for nurse monitor"""
    query = db.query(Room).filter(Room.is_active == True)
    
    if station and station not in ['undefined', 'null']:
        query = query.join(NurseStation).filter(NurseStation.name == station)
    
    rooms = query.order_by(Room.room_number, Room.bed_number).all()
    
    # Pre-fetch pending requests MAP
    all_discharges = db.query(DischargeRequest).all()
    all_transfers = db.query(RoomTransferRequest).all()
    
    pending_discharge_map = {
        r.patient_id: True 
        for r in all_discharges 
        if r.status and r.status.lower().strip() == 'pending'
    }
    
    pending_transfer_map = {
        r.patient_id: True 
        for r in all_transfers 
        if r.status and r.status.lower().strip() == 'pending'
    }
    
    result = []
    for room in rooms:
        # Get active call for this room
        active_call = db.query(LogCall).filter(
            LogCall.room_id == room.id,
            LogCall.is_resolved == False
        ).first()
        
        # Get current patient
        patient = db.query(Patient).filter(
            Patient.room_id == room.id,
            Patient.status == "admitted"
        ).first()
        
        bed_display = f"{room.room_number}-{room.bed_number}" if room.bed_number else room.room_number
        
        room_status = RoomStatus(
            id=room.id,
            room_number=room.room_number,
            room_name=room.room_name,
            bed_number=bed_display,
            bed_type=room.bed_type,
            bed_status=room.bed_status,
            is_occupied=patient is not None,
            has_active_call=active_call is not None,
            call_id=active_call.id if active_call else None,
            urgency_level=active_call.urgency_level if active_call else None,
            call_created_at=active_call.created_at if active_call else None,
            has_pending_discharge=patient.id in pending_discharge_map if patient else False,
            has_pending_transfer=patient.id in pending_transfer_map if patient else False
        )
        
        if patient:
            room_status.patient_id = patient.id
            room_status.patient_name = patient.full_name_with_title
            room_status.patient_title = patient.title
            room_status.birth_date = patient.birth_date
            room_status.diagnosis = patient.diagnosis
            room_status.doctor_in_charge = patient.doctor_in_charge
            room_status.diet_info = patient.diet_info
            room_status.qr_code_token = patient.qr_code_token
            room_status.medical_record_number = patient.medical_record_number
        
        result.append(room_status)
    
    return result


@app.get("/station-status/{station_id}", response_model=NurseStationStatus)
async def get_station_status(station_id: int, db: Session = Depends(get_db)):
    """Get complete status for a nurse station"""
    station = db.query(NurseStation).filter(NurseStation.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Nurse station not found")
    
    rooms = db.query(Room).filter(
        Room.nurse_station_id == station_id,
        Room.is_active == True
    ).all()
    
    room_statuses = []
    occupied_count = 0
    active_calls_count = 0
    
    for room in rooms:
        active_call = db.query(LogCall).filter(
            LogCall.room_id == room.id,
            LogCall.is_resolved == False
        ).first()
        
        patient = db.query(Patient).filter(
            Patient.room_id == room.id,
            Patient.status == "admitted"
        ).first()
        
        if patient:
            occupied_count += 1
        if active_call:
            active_calls_count += 1
        
        bed_display = f"{room.room_number}-{room.bed_number}" if room.bed_number else room.room_number
        
        room_status = RoomStatus(
            id=room.id,
            room_number=room.room_number,
            bed_number=bed_display,
            bed_type=room.bed_type,
            bed_status=room.bed_status,
            is_occupied=patient is not None,
            has_active_call=active_call is not None,
            call_id=active_call.id if active_call else None,
            urgency_level=active_call.urgency_level if active_call else None,
            call_created_at=active_call.created_at if active_call else None
        )
        
        if patient:
            room_status.patient_id = patient.id
            room_status.patient_name = patient.full_name_with_title
            room_status.patient_title = patient.title
            room_status.birth_date = patient.birth_date
            room_status.diagnosis = patient.diagnosis
            room_status.doctor_in_charge = patient.doctor_in_charge
            room_status.diet_info = patient.diet_info
            room_status.qr_code_token = patient.qr_code_token
            room_status.medical_record_number = patient.medical_record_number
        
        room_statuses.append(room_status)
    
    return NurseStationStatus(
        station=station,
        rooms=room_statuses,
        total_rooms=len(rooms),
        occupied_rooms=occupied_count,
        active_calls=active_calls_count
    )


# ==========================================
# NURSE MONITOR HTML PAGE
# ==========================================






# ==========================================
# WEBSOCKET FOR REALTIME COMMUNICATION
# ==========================================

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_number: str):
        await websocket.accept()
        if room_number not in self.active_connections:
            self.active_connections[room_number] = []
        self.active_connections[room_number].append(websocket)
        print(f"WebSocket connected to room {room_number}. Active: {len(self.active_connections[room_number])}")

    def disconnect(self, websocket: WebSocket, room_number: str):
        if room_number in self.active_connections:
            if websocket in self.active_connections[room_number]:
                self.active_connections[room_number].remove(websocket)
            if not self.active_connections[room_number]:
                del self.active_connections[room_number]
        print(f"WebSocket disconnected from room {room_number}")

    async def broadcast(self, message: dict, room_number: str, sender: WebSocket):
        if room_number in self.active_connections:
            for connection in self.active_connections[room_number]:
                if connection != sender:
                    try:
                        await connection.send_json(message)
                    except Exception as e:
                        print(f"Error broadcasting: {e}")


manager = ConnectionManager()


@app.websocket("/ws/{room_number}")
async def websocket_endpoint(websocket: WebSocket, room_number: str):
    await manager.connect(websocket, room_number)
    try:
        while True:
            data = await websocket.receive_json()
            await manager.broadcast(data, room_number, websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_number)
    except Exception as e:
        print(f"WebSocket Error: {e}")
        manager.disconnect(websocket, room_number)


# ==========================================
# IOT INTEGRATION ENDPOINT
# ==========================================

@app.post("/iot/call")
async def iot_trigger_call(
    room_number: str,
    bed_number: Optional[str] = None,
    urgency_level: str = "medium",
    db: Session = Depends(get_db)
):
    """
    Endpoint for IoT device (ESP32) to trigger emergency call.
    This is called when patient presses the call button on the hardware device.
    """
    # Find room by number
    query = db.query(Room).filter(Room.room_number == room_number)
    if bed_number:
        query = query.filter(Room.bed_number == bed_number)
    
    room = query.first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Create call log
    call = LogCall(room_id=room.id, urgency_level=urgency_level)
    db.add(call)
    db.commit()
    db.refresh(call)
    
    # Broadcast to WebSocket
    room_key = f"{room.room_number}-{room.bed_number}" if room.bed_number else room.room_number
    await manager.broadcast({
        "type": "new_call",
        "call_id": call.id,
        "room_id": room.id,
        "room_number": room_key,
        "urgency_level": urgency_level,
        "source": "iot_device"
    }, room_key, sender=None)
    
    return {
        "success": True,
        "call_id": call.id,
        "message": f"Emergency call triggered for room {room_key}"
    }


@app.post("/iot/reset")
async def iot_reset_call(
    room_number: str,
    bed_number: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Endpoint for IoT device (ESP32) to reset/resolve call.
    This is called when nurse presses the reset button on the hardware device.
    """
    # Find room
    query = db.query(Room).filter(Room.room_number == room_number)
    if bed_number:
        query = query.filter(Room.bed_number == bed_number)
    
    room = query.first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Find active call
    call = db.query(LogCall).filter(
        LogCall.room_id == room.id,
        LogCall.is_resolved == False
    ).first()
    
    if not call:
        return {"success": False, "message": "No active call to reset"}
    
    # Resolve call
    call.is_resolved = True
    call.responded_at = datetime.utcnow()
    call.responded_by = "IoT Device Reset"
    db.commit()
    
    # Broadcast
    room_key = f"{room.room_number}-{room.bed_number}" if room.bed_number else room.room_number
    await manager.broadcast({
        "type": "call_ended",
        "call_id": call.id,
        "source": "iot_device"
    }, room_key, sender=None)
    
    return {"success": True, "call_id": call.id, "message": "Call resolved via IoT device"}

# ==========================================
# DOCTOR MANAGEMENT ENDPOINTS
# ==========================================

@app.get("/doctors", response_model=List[DoctorResponse])
async def get_doctors(active_only: bool = False, db: Session = Depends(get_db)):
    """Get all doctors"""
    query = db.query(Doctor)
    
    if active_only:
        query = query.filter(Doctor.is_active == True)
    
    doctors = query.order_by(Doctor.last_name, Doctor.first_name).all()
    
    # Add full_name to each doctor
    result = []
    for doctor in doctors:
        doc_dict = {
            "id": doctor.id,
            "doctor_code": doctor.doctor_code,
            "first_name": doctor.first_name,
            "last_name": doctor.last_name,
            "specialization": doctor.specialization,
            "phone": doctor.phone,
            "email": doctor.email,
            "is_active": doctor.is_active,
            "created_at": doctor.created_at,
            "updated_at": doctor.updated_at,
            "full_name": doctor.full_name
        }
        result.append(doc_dict)
    
    return result


@app.get("/doctors/{doctor_id}", response_model=DoctorResponse)
async def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    """Get doctor by ID"""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor


@app.post("/doctors", response_model=DoctorResponse)
async def create_doctor(data: DoctorCreate, db: Session = Depends(get_db)):
    """Create a new doctor"""
    # Check if doctor code already exists
    existing = db.query(Doctor).filter(Doctor.doctor_code == data.doctor_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Doctor code already exists")
    
    doctor = Doctor(
        doctor_code=data.doctor_code,
        first_name=data.first_name,
        last_name=data.last_name,
        name=f"{data.first_name} {data.last_name}",  # Populate legacy field
        specialization=data.specialization,
        phone=data.phone,
        email=data.email,
        is_active=True
    )
    
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


@app.put("/doctors/{doctor_id}", response_model=DoctorResponse)
async def update_doctor(doctor_id: int, data: DoctorUpdate, db: Session = Depends(get_db)):
    """Update doctor"""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Update fields
    for key, value in data.dict(exclude_unset=True).items():
        setattr(doctor, key, value)
    
    # Update legacy name field if first_name or last_name changed
    if data.first_name or data.last_name:
        doctor.name = f"{doctor.first_name} {doctor.last_name}"
    
    db.commit()
    db.refresh(doctor)
    return doctor


@app.delete("/doctors/{doctor_id}")
async def delete_doctor(doctor_id: int, db: Session = Depends(get_db)):
    """Soft delete doctor (deactivate)"""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Soft delete
    doctor.is_active = False
    db.commit()
    
    return {"success": True, "message": "Doctor deactivated successfully"}
