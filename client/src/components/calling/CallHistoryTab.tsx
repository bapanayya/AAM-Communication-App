import React from 'react';
import {
  Phone,
  Video,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Trash2,
  Plus,
  Users,
} from 'lucide-react';
import { useCall } from '../../context/CallContext';

interface CallHistoryTabProps {
  onOpenContacts?: () => void;
}

export const CallHistoryTab: React.FC<CallHistoryTabProps> = ({ onOpenContacts }) => {
  const { callHistory, clearCallHistory, startCall } = useCall();

  const formatDuration = (sec: number) => {
    if (sec === 0) return 'Missed / No answer';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  const renderDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'missed':
        return <PhoneMissed className="w-3.5 h-3.5 text-rose-500 inline mr-1" />;
      case 'incoming':
        return <PhoneIncoming className="w-3.5 h-3.5 text-emerald-400 inline mr-1" />;
      case 'outgoing':
      default:
        return <PhoneOutgoing className="w-3.5 h-3.5 text-blue-400 inline mr-1" />;
    }
  };

  return (
    <div className="flex-1 bg-slate-950 flex flex-col h-full overflow-hidden select-none">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>Call Logs</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {callHistory.length}
            </span>
          </h2>
          <p className="text-[11px] text-slate-400">Zero audio/video recording retained on server</p>
        </div>

        <div className="flex items-center space-x-2">
          {onOpenContacts && (
            <button
              onClick={onOpenContacts}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
              title="Start New Call with any registered user"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Call</span>
            </button>
          )}

          {callHistory.length > 0 && (
            <button
              onClick={clearCallHistory}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 text-xs transition"
              title="Clear call history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {callHistory.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
              <Phone className="w-7 h-7 text-amber-500/70" />
            </div>
            <div>
              <p className="font-semibold text-slate-300 text-sm">No call logs yet</p>
              <p className="mt-1 text-slate-500 text-xs max-w-xs">
                Start an encrypted WebRTC audio or video call with any registered contact on AAM.
              </p>
            </div>
            {onOpenContacts && (
              <button
                onClick={onOpenContacts}
                className="mt-2 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition flex items-center space-x-1.5"
              >
                <Users className="w-4 h-4" />
                <span>Find Registered Users to Call</span>
              </button>
            )}
          </div>
        ) : (
          callHistory.map((call) => (
            <div
              key={call.id}
              className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-3 flex items-center justify-between transition"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <img
                  src={
                    call.peerAvatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                  }
                  alt={call.peerName}
                  className="w-10 h-10 rounded-full object-cover border border-slate-700 flex-shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-slate-200 truncate">{call.peerName}</h4>
                  <div className="flex items-center text-[10px] text-slate-400 mt-0.5 space-x-1">
                    {renderDirectionIcon(call.direction)}
                    <span>{new Date(call.startedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    <span>•</span>
                    <span>{formatDuration(call.durationSeconds)}</span>
                  </div>
                </div>
              </div>

              {/* Redial Buttons */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  onClick={() =>
                    startCall({
                      type: 'audio',
                      recipientId: call.peerId,
                      recipientName: call.peerName,
                      recipientAvatar: call.peerAvatar,
                    })
                  }
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition"
                  title="Audio Call"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    startCall({
                      type: 'video',
                      recipientId: call.peerId,
                      recipientName: call.peerName,
                      recipientAvatar: call.peerAvatar,
                    })
                  }
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-400 transition"
                  title="Video Call"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
