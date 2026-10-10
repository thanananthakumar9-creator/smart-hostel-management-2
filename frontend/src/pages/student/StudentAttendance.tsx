import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AttendanceRecord } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { GeofenceMap } from '../../components/common/GeofenceMap';
import { useToast } from '../../context/ToastContext';
import {
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Compass,
  History,
  Calendar
} from 'lucide-react';

export const StudentAttendance: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  // Current Geolocation state
  const [coords, setCoords] = useState<{ lat: number | null; lon: number | null }>({
    lat: null,
    lon: null,
  });

  const student = user?.student;
  const hostelLat = student?.hostel_lat || 11.016844;
  const hostelLon = student?.hostel_lon || 76.955832;
  const hostelRadius = student?.hostel_radius || 150.0;
  const hostelName = student?.hostel_name || 'Campus Main Hostel Block A';

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.getAttendanceHistory();
      if (res.success) {
        setHistory(res.records || []);
      }
    } catch {
      toast.error('Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleMarkAttendanceWithCoords = async (latitude: number, longitude: number, accuracy: number = 10) => {
    setCoords({ lat: latitude, lon: longitude });
    try {
      setMarking(true);
      setLastResult(null);

      const res = await api.markAttendance(latitude, longitude, accuracy);
      setLastResult(res);
      toast.success(res.message);
      fetchHistory();
    } catch (err: any) {
      setLastResult({
        success: false,
        status: 'NOT_VERIFIED',
        message: err.message || 'Verification failed.',
      });
      toast.error(err.message || 'Attendance verification failed.');
    } finally {
      setMarking(false);
    }
  };

  const handleLiveGpsAttendance = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setMarking(true);
    toast.info('Requesting GPS location from device...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        handleMarkAttendanceWithCoords(latitude, longitude, accuracy);
      },
      (error) => {
        setMarking(false);
        let msg = 'Failed to obtain GPS coordinates.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission denied by user. Please allow location access in your browser settings.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location unavailable. GPS hardware signal not detected.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please try again.';
        }
        toast.error(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const presentCount = history.filter(r => r.status === 'PRESENT').length;
  const totalRecords = history.length;
  const attendancePercentage = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Section 1: Attendance Action Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h2 className="font-bold text-xl text-[#1F2430]">Mark Today's Attendance</h2>
            <p className="text-sm text-[#7B849C]">
              GPS location will be verified against the hostel geofence boundary
            </p>
            <div className="flex items-center gap-2 text-sm text-[#1F2430] mt-2">
              <MapPin className="w-5 h-5 text-[#3155D9]" />
              <span className="font-medium">{hostelName}</span>
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full md:w-auto">
            <button
              onClick={handleLiveGpsAttendance}
              disabled={marking}
              className="px-6 py-4 rounded-2xl bg-[#22A06B] hover:bg-[#1f8e5f] text-white font-bold text-sm shadow-md flex justify-center items-center gap-2 disabled:opacity-50 transition-all w-full"
            >
              <Compass className={`w-5 h-5 ${marking ? 'animate-spin' : ''}`} />
              {marking ? 'Verifying...' : 'Mark Attendance (Live GPS)'}
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => handleMarkAttendanceWithCoords(hostelLat + 0.0001, hostelLon + 0.0001)}
                disabled={marking}
                className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Inside Test
              </button>
              <button
                onClick={() => handleMarkAttendanceWithCoords(hostelLat + 0.015, hostelLon + 0.015)}
                disabled={marking}
                className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Outside Test
              </button>
            </div>
          </div>
        </div>

        {lastResult && (
          <div
            className={`p-4 rounded-2xl border flex items-center gap-3 ${
              lastResult.status === 'PRESENT'
                ? 'bg-[#ECFDF5] border-[#22A06B] text-[#22A06B]'
                : 'bg-[#FEF2F2] border-[#E25555] text-[#E25555]'
            }`}
          >
            {lastResult.status === 'PRESENT' ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <ShieldAlert className="w-6 h-6" />
            )}
            <div>
              <h4 className="font-bold text-sm">
                {lastResult.status === 'PRESENT' ? 'Attendance Marked: PRESENT' : 'Outside Hostel Boundary'}
              </h4>
              {lastResult.distanceMeters !== undefined && (
                <p className="text-xs mt-0.5 opacity-90">
                  Distance: {lastResult.distanceMeters}m (Allowed: {hostelRadius}m)
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <span className="text-sm font-medium text-[#7B849C]">This Month</span>
          <span className="text-3xl font-bold text-[#1F2430] mt-1">{attendancePercentage}%</span>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <span className="text-sm font-medium text-[#7B849C]">Present Days</span>
          <span className="text-3xl font-bold text-[#1F2430] mt-1">{presentCount}</span>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <span className="text-sm font-medium text-[#7B849C]">Total Records</span>
          <span className="text-3xl font-bold text-[#1F2430] mt-1">{totalRecords}</span>
        </div>
      </div>

      {/* Section 4: Geofence Map */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-[#1F2430]">Geofence Map</h3>
        </div>
        <div className="p-1">
          <GeofenceMap
            hostelName={hostelName}
            hostelLat={hostelLat}
            hostelLon={hostelLon}
            hostelRadius={hostelRadius}
            studentLat={coords.lat}
            studentLon={coords.lon}
            distanceMeters={lastResult?.distanceMeters}
            isInside={lastResult?.isInside}
          />
        </div>
      </div>

      {/* Section 3: Attendance History Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-[#1F2430]">Attendance History</h3>
          <span className="px-3 py-1 bg-[#EEF2FF] text-[#3155D9] text-xs font-bold rounded-full">
            {totalRecords} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-[#7B849C]">
              <tr>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Time</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Distance</th>
                <th className="py-3 px-6">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#7B849C]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Calendar className="w-8 h-8 opacity-50" />
                      <span>No attendance records yet</span>
                    </div>
                  </td>
                </tr>
              ) : (
                history.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-6 font-semibold text-[#1F2430]">{record.date}</td>
                    <td className="py-4 px-6 font-mono text-[#7B849C]">{record.time}</td>
                    <td className="py-4 px-6">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="py-4 px-6 text-[#7B849C]">
                      {record.distance_from_hostel !== undefined && record.distance_from_hostel !== null
                        ? `${record.distance_from_hostel}m`
                        : '-'}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs bg-slate-50 px-2 py-1 rounded text-[#7B849C] border border-slate-100">
                        {record.verification_method || 'GPS'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
