import React from 'react';
import {
  CircleDashed,
  Plus,
  Eye,
  Camera,
  Edit3,
  Clock,
  Shield,
  Lock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useSocial } from '../../context/SocialContext';
import { useAuth } from '../../context/AuthContext';

interface StatusTabProps {
  onOpenStatusViewer: (groupIndex: number) => void;
  onOpenStatusCreator: () => void;
}

export const StatusTab: React.FC<StatusTabProps> = ({
  onOpenStatusViewer,
  onOpenStatusCreator,
}) => {
  const { user } = useAuth();
  const { statusGroups } = useSocial();

  const myGroupIndex = statusGroups.findIndex((g) => g.user.id === user?.id);
  const myStories = myGroupIndex !== -1 ? statusGroups[myGroupIndex].stories : [];

  const contactGroups = statusGroups.filter((g) => g.user.id !== user?.id);

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) {
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      return `${diffMins} minutes ago`;
    }
    return `${diffHours} hours ago`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden font-sans select-none relative">
      {/* Top Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-20">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <span>Status Updates</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              24h
            </span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-1">
            <Lock className="w-3 h-3 text-emerald-400 inline" />
            <span>End-to-end encrypted with your accepted contacts</span>
          </p>
        </div>

        <button
          onClick={onOpenStatusCreator}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-md shadow-orange-500/20 flex items-center space-x-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Status</span>
        </button>
      </div>

      {/* Main Status Feed Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 max-w-2xl w-full mx-auto">
        {/* MY STATUS CARD */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div
              onClick={() => {
                if (myStories.length > 0 && myGroupIndex !== -1) {
                  onOpenStatusViewer(myGroupIndex);
                } else {
                  onOpenStatusCreator();
                }
              }}
              className="flex items-center space-x-3.5 cursor-pointer flex-1"
            >
              <div className="relative">
                <div
                  className={`w-14 h-14 rounded-full p-[2.5px] ${
                    myStories.length > 0
                      ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500'
                      : 'border-2 border-dashed border-slate-700 bg-slate-800'
                  }`}
                >
                  <img
                    src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                    alt="My Avatar"
                    className="w-full h-full rounded-full object-cover ring-2 ring-slate-950"
                  />
                </div>
                <div className="absolute bottom-0 right-0 bg-amber-500 text-slate-950 rounded-full p-1 ring-2 ring-slate-900 shadow">
                  <Plus className="w-3.5 h-3.5 font-black stroke-[3]" />
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-100 flex items-center space-x-1.5">
                  <span>My Status</span>
                  {myStories.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold">
                      {myStories.length} Active
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {myStories.length > 0
                    ? `${formatTimeAgo(myStories[myStories.length - 1].createdAt)} • Tap to view`
                    : 'Tap to add status update (Disappears in 24h)'}
                </p>
              </div>
            </div>

            {myStories.length > 0 && (
              <button
                onClick={onOpenStatusCreator}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 transition ml-2"
                title="Add Another Status Update"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* RECENT UPDATES SECTION */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Recent Updates ({contactGroups.length})
            </span>
            <span className="text-[10px] text-slate-500">Auto-expires after 24 hours</span>
          </div>

          {contactGroups.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 text-center text-slate-500 text-xs">
              <CircleDashed className="w-8 h-8 mx-auto mb-2 text-slate-600 animate-spin" />
              <p>No recent status updates from your contacts.</p>
              <p className="text-[11px] text-slate-600 mt-1">
                When your accepted contacts share a 24-hour update, it will appear here.
              </p>
            </div>
          ) : (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden shadow-lg">
              {contactGroups.map((group) => {
                const groupIdx = statusGroups.findIndex((g) => g.user.id === group.user.id);
                const latestStory = group.stories[group.stories.length - 1];

                return (
                  <div
                    key={group.user.id}
                    onClick={() => onOpenStatusViewer(groupIdx)}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-800/50 cursor-pointer transition"
                  >
                    <div className="flex items-center space-x-3.5">
                      {/* Gradient ringed avatar */}
                      <div className="w-13 h-13 rounded-full p-[2.5px] bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 shadow-md">
                        <img
                          src={group.user.avatar || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80'}
                          alt={group.user.displayName}
                          className="w-full h-full rounded-full object-cover ring-2 ring-slate-950"
                        />
                      </div>

                      <div>
                        <h4 className="font-semibold text-xs text-slate-100 flex items-center space-x-1.5">
                          <span>{group.user.displayName}</span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            ({group.stories.length})
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-500 inline" />
                          <span>{latestStory ? formatTimeAgo(latestStory.createdAt) : 'Recent'}</span>
                          {latestStory?.textContent && (
                            <span className="text-slate-500 truncate max-w-[160px] inline-block ml-1">
                              • "{latestStory.textContent}"
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-slate-500">
                      <span className="text-[11px] text-amber-400/80 font-medium hidden sm:inline">View</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PRIVACY & SECURITY ADVISORY */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 flex items-start space-x-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h5 className="font-bold text-slate-200 text-xs">AAM Sovereign Status Architecture</h5>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Your status updates are end-to-end encrypted. They are only decryptable by contacts you have mutually accepted and automatically delete after 24 hours.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons for quick status posting */}
      <div className="absolute bottom-6 right-6 flex flex-col space-y-2.5 z-30">
        <button
          onClick={onOpenStatusCreator}
          className="w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 flex items-center justify-center shadow-xl transition hover:scale-105"
          title="Create Text Status"
        >
          <Edit3 className="w-5 h-5" />
        </button>
        <button
          onClick={onOpenStatusCreator}
          className="w-13 h-13 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 flex items-center justify-center shadow-2xl shadow-orange-500/40 transition hover:scale-105"
          title="Create Photo / Video Status"
        >
          <Camera className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
