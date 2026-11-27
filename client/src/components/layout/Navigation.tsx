import React from 'react';
import { MessageSquare, Phone, Film, Megaphone, CircleDashed, Clock, Users, HardDrive, Settings } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useCall } from '../../context/CallContext';
import { useSocial } from '../../context/SocialContext';

export type NavTab = 'chats' | 'calls' | 'feed' | 'ads' | 'status' | 'transfers' | 'contacts' | 'storage' | 'settings';

interface NavigationProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, setCurrentTab }) => {
  const { conversations, pendingTransfers } = useChat();
  const { callHistory } = useCall();
  const { friendRequests } = useSocial();

  const totalUnread = (conversations || []).reduce((acc, c) => acc + (c?.unreadCount || 0), 0);
  const missedCalls = (callHistory || []).filter((c) => c?.direction === 'missed').length;
  const pendingCount = (pendingTransfers || []).filter((t) => t?.status === 'queued' || t?.status === 'transferring').length;
  const incomingReqCount = (friendRequests?.incoming || []).length;

  const tabs: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'chats', label: 'Chats', icon: MessageSquare, badge: totalUnread },
    { id: 'status', label: 'Status', icon: CircleDashed },
    { id: 'calls', label: 'Calls', icon: Phone, badge: missedCalls },
    { id: 'feed', label: 'Daily Feed', icon: Film },
    { id: 'ads', label: 'Ads Space', icon: Megaphone },
    { id: 'transfers', label: 'Transfers', icon: Clock, badge: pendingCount },
    { id: 'contacts', label: 'Contacts', icon: Users, badge: incomingReqCount },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="bg-slate-900/95 backdrop-blur-md border-t sm:border-t-0 sm:border-r border-slate-800 text-slate-400 flex sm:flex-col overflow-x-auto sm:overflow-x-visible scrollbar-none px-2 py-1.5 sm:p-2 z-30 select-none gap-1 sm:gap-0.5 items-center sm:items-stretch shadow-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`relative flex flex-col sm:flex-row items-center sm:space-x-3 px-2.5 py-1.5 sm:py-2.5 sm:px-3.5 rounded-xl transition font-medium text-xs flex-shrink-0 min-w-[58px] sm:min-w-0 sm:w-full ${
              isActive
                ? 'text-amber-400 bg-amber-500/10 font-bold'
                : 'hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              {tab.badge && tab.badge > 0 ? (
                <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white font-bold text-[9px] rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center ring-2 ring-slate-900">
                  {tab.badge}
                </span>
              ) : null}
            </div>
            <span className="text-[10px] sm:text-xs mt-1 sm:mt-0 whitespace-nowrap">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
