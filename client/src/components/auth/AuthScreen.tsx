import React, { useState } from 'react';
import {
  Shield,
  Lock,
  User,
  Phone,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  HardDrive,
  Cloud,
  FileCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StorageMode } from '../../types';

export const AuthScreen: React.FC = () => {
  const { login, register, demoLogin } = useAuth();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sign In state
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up state
  const [signUpDisplayName, setSignUpDisplayName] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('+91');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpStorageMode, setSignUpStorageMode] = useState<StorageMode>('local_device');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInIdentifier.trim() || !signInPassword) {
      setErrorMessage('Please enter your username/phone/email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      await login(signInIdentifier.trim(), signInPassword);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Invalid username/phone/email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpDisplayName.trim() || !signUpUsername.trim() || !signUpPassword) {
      setErrorMessage('Please fill in all required fields (Name, Username, Password).');
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    if (signUpPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      await register({
        displayName: signUpDisplayName.trim(),
        username: signUpUsername.trim().toLowerCase(),
        phoneNumber: signUpPhone.trim() || undefined,
        email: signUpEmail.trim() || undefined,
        password: signUpPassword,
        storageMode: signUpStorageMode,
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Could not complete registration. Username might already be taken.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (userId: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await demoLogin(userId);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Failed to load demo profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 font-sans relative overflow-hidden">
      {/* Background Neon Orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-900 border border-amber-500/30 overflow-hidden shadow-lg shadow-orange-950/40 p-1 flex items-center justify-center">
            <img src="./aam-icon.png" alt="AAM Logo" className="w-full h-full object-cover rounded-xl" />
          </div>

          <div className="flex items-center justify-center space-x-2">
            <h1 className="text-2xl font-black tracking-wider bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
              AAM
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1">
              <span>🇮🇳</span> Make in India
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Sovereign E2EE Messaging • HD Calling • Ads Broadcasting
          </p>
        </div>

        {/* Tab Toggle: Sign In vs Sign Up */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('signin');
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'signin'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'signup'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-start space-x-2">
            <span className="text-red-400 font-bold">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SIGN IN FORM */}
        {activeTab === 'signin' ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                Username, Phone Number, or Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. aarav_sharma or +919876543210"
                  value={signInIdentifier}
                  onChange={(e) => setSignInIdentifier(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showSignInPassword ? 'text' : 'password'}
                  placeholder="Enter your sovereign password"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPassword(!showSignInPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-orange-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to AAM'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick 1-Click Demo Profiles */}
            <div className="pt-4 border-t border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
                Or explore via instant demo profile:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('usr_aarav')}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-left transition group"
                >
                  <p className="text-[11px] font-semibold text-amber-300 truncate">Aarav S.</p>
                  <p className="text-[9px] text-slate-500">Local Storage</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('usr_priya')}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-left transition group"
                >
                  <p className="text-[11px] font-semibold text-amber-300 truncate">Priya P.</p>
                  <p className="text-[9px] text-slate-500">Local Backup</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('usr_vikram')}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-left transition group"
                >
                  <p className="text-[11px] font-semibold text-amber-300 truncate">Vikram M.</p>
                  <p className="text-[9px] text-slate-500">Cloud Sync</p>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* SIGN UP FORM */
          <form onSubmit={handleSignUp} className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Full Name / Display Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={signUpDisplayName}
                  onChange={(e) => setSignUpDisplayName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Username * (Unique ID)
              </label>
              <input
                type="text"
                placeholder="e.g. ramesh_kumar"
                value={signUpUsername}
                onChange={(e) => setSignUpUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Phone (+91)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="tel"
                    placeholder="+919876543210"
                    value={signUpPhone}
                    onChange={(e) => setSignUpPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-2 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Email (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="email"
                    placeholder="user@aam.in"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-2 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Choose Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type={showSignUpPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showSignUpPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                placeholder="Re-type password"
                value={signUpConfirmPassword}
                onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            {/* Storage Mode Selector */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Sovereign Storage Architecture:
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                <button
                  type="button"
                  onClick={() => setSignUpStorageMode('local_device')}
                  className={`p-2 rounded-xl border transition ${
                    signUpStorageMode === 'local_device'
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <HardDrive className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                  <span>Local Device</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSignUpStorageMode('local_backup')}
                  className={`p-2 rounded-xl border transition ${
                    signUpStorageMode === 'local_backup'
                      ? 'bg-blue-500/20 border-blue-500/60 text-blue-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <FileCheck className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                  <span>Local Backup</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSignUpStorageMode('cloud_sync')}
                  className={`p-2 rounded-xl border transition ${
                    signUpStorageMode === 'cloud_sync'
                      ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Cloud className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                  <span>Cloud Sync</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-orange-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Creating Account...' : 'Create Sovereign Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Footer Legal & Info Links */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 text-center space-y-1">
          <p className="flex items-center justify-center space-x-1.5 text-slate-400">
            <Shield className="w-3 h-3 text-emerald-400 inline" />
            <span>Device-Bound Keys • Zero Server Surveillance</span>
          </p>
          <div className="flex items-center justify-center space-x-3 text-amber-400/80 pt-1">
            <a href="./privacy-policy.html" target="_blank" rel="noreferrer" className="hover:underline">
              Privacy Policy
            </a>
            <span>•</span>
            <a href="./features.html" target="_blank" rel="noreferrer" className="hover:underline">
              Features
            </a>
            <span>•</span>
            <a href="./AAM_Application_Architecture_and_Flow.pdf" target="_blank" rel="noreferrer" className="hover:underline">
              Architecture PDF
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
