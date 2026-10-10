"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSeed = runSeed;
const db_1 = require("../database/db");
const auth_1 = require("../utils/auth");
async function runSeed() {
    console.log('--- Initializing Database Schema ---');
    await (0, db_1.initSchema)();
    console.log('--- Seeding Smart Hostel Data ---');
    // Check if admin already exists
    const existingAdmin = await (0, db_1.queryRow)(`SELECT id FROM users WHERE email = 'admin@hostel.com'`);
    if (existingAdmin) {
        console.log('✓ Seed data already present. Skipping re-seed.');
        return;
    }
    // Pre-hashed passwords
    const adminPass = await (0, auth_1.hashPassword)('admin123');
    const wardenPass = await (0, auth_1.hashPassword)('warden123');
    const tutorPass = await (0, auth_1.hashPassword)('tutor123');
    const parentPass = await (0, auth_1.hashPassword)('parent123');
    const studentPass = await (0, auth_1.hashPassword)('student123');
    const securityPass = await (0, auth_1.hashPassword)('security123');
    // 1. Seed Hostels
    const hostelId = 'hostel-block-a-uuid';
    await (0, db_1.execute)(`INSERT INTO hostels (id, name, latitude, longitude, radius, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [hostelId, 'Campus Main Hostel Block A', 11.016844, 76.955832, 150.0]);
    // 2. Seed Rooms
    const room204Id = 'room-204-uuid';
    await (0, db_1.execute)(`INSERT INTO rooms (id, hostel_id, room_number, capacity, created_at, updated_at)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [room204Id, hostelId, '204', 4]);
    await (0, db_1.execute)(`INSERT INTO rooms (id, hostel_id, room_number, capacity, created_at, updated_at)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, ['room-101-uuid', hostelId, '101', 4]);
    // 3. Seed Users
    const adminId = 'user-admin-uuid';
    const wardenId = 'user-warden-uuid';
    const tutorId = 'user-tutor-uuid';
    const parentId = 'user-parent-uuid';
    const studentId = 'user-student-uuid';
    const securityId = 'user-security-uuid';
    // Admin
    await (0, db_1.execute)(`INSERT INTO users (id, name, email, phone, password_hash, role, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'admin', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [adminId, 'Chief Admin Officer', 'admin@hostel.com', '+91 9876543210', adminPass]);
    // Warden
    await (0, db_1.execute)(`INSERT INTO users (id, name, email, phone, password_hash, role, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'warden', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [wardenId, 'Dr. Rajesh Kumar (Chief Warden)', 'warden@hostel.com', '+91 9876543211', wardenPass]);
    // Tutor
    await (0, db_1.execute)(`INSERT INTO users (id, name, email, phone, password_hash, role, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'tutor', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [tutorId, 'Prof. Anita Sharma (CSE Department)', 'tutor@hostel.com', '+91 9876543212', tutorPass]);
    const tutorRecordId = 'tutor-record-uuid';
    await (0, db_1.execute)(`INSERT INTO tutors (id, user_id, department, created_at, updated_at)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [tutorRecordId, tutorId, 'Computer Science and Engineering']);
    // Parent
    await (0, db_1.execute)(`INSERT INTO users (id, name, email, phone, password_hash, role, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'parent', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [parentId, 'Mr. Suresh Doe (Parent)', 'parent@hostel.com', '+91 9876543213', parentPass]);
    const parentRecordId = 'parent-record-uuid';
    await (0, db_1.execute)(`INSERT INTO parents (id, user_id, created_at, updated_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [parentRecordId, parentId]);
    // Student
    await (0, db_1.execute)(`INSERT INTO users (id, name, email, phone, password_hash, role, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'student', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [studentId, 'John Doe', 'student@hostel.com', '+91 9876543214', studentPass]);
    const studentRecordId = 'student-record-uuid';
    await (0, db_1.execute)(`INSERT INTO students (id, user_id, register_number, department, year, room_id, parent_id, tutor_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [studentRecordId, studentId, '22CS001', 'Computer Science and Engineering', 3, room204Id, parentRecordId, tutorRecordId]);
    // Security
    await (0, db_1.execute)(`INSERT INTO users (id, name, email, phone, password_hash, role, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'security', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [securityId, 'Officer Raman (Main Gate Security)', 'security@hostel.com', '+91 9876543215', securityPass]);
    // 4. Seed sample Outpass Request (One APPROVED with valid QR token, One PENDING)
    const approvedOutpassId = 'outpass-approved-demo';
    const demoQrToken = 'PASS-22CS001-DEMO-TOKEN';
    await (0, db_1.execute)(`INSERT INTO outpass_requests (
      id, student_id, purpose, destination, reason,
      leaving_date, leaving_time, return_date, return_time,
      qr_token, status, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [
        approvedOutpassId,
        studentRecordId,
        'Weekend Home Visit',
        'Coimbatore Home (Crosscut Road)',
        'Attending family ceremony over the weekend.',
        '2026-10-10',
        '17:00',
        '2026-10-12',
        '08:00',
        demoQrToken,
    ]);
    // 3 Approved levels for this demo pass
    await (0, db_1.execute)(`INSERT INTO outpass_approvals (id, request_id, approver_id, approver_role, status, comments, approved_at, created_at)
     VALUES ($1, $2, $3, 'tutor', 'APPROVED', 'Academics up-to-date. Approved.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, ['appr-1', approvedOutpassId, tutorId]);
    await (0, db_1.execute)(`INSERT INTO outpass_approvals (id, request_id, approver_id, approver_role, status, comments, approved_at, created_at)
     VALUES ($1, $2, $3, 'parent', 'APPROVED', 'Permission granted for family visit.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, ['appr-2', approvedOutpassId, parentId]);
    await (0, db_1.execute)(`INSERT INTO outpass_approvals (id, request_id, approver_id, approver_role, status, comments, approved_at, created_at)
     VALUES ($1, $2, $3, 'warden', 'APPROVED', 'Gate pass issued.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, ['appr-3', approvedOutpassId, wardenId]);
    // Sample Pending Outpass
    const pendingOutpassId = 'outpass-pending-demo';
    await (0, db_1.execute)(`INSERT INTO outpass_requests (
      id, student_id, purpose, destination, reason,
      leaving_date, leaving_time, return_date, return_time,
      qr_token, status, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [
        pendingOutpassId,
        studentRecordId,
        'Project Competition',
        'PSG Tech Campus, Peelamedu',
        'Representing university in 24hr State Hackathon.',
        '2026-10-14',
        '09:00',
        '2026-10-15',
        '18:00',
        'TOKEN-HACKATHON-PENDING',
    ]);
    // Pending approvals
    await (0, db_1.execute)(`INSERT INTO outpass_approvals (id, request_id, approver_id, approver_role, status, comments, created_at)
     VALUES ($1, $2, $3, 'tutor', 'PENDING', NULL, CURRENT_TIMESTAMP)`, ['appr-pen-1', pendingOutpassId, tutorId]);
    await (0, db_1.execute)(`INSERT INTO outpass_approvals (id, request_id, approver_id, approver_role, status, comments, created_at)
     VALUES ($1, $2, $3, 'parent', 'PENDING', NULL, CURRENT_TIMESTAMP)`, ['appr-pen-2', pendingOutpassId, parentId]);
    await (0, db_1.execute)(`INSERT INTO outpass_approvals (id, request_id, approver_id, approver_role, status, comments, created_at)
     VALUES ($1, $2, $3, 'warden', 'PENDING', NULL, CURRENT_TIMESTAMP)`, ['appr-pen-3', pendingOutpassId, wardenId]);
    // 5. Seed sample Issues
    const issue1Id = 'issue-elec-demo';
    await (0, db_1.execute)(`INSERT INTO issues (id, student_id, room_id, category, description, priority, status, created_at, updated_at)
     VALUES ($1, $2, $3, 'Electrical', 'Ceiling fan making clicking sound and running slow in room 204.', 'MEDIUM', 'IN PROGRESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [issue1Id, studentRecordId, room204Id]);
    await (0, db_1.execute)(`INSERT INTO issue_updates (id, issue_id, updated_by, comment, status, created_at)
     VALUES ($1, $2, $3, 'Electrician Mr. Prakash assigned to inspect fan capacitor.', 'IN PROGRESS', CURRENT_TIMESTAMP)`, ['issue-up-1', issue1Id, wardenId]);
    const issue2Id = 'issue-water-demo';
    await (0, db_1.execute)(`INSERT INTO issues (id, student_id, room_id, category, description, priority, status, created_at, updated_at)
     VALUES ($1, $2, $3, 'Plumbing', 'Bathroom tap leaking continuously on 2nd floor corridor.', 'HIGH', 'RESOLVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [issue2Id, studentRecordId, room204Id]);
    await (0, db_1.execute)(`INSERT INTO issue_updates (id, issue_id, updated_by, comment, status, created_at)
     VALUES ($1, $2, $3, 'Washer replaced and valve tightened. Leakage stopped.', 'RESOLVED', CURRENT_TIMESTAMP)`, ['issue-up-2', issue2Id, wardenId]);
    // 6. Seed sample notifications
    await (0, db_1.execute)(`INSERT INTO notifications (id, user_id, title, message, is_read, created_at)
     VALUES ($1, $2, 'Welcome to Smart Hostel', 'Your student account is active. Remember to mark location-verified attendance daily.', 1, CURRENT_TIMESTAMP)`, ['notif-1', studentId]);
    await (0, db_1.execute)(`INSERT INTO notifications (id, user_id, title, message, is_read, created_at)
     VALUES ($1, $2, 'Out-Pass Request Pending Approval', 'Student John Doe has submitted an out-pass request for Hackathon.', 0, CURRENT_TIMESTAMP)`, ['notif-2', tutorId]);
    console.log('✓ Successfully seeded database with sample users:');
    console.log('   Admin:    admin@hostel.com    / admin123');
    console.log('   Warden:   warden@hostel.com   / warden123');
    console.log('   Tutor:    tutor@hostel.com    / tutor123');
    console.log('   Parent:   parent@hostel.com   / parent123');
    console.log('   Student:  student@hostel.com  / student123');
    console.log('   Security: security@hostel.com / security123');
}
// If executed directly via CLI
if (require.main === module) {
    runSeed()
        .then(() => process.exit(0))
        .catch((err) => {
        console.error('Seed error:', err);
        process.exit(1);
    });
}
