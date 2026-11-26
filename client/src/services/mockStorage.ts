import {
  User,
  Conversation,
  Message,
  PendingTransfer,
  CallHistoryRecord,
  DailyFeedItem,
  StatusUpdate,
  StatusGroup,
  Advertisement,
  UserBackup,
} from '../types';

const STORAGE_KEY = 'aum_local_sovereign_store_v1';

export class MockStorageService {
  private users: User[] = [];
  private contacts: { id: string; userId: string; contactUserId: string; relationshipStatus: string; createdAt: string }[] = [];
  private friendRequests: any[] = [];
  private conversations: Conversation[] = [];
  private messages: Message[] = [];
  private pendingTransfers: PendingTransfer[] = [];
  private callHistory: CallHistoryRecord[] = [];
  private dailyFeedItems: DailyFeedItem[] = [];
  private statusUpdates: StatusUpdate[] = [];
  private advertisements: Advertisement[] = [];
  private backups: UserBackup[] = [];
  private currentUserId: string = 'usr_aarav';

  constructor() {
    this.init();
  }

  private init() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        this.users = parsed.users || [];
        this.contacts = parsed.contacts || [];
        this.friendRequests = parsed.friendRequests || [];
        this.conversations = parsed.conversations || [];
        this.messages = parsed.messages || [];
        this.pendingTransfers = parsed.pendingTransfers || [];
        this.callHistory = parsed.callHistory || [];
        this.dailyFeedItems = parsed.dailyFeedItems || [];
        this.statusUpdates = parsed.statusUpdates || [];
        this.advertisements = parsed.advertisements || [];
        this.backups = parsed.backups || [];
        this.currentUserId = parsed.currentUserId || 'usr_aarav';

