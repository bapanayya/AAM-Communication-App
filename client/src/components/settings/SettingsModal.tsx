import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  X,
  User as UserIcon,
  Shield,
  Eye,
  CheckCheck,
  Video,
  LogOut,
  Camera,
  Upload,
  Sparkles,
  Link as LinkIcon,
  Check,
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
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [allowLastSeen, setAllowLastSeen] = useState(true);
  const [allowReadReceipts, setAllowReadReceipts] = useState(true);
  const [videoQuality, setVideoQuality] = useState<'auto' | 'high' | 'data_saver'>('high');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const avatarPresets = [
    { id: 'bot_star', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=aam_star', label: 'Tech Titan' },
    { id: 'bot_bharat', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=bharat_hero', label: 'Bharat Hero' },
    { id: 'bot_shakti', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=shakti_coder', label: 'Shakti' },
    { id: 'bot_surya', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=surya_lead', label: 'Surya' },
    { id: 'real_1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', label: 'Classic 1' },
    { id: 'real_2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80', label: 'Classic 2' },
    { id: 'real_3', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80', label: 'Classic 3' },
    { id: 'real_4', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80', label: 'Classic 4' },
  ];

  useEffect(() => {
    api.getSettings().then((res) => {
      if (res.settings) {
        setAllowLastSeen(res.settings.allowLastSeen);
        setAllowReadReceipts(res.settings.allowReadReceipts);
        setVideoQuality(res.settings.videoQuality || 'high');
      }
    });
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be smaller than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    if (customAvatarUrl.trim()) {
      setAvatar(customAvatarUrl.trim());
      setShowUrlInput(false);
      setCustomAvatarUrl('');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateProfile({ displayName, bio, avatar });
      await api.updateSettings({ allowLastSeen, allowReadReceipts, videoQuality });
      await refreshProfile();
      setSaveMessage('Profile and preferences updated successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setSaveMessage(err.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Profile & Settings</h2>
              <p className="text-[11px] text-amber-400/80">AAM — All in One Communication App</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {saveMessage && (
          <div className="p-2.5 bg-emerald-950 text-emerald-400 text-xs text-center border-b border-emerald-800 font-semibold animate-in fade-in">
            {saveMessage}
          </div>
        )}

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          {/* PROFILE PHOTO EDITOR */}
          <div className="space-y-3 p-4 bg-slate-950/70 rounded-2xl border border-slate-800">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>Profile Photo</span>
            </h4>

            <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-3 sm:space-y-0">
              {/* Avatar Preview */}
              <div className="relative group">
                <img
                  src={avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=aam_user'}
                  alt="Profile Preview"
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-amber-500/50 shadow-xl bg-slate-800"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition text-amber-300 font-semibold text-[10px]"
                >
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span>Change</span>
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition text-xs font-semibold"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload from Device</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition text-xs"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Paste Link</span>
                  </button>
                </div>

                <p className="text-[10px] text-slate-500">
                  Select a photo from your gallery or choose a preset avatar below.
                </p>

                {showUrlInput && (
                  <div className="flex items-center space-x-1.5 pt-1">
                    <input
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={customAvatarUrl}
                      onChange={(e) => setCustomAvatarUrl(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomUrl}
                      className="px-2.5 py-1 bg-amber-500 text-slate-950 rounded-lg font-bold text-xs hover:bg-amber-400"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Avatar Presets Grid */}
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Quick Avatar Presets:
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {avatarPresets.map((preset) => {
                  const isSelected = avatar === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setAvatar(preset.url)}
                      title={preset.label}
                      className={`relative rounded-xl p-0.5 border transition hover:scale-105 ${
                        isSelected
                          ? 'border-amber-400 ring-2 ring-amber-500/50 bg-amber-500/10'
                          : 'border-slate-800 hover:border-slate-600 bg-slate-900'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-10 h-10 rounded-lg object-cover mx-auto"
                      />
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 rounded-full p-0.5">
                          <Check className="w-2.5 h-2.5 font-bold" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* User Identity */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">User Identity</h4>

            <div>
              <label className="text-slate-400 block mb-1">Full Name / Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your full name"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Bio / Status</label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-slate-400">
              <span>Username: <strong className="text-slate-200">@{user?.username}</strong></span>
              {user?.phoneNumber && (
                <span>Phone: <strong className="text-slate-200">{user.phoneNumber}</strong></span>
              )}
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
                  <span className="font-semibold text-slate-200 block">Video Calling Quality</span>
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
              <h5 className="font-bold text-amber-400 text-xs">AAM — All in One Communication App</h5>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed mb-3">
              Built with a sovereign commitment to user data privacy: cryptographic keys remain on your device, message bodies never sit unencrypted on central servers, and calling leverages audited WebRTC peer-to-peer transport.
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
            className="flex items-center space-x-1.5 text-rose-400 hover:text-rose-300 font-semibold px-2 py-1.5 rounded-lg hover:bg-rose-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold transition disabled:opacity-40 shadow-md shadow-orange-500/20"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
