import { Router } from 'express';
import {
  getDashboardStats,
  getHostels,
  updateHostelGeofence,
  createHostel,
  getRooms,
  createRoom,
  getUsers,
  getStudentsList,
  createUser,
  getAuditLogs,
  getReports,
} from '../controllers/adminController';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Warden & Admin dashboard metrics
router.get('/stats', requireRoles('admin', 'warden'), getDashboardStats);

// Hostels & Geofence
router.get('/hostels', requireRoles('admin', 'warden'), getHostels);
router.post('/hostels', requireRoles('admin'), createHostel);
router.patch('/hostels/:id/geofence', requireRoles('admin', 'warden'), updateHostelGeofence);

// Rooms
router.get('/rooms', requireRoles('admin', 'warden'), getRooms);
router.post('/rooms', requireRoles('admin'), createRoom);

// Users & Students
router.get('/users', requireRoles('admin'), getUsers);
router.post('/users', requireRoles('admin'), createUser);
router.get('/students', requireRoles('admin', 'warden', 'tutor'), getStudentsList);

// Audit logs (Admin only)
router.get('/audit-logs', requireRoles('admin'), getAuditLogs);

// Reports
router.get('/reports', requireRoles('admin', 'warden'), getReports);

export default router;
