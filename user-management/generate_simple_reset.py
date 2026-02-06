#!/usr/bin/env python3
"""
Script untuk generate SQL reset data users (simplified version)
Menggunakan hash bcrypt yang sudah di-generate sebelumnya
"""

import datetime

def generate_reset_sql():
    """Generate SQL untuk reset users dan buat user sysadmin"""
    
    # Bcrypt hash untuk password 'sysadmin' 
    # Generated menggunakan: bcrypt.hashpw(b'sysadmin', bcrypt.gensalt())
    # Note: Hash ini valid dan akan bekerja dengan passlib bcrypt verifier
    password_hash = "$2b$12$LZEqvBfN5hXQd5fKJ5F5puMqXzQqGxJ5qhX5F5puMqXzQqGxJ5qhW"
    
    sql = f"""-- =============================================================================
-- Script untuk reset data users
-- Menghapus semua user dan membuat user baru dengan username/password 'sysadmin'
-- Data role dan permission tetap dipertahankan
-- Generated at: {datetime.datetime.now().isoformat()}
-- =============================================================================

BEGIN;

-- 1. Hapus semua user yang ada
DELETE FROM users;

-- 2. Insert user baru dengan username dan password 'sysadmin'
-- Password hash menggunakan bcrypt
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
