# Smart Hostel Management System

A production-grade, centralized college hostel management platform designed to solve manual bottlenecks in out-pass clearance, multi-tier approvals, fraudulent attendance, and unorganized maintenance reporting.

Connecting **Student**, **Parent**, **Tutor**, **Warden**, **Security**, and **Admin** in a unified, location-verified ecosystem.

---

## 🌟 Key Features

1. **Digital Out-Pass with Multi-Level Approvals**:
   - Out-pass requests require sequential or parallel approvals from **Tutor + Parent + Warden**.
   - If any authority rejects the application, it is immediately flagged as `REJECTED`.
   - Once all 3 authorities approve, the status automatically transitions to `APPROVED` and generates a secure **Digital QR Gate Pass**.
2. **Location-Verified Attendance (Haversine Geofencing)**:
   - When the student clicks **"Mark Attendance"**, the browser/device Geolocation API retrieves coordinates.
   - The backend runs an institutional **Haversine formula calculation** against the hostel's configured center (`latitude`, `longitude`) and radius (e.g., 150m).
   - Marked as `PRESENT` only if the student is physically inside the hostel boundary; otherwise rejected as `NOT_VERIFIED`.
   - Strictly prevents duplicate attendance for the same student on the same date.
   - Privacy-safe: zero continuous tracking.
3. **QR Out-Pass Verification for Main Gate Security**:
   - Security personnel can scan QR codes using their camera or enter pass tokens.
   - Real-time validity verification (`VALID`, `EXPIRED`, or `INVALID`).
   - Security users cannot approve out-passes (enforced via RBAC).
4. **Hostel Complaints & Issue Lifecycle**:
   - Students report room and hostel maintenance issues with category, priority, and photo attachments.
   - Full lifecycle management: `NEW` ➔ `ASSIGNED` ➔ `IN PROGRESS` ➔ `RESOLVED` ➔ `CLOSED`.
   - Wardens and staff can assign technicians, post updates, and log resolution notes.
5. **In-App Real-Time Notifications**:
   - Approver notifications upon new student leave submissions.
   - Real-time alerts to students when their pass is approved/rejected or an issue status changes.
6. **Role-Based Access Control (RBAC) & Audit Trail**:
   - Granular authorization on every API endpoint.
   - Complete audit logging of logins, out-passes, approvals, geofence modifications, and attendance checks.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite |
| **Backend** | Node.js (v25), Express.js, TypeScript, REST APIs |
| **Database** | PostgreSQL (Primary) + Embedded Relational LibSQL/SQLite (Zero-config fallback) |
| **Authentication** | JWT (JSON Web Tokens), Bcrypt Password Hashing, RBAC Middleware |
| **Geospatial** | Haversine Great-Circle Geodetic Formula |
| **QR Code** | QRCode / QRCodeSVG, Html5-QRCode Camera Scanner |

---

## 🏗️ Project Architecture

