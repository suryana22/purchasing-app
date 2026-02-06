from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import httpx

from models import User, Role, SessionLocal, DATABASE_URL
from utils import verify_password, get_password_hash, create_access_token, decode_access_token

# FastAPI App
app = FastAPI(title="Authentication Service", version="1.0.0")

print(f"Auth Service connecting to: {DATABASE_URL}")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class PatientLogin(BaseModel):
    medical_record_number: str

class StaffLogin(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_info: dict
    permissions: List[str] = []

class TokenVerify(BaseModel):
    token: str

class StaffCreate(BaseModel):
    username: str
    password: str
    role: str
    name: str

class StaffUpdate(BaseModel):
    role: Optional[str] = None
    name: Optional[str] = None
    is_active: Optional[bool] = None

class PasswordReset(BaseModel):
    new_password: str

class StaffResponse(BaseModel):
    id: int
    username: str
    role: str
    name: str
    is_active: bool
    assigned_nurse_station: Optional[str] = None

    class Config:
        from_attributes = True

# Initialize default staff users
def initialize_staff():
    """Create default staff users if they don't exist"""
    db = SessionLocal()
    try:
        if db.query(Staff).count() == 0:
            # Using plain passwords for demo purposes
            # In production, use proper password hashing
            default_staff = [
                Staff(
                    username="administrator",
                    password="administrator",  # Plain password for demo
                    role="administrator",
                    name="System Administrator"
                ),
                Staff(
                    username="nurse1",
                    password="nurse123",  # Plain password for demo
                    role="nurse",
                    name="Nurse Anna",
                    assigned_nurse_station="NS 332"
                ),
                Staff(
                    username="kitchen1",
                    password="kitchen123",  # Plain password for demo
                    role="kitchen",
                    name="Chef Budi"
                ),
                Staff(
                    username="cleaning1",
                    password="clean123",  # Plain password for demo
                    role="cleaning",
                    name="Cleaner Citra"
                ),
            ]
            db.bulk_save_objects(default_staff)
            db.commit()
            print("✅ Default staff users created successfully!")
    except Exception as e:
        print(f"❌ Error initializing staff: {e}")
        db.rollback()
    finally:
        db.close()

# Initialize on startup
# initialize_staff() - Data seeding is now handled by user-management/reset script

# API Endpoints
@app.get("/")
async def root():
    return {"service": "Authentication Service", "status": "operational"}

@app.get("/patient-login", response_class=HTMLResponse)
async def serve_patient_login():
    return FileResponse("templates/patient-login.html")

@app.get("/staff-login", response_class=HTMLResponse)
async def serve_staff_login():
    return FileResponse("templates/staff-login.html")

@app.post("/login/staff", response_model=TokenResponse)
async def staff_login(credentials: StaffLogin):
    """Authenticate staff and return JWT token"""
    db = SessionLocal()
    try:
        # Find user
        user = db.query(User).filter(User.username == credentials.username).first()
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        # Check active status
        if not user.is_active:
             raise HTTPException(status_code=403, detail="Account is inactive")
        
        # Check password
        password_valid = False
        if credentials.password == user.password:
            password_valid = True
        elif verify_password(credentials.password, user.password):
            password_valid = True
            
        if not password_valid:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        # Get Role and Permissions
        role_name = "unknown"
        permissions_list = []
        
        if user.role_id:
            role = db.query(Role).filter(Role.id == user.role_id).first()
            if role:
                role_name = role.name
                # Extract permission names
                for perm in role.permissions:
                    permissions_list.append(perm.name)

        # Create JWT token
        token_data = {
            "sub": user.username,
            "role": role_name,
            "permissions": permissions_list,
            "name": user.name, 
            "user_type": "staff"
        }
        access_token = create_access_token(data=token_data)
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user_info={
                "id": user.id,
                "username": user.username,
                "role": role_name,
                "name": user.name,
                "is_active": user.is_active,
                "assigned_nurse_station": user.assigned_nurse_station
            },
            permissions=permissions_list
        )
    finally:
        db.close()

@app.post("/login/patient", response_model=TokenResponse)
async def patient_login(credentials: PatientLogin):
    """Authenticate patient via patient_service and return JWT token"""
    try:
        # Verify patient credentials with patient_service
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://patient_service:8004/auth/patient",
                json={"medical_record_number": credentials.medical_record_number},
                timeout=5.0
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid medical record number or patient not admitted")
            
            data = response.json()
            patient = data.get("patient")
            
            if not patient:
                raise HTTPException(status_code=401, detail="Patient data not found")
        
        # Create JWT token for patient
        token_data = {
            "sub": patient["medical_record_number"],
            "role": "patient",
            "name": patient["name"],
            "room_number": patient["room_number"],
            "user_type": "patient"
        }
        access_token = create_access_token(data=token_data)
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user_info={
                "id": patient["id"],
                "medical_record_number": patient["medical_record_number"],
                "name": patient["name"],
                "birth_date": patient.get("birth_date"),
                "room_number": patient["room_number"]
            }
        )
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail="Patient service unavailable")

