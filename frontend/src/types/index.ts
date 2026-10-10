export type Role = 'student' | 'parent' | 'tutor' | 'warden' | 'security' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  created_at?: string;
  student?: StudentProfile;
  tutor?: { id: string; department: string };
  parent?: { id: string; linked_student_id?: string; student_name?: string; register_number?: string };
}

export interface StudentProfile {
  id: string;
  user_id: string;
  register_number: string;
  department: string;
  year: number;
  room_id?: string;
  room_number?: string;
  hostel_name?: string;
  hostel_lat?: number;
  hostel_lon?: number;
  hostel_radius?: number;
  parent_id?: string;
  tutor_id?: string;
}

export type OutpassStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'USED';

export interface OutpassApproval {
  id: string;
  request_id: string;
  approver_id: string;
  approver_name?: string;
  approver_role: 'tutor' | 'parent' | 'warden';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comments?: string;
  approved_at?: string;
  created_at: string;
}

export interface OutpassRequest {
  id: string;
  student_id: string;
  student_name?: string;
  register_number?: string;
  department?: string;
  room_number?: string;
  hostel_name?: string;
  purpose: string;
  destination: string;
  reason: string;
  leaving_date: string;
  leaving_time: string;
  return_date: string;
  return_time: string;
  attachment_url?: string;
  qr_token?: string;
  status: OutpassStatus;
  created_at: string;
  updated_at: string;
  approvals?: OutpassApproval[];
}

export type AttendanceStatus = 'PRESENT' | 'NOT_VERIFIED' | 'ABSENT';

export interface AttendanceRecord {
  id: string;
  student_id: string;
  student_name?: string;
  register_number?: string;
  department?: string;
  room_number?: string;
  hostel_name?: string;
  date: string;
  time: string;
  status: AttendanceStatus;
  latitude?: number;
  longitude?: number;
  verification_method: string;
  distance_from_hostel?: number;
  created_at: string;
}

export type IssueCategory =
  | 'Electrical'
  | 'Plumbing'
  | 'Water'
  | 'Internet'
  | 'Furniture'
  | 'Cleaning'
  | 'Room Maintenance'
  | 'Other';

export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type IssueStatus = 'NEW' | 'ASSIGNED' | 'IN PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface IssueUpdate {
  id: string;
  issue_id: string;
  updated_by: string;
  updated_by_name?: string;
  updated_by_role?: string;
  comment: string;
  status: IssueStatus;
  created_at: string;
}

export interface Issue {
  id: string;
  student_id: string;
  student_name?: string;
  student_phone?: string;
  register_number?: string;
  room_id?: string;
  room_number?: string;
  hostel_name?: string;
  category: IssueCategory;
  description: string;
  photo_url?: string;
  priority: IssuePriority;
  status: IssueStatus;
  assigned_to?: string;
  assigned_to_name?: string;
  created_at: string;
  updated_at: string;
  updates?: IssueUpdate[];
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  user_role?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  created_at: string;
}

export interface DashboardStats {
  totalStudents: number;
  presentStudents: number;
  attendancePercentage: number;
  outsideHostel: number;
  pendingOutpasses: number;
  approvedOutpasses: number;
  rejectedOutpasses: number;
  openIssues: number;
  resolvedIssues: number;
  categoryStats: { category: string; count: number }[];
  statusStats: { status: string; count: number }[];
  attendanceTrends: { date: string; present_count: number; failed_count: number }[];
}

export interface Hostel {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  created_at?: string;
}
