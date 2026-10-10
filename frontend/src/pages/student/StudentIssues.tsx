import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Issue, IssueCategory, IssuePriority } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import {
  Plus,
  Wrench,
  Clock,
  Send,
  X,
  CheckCircle2,
} from 'lucide-react';

export const StudentIssues: React.FC = () => {
  const toast = useToast();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Form state
  const [category, setCategory] = useState<IssueCategory>('Electrical');
  const [roomNumber, setRoomNumber] = useState('');
  const [priority, setPriority] = useState<IssuePriority>('MEDIUM');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Comment state inside detail modal
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await api.getIssues();
      if (res.success) {
        setIssues(res.issues || []);
      }
    } catch {
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !description) {
      toast.error('Please specify category and description.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createIssue({
        category,
        room_number: roomNumber || undefined,
        priority,
        description,
      });

      if (res.success) {
        toast.success('Complaint submitted to Hostel Warden!');
        setShowCreateModal(false);
        setDescription('');
        setRoomNumber('');
        fetchIssues();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit issue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDetails = async (issue: Issue) => {
    try {
      const res = await api.getIssueById(issue.id);
      if (res.success) {
        setSelectedIssue(res.issue);
      } else {
        setSelectedIssue(issue);
      }
    } catch {
      setSelectedIssue(issue);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedIssue) return;

    try {
      setCommenting(true);
      await api.addIssueComment(selectedIssue.id, commentText.trim());
      setCommentText('');
      // Reload issue details
      const res = await api.getIssueById(selectedIssue.id);
      if (res.success) {
        setSelectedIssue(res.issue);
      }
      toast.success('Comment added to issue timeline.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add comment');
    } finally {
      setCommenting(false);
    }
  };

  const totalIssues = issues.length;
  const newIssues = issues.filter(i => i.status === 'NEW').length;
  const inProgressIssues = issues.filter(i => i.status === 'IN PROGRESS' || i.status === 'ASSIGNED').length;
  const resolvedIssues = issues.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length;

  return (
    <div className="space-y-6 bg-[#F4F6FC] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1F2430] flex items-center gap-2">
            <Wrench className="w-6 h-6 text-[#E6A23C]" />
            Hostel Issues & Maintenance
          </h2>
          <p className="text-sm text-[#7B849C] mt-1">
            Report electrical, plumbing, network, or room repairs directly to the warden office
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 rounded-xl bg-[#E6A23C] hover:bg-[#D99232] text-white font-bold text-sm shadow-md flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          Report Issue
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-sm flex flex-col justify-center items-center">
          <span className="text-[#7B849C] text-xs font-bold uppercase tracking-wider mb-1">Total Issues</span>
          <span className="text-2xl font-bold text-[#1F2430]">{totalIssues}</span>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-sm flex flex-col justify-center items-center">
          <span className="text-[#7B849C] text-xs font-bold uppercase tracking-wider mb-1">New</span>
          <span className="text-2xl font-bold text-[#3155D9]">{newIssues}</span>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-sm flex flex-col justify-center items-center">
          <span className="text-[#7B849C] text-xs font-bold uppercase tracking-wider mb-1">In Progress</span>
          <span className="text-2xl font-bold text-[#E6A23C]">{inProgressIssues}</span>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-sm flex flex-col justify-center items-center">
          <span className="text-[#7B849C] text-xs font-bold uppercase tracking-wider mb-1">Resolved</span>
          <span className="text-2xl font-bold text-[#22A06B]">{resolvedIssues}</span>
        </div>
      </div>

      {/* Issues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-1 md:col-span-2 bg-white p-12 rounded-3xl border border-[#E2E8F0] text-center text-[#7B849C] text-sm">
            Loading issues...
          </div>
        ) : issues.length === 0 ? (
          <div className="col-span-1 md:col-span-2 bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center flex flex-col items-center">
            <CheckCircle2 className="w-12 h-12 text-[#22A06B] mb-2" />
            <h4 className="font-bold text-[#1F2430] text-base">No Open Issues</h4>
            <p className="text-sm text-[#7B849C] mt-1">
              Everything in your room and hostel wing is functioning smoothly!
            </p>
          </div>
        ) : (
          issues.map((i) => (
            <div
              key={i.id}
              onClick={() => handleOpenDetails(i)}
              className="bg-white rounded-3xl border border-[#E2E8F0] p-5 shadow-sm hover:shadow-md cursor-pointer transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-[#7B849C] border border-transparent">
                      {i.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        i.priority === 'URGENT' || i.priority === 'HIGH'
                          ? 'bg-[#FEF2F2] text-[#E25555]'
                          : i.priority === 'MEDIUM'
                          ? 'bg-[#FFFBEB] text-[#E6A23C]'
                          : 'bg-slate-50 text-slate-500'
                      }`}
                    >
                      {i.priority}
                    </span>
                  </div>
                  <StatusBadge status={i.status} />
                </div>

                <p className="text-sm font-semibold text-[#1F2430] mt-4 line-clamp-2">
                  {i.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-[#7B849C]">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {new Date(i.created_at).toLocaleDateString()}
                </span>
                <span className="text-[#3155D9] font-semibold hover:underline">
                  View Timeline &rarr;
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Report Issue Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 bg-[#E6A23C] text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Report Hostel Maintenance Issue</h3>
                <p className="text-xs text-white/80 mt-1">Describe the problem for prompt technician dispatch</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIssue} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F2430] uppercase mb-1.5">
                    Issue Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as IssueCategory)}
                    className="form-input w-full text-sm p-3 border border-slate-200 rounded-xl outline-none focus:border-[#3155D9] focus:ring-1 focus:ring-[#3155D9]"
                    required
                  >
                    <option value="Electrical">Electrical</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Water">Water</option>
                    <option value="Internet">Internet</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Room Maintenance">Room Maintenance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F2430] uppercase mb-1.5">
                    Priority Level *
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as IssuePriority)}
                    className="form-input w-full text-sm p-3 border border-slate-200 rounded-xl outline-none focus:border-[#3155D9] focus:ring-1 focus:ring-[#3155D9]"
                    required
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent (Immediate)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2430] uppercase mb-1.5">
                  Room Number (Optional)
                </label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. 204 or Corridor Wing B"
                  className="form-input w-full text-sm p-3 border border-slate-200 rounded-xl outline-none focus:border-[#3155D9] focus:ring-1 focus:ring-[#3155D9]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2430] uppercase mb-1.5">
                  Problem Description *
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what is damaged or requires repair..."
                  className="form-input w-full text-sm p-3 border border-slate-200 rounded-xl outline-none focus:border-[#3155D9] focus:ring-1 focus:ring-[#3155D9]"
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-[#1F2430] hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-[#E6A23C] hover:bg-[#D99232] text-white font-bold text-sm disabled:opacity-50 transition"
                >
                  {submitting ? 'Submitting...' : 'Submit Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Details & Timeline Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold text-[#E6A23C]">
                    {selectedIssue.category}
                  </span>
                  <StatusBadge status={selectedIssue.status} />
                </div>
                <h3 className="text-base font-bold mt-1.5">Issue Details & Timeline</h3>
              </div>
              <button
                onClick={() => setSelectedIssue(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="bg-[#F4F6FC] p-4 rounded-2xl space-y-2">
                <span className="text-[#7B849C] text-xs font-bold uppercase tracking-wider block">Description</span>
                <p className="text-[#1F2430] text-sm font-medium leading-relaxed">{selectedIssue.description}</p>
                <div className="flex flex-wrap gap-4 pt-3 text-[11px] text-[#7B849C]">
                  <span>Priority: <strong className="text-[#1F2430]">{selectedIssue.priority}</strong></span>
                  <span>Room: <strong className="text-[#1F2430]">{selectedIssue.room_number || 'General'}</strong></span>
                  <span>Reported: <strong className="text-[#1F2430]">{new Date(selectedIssue.created_at).toLocaleDateString()}</strong></span>
                </div>
              </div>

              {/* Resolution Timeline */}
              <div>
                <h4 className="text-xs font-bold text-[#1F2430] uppercase tracking-wider mb-4">
                  Progress Updates & Notes
                </h4>
                <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent hidden"></div>
                <div className="space-y-4 ml-1">
                  {selectedIssue.updates && selectedIssue.updates.length > 0 ? (
                    selectedIssue.updates.map((up) => (
                      <div key={up.id} className="relative pl-6 border-l-2 border-[#EEF2FF]">
                        <div className="absolute w-2 h-2 bg-[#3155D9] rounded-full -left-[5px] top-1.5 ring-4 ring-white"></div>
                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-sm">
                          <div className="flex justify-between items-start mb-1.5">
                            <span className="font-bold text-[#1F2430]">
                              {up.updated_by_name || 'Staff Member'} <span className="font-normal text-[#7B849C] text-xs">({up.updated_by_role || 'Staff'})</span>
                            </span>
                            <span className="text-[10px] text-[#7B849C] bg-slate-50 px-2 py-0.5 rounded-md">
                              {new Date(up.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-slate-700 text-xs leading-relaxed">{up.comment}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-[#7B849C] py-2 bg-slate-50 rounded-xl px-4 border border-dashed border-slate-200">
                      No progress updates recorded yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Add comment */}
              <form onSubmit={handleAddComment} className="pt-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment or follow-up note..."
                    className="form-input flex-1 text-sm p-3 border border-slate-200 rounded-xl outline-none focus:border-[#3155D9] focus:ring-1 focus:ring-[#3155D9]"
                  />
                  <button
                    type="submit"
                    disabled={commenting || !commentText.trim()}
                    className="px-5 py-3 rounded-xl bg-[#1F2430] text-white font-bold text-sm hover:bg-black flex items-center gap-2 disabled:opacity-50 transition"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
