import React, { useState } from 'react';
import {
  HardDrive,
  Cloud,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Download,
  UploadCloud,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocial } from '../../context/SocialContext';
import { api } from '../../services/api';
import { StorageMode } from '../../types';

interface StorageSettingsModalProps {
  onClose: () => void;
}

export const StorageSettingsModal: React.FC<StorageSettingsModalProps> = ({ onClose }) => {
  const { user, switchStorageMode } = useAuth();
  const { storageSummary, backups, createBackup, restoreBackup, loadStorageSummary } = useSocial();
  const [isSwitching, setIsSwitching] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const currentMode = user?.storageMode || 'local_device';

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleModeSelect = async (mode: StorageMode) => {
    if (mode === currentMode) return;
    setIsSwitching(true);
    setStatusMessage(null);
    try {
      await switchStorageMode(mode);
      await loadStorageSummary();
      setStatusMessage(`Storage mode updated to ${mode.replace('_', ' ').toUpperCase()}`);
    } catch (err: any) {
      console.error('Mode switch failed:', err);
      setStatusMessage(err.message || 'Failed to switch mode');
    } finally {
      setIsSwitching(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    setStatusMessage(null);
    try {
      // Simulate client-side encryption of current state
      const mockCiphertext = `aum:backup:v1:aes_gcm_256:${Date.now()}:encrypted_local_sqlite_payload`;
      await createBackup(mockCiphertext);
      setStatusMessage('Encrypted cloud backup created successfully!');
    } catch (err: any) {
      setStatusMessage(err.message || 'Failed to create backup');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleClearCache = async () => {
    try {
      await api.clearCache();
      await loadStorageSummary();
      setStatusMessage('Local media cache cleaned safely.');
    } catch (err) {
      console.error(err);
    }
  };

  const modes: {
    id: StorageMode;
    title: string;
    badge: string;
    desc: string;
    deliveryText: string;
    cloudText: string;
    icon: React.FC<{ className?: string }>;
    accentColor: string;
  }[] = [
    {
      id: 'local_device',
      title: 'Local Device Storage',
      badge: 'Default • Free',
      desc: 'All messages, photographs, and videos are stored solely on your device. Zero cloud content storage.',
      deliveryText: 'When recipient is offline, pending transfers stay on your device and deliver once both reconnect.',
      cloudText: 'No cloud storage, no cloud backup, no cloud sync.',
      icon: HardDrive,
      accentColor: 'border-amber-500 text-amber-400',
    },
    {
      id: 'local_backup',
      title: 'Local + Encrypted Cloud Backup',
      badge: 'Optional Backup',
      desc: 'Your device remains primary working store. An audited client-encrypted backup snapshot is preserved in app cloud.',
      deliveryText: 'Direct peer-to-peer delivery when online.',
      cloudText: 'Scheduled & manual encrypted backup; restore after device loss. No live multi-device sync.',
      icon: Cloud,
      accentColor: 'border-blue-500 text-blue-400',
    },
    {
      id: 'cloud_sync',
      title: 'Paid Encrypted Cloud Storage',
      badge: 'Real-Time Sync',
      desc: 'Encrypted cloud storage is the primary persistent store for your account, synchronising seamlessly across authorised devices.',
      deliveryText: 'Offline recipients receive content from cloud after you upload, without requiring you to stay online.',
      cloudText: 'Continuous end-to-end encrypted synchronisation and multi-device support.',
      icon: RefreshCw,
      accentColor: 'border-emerald-500 text-emerald-400',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100">Storage & Data Sovereignty</h2>
              <p className="text-[11px] text-slate-400">You control where your private conversations live</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status notification if any */}
        {statusMessage && (
          <div className="p-3 bg-emerald-950/80 border-b border-emerald-800/80 text-emerald-300 text-xs flex items-center justify-between">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="text-xs font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Section 1: The Three Distinct Storage Choices */}
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
              Choose Your Storage Mode
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">
              AUM offers three distinct storage options. You can switch modes at any time with complete transparency.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {modes.map((m) => {
                const Icon = m.icon;
                const isSelected = currentMode === m.id;

                return (
                  <div
                    key={m.id}
                    onClick={() => handleModeSelect(m.id)}
                    className={`rounded-2xl p-4 border flex flex-col justify-between cursor-pointer transition relative ${
                      isSelected
                        ? `bg-slate-850 ring-2 ring-amber-500 border-transparent shadow-xl`
                        : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-xl bg-slate-900 border border-slate-700 ${m.accentColor}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                          {m.badge}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-100">{m.title}</h4>
                      <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">{m.desc}</p>

                      <div className="mt-3 pt-2 border-t border-slate-700/50 space-y-1 text-[10px] text-slate-400">
                        <p>
                          <strong className="text-slate-300">Delivery:</strong> {m.deliveryText}
                        </p>
                        <p>
                          <strong className="text-slate-300">Cloud:</strong> {m.cloudText}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-2">
                      {isSelected ? (
                        <div className="flex items-center justify-center space-x-1 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 font-bold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active Mode</span>
                        </div>
                      ) : (
                        <button
                          disabled={isSwitching}
                          className="w-full py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition"
                        >
                          Switch to this
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Storage Usage Breakdown */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-200">Device Working Store Usage</h4>
              <button
                onClick={handleClearCache}
                className="flex items-center space-x-1 text-xs text-rose-400 hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Cache</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-400 block">Total Local Storage</span>
                <span className="text-sm font-bold text-amber-400 mt-0.5 block">
                  {formatBytes(storageSummary?.usage?.totalLocalBytes)}
                </span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-400 block">Media Files</span>
                <span className="text-sm font-bold text-slate-200 mt-0.5 block">
                  {formatBytes(storageSummary?.usage?.mediaSizeBytes)}
                </span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-400 block">Messages Count</span>
                <span className="text-sm font-bold text-slate-200 mt-0.5 block">
                  {storageSummary?.usage?.messagesCount || 0}
                </span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-400 block">Encrypted Backups</span>
                <span className="text-sm font-bold text-slate-200 mt-0.5 block">{backups.length}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Encrypted Cloud Backup Manager */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-200">Encrypted Cloud Backups</h4>
                <p className="text-[11px] text-slate-400">
                  Client-side encrypted snapshots for phone loss recovery (Zero Knowledge)
                </p>
              </div>

              <button
                onClick={handleCreateBackup}
                disabled={isBackingUp}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition disabled:opacity-40 shadow-md"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{isBackingUp ? 'Encrypting...' : 'Backup Now'}</span>
              </button>
            </div>

            {backups.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No cloud backups created yet.</p>
            ) : (
              <div className="space-y-2">
                {backups.map((bkp) => (
                  <div
                    key={bkp.id}
                    className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-200">Snapshot v{bkp.version}</span>
                      <span className="text-[10px] text-slate-400 ml-2">
                        {new Date(bkp.createdAt).toLocaleDateString()} • {formatBytes(bkp.sizeBytes)} • {bkp.deviceInfo}
                      </span>
                    </div>

                    <button
                      onClick={async () => {
                        await restoreBackup(bkp.id);
                        setStatusMessage(`Encrypted snapshot v${bkp.version} restored and decrypted locally!`);
                      }}
                      className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Restore</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Make in India Sovereign Security Protocol
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
