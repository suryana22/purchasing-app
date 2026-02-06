from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import httpx
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
from schemas import (
    UserCreate, UserUpdate, UserResponse, UserListResponse, PasswordReset,
    RoleCreate, RoleUpdate, RoleResponse, RoleListResponse,
    PermissionCreate, PermissionResponse,
    DashboardStats, Token, LoginRequest
)


from config import DATABASE_URL, APP_NAME, APP_VERSION
from models import (
    Base, User, Role, Permission,
    get_engine, get_session_local, create_tables, init_default_data
)


# --- DATABASE SETUP ---
engine = get_engine(DATABASE_URL)
SessionLocal = get_session_local(engine)

# Create tables on startup
create_tables(engine)

# Initialize default data
db = SessionLocal()
try:
    init_default_data(db)
finally:
    db.close()

# Password hashing
pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")



# JWT Configuration
SECRET_KEY = "hospital_secure_secret_key_change_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


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
    description="User Management Service with RBAC"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# ROOT & HEALTH ENDPOINTS
# ==========================================

@app.get("/")
async def root():
    return {"service": APP_NAME, "version": APP_VERSION, "docs": "/docs"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "user_management"}


# ==========================================
# USER ENDPOINTS
# ==========================================

@app.get("/users", response_model=List[UserListResponse])
async def get_users(
    status: Optional[str] = None,  # "active" or "inactive"
    role: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all users with optional filters"""
    query = db.query(User)
    
    if status == "active":
        query = query.filter(User.is_active == True)
    elif status == "inactive":
        query = query.filter(User.is_active == False)
    
    if role:
        query = query.join(Role).filter(Role.name == role)
    
    users = query.order_by(User.first_name).all()
    
    result = []
    for user in users:
        result.append(UserListResponse(
            id=user.id,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            role_name=user.role_name,
            is_active=user.is_active,
            assigned_nurse_station=user.assigned_nurse_station
        ))
    
    return result


@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=user.id,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        role_id=user.role_id,
        role_name=user.role_name,
        is_active=user.is_active,
        assigned_nurse_station=user.assigned_nurse_station,
        created_at=user.created_at,
        last_login=user.last_login
    )


@app.post("/users", response_model=UserResponse)
async def create_user(data: UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    # Check if username already exists
    existing = db.query(User).filter(User.username == data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Hash password
    hashed_password = get_password_hash(data.password)
    
    # Auto-generate email if not provided
    email = data.email if data.email else f"{data.username}@mail.com"
    
    user = User(
        username=data.username,
        password=hashed_password,
        first_name=data.first_name,
        last_name=data.last_name,
        email=email,
        role_id=data.role_id,
        assigned_nurse_station=data.assigned_nurse_station,
        is_active=True
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        role_id=user.role_id,
        role_name=user.role_name,
        is_active=user.is_active,
        assigned_nurse_station=user.assigned_nurse_station,
        created_at=user.created_at,
        last_login=user.last_login
    )


@app.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db)):
    """Update user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    for key, value in data.dict(exclude_unset=True).items():
        setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        role_id=user.role_id,
        role_name=user.role_name,
        is_active=user.is_active,
        assigned_nurse_station=user.assigned_nurse_station,
        created_at=user.created_at,
        last_login=user.last_login
    )


