export type StorageMode = 'local_device' | 'local_backup' | 'cloud_sync';

export interface User {
  id: string;
  username: string;
  displayName: string;
  phoneNumber?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  storageMode: StorageMode;
  publicKey?: string;
  deviceId?: string;
  createdAt: string;
}

export interface UserSettings {
  userId: string;
  allowLastSeen: boolean;
  allowReadReceipts: boolean;
  specialAlertContacts: string[];
  theme: 'dark' | 'light' | 'system';
  autoDownloadMedia: boolean;
  videoQuality: 'auto' | 'high' | 'data_saver';
}

export type ConversationType = 'direct' | 'group' | 'broadcast';

export interface Conversation {
  id: string;
  type: ConversationType;
  title: string;
  name?: string;
  avatar?: string;
  description?: string;
  createdBy: string;
  memberIds: string[];
  adminIds: string[];
  otherUser?: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    storageMode: StorageMode;
  } | null;
  lastMessage?: Message;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type MessageContentType = 'text' | 'image' | 'video' | 'audio' | 'mixed';
export type DeliveryState = 'pending' | 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId?: string;
  contentType: MessageContentType;
  text?: string;
  mediaUrl?: string;
  mediaName?: string;
  mediaSize?: number;
  mediaDuration?: number;
  encryptedPayload?: string;
  deliveryState: DeliveryState;
  reactions: Record<string, string>;
  isStarred?: boolean;
  isDeleted?: boolean;
  expiresAt?: string;
  createdAt: string;
  deliveredAt?: string;
  readAt?: string;
}

export interface PendingTransfer {
  id: string;
  messageId: string;
  senderId: string;
  recipientId: string;
  recipient?: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  } | null;
  contentType: MessageContentType;
  mediaName?: string;
  fileSize?: number;
  previewUrl?: string;
  status: 'queued' | 'transferring' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  lastAttemptAt?: string;
}

export type CallType = 'audio' | 'video';
export type CallStatus = 'ringing' | 'accepted' | 'rejected' | 'missed' | 'cancelled' | 'ended' | 'busy';

export interface CallSession {
  id: string;
  type: CallType;
  isGroup: boolean;
  conversationId?: string;
  initiatorId: string;
  recipientId?: string;
  participantIds: string[];
  activeParticipantIds: string[];
  status: CallStatus;
  startedAt: string;
  connectedAt?: string;
  endedAt?: string;
  durationSeconds: number;
}

export interface CallHistoryRecord {
  id: string;
  callId: string;
  userId: string;
  peerId: string;
  peerName: string;
  peerAvatar?: string;
  type: CallType;
  direction: 'incoming' | 'outgoing' | 'missed';
  status: CallStatus;
  startedAt: string;
  durationSeconds: number;
}

export interface DailyFeedItem {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  likes: string[];
  reactions: Record<string, string>;
  createdAt: string;
  expiresAt: string;
}

export interface StatusUpdate {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  mediaType: 'image' | 'video' | 'text';
  mediaUrl?: string;
  textContent?: string;
  backgroundGradient?: string;
  viewers: string[];
  privacy: 'all_contacts' | 'selected_contacts';
  createdAt: string;
  expiresAt: string;
}

export interface StatusGroup {
  user: {
    id: string;
    displayName: string;
    avatar?: string;
    isSelf: boolean;
  };
  stories: StatusUpdate[];
}

export interface FriendRequest {
  id: string;
  senderId: string;
  recipientId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  sender?: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    bio?: string;
  } | null;
  recipient?: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    bio?: string;
  } | null;
  createdAt: string;
}

export interface UserBackup {
  id: string;
  userId: string;
  version: number;
  snapshotCiphertext: string;
  sizeBytes: number;
  deviceInfo: string;
  createdAt: string;
}
