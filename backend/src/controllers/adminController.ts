import { Request, Response } from 'express';
import { query, queryRow, execute } from '../database/db';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../utils/auth';
import { logAudit } from '../services/auditService';

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  try {
    const todayDate = new Date().toISOString().split('T')[0];

    // Total Students
    const totalStudentsRow = await queryRow<any>(`SELECT COUNT(*) as count FROM students`);
    const totalStudents = parseInt(totalStudentsRow?.count || '0', 10);

    // Present today
    const presentRow = await queryRow<any>(
      `SELECT COUNT(*) as count FROM attendance WHERE date = $1 AND status = 'PRESENT'`,
      [todayDate]
    );
    const presentStudents = parseInt(presentRow?.count || '0', 10);

    // Students with approved active outpass today (outside hostel)
    const outpassOutsideRow = await queryRow<any>(
      `SELECT COUNT(DISTINCT student_id) as count FROM outpass_requests
       WHERE status = 'APPROVED' AND leaving_date <= $1 AND return_date >= $1`,
      [todayDate]
    );
    const outsideHostel = parseInt(outpassOutsideRow?.count || '0', 10);

    const attendancePct = totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0;

    // Out-pass stats
    const pendingOutpassesRow = await queryRow<any>(`SELECT COUNT(*) as count FROM outpass_requests WHERE status = 'PENDING'`);
    const approvedOutpassesRow = await queryRow<any>(`SELECT COUNT(*) as count FROM outpass_requests WHERE status = 'APPROVED'`);
    const rejectedOutpassesRow = await queryRow<any>(`SELECT COUNT(*) as count FROM outpass_requests WHERE status = 'REJECTED'`);

    // Issue stats
    const openIssuesRow = await queryRow<any>(
      `SELECT COUNT(*) as count FROM issues WHERE status IN ('NEW', 'ASSIGNED', 'IN PROGRESS')`
    );
    const resolvedIssuesRow = await queryRow<any>(
      `SELECT COUNT(*) as count FROM issues WHERE status IN ('RESOLVED', 'CLOSED')`
    );

    // Issue categories breakdown
    const categoryStats = await query<any>(
      `SELECT category, COUNT(*) as count FROM issues GROUP BY category`
    );

    // Issue status distribution
    const statusStats = await query<any>(
      `SELECT status, COUNT(*) as count FROM issues GROUP BY status`
    );

    // Attendance trend for the last 7 days
    const attendanceTrends = await query<any>(
      `SELECT date,
              COUNT(CASE WHEN status = 'PRESENT' THEN 1 END) as present_count,
              COUNT(CASE WHEN status = 'NOT_VERIFIED' THEN 1 END) as failed_count
       FROM attendance
       GROUP BY date
       ORDER BY date DESC LIMIT 7`
    );

    res.json({
      success: true,
      stats: {
        totalStudents,
        presentStudents,
        attendancePercentage: attendancePct,
        outsideHostel,
        pendingOutpasses: parseInt(pendingOutpassesRow?.count || '0', 10),
        approvedOutpasses: parseInt(approvedOutpassesRow?.count || '0', 10),
        rejectedOutpasses: parseInt(rejectedOutpassesRow?.count || '0', 10),
        openIssues: parseInt(openIssuesRow?.count || '0', 10),
        resolvedIssues: parseInt(resolvedIssuesRow?.count || '0', 10),
        categoryStats,
        statusStats,
        attendanceTrends: attendanceTrends.reverse(),
      },
    });
  } catch (error: any) {
    console.error('getDashboardStats error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving dashboard stats.' });
  }
}

export async function getHostels(req: Request, res: Response): Promise<void> {
  try {
    const hostels = await query<any>(`SELECT * FROM hostels ORDER BY name ASC`);
    res.json({ success: true, hostels });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error retrieving hostels.' });
  }
}

