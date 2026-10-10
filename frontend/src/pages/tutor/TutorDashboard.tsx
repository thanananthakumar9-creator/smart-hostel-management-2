import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { OutpassRequest, AttendanceRecord } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  FileCheck2,
  MapPin,
  Check,
  X,
  FileSpreadsheet
} from 'lucide-react';

interface TutorDashboardProps {
  currentTab: string;
}

export const TutorDashboard: React.FC<TutorDashboardProps> = ({ currentTab }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [requests, setRequests] = useState<OutpassRequest[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Approve/reject modal
  const [selectedPass, setSelectedPass] = useState<OutpassRequest | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [outRes, stuRes, attRes] = await Promise.all([
        api.getOutpasses().catch(() => ({ requests: [] })),
        api.getStudents().catch(() => ({ students: [] })),
        api.getAttendanceHistory().catch(() => ({ records: [] })),
      ]);

      setRequests(outRes.requests || []);
      setStudents(stuRes.students || []);
      setAttendance(attRes.records || []);
    } catch {
      toast.error('Failed to load tutor records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async () => {
    if (!selectedPass) return;
    try {
      setSubmitting(true);
      if (actionType === 'APPROVE') {
        const res = await api.approveOutpass(selectedPass.id, comment || 'Academic clearance approved by Tutor.');
        toast.success(res.message);
      } else {
        const res = await api.rejectOutpass(selectedPass.id, comment || 'Rejected by Tutor.');
        toast.success(res.message);
      }
      setSelectedPass(null);
      setComment('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingRequests = requests.filter((r) => {
    const tutorApp = r.approvals?.find((a) => a.approver_role === 'tutor');
    return tutorApp ? tutorApp.status === 'PENDING' : r.status === 'PENDING';
  });

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-ink">Hello, {user?.name}</h2>
        <p className="text-sm text-ink-muted">Faculty Tutor — {user?.tutor?.department || 'Computer Science & Engineering'}</p>
      </div>

      {currentTab === 'students' ? (
        /* Students tab */
        <div className="bg-white rounded-3xl border border-ink-border p-6 shadow-card">
          <h3 className="font-bold text-ink text-base pb-4 mb-4 border-b border-ink-border">
            Assigned Students ({students.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-ink-muted uppercase font-bold text-xs">
                <tr>
                  <th className="py-3 px-4">Register No</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Dept / Year</th>
                  <th className="py-3 px-4">Room & Hostel</th>
                  <th className="py-3 px-4">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-border">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-medium">{s.register_number}</td>
                    <td className="py-3 px-4 font-semibold text-ink">{s.name}</td>
                    <td className="py-3 px-4 text-ink-muted">{s.department} • Year {s.year}</td>
                    <td className="py-3 px-4 text-ink-muted">Room {s.room_number || 'N/A'} • {s.hostel_name || 'Block A'}</td>
                    <td className="py-3 px-4 text-ink-muted">{s.phone || s.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : currentTab === 'attendance' ? (
        /* Attendance tab */
        <div className="bg-white rounded-3xl border border-ink-border p-6 shadow-card">
          <h3 className="font-bold text-ink text-base pb-4 mb-4 border-b border-ink-border">
            Student Attendance Log
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-ink-muted uppercase font-bold text-xs">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Distance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-border">
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-ink-muted">
                      No attendance logged yet.
                    </td>
                  </tr>
                ) : (
                  attendance.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-ink">{a.student_name}</span>{' '}
                        <span className="font-mono text-ink-muted text-xs">({a.register_number})</span>
                      </td>
                      <td className="py-3 px-4 text-ink-muted">{a.date} at {a.time}</td>
                      <td className="py-3 px-4"><StatusBadge status={a.status} /></td>
                      <td className="py-3 px-4 text-ink-muted">{a.distance_from_hostel ? `${a.distance_from_hostel}m` : 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Dashboard / Outpasses tab (default) */
        <div className="space-y-6">
          {/* 4 KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-ink-border shadow-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink-muted">Assigned Students</p>
                <p className="text-2xl font-bold text-ink">{students.length}</p>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-5 border border-ink-border shadow-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-warn-50 flex items-center justify-center text-warn-600">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink-muted">Pending Approvals</p>
                <p className="text-2xl font-bold text-ink">{pendingRequests.length}</p>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-5 border border-ink-border shadow-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink-muted">Total Requests</p>
                <p className="text-2xl font-bold text-ink">{requests.length}</p>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-5 border border-ink-border shadow-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-success-50 flex items-center justify-center text-success-600">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink-muted">Attendance Records</p>
                <p className="text-2xl font-bold text-ink">{attendance.length}</p>
              </div>
            </div>
          </div>

          {/* Pending Approvals section */}
          <div className="bg-white rounded-3xl border border-ink-border p-6 shadow-card">
            <div className="flex items-center gap-3 mb-6">
              <h3 className="text-lg font-bold text-ink">Pending Approvals</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-warn-50 text-warn-600">
                {pendingRequests.length}
              </span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-ink-muted text-sm">Loading requests...</div>
            ) : pendingRequests.length === 0 ? (
              <div className="py-8 text-center text-ink-muted text-sm">No pending approvals</div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 p-5 rounded-2xl border border-ink-border bg-white hover:shadow-md transition"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-ink text-base">{r.destination}</h4>
                        <span className="px-2 py-1 rounded bg-slate-100 font-mono text-xs font-medium text-ink-muted">
                          {r.student_name} • {r.register_number}
                        </span>
                      </div>
                      <p className="text-sm text-ink-muted">Purpose: {r.purpose}</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mt-3">
                        <div>
                          <span className="text-ink-muted block text-xs">Leaving</span>
                          <span className="font-medium text-ink">{r.leaving_date} {r.leaving_time}</span>
                        </div>
                        <div>
                          <span className="text-ink-muted block text-xs">Returning</span>
                          <span className="font-medium text-ink">{r.return_date} {r.return_time}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedPass(r);
                          setActionType('APPROVE');
                          setComment('');
                        }}
                        className="px-4 py-2 rounded-xl bg-success-600 hover:bg-success-700 text-white font-bold text-sm flex items-center gap-2 transition"
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPass(r);
                          setActionType('REJECT');
                          setComment('');
                        }}
                        className="px-4 py-2 rounded-xl bg-danger-600 hover:bg-danger-700 text-white font-bold text-sm flex items-center gap-2 transition"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {selectedPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-ink-border overflow-hidden">
            <div className={`p-6 text-white ${actionType === 'APPROVE' ? 'bg-success-600' : 'bg-danger-600'}`}>
              <h3 className="text-lg font-bold">
                {actionType === 'APPROVE' ? 'Approve Out-Pass' : 'Reject Out-Pass'}
              </h3>
              <p className="text-sm opacity-90">Student: {selectedPass.student_name} ({selectedPass.register_number})</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-ink mb-2">
                  Comment (Optional)
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    actionType === 'APPROVE'
                      ? 'e.g. Academic coursework cleared. Recommended for leave.'
                      : 'e.g. Low attendance percentage. Leave denied.'
                  }
                  className="w-full text-sm p-3 border border-ink-border rounded-xl outline-none focus:border-primary-600"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setSelectedPass(null)}
                  className="flex-1 py-3 rounded-xl border border-ink-border text-sm font-bold text-ink hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAction}
                  disabled={submitting}
                  className={`flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 transition ${
                    actionType === 'APPROVE' ? 'bg-success-600 hover:bg-success-700' : 'bg-danger-600 hover:bg-danger-700'
                  }`}
                >
                  {submitting ? 'Submitting...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
