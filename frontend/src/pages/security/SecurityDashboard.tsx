import React, { useState, useRef } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  ShieldCheck,
  QrCode,
  Camera,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  History,
} from 'lucide-react';

export const SecurityDashboard: React.FC = () => {
  const toast = useToast();
  const [passToken, setPassToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const handleVerify = async (tokenToVerify?: string) => {
    const token = (tokenToVerify || passToken).trim();
    if (!token) {
      toast.error('Please enter or scan a pass token.');
      return;
    }

    try {
      setVerifying(true);
      setVerificationResult(null);

      const res = await api.verifyOutpass(token);
      setVerificationResult(res);

      const historyItem = {
        token,
        time: new Date().toLocaleTimeString(),
        date: new Date().toLocaleDateString(),
        status: res.verificationStatus,
        studentName: res.pass?.studentName || 'Unknown',
        registerNumber: res.pass?.registerNumber || 'N/A',
        destination: res.pass?.destination || 'N/A',
      };

      setScanHistory((prev) => [historyItem, ...prev.slice(0, 19)]);

      if (res.verificationStatus === 'VALID') {
        toast.success('OUT-PASS VERIFIED: VALID! Student authorized to exit.');
      } else if (res.verificationStatus === 'EXPIRED') {
        toast.error('EXPIRED OUT-PASS! Expected return time has passed.');
      } else {
        toast.error('INVALID OUT-PASS! Not authorized.');
      }
    } catch (err: any) {
      const failedResult = {
        success: false,
        verificationStatus: 'INVALID',
        message: err.message || 'INVALID OUT-PASS. No matching record in system.',
      };
      setVerificationResult(failedResult);
      toast.error(err.message || 'Pass verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  const startCameraScanner = () => {
    setCameraActive(true);
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        'qr-reader-container',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          try {
            const parsed = JSON.parse(decodedText);
            const token = parsed.token || parsed.passId || decodedText;
            setPassToken(token);
            handleVerify(token);
          } catch {
            setPassToken(decodedText);
            handleVerify(decodedText);
          }
          scanner.clear();
          setCameraActive(false);
        },
        (error) => {
          // ignore stream parse errors
        }
      );
    }, 100);
  };

  const stopCameraScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setCameraActive(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner - Simple Text Header */}
      <div className="bg-white rounded-3xl border border-ink-border shadow-card p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ink">
            Gate Security Portal
          </h2>
          <p className="text-sm text-ink-muted mt-2 max-w-xl">
            Scan QR code or enter token to instantly verify out-pass validity against the centralized campus database.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleVerify('PASS-22CS001-DEMO-TOKEN')}
            disabled={verifying}
            className="px-4 py-2.5 rounded-xl bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white font-bold text-xs border border-primary-600 transition"
          >
            Test Valid Pass Token
          </button>
        </div>
      </div>

      {/* Verification Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input & Scanner Card */}
        <div className="bg-white rounded-3xl border border-ink-border p-6 shadow-card space-y-5">
          <h3 className="font-bold text-ink text-base flex items-center gap-2 pb-3 border-b border-ink-border">
            <QrCode className="w-5 h-5 text-primary-600" />
            Scan or Enter Pass Token
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink-muted uppercase mb-1.5">
                Out-Pass Token / Pass ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={passToken}
                  onChange={(e) => setPassToken(e.target.value)}
                  placeholder="Enter QR token (e.g. PASS-22CS001-DEMO-TOKEN)"
                  className="flex-1 text-xs p-3 border border-ink-border rounded-xl outline-none font-mono focus:ring-2 focus:ring-primary-600"
                />
                <button
                  onClick={() => handleVerify()}
                  disabled={verifying || !passToken.trim()}
                  className="px-5 py-3 rounded-xl bg-primary-600 hover:opacity-90 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Search className="w-4 h-4" />
                  {verifying ? 'Checking...' : 'Verify'}
                </button>
              </div>
            </div>

            <div className="pt-2">
              {!cameraActive ? (
                <button
                  onClick={startCameraScanner}
                  className="w-full py-3.5 rounded-2xl border-2 border-dashed border-primary-600/30 bg-primary-50 hover:bg-primary-50/80 text-primary-600 font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Camera className="w-5 h-5 text-primary-600" />
                  Open Camera QR Scanner
                </button>
              ) : (
                <div className="space-y-3">
                  <div id="qr-reader-container" className="rounded-2xl overflow-hidden" />
                  <button
                    onClick={stopCameraScanner}
                    className="w-full py-2.5 rounded-xl bg-gray-100 text-ink font-bold text-xs hover:bg-gray-200"
                  >
                    Close Camera Scanner
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Verification Result Card */}
        <div className="bg-white rounded-3xl border border-ink-border p-6 shadow-card flex flex-col justify-between">
          <h3 className="font-bold text-ink text-base pb-3 border-b border-ink-border flex items-center justify-between">
            <span>Verification Status Display</span>
            {verificationResult && (
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                  verificationResult.verificationStatus === 'VALID'
                    ? 'bg-success-50 text-success-600 border border-success-600/20'
                    : verificationResult.verificationStatus === 'EXPIRED'
                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-300'
                    : 'bg-danger-50 text-danger-600 border border-danger-600/20'
                }`}
              >
                {verificationResult.verificationStatus}
              </span>
            )}
          </h3>

          {!verificationResult ? (
            <div className="py-16 text-center text-ink-muted text-xs flex flex-col items-center">
              <ShieldCheck className="w-12 h-12 text-ink-muted/50 mb-2" />
              Scan a pass code to display verified student information.
            </div>
          ) : (
            <div className="space-y-4 my-2">
              {/* Big status banner */}
              <div
                className={`p-4 rounded-2xl border flex items-center gap-3 ${
                  verificationResult.verificationStatus === 'VALID'
                    ? 'bg-success-50 border-success-600/20 text-success-600'
                    : verificationResult.verificationStatus === 'EXPIRED'
                    ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                    : 'bg-danger-50 border-danger-600/20 text-danger-600'
                }`}
              >
                {verificationResult.verificationStatus === 'VALID' ? (
                  <CheckCircle2 className="w-7 h-7 flex-shrink-0" />
                ) : verificationResult.verificationStatus === 'EXPIRED' ? (
                  <Clock className="w-7 h-7 flex-shrink-0" />
                ) : (
                  <XCircle className="w-7 h-7 flex-shrink-0" />
                )}
                <div>
                  <h4 className="font-bold text-base leading-tight text-ink">
                    {verificationResult.message}
                  </h4>
                  <span className="text-[11px] text-ink-muted block mt-0.5">
                    {verificationResult.verificationStatus === 'VALID'
                      ? 'Approved by Tutor, Parent, & Warden. Authorized to pass.'
                      : 'Not authorized for campus exit/entry.'}
                  </span>
                </div>
              </div>

              {/* Pass details */}
              {verificationResult.pass && (
                <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-2xl border border-ink-border">
                  <div>
                    <span className="text-ink-muted font-semibold block mb-0.5">Student</span>
                    <span className="font-bold text-ink text-sm">
                      {verificationResult.pass.studentName}
                    </span>
                  </div>

                  <div>
                    <span className="text-ink-muted font-semibold block mb-0.5">Register Number</span>
                    <span className="font-bold text-ink text-sm font-mono">
                      {verificationResult.pass.registerNumber}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className="text-ink-muted font-semibold block mb-0.5">Destination</span>
                    <span className="font-bold text-ink">
                      {verificationResult.pass.destination}
                    </span>
                  </div>

                  <div>
                    <span className="text-ink-muted font-semibold block mb-0.5">Leaving Time</span>
                    <span className="font-semibold text-ink">
                      {verificationResult.pass.leavingDate} at {verificationResult.pass.leavingTime}
                    </span>
                  </div>

                  <div>
                    <span className="text-ink-muted font-semibold block mb-0.5">Expected Return</span>
                    <span className="font-semibold text-ink">
                      {verificationResult.pass.returnDate} at {verificationResult.pass.returnTime}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-ink-border text-[11px] text-ink-muted flex items-center justify-between">
            <span>Main Gate Security Post #1</span>
            <span>Real-time DB Sync</span>
          </div>
        </div>
      </div>

      {/* Verification History */}
      <div className="bg-white rounded-3xl border border-ink-border p-6 shadow-card">
        <h3 className="font-bold text-ink text-base pb-4 border-b border-ink-border flex items-center gap-2">
          <History className="w-4 h-4 text-primary-600" />
          Recent Gate Scans History
        </h3>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-ink-muted uppercase font-bold text-[10px]">
              <tr>
                <th className="py-3 px-4 rounded-tl-lg">Timestamp</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Register Number</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4 rounded-tr-lg">Verification Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-border/50">
              {scanHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-ink-muted">
                    No scans recorded in this session.
                  </td>
                </tr>
              ) : (
                scanHistory.map((s, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-ink-muted font-mono">
                      {s.date} {s.time}
                    </td>
                    <td className="py-3 px-4 font-bold text-ink">{s.studentName}</td>
                    <td className="py-3 px-4 font-mono text-ink-muted">{s.registerNumber}</td>
                    <td className="py-3 px-4 text-ink-muted">{s.destination}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                          s.status === 'VALID'
                            ? 'bg-success-50 text-success-600'
                            : 'bg-danger-50 text-danger-600'
                        }`}
                      >
                        {s.status}
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