export async function updateHostelGeofence(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, latitude, longitude, radius } = req.body;
    const user = req.user!;

    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);
    const radNum = parseFloat(radius);

    if (isNaN(latNum) || isNaN(lonNum) || isNaN(radNum) || radNum <= 0) {
      res.status(400).json({
        success: false,
        message: 'Invalid geofence settings. Latitude, longitude and positive radius are required.',
      });
      return;
    }

    await execute(
      `UPDATE hostels
       SET name = COALESCE($1, name), latitude = $2, longitude = $3, radius = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [name || null, latNum, lonNum, radNum, id]
    );

    await logAudit(user.userId, 'UPDATE_GEOFENCE', 'hostel', id, {
      latitude: latNum,
      longitude: lonNum,
      radius: radNum,
    });

    res.json({
      success: true,
      message: 'Hostel geofence configuration updated successfully.',
      geofence: { latitude: latNum, longitude: lonNum, radius: radNum },
    });
  } catch (error: any) {
    console.error('updateHostelGeofence error:', error);
    res.status(500).json({ success: false, message: 'Server error updating hostel geofence.' });
  }
}

export async function createHostel(req: Request, res: Response): Promise<void> {
  try {
    const { name, latitude, longitude, radius } = req.body;
    const user = req.user!;

    if (!name || latitude === undefined || longitude === undefined) {
      res.status(400).json({ success: false, message: 'Hostel name, latitude, and longitude are required.' });
      return;
    }

    const id = uuidv4();
    await execute(
      `INSERT INTO hostels (id, name, latitude, longitude, radius, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [id, name.trim(), parseFloat(latitude), parseFloat(longitude), parseFloat(radius || '100')]
    );

    await logAudit(user.userId, 'CREATE_HOSTEL', 'hostel', id, { name });

    res.status(201).json({ success: true, message: 'Hostel created successfully.', id });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error creating hostel.' });
  }
}

export async function getRooms(req: Request, res: Response): Promise<void> {
  try {
    const rooms = await query<any>(
      `SELECT r.*, h.name as hostel_name
       FROM rooms r
       JOIN hostels h ON r.hostel_id = h.id
       ORDER BY h.name ASC, r.room_number ASC`
    );
    res.json({ success: true, rooms });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error retrieving rooms.' });
  }
}

