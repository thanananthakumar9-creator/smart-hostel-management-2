"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
exports.createNotifications = createNotifications;
const db_1 = require("../database/db");
const uuid_1 = require("uuid");
async function createNotification(userId, title, message) {
    const id = (0, uuid_1.v4)();
    await (0, db_1.execute)(`INSERT INTO notifications (id, user_id, title, message, is_read, created_at)
     VALUES ($1, $2, $3, $4, 0, CURRENT_TIMESTAMP)`, [id, userId, title, message]);
}
async function createNotifications(userIds, title, message) {
    for (const userId of userIds) {
        if (userId) {
            await createNotification(userId, title, message);
        }
    }
}