class QRLogin(BaseModel):
    token: str

@app.post("/login/qr", response_model=TokenResponse)
async def qr_login(login: QRLogin):
    """Authenticate via QR code token and return JWT (JSON)"""
    try:
        # Verify QR token with patient_service
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://patient_service:8004/auth/qr",
                json={"token": login.token},
                timeout=5.0
            )
            
            if response.status_code == 403:
                raise HTTPException(status_code=403, detail="Patient has been discharged")

            if response.status_code != 200:
                 raise HTTPException(status_code=401, detail="Invalid QR code")
            
            data = response.json()
            patient = data.get("patient")
            
            if not patient:
                raise HTTPException(status_code=401, detail="Patient data not found")
        
        # Create JWT token for patient with 30-minute expiry
        from datetime import timedelta
        
        # Use bed_number if available (e.g. "301-A") over room_number ("301") 
        # to ensure unique identification on Nurse Monitor
        room_identifier = patient.get("bed_number") or patient["room_number"]
        
        token_data = {
            "sub": patient["medical_record_number"],
            "role": "patient",
            "name": patient["name"],
            "room_number": room_identifier,
            "user_type": "patient"
        }
        access_token = create_access_token(
            data=token_data, 
            expires_delta=timedelta(minutes=30)
        )
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user_info={
                "id": patient["id"],
                "medical_record_number": patient["medical_record_number"],
                "name": patient["name"],
                "birth_date": patient.get("birth_date"),
                "room_number": room_identifier
            }
        )
        
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail="Patient service unavailable")

@app.get("/magic-login")
async def magic_login(token: str):
    """Magic login via QR code token - validates and redirects with JWT"""
    try:
        # Verify QR token with patient_service
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://patient_service:8004/auth/qr",
                json={"token": token},
                timeout=5.0
            )
            
            if response.status_code == 403:
                # Patient exists but is discharged - Show Modal
                return HTMLResponse(
                    content="""
                    <html>
                        <head>
                            <title>Login Gagal</title>
                            <meta name="viewport" content="width=device-width, initial-scale=1">
                            <style>
                                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
                                .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; }
                                .modal-box { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); text-align: center; max-width: 90%; width: 400px; }
                                .icon { font-size: 48px; color: #ff9800; margin-bottom: 20px; }
                                h2 { color: #333; margin: 0 0 10px; font-size: 24px; }
                                p { color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 25px; }
                                .btn { background: #6200ea; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; cursor: pointer; text-decoration: none; display: inline-block; transition: background 0.2s; }
                                .btn:hover { background: #3700b3; }
                            </style>
                        </head>
                        <body>
                            <div class="modal-overlay">
                                <div class="modal-box">
                                    <div class="icon">⚠️</div>
                                    <h2>Tidak Dapat Login</h2>
                                    <p>Mohon Maaf.<br>Anda tidak dapat masuk karena status perawatan Anda sudah selesai.</p>
                                    <a href="/" class="btn">Kembali ke Beranda</a>
                                </div>
                            </div>
                        </body>
                    </html>
                    """,
                    status_code=403
                )

            if response.status_code != 200:
                # Redirect to patient login with error (Invalid Token)
                return HTMLResponse(
                    content="""
                    <html>
                        <head>
                            <meta http-equiv="refresh" content="3;url=/patient-login" />
                        </head>
                        <body style="font-family: Arial; text-align: center; padding: 50px;">
                            <h2>QR Code Invalid</h2>
                            <p>Kode tidak dikenali. Mengalihkan ke halaman login...</p>
                        </body>
                    </html>
                    """,
                    status_code=401
                )
            
            data = response.json()
            patient = data.get("patient")
            
            if not patient:
                raise HTTPException(status_code=401, detail="Patient data not found")
        
        # Create JWT token for patient with 30-minute expiry
        from datetime import timedelta
        import json
        import base64
        
        # Use bed_number if available for magic login too
        room_identifier = patient.get("bed_number") or patient["room_number"]
        
        token_data = {
            "sub": patient["medical_record_number"],
            "role": "patient",
            "name": patient["name"],
            "room_number": room_identifier,
            "user_type": "patient"
        }
        access_token = create_access_token(
            data=token_data, 
            expires_delta=timedelta(minutes=30)
        )
        
        # Prepare auth data for transfer
        auth_payload = {
            "token": access_token,
            "userRole": "patient",
            "user_info": {
                "id": patient["id"],
                "medical_record_number": patient["medical_record_number"],
                "name": patient["name"],
                "birth_date": patient.get("birth_date"),
                "room_number": room_identifier
            },
            "roomNumber": room_identifier
        }
        
        # Encode payload to base64
        json_str = json.dumps(auth_payload)
        b64_str = base64.b64encode(json_str.encode()).decode()
        
        # Redirect to customer portal via API Gateway with auth data in hash
        # This allows the frontend to read the data and set localStorage
        redirect_url = f"http://localhost:8000/customer#auth_data={b64_str}"
        
        return HTMLResponse(
            content=f"""
            <html>
                <head>
                    <meta http-equiv="refresh" content="0;url={redirect_url}" />
                </head>
                <body>
                    <script>window.location.href = "{redirect_url}";</script>
                </body>
            </html>
            """,
            status_code=200
        )

    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail="Patient service unavailable")


