import React from 'react';
import { useRouter } from '../context/RouterContext';
import {
  GraduationCap,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Building2,
  CheckCircle2,
} from 'lucide-react';

export const RoleSelectionPage: React.FC = () => {
  const { navigate } = useRouter();

  const roles = [
    {
      id: 'student',
      title: 'Student',
      subtitle: 'Student Portal',
      icon: GraduationCap,
      highlights: [
        'Location-Verified Attendance',
        'Digital Out-Pass Requests',
        'Hostel Issues & Tracking',
      ],
      route: '/login/student',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      iconBg: 'bg-gradient-to-tr from-sky-400 to-sky-600 text-white',
      hoverBorder: 'hover:border-sky-300',
      btnColor: 'bg-sky-50 hover:bg-sky-100 text-sky-700',
    },
    {
      id: 'admin',
      title: 'Admin',
      subtitle: 'System Control',
      icon: ShieldCheck,
      highlights: [
        'Hostel & Room Management',
        'User Directory Control',
        'Reports & System Settings',
      ],
      route: '/login/admin',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      iconBg: 'bg-gradient-to-tr from-rose-400 to-rose-600 text-white',
      hoverBorder: 'hover:border-rose-300',
      btnColor: 'bg-rose-50 hover:bg-rose-100 text-rose-700',
    },
    {
      id: 'teacher',
      title: 'Teacher',
      subtitle: 'Teacher Portal',
      icon: BookOpen,
      highlights: [
        'Assigned Student Directory',
        'Out-Pass Approval Clearance',
        'Student Attendance Monitoring',
      ],
      route: '/login/teacher',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      iconBg: 'bg-gradient-to-tr from-indigo-400 to-indigo-600 text-white',
      hoverBorder: 'hover:border-indigo-300',
      btnColor: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6FC] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-[#3155D9] to-blue-400 text-white shadow-lg mb-6">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1F2430] tracking-tight">
          SMART HOSTEL
        </h1>
        <p className="text-sm sm:text-base font-semibold text-[#3155D9] mt-2 tracking-widest uppercase">
          Management System
        </p>
        <p className="mt-4 text-[#7B849C]">
          Select your role to access your portal
        </p>
      </div>

      {/* Cards */}
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {roles.map((r) => {
            const Icon = r.icon;
            return (
              <div
                key={r.id}
                onClick={() => navigate(r.route)}
                className={`bg-white rounded-3xl border border-[#E8EBF2] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all duration-300 cursor-pointer flex flex-col hover:shadow-[0_10px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 ${r.hoverBorder}`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-inner ${r.iconBg}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${r.badgeColor}`}>
                    {r.subtitle}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-[#1F2430] mb-6">
                  {r.title}
                </h3>

                <div className="space-y-4 flex-grow mb-8">
                  {r.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#22A06B] flex-shrink-0 mt-0.5" />
                      <span className="text-[#7B849C] text-sm font-medium">{h}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(r.route);
                  }}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition duration-200 ${r.btnColor}`}
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 text-sm text-[#7B849C] font-medium">
        © Smart Hostel Management System
      </div>
    </div>
  );
};
