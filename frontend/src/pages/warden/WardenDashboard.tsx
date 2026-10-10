import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { OutpassRequest, AttendanceRecord, Issue, DashboardStats, Hostel } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { GeofenceMap } from '../../components/common/GeofenceMap';
import { useToast } from '../../context/ToastContext';
import {
  Building2,
  Users,
  FileCheck2,
  MapPin,
  AlertTriangle,
  Settings2,
  Check,
  X,
  Wrench,
  Search,
  Filter,
  Save,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface WardenDashboardProps {
  currentTab: string;
}

export const WardenDashboard: React.FC<WardenDashboardProps> = ({ currentTab }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [requests, setRequests] = useState<OutpassRequest[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [hostel, setHostel] = useState<Hostel | null>(null);
  const [loading, setLoading] = useState(true);

  // Warden Outpass Approve/Reject modal
  const [selectedPass, setSelectedPass] = useState<OutpassRequest | null>(null);
  const [outpassAction, setOutpassAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [outpassComment, setOutpassComment] = useState('');
  const [submittingPass, setSubmittingPass] = useState(false);

  // Issue update modal
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [issueStatus, setIssueStatus] = useState('IN PROGRESS');
  const [issueComment, setIssueComment] = useState('');
  const [submittingIssue, setSubmittingIssue] = useState(false);

  // Geofence configuration form
  const [geoForm, setGeoForm] = useState({
    name: 'Campus Main Hostel Block A',
    latitude: 11.016844,
    longitude: 76.955832,
    radius: 150.0,
  });
  const [savingGeofence, setSavingGeofence] = useState(false);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [statsRes, outRes, attRes, issRes, stuRes, hstRes] = await Promise.all([
        api.getStats().catch(() => ({ stats: null })),
        api.getOutpasses().catch(() => ({ requests: [] })),
        api.getAttendanceHistory().catch(() => ({ records: [] })),
        api.getIssues().catch(() => ({ issues: [] })),
        api.getStudents().catch(() => ({ students: [] })),
        api.getHostels().catch(() => ({ hostels: [] })),
      ]);

      setStats(statsRes.stats);
      setRequests(outRes.requests || []);
      setAttendance(attRes.records || []);
      setIssues(issRes.issues || []);
      setStudents(stuRes.students || []);

      const hostelsList = hstRes.hostels || [];
      if (hostelsList.length > 0) {
        setHostel(hostelsList[0]);
        setGeoForm({
          name: hostelsList[0].name,
          latitude: hostelsList[0].latitude,
          longitude: hostelsList[0].longitude,
          radius: hostelsList[0].radius,
        });
      }
    } catch {
      toast.error('Failed to load hostel data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleOutpassAction = async () => {
    if (!selectedPass) return;
    try {
      setSubmittingPass(true);
      if (outpassAction === 'APPROVE') {
        const res = await api.approveOutpass(selectedPass.id, outpassComment || 'Approved by Chief Warden.');
        toast.success(res.message);
      } else {
        const res = await api.rejectOutpass(selectedPass.id, outpassComment || 'Rejected by Warden.');
        toast.success(res.message);
      }
      setSelectedPass(null);
      setOutpassComment('');
      fetchAllData();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setSubmittingPass(false);
    }
  };

  const handleUpdateIssue = async () => {
    if (!selectedIssue) return;
    try {
      setSubmittingIssue(true);
      await api.updateIssue(selectedIssue.id, {
        status: issueStatus,
        comment: issueComment || `Status updated to ${issueStatus}`,
      });
      toast.success('Issue updated successfully!');
      setSelectedIssue(null);
      setIssueComment('');
      fetchAllData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update issue');
    } finally {
      setSubmittingIssue(false);
    }
  };

  const handleSaveGeofence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostel) return;
    try {
      setSavingGeofence(true);
      await api.updateGeofence(hostel.id, geoForm);
      toast.success('Hostel geofence parameters updated successfully!');
      fetchAllData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update geofence');
    } finally {
      setSavingGeofence(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner - Replaced with simple text header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#1F2430]">
          Hostel Warden Dashboard
        </h2>
        <p className="text-sm text-[#7B849C]">
          Welcome, {user?.name} — {hostel?.name || 'Block A Hostel'}
        </p>
      </div>

      {/* KPI Cards (when on Dashboard) */}
      {currentTab === 'dashboard' && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-[#E8EBF2] shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Students</span>
            <div className="text-2xl font-extrabold text-[#1F2430] mt-2">{stats.totalStudents}</div>
            <span className="text-xs text-emerald-600 font-semibold">{stats.presentStudents} Present Today</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-[#E8EBF2] shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">Pending Out-Passes</span>
            <div className="text-2xl font-extrabold text-amber-600 mt-2">{stats.pendingOutpasses}</div>
            <span className="text-xs text-slate-500">{stats.approvedOutpasses} Approved Total</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-[#E8EBF2] shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">Open Complaints</span>
            <div className="text-2xl font-extrabold text-rose-600 mt-2">{stats.openIssues}</div>
            <span className="text-xs text-teal-600 font-semibold">{stats.resolvedIssues} Resolved</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-[#E8EBF2] shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">Geofence Boundary</span>
            <div className="text-2xl font-extrabold text-purple-700 mt-2">{geoForm.radius}m</div>
            <span className="text-xs text-slate-500">Haversine GPS Verified</span>
          </div>
        </div>
      )}

      {/* Tab 1: Students Roster */}
      {currentTab === 'students' && (
        <div className="bg-white rounded-3xl border border-[#E8EBF2] p-6 shadow-sm overflow-hidden">
          <h3 className="font-bold text-[#1F2430] text-base pb-4 border-b border-[#E8EBF2] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#3155D9]" />
            Hostel Students Roster
          </h3>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Register Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Room Number</th>
                  <th className="py-3 px-4">Department / Year</th>
                  <th className="py-3 px-4">Parent / Contact</th>
                  <th className="py-3 px-4">Tutor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EBF2]">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 border-b border-[#E8EBF2]">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{s.register_number}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{s.name}</td>
                    <td className="py-3 px-4 font-bold text-[#3155D9]">Room {s.room_number || '204'}</td>
                    <td className="py-3 px-4 text-slate-600">{s.department} • Year {s.year}</td>
                    <td className="py-3 px-4 text-slate-600">{s.parent_name || 'Mr. Suresh Doe'} ({s.phone || 'N/A'})</td>
                    <td className="py-3 px-4 text-slate-600">{s.tutor_name || 'Prof. Anita'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Out-Pass Approvals */}
      {(currentTab === 'outpasses' || currentTab === 'dashboard') && (
        <div className="bg-white rounded-3xl border border-[#E8EBF2] p-6 shadow-sm space-y-4 overflow-hidden">
          <div className="flex justify-between items-center pb-3 border-b border-[#E8EBF2]">
            <div>
              <h3 className="font-bold text-[#1F2430] text-base">
                Out-Pass Requests & Approvals
              </h3>
              <p className="text-xs text-[#7B849C]">
                Final approval authority before digital QR gate pass is generated
              </p>
            </div>
            <span className="text-xs font-semibold text-[#7B849C]">
              {requests.length} Requests Total
            </span>
          </div>

          <div className="space-y-4">
            {requests.map((r) => {
              const tutorApp = r.approvals?.find((a) => a.approver_role === 'tutor');
              const parentApp = r.approvals?.find((a) => a.approver_role === 'parent');
              const wardenApp = r.approvals?.find((a) => a.approver_role === 'warden');

              const canWardenAct = wardenApp?.status === 'PENDING' && r.status === 'PENDING';

              return (
                <div
                  key={r.id}
                  className="p-5 rounded-2xl border border-[#E8EBF2] bg-slate-50/50 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[#1F2430] text-base">{r.destination}</h4>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white border border-[#E8EBF2] text-[#1F2430]">
                          {r.register_number} • {r.student_name}
                        </span>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="text-xs text-[#7B849C] mt-0.5">
                        {r.purpose} • Leaving: {r.leaving_date} {r.leaving_time} → Return: {r.return_date} {r.return_time}
                      </p>
                    </div>

                    {canWardenAct && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedPass(r);
                            setOutpassAction('APPROVE');
                            setOutpassComment('');
                          }}
                          className="px-4 py-2 rounded-xl bg-[#22A06B] hover:bg-[#1E8A5C] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                        >
                          <Check className="w-4 h-4" />
                          Approve Gate Pass
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPass(r);
                            setOutpassAction('REJECT');
                            setOutpassComment('');
                          }}
                          className="px-4 py-2 rounded-xl bg-[#E25555] hover:bg-[#C94A4A] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Multi-approval badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E8EBF2] text-xs">
                    <span className="font-semibold text-[#7B849C]">Individual Approvals:</span>
                    <span className={`px-2 py-0.5 rounded font-semibold text-[11px] border ${tutorApp?.status === 'APPROVED' ? 'bg-[#ECFDF5] text-[#22A06B] border-[#22A06B]/20' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      Tutor: {tutorApp?.status || 'PENDING'}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-semibold text-[11px] border ${parentApp?.status === 'APPROVED' ? 'bg-[#ECFDF5] text-[#22A06B] border-[#22A06B]/20' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      Parent: {parentApp?.status || 'PENDING'}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-semibold text-[11px] border ${wardenApp?.status === 'APPROVED' ? 'bg-[#ECFDF5] text-[#22A06B] border-[#22A06B]/20' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      Warden: {wardenApp?.status || 'PENDING'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Attendance Monitor */}
      {currentTab === 'attendance' && (
        <div className="bg-white rounded-3xl border border-[#E8EBF2] p-6 shadow-sm overflow-hidden">
          <h3 className="font-bold text-[#1F2430] text-base pb-4 border-b border-[#E8EBF2] flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#22A06B]" />
            Live Attendance Monitoring
          </h3>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Room</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Distance from Geofence Center</th>
                  <th className="py-3 px-4">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EBF2]">
                {attendance.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 border-b border-[#E8EBF2]">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {a.student_name} <span className="font-mono text-slate-400">({a.register_number})</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-700">Room {a.room_number || '204'}</td>
                    <td className="py-3 px-4 text-slate-600">{a.date} at {a.time}</td>
                    <td className="py-3 px-4"><StatusBadge status={a.status} /></td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {a.distance_from_hostel ? `${a.distance_from_hostel}m` : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{a.verification_method || 'GEOFENCE_GPS'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Complaints & Issues */}
      {currentTab === 'issues' && (
        <div className="bg-white rounded-3xl border border-[#E8EBF2] p-6 shadow-sm space-y-4 overflow-hidden">
          <div className="flex justify-between items-center pb-3 border-b border-[#E8EBF2]">
            <div>
              <h3 className="font-bold text-[#1F2430] text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Hostel Complaints & Maintenance Management
              </h3>
              <p className="text-xs text-[#7B849C]">
                Assign repairs to staff and update resolution lifecycle
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {issues.map((i) => (
              <div
                key={i.id}
                className="p-5 rounded-2xl border border-[#E8EBF2] bg-white hover:border-slate-300 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1F2430] text-sm">{i.category} Issue</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-[#7B849C]">
                        Room {i.room_number || 'General'}
                      </span>
                      <StatusBadge status={i.status} />
                    </div>
                    <p className="text-xs text-[#1F2430] mt-1">{i.description}</p>
                    <span className="text-[11px] text-[#7B849C] mt-0.5 block">
                      Reported by {i.student_name} ({i.register_number}) • Priority: {i.priority}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedIssue(i);
                      setIssueStatus(i.status);
                      setIssueComment('');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#3155D9] hover:bg-[#2A4BBE] text-white font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <Wrench className="w-4 h-4" />
                    Update Status / Assign
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Geofence Settings */}
      {currentTab === 'geofence' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-[#E8EBF2] p-6 shadow-sm space-y-4 overflow-hidden">
            <h3 className="font-bold text-[#1F2430] text-base flex items-center gap-2 pb-3 border-b border-[#E8EBF2]">
              <Settings2 className="w-5 h-5 text-[#3155D9]" />
              Configure Hostel Geofence Boundary
            </h3>

            <form onSubmit={handleSaveGeofence} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1F2430] uppercase mb-1">
                  Hostel Name
                </label>
                <input
                  type="text"
                  value={geoForm.name}
                  onChange={(e) => setGeoForm({ ...geoForm, name: e.target.value })}
                  className="w-full text-xs p-2.5 border border-[#E8EBF2] rounded-xl outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1F2430] uppercase mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={geoForm.latitude}
                    onChange={(e) => setGeoForm({ ...geoForm, latitude: parseFloat(e.target.value) })}
                    className="w-full text-xs p-2.5 border border-[#E8EBF2] rounded-xl outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1F2430] uppercase mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={geoForm.longitude}
                    onChange={(e) => setGeoForm({ ...geoForm, longitude: parseFloat(e.target.value) })}
                    className="w-full text-xs p-2.5 border border-[#E8EBF2] rounded-xl outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2430] uppercase mb-1">
                  Allowed Radius (Meters)
                </label>
                <input
                  type="number"
                  step="1"
                  min="20"
                  max="1000"
                  value={geoForm.radius}
                  onChange={(e) => setGeoForm({ ...geoForm, radius: parseFloat(e.target.value) })}
                  className="w-full text-xs p-2.5 border border-[#E8EBF2] rounded-xl outline-none font-bold"
                  required
                />
                <span className="text-[11px] text-[#7B849C] mt-1 block">
                  Students must be within this boundary to receive PRESENT status.
                </span>
              </div>

              <button
                type="submit"
                disabled={savingGeofence}
                className="w-full py-3 rounded-xl bg-[#3155D9] hover:bg-[#2A4BBE] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingGeofence ? 'Saving...' : 'Save Geofence Configuration'}
              </button>
            </form>
          </div>

          <div>
            <GeofenceMap
              hostelName={geoForm.name}
              hostelLat={geoForm.latitude}
              hostelLon={geoForm.longitude}
              hostelRadius={geoForm.radius}
            />
          </div>
        </div>
      )}

      {/* Outpass Action Modal */}
      {selectedPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#E8EBF2] overflow-hidden">
            <div className={`p-6 text-white ${outpassAction === 'APPROVE' ? 'bg-[#22A06B]' : 'bg-[#E25555]'}`}>
              <h3 className="text-lg font-bold">
                {outpassAction === 'APPROVE' ? 'Warden Out-Pass Authorization' : 'Reject Out-Pass'}
              </h3>
              <p className="text-xs opacity-90">{selectedPass.student_name} → {selectedPass.destination}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1F2430] uppercase mb-1">
                  Warden Official Comments
                </label>
                <textarea
                  rows={3}
                  value={outpassComment}
                  onChange={(e) => setOutpassComment(e.target.value)}
                  placeholder="e.g. Authorized. Student must return before curfew."
                  className="w-full text-xs p-2.5 border border-[#E8EBF2] rounded-xl outline-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPass(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E8EBF2] text-xs font-bold text-[#1F2430] hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleOutpassAction}
                  disabled={submittingPass}
                  className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs disabled:opacity-50 ${
                    outpassAction === 'APPROVE' ? 'bg-[#22A06B] hover:bg-[#1E8A5C]' : 'bg-[#E25555] hover:bg-[#C94A4A]'
                  }`}
                >
                  {submittingPass ? 'Processing...' : `Confirm ${outpassAction}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issue Update Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#E8EBF2] overflow-hidden">
            <div className="p-6 bg-slate-900 text-white">
              <h3 className="text-lg font-bold">Update Complaint Status</h3>
              <p className="text-xs text-slate-400">{selectedIssue.category} • Room {selectedIssue.room_number || 'General'}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1F2430] uppercase mb-1">
                  Status
                </label>
                <select
                  value={issueStatus}
                  onChange={(e) => setIssueStatus(e.target.value)}
                  className="w-full text-xs p-2.5 border border-[#E8EBF2] rounded-xl outline-none"
                >
                  <option value="NEW">NEW</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="IN PROGRESS">IN PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2430] uppercase mb-1">
                  Resolution Note / Action Taken
                </label>
                <textarea
                  rows={3}
                  value={issueComment}
                  onChange={(e) => setIssueComment(e.target.value)}
                  placeholder="e.g. Electrician fixed switchboard wiring."
                  className="w-full text-xs p-2.5 border border-[#E8EBF2] rounded-xl outline-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedIssue(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E8EBF2] text-xs font-bold text-[#1F2430] hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateIssue}
                  disabled={submittingIssue}
                  className="flex-1 py-2.5 rounded-xl bg-[#3155D9] hover:bg-[#2A4BBE] text-white font-bold text-xs disabled:opacity-50"
                >
                  {submittingIssue ? 'Saving...' : 'Save Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