@app.post("/verify")
async def verify_token(token_data: TokenVerify):
    """Verify JWT token validity"""
    payload = decode_access_token(token_data.token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return {
        "valid": True,
        "payload": payload
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "auth_service"}

# Staff Management Endpoints
@app.get("/staff", response_model=List[StaffResponse])
async def get_all_staff():
    """Get all staff users (admin only)"""
    db = SessionLocal()
    try:
        staff_list = db.query(Staff).all()
        return [StaffResponse.from_orm(s) for s in staff_list]
    finally:
        db.close()

@app.post("/staff", response_model=StaffResponse)
async def create_staff(staff_data: StaffCreate):
    """Create new staff user (admin only)"""
    db = SessionLocal()
    try:
        # Check if username already exists
        existing = db.query(Staff).filter(Staff.username == staff_data.username).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already exists")
        
        # Validate role
        valid_roles = ["administrator", "nurse", "kitchen", "cleaning"]
        if staff_data.role not in valid_roles:
            raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")
        
        new_staff = Staff(
            username=staff_data.username,
            password=get_password_hash(staff_data.password), # Hash password
            role=staff_data.role,
            name=staff_data.name,
            is_active=True
        )
        db.add(new_staff)
        db.commit()
        db.refresh(new_staff)
        return StaffResponse.from_orm(new_staff)
    finally:
        db.close()

@app.put("/staff/{staff_id}", response_model=StaffResponse)
async def update_staff(staff_id: int, staff_data: StaffUpdate):
    """Update staff user (admin only)"""
    db = SessionLocal()
    try:
        staff = db.query(Staff).filter(Staff.id == staff_id).first()
        if not staff:
            raise HTTPException(status_code=404, detail="Staff not found")
        
        # Update fields if provided
        if staff_data.role is not None:
            valid_roles = ["administrator", "nurse", "kitchen", "cleaning"]
            if staff_data.role not in valid_roles:
                raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")
            staff.role = staff_data.role
        
        if staff_data.name is not None:
            staff.name = staff_data.name
            
        if staff_data.is_active is not None:
            staff.is_active = staff_data.is_active
        
        db.commit()
        db.refresh(staff)
        return StaffResponse.from_orm(staff)
    finally:
        db.close()

@app.delete("/staff/{staff_id}")
async def delete_staff(staff_id: int):
    """Soft Delete staff user (admin only)"""
    db = SessionLocal()
    try:
        staff = db.query(Staff).filter(Staff.id == staff_id).first()
        if not staff:
            raise HTTPException(status_code=404, detail="Staff not found")
        
        # Prevent deleting the last administrator
        if staff.role == "administrator":
            admin_count = db.query(Staff).filter(Staff.role == "administrator", Staff.is_active == True).count()
            if admin_count <= 1:
                raise HTTPException(status_code=400, detail="Cannot delete the last active administrator")
        
        # Soft delete
        staff.is_active = False
        db.commit()
        
        return {"success": True, "message": "Staff deactivated successfully"}
    finally:
        db.close()

@app.post("/staff/{staff_id}/reset-password")
async def reset_staff_password(staff_id: int, reset_data: PasswordReset):
    """Reset staff password"""
    db = SessionLocal()
    try:
        staff = db.query(Staff).filter(Staff.id == staff_id).first()
        if not staff:
            raise HTTPException(status_code=404, detail="Staff not found")
            
        staff.password = get_password_hash(reset_data.new_password)
        db.commit()
        
        return {"success": True, "message": "Password reset successfully"}
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