```
smart-hostel-management/
├── backend/
│   ├── src/
│   │   ├── config/              # Environment & system configurations
│   │   ├── controllers/         # REST API Controllers (Auth, Outpass, Attendance, Issues, Admin)
│   │   ├── database/            # Unified Database Layer (PostgreSQL pool + SQLite bridge)
│   │   ├── middleware/          # JWT verification & Role-Based Access Control (RBAC)
│   │   ├── routes/              # Express API Route declarations
│   │   ├── services/            # In-app notifications and audit log services
│   │   ├── utils/               # Haversine geofence calculation, Bcrypt & JWT helpers
│   │   ├── scripts/             # Database seeders & PostgreSQL migration runners
│   │   ├── test/                # Automated integration test suite (29 tests)
│   │   ├── app.ts               # Express application configuration
│   │   └── server.ts            # Application boot entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/common/   # Navbar, Sidebar, StatusBadge, GeofenceMap, QrCodeModal
│   │   ├── context/             # AuthContext (with 1-click test role switcher), ToastContext
│   │   ├── pages/
│   │   │   ├── student/         # Student Dashboard, Outpasses, GPS Attendance, Issues
│   │   │   ├── parent/          # Parent Dashboard, Approval Actions, Ward Attendance
│   │   │   ├── tutor/           # Tutor Dashboard, Student Directory, Leave Approvals
│   │   │   ├── warden/          # Warden Console, Geofence Editor, Issues Dispatch
│   │   │   ├── security/        # Security Dashboard, Camera QR Scanner, Gate Verify
│   │   │   ├── admin/           # Super-Admin Analytics, User Directory, Audit Logs, Reports
│   │   │   └── LoginPage.tsx    # Responsive login with 1-click test role switcher
│   │   ├── services/api.ts      # Typed REST API Client
│   │   ├── types/index.ts       # Shared TypeScript domain models
│   │   ├── App.tsx              # Root Layout & Role-based view router
│   │   ├── main.tsx             # React DOM entry point
│   │   └── index.css            # Tailwind CSS styling
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── database/
│   ├── migrations/              # 001_initial_schema.sql (PostgreSQL DDL)
│   └── seed/                    # seed.sql (Raw PostgreSQL sample dataset)
│
├── .env.example                 # Environment configuration template
├── .env                         # Active configuration
├── package.json                 # Monorepo root scripts
└── README.md                    # Project documentation
```

---

## 🗄️ Relational Database Schema

The database uses a relational model with foreign keys, cascading deletions where appropriate, indices, and constraints:

- `users`: Core identity table with `role` (`student`, `parent`, `tutor`, `warden`, `security`, `admin`), `status`, and `password_hash`.
- `hostels`: Geofence center (`latitude`, `longitude`) and boundary `radius` (meters).
- `rooms`: Associated with hostels, specifies room numbers and capacities.
- `students`: Linked to `users(id)`, `rooms(id)`, `parents(id)`, `tutors(id)`, with unique `register_number`.
- `parents` & `tutors`: Role profile entities referencing `users(id)`.
- `outpass_requests`: Details of student leave (purpose, destination, leaving & return timestamps, unique `qr_token`, `status`).
- `outpass_approvals`: Multi-level review records linking each request to `tutor`, `parent`, and `warden` with individual status, timestamp, and comments.
- `attendance`: Date, time, calculated `distance_from_hostel`, verification method (`GEOFENCE_GPS`), and status (`PRESENT`, `NOT_VERIFIED`). Unique on `(student_id, date)`.
- `issues`: Maintenance requests categorised by type, priority, room, photo attachment, assigned staff, and status.
- `issue_updates`: Chronological comments and status updates for each issue.
- `notifications`: In-app messages with `is_read` flag.
- `audit_logs`: Detailed activity logs capturing user, action, entity type, ID, and payload details.

---

## 🧭 How the Geofence & Location-Based Attendance Works

```
Student Clicks "Mark Attendance"
               ↓
Browser requests device Geolocation API (latitude, longitude, accuracy)
               ↓
Coordinates sent to Backend POST /api/attendance/mark
               ↓
Backend fetches student's assigned Hostel Geofence (center lat, lon, allowed radius)
               ↓
Calculates Great-Circle Distance via Haversine Formula:
   dLat = toRadians(lat2 - lat1)
   dLon = toRadians(lon2 - lon1)
   a = sin²(dLat/2) + cos(lat1)*cos(lat2)*sin²(dLon/2)
   c = 2 * atan2(√a, √(1-a))
   distance = R * c   (where R = 6,371,000 meters)
               ↓
Is distance <= Allowed Hostel Radius (e.g. 150m)?
       ├── YES: Status = PRESENT (Recorded in DB, student marked present)
       └── NO:  Status = NOT_VERIFIED (Student informed they are outside premises)
```

**Security Rules:**
1. **Never trust frontend status**: The frontend cannot send `status: 'PRESENT'`. It only transmits raw coordinates. The server evaluates distance and assigns the final status.
2. **Duplicate Prevention**: Re-marking attendance on the same calendar day is blocked.
3. **No Continuous Tracking**: Coordinates are requested exclusively when the student triggers the button.

---

## 🔄 How the Multi-Level Out-Pass Approval Workflow Works

