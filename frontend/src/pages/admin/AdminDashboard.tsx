import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { DashboardStats, AuditLog, User, Hostel } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import {
  LayoutDashboard,
  Users,
  Building,
  FileCheck2,
  MapPin,
  AlertTriangle,
  History,
  FileSpreadsheet,
  Plus,
  Shield,
  Download,
  Search,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface AdminDashboardProps {
  currentTab: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentTab }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [hostelsList, setHostelsList] = useState<Hostel[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [reportsData, setReportsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create User Modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    phone: '',
    department: 'Computer Science',
    register_number: '',
  });
  const [creatingUser, setCreatingUser] = useState(false);

  // Search filter for audit logs
  const [auditActionFilter, setAuditActionFilter] = useState('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [stRes, uRes, hRes, audRes, repRes] = await Promise.all([
        api.getStats().catch(() => ({ stats: null })),
        api.getUsers().catch(() => ({ users: [] })),
        api.getHostels().catch(() => ({ hostels: [] })),
        api.getAuditLogs().catch(() => ({ logs: [] })),
        api.getReports('attendance').catch(() => ({ records: [] })),
      ]);

      setStats(stRes.stats);
      setUsersList(uRes.users || []);
      setHostelsList(hRes.hostels || []);
      setAuditLogs(audRes.logs || []);
      setReportsData(repRes.records || []);
    } catch {
      toast.error('Failed to load administration data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingUser(true);
      const res = await api.createUser(newUser);
      if (res.success) {
        toast.success(`User '${newUser.name}' created successfully with role ${newUser.role}!`);
        setShowUserModal(false);
        setNewUser({
          name: '',
          email: '',
          password: '',
          role: 'student',
          phone: '',
          department: 'Computer Science',
          register_number: '',
        });
        fetchAdminData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleExportCsv = () => {
    if (reportsData.length === 0) {
      toast.error('No report data available to export.');
      return;
    }
    const headers = Object.keys(reportsData[0]).join(',');
    const rows = reportsData.map((r) => Object.values(r).map((v) => `"${v || ''}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hostel_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported to CSV successfully.');
  };

  const filteredLogs = auditActionFilter
    ? auditLogs.filter((l) => l.action.toLowerCase().includes(auditActionFilter.toLowerCase()))
    : auditLogs;

  return (
    <div className="space-y-6">
      {/* Page Title Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1F2430]">System Dashboard</h2>
          <p className="text-sm text-[#7B849C]">Administrator Console</p>
        </div>
        <button
          onClick={() => setShowUserModal(true)}
          className="px-4 py-2 rounded-xl bg-[#3155D9] hover:bg-blue-700 text-white font-bold text-sm shadow-sm flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          Create User
        </button>
      </div>

      {/* Dashboard Tab */}
      {(currentTab === 'dashboard' || !currentTab) && stats && (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Students */}
            <div className="bg-white rounded-3xl border border-[#E8EBF2] shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#EEF2FF] text-[#3155D9] rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-[#7B849C]">Total Students</span>
              </div>
              <div className="text-3xl font-bold text-[#1F2430]">{stats.totalStudents}</div>
              <span className="text-xs text-[#7B849C]">{stats.presentStudents} present today</span>
            </div>

            {/* Attendance Rate */}
            <div className="bg-white rounded-3xl border border-[#E8EBF2] shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#22A06B]/10 text-[#22A06B] rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-[#7B849C]">Attendance Rate</span>
              </div>
              <div className="text-3xl font-bold text-[#1F2430]">{stats.attendancePercentage}%</div>
              <span className="text-xs text-[#7B849C]">GPS Verified Today</span>
            </div>

            {/* Pending Out-Passes */}
            <div className="bg-white rounded-3xl border border-[#E8EBF2] shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#E6A23C]/10 text-[#E6A23C] rounded-xl">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-[#7B849C]">Pending Out-Passes</span>
              </div>
              <div className="text-3xl font-bold text-[#1F2430]">{stats.pendingOutpasses}</div>
              <span className="text-xs text-[#7B849C]">{stats.approvedOutpasses} approved</span>
            </div>

            {/* Open Issues */}
            <div className="bg-white rounded-3xl border border-[#E8EBF2] shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#E25555]/10 text-[#E25555] rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-[#7B849C]">Open Issues</span>
              </div>
              <div className="text-3xl font-bold text-[#1F2430]">{stats.openIssues}</div>
              <span className="text-xs text-[#7B849C]">{stats.resolvedIssues} resolved</span>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Trends */}
            <div className="bg-white rounded-3xl border border-[#E8EBF2] shadow-sm p-6">
              <h3 className="font-bold text-[#1F2430] text-base mb-6">Attendance Trends</h3>
              <div className="space-y-4">
                {stats.attendanceTrends && stats.attendanceTrends.length > 0 ? (
                  stats.attendanceTrends.map((t, idx) => {
                    const total = (t.present_count || 0) + (t.failed_count || 0) || 1;
                    const presentPct = Math.round(((t.present_count || 0) / total) * 100);
                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span className="text-[#1F2430]">{t.date}</span>
                          <span className="text-[#7B849C]">{t.present_count} Present</span>
                        </div>
                        <div className="w-full h-2 bg-[#E8EBF2] rounded-full overflow-hidden flex">
                          <div
                            style={{ width: `${presentPct}%` }}
                            className="bg-[#22A06B] h-full rounded-full transition-all"
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-[#7B849C] text-sm">
                    No trend records available yet.
                  </div>
                )}
              </div>
            </div>

            {/* Issues by Category */}
            <div className="bg-white rounded-3xl border border-[#E8EBF2] shadow-sm p-6">
              <h3 className="font-bold text-[#1F2430] text-base mb-6">Issues by Category</h3>
              <div className="space-y-3">
                {stats.categoryStats && stats.categoryStats.length > 0 ? (
                  stats.categoryStats.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border border-[#E8EBF2] rounded-xl text-sm">
                      <span className="font-medium text-[#1F2430]">{c.category}</span>
                      <span className="px-2.5 py-1 rounded-full bg-[#F4F6FC] font-medium text-[#7B849C]">
                        {c.count}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-[#7B849C] text-sm">
                    No issue categories recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {currentTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-[#1F2430] text-lg">User Accounts Directory</h3>
            <button
              onClick={() => setShowUserModal(true)}
              className="px-4 py-2 rounded-xl bg-[#3155D9] text-white font-bold text-sm shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add User
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-[#E8EBF2] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase text-[#7B849C] font-semibold">
                  <tr>
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Email</th>
                    <th className="py-4 px-6">Role</th>
                    <th className="py-4 px-6">Phone</th>
                    <th className="py-4 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EBF2]">
                  {usersList.length > 0 ? (
                    usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6 font-bold text-[#1F2430]">{u.name}</td>
                        <td className="py-4 px-6 text-[#7B849C] font-mono">{u.email}</td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full font-semibold text-xs capitalize
                            ${u.role === 'student' ? 'bg-[#EEF2FF] text-[#3155D9]' :
                              u.role === 'tutor' ? 'bg-indigo-100 text-indigo-700' :
                              u.role === 'admin' ? 'bg-[#E25555]/10 text-[#E25555]' :
                              u.role === 'warden' ? 'bg-purple-100 text-purple-700' :
                              u.role === 'security' ? 'bg-[#22A06B]/10 text-[#22A06B]' :
                              'bg-[#E6A23C]/10 text-[#E6A23C]'}`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-[#7B849C]">{u.phone || '-'}</td>
                        <td className="py-4 px-6"><StatusBadge status={u.status} /></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#7B849C]">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {currentTab === 'audit-logs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="font-bold text-[#1F2430] text-lg">System Audit Trail</h3>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7B849C]" />
              <input
                type="text"
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                placeholder="Search actions..."
                className="pl-9 pr-4 py-2 border border-[#E8EBF2] rounded-xl text-sm outline-none focus:border-[#3155D9] transition-colors"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#E8EBF2] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase text-[#7B849C] font-semibold">
                  <tr>
                    <th className="py-4 px-6">Timestamp</th>
                    <th className="py-4 px-6">User</th>
                    <th className="py-4 px-6">Action</th>
                    <th className="py-4 px-6">Entity</th>
                    <th className="py-4 px-6">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EBF2]">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6 text-[#7B849C]">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="py-4 px-6 font-bold text-[#1F2430]">{log.user_name || 'System'}</td>
                        <td className="py-4 px-6">
                          <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-800 font-mono text-xs font-medium">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-[#7B849C]">{log.entity_type}</td>
                        <td className="py-4 px-6 text-[#7B849C] max-w-xs truncate">{log.details || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#7B849C]">
                        No audit logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {currentTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-[#1F2430] text-lg">Attendance Reports</h3>
            <button
              onClick={handleExportCsv}
              className="px-4 py-2 rounded-xl bg-[#22A06B] hover:bg-emerald-700 text-white font-bold text-sm shadow-sm flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-[#E8EBF2] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase text-[#7B849C] font-semibold">
                  <tr>
                    <th className="py-4 px-6">Student Name</th>
                    <th className="py-4 px-6">Register Number</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Time</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Room</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EBF2]">
                  {reportsData.length > 0 ? (
                    reportsData.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6 font-bold text-[#1F2430]">{r.student_name}</td>
                        <td className="py-4 px-6 font-mono text-[#7B849C]">{r.register_number}</td>
                        <td className="py-4 px-6 text-[#7B849C]">{r.date}</td>
                        <td className="py-4 px-6 text-[#7B849C]">{r.time}</td>
                        <td className="py-4 px-6"><StatusBadge status={r.status} /></td>
                        <td className="py-4 px-6 text-[#7B849C]">{r.room_number || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#7B849C]">
                        No reports available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#E8EBF2] overflow-hidden">
            <div className="p-6 bg-[#3155D9] text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Register New System User</h3>
                <p className="text-xs text-blue-100">Configure role-based credentials and profile</p>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-1 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7B849C] uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full text-sm p-2.5 border border-[#E8EBF2] rounded-xl outline-none focus:border-[#3155D9]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7B849C] uppercase mb-1">Email *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full text-sm p-2.5 border border-[#E8EBF2] rounded-xl outline-none focus:border-[#3155D9]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7B849C] uppercase mb-1">Password *</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full text-sm p-2.5 border border-[#E8EBF2] rounded-xl outline-none focus:border-[#3155D9]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7B849C] uppercase mb-1">Role *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full text-sm p-2.5 border border-[#E8EBF2] rounded-xl outline-none focus:border-[#3155D9]"
                  >
                    <option value="student">Student</option>
                    <option value="parent">Parent</option>
                    <option value="tutor">Tutor</option>
                    <option value="warden">Warden</option>
                    <option value="security">Security</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {newUser.role === 'student' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#7B849C] uppercase mb-1">Register Number *</label>
                    <input
                      type="text"
                      value={newUser.register_number}
                      onChange={(e) => setNewUser({ ...newUser, register_number: e.target.value })}
                      placeholder="e.g. 23CS042"
                      className="w-full text-sm p-2.5 border border-[#E8EBF2] rounded-xl outline-none font-mono focus:border-[#3155D9]"
                      required={newUser.role === 'student'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7B849C] uppercase mb-1">Department</label>
                    <input
                      type="text"
                      value={newUser.department}
                      onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                      className="w-full text-sm p-2.5 border border-[#E8EBF2] rounded-xl outline-none focus:border-[#3155D9]"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E8EBF2] text-sm font-bold text-[#7B849C] hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="flex-1 py-2.5 rounded-xl bg-[#3155D9] hover:bg-blue-700 text-white font-bold text-sm disabled:opacity-50 transition-colors"
                >
                  {creatingUser ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
