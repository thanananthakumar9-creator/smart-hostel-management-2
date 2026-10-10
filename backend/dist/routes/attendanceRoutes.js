"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const attendanceController_1 = require("../controllers/attendanceController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// Student marks attendance with geolocation data
router.post('/mark', (0, auth_1.requireRoles)('student'), attendanceController_1.markAttendance);
// Check if current student marked today
router.get('/today', (0, auth_1.requireRoles)('student'), attendanceController_1.getTodayAttendance);
// View attendance history (role-filtered)
router.get('/history', attendanceController_1.getAttendanceHistory);
exports.default = router;
