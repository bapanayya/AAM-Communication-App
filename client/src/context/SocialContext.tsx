import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DailyFeedItem, StatusGroup, FriendRequest, UserBackup, Advertisement } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface SocialContextType {
  contacts: any[];
  friendRequests: { incoming: FriendRequest[]; outgoing: FriendRequest[] };
  dailyFeedItems: DailyFeedItem[];
  statusGroups: StatusGroup[];
  storageSummary: any;
  backups: UserBackup[];
  advertisements: Advertisement[];
  loadContacts: () => Promise<void>;
  loadFriendRequests: () => Promise<void>;
  sendFriendRequest: (recipientId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  loadDailyFeed: () => Promise<void>;
  likeFeedItem: (id: string) => Promise<void>;
  reactFeedItem: (id: string, emoji: string) => Promise<void>;
  createFeedMoment: (mediaUrl: string, mediaType: 'image' | 'video', caption?: string) => Promise<void>;
  loadStatusUpdates: () => Promise<void>;
  createStatus: (data: any) => Promise<void>;
  viewStatus: (id: string) => Promise<void>;
  deleteStatus: (id: string) => Promise<void>;
  loadStorageSummary: () => Promise<void>;
  createBackup: (snapshotCiphertext: string) => Promise<void>;
  restoreBackup: (backupId: string) => Promise<any>;
  loadAdvertisements: () => Promise<void>;
  createAdvertisement: (data: {
    headline: string;
    caption?: string;
    mediaType: 'video' | 'image';
    mediaUrl: string;
    ctaText?: string;
    ctaLink?: string;
    price?: string;
    tags?: string[];
  }) => Promise<void>;
  likeAdvertisement: (id: string) => Promise<void>;
  shareAdvertisement: (id: string) => Promise<void>;
  deleteAdvertisement: (id: string) => Promise<void>;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }>({
    incoming: [],
    outgoing: [],
  });
  const [dailyFeedItems, setDailyFeedItems] = useState<DailyFeedItem[]>([]);
  const [statusGroups, setStatusGroups] = useState<StatusGroup[]>([]);
  const [storageSummary, setStorageSummary] = useState<any>(null);
  const [backups, setBackups] = useState<UserBackup[]>([]);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);

  const loadContacts = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.getContacts();
      setContacts(res.contacts || []);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    }
  }, [user]);

  const loadFriendRequests = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.getFriendRequests();
      setFriendRequests({ incoming: res?.incoming || [], outgoing: res?.outgoing || [] });
    } catch (err) {
      console.error('Failed to load friend requests:', err);
    }
  }, [user]);

  const loadDailyFeed = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.getDailyFeed();
      setDailyFeedItems(res.feedItems || []);
    } catch (err) {
      console.error('Failed to load daily feed:', err);
    }
  }, [user]);

  const loadStatusUpdates = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.getStatusUpdates();
      setStatusGroups(res.statusGroups || []);
    } catch (err) {
      console.error('Failed to load status updates:', err);
    }
  }, [user]);

  const loadStorageSummary = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.getStorageSummary();
      setStorageSummary(res);
      const bRes = await api.getBackups();
      setBackups(bRes?.backups || []);
    } catch (err) {
      console.error('Failed to load storage summary:', err);
    }
  }, [user]);

  const loadAdvertisements = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.getAdvertisements();
      setAdvertisements(res.advertisements || []);
    } catch (err) {
      console.error('Failed to load advertisements:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadContacts();
      loadFriendRequests();
      loadDailyFeed();
      loadStatusUpdates();
      loadStorageSummary();
      loadAdvertisements();
    }
  }, [user, loadContacts, loadFriendRequests, loadDailyFeed, loadStatusUpdates, loadStorageSummary, loadAdvertisements]);

  const sendFriendRequest = async (recipientId: string) => {
    await api.sendFriendRequest(recipientId);
    await loadFriendRequests();
  };

  const acceptFriendRequest = async (requestId: string) => {
    await api.acceptFriendRequest(requestId);
    await loadFriendRequests();
    await loadContacts();
  };

  const rejectFriendRequest = async (requestId: string) => {
    await api.rejectFriendRequest(requestId);
    await loadFriendRequests();
  };

  const likeFeedItem = async (id: string) => {
    const res = await api.likeFeedItem(id);
    setDailyFeedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, likes: res.likes } : item))
    );
  };

  const reactFeedItem = async (id: string, emoji: string) => {
    const res = await api.reactFeedItem(id, emoji);
    setDailyFeedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, reactions: res.reactions } : item))
    );
  };

  const createFeedMoment = async (mediaUrl: string, mediaType: 'image' | 'video', caption?: string) => {
    const res = await api.createFeedMoment(mediaUrl, mediaType, caption);
    setDailyFeedItems((prev) => [res.feedItem, ...prev]);
  };

  const createStatus = async (data: any) => {
    await api.createStatus(data);
    await loadStatusUpdates();
  };

  const viewStatus = async (id: string) => {
    await api.viewStatus(id);
  };

  const deleteStatus = async (id: string) => {
    await api.deleteStatus(id);
    await loadStatusUpdates();
  };

  const createBackup = async (snapshotCiphertext: string) => {
    await api.createBackup(snapshotCiphertext);
    await loadStorageSummary();
  };

  const restoreBackup = async (backupId: string) => {
    return await api.restoreBackup(backupId);
  };

  const createAdvertisement = async (data: any) => {
    await api.createAdvertisement(data);
    await loadAdvertisements();
  };

  const likeAdvertisement = async (id: string) => {
    if (!user) return;
    setAdvertisements((prev) =>
      prev.map((ad) => {
        if (ad.id === id) {
          const hasLiked = ad.likes.includes(user.id);
          const newLikes = hasLiked ? ad.likes.filter((uid) => uid !== user.id) : [...ad.likes, user.id];
          return { ...ad, likes: newLikes };
        }
        return ad;
      })
    );
    try {
      const res = await api.likeAdvertisement(id);
      setAdvertisements((prev) =>
        prev.map((ad) => (ad.id === id ? { ...ad, likes: res.likes } : ad))
      );
    } catch (err) {
      console.error('Failed to like advertisement:', err);
      await loadAdvertisements();
    }
  };

  const shareAdvertisement = async (id: string) => {
    setAdvertisements((prev) =>
      prev.map((ad) => (ad.id === id ? { ...ad, sharesCount: (ad.sharesCount || 0) + 1 } : ad))
    );
    try {
      const res = await api.shareAdvertisement(id);
      setAdvertisements((prev) =>
        prev.map((ad) => (ad.id === id ? { ...ad, sharesCount: res.sharesCount } : ad))
      );
    } catch (err) {
      console.error('Failed to share advertisement:', err);
    }
  };

  const deleteAdvertisement = async (id: string) => {
    await api.deleteAdvertisement(id);
    await loadAdvertisements();
  };

  return (
    <SocialContext.Provider
      value={{
        contacts,
        friendRequests,
        dailyFeedItems,
        statusGroups,
        storageSummary,
        backups,
        advertisements,
        loadContacts,
        loadFriendRequests,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        loadDailyFeed,
        likeFeedItem,
        reactFeedItem,
        createFeedMoment,
        loadStatusUpdates,
        createStatus,
        viewStatus,
        deleteStatus,
        loadStorageSummary,
        createBackup,
        restoreBackup,
        loadAdvertisements,
        createAdvertisement,
        likeAdvertisement,
        shareAdvertisement,
        deleteAdvertisement,
      }}
    >
      {children}
    </SocialContext.Provider>
  );
};

export const useSocial = () => {
  const context = useContext(SocialContext);
  if (!context) throw new Error('useSocial must be used within a SocialProvider');
  return context;
};
