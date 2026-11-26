import React from 'react';
import { Clock, RefreshCw, XCircle, HardDrive, ShieldCheck, AlertCircle } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface PendingTransfersModalProps {
  onClose: () => void;
}

export const PendingTransfersModal: React.FC<PendingTransfersModalProps> = ({ onClose }) => {
  const { pendingTransfers, retryTransfer, cancelTransfer } = useChat();

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '1.2 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">My Pending Transfers</h2>
              <p className="text-[11px] text-slate-400">Sender-Side Local Device Queue (Mode 1)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100 text-sm">
            ✕
          </button>
        </div>

        {/* Informational banner about sender-side storage */}
        <div className="p-3 bg-amber-950/30 border-b border-amber-900/30 text-[11px] text-amber-200/90 flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p>
            Unlike traditional messaging apps that store your private photos and videos indefinitely on central cloud servers, AAM keeps undelivered media safely on <strong>your device</strong> until your contact comes online.
          </p>
        </div>

        {/* Transfers List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {pendingTransfers.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <ShieldCheck className="w-10 h-10 mx-auto text-emerald-500/40 mb-2" />
              <p className="font-medium text-slate-300">All Transfers Delivered!</p>
              <p className="mt-1 text-[11px]">There are no pending messages or media queued on your device.</p>
            </div>
          ) : (
            pendingTransfers.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 flex items-center justify-between text-xs transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center flex-shrink-0">
                    {item.contentType === 'video' ? '🎥' : item.contentType === 'image' ? '📷' : '📝'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-200 truncate max-w-[200px]">
                      {item.mediaName || 'Encrypted Payload'}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      To: {item.recipient?.displayName || 'Contact'} • {formatBytes(item.fileSize)}
                    </p>
                    <span className="inline-block mt-0.5 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {item.status === 'transferring' ? 'Transferring...' : 'Awaiting Recipient Online'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => retryTransfer(item.id)}
                    className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 transition"
                    title="Retry Transfer Now"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => cancelTransfer(item.id)}
                    className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 transition"
                    title="Cancel and Remove from Queue"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-slate-400" />
            Device Working Store
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
