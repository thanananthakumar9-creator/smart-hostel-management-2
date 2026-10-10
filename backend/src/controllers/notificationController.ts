import { Request, Response } from 'express';
import { query, queryRow, execute } from '../database/db';

export async function getNotifications(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const notifications = await query<any>(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 50`,
      [user.userId]
    );

    const unreadCountRow = await queryRow<any>(
      `SELECT COUNT(*) as unread_count FROM notifications
       WHERE user_id = $1 AND (is_read = 0 OR is_read = false)`,
      [user.userId]
    );

    res.json({
      success: true,
      unreadCount: parseInt(unreadCountRow?.unread_count || '0', 10),
      notifications: notifications.map((n) => ({
        ...n,
        is_read: Boolean(n.is_read),
      })),
    });
  } catch (error: any) {
    console.error('getNotifications error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving notifications.' });
  }
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user!;

    await execute(
      `UPDATE notifications SET is_read = 1 WHERE id = $1 AND user_id = $2`,
      [id, user.userId]
    );

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error: any) {
    console.error('markAsRead error:', error);
    res.status(500).json({ success: false, message: 'Server error updating notification.' });
  }
}

export async function markAllAsRead(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user!;

    await execute(
      `UPDATE notifications SET is_read = 1 WHERE user_id = $1`,
      [user.userId]
    );

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error: any) {
    console.error('markAllAsRead error:', error);
    res.status(500).json({ success: false, message: 'Server error updating notifications.' });
  }
}
