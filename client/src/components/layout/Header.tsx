import React, { useState } from 'react';
import { Shield, Sparkles, HardDrive, Smartphone, Monitor, ChevronDown, Check, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StorageMode } from '../../types';

interface HeaderProps {
  isMobileSim: boolean;
  setIsMobileSim: (val: boolean) => void;
  onOpenStorage: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isMobileSim, setIsMobileSim, onOpenStorage }) => {
  const { user, demoLogin } = useAuth();
  const [showDemoDropdown, setShowDemoDropdown] = useState(false);

  const demoAccounts = [
    { id: 'usr_aarav', name: 'Aarav Sharma', role: 'Architect (Local Storage)' },
    { id: 'usr_priya', name: 'Priya Patel', role: 'Designer (Cloud Backup)' },
    { id: 'usr_vikram', name: 'Vikram Malhotra', role: 'Researcher (Cloud Sync)' },
    { id: 'usr_ananya', name: 'Ananya Iyer', role: 'Vocalist (New Contact)' },
  ];

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
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 shadow-md shadow-orange-950/40">
          <span className="text-xl font-bold tracking-tight text-slate-950 font-serif">🕉️</span>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold tracking-wide bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
              AUM
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1">
              <span>🇮🇳</span> Make in India
            </span>
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-400 inline" /> Sovereign E2EE Messaging
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

      {/* Right: Phone Simulator Toggle, Demo Switcher, and User Profile */}
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

        {/* Quick Demo Account Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowDemoDropdown(!showDemoDropdown)}
            className="flex items-center space-x-2 bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700 px-2.5 py-1.5 rounded-xl transition text-xs"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
              alt={user?.displayName}
              className="w-6 h-6 rounded-full object-cover ring-1 ring-amber-500/50"
            />
            <span className="font-medium hidden sm:inline max-w-[100px] truncate">{user?.displayName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showDemoDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50">
              <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                Switch Perspective (Demo)
              </div>
              <div className="space-y-1">
                {demoAccounts.map((acc) => {
                  const isActive = user?.id === acc.id;
                  return (
                    <button
                      key={acc.id}
                      onClick={() => {
                        demoLogin(acc.id);
                        setShowDemoDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition ${
                        isActive
                          ? 'bg-amber-500/20 text-amber-300 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div>{acc.name}</div>
                        <div className="text-[10px] text-slate-500">{acc.role}</div>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-amber-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
