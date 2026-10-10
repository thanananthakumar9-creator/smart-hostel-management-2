import { Router } from 'express';
import {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  addIssueComment,
} from '../controllers/issueController';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Student creates issue
router.post('/', requireRoles('student', 'admin'), createIssue);

// List issues (role-filtered)
router.get('/', getIssues);

// Get issue details & timeline
router.get('/:id', getIssueById);

// Update status / assign staff (Warden, Admin)
router.patch('/:id', requireRoles('warden', 'admin'), updateIssue);

// Add discussion/progress comment
router.post('/:id/comments', addIssueComment);

export default router;
