from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ===== Permission Schemas =====
class PermissionBase(BaseModel):
    name: str
    resource: str
    action: str
    description: Optional[str] = None


class PermissionCreate(PermissionBase):
    pass


class PermissionResponse(PermissionBase):
    id: int
    
    class Config:
        from_attributes = True


# ===== Role Schemas =====
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None


class RoleCreate(RoleBase):
    permission_ids: Optional[List[int]] = []


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    permission_ids: Optional[List[int]] = None


class RoleResponse(RoleBase):
    id: int
    is_active: bool
    created_at: datetime
    permissions: List[PermissionResponse] = []
    
    class Config:
        from_attributes = True


class RoleListResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_active: bool
    user_count: int = 0
    
    class Config:
        from_attributes = True


# ===== User Schemas =====
class UserBase(BaseModel):
    username: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    assigned_nurse_station: Optional[str] = None


class UserCreate(UserBase):
    password: str
    role_id: Optional[int] = None


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None
    assigned_nurse_station: Optional[str] = None


class PasswordReset(BaseModel):
    new_password: str


class UserResponse(UserBase):
    id: int
    role_id: Optional[int] = None
    role_name: Optional[str] = None
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    id: int
    username: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    role_name: Optional[str] = None
    is_active: bool
    assigned_nurse_station: Optional[str] = None
    
    class Config:
        from_attributes = True


# ===== Dashboard Stats Schema =====
class DashboardStats(BaseModel):
    total_rooms: int = 0
    occupied_rooms: int = 0
    available_rooms: int = 0
    total_users: int = 0
    active_users: int = 0
    inactive_users: int = 0


# ===== Auth Schemas =====
class Token(BaseModel):
    access_token: str
    token_type: str
    user_info: Optional[dict] = None
    permissions: Optional[List[str]] = []

class LoginRequest(BaseModel):
    username: str
    password: str
