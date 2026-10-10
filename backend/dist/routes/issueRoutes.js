"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const issueController_1 = require("../controllers/issueController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// Student creates issue
router.post('/', (0, auth_1.requireRoles)('student', 'admin'), issueController_1.createIssue);
// List issues (role-filtered)
router.get('/', issueController_1.getIssues);
// Get issue details & timeline
router.get('/:id', issueController_1.getIssueById);
// Update status / assign staff (Warden, Admin)
router.patch('/:id', (0, auth_1.requireRoles)('warden', 'admin'), issueController_1.updateIssue);
// Add discussion/progress comment
router.post('/:id/comments', issueController_1.addIssueComment);
exports.default = router;
