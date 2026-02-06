-- =============================================================================
-- Script untuk reset data users
-- Menghapus semua user dan membuat user baru dengan username/password 'sysadmin'
-- Data role dan permission tetap dipertahankan
-- =============================================================================

-- 1. Hapus semua user yang ada
DELETE FROM users;

-- 2. Insert user baru dengan username dan password 'sysadmin'
-- Password hash untuk 'sysadmin' (menggunakan bcrypt)
-- Hash ini adalah hasil dari: bcrypt.hashpw('sysadmin'.encode('utf-8'), bcrypt.gensalt())
INSERT INTO users (username, password, email, first_name, last_name, role_id, is_active, created_at, updated_at)
SELECT 
    'sysadmin',
    '$2b$12$LKzGvN8qhXJqV5YhQZJLZ.xKzB5Y1VHJ9m9qF8qGF0qYQZJLZ.xKz',
    'sysadmin@hospital.com',
    'System',
    'Administrator',
    id,
    true,
    NOW(),
    NOW()
FROM roles WHERE name = 'administrator';

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