@app.delete("/users/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Soft delete user (deactivate)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Soft delete
    user.is_active = False
    db.commit()
    
    return {"success": True, "message": "User deactivated successfully"}


@app.delete("/users/{user_id}/hard")
async def hard_delete_user(user_id: int, db: Session = Depends(get_db)):
    """
    Hard delete user (permanent removal).
    Intended for use by accounts with Administrator role only.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    
    return {"success": True, "message": "User permanently deleted"}


@app.post("/users/{user_id}/reset-password")
async def reset_password(user_id: int, data: PasswordReset, db: Session = Depends(get_db)):
    """Reset user password"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.password = get_password_hash(data.new_password)
    db.commit()
    
    return {"success": True, "message": "Password reset successfully"}


# ==========================================
# ROLE ENDPOINTS
# ==========================================

@app.get("/roles", response_model=List[RoleListResponse])
async def get_roles(active_only: bool = False, db: Session = Depends(get_db)):
    """Get all roles"""
    query = db.query(Role)
    
    if active_only:
        query = query.filter(Role.is_active == True)
    
    roles = query.order_by(Role.name).all()
    
    result = []
    for role in roles:
        user_count = db.query(User).filter(User.role_id == role.id).count()
        result.append(RoleListResponse(
            id=role.id,
            name=role.name,
            description=role.description,
            is_active=role.is_active,
            user_count=user_count
        ))
    
    return result


@app.get("/roles/{role_id}", response_model=RoleResponse)
async def get_role(role_id: int, db: Session = Depends(get_db)):
    """Get role by ID with permissions"""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role


@app.post("/roles", response_model=RoleResponse)
async def create_role(data: RoleCreate, db: Session = Depends(get_db)):
    """Create a new role"""
    # Check if role name already exists
    existing = db.query(Role).filter(Role.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Role name already exists")
    
    role = Role(
        name=data.name,
        description=data.description,
        is_active=True
    )
    
    # Assign permissions
    if data.permission_ids:
        permissions = db.query(Permission).filter(Permission.id.in_(data.permission_ids)).all()
        role.permissions = permissions
    
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@app.put("/roles/{role_id}", response_model=RoleResponse)
async def update_role(role_id: int, data: RoleUpdate, db: Session = Depends(get_db)):
    """Update role"""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if data.name is not None:
        role.name = data.name
    if data.description is not None:
        role.description = data.description
    if data.is_active is not None:
        role.is_active = data.is_active
    
    # Update permissions if provided
    if data.permission_ids is not None:
        permissions = db.query(Permission).filter(Permission.id.in_(data.permission_ids)).all()
        role.permissions = permissions
    
    db.commit()
    db.refresh(role)
    return role


@app.delete("/roles/{role_id}")
async def delete_role(role_id: int, db: Session = Depends(get_db)):
    """Delete role (only if no users assigned)"""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Check if users are assigned to this role
    user_count = db.query(User).filter(User.role_id == role_id).count()
    if user_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete role. {user_count} users are assigned to this role."
        )
    
    db.delete(role)
    db.commit()
    
    return {"success": True, "message": "Role deleted successfully"}


# ==========================================
# PERMISSION ENDPOINTS
# ==========================================

@app.get("/permissions", response_model=List[PermissionResponse])
async def get_permissions(db: Session = Depends(get_db)):
    """Get all permissions"""
    return db.query(Permission).order_by(Permission.resource, Permission.action).all()


# ==========================================
# DASHBOARD STATS ENDPOINT
# ==========================================

@app.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    # User stats
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    inactive_users = total_users - active_users
    
    # Room stats - fetch from nurse-service
    total_rooms = 0
    occupied_rooms = 0
    available_rooms = 0
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:8001/rooms/all", timeout=5.0)
            if response.status_code == 200:
                rooms = response.json()
                total_rooms = len(rooms)
                occupied_rooms = sum(1 for r in rooms if r.get("is_occupied", False))
                available_rooms = total_rooms - occupied_rooms
    except Exception as e:
        print(f"Warning: Could not fetch room stats: {e}")
    
    return DashboardStats(
        total_rooms=total_rooms,
        occupied_rooms=occupied_rooms,
        available_rooms=available_rooms,
        total_users=total_users,
        active_users=active_users,
        inactive_users=inactive_users
    )


# ==========================================
# AUTH ENDPOINTS
# ==========================================

@app.post("/login/staff", response_model=Token)
async def login_for_access_token(form_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Login endpoint for staff members.
    Returns a JWT access token if credentials are valid.
    """
    # 1. Authenticate user
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="User account is inactive")
        
    if not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    # 2. Setup token expiration
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # 3. Get user permissions
    permissions_list = []
    if user.role_obj and user.role_obj.permissions:
        permissions_list = [p.name for p in user.role_obj.permissions]
    
    # 4. Create token with user info
    access_token = create_access_token(
        data={
            "sub": user.username,
            "user_id": user.id,
            "role": user.role_name
        },
        expires_delta=access_token_expires
    )
    
    # 5. Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_info": {
            "id": user.id,
            "username": user.username,
            "name": f"{user.first_name} {user.last_name}",
            "role": user.role_name,
            "assigned_nurse_station": user.assigned_nurse_station
        },
        "permissions": permissions_list
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)
