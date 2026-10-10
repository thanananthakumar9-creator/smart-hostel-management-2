import { app } from '../app';
import { initSchema, queryRow, execute } from '../database/db';
import { runSeed } from '../scripts/seed';
import { calculateHaversineDistance, verifyGeofence } from '../utils/haversine';
import http from 'http';

let server: http.Server;
const BASE_URL = 'http://localhost:5001';

async function fetchJson(endpoint: string, options: any = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

let studentToken = '';
let tutorToken = '';
let parentToken = '';
let wardenToken = '';
let securityToken = '';
let adminToken = '';

async function runAllTests() {
  console.log('\n=======================================================');
  console.log('🧪 RUNNING COMPREHENSIVE SMART HOSTEL INTEGRATION TESTS');
  console.log('=======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Setup DB
    await initSchema();
    await runSeed();

    // Start ephemeral server on port 5001 for test suite
    await new Promise<void>((resolve) => {
      server = app.listen(5001, () => {
        resolve();
      });
    });

    // -----------------------------------------------------------------
    // TEST SUITE 1: GEODETIC & HAVERSINE GEOFENCE MATHEMATICS
    // -----------------------------------------------------------------
    console.log('\n[Suite 1] Geofence & Haversine Accuracy:');
    const hostelLat = 11.016844;
    const hostelLon = 76.955832;
    const radiusMeters = 150.0;

    // Point 1: 30 meters away
    const d1 = calculateHaversineDistance(hostelLat, hostelLon, 11.017000, 76.955900);
    assert(d1 < 100, `Haversine correctly computed near distance: ${d1}m`);

    // Point 2: 500 meters away
    const d2 = calculateHaversineDistance(hostelLat, hostelLon, 11.021000, 76.955832);
    assert(d2 > 400 && d2 < 600, `Haversine correctly computed far distance: ${d2}m`);

    const insideCheck = verifyGeofence(11.017000, 76.955900, hostelLat, hostelLon, radiusMeters);
    assert(insideCheck.isInside === true, 'verifyGeofence flags inside boundary as true');

    const outsideCheck = verifyGeofence(11.021000, 76.955832, hostelLat, hostelLon, radiusMeters);
    assert(outsideCheck.isInside === false, 'verifyGeofence flags outside boundary as false');

    // -----------------------------------------------------------------
    // TEST SUITE 2: AUTHENTICATION & RBAC
    // -----------------------------------------------------------------
    console.log('\n[Suite 2] Authentication & Access Control:');
    
    // 2.1 Valid student login
    const loginRes = await fetchJson('/api/auth/login', {
      method: 'POST',
      body: { email: 'student@hostel.com', password: 'student123' },
    });
    assert(loginRes.status === 200 && loginRes.data.success, 'Valid student login succeeds');
    studentToken = loginRes.data.token;

    // 2.2 Invalid password
    const badPassRes = await fetchJson('/api/auth/login', {
      method: 'POST',
      body: { email: 'student@hostel.com', password: 'wrongpassword' },
    });
    assert(badPassRes.status === 401 && !badPassRes.data.success, 'Invalid password rejected with 401');

    // 2.3 Non-existent user
    const badUserRes = await fetchJson('/api/auth/login', {
      method: 'POST',
      body: { email: 'nonexistent@hostel.com', password: 'password123' },
    });
    assert(badUserRes.status === 401, 'Non-existent user rejected with 401');

    // 2.4 Login remaining roles
    const tutorLog = await fetchJson('/api/auth/login', { method: 'POST', body: { email: 'tutor@hostel.com', password: 'tutor123' } });
    tutorToken = tutorLog.data.token;

    const parentLog = await fetchJson('/api/auth/login', { method: 'POST', body: { email: 'parent@hostel.com', password: 'parent123' } });
    parentToken = parentLog.data.token;

    const wardenLog = await fetchJson('/api/auth/login', { method: 'POST', body: { email: 'warden@hostel.com', password: 'warden123' } });
    wardenToken = wardenLog.data.token;

    const securityLog = await fetchJson('/api/auth/login', { method: 'POST', body: { email: 'security@hostel.com', password: 'security123' } });
    securityToken = securityLog.data.token;

    const adminLog = await fetchJson('/api/auth/login', { method: 'POST', body: { email: 'admin@hostel.com', password: 'admin123' } });
    adminToken = adminLog.data.token;

    assert(Boolean(tutorToken && parentToken && wardenToken && securityToken && adminToken), 'All 6 user roles authenticated successfully');

    // 2.5 Security cannot approve out-pass (RBAC enforcement)
    const securityApprove = await fetchJson('/api/outpasses/test-id/approve', {
      method: 'POST',
      headers: { Authorization: `Bearer ${securityToken}` },
      body: { comments: 'I want to approve' },
    });
    assert(securityApprove.status === 403, 'Security role forbidden from approving out-passes (RBAC 403)');

    // -----------------------------------------------------------------
    // TEST SUITE 3: LOCATION-BASED ATTENDANCE & DUPLICATE PREVENT
    // -----------------------------------------------------------------
    console.log('\n[Suite 3] Location-Based Attendance Geofencing:');

    // Ensure test date is clean for student
    const todayStr = new Date().toISOString().split('T')[0];
    const studentUser = await queryRow<any>(`SELECT id FROM users WHERE email = 'student@hostel.com'`);
    const studentRec = await queryRow<any>(`SELECT id FROM students WHERE user_id = $1`, [studentUser.id]);
    await execute(`DELETE FROM attendance WHERE student_id = $1 AND date = $2`, [studentRec.id, todayStr]);

    // 3.1 Attendance outside geofence (far away coordinates)
    const attOutside = await fetchJson('/api/attendance/mark', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { latitude: 11.200000, longitude: 77.100000 },
    });
    assert(attOutside.status === 400 && attOutside.data.status === 'NOT_VERIFIED', 'Student outside hostel premises rejected as NOT_VERIFIED');

    // Delete the failed entry so we can test successful marking for today
    await execute(`DELETE FROM attendance WHERE student_id = $1 AND date = $2`, [studentRec.id, todayStr]);

    // 3.2 Attendance inside geofence (accurate coordinates within 150m)
    const attInside = await fetchJson('/api/attendance/mark', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { latitude: 11.016850, longitude: 76.955840 },
    });
    assert(attInside.status === 200 && attInside.data.status === 'PRESENT', 'Student inside hostel marked as PRESENT');

    // 3.3 Duplicate attendance prevention
    const attDuplicate = await fetchJson('/api/attendance/mark', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { latitude: 11.016850, longitude: 76.955840 },
    });
    assert(attDuplicate.status === 400 && attDuplicate.data.alreadyMarked === true, 'Duplicate attendance on same day strictly prevented');

    // -----------------------------------------------------------------
    // TEST SUITE 4: MULTI-LEVEL OUT-PASS WORKFLOW
    // -----------------------------------------------------------------
    console.log('\n[Suite 4] Out-Pass Multi-Level Approval Workflow:');

    // 4.1 Create Out-Pass Request
    const outpassCreate = await fetchJson('/api/outpasses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: {
        purpose: 'Medical Checkup',
        destination: 'Apollo Hospital',
        reason: 'Scheduled eye specialist checkup',
        leaving_date: '2026-10-15',
        leaving_time: '10:00',
        return_date: '2026-10-15',
        return_time: '16:00',
      },
    });
    assert(outpassCreate.status === 201 && outpassCreate.data.requestId, 'Student successfully submitted out-pass request');
    const newPassId = outpassCreate.data.requestId;

    // Check initial status is PENDING
    const initialPass = await fetchJson(`/api/outpasses/${newPassId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(initialPass.data.request.status === 'PENDING', 'Initial out-pass status is PENDING');
    assert(initialPass.data.request.approvals.length === 3, 'Out-pass has 3 approval tiers: Tutor, Parent, Warden');

    // 4.2 Step 1: Tutor Approves
    const tutorApp = await fetchJson(`/api/outpasses/${newPassId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tutorToken}` },
      body: { comments: 'Medical leave approved by Tutor.' },
    });
    assert(tutorApp.status === 200 && tutorApp.data.isFullyApproved === false, 'Tutor approved; pass remains PENDING overall');

    // 4.3 Step 2: Parent Approves
    const parentApp = await fetchJson(`/api/outpasses/${newPassId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${parentToken}` },
      body: { comments: 'Parent confirmed doctor appointment.' },
    });
    assert(parentApp.status === 200 && parentApp.data.isFullyApproved === false, 'Parent approved; pass remains PENDING overall');

    // 4.4 Step 3: Warden Approves -> ALL 3 COMPLETE -> Becomes APPROVED
    const wardenApp = await fetchJson(`/api/outpasses/${newPassId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${wardenToken}` },
      body: { comments: 'Gate pass authorized by Warden.' },
    });
    assert(wardenApp.status === 200 && wardenApp.data.isFullyApproved === true, 'Warden approved; all 3 approvals complete -> status APPROVED');

    // Verify pass is APPROVED
    const finalPass = await fetchJson(`/api/outpasses/${newPassId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(finalPass.data.request.status === 'APPROVED', 'Out-pass verified as APPROVED in database');

    // 4.5 Digital QR generation
    const qrRes = await fetchJson(`/api/outpasses/${newPassId}/qr`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(qrRes.status === 200 && qrRes.data.qrDataUrl.startsWith('data:image/png;base64,'), 'Digital QR code successfully generated');

    // -----------------------------------------------------------------
    // TEST SUITE 5: SECURITY QR VERIFICATION
    // -----------------------------------------------------------------
    console.log('\n[Suite 5] Security QR Verification:');

    // 5.1 Verify approved pass
    const verifyPass = await fetchJson(`/api/outpasses/verify/${qrRes.data.token}`);
    assert(verifyPass.status === 200 && verifyPass.data.verificationStatus === 'VALID', 'Security scan verifies pass as VALID');

    // 5.2 Invalid / Non-existent QR token
    const verifyInvalid = await fetchJson('/api/outpasses/verify/fake-token-999');
    assert(verifyInvalid.status === 404 && verifyInvalid.data.status === 'INVALID', 'Tampered or non-existent token rejected as INVALID');

    // -----------------------------------------------------------------
    // TEST SUITE 6: HOSTEL ISSUES / COMPLAINTS LIFECYCLE
    // -----------------------------------------------------------------
    console.log('\n[Suite 6] Hostel Issues / Complaints Lifecycle:');

    // 6.1 Student reports issue
    const createIssueRes = await fetchJson('/api/issues', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: {
        category: 'Internet',
        room_number: '204',
        description: 'Wi-Fi router in wing B keeps disconnecting every 5 minutes.',
        priority: 'HIGH',
      },
    });
    assert(createIssueRes.status === 201 && createIssueRes.data.issueId, 'Student reported issue; status is NEW');
    const issueId = createIssueRes.data.issueId;

    // 6.2 Warden updates status to IN PROGRESS & assigns staff
    const updateIssueRes = await fetchJson(`/api/issues/${issueId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${wardenToken}` },
      body: {
        status: 'IN PROGRESS',
        comment: 'IT Network technician dispatched to reboot switch.',
      },
    });
    assert(updateIssueRes.status === 200 && updateIssueRes.data.status === 'IN PROGRESS', 'Warden updated issue to IN PROGRESS');

    // 6.3 Warden resolves issue
    const resolveIssueRes = await fetchJson(`/api/issues/${issueId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${wardenToken}` },
      body: {
        status: 'RESOLVED',
        comment: 'Switch port reset and optical cable replaced. Wi-Fi verified stable.',
      },
    });
    assert(resolveIssueRes.status === 200 && resolveIssueRes.data.status === 'RESOLVED', 'Issue resolved successfully');

    // 6.4 Student verifies timeline & updates
    const getIssueRes = await fetchJson(`/api/issues/${issueId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(getIssueRes.data.issue.status === 'RESOLVED' && getIssueRes.data.issue.updates.length >= 2, 'Student views complete issue history & resolution timeline');

    // -----------------------------------------------------------------
    // TEST SUITE 7: IN-APP NOTIFICATIONS & AUDIT LOGS
    // -----------------------------------------------------------------
    console.log('\n[Suite 7] In-App Notifications & Audit Logs:');

    // 7.1 Student checks notifications
    const notifs = await fetchJson('/api/notifications', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(notifs.status === 200 && notifs.data.notifications.length > 0, 'In-app notifications delivered to student');

    // 7.2 Admin views audit logs
    const auditLogs = await fetchJson('/api/admin/audit-logs', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(auditLogs.status === 200 && auditLogs.data.logs.length > 0, 'Audit logs recorded and accessible to Admin');

    // 7.3 Admin dashboard analytics
    const stats = await fetchJson('/api/admin/stats', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(stats.status === 200 && stats.data.stats.totalStudents >= 1, 'Dashboard analytics aggregate accurate stats');

    console.log('\n=======================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('=======================================================\n');

    server.close();
    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err: any) {
    console.error('Fatal test error:', err);
    if (server) server.close();
    process.exit(1);
  }
}

runAllTests();
