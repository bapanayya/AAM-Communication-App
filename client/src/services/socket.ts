type EventCallback = (data: any) => void;

class SocketService {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectTimer: any = null;
  private isExplicitDisconnect = false;

  public connect(token: string) {
    this.token = token;
    this.isExplicitDisconnect = false;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(`ws://localhost:5000/ws?token=${encodeURIComponent(token)}`);

      this.ws.onopen = () => {
        console.log('⚡ AUM Real-time WebSocket connected');
        this.emitLocal('connection_status', { isConnected: true });
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
          // Reconnect with exponential backoff
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => {
            if (this.token && !this.isExplicitDisconnect) {
              this.connect(this.token);
            }
          }, 3000);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('WS error:', err);
      };
    } catch (err) {
      console.error('Failed to initialize WebSocket:', err);
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
