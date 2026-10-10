-- Smart Hostel Management System - PostgreSQL Seed Script
-- Seed Initial Demo Users, Hostel, Rooms, Out-Passes, Attendance, and Issues

-- 1. Insert Hostels
INSERT INTO hostels (id, name, latitude, longitude, radius, created_at, updated_at)
VALUES (
    'hostel-block-a-uuid',
    'Campus Main Hostel Block A',
    11.016844,
    76.955832,
    150.0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- 2. Insert Rooms
INSERT INTO rooms (id, hostel_id, room_number, capacity, created_at, updated_at)
VALUES 
    ('room-101-uuid', 'hostel-block-a-uuid', '101', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('room-204-uuid', 'hostel-block-a-uuid', '204', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Users (Bcrypt hashes: password123 / [role]123)
-- Admin: ADM001 / admin@hostel.com / admin123
INSERT INTO users (id, name, email, identifier, phone, password_hash, role, status, created_at, updated_at)
VALUES (
    'user-admin-uuid',
    'Chief Admin Officer',
    'admin@hostel.com',
    'ADM001',
    '+91 9876543210',
    '$2a$10$tZ264jZ1vX7mK0f0P0tP0e8K8T0J4b5C4v9O0e8K8T0J4b5C4v9O0',
    'admin',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Warden: WRD001 / warden@hostel.com / warden123
INSERT INTO users (id, name, email, identifier, phone, password_hash, role, status, created_at, updated_at)
VALUES (
    'user-warden-uuid',
    'Dr. Rajesh Kumar (Chief Warden)',
    'warden@hostel.com',
    'WRD001',
    '+91 9876543211',
    '$2a$10$tZ264jZ1vX7mK0f0P0tP0e8K8T0J4b5C4v9O0e8K8T0J4b5C4v9O0',
    'warden',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Tutor/Teacher: TCH001 / tutor@hostel.com / tutor123
INSERT INTO users (id, name, email, identifier, phone, password_hash, role, status, created_at, updated_at)
VALUES (
    'user-tutor-uuid',
    'Prof. Anita Sharma (CSE Department)',
    'tutor@hostel.com',
    'TCH001',
    '+91 9876543212',
    '$2a$10$tZ264jZ1vX7mK0f0P0tP0e8K8T0J4b5C4v9O0e8K8T0J4b5C4v9O0',
    'tutor',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

INSERT INTO tutors (id, user_id, employee_id, department, created_at, updated_at)
VALUES ('tutor-record-uuid', 'user-tutor-uuid', 'TCH001', 'Computer Science and Engineering', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Parent: parent@hostel.com / parent123
INSERT INTO users (id, name, email, identifier, phone, password_hash, role, status, created_at, updated_at)
VALUES (
    'user-parent-uuid',
    'Mr. Suresh Doe (Parent)',
    'parent@hostel.com',
    'PRN001',
    '+91 9876543213',
    '$2a$10$tZ264jZ1vX7mK0f0P0tP0e8K8T0J4b5C4v9O0e8K8T0J4b5C4v9O0',
    'parent',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

INSERT INTO parents (id, user_id, created_at, updated_at)
VALUES ('parent-record-uuid', 'user-parent-uuid', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Student: 23CS001 / student@hostel.com / student123
INSERT INTO users (id, name, email, identifier, phone, password_hash, role, status, created_at, updated_at)
VALUES (
    'user-student-uuid',
    'John Doe',
    'student@hostel.com',
    '23CS001',
    '+91 9876543214',
    '$2a$10$tZ264jZ1vX7mK0f0P0tP0e8K8T0J4b5C4v9O0e8K8T0J4b5C4v9O0',
    'student',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

INSERT INTO students (id, user_id, register_number, department, year, room_id, parent_id, tutor_id, created_at, updated_at)
VALUES (
    'student-record-uuid',
    'user-student-uuid',
    '23CS001',
    'Computer Science and Engineering',
    3,
    'room-204-uuid',
    'parent-record-uuid',
    'tutor-record-uuid',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- Security: security@hostel.com / security123
INSERT INTO users (id, name, email, identifier, phone, password_hash, role, status, created_at, updated_at)
VALUES (
    'user-security-uuid',
    'Officer Raman (Main Gate Security)',
    'security@hostel.com',
    'SEC001',
    '+91 9876543215',
    '$2a$10$tZ264jZ1vX7mK0f0P0tP0e8K8T0J4b5C4v9O0e8K8T0J4b5C4v9O0',
    'security',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- 4. Sample Approved Outpass with QR Token
INSERT INTO outpass_requests (
    id, student_id, purpose, destination, reason, leaving_date, leaving_time, return_date, return_time, qr_token, status, created_at, updated_at
) VALUES (
    'outpass-approved-demo',
    'student-record-uuid',
    'Weekend Home Visit',
    'Coimbatore Home (Crosscut Road)',
    'Attending family ceremony over the weekend.',
    '2026-10-10',
    '17:00',
    '2026-10-12',
    '08:00',
    'PASS-22CS001-DEMO-TOKEN',
    'APPROVED',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

INSERT INTO outpass_approvals (id, request_id, approver_id, approver_role, status, comments, approved_at, created_at)
VALUES 
    ('appr-1', 'outpass-approved-demo', 'user-tutor-uuid', 'tutor', 'APPROVED', 'Academics up-to-date. Approved.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('appr-2', 'outpass-approved-demo', 'user-parent-uuid', 'parent', 'APPROVED', 'Permission granted.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('appr-3', 'outpass-approved-demo', 'user-warden-uuid', 'warden', 'APPROVED', 'Gate pass issued.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
