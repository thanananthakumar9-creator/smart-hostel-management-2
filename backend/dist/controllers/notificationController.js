"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = getNotifications;
exports.markAsRead = markAsRead;
exports.markAllAsRead = markAllAsRead;
const db_1 = require("../database/db");
async function getNotifications(req, res) {
    try {
        const user = req.user;
        const notifications = await (0, db_1.query)(`SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 50`, [user.userId]);
        const unreadCountRow = await (0, db_1.queryRow)(`SELECT COUNT(*) as unread_count FROM notifications
       WHERE user_id = $1 AND (is_read = 0 OR is_read = false)`, [user.userId]);
        res.json({
            success: true,
            unreadCount: parseInt(unreadCountRow?.unread_count || '0', 10),
            notifications: notifications.map((n) => ({
                ...n,
                is_read: Boolean(n.is_read),
            })),
        });
    }
    catch (error) {
        console.error('getNotifications error:', error);
        res.status(500).json({ success: false, message: 'Server error retrieving notifications.' });
    }
}
async function markAsRead(req, res) {
    try {
        const { id } = req.params;
        const user = req.user;
        await (0, db_1.execute)(`UPDATE notifications SET is_read = 1 WHERE id = $1 AND user_id = $2`, [id, user.userId]);
        res.json({ success: true, message: 'Notification marked as read.' });
    }
    catch (error) {
        console.error('markAsRead error:', error);
        res.status(500).json({ success: false, message: 'Server error updating notification.' });
    }
}
async function markAllAsRead(req, res) {
    try {
        const user = req.user;
        await (0, db_1.execute)(`UPDATE notifications SET is_read = 1 WHERE user_id = $1`, [user.userId]);
        res.json({ success: true, message: 'All notifications marked as read.' });
    }
    catch (error) {
        console.error('markAllAsRead error:', error);
        res.status(500).json({ success: false, message: 'Server error updating notifications.' });
    }
}