```
Student submits Out-Pass Application
               ↓
Backend creates Out-Pass record with status = PENDING and unique QR Token
               ↓
System generates 3 distinct approval requirements:
   ├── Tier 1: Faculty Tutor
   ├── Tier 2: Parent / Guardian
   └── Tier 3: Hostel Warden
               ↓
Notifications dispatched to Tutor, Parent, and Warden
               ↓
Each approver reviews the student's academic standing, leave destination, and schedule
       ├── Any Approver Rejects?
       │       └── Overall Status = REJECTED (Student notified with rejection comment)
       │
       └── Approver Confirms:
               └── Individual approval status updated to APPROVED
               ↓
Backend evaluates: Have ALL THREE (Tutor, Parent, Warden) approved?
       ├── NO (1 or 2 approved): Overall status remains PENDING
       └── YES (All 3 approved):
               ├── Overall status updated to APPROVED
               ├── Digital QR Code activated
               └── Student receives approval alert with access to Digital Pass
```

---

## 👥 Demo Seed Accounts & Credentials

The seed data provisions all 6 roles. On the login screen, you can either enter these credentials or click any of the **"1-Click Instant Demo Login"** buttons:

| Role | Email Address | Password | Permissions & Scope |
|---|---|---|---|
| **Student** | `student@hostel.com` | `student123` | Request passes, view approvals, mark GPS attendance, report room issues |
| **Tutor** | `tutor@hostel.com` | `tutor123` | View assigned student roster, approve/reject leave requests, check attendance |
| **Parent** | `parent@hostel.com` | `parent123` | View linked student details, approve/reject out-passes with comments, view ward attendance |
| **Warden** | `warden@hostel.com` | `warden123` | Final out-pass gate clearance, hostel attendance log, triage complaints, edit geofence |
| **Security** | `security@hostel.com` | `security123` | Camera QR scanner, verify gate passes, view exit/entry validity. *Cannot approve passes* |
| **Admin** | `admin@hostel.com` | `admin123` | Full system access, manage users, configure rooms, audit logs, CSV analytical reports |

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js (v18, v20, or v25+)
- npm (v9+)
- (Optional) PostgreSQL database (if running with live PostgreSQL)

### Step 1: Install Dependencies
From the root directory:
```bash
# Backend installation
cd backend
npm install

# Frontend installation
cd ../frontend
npm install

cd ..
```

### Step 2: Database Initialization & Seeding
The database layer supports two modes:
1. **Zero-Config Embedded Mode (Default)**: Automatically provisions a relational database at `backend/data/hostel.db` with identical schema, indexes, and relations.
2. **PostgreSQL Mode**: Set `USE_POSTGRES=true` in `.env` and specify `DATABASE_URL` or PG credentials.

Run the seeder:
```bash
npm run seed
```

If connecting to a live PostgreSQL server, execute migrations:
```bash
npm run migrate:pg
```

### Step 3: Run the Application

#### Option A: Run Both in Development Mode (Recommended)
In terminal 1 (Backend API on port 5000):
```bash
npm run dev:backend
```

In terminal 2 (Vite Frontend on port 5173):
```bash
npm run dev:frontend
```
Open your browser at: `http://localhost:5173`

#### Option B: Run Unified Production Build
```bash
npm run build
npm start
```
Open your browser at: `http://localhost:5000` (Express serves both the REST API and the React production build).

---

## 🧪 Automated Testing Suite

The repository includes an automated integration test suite verifying all 10 critical functional domains:

```bash
npm test
```

### Test Results (29 Passed / 0 Failed):
- **Suite 1: Geofence & Haversine Accuracy**:
  - Distance computation inside boundary (< 100m)
  - Distance computation outside boundary (> 400m)
  - `verifyGeofence` flags
- **Suite 2: Authentication & RBAC**:
  - Valid student login (200 OK + JWT)
  - Invalid password rejected (401 Unauthorized)
  - Non-existent user rejected (401)
  - All 6 roles authenticated successfully
  - Security role forbidden from approving out-passes (RBAC 403 Forbidden)
