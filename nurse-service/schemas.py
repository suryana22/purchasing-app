# Pydantic Schemas for API Request/Response
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date


# --- NURSE STATION SCHEMAS ---
class NurseStationBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    location: Optional[str] = None
    is_active: bool = True


class NurseStationCreate(NurseStationBase):
    pass


class NurseStationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    is_active: Optional[bool] = None


class NurseStationResponse(NurseStationBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- ROOM SCHEMAS ---
class RoomBase(BaseModel):
    nurse_station_id: int
    room_number: str = Field(..., max_length=20)
    room_name: Optional[str] = None
    bed_number: Optional[str] = None
    bed_type: str = "Standard"
    bed_status: str = "Available"
    is_active: bool = True


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    nurse_station_id: Optional[int] = None
    room_number: Optional[str] = None
    room_name: Optional[str] = None
    bed_number: Optional[str] = None
    bed_type: Optional[str] = None
    bed_status: Optional[str] = None
    is_active: Optional[bool] = None


class RoomResponse(RoomBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class RoomWithStation(RoomResponse):
    nurse_station: Optional[NurseStationResponse] = None


# --- PATIENT SCHEMAS ---
class PatientBase(BaseModel):
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    medical_record_number: Optional[str] = None
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    diagnosis: Optional[str] = None
    doctor_in_charge: Optional[str] = None
    diet_info: Optional[str] = None
    admission_date: Optional[date] = None


class PatientCreate(PatientBase):
    room_id: Optional[int] = None


class PatientUpdate(BaseModel):
    room_id: Optional[int] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    medical_record_number: Optional[str] = None
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    diagnosis: Optional[str] = None
    doctor_in_charge: Optional[str] = None
    diet_info: Optional[str] = None
    admission_date: Optional[date] = None
    discharge_date: Optional[date] = None
    status: Optional[str] = None


class PatientResponse(PatientBase):
    id: int
    room_id: Optional[int]
    discharge_date: Optional[date]
    status: str
    qr_code_token: Optional[str]
    created_at: datetime
    title: Optional[str] = None
    full_name_with_title: Optional[str] = None

    class Config:
        from_attributes = True


class PatientWithRoom(PatientResponse):
    room: Optional[RoomResponse] = None


# --- DISCHARGE REQUEST SCHEMAS ---
class DischargeRequestBase(BaseModel):
    patient_id: int
    requested_by: Optional[str] = None
    reason: Optional[str] = None


class DischargeRequestCreate(DischargeRequestBase):
    pass


class DischargeRequestUpdate(BaseModel):
    status: Optional[str] = None
    approved_by: Optional[str] = None


class DischargeRequestResponse(DischargeRequestBase):
    id: int
    status: str
    approved_by: Optional[str]
    created_at: datetime
    approved_at: Optional[datetime]

    class Config:
        from_attributes = True


class DischargeRequestWithPatient(DischargeRequestResponse):
    patient: Optional[PatientResponse] = None


# --- ROOM TRANSFER REQUEST SCHEMAS ---
class RoomTransferRequestBase(BaseModel):
    patient_id: int
    current_room_number: str
    current_bed_number: str
    requested_by: str
    reason: Optional[str] = None


class RoomTransferRequestCreate(RoomTransferRequestBase):
    pass


class RoomTransferRequestResponse(RoomTransferRequestBase):
    id: int
    target_room_number: Optional[str] = None
    target_bed_number: Optional[str] = None
    request_date: datetime
    status: str
    patient_name: Optional[str] = None

    class Config:
        from_attributes = True


# --- LOG CALL SCHEMAS ---
class LogCallBase(BaseModel):
    room_id: int
    urgency_level: str = "medium"


class LogCallCreate(LogCallBase):
    pass


class LogCallResolve(BaseModel):
    responded_by: Optional[str] = None


class LogCallResponse(LogCallBase):
    id: int
    is_resolved: bool
    responded_by: Optional[str]
    created_at: datetime
    responded_at: Optional[datetime]

    class Config:
        from_attributes = True


class LogCallWithRoom(LogCallResponse):
    room: Optional[RoomResponse] = None


# --- COMBINED STATUS SCHEMAS (for Nurse Monitor) ---
class RoomStatus(BaseModel):
    id: int
    room_number: str
    room_name: Optional[str] = None
    bed_number: Optional[str] = None
    bed_type: str = "Standard"
    bed_status: str = "Available"
    is_occupied: bool = False
    
    # Patient info (if occupied)
    patient_id: Optional[int] = None
    patient_name: Optional[str] = None
    patient_title: Optional[str] = None
    birth_date: Optional[date] = None
    diagnosis: Optional[str] = None
    doctor_in_charge: Optional[str] = None
    diet_info: Optional[str] = None
    qr_code_token: Optional[str] = None
    medical_record_number: Optional[str] = None
    has_pending_discharge: bool = False
    has_pending_transfer: bool = False
    
    # Call info
    has_active_call: bool = False
    call_id: Optional[int] = None
    urgency_level: Optional[str] = None
    call_created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NurseStationStatus(BaseModel):
    station: NurseStationResponse
    rooms: List[RoomStatus] = []
    total_rooms: int = 0
    occupied_rooms: int = 0
    active_calls: int = 0


# --- DOCTOR SCHEMAS ---
class DoctorBase(BaseModel):
    doctor_code: str = Field(..., max_length=50)
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    specialization: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class DoctorCreate(DoctorBase):
    pass


class DoctorUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    specialization: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None


class DoctorResponse(DoctorBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    full_name: Optional[str] = None

    class Config:
        from_attributes = True
