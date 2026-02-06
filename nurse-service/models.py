# SQLAlchemy Models for Nurse Call System
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Date, 
    Text, ForeignKey, Enum, create_engine
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from datetime import datetime
import enum

Base = declarative_base()


# --- ENUMS ---
class BedType(str, enum.Enum):
    STANDARD = "Standard"
    VIP = "VIP"
    VVIP = "VVIP"
    ICU = "ICU"
    NICU = "NICU"
    ISOLASI = "Isolasi"


class BedStatus(str, enum.Enum):
    AVAILABLE = "Available"
    OCCUPIED = "Occupied"
    MAINTENANCE = "Maintenance"
    RESERVED = "Reserved"


class UrgencyLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class PatientStatus(str, enum.Enum):
    ADMITTED = "admitted"
    DISCHARGED = "discharged"
    TRANSFERRED = "transferred"
    BOOKED = "booked"


class DischargeStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"


class MaritalStatus(str, enum.Enum):
    SINGLE = "single"
    MARRIED = "married"


# --- MODELS ---
class NurseStation(Base):
    """Tabel nurse_stations - Pos perawat/nurse station"""
    __tablename__ = "nurse_stations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    rooms = relationship("Room", back_populates="nurse_station", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<NurseStation(id={self.id}, name='{self.name}')>"


class Room(Base):
    """Tabel rooms - Kamar/bed pasien"""
    __tablename__ = "rooms"
    
    id = Column(Integer, primary_key=True, index=True)
    nurse_station_id = Column(Integer, ForeignKey("nurse_stations.id"), nullable=False)
    room_number = Column(String(20), nullable=False)
    room_name = Column(String(100), nullable=True)
    bed_number = Column(String(20), nullable=True)
    bed_type = Column(String(50), default="Standard")
    bed_status = Column(String(50), default="Available")
    is_occupied = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    nurse_station = relationship("NurseStation", back_populates="rooms")
    patients = relationship("Patient", back_populates="room", cascade="all, delete-orphan")
    log_calls = relationship("LogCall", back_populates="room", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Room(id={self.id}, room_number='{self.room_number}', bed='{self.bed_number}')>"


class Patient(Base):
    """Tabel patients - Data pasien"""
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    medical_record_number = Column(String(50), nullable=True, unique=True)
    birth_date = Column(Date, nullable=True)
    gender = Column(String(10), nullable=True)
    marital_status = Column(String(20), nullable=True)
    diagnosis = Column(Text, nullable=True)
    doctor_in_charge = Column(String(200), nullable=True)
    diet_info = Column(String(255), nullable=True)
    admission_date = Column(Date, nullable=True)
    discharge_date = Column(Date, nullable=True)
    status = Column(String(20), default="admitted")
    qr_code_token = Column(String(100), nullable=True, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    room = relationship("Room", back_populates="patients")
    discharge_requests = relationship("DischargeRequest", back_populates="patient", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Patient(id={self.id}, name='{self.first_name} {self.last_name}', mrn='{self.medical_record_number}')>"
    
    @property
    def title(self):
        """Generate title (An., Tn., Nn., Ny.) based on age, gender, marital status
        
        Rules:
        - Under 16 years old, any gender → An.
        - 16+ years old, male → Tn.
        - 16+ years old, female, single → Nn.
        - 16+ years old, female, married → Ny.
        """
        if not self.birth_date:
            return ""
        
        from datetime import date
        today = date.today()
        age = today.year - self.birth_date.year - ((today.month, today.day) < (self.birth_date.month, self.birth_date.day))
        
        # Anak-anak (< 16 tahun) - An. for all genders
        if age < 16:
            return "An."
        
        # Dewasa (>= 16 tahun)
        if self.gender == "male":
            return "Tn."
        elif self.gender == "female":
            if self.marital_status == "married":
                return "Ny."
            else:
                return "Nn."
        
        return ""
    
    @property
    def full_name_with_title(self):
        """Get full name with title prefix"""
        title = self.title
        full_name = f"{self.first_name} {self.last_name}"
        if title:
            return f"{title} {full_name}"
        return full_name


class DischargeRequest(Base):
    """Tabel discharge_requests - Permintaan pulang pasien"""
    __tablename__ = "discharge_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    requested_by = Column(String(200), nullable=True)
    reason = Column(Text, nullable=True)
    status = Column(String(20), default="pending")
    approved_by = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)
    
    # Relationships
    patient = relationship("Patient", back_populates="discharge_requests")
    
    def __repr__(self):
        return f"<DischargeRequest(id={self.id}, patient_id={self.patient_id}, status='{self.status}')>"


class LogCall(Base):
    """Tabel log_calls - Log panggilan darurat"""
    __tablename__ = "log_calls"
    
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    urgency_level = Column(String(20), default="medium")
    is_resolved = Column(Boolean, default=False)
    responded_by = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    responded_at = Column(DateTime, nullable=True)
    
    # Relationships
    room = relationship("Room", back_populates="log_calls")
    
    def __repr__(self):
        return f"<LogCall(id={self.id}, room_id={self.room_id}, urgency='{self.urgency_level}')>"



class RoomTransferRequest(Base):
    """Tabel room_transfer_requests - Permintaan pindah kamar"""
    __tablename__ = "room_transfer_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, nullable=False) # Helper reference to patient service ID
    current_room_number = Column(String(50), nullable=False)
    current_bed_number = Column(String(50), nullable=False)
    target_room_number = Column(String(50), nullable=True)  # Set on approval
    target_bed_number = Column(String(50), nullable=True)   # Set on approval
    requested_by = Column(String(200), nullable=False)       # nurse username
    request_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="pending")          # 'pending', 'approved', 'rejected'
    reason = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<RoomTransferRequest(id={self.id}, patient_id={self.patient_id}, status='{self.status}')>"


class Doctor(Base):
    """Tabel doctors - Data dokter penanggung jawab"""
    __tablename__ = "doctors"
    
    id = Column(Integer, primary_key=True, index=True)
    doctor_code = Column(String(50), nullable=False, unique=True)  # Kode dokter (SIP/STR)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    name = Column(String(200), nullable=True)  # Deprecated, kept for backwards compatibility
    specialization = Column(String(100), nullable=True)  # Spesialisasi
    phone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @property
    def full_name(self):
        """Get full name from first_name and last_name"""
        return f"{self.first_name} {self.last_name}"
    
    def __repr__(self):
        return f"<Doctor(id={self.id}, name='{self.full_name}', specialization='{self.specialization}')>"


# --- DATABASE SESSION FACTORY ---
def get_engine(database_url: str):
    """Create SQLAlchemy engine"""
    return create_engine(database_url)


def get_session_local(engine):
    """Create session factory"""
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)


def create_tables(engine):
    """Create all tables"""
    Base.metadata.create_all(bind=engine)
