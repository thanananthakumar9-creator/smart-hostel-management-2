"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const outpassController_1 = require("../controllers/outpassController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public / Security Verification (token can be scanned without login, or logged by security)
router.get('/verify/:token', outpassController_1.verifyOutpass);
// Protected routes
router.use(auth_1.authenticate);
// Student create
router.post('/', (0, auth_1.requireRoles)('student', 'admin'), outpassController_1.createOutpassRequest);
// List outpasses (role-filtered)
router.get('/', outpassController_1.getOutpassRequests);
// Specific outpass details
router.get('/:id', outpassController_1.getOutpassById);
// Approver actions (Tutor, Parent, Warden, Admin) - Security & students strictly forbidden!
router.post('/:id/approve', (0, auth_1.requireRoles)('tutor', 'parent', 'warden', 'admin'), outpassController_1.approveOutpass);
router.post('/:id/reject', (0, auth_1.requireRoles)('tutor', 'parent', 'warden', 'admin'), outpassController_1.rejectOutpass);
// Get digital QR code
router.get('/:id/qr', outpassController_1.getOutpassQr);
exports.default = router;
