-- =============================================================================
-- Script untuk reset data users
-- Menghapus semua user dan membuat user baru dengan username/password 'sysadmin'
-- Data role dan permission tetap dipertahankan
-- Generated at: 2026-01-23T10:52:12.155722
-- =============================================================================

BEGIN;

-- 1. Hapus semua user yang ada
DELETE FROM users;

-- 2. Insert user baru dengan username dan password 'sysadmin'
-- Password hash menggunakan bcrypt
INSERT INTO users (username, password, email, first_name, last_name, role_id, is_active, created_at, updated_at)
SELECT 
    'sysadmin',
    '$2b$12$LZEqvBfN5hXQd5fKJ5F5puMqXzQqGxJ5qhX5F5puMqXzQqGxJ5qhW',
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

