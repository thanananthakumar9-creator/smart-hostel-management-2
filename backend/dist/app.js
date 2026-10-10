"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const outpassRoutes_1 = __importDefault(require("./routes/outpassRoutes"));
const attendanceRoutes_1 = __importDefault(require("./routes/attendanceRoutes"));
const issueRoutes_1 = __importDefault(require("./routes/issueRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const db_1 = require("./database/db");
exports.app = (0, express_1.default)();
// Middlewares
exports.app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
}));
exports.app.use(express_1.default.json({ limit: '10mb' }));
exports.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
exports.app.use((0, morgan_1.default)('dev'));
// API Routes
exports.app.use('/api/auth', authRoutes_1.default);
exports.app.use('/api/outpasses', outpassRoutes_1.default);
exports.app.use('/api/attendance', attendanceRoutes_1.default);
exports.app.use('/api/issues', issueRoutes_1.default);
exports.app.use('/api/notifications', notificationRoutes_1.default);
exports.app.use('/api/admin', adminRoutes_1.default);
// Health check endpoint
exports.app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: (0, db_1.getActiveDbType)(),
    });
});
// Serve frontend build if present
const frontendDistPath = path_1.default.resolve(__dirname, '../../frontend/dist');
const altDistPath = path_1.default.resolve(__dirname, '../../../frontend/dist');
const activeDist = fs_1.default.existsSync(frontendDistPath) ? frontendDistPath : (fs_1.default.existsSync(altDistPath) ? altDistPath : null);
if (activeDist) {
    exports.app.use(express_1.default.static(activeDist));
    exports.app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
            return next();
        }
        res.sendFile(path_1.default.join(activeDist, 'index.html'));
    });
}
// 404 Route handler for API
exports.app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `API endpoint ${req.method} ${req.path} not found.`,
    });
});
// Centralized error handling
exports.app.use((err, req, res, next) => {
    console.error('Unhandled Application Error:', err);
    const status = err.status || 500;
    const message = err.message || 'An unexpected error occurred. Please try again.';
    res.status(status).json({
        success: false,
        message,
    });
});
