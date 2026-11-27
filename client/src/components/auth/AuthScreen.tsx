import React, { useState, useEffect } from 'react';
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
  Check,
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  KeyRound,
  Send,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StorageMode } from '../../types';
import { api } from '../../services/api';

export const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sign In state
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up Multi-Step state (Step 1: Details, Step 2: Mandatory Verification)
  const [signUpStep, setSignUpStep] = useState<1 | 2>(1);
  const [signUpDisplayName, setSignUpDisplayName] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('+91');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpStorageMode, setSignUpStorageMode] = useState<StorageMode>('local_device');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Verification state (Step 2)
  const [phoneOtpInput, setPhoneOtpInput] = useState('');
  const [emailOtpInput, setEmailOtpInput] = useState('');
  const [phoneTestingCode, setPhoneTestingCode] = useState<string | null>(null);
  const [emailTestingCode, setEmailTestingCode] = useState<string | null>(null);
  const [phoneVerificationToken, setPhoneVerificationToken] = useState<string | null>(null);
  const [emailVerificationToken, setEmailVerificationToken] = useState<string | null>(null);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(45);

  useEffect(() => {
    let interval: any;
    if (signUpStep === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [signUpStep, resendTimer]);

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

  // Step 1: Validate details and send OTP challenges
  const handleProceedToVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const displayName = signUpDisplayName.trim();
    const username = signUpUsername.trim().toLowerCase();
    const phone = signUpPhone.trim();
    const email = signUpEmail.trim().toLowerCase();

    if (!displayName || !username || !signUpPassword) {
      setErrorMessage('Please fill in Name, Username, and Password.');
      return;
    }

    if (!phone || phone === '+91' || phone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number (+91). Mobile verification is mandatory.');
      return;
    }

    if (!email || !email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please enter a valid email address. Email verification is mandatory.');
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
    try {
      // 1. Dispatch Mobile OTP
      const phoneRes = await api.sendOtp(phone, 'phone');
      setPhoneTestingCode(phoneRes.testingCode || phoneRes.demoCode || '123456');

      // 2. Dispatch Email OTP
      const emailRes = await api.sendOtp(email, 'email');
      setEmailTestingCode(emailRes.testingCode || emailRes.demoCode || '123456');

      // Reset verification tokens & timer
      setPhoneVerificationToken(null);
      setEmailVerificationToken(null);
      setPhoneOtpInput('');
      setEmailOtpInput('');
      setPhoneError(null);
      setEmailError(null);
      setResendTimer(45);

      setSignUpStep(2);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to dispatch verification codes. Username, phone or email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  // Verify Phone OTP
  const handleVerifyPhoneOtp = async () => {
    const code = phoneOtpInput.trim();
    if (!code) {
      setPhoneError('Please enter the 6-digit code.');
      return;
    }

    setIsVerifyingPhone(true);
    setPhoneError(null);
    try {
      const res = await api.verifyOtp(signUpPhone.trim(), code, 'phone');
      if (res.verified && res.verificationToken) {
        setPhoneVerificationToken(res.verificationToken);
      } else {
        setPhoneError('Invalid mobile verification code.');
      }
    } catch (err: any) {
      setPhoneError(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  // Verify Email OTP
  const handleVerifyEmailOtp = async () => {
    const code = emailOtpInput.trim();
    if (!code) {
      setEmailError('Please enter the 6-digit code.');
      return;
    }

    setIsVerifyingEmail(true);
    setEmailError(null);
    try {
      const res = await api.verifyOtp(signUpEmail.trim().toLowerCase(), code, 'email');
      if (res.verified && res.verificationToken) {
        setEmailVerificationToken(res.verificationToken);
      } else {
        setEmailError('Invalid email verification code.');
      }
    } catch (err: any) {
      setEmailError(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  // Resend OTPs
  const handleResendOtps = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    setPhoneError(null);
    setEmailError(null);
    try {
      const phoneRes = await api.sendOtp(signUpPhone.trim(), 'phone');
      setPhoneTestingCode(phoneRes.testingCode || phoneRes.demoCode || '123456');

      const emailRes = await api.sendOtp(signUpEmail.trim().toLowerCase(), 'email');
      setEmailTestingCode(emailRes.testingCode || emailRes.demoCode || '123456');

      setResendTimer(45);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend verification codes.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 Final Submission: Submit with both verified tokens
  const handleCompleteRegistration = async () => {
    if (!phoneVerificationToken || !emailVerificationToken) {
      setErrorMessage('Both Mobile Number and Email must be verified before account creation.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      await register({
        displayName: signUpDisplayName.trim(),
        username: signUpUsername.trim().toLowerCase(),
        phoneNumber: signUpPhone.trim(),
        email: signUpEmail.trim().toLowerCase(),
        password: signUpPassword,
        storageMode: signUpStorageMode,
        phoneVerificationToken,
        emailVerificationToken,
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Could not complete registration. Please verify and retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 font-sans relative overflow-hidden select-none">
      {/* Background Neon Glow Orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 mx-auto mb-2.5 rounded-2xl bg-slate-900 border border-amber-500/30 overflow-hidden shadow-lg shadow-orange-950/40 p-1 flex items-center justify-center">
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

          <p className="text-xs text-amber-300/90 font-medium mt-0.5">
            All in One Communication App
          </p>
        </div>

        {/* Tab Toggle: Sign In vs Sign Up */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-5">
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

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-start space-x-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* 1. SIGN IN FORM */}
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
                  placeholder="e.g. bapanayya or +918019228436"
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
          </form>
        ) : (
          /* 2. SIGN UP MULTI-STEP WITH MANDATORY VERIFICATION */
          <div>
            {/* Step 1: User Profile & Security Input */}
            {signUpStep === 1 && (
              <form onSubmit={handleProceedToVerification} className="space-y-3 max-h-[62vh] overflow-y-auto pr-1">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-1">
                  <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[10px]">1</span>
                    Account Details
                  </span>
                  <span className="text-[10px] text-slate-400">Step 1 of 2</span>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Full Name / Display Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. Kavya Sharma"
                      value={signUpDisplayName}
                      onChange={(e) => setSignUpDisplayName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
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
                    placeholder="e.g. kavya_sharma"
                    value={signUpUsername}
                    onChange={(e) => setSignUpUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                {/* Phone & Email (Mandatory) */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between mb-1">
                    <span>Mobile Number (+91) *</span>
                    <span className="text-[9px] text-amber-400 font-normal">Mandatory Verification</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      placeholder="+919876543210"
                      value={signUpPhone}
                      onChange={(e) => setSignUpPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between mb-1">
                    <span>Email Address *</span>
                    <span className="text-[9px] text-amber-400 font-normal">Mandatory Verification</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      placeholder="kavya@example.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      required
                    />
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
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showSignUpPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type={showSignUpPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      value={signUpConfirmPassword}
                      onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                {/* Storage Mode Selector */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Sovereign Storage Architecture
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => setSignUpStorageMode('local_device')}
                      className={`p-2 rounded-xl border text-[10px] font-medium transition flex flex-col items-center justify-center space-y-1 ${
                        signUpStorageMode === 'local_device'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>Local Device</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSignUpStorageMode('local_backup')}
                      className={`p-2 rounded-xl border text-[10px] font-medium transition flex flex-col items-center justify-center space-y-1 ${
                        signUpStorageMode === 'local_backup'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Local + Backup</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSignUpStorageMode('cloud_sync')}
                      className={`p-2 rounded-xl border text-[10px] font-medium transition flex flex-col items-center justify-center space-y-1 ${
                        signUpStorageMode === 'cloud_sync'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      <span>Cloud Sync</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-orange-500/20 transition flex items-center justify-center space-x-2 mt-2"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Continue to Mandatory Verification</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 2: Mandatory Verification Challenge (Testing Mode Active) */}
            {signUpStep === 2 && (
              <div className="space-y-4 max-h-[64vh] overflow-y-auto pr-1">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px]">2</span>
                    Mandatory Verification
                  </span>
                  <span className="text-[10px] text-slate-400">Step 2 of 2</span>
                </div>

                <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-start space-x-2">
                  <Shield className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>
                    To maintain high sovereign trust and security on AAM, both your mobile number and email must be verified before account activation.
                  </span>
                </div>

                {/* 1. Mobile Verification Card */}
                <div className={`p-3 rounded-2xl border transition ${
                  phoneVerificationToken
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-slate-950/60 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <Phone className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-200 block truncate">{signUpPhone}</span>
                        <span className="text-[10px] text-slate-400">Mobile SMS OTP</span>
                      </div>
                    </div>
                    {phoneVerificationToken ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-medium">
                        Pending
                      </span>
                    )}
                  </div>

                  {!phoneVerificationToken ? (
                    <div className="space-y-2 pt-1">
                      {/* Testing Mode Banner */}
                      {phoneTestingCode && (
                        <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-[11px]">
                          <span className="text-amber-400">
                            🧪 Testing OTP: <strong className="font-mono text-slate-100">{phoneTestingCode}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => setPhoneOtpInput(phoneTestingCode)}
                            className="px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold transition"
                          >
                            Auto-fill
                          </button>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="6-digit Mobile OTP"
                          value={phoneOtpInput}
                          onChange={(e) => setPhoneOtpInput(e.target.value.replace(/\D/g, ''))}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono tracking-wider focus:outline-none focus:border-amber-500 text-center"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyPhoneOtp}
                          disabled={isVerifyingPhone || phoneOtpInput.trim().length !== 6}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs transition flex items-center space-x-1"
                        >
                          {isVerifyingPhone ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          <span>Verify</span>
                        </button>
                      </div>

                      {phoneError && (
                        <p className="text-[11px] text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{phoneError}</span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-emerald-400 flex items-center space-x-1 pt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mobile number verified successfully with cryptographic signature</span>
                    </div>
                  )}
                </div>

                {/* 2. Email Verification Card */}
                <div className={`p-3 rounded-2xl border transition ${
                  emailVerificationToken
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-slate-950/60 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <Mail className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-200 block truncate">{signUpEmail}</span>
                        <span className="text-[10px] text-slate-400">Email Address OTP</span>
                      </div>
                    </div>
                    {emailVerificationToken ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-medium">
                        Pending
                      </span>
                    )}
                  </div>

                  {!emailVerificationToken ? (
                    <div className="space-y-2 pt-1">
                      {/* Testing Mode Banner */}
                      {emailTestingCode && (
                        <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-[11px]">
                          <span className="text-amber-400">
                            🧪 Testing OTP: <strong className="font-mono text-slate-100">{emailTestingCode}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => setEmailOtpInput(emailTestingCode)}
                            className="px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold transition"
                          >
                            Auto-fill
                          </button>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="6-digit Email OTP"
                          value={emailOtpInput}
                          onChange={(e) => setEmailOtpInput(e.target.value.replace(/\D/g, ''))}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono tracking-wider focus:outline-none focus:border-amber-500 text-center"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyEmailOtp}
                          disabled={isVerifyingEmail || emailOtpInput.trim().length !== 6}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs transition flex items-center space-x-1"
                        >
                          {isVerifyingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          <span>Verify</span>
                        </button>
                      </div>

                      {emailError && (
                        <p className="text-[11px] text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{emailError}</span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-emerald-400 flex items-center space-x-1 pt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Email address verified successfully with cryptographic signature</span>
                    </div>
                  )}
                </div>

                {/* Resend & Edit Details Action Row */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setSignUpStep(1)}
                    className="text-slate-400 hover:text-slate-200 flex items-center space-x-1 text-[11px]"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Edit Phone / Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtps}
                    disabled={resendTimer > 0 || loading}
                    className="text-amber-400 hover:text-amber-300 disabled:opacity-40 text-[11px] font-semibold"
                  >
                    {resendTimer > 0 ? `Resend Codes in 00:${resendTimer < 10 ? '0' : ''}${resendTimer}` : 'Resend Codes'}
                  </button>
                </div>

                {/* Complete Account Creation Button (Enabled ONLY when both are verified) */}
                <button
                  type="button"
                  onClick={handleCompleteRegistration}
                  disabled={loading || !phoneVerificationToken || !emailVerificationToken}
                  className={`w-full py-3 rounded-xl font-bold text-xs shadow-lg transition flex items-center justify-center space-x-2 ${
                    phoneVerificationToken && emailVerificationToken
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 text-slate-950 shadow-emerald-500/20 hover:brightness-110'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  }`}
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  ) : phoneVerificationToken && emailVerificationToken ? (
                    <>
                      <Zap className="w-4 h-4 text-slate-950 fill-current" />
                      <span>Activate Verified Account & Enter AAM 🇮🇳</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Verify Both Phone & Email to Activate</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
