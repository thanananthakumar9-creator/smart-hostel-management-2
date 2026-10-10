"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRoles = requireRoles;
const auth_1 = require("../utils/auth");
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            message: 'Authentication required. No authorization token provided.',
        });
        return;
    }
    const token = authHeader.split(' ')[1];
    const decoded = (0, auth_1.verifyToken)(token);
    if (!decoded) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired session token. Please log in again.',
        });
        return;
    }
    req.user = decoded;
    next();
}
function requireRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required.',
            });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: `Forbidden: Access restricted. Requires one of [${allowedRoles.join(', ')}], but your role is '${req.user.role}'.`,
            });
            return;
        }
        next();
    };
}
