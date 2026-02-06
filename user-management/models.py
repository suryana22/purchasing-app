from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey, Table, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

from config import DATABASE_URL

# Database setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Association table for Role-Permission many-to-many
role_permissions = Table(
    'role_permissions',
    Base.metadata,
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.id'), primary_key=True)
)


class Permission(Base):
    """Permission model for RBAC"""
    __tablename__ = "permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)  # e.g. "users.create"
    resource = Column(String(50), nullable=False)  # e.g. "users"
    action = Column(String(50), nullable=False)  # e.g. "create", "read", "update", "delete"
    description = Column(String(255), nullable=True)
    
    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")


class Role(Base):
    """Role model for RBAC"""
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)  # e.g. "administrator", "nurse"
    description = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")
    users = relationship("User", back_populates="role_obj")


class User(Base):
    """User model - extends the existing staff concept"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)  # Hashed password
    email = Column(String(100), unique=True, nullable=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role_id = Column(Integer, ForeignKey('roles.id'), nullable=True)
    is_active = Column(Boolean, default=True)
    assigned_nurse_station = Column(String(100), nullable=True)  # e.g. "NS 332"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    role_obj = relationship("Role", back_populates="users")
    
    @property
    def role_name(self):
        return self.role_obj.name if self.role_obj else None


def get_engine(database_url: str):
    return create_engine(database_url)


def get_session_local(engine):
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)


def create_tables(engine):
    Base.metadata.create_all(bind=engine)


def init_default_data(db):
    """Initialize default roles and permissions"""
    # Check if data already exists
    if db.query(Role).count() > 0:
        return
    
    # Define default permissions
    default_permissions = [
        # User permissions
        {"name": "users.create", "resource": "users", "action": "create", "description": "Create new users"},
        {"name": "users.read", "resource": "users", "action": "read", "description": "View users"},
        {"name": "users.update", "resource": "users", "action": "update", "description": "Update users"},
        {"name": "users.delete", "resource": "users", "action": "delete", "description": "Delete users"},
        # Role permissions
        {"name": "roles.create", "resource": "roles", "action": "create", "description": "Create new roles"},
        {"name": "roles.read", "resource": "roles", "action": "read", "description": "View roles"},
        {"name": "roles.update", "resource": "roles", "action": "update", "description": "Update roles"},
        {"name": "roles.delete", "resource": "roles", "action": "delete", "description": "Delete roles"},
        # Room permissions
        {"name": "rooms.create", "resource": "rooms", "action": "create", "description": "Create rooms"},
        {"name": "rooms.read", "resource": "rooms", "action": "read", "description": "View rooms"},
        {"name": "rooms.update", "resource": "rooms", "action": "update", "description": "Update rooms"},
        {"name": "rooms.delete", "resource": "rooms", "action": "delete", "description": "Delete rooms"},
        # Patient permissions
        {"name": "patients.create", "resource": "patients", "action": "create", "description": "Create new patients"},
        {"name": "patients.read", "resource": "patients", "action": "read", "description": "View patients"},
        {"name": "patients.update", "resource": "patients", "action": "update", "description": "Update patients"},
        {"name": "patients.delete", "resource": "patients", "action": "delete", "description": "Delete patients"},
        # Doctor permissions
        {"name": "doctors.create", "resource": "doctors", "action": "create", "description": "Create new doctors"},
        {"name": "doctors.read", "resource": "doctors", "action": "read", "description": "View doctors"},
        {"name": "doctors.update", "resource": "doctors", "action": "update", "description": "Update doctors"},
        {"name": "doctors.delete", "resource": "doctors", "action": "delete", "description": "Delete doctors"},
        # specific Monitor permissions
        {"name": "monitor.view", "resource": "monitor", "action": "view", "description": "Access Nurse Monitor"},
        # Dashboard
        {"name": "dashboard.view", "resource": "dashboard", "action": "read", "description": "View dashboard"},
    ]
    
    permissions = []
    for perm_data in default_permissions:
        perm = Permission(**perm_data)
        db.add(perm)
        permissions.append(perm)
    
    db.flush()
    
    # Define default roles with permissions
    admin_role = Role(
        name="administrator",
        description="Full system access"
    )
    admin_role.permissions = permissions  # All permissions
    db.add(admin_role)
    
    nurse_role = Role(
        name="nurse",
        description="Nurse staff access"
    )
    nurse_perms = [p for p in permissions if p.resource in ["patients", "rooms", "dashboard"] and p.action == "read"]
    nurse_role.permissions = nurse_perms
    db.add(nurse_role)
    
    kitchen_role = Role(
        name="kitchen",
        description="Kitchen staff access"
    )
    kitchen_role.permissions = [p for p in permissions if p.name == "dashboard.view"]
    db.add(kitchen_role)
    
    cleaning_role = Role(
        name="cleaning",
        description="Cleaning staff access"
    )
    cleaning_role.permissions = [p for p in permissions if p.name == "dashboard.view"]
    db.add(cleaning_role)
    db.flush()

    # Create default sysadmin user
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")
    hashed_password = pwd_context.hash("sysadmin")

    sysadmin = User(
        username="sysadmin",
        password=hashed_password,
        first_name="System",
        last_name="Administrator",
        email="sysadmin@hospital.com",
        role_id=admin_role.id,
        is_active=True
    )
    db.add(sysadmin)
    
    db.commit()
    print("✅ Default roles and permissions created successfully!")