export async function createRoom(req: Request, res: Response): Promise<void> {
  try {
    const { hostel_id, room_number, capacity } = req.body;
    const user = req.user!;

    if (!hostel_id || !room_number) {
      res.status(400).json({ success: false, message: 'Hostel ID and room number are required.' });
      return;
    }

    const id = uuidv4();
    await execute(
      `INSERT INTO rooms (id, hostel_id, room_number, capacity, created_at, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [id, hostel_id, room_number.trim(), parseInt(capacity || '4', 10)]
    );

    await logAudit(user.userId, 'CREATE_ROOM', 'room', id, { room_number });

    res.status(201).json({ success: true, message: 'Room created successfully.', id });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error creating room.' });
  }
}

export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const { role } = req.query;
    let sql = `SELECT id, name, email, phone, role, status, created_at FROM users WHERE 1=1`;
    const params: any[] = [];

    if (role) {
      params.push(role);
      sql += ` AND role = $${params.length}`;
    }

    sql += ` ORDER BY created_at DESC LIMIT 100`;
    const users = await query<any>(sql, params);

    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error retrieving users.' });
  }
}

export async function getStudentsList(req: Request, res: Response): Promise<void> {
  try {
    const students = await query<any>(
      `SELECT s.*, u.name, u.email, u.phone, u.status as account_status,
              r.room_number, h.name as hostel_name,
              pu.name as parent_name, tu.name as tutor_name
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN rooms r ON s.room_id = r.id
       LEFT JOIN hostels h ON r.hostel_id = h.id
       LEFT JOIN parents p ON s.parent_id = p.id
       LEFT JOIN users pu ON p.user_id = pu.id
       LEFT JOIN tutors t ON s.tutor_id = t.id
       LEFT JOIN users tu ON t.user_id = tu.id
       ORDER BY s.register_number ASC`
    );

    res.json({ success: true, students });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error retrieving students.' });
  }
}

export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, phone, password, role } = req.body;
    const adminUser = req.user!;

    if (!name || !email || !password || !role) {
      res.status(400).json({ success: false, message: 'Name, email, password, and role are required.' });
      return;
    }

    const existing = await queryRow<any>(`SELECT id FROM users WHERE LOWER(email) = $1`, [email.trim().toLowerCase()]);
    if (existing) {
      res.status(400).json({ success: false, message: 'User with this email already exists.' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const userId = uuidv4();
    const identifier = (req.body.identifier || req.body.roll_number || req.body.register_number || req.body.admin_id || req.body.teacher_id || null);

    await execute(
      `INSERT INTO users (id, name, email, identifier, phone, password_hash, role, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [userId, name.trim(), email.trim().toLowerCase(), identifier ? identifier.trim() : null, phone || null, passwordHash, role]
    );

    // Auto-create associated role record if needed
    if (role === 'parent') {
      await execute(`INSERT INTO parents (id, user_id, created_at, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [uuidv4(), userId]);
    } else if (role === 'tutor' || role === 'teacher') {
      await execute(`INSERT INTO tutors (id, user_id, employee_id, department, created_at, updated_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [uuidv4(), userId, identifier ? identifier.trim() : null, req.body.department || 'General']);
    } else if (role === 'student' && (req.body.register_number || req.body.roll_number || identifier)) {
      const regNo = (req.body.register_number || req.body.roll_number || identifier).trim();
      await execute(
        `INSERT INTO students (id, user_id, register_number, department, year, room_id, parent_id, tutor_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          uuidv4(),
          userId,
          regNo,
          req.body.department || 'Computer Science',
          req.body.year || 1,
          req.body.room_id || null,
          req.body.parent_id || null,
          req.body.tutor_id || null,
        ]
      );
    }

    await logAudit(adminUser.userId, 'CREATE_USER', 'user', userId, { role, email });

    res.status(201).json({ success: true, message: 'User created successfully.', userId });
  } catch (error: any) {
    console.error('createUser error:', error);
    res.status(500).json({ success: false, message: 'Server error creating user.' });
  }
}

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    const { action, limit = '100' } = req.query;
    let sql = `SELECT a.*, u.name as user_name, u.email as user_email, u.role as user_role
               FROM audit_logs a
               LEFT JOIN users u ON a.user_id = u.id
               WHERE 1=1`;
    const params: any[] = [];

    if (action) {
      params.push(action);
      sql += ` AND a.action = $${params.length}`;
    }

    sql += ` ORDER BY a.created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit as string, 10) || 100);

    const logs = await query<any>(sql, params);

    res.json({ success: true, logs });
  } catch (error: any) {
    console.error('getAuditLogs error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving audit logs.' });
  }
}

export async function getReports(req: Request, res: Response): Promise<void> {
  try {
    const { type, startDate, endDate } = req.query;

    if (type === 'outpass') {
      const records = await query<any>(
        `SELECT r.*, s.register_number, u.name as student_name, s.department
         FROM outpass_requests r
         JOIN students s ON r.student_id = s.id
         JOIN users u ON s.user_id = u.id
         ORDER BY r.created_at DESC LIMIT 500`
      );
      res.json({ success: true, type: 'outpass', records });
      return;
    }

    // Default: Attendance Report
    const records = await query<any>(
      `SELECT a.*, s.register_number, u.name as student_name, s.department, rm.room_number, h.name as hostel_name
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN rooms rm ON s.room_id = rm.id
       LEFT JOIN hostels h ON rm.hostel_id = h.id
       ORDER BY a.date DESC, a.time DESC LIMIT 500`
    );

    res.json({ success: true, type: 'attendance', records });
  } catch (error: any) {
    console.error('getReports error:', error);
    res.status(500).json({ success: false, message: 'Server error generating reports.' });
  }
}
