import React, { useState, useEffect } from 'react';
import {
  Settings,
  X,
  User as UserIcon,
  Shield,
  Eye,
  CheckCheck,
  Video,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { user, logout, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [allowLastSeen, setAllowLastSeen] = useState(true);
  const [allowReadReceipts, setAllowReadReceipts] = useState(true);
  const [videoQuality, setVideoQuality] = useState<'auto' | 'high' | 'data_saver'>('high');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    api.getSettings().then((res) => {
      if (res.settings) {
        setAllowLastSeen(res.settings.allowLastSeen);
        setAllowReadReceipts(res.settings.allowReadReceipts);
        setVideoQuality(res.settings.videoQuality || 'high');
      }
    });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateProfile({ displayName, bio });
      await api.updateSettings({ allowLastSeen, allowReadReceipts, videoQuality });
      await refreshProfile();
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Preferences & Profile</h2>
              <p className="text-[11px] text-slate-400">Customise privacy and identity</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {saveMessage && (
          <div className="p-2.5 bg-emerald-950 text-emerald-400 text-xs text-center border-b border-emerald-800">
            {saveMessage}
          </div>
        )}

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          {/* Identity */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">User Identity</h4>

            <div>
              <label className="text-slate-400 block mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Bio / Status</label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Privacy & Presence */}
          <div className="space-y-3 border-t border-slate-800 pt-4">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Privacy & Presence</h4>

            <div className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <div className="flex items-center space-x-2.5">
                <Eye className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="font-semibold text-slate-200 block">Show Online Presence</span>
                  <span className="text-[10px] text-slate-400">Let accepted contacts see when you are online</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={allowLastSeen}
                onChange={(e) => setAllowLastSeen(e.target.checked)}
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <div className="flex items-center space-x-2.5">
                <CheckCheck className="w-4 h-4 text-blue-400" />
                <div>
                  <span className="font-semibold text-slate-200 block">Read Receipts</span>
                  <span className="text-[10px] text-slate-400">Show double blue check marks when messages are read</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={allowReadReceipts}
                onChange={(e) => setAllowReadReceipts(e.target.checked)}
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <div className="flex items-center space-x-2.5">
                <Video className="w-4 h-4 text-purple-400" />
                <div>
                  <span className="font-semibold text-slate-200 block">Video Quality</span>
                  <span className="text-[10px] text-slate-400">WebRTC bitrate adaptation</span>
                </div>
              </div>
              <select
                value={videoQuality}
                onChange={(e) => setVideoQuality(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none"
              >
                <option value="high">High (720p/1080p)</option>
                <option value="auto">Auto Adaptive</option>
                <option value="data_saver">Data Saver (360p)</option>
              </select>
            </div>
          </div>

          {/* Make in India Mission */}
          <div className="border-t border-slate-800 pt-4 bg-gradient-to-tr from-amber-500/10 via-orange-500/5 to-transparent p-3 rounded-2xl border border-amber-500/20">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-base">🇮🇳</span>
              <h5 className="font-bold text-amber-400 text-xs">Make in India • Sovereign Privacy</h5>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed mb-3">
              AAM is built with a commitment to user data sovereignty: cryptographic keys remain on your device, message bodies never sit unencrypted on central servers, and calling leverages audited WebRTC transport.
            </p>
            <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-800 text-[11px]">
              <a
                href="./licenses.html"
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:text-amber-300 underline font-medium"
              >
                Open Source Licenses
              </a>
              <span className="text-slate-600">•</span>
              <a
                href="./privacy-policy.html"
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:text-amber-300 underline font-medium"
              >
                Privacy Policy
              </a>
              <span className="text-slate-600">•</span>
              <a
                href="./features.html"
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:text-amber-300 underline font-medium"
              >
                Architecture & Features
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="flex items-center space-x-1.5 text-rose-400 hover:text-rose-300 font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold transition disabled:opacity-40"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
