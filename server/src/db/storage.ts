import fs from 'fs';
import path from 'path';
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
  MediaRecord,
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
  mediaRecords?: MediaRecord[];
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
    mediaRecords: [],
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
        // If legacy sample data is present (e.g. usr_aarav), reset to pristine empty state for real team testing
        if (this.data.users && this.data.users.some((u) => u.id === 'usr_aarav')) {
          this.seedDefaultData();
          this.save();
        }
        return;
      } catch (err) {
        console.error('Failed to parse existing database file, initializing clean database', err);
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
    // Pristine empty database for real multi-user testing
    this.data = {
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
      mediaRecords: [],
    };
  }

  public getDefaultAdvertisements(): Advertisement[] {
    return [];
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
  public getMediaRecords(): MediaRecord[] {
    if (!this.data.mediaRecords) {
      this.data.mediaRecords = [];
    }
    return this.data.mediaRecords;
  }
}

export const db = new Database();
