"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = logAudit;
const db_1 = require("../database/db");
const uuid_1 = require("uuid");
async function logAudit(userId, action, entityType, entityId = null, details = null) {
    try {
        const id = (0, uuid_1.v4)();
        const detailsStr = typeof details === 'object' ? JSON.stringify(details) : (details || null);
        await (0, db_1.execute)(`INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`, [id, userId, action, entityType, entityId, detailsStr]);
    }
    catch (err) {
        console.error('Failed to write audit log:', err.message);
    }
}
