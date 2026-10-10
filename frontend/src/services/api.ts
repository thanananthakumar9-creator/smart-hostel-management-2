const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('hostel_auth_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('hostel_auth_token', token);
}

export function clearAuthToken(): void {
  localStorage.removeItem('hostel_auth_token');
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  login: (identifier: string, password: string, role?: string) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, role }),
    }),
  getMe: () => request('/auth/me'),
  logout: () =>
    request('/auth/logout', {
      method: 'POST',
    }),

  // Outpasses
  getOutpasses: () => request('/outpasses'),
  getOutpassById: (id: string) => request(`/outpasses/${id}`),
  createOutpass: (payload: any) =>
    request('/outpasses', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  approveOutpass: (id: string, comments?: string, approverRole?: string) =>
    request(`/outpasses/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comments, approver_role: approverRole }),
    }),
  rejectOutpass: (id: string, comments?: string, approverRole?: string) =>
    request(`/outpasses/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comments, approver_role: approverRole }),
    }),
  getOutpassQr: (id: string) => request(`/outpasses/${id}/qr`),
  verifyOutpass: (token: string) => request(`/outpasses/verify/${token}`),

  // Attendance
  markAttendance: (latitude: number, longitude: number, accuracy?: number) =>
    request('/attendance/mark', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, accuracy }),
    }),
  getTodayAttendance: () => request('/attendance/today'),
  getAttendanceHistory: (date?: string, status?: string) => {
    const query = new URLSearchParams();
    if (date) query.set('date', date);
    if (status) query.set('status', status);
    const qs = query.toString();
    return request(`/attendance/history${qs ? `?${qs}` : ''}`);
  },

  // Issues
  getIssues: (filters?: { status?: string; category?: string; priority?: string }) => {
    const query = new URLSearchParams();
    if (filters?.status) query.set('status', filters.status);
    if (filters?.category) query.set('category', filters.category);
    if (filters?.priority) query.set('priority', filters.priority);
    const qs = query.toString();
    return request(`/issues${qs ? `?${qs}` : ''}`);
  },
  getIssueById: (id: string) => request(`/issues/${id}`),
  createIssue: (payload: any) =>
    request('/issues', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateIssue: (id: string, payload: any) =>
    request(`/issues/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  addIssueComment: (id: string, comment: string) =>
    request(`/issues/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id: string) =>
    request(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),
  markAllNotificationsRead: () =>
    request('/notifications/read-all', {
      method: 'PATCH',
    }),

  // Admin & Warden
  getStats: () => request('/admin/stats'),
  getHostels: () => request('/admin/hostels'),
  createHostel: (payload: any) =>
    request('/admin/hostels', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateGeofence: (id: string, payload: any) =>
    request(`/admin/hostels/${id}/geofence`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  getRooms: () => request('/admin/rooms'),
  createRoom: (payload: any) =>
    request('/admin/rooms', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getUsers: (role?: string) =>
    request(`/admin/users${role ? `?role=${role}` : ''}`),
  createUser: (payload: any) =>
    request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getStudents: () => request('/admin/students'),
  getAuditLogs: (action?: string, limit?: number) => {
    const query = new URLSearchParams();
    if (action) query.set('action', action);
    if (limit) query.set('limit', limit.toString());
    const qs = query.toString();
    return request(`/admin/audit-logs${qs ? `?${qs}` : ''}`);
  },
  getReports: (type?: string) =>
    request(`/admin/reports${type ? `?type=${type}` : ''}`),
};
