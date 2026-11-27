import { isCapacitorNative } from './api';

type EventCallback = (data: any) => void;

export function getSocketUrl(token: string): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('aam_custom_ws_url');
    if (custom) return `${custom}?token=${encodeURIComponent(token)}`;

    // Native mobile app must ALWAYS connect to Cloud WebSocket
    if (isCapacitorNative()) {
      return `wss://instantly-resolved-driven-happens.trycloudflare.com/ws?token=${encodeURIComponent(token)}`;
    }

    const hostname = window.location.hostname;
    if (window.location.protocol === 'http:' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      if (localStorage.getItem('aam_use_local_backend') === 'true') {
        return `ws://localhost:5000/ws?token=${encodeURIComponent(token)}`;
      }
    }
  }
  // Cloud Live WSS (with TLS) via Oracle Cloud VM tunnel
  return `wss://instantly-resolved-driven-happens.trycloudflare.com/ws?token=${encodeURIComponent(token)}`;
}

class SocketService {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectTimer: any = null;
  private isExplicitDisconnect = false;
  private fallbackAttempted = false;

  public connect(token: string) {
    this.token = token;
    this.isExplicitDisconnect = false;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = this.fallbackAttempted
      ? `ws://92.4.67.156:5000/ws?token=${encodeURIComponent(token)}`
      : getSocketUrl(token);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log(`⚡ AAM Real-time WebSocket connected to ${wsUrl}`);
        this.emitLocal('connection_status', { isConnected: true });
        this.fallbackAttempted = false;
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.event) {
            this.emitLocal(parsed.event, parsed.data);
          }
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      this.ws.onclose = () => {
        this.emitLocal('connection_status', { isConnected: false });
        if (!this.isExplicitDisconnect) {
          if (!this.fallbackAttempted) {
            this.fallbackAttempted = true;
          }
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => {
            if (this.token && !this.isExplicitDisconnect) {
              this.connect(this.token);
            }
          }, 3000);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('WS error on', wsUrl, err);
      };
    } catch (err) {
      console.error('Failed to initialize WebSocket:', err);
      // Fallback local simulated presence if network is completely down
      this.emitLocal('connected', {
        userId: 'usr_aarav',
        onlineUserIds: ['usr_aarav', 'usr_priya', 'usr_vikram'],
      });
      this.emitLocal('connection_status', { isConnected: true });
    }
  }

  public disconnect() {
    this.isExplicitDisconnect = true;
    clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public send(event: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data }));
    } else {
      console.warn('WebSocket not open, cannot send event:', event);
    }
  }

  public on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  public off(event: string, callback: EventCallback) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
    }
  }

  private emitLocal(event: string, data: any) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in WS listener for ${event}:`, err);
        }
      });
    }
  }
}

export const socket = new SocketService();
