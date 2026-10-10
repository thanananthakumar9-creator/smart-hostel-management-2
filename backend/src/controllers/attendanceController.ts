import { Request, Response } from 'express';
import { query, queryRow, execute } from '../database/db';
import { v4 as uuidv4 } from 'uuid';
import { verifyGeofence } from '../utils/haversine';
import { config } from '../config';
import { logAudit } from '../services/auditService';

export async function markAttendance(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;

    if (user.role !== 'student') {
      res.status(403).json({
        success: false,
        message: 'Only students can mark attendance.',
      });
      return;
    }

    const { latitude, longitude, accuracy } = req.body;

    if (latitude === undefined || longitude === undefined) {
      res.status(400).json({
        success: false,
        message: 'Student latitude and longitude are required.',
      });
      return;
    }

    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);

    if (isNaN(latNum) || isNaN(lonNum)) {
      res.status(400).json({
        success: false,
        message: 'Invalid coordinate values.',
      });
      return;
    }

    // Find student details & assigned hostel geofence
    const student = await queryRow<any>(
      `SELECT s.*, h.name as hostel_name, h.latitude as hostel_lat, h.longitude as hostel_lon, h.radius as hostel_radius
       FROM students s
       LEFT JOIN rooms r ON s.room_id = r.id
       LEFT JOIN hostels h ON r.hostel_id = h.id
       WHERE s.user_id = $1`,
      [user.userId]
    );

    if (!student) {
      res.status(404).json({
        success: false,
        message: 'Student record not found.',
      });
      return;
    }

    // If hostel is not explicitly linked via room, use default hostel
    let hostelLat = student.hostel_lat;
    let hostelLon = student.hostel_lon;
    let hostelRadius = student.hostel_radius;
    let hostelName = student.hostel_name;

    if (hostelLat === null || hostelLat === undefined) {
      const defaultHostel = await queryRow<any>(`SELECT * FROM hostels ORDER BY created_at ASC LIMIT 1`);
      if (defaultHostel) {
        hostelLat = defaultHostel.latitude;
        hostelLon = defaultHostel.longitude;
        hostelRadius = defaultHostel.radius;
        hostelName = defaultHostel.name;
      } else {
        hostelLat = config.defaultGeofence.latitude;
        hostelLon = config.defaultGeofence.longitude;
        hostelRadius = config.defaultGeofence.radius;
        hostelName = config.defaultGeofence.name;
      }
    }

    // Check duplicate attendance for today
    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:mm

    const existing = await queryRow<any>(
      `SELECT * FROM attendance WHERE student_id = $1 AND date = $2`,
      [student.id, todayDate]
    );

    if (existing) {
      res.status(400).json({
        success: false,
        alreadyMarked: true,
        message: `Attendance has already been recorded for today (${todayDate}) at ${existing.time}. Duplicate entry prevented.`,
        record: existing,
      });
      return;
    }

    // Backend calculates Haversine distance
    const geofenceResult = verifyGeofence(
      latNum,
      lonNum,
      hostelLat,
      hostelLon,
      hostelRadius
    );

    const attendanceStatus = geofenceResult.isInside ? 'PRESENT' : 'NOT_VERIFIED';
    const attendanceId = uuidv4();

    // Store attendance record
    await execute(
      `INSERT INTO attendance (
        id, student_id, date, time, status, latitude, longitude,
        verification_method, distance_from_hostel, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'GEOFENCE_GPS', $8, CURRENT_TIMESTAMP)`,
      [
        attendanceId,
        student.id,
        todayDate,
        currentTime,
        attendanceStatus,
        latNum,
        lonNum,
        geofenceResult.distanceMeters,
      ]
    );

    await logAudit(user.userId, 'MARK_ATTENDANCE', 'attendance', attendanceId, {
      status: attendanceStatus,
      distanceMeters: geofenceResult.distanceMeters,
      allowedRadius: hostelRadius,
      isInside: geofenceResult.isInside,
    });

    if (geofenceResult.isInside) {
      res.json({
        success: true,
        status: 'PRESENT',
        isInside: true,
        distanceMeters: geofenceResult.distanceMeters,
        allowedRadiusMeters: hostelRadius,
        hostelName,
        time: currentTime,
        date: todayDate,
        message: `✓ Location Verified! You are inside the hostel premises (${geofenceResult.distanceMeters}m from center, allowed: ${hostelRadius}m). Attendance marked as PRESENT.`,
      });
    } else {
      res.status(400).json({
        success: false,
        status: 'NOT_VERIFIED',
        isInside: false,
        distanceMeters: geofenceResult.distanceMeters,
        allowedRadiusMeters: hostelRadius,
        hostelName,
        time: currentTime,
        date: todayDate,
        message: `✗ Location Verification Failed! You appear to be outside the hostel premises (${geofenceResult.distanceMeters}m away; maximum allowed radius is ${hostelRadius}m). Attendance was NOT marked.`,
      });
    }
  } catch (error: any) {
    console.error('markAttendance error:', error);
    res.status(500).json({ success: false, message: 'Server error marking attendance.' });
  }
}

