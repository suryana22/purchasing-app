#!/usr/bin/env python3
"""
Script untuk generate SQL reset data users
Menghapus semua user dan membuat user baru dengan username dan password 'sysadmin'
Data role dan permission tetap dipertahankan

CARA PAKAI:
1. python3 reset_data.py > reset_script.sql
2. Jalankan reset_script.sql di PostgreSQL database
"""

import bcrypt

def generate_bcrypt_hash(password: str) -> str:
    """Generate bcrypt hash untuk password"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def generate_reset_sql():
    """Generate SQL untuk reset users dan buat user sysadmin"""
    
    # Generate password hash untuk 'sysadmin'
    password = "sysadmin"
    password_hash = generate_bcrypt_hash(password)
    
    sql = f"""-- =============================================================================
-- Script untuk reset data users
-- Menghapus semua user dan membuat user baru dengan username/password 'sysadmin'
-- Data role dan permission tetap dipertahankan
-- Generated at: {__import__('datetime').datetime.now().isoformat()}
-- =============================================================================

BEGIN;

-- 1. Hapus semua user yang ada
DELETE FROM users;

-- 2. Insert user baru dengan username dan password 'sysadmin'
INSERT INTO users (username, password, email, first_name, last_name, role_id, is_active, created_at, updated_at)
SELECT 
    'sysadmin',
    '{password_hash}',
    'sysadmin@hospital.com',
    'System',
    'Administrator',
    id,
    true,
    NOW(),
    NOW()
FROM roles WHERE name = 'administrator';

COMMIT;

-- Verifikasi data
SELECT 
    u.id,
    u.username,
    u.email,
    u.first_name,
    u.last_name,
    r.name as role_name,
    u.is_active,
    u.created_at
FROM users u
LEFT JOIN roles r ON u.role_id = r.id;
"""
    
    return sql

if __name__ == "__main__":
    print(generate_reset_sql())
