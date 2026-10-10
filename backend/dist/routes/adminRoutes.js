"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// Warden & Admin dashboard metrics
router.get('/stats', (0, auth_1.requireRoles)('admin', 'warden'), adminController_1.getDashboardStats);
// Hostels & Geofence
router.get('/hostels', (0, auth_1.requireRoles)('admin', 'warden'), adminController_1.getHostels);
router.post('/hostels', (0, auth_1.requireRoles)('admin'), adminController_1.createHostel);
router.patch('/hostels/:id/geofence', (0, auth_1.requireRoles)('admin', 'warden'), adminController_1.updateHostelGeofence);
// Rooms
router.get('/rooms', (0, auth_1.requireRoles)('admin', 'warden'), adminController_1.getRooms);
router.post('/rooms', (0, auth_1.requireRoles)('admin'), adminController_1.createRoom);
// Users & Students
router.get('/users', (0, auth_1.requireRoles)('admin'), adminController_1.getUsers);
router.post('/users', (0, auth_1.requireRoles)('admin'), adminController_1.createUser);
router.get('/students', (0, auth_1.requireRoles)('admin', 'warden', 'tutor'), adminController_1.getStudentsList);
// Audit logs (Admin only)
router.get('/audit-logs', (0, auth_1.requireRoles)('admin'), adminController_1.getAuditLogs);
// Reports
router.get('/reports', (0, auth_1.requireRoles)('admin', 'warden'), adminController_1.getReports);
exports.default = router;