        // If advertisements or conversations are empty in old localStorage, re-seed
        if (this.advertisements.length === 0 || this.conversations.length === 0) {
          this.seedDefaultData();
          this.save();
        }
        return;
      } catch (e) {
        console.warn('Failed to parse local sovereign store, resetting defaults:', e);
      }
    }

    this.seedDefaultData();
    this.save();
  }

  private save() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          users: this.users,
          contacts: this.contacts,
          friendRequests: this.friendRequests,
          conversations: this.conversations,
          messages: this.messages,
          pendingTransfers: this.pendingTransfers,
          callHistory: this.callHistory,
          dailyFeedItems: this.dailyFeedItems,
          statusUpdates: this.statusUpdates,
          advertisements: this.advertisements,
          backups: this.backups,
          currentUserId: this.currentUserId,
        })
      );
    } catch (e) {
      console.warn('Failed to persist to localStorage:', e);
    }
  }

  private seedDefaultData() {
    const now = new Date();
    const todayIso = now.toISOString();
    const expiresTomorrowIso = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    this.users = [
      {
        id: 'usr_aarav',
        username: 'aarav_sharma',
        displayName: 'Aarav Sharma',
        phoneNumber: '+919876543210',
        email: 'aarav@aum.in',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        bio: 'Tech architect. Building sovereign privacy infrastructure for India 🇮🇳',
        storageMode: 'local_device',
        publicKey: 'pub_key_aarav_x25519_mock',
        deviceId: 'dev_pixel9_aarav',
        createdAt: todayIso,
      },
      {
        id: 'usr_priya',
        username: 'priya_patel',
        displayName: 'Priya Patel',
        phoneNumber: '+919876543211',
        email: 'priya@aum.in',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
        bio: 'Digital artist & designer. Proudly Made in India ✨',
        storageMode: 'local_backup',
        publicKey: 'pub_key_priya_x25519_mock',
        deviceId: 'dev_iphone16_priya',
        createdAt: todayIso,
      },
      {
        id: 'usr_vikram',
        username: 'vikram_malhotra',
        displayName: 'Vikram Malhotra',
        phoneNumber: '+919876543212',
        email: 'vikram@aum.in',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        bio: 'Open-source enthusiast & amateur astronomer 🔭',
        storageMode: 'cloud_sync',
        publicKey: 'pub_key_vikram_x25519_mock',
        deviceId: 'dev_galaxy24_vikram',
        createdAt: todayIso,
      },
      {
        id: 'usr_ananya',
        username: 'ananya_iyer',
        displayName: 'Ananya Iyer',
        phoneNumber: '+919876543213',
        email: 'ananya@aum.in',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
        bio: 'Classical Carnatic vocalist & AI researcher 🎵',
        storageMode: 'local_device',
        publicKey: 'pub_key_ananya_x25519_mock',
        deviceId: 'dev_oneplus12_ananya',
        createdAt: todayIso,
      },
    ];

    this.contacts = [
      { id: 'c_1', userId: 'usr_aarav', contactUserId: 'usr_priya', relationshipStatus: 'accepted', createdAt: todayIso },
      { id: 'c_2', userId: 'usr_priya', contactUserId: 'usr_aarav', relationshipStatus: 'accepted', createdAt: todayIso },
      { id: 'c_3', userId: 'usr_aarav', contactUserId: 'usr_vikram', relationshipStatus: 'accepted', createdAt: todayIso },
      { id: 'c_4', userId: 'usr_vikram', contactUserId: 'usr_aarav', relationshipStatus: 'accepted', createdAt: todayIso },
    ];

    this.friendRequests = [
      {
        id: 'fr_1',
        senderId: 'usr_ananya',
        recipientId: 'usr_aarav',
        status: 'pending',
        createdAt: todayIso,
        sender: this.users[3],
      },
    ];

    this.conversations = [
      {
        id: 'conv_aarav_priya',
        type: 'direct',
        title: 'Priya Patel',
        name: 'Priya Patel',
        createdBy: 'usr_aarav',
        memberIds: ['usr_aarav', 'usr_priya'],
        adminIds: ['usr_aarav'],
        createdAt: todayIso,
        updatedAt: todayIso,
      },
      {
        id: 'conv_aarav_vikram',
        type: 'direct',
        title: 'Vikram Malhotra',
        name: 'Vikram Malhotra',
        createdBy: 'usr_aarav',
        memberIds: ['usr_aarav', 'usr_vikram'],
        adminIds: ['usr_aarav'],
        createdAt: todayIso,
        updatedAt: todayIso,
      },
      {
        id: 'conv_group_aum_builders',
        type: 'group',
        title: 'AUM Core Founders 🇮🇳',
        name: 'AUM Core Founders 🇮🇳',
        description: 'Building private, sovereign social communication for Bharat',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
        createdBy: 'usr_aarav',
        memberIds: ['usr_aarav', 'usr_priya', 'usr_vikram'],
        adminIds: ['usr_aarav'],
        createdAt: todayIso,
        updatedAt: todayIso,
      },
    ];

    this.messages = [
      {
        id: 'msg_1',
        conversationId: 'conv_aarav_priya',
        senderId: 'usr_priya',
        recipientId: 'usr_aarav',
        contentType: 'text',
        text: 'Namaste Aarav! How is the AUM peer-to-peer storage engine testing going?',
        deliveryState: 'read',
        reactions: { usr_aarav: '🙏' },
        createdAt: new Date(now.getTime() - 3600000).toISOString(),
        deliveredAt: new Date(now.getTime() - 3500000).toISOString(),
        readAt: new Date(now.getTime() - 3400000).toISOString(),
      },
      {
        id: 'msg_2',
        conversationId: 'conv_aarav_priya',
        senderId: 'usr_aarav',
        recipientId: 'usr_priya',
        contentType: 'text',
        text: 'Namaste Priya! It is fantastic. When both devices are online, E2EE WebRTC transfer is instantaneous with zero server storage.',
        deliveryState: 'read',
        reactions: { usr_priya: '❤️' },
        createdAt: new Date(now.getTime() - 2500000).toISOString(),
        deliveredAt: new Date(now.getTime() - 2400000).toISOString(),
        readAt: new Date(now.getTime() - 2300000).toISOString(),
      },
      {
        id: 'msg_3',
        conversationId: 'conv_aarav_priya',
        senderId: 'usr_priya',
        recipientId: 'usr_aarav',
        contentType: 'image',
        text: 'Check out the new Make in India saffron seal for our app banner!',
        mediaUrl: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=800&q=80',
        mediaName: 'AUM_MakeInIndia_Badge.jpg',
        mediaSize: 1024 * 450,
        deliveryState: 'read',
        reactions: { usr_aarav: '🔥' },
        createdAt: new Date(now.getTime() - 1800000).toISOString(),
        deliveredAt: new Date(now.getTime() - 1700000).toISOString(),
        readAt: new Date(now.getTime() - 1600000).toISOString(),
      },
      {
        id: 'msg_4',
        conversationId: 'conv_aarav_vikram',
        senderId: 'usr_aarav',
        recipientId: 'usr_vikram',
        contentType: 'image',
        text: 'Raw 4K telemetry capture from the Himalayan stargazing expedition.',
        mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
        mediaName: 'Himalayan_Observation.jpg',
        mediaSize: 1024 * 1024 * 3,
        deliveryState: 'pending',
        reactions: {},
        createdAt: new Date(now.getTime() - 900000).toISOString(),
      },
      {
        id: 'msg_5',
        conversationId: 'conv_group_aum_builders',
        senderId: 'usr_aarav',
        contentType: 'text',
        text: 'Welcome team! Audio/video calling is now WebRTC enabled with multi-party SFU signalling support.',
        deliveryState: 'delivered',
        reactions: { usr_priya: '👏', usr_vikram: '🚀' },
        createdAt: new Date(now.getTime() - 500000).toISOString(),
      },
    ];

    this.pendingTransfers = [
      {
        id: 'pt_1',
        messageId: 'msg_4',
        senderId: 'usr_aarav',
        recipientId: 'usr_vikram',
        recipient: {
          id: 'usr_vikram',
          username: 'vikram_malhotra',
          displayName: 'Vikram Malhotra',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        },
        contentType: 'image',
        mediaName: 'Himalayan_Observation.jpg',
        fileSize: 1024 * 1024 * 3,
        previewUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80',
        status: 'queued',
        createdAt: new Date(now.getTime() - 900000).toISOString(),
        lastAttemptAt: new Date(now.getTime() - 300000).toISOString(),
      },
    ];

    this.callHistory = [
      {
        id: 'ch_1',
        callId: 'call_101',
        userId: 'usr_aarav',
        peerId: 'usr_priya',
        peerName: 'Priya Patel',
        peerAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
        type: 'video',
        direction: 'incoming',
        status: 'ended',
        startedAt: new Date(now.getTime() - 7200000).toISOString(),
        durationSeconds: 290,
      },
      {
        id: 'ch_2',
        callId: 'call_102',
        userId: 'usr_aarav',
        peerId: 'usr_vikram',
        peerName: 'Vikram Malhotra',
        peerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        type: 'audio',
        direction: 'missed',
        status: 'missed',
        startedAt: new Date(now.getTime() - 14400000).toISOString(),
        durationSeconds: 0,
      },
    ];

    this.dailyFeedItems = [
      {
        id: 'feed_1',
        senderId: 'usr_priya',
        senderName: 'Priya Patel',
        senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
        recipientId: 'usr_aarav',
        mediaUrl: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80',
        mediaType: 'image',
        caption: 'Sunrise over Taj Mahal, Agra. Beautiful morning for sovereign code! 🇮🇳🛕',
        likes: ['usr_aarav'],
        reactions: { usr_aarav: '❤️' },
        createdAt: new Date(now.getTime() - 10800000).toISOString(),
        expiresAt: expiresTomorrowIso,
      },
      {
        id: 'feed_2',
        senderId: 'usr_vikram',
        senderName: 'Vikram Malhotra',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        recipientId: 'usr_aarav',
        mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        mediaType: 'image',
        caption: 'Himalayan range clear skies. Zero telemetry sent to foreign servers.',
        likes: ['usr_aarav', 'usr_priya'],
        reactions: { usr_aarav: '🔥', usr_priya: '✨' },
        createdAt: new Date(now.getTime() - 7200000).toISOString(),
        expiresAt: expiresTomorrowIso,
      },
    ];

    this.statusUpdates = [
      {
        id: 'stat_1',
        userId: 'usr_priya',
        userName: 'Priya Patel',
        userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=800&q=80',
        textContent: 'Bangalore monsoon vibes while writing WebRTC code ☕🌧️',
        viewers: ['usr_aarav'],
        privacy: 'all_contacts',
        createdAt: new Date(now.getTime() - 14400000).toISOString(),
        expiresAt: expiresTomorrowIso,
      },
      {
        id: 'stat_2',
        userId: 'usr_aarav',
        userName: 'Aarav Sharma',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        mediaType: 'text',
        textContent: 'Privacy is not a luxury, it is a fundamental sovereign right. AUM is born 🕉️',
        backgroundGradient: 'from-amber-600 via-orange-600 to-rose-700',
        viewers: ['usr_priya', 'usr_vikram'],
        privacy: 'all_contacts',
        createdAt: new Date(now.getTime() - 7200000).toISOString(),
        expiresAt: expiresTomorrowIso,
      },
      {
        id: 'stat_3',
        userId: 'usr_vikram',
        userName: 'Vikram Malhotra',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
        textContent: 'Star cluster over Western Ghats tonight ✨🌌',
        viewers: ['usr_aarav'],
        privacy: 'all_contacts',
        createdAt: new Date(now.getTime() - 21600000).toISOString(),
        expiresAt: expiresTomorrowIso,
      },
    ];

    this.advertisements = [
      {
        id: 'ad_1',
        userId: 'usr_priya',
        userName: 'Priya Patel',
        userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
        userPhone: '+919876543211',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
        headline: 'Handcrafted Heritage Silk Weaves & Festive Collection ✨',
        caption: 'Exclusive 100% pure mulberry silk sarees handwoven by master artisans in Varanasi & Kanchipuram. Direct-from-weaver ethical craftsmanship with free pan-India express shipping. Special 20% discount for all AUM contacts this week!',
        ctaText: 'Inquire on Chat',
        ctaLink: 'usr_priya',
        price: '₹4,999',
        likes: ['usr_aarav', 'usr_vikram'],
        sharesCount: 18,
        tags: ['Handloom', 'Artisan', 'Festive', 'Silk'],
        createdAt: new Date(now.getTime() - 7200000).toISOString(),
      },
      {
        id: 'ad_2',
        userId: 'usr_vikram',
        userName: 'Vikram Malhotra',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        userPhone: '+919876543212',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        headline: 'Himalayan Dark Sky Expedition & Astrophotography Camp 🔭🌌',
        caption: 'Join our 5-day deep-sky observation retreat in Spiti Valley. Experience zero light pollution, guided observation with 14-inch Dobsonian telescopes, astrophotography masterclasses, and cozy heated mountain tents. Limited batch of 12 spots.',
        ctaText: 'Reserve Camp Spot',
        ctaLink: 'https://astrohimalaya.in',
        price: '₹18,500 / person',
        likes: ['usr_aarav'],
        sharesCount: 31,
        tags: ['Travel', 'Astronomy', 'Himalayas', 'Adventure'],
        createdAt: new Date(now.getTime() - 14400000).toISOString(),
      },
      {
        id: 'ad_3',
        userId: 'usr_aarav',
        userName: 'Aarav Sharma',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        userPhone: '+919876543210',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
        headline: 'Zero-Trust WebRTC & Sovereign Cloud Architecture Advisory 🇮🇳',
        caption: 'Helping Indian developers and startups engineer peer-to-peer, privacy-first communication tools with device-bound encryption and local working storage. Book a 1-on-1 technical advisory session.',
        ctaText: 'Book Strategy Call',
        ctaLink: 'usr_aarav',
        price: 'Free 30-Min Advisory',
        likes: ['usr_priya', 'usr_vikram'],
        sharesCount: 45,
        tags: ['Tech', 'Consulting', 'Architecture', 'Privacy'],
        createdAt: new Date(now.getTime() - 21600000).toISOString(),
      },
    ];

    this.backups = [
      {
        id: 'bkp_1',
        userId: 'usr_priya',
        version: 1,
        snapshotCiphertext: 'enc_blob_snapshot_v1_aes_gcm_sample_data',
        sizeBytes: 1024 * 1024 * 4.2,
        deviceInfo: 'iPhone 16 Pro (iOS 19.1)',
        createdAt: new Date(now.getTime() - 86400000).toISOString(),
      },
    ];
  }

  // Active User Helper
  public getCurrentUser(): User {
    const user = this.users.find((u) => u.id === this.currentUserId);
    return user || this.users[0];
  }

  public setCurrentUser(userId: string) {
    this.currentUserId = userId;
    this.save();
  }

  // Interceptor for API Requests
  public handleMockRequest(endpoint: string, options: RequestInit = {}): any {
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body ? JSON.parse(options.body as string) : {};

    // 1. Auth & Profiles
    if (endpoint === '/auth/demo-login') {
      const targetUserId = body.userId || 'usr_aarav';
      this.setCurrentUser(targetUserId);
      const user = this.getCurrentUser();
      return { token: `mock_jwt_${user.id}`, user };
    }

    if (endpoint === '/auth/me') {
      return { user: this.getCurrentUser() };
    }

    if (endpoint === '/auth/login') {
      const user = this.users.find(
        (u) => u.username === body.identifier || u.email === body.identifier || u.phoneNumber === body.identifier
      ) || this.users[0];
      this.setCurrentUser(user.id);
      return { token: `mock_jwt_${user.id}`, user };
    }

    if (endpoint === '/auth/register') {
      const newUser: User = {
        id: 'usr_' + Date.now(),
        username: body.username || 'user_' + Date.now(),
        displayName: body.displayName || body.username || 'AUM Sovereign User',
        phoneNumber: body.phoneNumber,
        email: body.email,
        storageMode: body.storageMode || 'local_device',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        bio: 'Sovereign citizen of AUM 🇮🇳',
        createdAt: new Date().toISOString(),
      };
      this.users.push(newUser);
      this.setCurrentUser(newUser.id);
      this.save();
      return { token: `mock_jwt_${newUser.id}`, user: newUser };
    }

    if (endpoint === '/auth/send-otp') {
      return { success: true, message: 'OTP sent successfully (Demo: 123456)', demoCode: '123456' };
    }

    if (endpoint === '/users/search') {
      return { users: this.users.filter((u) => u.id !== this.currentUserId) };
    }

    if (endpoint === '/users/storage-mode' && method === 'PATCH') {
      const user = this.getCurrentUser();
      user.storageMode = body.storageMode;
      this.save();
      return { user };
    }

    if (endpoint === '/users/settings/me') {
      return {
        settings: {
          userId: this.currentUserId,
          theme: 'dark',
          allowLastSeen: true,
          allowReadReceipts: true,
          autoDownloadMedia: true,
          videoQuality: 'high',
          specialAlertContacts: ['usr_priya'],
        },
      };
    }

    // 2. Contacts & Friend Requests
    if (endpoint === '/contacts') {
      const acceptedIds = this.contacts
        .filter((c) => c.userId === this.currentUserId)
        .map((c) => c.contactUserId);
      const contacts = this.users.filter((u) => acceptedIds.includes(u.id));
      return { contacts };
    }

    if (endpoint === '/contacts/requests') {
      const incoming = this.friendRequests.filter((fr) => fr.recipientId === this.currentUserId && fr.status === 'pending');
      const outgoing = this.friendRequests.filter((fr) => fr.senderId === this.currentUserId && fr.status === 'pending');
      return { incoming, outgoing };
    }

    if (endpoint === '/contacts/request' && method === 'POST') {
      const fr = {
        id: 'fr_' + Date.now(),
        senderId: this.currentUserId,
        recipientId: body.recipientId,
        status: 'pending',
        createdAt: new Date().toISOString(),
        sender: this.getCurrentUser(),
      };
      this.friendRequests.push(fr);
      this.save();
      return { request: fr, friendRequest: fr };
    }

    if (endpoint.startsWith('/contacts/request/') && endpoint.endsWith('/accept')) {
      const frId = endpoint.split('/')[3];
      const fr = this.friendRequests.find((r) => r.id === frId);
      if (fr) {
        fr.status = 'accepted';
        this.contacts.push(
          { id: 'c_' + Date.now(), userId: fr.senderId, contactUserId: fr.recipientId, relationshipStatus: 'accepted', createdAt: new Date().toISOString() },
          { id: 'c_' + (Date.now() + 1), userId: fr.recipientId, contactUserId: fr.senderId, relationshipStatus: 'accepted', createdAt: new Date().toISOString() }
        );
        this.save();
      }
      return { success: true };
    }

    if (endpoint.startsWith('/contacts/request/') && endpoint.endsWith('/reject')) {
      const frId = endpoint.split('/')[3];
      const fr = this.friendRequests.find((r) => r.id === frId);
      if (fr) {
        fr.status = 'rejected';
        this.save();
      }
      return { success: true };
    }

    // 3. Conversations & Messages
    if (endpoint === '/conversations' || endpoint === '/messages/conversations') {
      const userConvs = this.conversations.filter((c) => c.memberIds.includes(this.currentUserId));
      const enriched = userConvs.map((c) => {
        let otherUser = null;
        if (c.type === 'direct') {
          const otherId = c.memberIds.find((id) => id !== this.currentUserId) || c.memberIds[0];
          otherUser = this.users.find((u) => u.id === otherId) || null;
        }

        const convMessages = this.messages
          .filter((m) => m.conversationId === c.id)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        const lastMessage = convMessages.length > 0 ? convMessages[convMessages.length - 1] : undefined;
        const unreadCount = convMessages.filter((m) => m.senderId !== this.currentUserId && m.deliveryState !== 'read').length;

        return {
          ...c,
          title: c.name || otherUser?.displayName || 'Chat',
          otherUser,
          lastMessage,
          unreadCount,
        };
      });

      return { conversations: enriched };
    }

    if ((endpoint === '/conversations/direct' || endpoint === '/messages/conversations/direct') && method === 'POST') {
      const contactId = body.contactUserId;
      let conv = this.conversations.find(
        (c) => c.type === 'direct' && c.memberIds.includes(this.currentUserId) && c.memberIds.includes(contactId)
      );

      if (!conv) {
        const other = this.users.find((u) => u.id === contactId);
        conv = {
          id: `conv_${this.currentUserId}_${contactId}`,
          type: 'direct',
          title: other?.displayName || 'Chat',
          name: other?.displayName || 'Chat',
          createdBy: this.currentUserId,
          memberIds: [this.currentUserId, contactId],
          adminIds: [this.currentUserId],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.conversations.unshift(conv);
        this.save();
      }
      return { conversation: conv };
    }

    if (endpoint.includes('/conversations/') && endpoint.endsWith('/messages') && method === 'GET') {
      const parts = endpoint.split('/');
      const convId = parts[parts.indexOf('conversations') + 1];
      const convMsgs = this.messages
        .filter((m) => m.conversationId === convId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // Mark unread as read
      convMsgs.forEach((m) => {
        if (m.senderId !== this.currentUserId && m.deliveryState !== 'read') {
          m.deliveryState = 'read';
          m.readAt = new Date().toISOString();
        }
      });
      this.save();

      return { messages: convMsgs };
    }

    if (endpoint.includes('/conversations/') && endpoint.endsWith('/messages') && method === 'POST') {
      const parts = endpoint.split('/');
      const convId = parts[parts.indexOf('conversations') + 1];
      const newMsg: Message = {
        id: 'msg_' + Date.now(),
        conversationId: convId,
        senderId: this.currentUserId,
        recipientId: body.recipientId,
        contentType: body.contentType || 'text',
        text: body.text,
        mediaUrl: body.mediaUrl,
        mediaName: body.mediaName,
        mediaSize: body.mediaSize,
        mediaDuration: body.mediaDuration,
        deliveryState: 'delivered',
        reactions: {},
        createdAt: new Date().toISOString(),
      };
      this.messages.push(newMsg);

      const conv = this.conversations.find((c) => c.id === convId);
      if (conv) {
        conv.updatedAt = new Date().toISOString();
      }

      this.save();
      return { message: newMsg };
    }

    if (endpoint === '/messages/pending-transfers' || endpoint === '/messages/pending') {
      const pending = this.pendingTransfers.filter((pt) => pt.senderId === this.currentUserId);
      return { transfers: pending, pendingTransfers: pending };
    }

    if (endpoint.includes('/pending-transfers/') && endpoint.endsWith('/retry')) {
      const parts = endpoint.split('/');
      const ptId = parts[parts.indexOf('pending-transfers') + 1];
      const pt = this.pendingTransfers.find((t) => t.id === ptId);
      if (pt) {
        pt.lastAttemptAt = new Date().toISOString();
        pt.status = 'completed';
        const msg = this.messages.find((m) => m.id === pt.messageId);
        if (msg) msg.deliveryState = 'delivered';
        this.save();
      }
      return { success: true, transfer: pt };
    }

    if (endpoint.includes('/pending-transfers/') && method === 'DELETE') {
      const parts = endpoint.split('/');
      const ptId = parts[parts.indexOf('pending-transfers') + 1];
      this.pendingTransfers = this.pendingTransfers.filter((t) => t.id !== ptId);
      this.save();
      return { success: true };
    }

    if (endpoint.includes('/like') && endpoint.startsWith('/feed/')) {
      const id = endpoint.split('/')[2];
      const feed = this.dailyFeedItems.find((f) => f.id === id);
      if (feed) {
        if (feed.likes.includes(this.currentUserId)) {
          feed.likes = feed.likes.filter((uid) => uid !== this.currentUserId);
        } else {
          feed.likes.push(this.currentUserId);
        }
        this.save();
        return { likes: feed.likes, isLiked: feed.likes.includes(this.currentUserId) };
      }
      return { likes: [] };
    }

    if (endpoint.includes('/react') && endpoint.startsWith('/feed/')) {
      const id = endpoint.split('/')[2];
      const feed = this.dailyFeedItems.find((f) => f.id === id);
      if (feed && body.emoji) {
        feed.reactions[this.currentUserId] = body.emoji;
        this.save();
        return { reactions: feed.reactions };
      }
      return { reactions: {} };
    }

    // 4. Calls
    if (endpoint === '/calls/history') {
      const userCalls = this.callHistory.filter((c) => c.userId === this.currentUserId);
      return { history: userCalls, callHistory: userCalls };
    }

    if ((endpoint === '/calls/start' || endpoint === '/calls/initiate') && method === 'POST') {
      const otherUser = this.users.find((u) => u.id === body.recipientId);
      const newRec: CallHistoryRecord = {
        id: 'ch_' + Date.now(),
        callId: 'call_' + Date.now(),
        userId: this.currentUserId,
        peerId: body.recipientId,
        peerName: otherUser?.displayName || 'Contact',
        peerAvatar: otherUser?.avatar,
        type: body.type || 'video',
        direction: 'outgoing',
        status: 'ended',
        startedAt: new Date().toISOString(),
        durationSeconds: 45,
      };
      this.callHistory.unshift(newRec);
      this.save();
      return {
        call: newRec,
        session: {
          id: newRec.callId,
          type: body.type,
          initiatorId: this.currentUserId,
          recipientId: body.recipientId,
          status: 'ringing',
        },
      };
    }

    // 5. Daily Feed & Status (Stories)
    if (endpoint === '/feed/today' || endpoint === '/feed') {
      return { feedItems: this.dailyFeedItems };
    }

    if (endpoint === '/feed' && method === 'POST') {
      const user = this.getCurrentUser();
      const newFeed: DailyFeedItem = {
        id: 'feed_' + Date.now(),
        senderId: this.currentUserId,
        senderName: user.displayName,
        senderAvatar: user.avatar,
        recipientId: 'all',
        mediaUrl: body.mediaUrl,
        mediaType: body.mediaType || 'image',
        caption: body.caption,
        likes: [],
        reactions: {},
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };
      this.dailyFeedItems.unshift(newFeed);
      this.save();
      return { feedItem: newFeed };
    }

    if (endpoint === '/status') {
      // Group status updates by user
      const map: Record<string, StatusUpdate[]> = {};
      this.statusUpdates.forEach((su) => {
        if (!map[su.userId]) map[su.userId] = [];
        map[su.userId].push(su);
      });

      const statusGroups: StatusGroup[] = Object.keys(map).map((uid) => {
        const u = this.users.find((usr) => usr.id === uid);
        return {
          user: {
            id: uid,
            displayName: u?.displayName || 'Contact',
            avatar: u?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
            isSelf: uid === this.currentUserId,
          },
          stories: map[uid],
        };
      });

      return { statusGroups };
    }

    if (endpoint === '/status' && method === 'POST') {
      const user = this.getCurrentUser();
      const newSu: StatusUpdate = {
        id: 'stat_' + Date.now(),
        userId: this.currentUserId,
        userName: user.displayName,
        userAvatar: user.avatar,
        mediaType: body.mediaType || 'text',
        textContent: body.textContent,
        mediaUrl: body.mediaUrl,
        backgroundGradient: body.backgroundGradient,
        viewers: [],
        privacy: 'all_contacts',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };
      this.statusUpdates.unshift(newSu);
      this.save();
      return { status: newSu };
    }

    if (endpoint.startsWith('/status/') && endpoint.endsWith('/view')) {
      const id = endpoint.split('/')[2];
      const su = this.statusUpdates.find((s) => s.id === id);
      if (su && !su.viewers.includes(this.currentUserId)) {
        su.viewers.push(this.currentUserId);
        this.save();
      }
      return { viewersCount: su?.viewers.length || 0 };
    }

    // 6. Advertisements (Ads Space)
    if (endpoint === '/ads') {
      return { advertisements: this.advertisements };
    }

    if (endpoint === '/ads' && method === 'POST') {
      const user = this.getCurrentUser();
      const newAd: Advertisement = {
        id: 'ad_' + Date.now(),
        userId: this.currentUserId,
        userName: user.displayName,
        userAvatar: user.avatar,
        userPhone: user.phoneNumber,
        mediaType: body.mediaType || 'image',
        mediaUrl: body.mediaUrl,
        headline: body.headline,
        caption: body.caption || '',
        price: body.price,
        ctaText: body.ctaText || 'Inquire on Chat',
        ctaLink: body.ctaLink || this.currentUserId,
        likes: [],
        sharesCount: 0,
        tags: body.tags || [],
        createdAt: new Date().toISOString(),
      };
      this.advertisements.unshift(newAd);
      this.save();
      return { advertisement: newAd };
    }

    if (endpoint.startsWith('/ads/') && endpoint.endsWith('/like')) {
      const id = endpoint.split('/')[2];
      const ad = this.advertisements.find((a) => a.id === id);
      if (ad) {
        if (!ad.likes) ad.likes = [];
        const index = ad.likes.indexOf(this.currentUserId);
        if (index > -1) {
          ad.likes.splice(index, 1);
        } else {
          ad.likes.push(this.currentUserId);
        }
        this.save();
        return { likes: ad.likes, likesCount: ad.likes.length, isLiked: ad.likes.includes(this.currentUserId) };
      }
      return { likes: [], likesCount: 0, isLiked: false };
    }

    if (endpoint.startsWith('/ads/') && endpoint.endsWith('/share')) {
      const id = endpoint.split('/')[2];
      const ad = this.advertisements.find((a) => a.id === id);
      if (ad) {
        ad.sharesCount = (ad.sharesCount || 0) + 1;
        this.save();
        return { sharesCount: ad.sharesCount };
      }
      return { sharesCount: 0 };
    }

    if (endpoint.startsWith('/ads/') && method === 'DELETE') {
      const id = endpoint.split('/')[2];
      this.advertisements = this.advertisements.filter((a) => a.id !== id);
      this.save();
      return { success: true };
    }

    // 7. Storage & Backups
    if (endpoint === '/storage/summary') {
      return {
        storageMode: this.getCurrentUser().storageMode,
        localUsageBytes: 1024 * 1024 * 14.8,
        cloudUsageBytes: 1024 * 1024 * 4.2,
        cloudLimitBytes: 1024 * 1024 * 1024 * 5,
        totalConversations: this.conversations.length,
        totalMessages: this.messages.length,
        totalMediaCount: 8,
        pendingTransfersCount: this.pendingTransfers.length,
      };
    }

    if (endpoint === '/storage/backups') {
      return { backups: this.backups };
    }

    if (endpoint === '/storage/backup' && method === 'POST') {
      const newBackup: UserBackup = {
        id: 'bkp_' + Date.now(),
        userId: this.currentUserId,
        version: this.backups.length + 1,
        snapshotCiphertext: body.snapshotCiphertext || 'enc_snapshot_blob_data',
        sizeBytes: 1024 * 1024 * 5.1,
        deviceInfo: 'Sovereign Web Client (Make in India)',
        createdAt: new Date().toISOString(),
      };
      this.backups.unshift(newBackup);
      this.save();
      return { backup: newBackup, message: 'Encrypted backup created successfully' };
    }

    if (endpoint === '/storage/clear-cache') {
      return { success: true, message: 'Local Sovereign Cache Cleared' };
    }

    // Fallback default
    return { success: true };
  }
}

export const mockStorage = new MockStorageService();
