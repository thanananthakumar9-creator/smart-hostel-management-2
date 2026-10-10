"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOutpassRequest = createOutpassRequest;
exports.getOutpassRequests = getOutpassRequests;
exports.getOutpassById = getOutpassById;
exports.approveOutpass = approveOutpass;
exports.rejectOutpass = rejectOutpass;
exports.getOutpassQr = getOutpassQr;
exports.verifyOutpass = verifyOutpass;
const db_1 = require("../database/db");
const uuid_1 = require("uuid");
const qrcode_1 = __importDefault(require("qrcode"));
const notificationService_1 = require("../services/notificationService");
const auditService_1 = require("../services/auditService");
async function createOutpassRequest(req, res) {
    try {
        const user = req.user;
        // Find student record
        const student = await (0, db_1.queryRow)(`SELECT s.*, u.name as student_name, p.user_id as parent_user_id, t.user_id as tutor_user_id
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN parents p ON s.parent_id = p.id
       LEFT JOIN tutors t ON s.tutor_id = t.id
       WHERE s.user_id = $1`, [user.userId]);
        if (!student) {
            res.status(403).json({
                success: false,
                message: 'Student record not found for this user.',
            });
            return;
        }
        const { purpose, destination, reason, leaving_date, leaving_time, return_date, return_time, attachment_url, } = req.body;
        if (!purpose || !destination || !reason || !leaving_date || !leaving_time || !return_date || !return_time) {
            res.status(400).json({
                success: false,
                message: 'All fields (purpose, destination, reason, leaving date/time, return date/time) are required.',
            });
            return;
        }
        // Validate datetime: Return time must be after leaving time
        const leavingDateTime = new Date(`${leaving_date}T${leaving_time}`);
        const returnDateTime = new Date(`${return_date}T${return_time}`);
        if (isNaN(leavingDateTime.getTime()) || isNaN(returnDateTime.getTime())) {
            res.status(400).json({
                success: false,
                message: 'Invalid leaving or return date/time format.',
            });
            return;
        }
        if (returnDateTime <= leavingDateTime) {
            res.status(400).json({
                success: false,
                message: 'Expected return time must be strictly after the leaving time.',
            });
            return;
        }
        const requestId = (0, uuid_1.v4)();
        const qrToken = (0, uuid_1.v4)();
        // Insert outpass request
        await (0, db_1.execute)(`INSERT INTO outpass_requests (
        id, student_id, purpose, destination, reason,
        leaving_date, leaving_time, return_date, return_time,
        attachment_url, qr_token, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [
            requestId,
            student.id,
            purpose.trim(),
            destination.trim(),
            reason.trim(),
            leaving_date,
            leaving_time,
            return_date,
            return_time,
            attachment_url || null,
            qrToken,
        ]);
        // Find a warden user for approval
        const wardenUser = await (0, db_1.queryRow)(`SELECT id FROM users WHERE role = 'warden' AND status = 'ACTIVE' LIMIT 1`);
        // Find parent user ID
        let parentUserId = student.parent_user_id;
        if (!parentUserId) {
            const anyParent = await (0, db_1.queryRow)(`SELECT id FROM users WHERE role = 'parent' AND status = 'ACTIVE' LIMIT 1`);
            parentUserId = anyParent?.id;
        }
        // Find tutor user ID
        let tutorUserId = student.tutor_user_id;
        if (!tutorUserId) {
            const anyTutor = await (0, db_1.queryRow)(`SELECT id FROM users WHERE role = 'tutor' AND status = 'ACTIVE' LIMIT 1`);
            tutorUserId = anyTutor?.id;
        }
        // Insert 3 multi-level approvals: Tutor, Parent, Warden
        const approverConfigs = [
            { role: 'tutor', userId: tutorUserId || user.userId },
            { role: 'parent', userId: parentUserId || user.userId },
            { role: 'warden', userId: wardenUser?.id || user.userId },
        ];
        for (const app of approverConfigs) {
            const approvalId = (0, uuid_1.v4)();
            await (0, db_1.execute)(`INSERT INTO outpass_approvals (
          id, request_id, approver_id, approver_role, status, comments, created_at
        ) VALUES ($1, $2, $3, $4, 'PENDING', NULL, CURRENT_TIMESTAMP)`, [approvalId, requestId, app.userId, app.role]);
        }
        // Send in-app notifications to Tutor, Parent, and Warden
        const notifyUserIds = [tutorUserId, parentUserId, wardenUser?.id].filter(Boolean);
        await (0, notificationService_1.createNotifications)(notifyUserIds, 'New Out-Pass Request Submitted', `Student ${student.student_name} (${student.register_number}) requested an out-pass to ${destination} from ${leaving_date} ${leaving_time} to ${return_date} ${return_time}.`);
        await (0, auditService_1.logAudit)(user.userId, 'CREATE_OUTPASS', 'outpass_request', requestId, {
            studentId: student.id,
            destination,
            purpose,
        });
        res.status(201).json({
            success: true,
            message: 'Out-pass request created successfully. Awaiting multi-level approvals.',
            requestId,
        });
    }
    catch (error) {
        console.error('createOutpassRequest error:', error);
        res.status(500).json({ success: false, message: 'Server error creating out-pass request.' });
    }
}
async function getOutpassRequests(req, res) {
    try {
        const user = req.user;
        let requests = [];
        if (user.role === 'student') {
            const student = await (0, db_1.queryRow)(`SELECT id FROM students WHERE user_id = $1`, [user.userId]);
            if (!student) {
                res.json({ success: true, requests: [] });
                return;
            }
            requests = await (0, db_1.query)(`SELECT r.*, s.register_number, u.name as student_name, s.department, rm.room_number, h.name as hostel_name
         FROM outpass_requests r
         JOIN students s ON r.student_id = s.id
         JOIN users u ON s.user_id = u.id
         LEFT JOIN rooms rm ON s.room_id = rm.id
         LEFT JOIN hostels h ON rm.hostel_id = h.id
         WHERE r.student_id = $1
         ORDER BY r.created_at DESC`, [student.id]);
        }
        else if (user.role === 'parent') {
            const parent = await (0, db_1.queryRow)(`SELECT id FROM parents WHERE user_id = $1`, [user.userId]);
            if (!parent) {
                res.json({ success: true, requests: [] });
                return;
            }
            requests = await (0, db_1.query)(`SELECT r.*, s.register_number, u.name as student_name, s.department, rm.room_number, h.name as hostel_name
         FROM outpass_requests r
         JOIN students s ON r.student_id = s.id
         JOIN users u ON s.user_id = u.id
         LEFT JOIN rooms rm ON s.room_id = rm.id
         LEFT JOIN hostels h ON rm.hostel_id = h.id
         WHERE s.parent_id = $1
         ORDER BY r.created_at DESC`, [parent.id]);
        }
        else if (user.role === 'tutor') {
            const tutor = await (0, db_1.queryRow)(`SELECT id FROM tutors WHERE user_id = $1`, [user.userId]);
            if (!tutor) {
                res.json({ success: true, requests: [] });
                return;
            }
            requests = await (0, db_1.query)(`SELECT r.*, s.register_number, u.name as student_name, s.department, rm.room_number, h.name as hostel_name
         FROM outpass_requests r
         JOIN students s ON r.student_id = s.id
         JOIN users u ON s.user_id = u.id
         LEFT JOIN rooms rm ON s.room_id = rm.id
         LEFT JOIN hostels h ON rm.hostel_id = h.id
         WHERE s.tutor_id = $1
         ORDER BY r.created_at DESC`, [tutor.id]);
        }
        else {
            // Warden, Admin, Security
            requests = await (0, db_1.query)(`SELECT r.*, s.register_number, u.name as student_name, s.department, rm.room_number, h.name as hostel_name
         FROM outpass_requests r
         JOIN students s ON r.student_id = s.id
         JOIN users u ON s.user_id = u.id
         LEFT JOIN rooms rm ON s.room_id = rm.id
         LEFT JOIN hostels h ON rm.hostel_id = h.id
         ORDER BY r.created_at DESC`);
        }
        // Attach individual approvals breakdown for each request
        for (const r of requests) {
            const approvals = await (0, db_1.query)(`SELECT a.*, u.name as approver_name
         FROM outpass_approvals a
         LEFT JOIN users u ON a.approver_id = u.id
         WHERE a.request_id = $1
         ORDER BY CASE a.approver_role
           WHEN 'tutor' THEN 1
           WHEN 'parent' THEN 2
           WHEN 'warden' THEN 3
           ELSE 4
         END`, [r.id]);
            r.approvals = approvals;
        }
        res.json({ success: true, requests });
    }
    catch (error) {
        console.error('getOutpassRequests error:', error);
        res.status(500).json({ success: false, message: 'Server error retrieving out-pass requests.' });
    }
}
async function getOutpassById(req, res) {
    try {
        const { id } = req.params;
        const request = await (0, db_1.queryRow)(`SELECT r.*, s.register_number, u.name as student_name, u.phone as student_phone, s.department, s.year, rm.room_number, h.name as hostel_name
       FROM outpass_requests r
       JOIN students s ON r.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN rooms rm ON s.room_id = rm.id
       LEFT JOIN hostels h ON rm.hostel_id = h.id
       WHERE r.id = $1`, [id]);
        if (!request) {
            res.status(404).json({ success: false, message: 'Out-pass request not found.' });
            return;
        }
        const approvals = await (0, db_1.query)(`SELECT a.*, u.name as approver_name
       FROM outpass_approvals a
       LEFT JOIN users u ON a.approver_id = u.id
       WHERE a.request_id = $1
       ORDER BY CASE a.approver_role
         WHEN 'tutor' THEN 1
         WHEN 'parent' THEN 2
         WHEN 'warden' THEN 3
         ELSE 4
       END`, [id]);
        request.approvals = approvals;
        res.json({ success: true, request });
    }
    catch (error) {
        console.error('getOutpassById error:', error);
        res.status(500).json({ success: false, message: 'Server error retrieving out-pass.' });
    }
}
async function approveOutpass(req, res) {
    try {
        const { id } = req.params;
        const { comments } = req.body;
        const user = req.user;
        // Check allowed roles
        if (!['tutor', 'parent', 'warden', 'admin'].includes(user.role)) {
            res.status(403).json({
                success: false,
                message: 'Security or students cannot approve out-pass requests.',
            });
            return;
        }
        const outpass = await (0, db_1.queryRow)(`SELECT r.*, s.user_id as student_user_id, u.name as student_name
       FROM outpass_requests r
       JOIN students s ON r.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE r.id = $1`, [id]);
        if (!outpass) {
            res.status(404).json({ success: false, message: 'Out-pass request not found.' });
            return;
        }
        if (outpass.status === 'REJECTED') {
            res.status(400).json({
                success: false,
                message: 'Cannot approve a request that has already been rejected.',
            });
            return;
        }
        // Determine approver role to update
        const targetRole = user.role === 'admin' ? (req.body.approver_role || 'warden') : user.role;
        // Update the approval record
        await (0, db_1.execute)(`UPDATE outpass_approvals
       SET status = 'APPROVED', comments = $1, approver_id = $2, approved_at = CURRENT_TIMESTAMP
       WHERE request_id = $3 AND approver_role = $4`, [comments || 'Approved', user.userId, id, targetRole]);
        // Fetch all 3 approvals to check if complete
        const approvals = await (0, db_1.query)(`SELECT approver_role, status FROM outpass_approvals WHERE request_id = $1`, [id]);
        const tutorApproved = approvals.some((a) => a.approver_role === 'tutor' && a.status === 'APPROVED');
        const parentApproved = approvals.some((a) => a.approver_role === 'parent' && a.status === 'APPROVED');
        const wardenApproved = approvals.some((a) => a.approver_role === 'warden' && a.status === 'APPROVED');
        let isFullyApproved = tutorApproved && parentApproved && wardenApproved;
        if (isFullyApproved) {
            await (0, db_1.execute)(`UPDATE outpass_requests
         SET status = 'APPROVED', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`, [id]);
            // Notify student of full approval
            await (0, notificationService_1.createNotification)(outpass.student_user_id, 'Out-Pass Fully Approved!', `Your out-pass request to ${outpass.destination} has been approved by Tutor, Parent, and Warden. Your Digital QR Pass is now active!`);
        }
        else {
            // Notify student of this single approval
            await (0, notificationService_1.createNotification)(outpass.student_user_id, `Out-Pass Approved by ${targetRole.toUpperCase()}`, `Your out-pass request has been approved by ${targetRole.toUpperCase()}. Awaiting remaining approvals.`);
        }
        await (0, auditService_1.logAudit)(user.userId, 'APPROVE_OUTPASS', 'outpass_request', id, {
            role: targetRole,
            isFullyApproved,
            comments,
        });
        res.json({
            success: true,
            message: isFullyApproved
                ? 'All required approvers (Tutor, Parent, Warden) have approved! Digital Out-Pass generated.'
                : `Approved by ${targetRole}. Awaiting remaining approvals.`,
            isFullyApproved,
        });
    }
    catch (error) {
        console.error('approveOutpass error:', error);
        res.status(500).json({ success: false, message: 'Server error approving out-pass.' });
    }
}
async function rejectOutpass(req, res) {
    try {
        const { id } = req.params;
        const { comments } = req.body;
        const user = req.user;
        if (!['tutor', 'parent', 'warden', 'admin'].includes(user.role)) {
            res.status(403).json({
                success: false,
                message: 'Security or students cannot reject out-pass requests.',
            });
            return;
        }
        const outpass = await (0, db_1.queryRow)(`SELECT r.*, s.user_id as student_user_id, u.name as student_name
       FROM outpass_requests r
       JOIN students s ON r.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE r.id = $1`, [id]);
        if (!outpass) {
            res.status(404).json({ success: false, message: 'Out-pass request not found.' });
            return;
        }
        const targetRole = user.role === 'admin' ? (req.body.approver_role || 'warden') : user.role;
        // Update approval status to REJECTED
        await (0, db_1.execute)(`UPDATE outpass_approvals
       SET status = 'REJECTED', comments = $1, approver_id = $2, approved_at = CURRENT_TIMESTAMP
       WHERE request_id = $3 AND approver_role = $4`, [comments || 'Rejected', user.userId, id, targetRole]);
        // According to system rules: If any approver rejects, mark request as REJECTED
        await (0, db_1.execute)(`UPDATE outpass_requests
       SET status = 'REJECTED', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`, [id]);
        await (0, notificationService_1.createNotification)(outpass.student_user_id, `Out-Pass Rejected by ${targetRole.toUpperCase()}`, `Your out-pass request to ${outpass.destination} was rejected by ${targetRole.toUpperCase()}. Reason: ${comments || 'No comment provided'}`);
        await (0, auditService_1.logAudit)(user.userId, 'REJECT_OUTPASS', 'outpass_request', id, {
            role: targetRole,
            comments,
        });
        res.json({
            success: true,
            message: `Out-pass request has been rejected by ${targetRole}.`,
        });
    }
    catch (error) {
        console.error('rejectOutpass error:', error);
        res.status(500).json({ success: false, message: 'Server error rejecting out-pass.' });
    }
}
async function getOutpassQr(req, res) {
    try {
        const { id } = req.params;
        const request = await (0, db_1.queryRow)(`SELECT r.*, s.register_number, u.name as student_name
       FROM outpass_requests r
       JOIN students s ON r.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE r.id = $1`, [id]);
        if (!request) {
            res.status(404).json({ success: false, message: 'Out-pass not found.' });
            return;
        }
        if (request.status !== 'APPROVED') {
            res.status(400).json({
                success: false,
                message: 'QR code is only generated once the out-pass is APPROVED by all authorities.',
            });
            return;
        }
        // Secure payload inside QR: only the verification token
        const qrData = JSON.stringify({
            token: request.qr_token,
            passId: request.id,
        });
        const qrDataUrl = await qrcode_1.default.toDataURL(qrData, {
            width: 320,
            margin: 2,
            color: {
                dark: '#0f172a',
                light: '#ffffff',
            },
        });
        res.json({
            success: true,
            qrDataUrl,
            token: request.qr_token,
            passId: request.id,
            studentName: request.student_name,
            registerNumber: request.register_number,
            destination: request.destination,
            leavingDate: request.leaving_date,
            leavingTime: request.leaving_time,
            returnDate: request.return_date,
            returnTime: request.return_time,
        });
    }
    catch (error) {
        console.error('getOutpassQr error:', error);
        res.status(500).json({ success: false, message: 'Server error generating QR code.' });
    }
}
async function verifyOutpass(req, res) {
    try {
        const { token } = req.params;
        const user = req.user;
        // Search by either qr_token or pass id
        const request = await (0, db_1.queryRow)(`SELECT r.*, s.register_number, u.name as student_name, s.department, rm.room_number, h.name as hostel_name
       FROM outpass_requests r
       JOIN students s ON r.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN rooms rm ON s.room_id = rm.id
       LEFT JOIN hostels h ON rm.hostel_id = h.id
       WHERE r.qr_token = $1 OR r.id = $1`, [token]);
        if (!request) {
            res.status(404).json({
                success: false,
                status: 'INVALID',
                message: 'INVALID OUT-PASS. No matching approved record found in system.',
            });
            return;
        }
        const now = new Date();
        const returnDateTime = new Date(`${request.return_date}T${request.return_time}`);
        const isExpired = !isNaN(returnDateTime.getTime()) && now > returnDateTime;
        let verificationStatus = 'VALID';
        let message = 'OUT-PASS VERIFIED: VALID';
        if (request.status !== 'APPROVED') {
            verificationStatus = 'INVALID';
            message = `INVALID OUT-PASS (Current Status: ${request.status})`;
        }
        else if (isExpired) {
            verificationStatus = 'EXPIRED';
            message = 'EXPIRED OUT-PASS. Expected return time has passed.';
        }
        if (user) {
            await (0, auditService_1.logAudit)(user.userId, 'SECURITY_VERIFY_OUTPASS', 'outpass_request', request.id, {
                token,
                verificationStatus,
            });
        }
        res.json({
            success: true,
            verificationStatus,
            message,
            pass: {
                id: request.id,
                studentName: request.student_name,
                registerNumber: request.register_number,
                department: request.department,
                hostelName: request.hostel_name || 'Campus Hostel',
                roomNumber: request.room_number || 'N/A',
                destination: request.destination,
                purpose: request.purpose,
                leavingDate: request.leaving_date,
                leavingTime: request.leaving_time,
                returnDate: request.return_date,
                returnTime: request.return_time,
                status: request.status,
            },
        });
    }
    catch (error) {
        console.error('verifyOutpass error:', error);
        res.status(500).json({ success: false, message: 'Server error during QR verification.' });
    }
}
