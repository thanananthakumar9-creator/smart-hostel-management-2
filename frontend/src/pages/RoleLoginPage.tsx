import React, { useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  GraduationCap,
  ShieldCheck,
  BookOpen,
  ArrowLeft,
  Lock,
  User,
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
} from 'lucide-react';

interface RoleLoginPageProps {
  role: 'student' | 'admin' | 'teacher';
}

export const RoleLoginPage: React.FC<RoleLoginPageProps> = ({ role }) => {
  const { navigate } = useRouter();
  const { login } = useAuth();
  const toast = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const roleMeta = {
    student: {
      title: 'STUDENT LOGIN',
      subtitle: 'Access your student dashboard',
      idLabel: 'Roll Number',
      idPlaceholder: 'e.g. 23CS001',
      missingIdMsg: 'Please enter your roll number.',
      icon: GraduationCap,
      themeColor: 'from-sky-400 to-sky-600',
      btnColor: 'bg-sky-500 hover:bg-sky-600',
      dashboardPath: '/student/dashboard',
      demo: 'Demo: 23CS001 / student123'
    },
    admin: {
      title: 'ADMIN LOGIN',
      subtitle: 'Access the system control panel',
      idLabel: 'Admin ID',
      idPlaceholder: 'e.g. ADM001',
      missingIdMsg: 'Please enter your admin ID.',
      icon: ShieldCheck,
      themeColor: 'from-rose-400 to-rose-600',
      btnColor: 'bg-rose-500 hover:bg-rose-600',
      dashboardPath: '/admin/dashboard',
      demo: 'Demo: admin / admin123'
    },
    teacher: {
      title: 'TEACHER LOGIN',
      subtitle: 'Access your faculty portal',
      idLabel: 'Teacher ID',
      idPlaceholder: 'e.g. TCH001',
      missingIdMsg: 'Please enter your teacher ID.',
      icon: BookOpen,
      themeColor: 'from-indigo-400 to-indigo-600',
      btnColor: 'bg-indigo-500 hover:bg-indigo-600',
      dashboardPath: '/teacher/dashboard',
      demo: 'Demo: TCH001 / teacher123'
    },
  }[role];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim()) {
      toast.error(roleMeta.missingIdMsg);
      return;
    }

    if (!password) {
      toast.error('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      await login(identifier.trim(), password, role);
      toast.success('Login successful! Redirecting to dashboard...');
      navigate(roleMeta.dashboardPath);
    } catch (err: any) {
      toast.error(err.message || 'Invalid credentials for the selected role.');
    } finally {
      setLoading(false);
    }
  };

  const Icon = roleMeta.icon;

  return (
    <div className="min-h-screen bg-[#F4F6FC] flex">
      {/* Left Panel - Hidden on Mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#3155D9] to-indigo-900 overflow-hidden text-white flex-col justify-between p-12">
        {/* Decorative Shapes */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-[40%] right-[10%] w-32 h-32 border-4 border-white/10 rounded-full"></div>
        <div className="absolute bottom-[20%] left-[10%] w-24 h-24 bg-white/5 rounded-lg rotate-45"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-md mb-8 shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight mb-2">
            SMART HOSTEL
          </h1>
          <p className="text-lg xl:text-xl font-medium text-blue-100 tracking-widest uppercase">
            Management System
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <CheckCircle2 className="w-6 h-6 text-blue-100" />
            </div>
            <p className="text-lg font-medium text-blue-50">Secure Role-Based Access</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <CheckCircle2 className="w-6 h-6 text-blue-100" />
            </div>
            <p className="text-lg font-medium text-blue-50">Multi-Level Approvals</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <CheckCircle2 className="w-6 h-6 text-blue-100" />
            </div>
            <p className="text-lg font-medium text-blue-50">Location-Verified Attendance</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[#E8EBF2] p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr ${roleMeta.themeColor} text-white shadow-lg mb-6`}>
              <Icon className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#1F2430]">
              {roleMeta.title}
            </h2>
            <p className="text-[#7B849C] mt-2 font-medium">
              {roleMeta.subtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#1F2430] mb-2">
                {roleMeta.idLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#7B849C]">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={roleMeta.idPlaceholder}
                  className="block w-full pl-11 pr-4 py-3 text-base border border-[#E8EBF2] rounded-xl focus:ring-2 focus:ring-[#3155D9] focus:border-[#3155D9] transition outline-none text-[#1F2430] bg-[#F4F6FC]/50 focus:bg-white"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1F2430] mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#7B849C]">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="block w-full pl-11 pr-12 py-3 text-base border border-[#E8EBF2] rounded-xl focus:ring-2 focus:ring-[#3155D9] focus:border-[#3155D9] transition outline-none text-[#1F2430] bg-[#F4F6FC]/50 focus:bg-white"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#7B849C] hover:text-[#1F2430] focus:outline-none transition"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 rounded-xl text-base font-bold text-white ${roleMeta.btnColor} shadow-lg shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition duration-200`}
            >
              {loading ? 'Authenticating...' : 'LOGIN'}
            </button>
            
            <p className="text-center text-xs text-[#7B849C] mt-2">
              {roleMeta.demo}
            </p>
          </form>

          <div className="mt-8 pt-6 border-t border-[#E8EBF2] text-center">
            <button
              type="button"
              onClick={() => navigate('/select-role')}
              className="text-sm font-bold text-[#7B849C] hover:text-[#1F2430] flex items-center justify-center gap-2 mx-auto transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Role Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
