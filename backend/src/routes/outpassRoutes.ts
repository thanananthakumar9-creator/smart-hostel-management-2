import { Router } from 'express';
import {
  createOutpassRequest,
  getOutpassRequests,
  getOutpassById,
  approveOutpass,
  rejectOutpass,
  getOutpassQr,
  verifyOutpass,
} from '../controllers/outpassController';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

// Public / Security Verification (token can be scanned without login, or logged by security)
router.get('/verify/:token', verifyOutpass);

// Protected routes
router.use(authenticate);

// Student create
router.post('/', requireRoles('student', 'admin'), createOutpassRequest);

// List outpasses (role-filtered)
router.get('/', getOutpassRequests);

// Specific outpass details
router.get('/:id', getOutpassById);

// Approver actions (Tutor, Parent, Warden, Admin) - Security & students strictly forbidden!
router.post('/:id/approve', requireRoles('tutor', 'parent', 'warden', 'admin'), approveOutpass);
router.post('/:id/reject', requireRoles('tutor', 'parent', 'warden', 'admin'), rejectOutpass);

// Get digital QR code
router.get('/:id/qr', getOutpassQr);

export default router;
