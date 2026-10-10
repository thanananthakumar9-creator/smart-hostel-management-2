import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  MapPin,
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Building,
  ChevronRight
} from 'lucide-react';

interface StudentDashboardProps {
  onNavigate: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    attendancePercentage: 92,
    todayMarked: false,
    activeOutpasses: 0,
    openIssues: 0,
  });
  const [recentOutpasses, setRecentOutpasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load today attendance
        const attRes = await api.getTodayAttendance().catch(() => ({ hasMarkedToday: false }));
        // Load outpasses
        const outRes = await api.getOutpasses().catch(() => ({ requests: [] }));
        // Load issues
        const issRes = await api.getIssues().catch(() => ({ issues: [] }));

        const requests = outRes.requests || [];
        const issues = issRes.issues || [];

        const activeOut = requests.filter((r: any) => r.status === 'PENDING' || r.status === 'APPROVED').length;
        const openIss = issues.filter((i: any) => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length;

        setStats({
          attendancePercentage: 92,
          todayMarked: attRes.hasMarkedToday,
          activeOutpasses: activeOut,
          openIssues: openIss,
        });

        setRecentOutpasses(requests.slice(0, 3));
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse w-full min-w-0">
        <div className="h-10 bg-gray-200 rounded-xl w-1/3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 w-full min-w-0">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-3xl border border-ink-border shadow-card p-5 h-36 w-full box-border"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)] gap-6 w-full min-w-0">
          <div className="bg-white rounded-3xl border border-ink-border shadow-card p-6 h-64 w-full box-border"></div>
          <div className="bg-white rounded-3xl border border-ink-border shadow-card p-6 h-64 w-full box-border"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full min-w-0 box-border">
      {/* Section 1: Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full min-w-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-ink">
            Hi, {user?.name || 'Student'}! 👋
          </h1>
          <p className="text-ink-muted mt-1 text-sm">
            Here's your hostel activity overview for today.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap shrink-0">
          <button
            onClick={() => onNavigate('attendance')}
            className="btn-success px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shrink-0 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Mark Attendance</span>
          </button>
          <button
            onClick={() => onNavigate('outpasses')}
            className="btn-primary px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shrink-0 shadow-sm"
          >
            <FileCheck2 className="w-4 h-4 shrink-0" />
            <span>Request Out-Pass</span>
          </button>
        </div>
      </div>

      {/* Section 2: 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 w-full min-w-0">
        {/* Card 1: Attendance */}
        <div className="bg-white rounded-3xl border border-ink-border shadow-card p-5 flex flex-col justify-between w-full min-w-0 box-border hover:shadow-card-md transition-shadow">
          <div className="flex justify-between items-start gap-2">
            <span className="uppercase text-[11px] font-bold text-ink-muted tracking-wide truncate">
              Attendance This Month
            </span>
            <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center text-success-600 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold text-ink">
              {stats.attendancePercentage}%
            </div>
            <p className="text-xs text-ink-muted mt-1 truncate">
              {stats.todayMarked ? 'Marked Present Today' : 'Not marked today'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('attendance')}
            className="text-xs font-semibold text-primary-600 flex items-center gap-1 hover:text-primary-700 w-fit"
          >
            View History <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Out-Passes */}
        <div className="bg-white rounded-3xl border border-ink-border shadow-card p-5 flex flex-col justify-between w-full min-w-0 box-border hover:shadow-card-md transition-shadow">
          <div className="flex justify-between items-start gap-2">
            <span className="uppercase text-[11px] font-bold text-ink-muted tracking-wide truncate">
              Active Out-Passes
            </span>
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold text-ink">
              {stats.activeOutpasses}
            </div>
            <p className="text-xs text-ink-muted mt-1 truncate">
              Pending or approved passes
            </p>
          </div>
          <button
            onClick={() => onNavigate('outpasses')}
            className="text-xs font-semibold text-primary-600 flex items-center gap-1 hover:text-primary-700 w-fit"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: Issues */}
        <div className="bg-white rounded-3xl border border-ink-border shadow-card p-5 flex flex-col justify-between w-full min-w-0 box-border hover:shadow-card-md transition-shadow">
          <div className="flex justify-between items-start gap-2">
            <span className="uppercase text-[11px] font-bold text-ink-muted tracking-wide truncate">
              Open Issues
            </span>
            <div className="w-10 h-10 rounded-xl bg-warn-50 flex items-center justify-center text-warn-600 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold text-ink">
              {stats.openIssues}
            </div>
            <p className="text-xs text-ink-muted mt-1 truncate">
              Maintenance requests
            </p>
          </div>
          <button
            onClick={() => onNavigate('issues')}
            className="text-xs font-semibold text-primary-600 flex items-center gap-1 hover:text-primary-700 w-fit"
          >
            Manage Issues <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 4: Current Status */}
        <div className="bg-white rounded-3xl border border-ink-border shadow-card p-5 flex flex-col justify-between w-full min-w-0 box-border hover:shadow-card-md transition-shadow">
          <div className="flex justify-between items-start gap-2">
            <span className="uppercase text-[11px] font-bold text-ink-muted tracking-wide truncate">
              Current Status
            </span>
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className={`text-3xl font-extrabold ${stats.todayMarked ? 'text-success-600' : 'text-warn-600'}`}>
              {stats.todayMarked ? 'Inside' : 'Unknown'}
            </div>
            <p className="text-xs text-ink-muted mt-1 truncate">
              {stats.todayMarked ? 'Hostel Premises' : 'Mark attendance to verify'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('attendance')}
            className="text-xs font-semibold text-primary-600 flex items-center gap-1 hover:text-primary-700 w-fit"
          >
            Update Status <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Section 3: Two-column Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)] gap-6 w-full min-w-0 items-start">
        {/* Left Column: Recent Out-Passes */}
        <div className="bg-white rounded-3xl border border-ink-border shadow-card p-5 sm:p-6 min-w-0 w-full box-border">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h3 className="font-semibold text-ink text-base sm:text-lg">Recent Out-Pass Requests</h3>
            <button
              onClick={() => onNavigate('outpasses')}
              className="text-xs sm:text-sm font-semibold text-primary-600 flex items-center gap-1 hover:text-primary-700 shrink-0"
            >
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-ink-border">
            {recentOutpasses.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-ink-muted">
                <FileCheck2 className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No requests yet</p>
              </div>
            ) : (
              recentOutpasses.map((p) => (
                <div key={p.id} className="py-4 flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center min-w-0">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-ink text-sm sm:text-base break-words">{p.destination}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-xs text-ink-muted break-words leading-relaxed">
                      <span className="font-medium text-ink-muted">{p.purpose}</span> • {p.leaving_date} {p.leaving_time} → {p.return_date} {p.return_time}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                    {p.approvals?.map((a: any) => (
                      <span
                        key={a.id}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                          a.status === 'APPROVED'
                            ? 'bg-success-50 text-success-600 border-success-600/20'
                            : a.status === 'REJECTED'
                            ? 'bg-danger-50 text-danger-600 border-danger-600/20'
                            : 'bg-warn-50 text-warn-600 border-warn-600/20'
                        }`}
                      >
                        {a.approver_role.substring(0, 3).toUpperCase()}: {a.status}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Quick Actions */}
        <div className="bg-white rounded-3xl border border-ink-border shadow-card p-5 sm:p-6 min-w-0 w-full box-border">
          <h3 className="font-semibold text-ink text-base sm:text-lg mb-4">Quick Actions</h3>
          <div className="flex flex-col gap-3 min-w-0">
            {/* Mark Attendance Action */}
            <button
              onClick={() => onNavigate('attendance')}
              className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-success-50 hover:bg-success-100 text-success-600 transition-colors text-left min-w-0 box-border group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shrink-0 shadow-sm">
                  <MapPin className="w-5 h-5 text-success-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-ink truncate">Mark Attendance</div>
                  <div className="text-xs text-ink-muted mt-0.5 truncate">Record current GPS location</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 shrink-0 text-success-600 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Request Out-Pass Action */}
            <button
              onClick={() => onNavigate('outpasses')}
              className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-primary-50 hover:bg-primary-100 text-primary-600 transition-colors text-left min-w-0 box-border group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shrink-0 shadow-sm">
                  <FileCheck2 className="w-5 h-5 text-primary-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-ink truncate">Request Out-Pass</div>
                  <div className="text-xs text-ink-muted mt-0.5 truncate">Apply for a new leave pass</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 shrink-0 text-primary-600 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Report Issue Action */}
            <button
              onClick={() => onNavigate('issues')}
              className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-warn-50 hover:bg-warn-100 text-warn-600 transition-colors text-left min-w-0 box-border group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shrink-0 shadow-sm">
                  <AlertTriangle className="w-5 h-5 text-warn-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-ink truncate">Report Issue</div>
                  <div className="text-xs text-ink-muted mt-0.5 truncate">Log a maintenance request</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 shrink-0 text-warn-600 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
