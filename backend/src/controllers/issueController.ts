import { Request, Response } from 'express';
import { query, queryRow, execute } from '../database/db';
import { v4 as uuidv4 } from 'uuid';
import { createNotification, createNotifications } from '../services/notificationService';
import { logAudit } from '../services/auditService';

export async function createIssue(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { category, description, priority, room_number, photo_url } = req.body;

    if (!category || !description) {
      res.status(400).json({
        success: false,
        message: 'Category and description are required.',
      });
      return;
    }

    const validCategories = [
      'Electrical',
      'Plumbing',
      'Water',
      'Internet',
      'Furniture',
      'Cleaning',
      'Room Maintenance',
      'Other',
    ];

    if (!validCategories.includes(category)) {
      res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
      });
      return;
    }

    // Get student details
    const student = await queryRow<any>(
      `SELECT s.*, u.name as student_name, r.id as room_id, r.room_number as student_room
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN rooms r ON s.room_id = r.id
       WHERE s.user_id = $1`,
      [user.userId]
    );

    if (!student) {
      res.status(403).json({
        success: false,
        message: 'Only registered students can report issues.',
      });
      return;
    }

    // If room is specified by text, look up room or use student's room
    let roomId = student.room_id;
    if (room_number) {
      const room = await queryRow<any>(`SELECT id FROM rooms WHERE room_number = $1 LIMIT 1`, [room_number]);
      if (room) roomId = room.id;
    }

    const issueId = uuidv4();
    const issuePriority = priority || 'MEDIUM';

    await execute(
      `INSERT INTO issues (
        id, student_id, room_id, category, description, photo_url,
        priority, status, assigned_to, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'NEW', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        issueId,
        student.id,
        roomId || null,
        category,
        description.trim(),
        photo_url || null,
        issuePriority,
      ]
    );

    // Initial update record in timeline
    const updateId = uuidv4();
    await execute(
      `INSERT INTO issue_updates (id, issue_id, updated_by, comment, status, created_at)
       VALUES ($1, $2, $3, $4, 'NEW', CURRENT_TIMESTAMP)`,
      [updateId, issueId, user.userId, 'Issue reported by student. Status set to NEW.']
    );

    // Notify Wardens
    const wardens = await query<any>(`SELECT id FROM users WHERE role = 'warden' AND status = 'ACTIVE'`);
    await createNotifications(
      wardens.map((w) => w.id),
      'New Hostel Issue Reported',
      `[${issuePriority}] ${category} issue reported in Room ${room_number || student.student_room || 'General'}: "${description.substring(0, 60)}..."`
    );

    await logAudit(user.userId, 'CREATE_ISSUE', 'issue', issueId, {
      category,
      priority: issuePriority,
    });

    res.status(201).json({
      success: true,
      message: 'Hostel complaint reported successfully.',
      issueId,
    });
  } catch (error: any) {
    console.error('createIssue error:', error);
    res.status(500).json({ success: false, message: 'Server error creating issue.' });
  }
}

export async function getIssues(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { status, category, priority } = req.query;

    let sql = `SELECT i.*, s.register_number, u.name as student_name, u.phone as student_phone,
                      rm.room_number, h.name as hostel_name, staff.name as assigned_to_name
               FROM issues i
               JOIN students s ON i.student_id = s.id
               JOIN users u ON s.user_id = u.id
               LEFT JOIN rooms rm ON i.room_id = rm.id
               LEFT JOIN hostels h ON rm.hostel_id = h.id
               LEFT JOIN users staff ON i.assigned_to = staff.id
               WHERE 1=1`;
    const params: any[] = [];

    if (user.role === 'student') {
      const student = await queryRow<any>(`SELECT id FROM students WHERE user_id = $1`, [user.userId]);
      if (!student) {
        res.json({ success: true, issues: [] });
        return;
      }
      params.push(student.id);
      sql += ` AND i.student_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND i.status = $${params.length}`;
    }

    if (category) {
      params.push(category);
      sql += ` AND i.category = $${params.length}`;
    }

    if (priority) {
      params.push(priority);
      sql += ` AND i.priority = $${params.length}`;
    }

    sql += ` ORDER BY i.created_at DESC`;
    const issues = await query<any>(sql, params);

    res.json({ success: true, issues });
  } catch (error: any) {
    console.error('getIssues error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving issues.' });
  }
}

export async function getIssueById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const issue = await queryRow<any>(
      `SELECT i.*, s.register_number, u.name as student_name, u.phone as student_phone,
              s.user_id as student_user_id, rm.room_number, h.name as hostel_name, staff.name as assigned_to_name
       FROM issues i
       JOIN students s ON i.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN rooms rm ON i.room_id = rm.id
       LEFT JOIN hostels h ON rm.hostel_id = h.id
       LEFT JOIN users staff ON i.assigned_to = staff.id
       WHERE i.id = $1`,
      [id]
    );

    if (!issue) {
      res.status(404).json({ success: false, message: 'Issue not found.' });
      return;
    }

    const updates = await query<any>(
      `SELECT u.*, us.name as updated_by_name, us.role as updated_by_role
       FROM issue_updates u
       JOIN users us ON u.updated_by = us.id
       WHERE u.issue_id = $1
       ORDER BY u.created_at ASC`,
      [id]
    );

    issue.updates = updates;

    res.json({ success: true, issue });
  } catch (error: any) {
    console.error('getIssueById error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving issue.' });
  }
}

export async function updateIssue(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, priority, assigned_to, comment } = req.body;
    const user = req.user!;

    if (!['warden', 'admin'].includes(user.role)) {
      res.status(403).json({
        success: false,
        message: 'Only warden or admin can update issue status and assignment.',
      });
      return;
    }

    const issue = await queryRow<any>(
      `SELECT i.*, s.user_id as student_user_id
       FROM issues i
       JOIN students s ON i.student_id = s.id
       WHERE i.id = $1`,
      [id]
    );

    if (!issue) {
      res.status(404).json({ success: false, message: 'Issue not found.' });
      return;
    }

    const newStatus = status || issue.status;
    const newPriority = priority || issue.priority;
    const newAssignedTo = assigned_to !== undefined ? (assigned_to || null) : issue.assigned_to;

    await execute(
      `UPDATE issues
       SET status = $1, priority = $2, assigned_to = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [newStatus, newPriority, newAssignedTo, id]
    );

    const updateComment = comment || `Issue updated to ${newStatus}${newAssignedTo ? ' and assigned.' : '.'}`;
    const updateId = uuidv4();
    await execute(
      `INSERT INTO issue_updates (id, issue_id, updated_by, comment, status, created_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      [updateId, id, user.userId, updateComment, newStatus]
    );

    // Notify student about issue status change
    await createNotification(
      issue.student_user_id,
      `Hostel Issue Update: ${newStatus}`,
      `Your reported issue (${issue.category}) has been updated to "${newStatus}". ${comment ? `Note: ${comment}` : ''}`
    );

    await logAudit(user.userId, 'UPDATE_ISSUE', 'issue', id, {
      oldStatus: issue.status,
      newStatus,
      newPriority,
      assigned_to: newAssignedTo,
    });

    res.json({
      success: true,
      message: 'Issue updated successfully.',
      status: newStatus,
    });
  } catch (error: any) {
    console.error('updateIssue error:', error);
    res.status(500).json({ success: false, message: 'Server error updating issue.' });
  }
}

export async function addIssueComment(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const user = req.user!;

    if (!comment || !comment.trim()) {
      res.status(400).json({ success: false, message: 'Comment text is required.' });
      return;
    }

    const issue = await queryRow<any>(
      `SELECT i.*, s.user_id as student_user_id
       FROM issues i
       JOIN students s ON i.student_id = s.id
       WHERE i.id = $1`,
      [id]
    );

    if (!issue) {
      res.status(404).json({ success: false, message: 'Issue not found.' });
      return;
    }

    const updateId = uuidv4();
    await execute(
      `INSERT INTO issue_updates (id, issue_id, updated_by, comment, status, created_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      [updateId, id, user.userId, comment.trim(), issue.status]
    );

    // If staff commented, notify student. If student commented, notify staff/warden.
    if (user.userId !== issue.student_user_id) {
      await createNotification(
        issue.student_user_id,
        'New Comment on your Hostel Issue',
        `${user.name}: "${comment.trim()}"`
      );
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully.',
    });
  } catch (error: any) {
    console.error('addIssueComment error:', error);
    res.status(500).json({ success: false, message: 'Server error adding comment.' });
  }
}