- **Suite 3: Location-Based Attendance**:
  - Student outside boundary rejected as `NOT_VERIFIED`
  - Student inside boundary marked as `PRESENT`
  - Duplicate attendance on the same day blocked
- **Suite 4: Out-Pass Multi-Level Approval**:
  - Student leave application created
  - Status starts as `PENDING` with 3 approval tiers
  - Tutor approves ➔ remains `PENDING`
  - Parent approves ➔ remains `PENDING`
  - Warden approves ➔ transitions to `APPROVED`
  - Digital QR code generated
- **Suite 5: Security QR Verification**:
  - Approved QR token verified as `VALID`
  - Tampered or non-existent token rejected as `INVALID`
- **Suite 6: Hostel Issues Lifecycle**:
  - Student reports issue (Status: `NEW`)
  - Warden updates status to `IN PROGRESS`
  - Issue resolved (Status: `RESOLVED`)
  - Student views updates and comments
- **Suite 7: Notifications & Audit**:
  - In-app notification delivery
  - Audit logging of institutional actions
  - Super-Admin analytics KPI aggregation

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/login` - Authenticate with email and password. Returns user object & JWT token.
- `GET  /api/auth/me` - Retrieve current user profile and linked role details.
- `POST /api/auth/logout` - Invalidate session and log logout audit.

### Out-Pass Management
- `POST /api/outpasses` - Create new leave request (Student/Admin only).
- `GET  /api/outpasses` - Role-filtered list of out-passes.
- `GET  /api/outpasses/:id` - Detailed view of out-pass including approver comments.
- `POST /api/outpasses/:id/approve` - Approve out-pass (Tutor, Parent, Warden, Admin).
- `POST /api/outpasses/:id/reject` - Reject out-pass with comments.
- `GET  /api/outpasses/:id/qr` - Retrieve digital QR pass data URL.
- `GET  /api/outpasses/verify/:token` - Verify pass status for Security gate clearance.

### Location-Based Attendance
- `POST /api/attendance/mark` - Submit student coordinates for geofence verification.
- `GET  /api/attendance/today` - Check today's attendance status.
- `GET  /api/attendance/history` - View attendance records with date and status filters.

### Hostel Issues & Maintenance
- `POST /api/issues` - Report a hostel maintenance issue.
- `GET  /api/issues` - List issues with category, status, and priority filters.
- `GET  /api/issues/:id` - View issue timeline and discussion comments.
- `PATCH /api/issues/:id` - Update status and assign staff (Warden/Admin).
- `POST /api/issues/:id/comments` - Post progress note or comment.

### Notifications & Administration
- `GET  /api/notifications` - Retrieve in-app notifications.
- `PATCH /api/notifications/:id/read` - Mark single notification as read.
- `PATCH /api/notifications/read-all` - Mark all notifications as read.
- `GET  /api/admin/stats` - Retrieve institutional KPIs and trend charts.
- `GET  /api/admin/hostels` - List hostels and geofences.
- `PATCH /api/admin/hostels/:id/geofence` - Update hostel coordinates and radius.
- `GET  /api/admin/users` - Directory of users.
- `POST /api/admin/users` - Register a new system user.
- `GET  /api/admin/audit-logs` - Query searchable system audit trail.
- `GET  /api/admin/reports` - Generate attendance and out-pass summary reports.

---

## 🔒 Security & Privacy Implementation

1. **Password Hashing**: Passwords are salted and hashed using `bcryptjs` (cost factor 10).
2. **Session Security**: Stateless JSON Web Tokens (JWT) signed with HMAC-SHA256.
3. **Backend Authorization**: Role-Based Access Control enforced on all endpoints via `requireRoles(...)`.
4. **No Direct Frontend Trust**: Geofence status is calculated exclusively on the server.
5. **Privacy-Preserving Geolocation**: No continuous location tracking. Coordinates are requested once during attendance submission.
6. **SQL Injection Defense**: All database queries use parameterized SQL markers (`$1, $2, ...`).
7. **Audit Logging**: Sensitive operations (logins, gate passes, geofence updates, issue status changes) are written to the `audit_logs` table.
