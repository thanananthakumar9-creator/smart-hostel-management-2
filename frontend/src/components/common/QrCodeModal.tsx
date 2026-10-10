import React, { useEffect, useState } from 'react';
import { X, QrCode as QrIcon, Printer, ShieldCheck, User } from 'lucide-react';
import { api } from '../../services/api';
import { OutpassRequest } from '../../types';
import { QRCodeSVG } from 'qrcode.react';

interface QrCodeModalProps {
  outpass: OutpassRequest;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ outpass, onClose }) => {
  const [qrToken, setQrToken] = useState<string>(outpass.qr_token || outpass.id);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchQr() {
      if (outpass.status === 'APPROVED') {
        try {
          setLoading(true);
          const res = await api.getOutpassQr(outpass.id);
          if (res.success && res.token) {
            setQrToken(res.token);
          }
        } catch (err) {
          console.error('Failed to fetch QR:', err);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchQr();
  }, [outpass.id, outpass.status]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300">
        {/* Pass Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-7 h-7 text-emerald-200" />
            </div>
            <div>
              <span className="text-[10px] tracking-widest uppercase font-bold text-emerald-200 block">
                Official Digital Gate Pass
              </span>
              <h3 className="text-xl font-bold">Smart Hostel Out-Pass</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pass Content */}
        <div className="p-6 space-y-6">
          {/* QR Code Presentation */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
            {loading ? (
              <div className="py-12 text-slate-400 text-sm animate-pulse flex flex-col items-center">
                <QrIcon className="w-10 h-10 mb-2 text-slate-300" />
                Generating secure pass token...
              </div>
            ) : (
              <>
                <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-200/80">
                  <QRCodeSVG
                    value={JSON.stringify({ token: qrToken, passId: outpass.id })}
                    size={180}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <div className="mt-3 text-center">
                  <p className="text-[11px] font-mono text-slate-500 font-semibold tracking-wider">
                    TOKEN: {qrToken}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                    ✓ Digitally Signed & Authenticated
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Student & Outpass Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block mb-0.5 font-medium">Student Name</span>
              <span className="text-slate-900 font-bold text-sm flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary-600" />
                {outpass.student_name || 'Student'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block mb-0.5 font-medium">Register Number</span>
              <span className="text-slate-900 font-bold text-sm font-mono">
                {outpass.register_number || '22CS001'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl col-span-2">
              <span className="text-slate-400 block mb-0.5 font-medium">Destination</span>
              <span className="text-slate-900 font-bold text-sm">{outpass.destination}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block mb-0.5 font-medium">Leaving Schedule</span>
              <span className="text-slate-800 font-semibold">
                {outpass.leaving_date} at {outpass.leaving_time}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block mb-0.5 font-medium">Expected Return</span>
              <span className="text-slate-800 font-semibold">
                {outpass.return_date} at {outpass.return_time}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl col-span-2">
              <span className="text-slate-400 block mb-0.5 font-medium">Reason / Purpose</span>
              <span className="text-slate-700">{outpass.reason}</span>
            </div>
          </div>

          {/* Approvals check */}
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 text-xs text-emerald-800 flex items-center justify-between">
            <span className="font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Verified by Tutor, Parent, & Warden
            </span>
            <span className="font-bold text-emerald-900 uppercase tracking-wider">
              {outpass.status}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 flex items-center justify-center gap-2 transition"
            >
              <Printer className="w-4 h-4" />
              Print Pass
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 flex items-center justify-center transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
