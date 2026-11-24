import React from 'react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  ShieldCheck,
  Maximize2,
  Volume2,
  RotateCw,
} from 'lucide-react';
import { useCall } from '../../context/CallContext';

export const ActiveCallModal: React.FC = () => {
  const {
    activeCall,
    callState,
    peerInfo,
    callDuration,
    isMuted,
    isVideoOff,
    connectionQuality,
    localVideoRef,
    remoteVideoRef,
    toggleMute,
    toggleVideo,
    cancelCall,
    endCall,
  } = useCall();

  if (callState === 'idle') return null;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isVideo = activeCall?.type === 'video';

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-lg flex flex-col z-50 select-none">
      {/* Top Bar: Security Indicator & Call Timer */}
      <div className="p-4 flex items-center justify-between text-xs text-slate-300 z-20">
        <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-700/80 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-emerald-400">E2EE Secured</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">{connectionQuality}</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/80 px-3 py-1.5 rounded-full font-mono font-bold text-amber-400">
          {callState === 'connected' ? formatDuration(callDuration) : callState === 'calling' ? 'Calling...' : 'Ringing...'}
        </div>
      </div>

      {/* Main Video or Audio Stage */}
      <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden">
        {isVideo ? (
          <div className="w-full h-full relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex items-center justify-center">
            {/* Remote Video Stream */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Fallback avatar overlay if remote video is connecting */}
            {callState !== 'connected' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90">
                <div className="relative w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-amber-500 to-orange-500 animate-pulse mb-4">
                  <img
                    src={peerInfo?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                    alt={peerInfo?.name}
                    className="w-full h-full rounded-full object-cover ring-4 ring-slate-950"
                  />
                </div>
                <h2 className="text-lg font-bold text-slate-100">{peerInfo?.name}</h2>
                <p className="text-xs text-amber-400 mt-1 animate-pulse">
                  {callState === 'calling' ? 'Establishing peer route...' : 'Recipient device ringing...'}
                </p>
              </div>
            )}

            {/* Local Video Picture-in-Picture */}
            <div className="absolute top-4 right-4 w-28 sm:w-36 h-40 sm:h-48 rounded-2xl overflow-hidden border-2 border-amber-500/80 shadow-2xl bg-black">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 left-2 text-[9px] bg-black/60 px-1.5 py-0.5 rounded text-white font-medium">
                You
              </div>
            </div>
          </div>
        ) : (
          /* Voice Call Stage */
          <div className="flex flex-col items-center justify-center text-center">
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-amber-500 to-orange-500 shadow-2xl shadow-orange-500/30">
                <img
                  src={peerInfo?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                  alt={peerInfo?.name}
                  className="w-full h-full rounded-full object-cover ring-4 ring-slate-950"
                />
              </div>
              {/* Pulsing ring animation */}
              <div className="absolute inset-0 rounded-full border-2 border-amber-500/40 animate-ping pointer-events-none" />
            </div>

            <h2 className="text-xl font-bold text-slate-100">{peerInfo?.name}</h2>
            <p className="text-xs text-slate-400 mt-1">AUM Sovereign Voice Encryption</p>
            <p className="text-sm font-semibold text-amber-400 mt-2 font-mono">
              {callState === 'connected' ? formatDuration(callDuration) : 'Connecting voice session...'}
            </p>
          </div>
        )}
      </div>

      {/* In-Call Action Control Bar */}
      <div className="p-6 bg-slate-900/90 border-t border-slate-800 flex items-center justify-center space-x-4 sm:space-x-6 z-20">
        {/* Mute Mic */}
        <button
          onClick={toggleMute}
          className={`p-4 rounded-2xl transition shadow-lg ${
            isMuted
              ? 'bg-red-500 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Video Toggle (if Video Call) */}
        {isVideo && (
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-2xl transition shadow-lg ${
              isVideoOff
                ? 'bg-red-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
        )}

        {/* End Call / Cancel Call Button */}
        <button
          onClick={callState === 'connected' ? endCall : cancelCall}
          className="p-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white transition shadow-lg shadow-rose-900/40 hover:scale-105"
          title="End Call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
