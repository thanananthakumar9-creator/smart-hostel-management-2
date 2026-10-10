"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAttendance = markAttendance;
exports.getTodayAttendance = getTodayAttendance;
exports.getAttendanceHistory = getAttendanceHistory;
const db_1 = require("../database/db");
const uuid_1 = require("uuid");
const haversine_1 = require("../utils/haversine");
const config_1 = require("../config");
const auditService_1 = require("../services/auditService");
async function markAttendance(req, res) {
    try {
        const user = req.user;
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
        const student = await (0, db_1.queryRow)(`SELECT s.*, h.name as hostel_name, h.latitude as hostel_lat, h.longitude as hostel_lon, h.radius as hostel_radius
       FROM students s
       LEFT JOIN rooms r ON s.room_id = r.id
       LEFT JOIN hostels h ON r.hostel_id = h.id
       WHERE s.user_id = $1`, [user.userId]);
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
            const defaultHostel = await (0, db_1.queryRow)(`SELECT * FROM hostels ORDER BY created_at ASC LIMIT 1`);
            if (defaultHostel) {
                hostelLat = defaultHostel.latitude;
                hostelLon = defaultHostel.longitude;
                hostelRadius = defaultHostel.radius;
                hostelName = defaultHostel.name;
            }
            else {
                hostelLat = config_1.config.defaultGeofence.latitude;
                hostelLon = config_1.config.defaultGeofence.longitude;
                hostelRadius = config_1.config.defaultGeofence.radius;
                hostelName = config_1.config.defaultGeofence.name;
            }
        }
        // Check duplicate attendance for today
        const now = new Date();
        const todayDate = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:mm
        const existing = await (0, db_1.queryRow)(`SELECT * FROM attendance WHERE student_id = $1 AND date = $2`, [student.id, todayDate]);
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
        const geofenceResult = (0, haversine_1.verifyGeofence)(latNum, lonNum, hostelLat, hostelLon, hostelRadius);
        const attendanceStatus = geofenceResult.isInside ? 'PRESENT' : 'NOT_VERIFIED';
        const attendanceId = (0, uuid_1.v4)();
        // Store attendance record
        await (0, db_1.execute)(`INSERT INTO attendance (
        id, student_id, date, time, status, latitude, longitude,
        verification_method, distance_from_hostel, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'GEOFENCE_GPS', $8, CURRENT_TIMESTAMP)`, [
            attendanceId,
            student.id,
            todayDate,
            currentTime,
            attendanceStatus,
            latNum,
            lonNum,
            geofenceResult.distanceMeters,
        ]);
        await (0, auditService_1.logAudit)(user.userId, 'MARK_ATTENDANCE', 'attendance', attendanceId, {
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
        }
        else {
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
    }
    catch (error) {
        console.error('markAttendance error:', error);
        res.status(500).json({ success: false, message: 'Server error marking attendance.' });
    }
}
async function getTodayAttendance(req, res) {
    try {
        const user = req.user;
        const student = await (0, db_1.queryRow)(`SELECT id FROM students WHERE user_id = $1`, [user.userId]);
        if (!student) {
            res.status(404).json({ success: false, message: 'Student record not found.' });
            return;
        }
        const todayDate = new Date().toISOString().split('T')[0];
        const record = await (0, db_1.queryRow)(`SELECT * FROM attendance WHERE student_id = $1 AND date = $2`, [student.id, todayDate]);
        res.json({
            success: true,
            hasMarkedToday: !!record,
            record: record || null,
        });
    }
    catch (error) {
        console.error('getTodayAttendance error:', error);
        res.status(500).json({ success: false, message: 'Server error retrieving today attendance.' });
    }
}
async function getAttendanceHistory(req, res) {
    try {
        const user = req.user;
        let records = [];
        if (user.role === 'student') {
            const student = await (0, db_1.queryRow)(`SELECT id FROM students WHERE user_id = $1`, [user.userId]);
            if (!student) {
                res.json({ success: true, records: [] });
                return;
            }
            records = await (0, db_1.query)(`SELECT a.*, s.register_number, u.name as student_name
         FROM attendance a
         JOIN students s ON a.student_id = s.id
         JOIN users u ON s.user_id = u.id
         WHERE a.student_id = $1
         ORDER BY a.date DESC, a.time DESC`, [student.id]);
        }
        else if (user.role === 'parent') {
            const parent = await (0, db_1.queryRow)(`SELECT id FROM parents WHERE user_id = $1`, [user.userId]);
            if (!parent) {
                res.json({ success: true, records: [] });
                return;
            }
            records = await (0, db_1.query)(`SELECT a.*, s.register_number, u.name as student_name
         FROM attendance a
         JOIN students s ON a.student_id = s.id
         JOIN users u ON s.user_id = u.id
         WHERE s.parent_id = $1
         ORDER BY a.date DESC, a.time DESC`, [parent.id]);
        }
        else if (user.role === 'tutor') {
            const tutor = await (0, db_1.queryRow)(`SELECT id FROM tutors WHERE user_id = $1`, [user.userId]);
            if (!tutor) {
                res.json({ success: true, records: [] });
                return;
            }
            records = await (0, db_1.query)(`SELECT a.*, s.register_number, u.name as student_name, s.department
         FROM attendance a
         JOIN students s ON a.student_id = s.id
         JOIN users u ON s.user_id = u.id
         WHERE s.tutor_id = $1
         ORDER BY a.date DESC, a.time DESC`, [tutor.id]);
        }
        else {
            // Warden / Admin
            const { date, status } = req.query;
            let sql = `SELECT a.*, s.register_number, u.name as student_name, s.department, rm.room_number, h.name as hostel_name
                 FROM attendance a
                 JOIN students s ON a.student_id = s.id
                 JOIN users u ON s.user_id = u.id
                 LEFT JOIN rooms rm ON s.room_id = rm.id
                 LEFT JOIN hostels h ON rm.hostel_id = h.id
                 WHERE 1=1`;
            const params = [];
            if (date) {
                params.push(date);
                sql += ` AND a.date = $${params.length}`;
            }
            if (status) {
                params.push(status);
                sql += ` AND a.status = $${params.length}`;
            }
            sql += ` ORDER BY a.date DESC, a.time DESC LIMIT 200`;
            records = await (0, db_1.query)(sql, params);
        }
        res.json({ success: true, records });
    }
    catch (error) {
        console.error('getAttendanceHistory error:', error);
        res.status(500).json({ success: false, message: 'Server error retrieving attendance history.' });
    }
}
