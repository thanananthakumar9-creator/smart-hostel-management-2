-- Smart Hostel Management System
-- Migration 001: Initial Relational Database Schema (PostgreSQL)

-- Enable UUID extension if supported
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    identifier VARCHAR(64),
    phone VARCHAR(30),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('student', 'parent', 'tutor', 'warden', 'security', 'admin')),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_identifier ON users(identifier);

-- Hostels table
CREATE TABLE IF NOT EXISTS hostels (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    radius DOUBLE PRECISION NOT NULL DEFAULT 100.0, -- In meters
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(64) PRIMARY KEY,
    hostel_id VARCHAR(64) NOT NULL REFERENCES hostels(id) ON DELETE CASCADE,
    room_number VARCHAR(50) NOT NULL,
    capacity INT DEFAULT 4,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hostel_id, room_number)
);

CREATE INDEX IF NOT EXISTS idx_rooms_hostel ON rooms(hostel_id);

-- Parents table
CREATE TABLE IF NOT EXISTS parents (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tutors table
CREATE TABLE IF NOT EXISTS tutors (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(64),
    department VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    register_number VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    year INT NOT NULL DEFAULT 1,
    room_id VARCHAR(64) REFERENCES rooms(id) ON DELETE SET NULL,
    parent_id VARCHAR(64) REFERENCES parents(id) ON DELETE SET NULL,
    tutor_id VARCHAR(64) REFERENCES tutors(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_students_reg ON students(register_number);
CREATE INDEX IF NOT EXISTS idx_students_tutor ON students(tutor_id);
CREATE INDEX IF NOT EXISTS idx_students_parent ON students(parent_id);
CREATE INDEX IF NOT EXISTS idx_students_room ON students(room_id);

-- Outpass Requests table
CREATE TABLE IF NOT EXISTS outpass_requests (
    id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    purpose VARCHAR(100) NOT NULL,
    destination VARCHAR(200) NOT NULL,
    reason TEXT NOT NULL,
    leaving_date DATE NOT NULL,
    leaving_time VARCHAR(20) NOT NULL,
    return_date DATE NOT NULL,
    return_time VARCHAR(20) NOT NULL,
    attachment_url TEXT,
    qr_token VARCHAR(100) UNIQUE,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'USED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_outpass_student ON outpass_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_outpass_status ON outpass_requests(status);
CREATE INDEX IF NOT EXISTS idx_outpass_qr_token ON outpass_requests(qr_token);

-- Outpass Approvals table (multi-level: Tutor, Parent, Warden)
CREATE TABLE IF NOT EXISTS outpass_approvals (
    id VARCHAR(64) PRIMARY KEY,
    request_id VARCHAR(64) NOT NULL REFERENCES outpass_requests(id) ON DELETE CASCADE,
    approver_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approver_role VARCHAR(20) NOT NULL CHECK (approver_role IN ('tutor', 'parent', 'warden')),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    comments TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(request_id, approver_role)
);

CREATE INDEX IF NOT EXISTS idx_approvals_request ON outpass_approvals(request_id);
CREATE INDEX IF NOT EXISTS idx_approvals_approver ON outpass_approvals(approver_id);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'NOT_VERIFIED', 'ABSENT')),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    verification_method VARCHAR(50) DEFAULT 'GEOFENCE_GPS',
    distance_from_hostel DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

-- Issues table
CREATE TABLE IF NOT EXISTS issues (
    id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    room_id VARCHAR(64) REFERENCES rooms(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Electrical', 'Plumbing', 'Water', 'Internet', 'Furniture', 'Cleaning', 'Room Maintenance', 'Other')),
    description TEXT NOT NULL,
    photo_url TEXT,
    priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    status VARCHAR(20) DEFAULT 'NEW' CHECK (status IN ('NEW', 'ASSIGNED', 'IN PROGRESS', 'RESOLVED', 'CLOSED')),
    assigned_to VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_issues_student ON issues(student_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);

-- Issue Updates / Comments
CREATE TABLE IF NOT EXISTS issue_updates (
    id VARCHAR(64) PRIMARY KEY,
    issue_id VARCHAR(64) NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    updated_by VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_issue_updates_issue ON issue_updates(issue_id);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(64),
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
