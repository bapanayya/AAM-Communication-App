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
  private pingTimer: any = null;
  private isExplicitDisconnect = false;
  private retryCount = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      // Reconnect immediately when mobile screen wakes up or app comes to foreground
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.token && !this.isConnected()) {
          console.log('App resumed: Reconnecting AAM WebSocket...');
          this.connect(this.token);
        }
      });

      window.addEventListener('online', () => {
        if (this.token && !this.isConnected()) {
          console.log('Network online: Reconnecting AAM WebSocket...');
          this.connect(this.token);
        }
      });
    }
  }

  public isConnected(): boolean {
    return Boolean(this.ws && this.ws.readyState === WebSocket.OPEN);
  }

  public connect(token: string) {
    this.token = token;
    this.isExplicitDisconnect = false;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = getSocketUrl(token);

    try {
      if (this.ws) {
        try {
          this.ws.close();
        } catch (_) {}
        this.ws = null;
      }

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log(`⚡ AAM Real-time WebSocket connected to ${wsUrl}`);
        this.retryCount = 0;
        this.emitLocal('connection_status', { isConnected: true });
        this.startHeartbeat();
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
        this.stopHeartbeat();
        this.emitLocal('connection_status', { isConnected: false });
        if (!this.isExplicitDisconnect) {
          clearTimeout(this.reconnectTimer);
          const delay = Math.min(1000 * Math.pow(1.5, this.retryCount), 10000);
          this.retryCount++;
          this.reconnectTimer = setTimeout(() => {
            if (this.token && !this.isExplicitDisconnect) {
              this.connect(this.token);
            }
          }, delay);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('WS error on', wsUrl, err);
      };
    } catch (err) {
      console.error('Failed to initialize WebSocket:', err);
      this.emitLocal('connection_status', { isConnected: false });
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send('ping', { timestamp: Date.now() });
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  public disconnect() {
    this.isExplicitDisconnect = true;
    this.stopHeartbeat();
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
