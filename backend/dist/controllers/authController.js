"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.getCurrentUser = getCurrentUser;
exports.logout = logout;
const db_1 = require("../database/db");
const auth_1 = require("../utils/auth");
const auditService_1 = require("../services/auditService");
async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: 'Please provide both email and password.',
            });
            return;
        }
        const normalizedEmail = email.trim().toLowerCase();
        const user = await (0, db_1.queryRow)(`SELECT * FROM users WHERE LOWER(email) = $1`, [normalizedEmail]);
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials. User not found.',
            });
            return;
        }
        if (user.status !== 'ACTIVE') {
            res.status(403).json({
                success: false,
                message: 'Your account is inactive or suspended. Please contact administrator.',
            });
            return;
        }
        const isMatch = await (0, auth_1.comparePassword)(password, user.password_hash);
        if (!isMatch) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials. Password incorrect.',
            });
            return;
        }
        // Load additional role-specific profile details
        let profileData = {};
        if (user.role === 'student') {
            const student = await (0, db_1.queryRow)(`SELECT s.*, r.room_number, h.name as hostel_name, h.latitude as hostel_lat, h.longitude as hostel_lon, h.radius as hostel_radius
         FROM students s
         LEFT JOIN rooms r ON s.room_id = r.id
         LEFT JOIN hostels h ON r.hostel_id = h.id
         WHERE s.user_id = $1`, [user.id]);
            if (student)
                profileData = { student };
        }
        else if (user.role === 'tutor') {
            const tutor = await (0, db_1.queryRow)(`SELECT * FROM tutors WHERE user_id = $1`, [user.id]);
            if (tutor)
                profileData = { tutor };
        }
        else if (user.role === 'parent') {
            const parent = await (0, db_1.queryRow)(`SELECT p.*, s.id as linked_student_id, u.name as student_name, s.register_number
         FROM parents p
         LEFT JOIN students s ON s.parent_id = p.id
         LEFT JOIN users u ON s.user_id = u.id
         WHERE p.user_id = $1`, [user.id]);
            if (parent)
                profileData = { parent };
        }
        const token = (0, auth_1.generateToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
        });
        await (0, auditService_1.logAudit)(user.id, 'LOGIN', 'user', user.id, { email: user.email, role: user.role });
        res.json({
            success: true,
            message: 'Login successful.',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                status: user.status,
                ...profileData,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'An internal server error occurred during login.',
        });
    }
}
async function getCurrentUser(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated.' });
            return;
        }
        const user = await (0, db_1.queryRow)(`SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = $1`, [req.user.userId]);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found.' });
            return;
        }
        let profileData = {};
        if (user.role === 'student') {
            const student = await (0, db_1.queryRow)(`SELECT s.*, r.room_number, h.name as hostel_name, h.latitude as hostel_lat, h.longitude as hostel_lon, h.radius as hostel_radius
         FROM students s
         LEFT JOIN rooms r ON s.room_id = r.id
         LEFT JOIN hostels h ON r.hostel_id = h.id
         WHERE s.user_id = $1`, [user.id]);
            if (student)
                profileData = { student };
        }
        else if (user.role === 'tutor') {
            const tutor = await (0, db_1.queryRow)(`SELECT * FROM tutors WHERE user_id = $1`, [user.id]);
            if (tutor)
                profileData = { tutor };
        }
        else if (user.role === 'parent') {
            const parent = await (0, db_1.queryRow)(`SELECT p.*, s.id as linked_student_id, u.name as student_name, s.register_number
         FROM parents p
         LEFT JOIN students s ON s.parent_id = p.id
         LEFT JOIN users u ON s.user_id = u.id
         WHERE p.user_id = $1`, [user.id]);
            if (parent)
                profileData = { parent };
        }
        res.json({
            success: true,
            user: {
                ...user,
                ...profileData,
            },
        });
    }
    catch (error) {
        console.error('getCurrentUser error:', error);
        res.status(500).json({ success: false, message: 'Server error retrieving user.' });
    }
}
async function logout(req, res) {
    if (req.user) {
        await (0, auditService_1.logAudit)(req.user.userId, 'LOGOUT', 'user', req.user.userId);
    }
    res.json({
        success: true,
        message: 'Logged out successfully.',
    });
}
