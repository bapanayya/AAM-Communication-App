import React, { useState } from 'react';
import { Shield, HardDrive, Smartphone, Monitor, ChevronDown, UserCircle, LogOut, Camera, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StorageMode } from '../../types';

interface HeaderProps {
  isMobileSim: boolean;
  setIsMobileSim: (val: boolean) => void;
  onOpenStorage: () => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isMobileSim, setIsMobileSim, onOpenStorage, onOpenSettings }) => {
  const { user, logout } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const getStorageBadge = (mode?: StorageMode) => {
    switch (mode) {
      case 'cloud_sync':
        return { label: 'Cloud Sync', color: 'bg-emerald-950 text-emerald-400 border-emerald-700/50' };
      case 'local_backup':
        return { label: 'Encrypted Backup', color: 'bg-blue-950 text-blue-400 border-blue-700/50' };
      case 'local_device':
      default:
        return { label: 'Local Device Only', color: 'bg-amber-950 text-amber-400 border-amber-700/50' };
    }
  };

  const badge = getStorageBadge(user?.storageMode);

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 px-4 py-2.5 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Brand & Made in India */}
      <div className="flex items-center space-x-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 border border-amber-500/30 overflow-hidden shadow-md shadow-orange-950/40">
          <img src="./aam-icon.png" alt="AAM Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-extrabold tracking-wide bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
              AAM
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1">
              <span>🇮🇳</span> Make in India
            </span>
          </div>
          <p className="text-[11px] text-amber-300/90 font-medium flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-400 inline" /> All in One Communication App
          </p>
        </div>
      </div>

      {/* Middle: Active Storage Mode Indicator Button */}
      <div className="hidden md:flex items-center space-x-2">
        <button
          onClick={onOpenStorage}
          className={`flex items-center space-x-1.5 px-3 py-1 text-xs rounded-full border transition hover:opacity-90 ${badge.color}`}
          title="Click to view or switch storage modes"
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span className="font-medium">Mode: {badge.label}</span>
          <span className="text-[10px] opacity-75">(Manage)</span>
        </button>
      </div>

      {/* Right: Phone Simulator Toggle and User Profile */}
      <div className="flex items-center space-x-3">
        {/* Mobile View Toggle */}
        <button
          onClick={() => setIsMobileSim(!isMobileSim)}
          className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 text-xs rounded-lg border transition ${
            isMobileSim
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
          title="Toggle Mobile Simulator Mode"
        >
          {isMobileSim ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
          <span>{isMobileSim ? 'Phone View' : 'Wide Desktop'}</span>
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center space-x-2 bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700 px-2.5 py-1.5 rounded-xl transition text-xs"
          >
            <div className="relative">
              <img
                src={user?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=aam_user'}
                alt={user?.displayName || 'User'}
                className="w-6 h-6 rounded-full object-cover ring-1 ring-amber-500/50"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-slate-900" />
            </div>
            <span className="font-medium hidden sm:inline max-w-[100px] truncate">{user?.displayName || 'User'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
              {/* Profile Card */}
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
                <div className="relative group cursor-pointer" onClick={() => { setShowProfileDropdown(false); onOpenSettings?.(); }}>
                  <img
                    src={user?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=aam_user'}
                    alt={user?.displayName || 'User'}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-500/60"
                  />
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <Camera className="w-4 h-4 text-amber-300" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-100 text-sm truncate">{user?.displayName}</div>
                  <div className="text-[11px] text-amber-400/90 truncate">@{user?.username}</div>
                  {user?.phoneNumber && (
                    <div className="text-[10px] text-slate-400 truncate">{user.phoneNumber}</div>
                  )}
                </div>
              </div>

              {/* Storage Mode indicator */}
              <div className="py-2.5 px-2 my-2 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] flex items-center justify-between">
                <span className="text-slate-400">Storage Mode:</span>
                <span className="font-semibold text-amber-400">{badge.label}</span>
              </div>

              {/* Actions */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setShowProfileDropdown(false);
                    onOpenSettings?.();
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-left text-xs text-slate-200 hover:bg-slate-800 transition"
                >
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>Edit Profile & Photo</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileDropdown(false);
                    onOpenStorage();
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-left text-xs text-slate-200 hover:bg-slate-800 transition"
                >
                  <HardDrive className="w-4 h-4 text-blue-400" />
                  <span>Storage Settings</span>
                </button>

                <div className="pt-1 border-t border-slate-800">
                  <button
                    onClick={() => {
                      logout();
                      setShowProfileDropdown(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-left text-xs text-rose-400 hover:bg-rose-500/10 transition font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
