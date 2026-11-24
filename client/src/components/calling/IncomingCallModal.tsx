import React from 'react';
import { Phone, PhoneOff, Video, ShieldCheck } from 'lucide-react';
import { useCall } from '../../context/CallContext';

export const IncomingCallModal: React.FC = () => {
  const { incomingCall, acceptCall, rejectCall } = useCall();

  if (!incomingCall) return null;

  const isVideo = incomingCall.type === 'video';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl shadow-amber-500/10 relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* E2EE badge */}
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold mb-4">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Incoming E2EE {isVideo ? 'Video' : 'Audio'} Call</span>
        </div>

        {/* Caller Avatar with pulsing ring */}
        <div className="relative w-24 h-24 mx-auto mb-4">
          <img
            src={
              incomingCall.initiatorAvatar ||
              'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80'
            }
            alt={incomingCall.initiatorName}
            className="w-full h-full rounded-full object-cover ring-4 ring-amber-500/50 shadow-xl"
          />
          <div className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping pointer-events-none" />
        </div>

        <h3 className="text-lg font-bold text-slate-100">{incomingCall.initiatorName}</h3>
        <p className="text-xs text-amber-400/90 font-medium mt-1">
          {isVideo ? 'Inviting you to an Encrypted Video Call...' : 'Inviting you to an Encrypted Audio Call...'}
        </p>

        {/* Action Buttons: Decline & Accept */}
        <div className="flex items-center justify-center space-x-8 mt-8">
          {/* Decline */}
          <div className="flex flex-col items-center">
            <button
              onClick={rejectCall}
              className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-900/50 transition hover:scale-110"
              title="Decline Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <span className="text-[11px] text-slate-400 mt-2 font-medium">Decline</span>
          </div>

          {/* Accept */}
          <div className="flex flex-col items-center">
            <button
              onClick={acceptCall}
              className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-900/50 transition hover:scale-110 animate-bounce"
              title="Accept Call"
            >
              {isVideo ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
            </button>
            <span className="text-[11px] text-emerald-400 mt-2 font-semibold">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
};
