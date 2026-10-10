import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { OutpassRequest } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { QrCodeModal } from '../../components/common/QrCodeModal';
import { useToast } from '../../context/ToastContext';
import {
  FileCheck2,
  Plus,
  QrCode,
  Calendar,
  Clock,
  MapPin,
  HelpCircle,
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Hourglass,
  XCircle
} from 'lucide-react';

export const StudentOutpasses: React.FC = () => {
  const toast = useToast();
  const [requests, setRequests] = useState<OutpassRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPassForQr, setSelectedPassForQr] = useState<OutpassRequest | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    purpose: '',
    destination: '',
    reason: '',
    leaving_date: '',
    leaving_time: '',
    return_date: '',
    return_time: '',
    attachment_url: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchOutpasses = async () => {
    try {
      setLoading(true);
      const res = await api.getOutpasses();
      if (res.success) {
        setRequests(res.requests || []);
      }
    } catch (err: any) {
      toast.error('Failed to load out-pass requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutpasses();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !formData.purpose ||
      !formData.destination ||
      !formData.reason ||
      !formData.leaving_date ||
      !formData.leaving_time ||
      !formData.return_date ||
      !formData.return_time
    ) {
      toast.error('Please complete all required fields.');
      return;
    }

    const leaving = new Date(`${formData.leaving_date}T${formData.leaving_time}`);
    const returning = new Date(`${formData.return_date}T${formData.return_time}`);

    if (returning <= leaving) {
      toast.error('Expected return time must be strictly after the leaving time.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createOutpass(formData);
      if (res.success) {
        toast.success('Out-Pass request submitted! Sent to Tutor, Parent, and Warden for approval.');
        setShowCreateModal(false);
        setFormData({
          purpose: '',
          destination: '',
          reason: '',
          leaving_date: '',
          leaving_time: '',
          return_date: '',
          return_time: '',
          attachment_url: '',
        });
        fetchOutpasses();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">My Out-Pass Requests</h2>
          <p className="text-sm text-ink-muted mt-1">
            Tutor + Parent + Warden approval required
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm transition shadow-md"
        >
          <Plus className="w-4 h-4" />
          Request Out-Pass
        </button>
      </div>

      {/* Out-Passes List */}
      <div className="space-y-4">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl border border-ink-border shadow-card p-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
                <div className="h-20 bg-slate-100 rounded-2xl mb-4"></div>
                <div className="h-16 bg-slate-50 rounded-xl"></div>
              </div>
            ))}
          </>
        ) : requests.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-ink-border shadow-card text-center flex flex-col items-center">
            <FileCheck2 className="w-16 h-16 text-slate-300 mb-4" />
            <h4 className="font-bold text-ink text-lg">No out-pass requests</h4>
            <p className="text-sm text-ink-muted mt-2 max-w-sm">
              You haven't requested any out-passes yet. Click the button above to submit your first application.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 btn-primary px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm transition shadow-md"
            >
              Request Out-Pass
            </button>
          </div>
        ) : (
          requests.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-3xl border border-ink-border p-6 shadow-card space-y-5"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-ink text-lg">{r.destination}</h3>
                  <StatusBadge status={r.status} size="md" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">
                    {r.purpose}
                  </span>
                  {r.status === 'APPROVED' && (
                    <button
                      onClick={() => setSelectedPassForQr(r)}
                      className="px-4 py-2 rounded-xl bg-success-600 hover:bg-success-700 text-white font-bold text-sm flex items-center gap-2 shadow-sm transition"
                    >
                      <QrCode className="w-4 h-4" />
                      View QR Pass
                    </button>
                  )}
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/60 rounded-2xl p-4">
                <div>
                  <span className="text-ink-muted text-xs font-semibold mb-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" /> Leaving
                  </span>
                  <span className="text-ink font-bold text-sm">
                    {r.leaving_date} at {r.leaving_time}
                  </span>
                </div>

                <div>
                  <span className="text-ink-muted text-xs font-semibold mb-1 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> Return
                  </span>
                  <span className="text-ink font-bold text-sm">
                    {r.return_date} at {r.return_time}
                  </span>
                </div>

                <div>
                  <span className="text-ink-muted text-xs font-semibold mb-1 block">Reason</span>
                  <span className="text-ink text-sm leading-snug line-clamp-2">{r.reason}</span>
                </div>
              </div>

              {/* Approval Progress */}
              <div>
                <span className="text-sm font-bold text-ink block mb-3">
                  Approval Progress
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {r.approvals?.map((app) => {
                    const isApproved = app.status === 'APPROVED';
                    const isRejected = app.status === 'REJECTED';
                    const isPending = app.status === 'PENDING';
                    
                    return (
                      <div
                        key={app.id}
                        className={`p-4 rounded-2xl border flex flex-col justify-between ${
                          isApproved
                            ? 'bg-success-50/40 border-success-200'
                            : isRejected
                            ? 'bg-danger-50/40 border-danger-200'
                            : 'bg-warn-50/40 border-warn-200'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold capitalize text-ink text-sm">
                            {app.approver_role}
                          </span>
                          <span className="flex items-center">
                            {isApproved && <CheckCircle2 className="w-5 h-5 text-success-600" />}
                            {isRejected && <XCircle className="w-5 h-5 text-danger-600" />}
                            {isPending && <Hourglass className="w-5 h-5 text-warn-600" />}
                          </span>
                        </div>
                        <p className="text-xs text-ink-muted italic">
                          {app.comments ? `"${app.comments}"` : 'Awaiting review'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Out-Pass Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-ink-border overflow-hidden">
            <div className="p-6 bg-primary-600 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold">New Out-Pass Application</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">
                    Purpose *
                  </label>
                  <select
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    className="w-full text-sm p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Select Purpose</option>
                    <option value="Home Visit">Home Visit</option>
                    <option value="Medical / Hospital">Medical / Hospital</option>
                    <option value="Academic Project">Academic Project</option>
                    <option value="Competition / Hackathon">Competition / Hackathon</option>
                    <option value="Personal Emergency">Personal Emergency</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">
                    Destination City / Address *
                  </label>
                  <input
                    type="text"
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    placeholder="e.g. Coimbatore Home"
                    className="w-full text-sm p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">
                  Reason in Detail *
                </label>
                <textarea
                  name="reason"
                  rows={2}
                  value={formData.reason}
                  onChange={handleInputChange}
                  placeholder="Provide complete reason for your leave request..."
                  className="w-full text-sm p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">
                    Leaving Date *
                  </label>
                  <input
                    type="date"
                    name="leaving_date"
                    value={formData.leaving_date}
                    onChange={handleInputChange}
                    className="w-full text-sm p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">
                    Leaving Time *
                  </label>
                  <input
                    type="time"
                    name="leaving_time"
                    value={formData.leaving_time}
                    onChange={handleInputChange}
                    className="w-full text-sm p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">
                    Return Date *
                  </label>
                  <input
                    type="date"
                    name="return_date"
                    value={formData.return_date}
                    onChange={handleInputChange}
                    className="w-full text-sm p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">
                    Return Time *
                  </label>
                  <input
                    type="time"
                    name="return_time"
                    value={formData.return_time}
                    onChange={handleInputChange}
                    className="w-full text-sm p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-full py-3 rounded-xl border border-slate-300 font-bold text-sm text-ink hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {selectedPassForQr && (
        <QrCodeModal
          outpass={selectedPassForQr}
          onClose={() => setSelectedPassForQr(null)}
        />
      )}
    </div>
  );
};
