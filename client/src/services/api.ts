import { mockStorage } from './mockStorage';

const API_BASE = 'http://localhost:5000/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('aum_auth_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('aum_auth_token', token);
    } else {
      localStorage.removeItem('aum_auth_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    // On GitHub Pages, mobile browsers, or standalone PWA/Android, directly use the sovereign local client engine
    if (!isLocalhost) {
      return mockStorage.handleMockRequest(endpoint, options) as T;
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'API request failed');
      }
      return data;
    } catch (err) {
      console.warn(`Remote backend unavailable at ${API_BASE}. Falling back to sovereign local store for ${endpoint}`);
      return mockStorage.handleMockRequest(endpoint, options) as T;
    }
  }

  // Auth
  public async register(body: any) {
    return this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public async login(identifier: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  }

  public async demoLogin(userId: string) {
    return this.request<{ token: string; user: any }>('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  public async sendOtp(recipient: string) {
    return this.request<{ success: boolean; message: string; demoCode: string }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ recipient }),
    });
  }

  public async verifyOtp(recipient: string, otpCode: string) {
    return this.request<{ success: boolean; verified: boolean }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ recipient, otpCode }),
    });
  }

  public async getMe() {
    return this.request<{ user: any }>('/auth/me');
  }

  public async switchStorageMode(storageMode: string) {
    return this.request<{ success: boolean; user: any; message: string }>('/auth/switch-storage-mode', {
      method: 'POST',
      body: JSON.stringify({ storageMode }),
    });
  }

  // Users & Settings
  public async searchUsers(q: string) {
    return this.request<{ users: any[] }>(`/users/search?q=${encodeURIComponent(q)}`);
  }

  public async getUser(id: string) {
    return this.request<{ user: any }>(`/users/${id}`);
  }

  public async updateProfile(body: any) {
    return this.request<{ user: any }>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  public async getSettings() {
    return this.request<{ settings: any }>('/users/settings/me');
  }

  public async updateSettings(settings: any) {
    return this.request<{ settings: any }>('/users/settings/me', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  }

  public async blockUser(id: string) {
    return this.request<{ success: boolean }>(`/users/${id}/block`, { method: 'POST' });
  }

  public async unblockUser(id: string) {
    return this.request<{ success: boolean }>(`/users/${id}/block`, { method: 'DELETE' });
  }

  public async getBlocks() {
    return this.request<{ blockedUsers: any[] }>('/users/blocks/list');
  }

  // Contacts & Friend Requests
  public async getContacts() {
    return this.request<{ contacts: any[] }>('/contacts');
  }

  public async sendFriendRequest(recipientId: string) {
    return this.request<{ request: any }>('/contacts/requests', {
      method: 'POST',
      body: JSON.stringify({ recipientId }),
    });
  }

  public async getFriendRequests() {
    return this.request<{ incoming: any[]; outgoing: any[] }>('/contacts/requests');
  }

  public async acceptFriendRequest(id: string) {
    return this.request<{ success: boolean; conversationId?: string }>(`/contacts/requests/${id}/accept`, {
      method: 'POST',
    });
  }

  public async rejectFriendRequest(id: string) {
    return this.request<{ success: boolean }>(`/contacts/requests/${id}/reject`, { method: 'POST' });
  }

  public async cancelFriendRequest(id: string) {
    return this.request<{ success: boolean }>(`/contacts/requests/${id}/cancel`, { method: 'POST' });
  }

  // Messages & Conversations
  public async getConversations() {
    return this.request<{ conversations: any[] }>('/messages/conversations');
  }

  public async getOrCreateDirectConversation(contactUserId: string) {
    return this.request<{ conversation: any }>('/messages/conversations/direct', {
      method: 'POST',
      body: JSON.stringify({ contactUserId }),
    });
  }

  public async getMessages(conversationId: string) {
    return this.request<{ messages: any[] }>(`/messages/conversations/${conversationId}/messages`);
  }

  public async sendMessage(conversationId: string, body: any) {
    return this.request<{ message: any }>(`/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public async reactToMessage(messageId: string, emoji: string | null) {
    return this.request<{ message: any }>(`/messages/${messageId}/reaction`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  }

  public async starMessage(messageId: string) {
    return this.request<{ isStarred: boolean }>(`/messages/${messageId}/star`, { method: 'POST' });
  }

  public async deleteMessage(messageId: string, deleteForEveryone = false) {
    return this.request<{ success: boolean }>(`/messages/${messageId}`, {
      method: 'DELETE',
      body: JSON.stringify({ deleteForEveryone }),
    });
  }

  public async ackMessage(messageId: string, state: 'delivered' | 'read') {
    return this.request<{ message: any }>(`/messages/${messageId}/ack`, {
      method: 'POST',
      body: JSON.stringify({ state }),
    });
  }

  // "My Pending Transfers"
  public async getPendingTransfers() {
    return this.request<{ transfers: any[] }>('/messages/pending-transfers');
  }

  public async retryPendingTransfer(id: string) {
    return this.request<{ transfer: any; message: string }>(`/messages/pending-transfers/${id}/retry`, {
      method: 'POST',
    });
  }

  public async cancelPendingTransfer(id: string) {
    return this.request<{ success: boolean }>(`/messages/pending-transfers/${id}`, { method: 'DELETE' });
  }

  // Calling
  public async startCall(body: any) {
    return this.request<{ call: any }>('/calls/start', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public async acceptCall(callId: string) {
    return this.request<{ call: any }>(`/calls/${callId}/accept`, { method: 'POST' });
  }

  public async rejectCall(callId: string) {
    return this.request<{ call: any }>(`/calls/${callId}/reject`, { method: 'POST' });
  }

  public async cancelCall(callId: string) {
    return this.request<{ call: any }>(`/calls/${callId}/cancel`, { method: 'POST' });
  }

  public async endCall(callId: string, durationSeconds: number) {
    return this.request<{ call: any }>(`/calls/${callId}/end`, {
      method: 'POST',
      body: JSON.stringify({ durationSeconds }),
    });
  }

  public async getCallHistory() {
    return this.request<{ history: any[] }>('/calls/history');
  }

  public async clearCallHistory() {
    return this.request<{ success: boolean }>('/calls/history', { method: 'DELETE' });
  }

  public async getActiveCall() {
    return this.request<{ activeCall: any | null }>('/calls/active');
  }

  // Groups & Broadcast
  public async createGroup(body: any) {
    return this.request<{ group: any }>('/groups', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public async updateGroup(id: string, body: any) {
    return this.request<{ group: any }>(`/groups/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  public async addGroupMember(groupId: string, memberId: string) {
    return this.request<{ group: any }>(`/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ memberId }),
    });
  }

  public async removeGroupMember(groupId: string, memberId: string) {
    return this.request<{ group: any }>(`/groups/${groupId}/members/${memberId}`, { method: 'DELETE' });
  }

  public async sendBroadcast(recipientIds: string[], text?: string, mediaUrl?: string) {
    return this.request<{ success: boolean; count: number }>('/groups/broadcast', {
      method: 'POST',
      body: JSON.stringify({ recipientIds, text, mediaUrl }),
    });
  }

  // Feed (Daily Reels/Moments)
  public async getDailyFeed() {
    return this.request<{ feedItems: any[] }>('/feed/today');
  }

  public async likeFeedItem(id: string) {
    return this.request<{ likes: string[]; isLiked: boolean }>(`/feed/${id}/like`, { method: 'POST' });
  }

  public async reactFeedItem(id: string, emoji: string) {
    return this.request<{ reactions: Record<string, string> }>(`/feed/${id}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  }

  public async createFeedMoment(mediaUrl: string, mediaType: 'image' | 'video', caption?: string) {
    return this.request<{ feedItem: any }>('/feed', {
      method: 'POST',
      body: JSON.stringify({ mediaUrl, mediaType, caption }),
    });
  }

  // Status (Stories)
  public async getStatusUpdates() {
    return this.request<{ statusGroups: any[] }>('/status');
  }

  public async createStatus(body: any) {
    return this.request<{ status: any }>('/status', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public async viewStatus(id: string) {
    return this.request<{ viewersCount: number }>(`/status/${id}/view`, { method: 'POST' });
  }

  public async deleteStatus(id: string) {
    return this.request<{ success: boolean }>(`/status/${id}`, { method: 'DELETE' });
  }

  // Storage & Backup
  public async getStorageSummary() {
    return this.request<any>('/storage/summary');
  }

  public async createBackup(snapshotCiphertext: string, sizeBytes?: number, deviceInfo?: string) {
    return this.request<{ backup: any; message: string }>('/storage/backup', {
      method: 'POST',
      body: JSON.stringify({ snapshotCiphertext, sizeBytes, deviceInfo }),
    });
  }

  public async getBackups() {
    return this.request<{ backups: any[] }>('/storage/backups');
  }

  public async restoreBackup(id: string) {
    return this.request<any>(`/storage/backups/${id}/restore`, { method: 'POST' });
  }

  public async clearCache() {
    return this.request<{ success: boolean; message: string }>('/storage/clear-cache', { method: 'POST' });
  }

  // Advertisements (Ads Space)
  public async getAdvertisements() {
    return this.request<{ advertisements: any[] }>('/ads');
  }

  public async createAdvertisement(body: {
    headline: string;
    caption?: string;
    mediaType: 'video' | 'image';
    mediaUrl: string;
    ctaText?: string;
    ctaLink?: string;
    price?: string;
    tags?: string[];
  }) {
    return this.request<{ advertisement: any }>('/ads', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public async likeAdvertisement(id: string) {
    return this.request<{ likes: string[]; likesCount: number; isLiked: boolean }>(`/ads/${id}/like`, {
      method: 'POST',
    });
  }

  public async shareAdvertisement(id: string) {
    return this.request<{ sharesCount: number }>(`/ads/${id}/share`, {
      method: 'POST',
    });
  }

  public async deleteAdvertisement(id: string) {
    return this.request<{ success: boolean }>(`/ads/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();
