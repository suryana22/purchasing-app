#!/usr/bin/env python3
"""
Script sederhana untuk generate password hash dan mereset database
"""

from passlib.context import CryptContext
import sys

# Password hashing context
pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")

def generate_hash(password: str):
    """Generate password hash"""
    return pwd_context.hash(password)

if __name__ == "__main__":
    password = "sysadmin"
    hash_result = generate_hash(password)
    print(f"Password hash untuk '{password}':")
    print(hash_result)
    print("\nSQL untuk insert user:")
    print(f"""
-- Hapus semua user
DELETE FROM users;

-- Insert user sysadmin dengan password 'sysadmin'
INSERT INTO users (username, password, email, first_name, last_name, role_id, is_active, created_at, updated_at)
SELECT 
    'sysadmin',
    '{hash_result}',
    'sysadmin@hospital.com',
    'System',
    'Administrator',
    id,
    true,
    NOW(),
    NOW()
FROM roles WHERE name = 'administrator';
""")