export async function getTodayAttendance(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const student = await queryRow<any>(`SELECT id FROM students WHERE user_id = $1`, [user.userId]);

    if (!student) {
      res.status(404).json({ success: false, message: 'Student record not found.' });
      return;
    }

    const todayDate = new Date().toISOString().split('T')[0];
    const record = await queryRow<any>(
      `SELECT * FROM attendance WHERE student_id = $1 AND date = $2`,
      [student.id, todayDate]
    );

    res.json({
      success: true,
      hasMarkedToday: !!record,
      record: record || null,
    });
  } catch (error: any) {
    console.error('getTodayAttendance error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving today attendance.' });
  }
}

export async function getAttendanceHistory(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;
    let records: any[] = [];

    if (user.role === 'student') {
      const student = await queryRow<any>(`SELECT id FROM students WHERE user_id = $1`, [user.userId]);
      if (!student) {
        res.json({ success: true, records: [] });
        return;
      }
      records = await query<any>(
        `SELECT a.*, s.register_number, u.name as student_name
         FROM attendance a
         JOIN students s ON a.student_id = s.id
         JOIN users u ON s.user_id = u.id
         WHERE a.student_id = $1
         ORDER BY a.date DESC, a.time DESC`,
        [student.id]
      );
    } else if (user.role === 'parent') {
      const parent = await queryRow<any>(`SELECT id FROM parents WHERE user_id = $1`, [user.userId]);
      if (!parent) {
        res.json({ success: true, records: [] });
        return;
      }
      records = await query<any>(
        `SELECT a.*, s.register_number, u.name as student_name
         FROM attendance a
         JOIN students s ON a.student_id = s.id
         JOIN users u ON s.user_id = u.id
         WHERE s.parent_id = $1
         ORDER BY a.date DESC, a.time DESC`,
        [parent.id]
      );
    } else if (user.role === 'tutor') {
      const tutor = await queryRow<any>(`SELECT id FROM tutors WHERE user_id = $1`, [user.userId]);
      if (!tutor) {
        res.json({ success: true, records: [] });
        return;
      }
      records = await query<any>(
        `SELECT a.*, s.register_number, u.name as student_name, s.department
         FROM attendance a
         JOIN students s ON a.student_id = s.id
         JOIN users u ON s.user_id = u.id
         WHERE s.tutor_id = $1
         ORDER BY a.date DESC, a.time DESC`,
        [tutor.id]
      );
    } else {
      // Warden / Admin
      const { date, status } = req.query;
      let sql = `SELECT a.*, s.register_number, u.name as student_name, s.department, rm.room_number, h.name as hostel_name
                 FROM attendance a
                 JOIN students s ON a.student_id = s.id
                 JOIN users u ON s.user_id = u.id
                 LEFT JOIN rooms rm ON s.room_id = rm.id
                 LEFT JOIN hostels h ON rm.hostel_id = h.id
                 WHERE 1=1`;
      const params: any[] = [];

      if (date) {
        params.push(date);
        sql += ` AND a.date = $${params.length}`;
      }
      if (status) {
        params.push(status);
        sql += ` AND a.status = $${params.length}`;
      }

      sql += ` ORDER BY a.date DESC, a.time DESC LIMIT 200`;
      records = await query<any>(sql, params);
    }

    res.json({ success: true, records });
  } catch (error: any) {
    console.error('getAttendanceHistory error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving attendance history.' });
  }
}
