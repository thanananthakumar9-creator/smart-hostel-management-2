import { Router } from 'express';
import {
  markAttendance,
  getAttendanceHistory,
  getTodayAttendance,
} from '../controllers/attendanceController';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Student marks attendance with geolocation data
router.post('/mark', requireRoles('student'), markAttendance);

// Check if current student marked today
router.get('/today', requireRoles('student'), getTodayAttendance);

// View attendance history (role-filtered)
router.get('/history', getAttendanceHistory);

export default router;
