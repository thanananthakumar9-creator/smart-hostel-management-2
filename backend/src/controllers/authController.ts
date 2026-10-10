import { Request, Response } from 'express';
import { queryRow, query } from '../database/db';
import { comparePassword, generateToken } from '../utils/auth';
import { logAudit } from '../services/auditService';

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const {
      email,
      identifier,
      roll_number,
      admin_id,
      teacher_id,
      password,
      role,
    } = req.body;

    const rawId = (identifier || roll_number || admin_id || teacher_id || email || '').trim();

    if (!rawId) {
      let missingMsg = 'Please enter your credentials.';
      if (role === 'student') missingMsg = 'Please enter your roll number.';
      else if (role === 'admin') missingMsg = 'Please enter your admin ID.';
      else if (role === 'teacher' || role === 'tutor') missingMsg = 'Please enter your teacher ID.';
      res.status(400).json({ success: false, message: missingMsg });
      return;
    }

    if (!password) {
      res.status(400).json({
        success: false,
        message: 'Please enter your password.',
      });
      return;
    }

    // Normalize expected role
    const normalizedRole = role ? (role.toLowerCase() === 'teacher' ? 'tutor' : role.toLowerCase()) : null;

    // Search for user by identifier, student register number, teacher employee_id, or email.
    // NOTE: SQLite translates $1→$4 to ?, so each placeholder needs its own param value.
    const user = await queryRow<any>(
      `SELECT u.*, s.register_number, t.employee_id
       FROM users u
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN tutors t ON t.user_id = u.id
       WHERE LOWER(COALESCE(u.identifier, '')) = LOWER($1)
          OR LOWER(COALESCE(s.register_number, '')) = LOWER($2)
          OR LOWER(COALESCE(t.employee_id, '')) = LOWER($3)
          OR LOWER(u.email) = LOWER($4)`,
      [rawId, rawId, rawId, rawId]
    );

    if (!user) {
      let notFoundMsg = 'Invalid credentials.';
      if (normalizedRole === 'student') notFoundMsg = 'Invalid roll number or password.';
      else if (normalizedRole === 'admin') notFoundMsg = 'Invalid admin ID or password.';
      else if (normalizedRole === 'tutor') notFoundMsg = 'Invalid teacher ID or password.';
      res.status(401).json({
        success: false,
        message: notFoundMsg,
      });
      return;
    }

    // Role verification: If a specific role was requested, verify user belongs to that role!
    if (normalizedRole && user.role !== normalizedRole) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials for the selected role.',
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

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      let badPassMsg = 'Invalid credentials.';
      if (normalizedRole === 'student' || user.role === 'student') badPassMsg = 'Invalid roll number or password.';
      else if (normalizedRole === 'admin' || user.role === 'admin') badPassMsg = 'Invalid admin ID or password.';
      else if (normalizedRole === 'tutor' || user.role === 'tutor') badPassMsg = 'Invalid teacher ID or password.';
      res.status(401).json({
        success: false,
        message: badPassMsg,
      });
      return;
    }

    // Load additional role-specific profile details
    let profileData: any = {};
    if (user.role === 'student') {
      const student = await queryRow<any>(
        `SELECT s.*, r.room_number, h.name as hostel_name, h.latitude as hostel_lat, h.longitude as hostel_lon, h.radius as hostel_radius
         FROM students s
         LEFT JOIN rooms r ON s.room_id = r.id
         LEFT JOIN hostels h ON r.hostel_id = h.id
         WHERE s.user_id = $1`,
        [user.id]
      );
      if (student) profileData = { student };
    } else if (user.role === 'tutor') {
      const tutor = await queryRow<any>(
        `SELECT * FROM tutors WHERE user_id = $1`,
        [user.id]
      );
      if (tutor) profileData = { tutor };
    } else if (user.role === 'parent') {
      const parent = await queryRow<any>(
        `SELECT p.*, s.id as linked_student_id, u.name as student_name, s.register_number
         FROM parents p
         LEFT JOIN students s ON s.parent_id = p.id
         LEFT JOIN users u ON s.user_id = u.id
         WHERE p.user_id = $1`,
        [user.id]
      );
      if (parent) profileData = { parent };
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    await logAudit(user.id, 'LOGIN', 'user', user.id, { email: user.email, role: user.role });

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        identifier: user.identifier,
        role: user.role,
        status: user.status,
        ...profileData,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An internal server error occurred during login.',
    });
  }
}

export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const user = await queryRow<any>(
      `SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = $1`,
      [req.user.userId]
    );

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    let profileData: any = {};
    if (user.role === 'student') {
      const student = await queryRow<any>(
        `SELECT s.*, r.room_number, h.name as hostel_name, h.latitude as hostel_lat, h.longitude as hostel_lon, h.radius as hostel_radius
         FROM students s
         LEFT JOIN rooms r ON s.room_id = r.id
         LEFT JOIN hostels h ON r.hostel_id = h.id
         WHERE s.user_id = $1`,
        [user.id]
      );
      if (student) profileData = { student };
    } else if (user.role === 'tutor') {
      const tutor = await queryRow<any>(
        `SELECT * FROM tutors WHERE user_id = $1`,
        [user.id]
      );
      if (tutor) profileData = { tutor };
    } else if (user.role === 'parent') {
      const parent = await queryRow<any>(
        `SELECT p.*, s.id as linked_student_id, u.name as student_name, s.register_number
         FROM parents p
         LEFT JOIN students s ON s.parent_id = p.id
         LEFT JOIN users u ON s.user_id = u.id
         WHERE p.user_id = $1`,
        [user.id]
      );
      if (parent) profileData = { parent };
    }

    res.json({
      success: true,
      user: {
        ...user,
        ...profileData,
      },
    });
  } catch (error: any) {
    console.error('getCurrentUser error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving user.' });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  if (req.user) {
    await logAudit(req.user.userId, 'LOGOUT', 'user', req.user.userId);
  }
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
}
