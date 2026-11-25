import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  UserCredentials,
  UserSettings,
  FriendRequest,
  Contact,
  BlockedUser,
  Conversation,
  Message,
  PendingTransfer,
  CallSession,
  CallHistoryRecord,
  DailyFeedItem,
  StatusUpdate,
  UserBackup,
  Advertisement,
} from '../types';

interface DatabaseSchema {
  users: User[];
  credentials: UserCredentials[];
  settings: UserSettings[];
  contacts: Contact[];
  friendRequests: FriendRequest[];
  blockedUsers: BlockedUser[];
  conversations: Conversation[];
  messages: Message[];
  pendingTransfers: PendingTransfer[];
  callSessions: CallSession[];
  callHistory: CallHistoryRecord[];
  dailyFeedItems: DailyFeedItem[];
  statusUpdates: StatusUpdate[];
  backups: UserBackup[];
  advertisements: Advertisement[];
}

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'aum_database.json');

export class Database {
  private data: DatabaseSchema = {
    users: [],
    credentials: [],
    settings: [],
    contacts: [],
    friendRequests: [],
    blockedUsers: [],
    conversations: [],
    messages: [],
    pendingTransfers: [],
    callSessions: [],
    callHistory: [],
    dailyFeedItems: [],
    statusUpdates: [],
    backups: [],
    advertisements: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.advertisements || this.data.advertisements.length === 0) {
          this.data.advertisements = this.getDefaultAdvertisements();
          this.save();
        }
        return;
      } catch (err) {
        console.error('Failed to parse existing database file, initializing seeds', err);
      }
    }

    this.seedDefaultData();
    this.save();
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  private seedDefaultData() {
    const salt = bcrypt.genSaltSync(10);
    const defaultPasswordHash = bcrypt.hashSync('Password@123', salt);

    const now = new Date();
    const todayIso = now.toISOString();
    const expiresTomorrowIso = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const users: User[] = [
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
        updatedAt: todayIso,
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
        updatedAt: todayIso,
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
        updatedAt: todayIso,
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
        updatedAt: todayIso,
      },
    ];

    const credentials: UserCredentials[] = users.map((u) => ({
      userId: u.id,
      passwordHash: defaultPasswordHash,
      salt,
    }));

    const settings: UserSettings[] = users.map((u) => ({
      userId: u.id,
      allowLastSeen: true,
      allowReadReceipts: true,
      specialAlertContacts: u.id === 'usr_aarav' ? ['usr_priya'] : [],
      theme: 'dark',
      autoDownloadMedia: true,
      videoQuality: 'high',
    }));

    // Contacts graph: Aarav is friends with Priya and Vikram
    const contacts: Contact[] = [
      { id: 'c_1', userId: 'usr_aarav', contactUserId: 'usr_priya', relationshipStatus: 'accepted', createdAt: todayIso },
      { id: 'c_2', userId: 'usr_priya', contactUserId: 'usr_aarav', relationshipStatus: 'accepted', createdAt: todayIso },
      { id: 'c_3', userId: 'usr_aarav', contactUserId: 'usr_vikram', relationshipStatus: 'accepted', createdAt: todayIso },
      { id: 'c_4', userId: 'usr_vikram', contactUserId: 'usr_aarav', relationshipStatus: 'accepted', createdAt: todayIso },
    ];

    // Pending friend request from Ananya to Aarav
    const friendRequests: FriendRequest[] = [
      {
        id: 'fr_1',
        senderId: 'usr_ananya',
        recipientId: 'usr_aarav',
        status: 'pending',
        createdAt: todayIso,
        updatedAt: todayIso,
      },
    ];

    const blockedUsers: BlockedUser[] = [];

    // Conversations
    const conversations: Conversation[] = [
      {
        id: 'conv_aarav_priya',
        type: 'direct',
        createdBy: 'usr_aarav',
        memberIds: ['usr_aarav', 'usr_priya'],
        adminIds: ['usr_aarav'],
        createdAt: todayIso,
        updatedAt: todayIso,
      },
      {
        id: 'conv_aarav_vikram',
        type: 'direct',
        createdBy: 'usr_aarav',
        memberIds: ['usr_aarav', 'usr_vikram'],
        adminIds: ['usr_aarav'],
        createdAt: todayIso,
        updatedAt: todayIso,
      },
      {
        id: 'conv_group_aum_builders',
        type: 'group',
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

    // Sample Messages
    const messages: Message[] = [
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
        contentType: 'video',
        text: 'Raw 4K telemetry capture from the Himalayan stargazing drone.',
        mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        mediaName: 'Himalayan_Observation.mp4',
        mediaSize: 1024 * 1024 * 12,
        mediaDuration: 15,
        deliveryState: 'pending', // Pending transfer demonstration!
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

    // Pending transfer for msg_4 (Aarav sent to Vikram who was offline in Mode 1)
    const pendingTransfers: PendingTransfer[] = [
      {
        id: 'pt_1',
        messageId: 'msg_4',
        senderId: 'usr_aarav',
        recipientId: 'usr_vikram',
        contentType: 'video',
        mediaName: 'Himalayan_Observation.mp4',
        fileSize: 1024 * 1024 * 12,
        previewUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80',
        status: 'queued',
        createdAt: new Date(now.getTime() - 900000).toISOString(),
        lastAttemptAt: new Date(now.getTime() - 300000).toISOString(),
      },
    ];

    // Call sessions & Call history
    const callSessions: CallSession[] = [
      {
        id: 'call_101',
        type: 'video',
        isGroup: false,
        initiatorId: 'usr_priya',
        recipientId: 'usr_aarav',
        participantIds: ['usr_priya', 'usr_aarav'],
        activeParticipantIds: [],
        status: 'ended',
        startedAt: new Date(now.getTime() - 7200000).toISOString(),
        connectedAt: new Date(now.getTime() - 7190000).toISOString(),
        endedAt: new Date(now.getTime() - 6900000).toISOString(),
        durationSeconds: 290,
      },
      {
        id: 'call_102',
        type: 'audio',
        isGroup: false,
        initiatorId: 'usr_vikram',
        recipientId: 'usr_aarav',
        participantIds: ['usr_vikram', 'usr_aarav'],
        activeParticipantIds: [],
        status: 'missed',
        startedAt: new Date(now.getTime() - 14400000).toISOString(),
        endedAt: new Date(now.getTime() - 14380000).toISOString(),
        durationSeconds: 0,
      },
      {
        id: 'call_103',
        type: 'video',
        isGroup: true,
        conversationId: 'conv_group_aum_builders',
        initiatorId: 'usr_aarav',
        participantIds: ['usr_aarav', 'usr_priya', 'usr_vikram'],
        activeParticipantIds: [],
        status: 'ended',
        startedAt: new Date(now.getTime() - 86400000).toISOString(),
        connectedAt: new Date(now.getTime() - 86390000).toISOString(),
        endedAt: new Date(now.getTime() - 85200000).toISOString(),
        durationSeconds: 1190,
      },
    ];

    const callHistory: CallHistoryRecord[] = [
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

    // Daily Feed Items (vertical reels/moments received today from accepted contacts)
    const dailyFeedItems: DailyFeedItem[] = [
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
      {
        id: 'feed_3',
        senderId: 'usr_priya',
        senderName: 'Priya Patel',
        senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
        recipientId: 'usr_aarav',
        mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        mediaType: 'video',
        caption: 'Motion graphics teaser for AUM v1.0 Launch Reel 🚀',
        likes: ['usr_aarav'],
        reactions: { usr_aarav: '👏' },
        createdAt: new Date(now.getTime() - 3600000).toISOString(),
        expiresAt: expiresTomorrowIso,
      },
    ];

    // Status Updates (24-Hour Stories)
    const statusUpdates: StatusUpdate[] = [
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
        createdAt: new Date(now.getTime() - 3600000).toISOString(),
        expiresAt: expiresTomorrowIso,
      },
    ];

    // Sample Backup (for Mode 2 demo)
    const backups: UserBackup[] = [
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

    const advertisements = this.getDefaultAdvertisements();

    this.data = {
      users,
      credentials,
      settings,
      contacts,
      friendRequests,
      blockedUsers,
      conversations,
      messages,
      pendingTransfers,
      callSessions,
      callHistory,
      dailyFeedItems,
      statusUpdates,
      backups,
      advertisements,
    };
  }

  public getDefaultAdvertisements(): Advertisement[] {
    const now = new Date();
    return [
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
  }

  // Getters & Setters
  public getUsers(): User[] { return this.data.users; }
  public getCredentials(): UserCredentials[] { return this.data.credentials; }
  public getSettings(): UserSettings[] { return this.data.settings; }
  public getContacts(): Contact[] { return this.data.contacts; }
  public getFriendRequests(): FriendRequest[] { return this.data.friendRequests; }
  public getBlockedUsers(): BlockedUser[] { return this.data.blockedUsers; }
  public getConversations(): Conversation[] { return this.data.conversations; }
  public getMessages(): Message[] { return this.data.messages; }
  public getPendingTransfers(): PendingTransfer[] { return this.data.pendingTransfers; }
  public getCallSessions(): CallSession[] { return this.data.callSessions; }
  public getCallHistory(): CallHistoryRecord[] { return this.data.callHistory; }
  public getDailyFeedItems(): DailyFeedItem[] { return this.data.dailyFeedItems; }
  public getStatusUpdates(): StatusUpdate[] { return this.data.statusUpdates; }
  public getBackups(): UserBackup[] { return this.data.backups; }
  public getAdvertisements(): Advertisement[] { 
    if (!this.data.advertisements) {
      this.data.advertisements = [];
    }
    return this.data.advertisements; 
  }
}

export const db = new Database();
