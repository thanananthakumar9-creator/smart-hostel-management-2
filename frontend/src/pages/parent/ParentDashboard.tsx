import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { OutpassRequest, AttendanceRecord } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import {
  User,
  FileCheck2,
  MapPin,
  Check,
  X,
  Clock,
  Calendar,
  AlertCircle,
  Building,
} from 'lucide-react';

interface ParentDashboardProps {
  currentTab: string;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ currentTab }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [requests, setRequests] = useState<OutpassRequest[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal for approve/reject
  const [selectedPass, setSelectedPass] = useState<OutpassRequest | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const outRes = await api.getOutpasses();
      if (outRes.success) {
        setRequests(outRes.requests || []);
      }
      const attRes = await api.getAttendanceHistory();
      if (attRes.success) {
        setAttendance(attRes.records || []);
      }
    } catch {
      toast.error('Failed to load parent records');
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
        const res = await api.approveOutpass(selectedPass.id, comment || 'Approved by Parent');
        toast.success(res.message);
      } else {
        const res = await api.rejectOutpass(selectedPass.id, comment || 'Rejected by Parent');
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
    const parentApp = r.approvals?.find((a) => a.approver_role === 'parent');
    return parentApp ? parentApp.status === 'PENDING' : r.status === 'PENDING';
  });

  const historyRequests = requests.filter((r) => {
    const parentApp = r.approvals?.find((a) => a.approver_role === 'parent');
    return parentApp ? parentApp.status !== 'PENDING' : r.status !== 'PENDING';
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-ink-border shadow-card p-6">
        <h1 className="text-2xl font-bold text-ink">Parent Dashboard</h1>
        <p className="text-ink-muted mt-1">Monitor your child's hostel activity</p>
        <div className="mt-4 pt-4 border-t border-ink-border flex flex-wrap gap-4 text-sm text-ink-muted">
          <span>Student: <strong className="text-ink">{user?.parent?.student_name || 'John Doe'}</strong></span>
          <span>•</span>
          <span>Register No: <strong className="text-ink">{user?.parent?.register_number || '22CS001'}</strong></span>
          <span>•</span>
          <span>Pending Requests: <strong className="text-ink">{pendingRequests.length}</strong></span>
        </div>
      </div>

      {/* Tabs view: Pending Approvals or Attendance */}
      {currentTab !== 'attendance' ? (
        <div className="space-y-6">
          {/* Pending Approvals */}
          <div className="bg-white rounded-3xl border border-ink-border p-6 shadow-card space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-ink-border">
              <div>
                <h3 className="font-bold text-ink text-base">
                  Pending Out-Pass Requests Requiring Parent Approval
                </h3>
                <p className="text-xs text-ink-muted">
                  Your consent is mandatory before the hostel warden grants gate pass clearance
                </p>
              </div>
              <span className="text-xs font-bold bg-primary-50 text-primary-600 px-3 py-1 rounded-full border border-primary-600/20">
                {pendingRequests.length} Pending
              </span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-ink-muted text-sm">Loading requests...</div>
            ) : pendingRequests.length === 0 ? (
              <div className="py-8 text-center text-ink-muted text-sm">
                No out-pass requests currently awaiting your approval.
              </div>
            ) : (
              pendingRequests.map((r) => (
                <div
                  key={r.id}
                  className="p-5 rounded-2xl border border-ink-border bg-slate-50 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h4 className="font-bold text-ink text-base">{r.destination}</h4>
                      <p className="text-xs text-ink-muted">Purpose: {r.purpose}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedPass(r);
                          setActionType('APPROVE');
                          setComment('');
                        }}
                        className="px-4 py-2 rounded-xl bg-success-600 hover:bg-success-600/90 text-white font-bold text-xs flex items-center gap-1.5 transition"
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
                        className="px-4 py-2 rounded-xl bg-danger-600 hover:bg-danger-600/90 text-white font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white p-3.5 rounded-xl border border-ink-border">
                    <div>
                      <span className="text-ink-muted font-semibold block mb-0.5">Leaving Schedule:</span>
                      <span className="font-bold text-ink">{r.leaving_date} at {r.leaving_time}</span>
                    </div>
                    <div>
                      <span className="text-ink-muted font-semibold block mb-0.5">Expected Return:</span>
                      <span className="font-bold text-ink">{r.return_date} at {r.return_time}</span>
                    </div>
                    <div>
                      <span className="text-ink-muted font-semibold block mb-0.5">Reason:</span>
                      <span className="text-ink">{r.reason}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Past Approval Decisions */}
          <div className="bg-white rounded-3xl border border-ink-border p-6 shadow-card">
            <h3 className="font-bold text-ink text-base pb-3 border-b border-ink-border">
              Approval History
            </h3>
            <div className="mt-2">
              {historyRequests.length === 0 ? (
                <div className="py-6 text-center text-ink-muted text-xs">
                  No past requests in history.
                </div>
              ) : (
                <div className="divide-y divide-ink-border">
                  {historyRequests.map((r) => (
                    <div key={r.id} className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-ink block text-sm">{r.destination}</span>
                        <span className="text-ink-muted">
                          {r.leaving_date} → {r.return_date} • {r.purpose}
                        </span>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Student Attendance History */
        <div className="bg-white rounded-3xl border border-ink-border p-6 shadow-card">
          <h3 className="font-bold text-ink text-base pb-4 border-b border-ink-border flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-600" />
            Ward Attendance History (Location-Verified)
          </h3>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-ink-muted uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Distance from Hostel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-border">
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-ink-muted border-b border-ink-border">
                      No attendance records found for student.
                    </td>
                  </tr>
                ) : (
                  attendance.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 border-b border-ink-border">
                      <td className="py-3 px-4 font-semibold text-ink">{a.date}</td>
                      <td className="py-3 px-4 font-mono text-ink-muted">{a.time}</td>
                      <td className="py-3 px-4"><StatusBadge status={a.status} /></td>
                      <td className="py-3 px-4 text-ink-muted">
                        {a.distance_from_hostel ? `${a.distance_from_hostel}m` : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {selectedPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-card border border-ink-border overflow-hidden">
            <div className={`p-6 text-white ${actionType === 'APPROVE' ? 'bg-success-600' : 'bg-danger-600'}`}>
              <h3 className="text-lg font-bold">
                {actionType === 'APPROVE' ? 'Approve Out-Pass Consent' : 'Reject Out-Pass'}
              </h3>
              <p className="text-sm opacity-90 mt-1">Destination: {selectedPass.destination}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink uppercase mb-1">
                  Parent Comment / Notes
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    actionType === 'APPROVE'
                      ? 'e.g. Permission granted for family function.'
                      : 'e.g. Cannot permit travel during exam week.'
                  }
                  className="w-full text-sm p-3 border border-ink-border rounded-xl outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600 transition"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPass(null)}
                  className="flex-1 py-2.5 rounded-xl border border-ink-border text-sm font-bold text-ink hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAction}
                  disabled={submitting}
                  className={`flex-1 py-2.5 rounded-xl text-white font-bold text-sm transition disabled:opacity-50 ${
                    actionType === 'APPROVE' ? 'bg-success-600 hover:bg-success-600/90' : 'bg-danger-600 hover:bg-danger-600/90'
                  }`}
                >
                  {submitting ? 'Confirming...' : `Confirm ${actionType}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
