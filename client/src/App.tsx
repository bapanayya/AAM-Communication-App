import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider, useChat } from './context/ChatContext';
import { CallProvider, useCall } from './context/CallContext';
import { SocialProvider, useSocial } from './context/SocialContext';
import { Header } from './components/layout/Header';
import { Navigation, NavTab } from './components/layout/Navigation';
import { ChatList } from './components/chat/ChatList';
import { ChatWindow } from './components/chat/ChatWindow';
import { CallHistoryTab } from './components/calling/CallHistoryTab';
import { DailyFeedReels } from './components/feed/DailyFeedReels';
import { AdsSpaceReels } from './components/ads/AdsSpaceReels';
import { ActiveCallModal } from './components/calling/ActiveCallModal';
import { IncomingCallModal } from './components/calling/IncomingCallModal';
import { PendingTransfersModal } from './components/chat/PendingTransfersModal';
import { StoryViewerModal } from './components/status/StoryViewerModal';
import { StoryCreatorModal } from './components/status/StoryCreatorModal';
import { ContactsModal } from './components/contacts/ContactsModal';
import { CreateGroupModal } from './components/groups/CreateGroupModal';
import { BroadcastModal } from './components/groups/BroadcastModal';
import { StorageSettingsModal } from './components/storage/StorageSettingsModal';
import { SettingsModal } from './components/settings/SettingsModal';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const { activeConversation, setActiveConversation, startDirectChat } = useChat();

  const [currentTab, setCurrentTab] = useState<NavTab>('chats');
  const [isMobileSim, setIsMobileSim] = useState<boolean>(false);

  // Modals state
  const [showPendingTransfers, setShowPendingTransfers] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeStoryGroupIndex, setActiveStoryGroupIndex] = useState<number | null>(null);
  const [showStoryCreator, setShowStoryCreator] = useState(false);

  const handleOpenDirectChat = async (contactUserId: string) => {
    await startDirectChat(contactUserId);
    setCurrentTab('chats');
  };

  const handleTabChange = (tab: NavTab) => {
    if (tab === 'transfers') {
      setShowPendingTransfers(true);
    } else if (tab === 'contacts') {
      setShowContactsModal(true);
    } else if (tab === 'storage') {
      setShowStorageModal(true);
    } else if (tab === 'settings') {
      setShowSettingsModal(true);
    } else if (tab === 'status') {
      setActiveStoryGroupIndex(0);
    } else {
      setCurrentTab(tab);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans ${isMobileSim ? 'p-4 sm:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40' : ''}`}>
      {/* Mobile Simulator Frame or Full Screen */}
      <div
        className={`w-full flex flex-col overflow-hidden bg-slate-950 shadow-2xl transition-all duration-300 ${
          isMobileSim
            ? 'max-w-[420px] h-[860px] rounded-[48px] border-[10px] border-slate-800 ring-1 ring-slate-700/60 relative'
            : 'h-screen'
        }`}
      >
        {/* Smartphone Dynamic Island / Notch if in simulator mode */}
        {isMobileSim && (
          <div className="absolute top-2 inset-x-0 flex justify-center z-50 pointer-events-none">
            <div className="w-24 h-4 bg-slate-900 rounded-full flex items-center justify-between px-2">
              <span className="w-2 h-2 rounded-full bg-slate-950" />
              <span className="w-2 h-2 rounded-full bg-blue-950/60 ring-1 ring-blue-500/40" />
            </div>
          </div>
        )}

        {/* Global App Header */}
        <Header
          isMobileSim={isMobileSim}
          setIsMobileSim={setIsMobileSim}
          onOpenStorage={() => setShowStorageModal(true)}
        />

        {/* Main Body with Sidebar/Navigation */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden relative">
          {/* Main Content Area */}
          <main className="flex-1 flex overflow-hidden order-1 sm:order-2">
            {currentTab === 'chats' && (
              <div className="flex-1 flex w-full h-full overflow-hidden">
                {/* On mobile: show chat list OR active conversation */}
                <div className={`w-full sm:w-auto h-full ${activeConversation ? 'hidden sm:flex' : 'flex'}`}>
                  <ChatList
                    onOpenNewChat={() => setShowContactsModal(true)}
                    onOpenNewGroup={() => setShowCreateGroup(true)}
                    onOpenBroadcast={() => setShowBroadcast(true)}
                    onOpenStatusViewer={(idx) => setActiveStoryGroupIndex(idx)}
                    onOpenStatusCreator={() => setShowStoryCreator(true)}
                  />
                </div>

                <div className={`w-full sm:flex-1 h-full ${activeConversation ? 'flex' : 'hidden sm:flex'}`}>
                  <ChatWindow
                    onBack={() => setActiveConversation(null)}
                    onOpenTransfers={() => setShowPendingTransfers(true)}
                  />
                </div>
              </div>
            )}

            {currentTab === 'calls' && <CallHistoryTab />}
            {currentTab === 'feed' && <DailyFeedReels onOpenChatWithUser={handleOpenDirectChat} />}
            {currentTab === 'ads' && <AdsSpaceReels onOpenChatWithUser={handleOpenDirectChat} />}
          </main>

          {/* Navigation Bar */}
          <div className="order-2 sm:order-1">
            <Navigation currentTab={currentTab} setCurrentTab={handleTabChange} />
          </div>
        </div>

        {/* Smartphone Home Bar if in simulator mode */}
        {isMobileSim && (
          <div className="h-4 bg-slate-950 flex items-center justify-center pointer-events-none z-50">
            <div className="w-32 h-1 bg-slate-700 rounded-full" />
          </div>
        )}
      </div>

      {/* Global Overlays & Modals */}
      <ActiveCallModal />
      <IncomingCallModal />

      {showPendingTransfers && (
        <PendingTransfersModal onClose={() => setShowPendingTransfers(false)} />
      )}

      {showContactsModal && (
        <ContactsModal
          onClose={() => setShowContactsModal(false)}
          onOpenDirectChat={handleOpenDirectChat}
        />
      )}

      {showCreateGroup && (
        <CreateGroupModal onClose={() => setShowCreateGroup(false)} />
      )}

      {showBroadcast && (
        <BroadcastModal onClose={() => setShowBroadcast(false)} />
      )}

      {showStorageModal && (
        <StorageSettingsModal onClose={() => setShowStorageModal(false)} />
      )}

      {showSettingsModal && (
        <SettingsModal onClose={() => setShowSettingsModal(false)} />
      )}

      {activeStoryGroupIndex !== null && (
        <StoryViewerModal
          initialGroupIndex={activeStoryGroupIndex}
          onClose={() => setActiveStoryGroupIndex(null)}
        />
      )}

      {showStoryCreator && (
        <StoryCreatorModal onClose={() => setShowStoryCreator(false)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <CallProvider>
          <SocialProvider>
            <MainApp />
          </SocialProvider>
        </CallProvider>
      </ChatProvider>
    </AuthProvider>
  );
}
