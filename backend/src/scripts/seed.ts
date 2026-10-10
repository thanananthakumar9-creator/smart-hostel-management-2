import { initSchema, queryRow, execute } from '../database/db';
import { hashPassword } from '../utils/auth';
import { v4 as uuidv4 } from 'uuid';

export async function runSeed(): Promise<void> {
  console.log('--- Initializing Database Schema ---');
  await initSchema();

  console.log('--- Seeding Smart Hostel Data ---');

  // Check if admin already exists
  const existingAdmin = await queryRow<any>(`SELECT id FROM users WHERE email = 'admin@hostel.com'`);
  if (existingAdmin) {
    console.log('✓ Updating user identifiers in existing seed database...');
    await execute(`UPDATE users SET identifier = 'ADM001' WHERE role = 'admin' AND (identifier IS NULL OR identifier = '')`);
    await execute(`UPDATE users SET identifier = 'TCH001' WHERE role = 'tutor' AND (identifier IS NULL OR identifier = '')`);
    await execute(`UPDATE tutors SET employee_id = 'TCH001' WHERE (employee_id IS NULL OR employee_id = '')`);
    await execute(`UPDATE users SET identifier = '23CS001' WHERE role = 'student' AND (identifier IS NULL OR identifier = '')`);
    await execute(`UPDATE students SET register_number = '23CS001' WHERE register_number = '22CS001' OR register_number IS NULL`);
    console.log('✓ Seed data already present and updated with role identifiers.');
    return;
  }

  // Pre-hashed passwords
  const adminPass = await hashPassword('admin123');
  const wardenPass = await hashPassword('warden123');
  const tutorPass = await hashPassword('tutor123');
  const parentPass = await hashPassword('parent123');
  const studentPass = await hashPassword('student123');
  const securityPass = await hashPassword('security123');

  // 1. Seed Hostels
  const hostelId = 'hostel-block-a-uuid';
  await execute(
    `INSERT INTO hostels (id, name, latitude, longitude, radius, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [hostelId, 'Campus Main Hostel Block A', 11.016844, 76.955832, 150.0]
  );

  // 2. Seed Rooms
  const room204Id = 'room-204-uuid';
  await execute(
    `INSERT INTO rooms (id, hostel_id, room_number, capacity, created_at, updated_at)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [room204Id, hostelId, '204', 4]
  );
  await execute(
    `INSERT INTO rooms (id, hostel_id, room_number, capacity, created_at, updated_at)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    ['room-101-uuid', hostelId, '101', 4]
  );

  // 3. Seed Users
  const adminId = 'user-admin-uuid';
  const wardenId = 'user-warden-uuid';
  const tutorId = 'user-tutor-uuid';
  const parentId = 'user-parent-uuid';
  const studentId = 'user-student-uuid';
  const securityId = 'user-security-uuid';

  // Admin (Admin ID: ADM001)
  await execute(
    `INSERT INTO users (id, name, email, identifier, phone, password_hash, role, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'admin', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [adminId, 'Chief Admin Officer', 'admin@hostel.com', 'ADM001', '+91 9876543210', adminPass]
  );

  // Warden
  await execute(
    `INSERT INTO users (id, name, email, identifier, phone, password_hash, role, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'warden', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [wardenId, 'Dr. Rajesh Kumar (Chief Warden)', 'warden@hostel.com', 'WRD001', '+91 9876543211', wardenPass]
  );

  // Tutor / Teacher (Teacher ID: TCH001)
  await execute(
    `INSERT INTO users (id, name, email, identifier, phone, password_hash, role, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'tutor', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [tutorId, 'Prof. Anita Sharma (CSE Department)', 'tutor@hostel.com', 'TCH001', '+91 9876543212', tutorPass]
  );
  const tutorRecordId = 'tutor-record-uuid';
  await execute(
    `INSERT INTO tutors (id, user_id, employee_id, department, created_at, updated_at)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [tutorRecordId, tutorId, 'TCH001', 'Computer Science and Engineering']
  );

  // Parent
  await execute(
    `INSERT INTO users (id, name, email, identifier, phone, password_hash, role, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'parent', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [parentId, 'Mr. Suresh Doe (Parent)', 'parent@hostel.com', 'PRN001', '+91 9876543213', parentPass]
  );
  const parentRecordId = 'parent-record-uuid';
  await execute(
    `INSERT INTO parents (id, user_id, created_at, updated_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [parentRecordId, parentId]
  );

  // Student (Roll Number: 23CS001)
  await execute(
    `INSERT INTO users (id, name, email, identifier, phone, password_hash, role, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'student', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [studentId, 'John Doe', 'student@hostel.com', '23CS001', '+91 9876543214', studentPass]
  );
  const studentRecordId = 'student-record-uuid';
  await execute(
    `INSERT INTO students (id, user_id, register_number, department, year, room_id, parent_id, tutor_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [studentRecordId, studentId, '23CS001', 'Computer Science and Engineering', 3, room204Id, parentRecordId, tutorRecordId]
  );

  // Security
  await execute(
    `INSERT INTO users (id, name, email, identifier, phone, password_hash, role, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'security', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [securityId, 'Officer Raman (Main Gate Security)', 'security@hostel.com', 'SEC001', '+91 9876543215', securityPass]
  );

  // 4. Seed sample Outpass Request (One APPROVED with valid QR token, One PENDING)
  const approvedOutpassId = 'outpass-approved-demo';
  const demoQrToken = 'PASS-22CS001-DEMO-TOKEN';
  await execute(
    `INSERT INTO outpass_requests (
      id, student_id, purpose, destination, reason,
      leaving_date, leaving_time, return_date, return_time,
      qr_token, status, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
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
    ]
  );

  // 3 Approved levels for this demo pass
  await execute(
    `INSERT INTO outpass_approvals (id, request_id, approver_id, approver_role, status, comments, approved_at, created_at)
     VALUES ($1, $2, $3, 'tutor', 'APPROVED', 'Academics up-to-date. Approved.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    ['appr-1', approvedOutpassId, tutorId]
  );
  await execute(
    `INSERT INTO outpass_approvals (id, request_id, approver_id, approver_role, status, comments, approved_at, created_at)
     VALUES ($1, $2, $3, 'parent', 'APPROVED', 'Permission granted for family visit.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    ['appr-2', approvedOutpassId, parentId]
  );
  await execute(
    `INSERT INTO outpass_approvals (id, request_id, approver_id, approver_role, status, comments, approved_at, created_at)
     VALUES ($1, $2, $3, 'warden', 'APPROVED', 'Gate pass issued.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    ['appr-3', approvedOutpassId, wardenId]
  );

  // Sample Pending Outpass
  const pendingOutpassId = 'outpass-pending-demo';
  await execute(
    `INSERT INTO outpass_requests (
      id, student_id, purpose, destination, reason,
      leaving_date, leaving_time, return_date, return_time,
      qr_token, status, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
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
    ]
  );

  // Pending approvals
  await execute(
    `INSERT INTO outpass_approvals (id, request_id, approver_id, approver_role, status, comments, created_at)
     VALUES ($1, $2, $3, 'tutor', 'PENDING', NULL, CURRENT_TIMESTAMP)`,
    ['appr-pen-1', pendingOutpassId, tutorId]
  );
  await execute(
    `INSERT INTO outpass_approvals (id, request_id, approver_id, approver_role, status, comments, created_at)
     VALUES ($1, $2, $3, 'parent', 'PENDING', NULL, CURRENT_TIMESTAMP)`,
    ['appr-pen-2', pendingOutpassId, parentId]
  );
  await execute(
    `INSERT INTO outpass_approvals (id, request_id, approver_id, approver_role, status, comments, created_at)
     VALUES ($1, $2, $3, 'warden', 'PENDING', NULL, CURRENT_TIMESTAMP)`,
    ['appr-pen-3', pendingOutpassId, wardenId]
  );

  // 5. Seed sample Issues
  const issue1Id = 'issue-elec-demo';
  await execute(
    `INSERT INTO issues (id, student_id, room_id, category, description, priority, status, created_at, updated_at)
     VALUES ($1, $2, $3, 'Electrical', 'Ceiling fan making clicking sound and running slow in room 204.', 'MEDIUM', 'IN PROGRESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [issue1Id, studentRecordId, room204Id]
  );
  await execute(
    `INSERT INTO issue_updates (id, issue_id, updated_by, comment, status, created_at)
     VALUES ($1, $2, $3, 'Electrician Mr. Prakash assigned to inspect fan capacitor.', 'IN PROGRESS', CURRENT_TIMESTAMP)`,
    ['issue-up-1', issue1Id, wardenId]
  );

  const issue2Id = 'issue-water-demo';
  await execute(
    `INSERT INTO issues (id, student_id, room_id, category, description, priority, status, created_at, updated_at)
     VALUES ($1, $2, $3, 'Plumbing', 'Bathroom tap leaking continuously on 2nd floor corridor.', 'HIGH', 'RESOLVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [issue2Id, studentRecordId, room204Id]
  );
  await execute(
    `INSERT INTO issue_updates (id, issue_id, updated_by, comment, status, created_at)
     VALUES ($1, $2, $3, 'Washer replaced and valve tightened. Leakage stopped.', 'RESOLVED', CURRENT_TIMESTAMP)`,
    ['issue-up-2', issue2Id, wardenId]
  );

  // 6. Seed sample notifications
  await execute(
    `INSERT INTO notifications (id, user_id, title, message, is_read, created_at)
     VALUES ($1, $2, 'Welcome to Smart Hostel', 'Your student account is active. Remember to mark location-verified attendance daily.', 1, CURRENT_TIMESTAMP)`,
    ['notif-1', studentId]
  );
  await execute(
    `INSERT INTO notifications (id, user_id, title, message, is_read, created_at)
     VALUES ($1, $2, 'Out-Pass Request Pending Approval', 'Student John Doe has submitted an out-pass request for Hackathon.', 0, CURRENT_TIMESTAMP)`,
    ['notif-2', tutorId]
  );

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
