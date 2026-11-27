// AAM Sovereign Media Cache & Auto-Download Service
// Automatically downloads all chat photos, videos, and audio notes to device storage (Cache API / IndexedDB)
// without requiring any manual "Download" button clicks.

class MediaCacheService {
  private cacheName = 'aam-device-media-vault-v1';
  private cachedUrls: Set<string> = new Set();
  private blobUrls: Map<string, string> = new Map();
  private downloadingUrls: Set<string> = new Set();

  constructor() {
    this.init();
  }

  private async init() {
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cache = await caches.open(this.cacheName);
        const keys = await cache.keys();
        keys.forEach((req) => this.cachedUrls.add(req.url));
      } catch (e) {
        console.warn('Device Cache API initialized in fallback mode:', e);
      }
    }
  }

  public isCached(url: string): boolean {
    return this.cachedUrls.has(url) || this.blobUrls.has(url);
  }

  public getLocalUrl(url: string): string {
    return this.blobUrls.get(url) || url;
  }

  // Auto-download media directly to local device storage without user click
  public async autoDownload(url: string): Promise<string> {
    if (!url || typeof window === 'undefined') return url;

    // In-memory blob already created
    if (this.blobUrls.has(url)) {
      return this.blobUrls.get(url)!;
    }

    if (this.downloadingUrls.has(url)) {
      return url;
    }

    this.downloadingUrls.add(url);

    try {
      if ('caches' in window) {
        const cache = await caches.open(this.cacheName);
        const match = await cache.match(url);
        if (match) {
          const blob = await match.blob();
          const blobUrl = URL.createObjectURL(blob);
          this.blobUrls.set(url, blobUrl);
          this.cachedUrls.add(url);
          this.downloadingUrls.delete(url);
          return blobUrl;
        }

        // Fetch and persist locally to device storage automatically
        const res = await fetch(url, { mode: 'cors' });
        if (res.ok) {
          const clone = res.clone();
          await cache.put(url, clone);
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          this.blobUrls.set(url, blobUrl);
          this.cachedUrls.add(url);
          this.downloadingUrls.delete(url);
          console.log(`💾 [AAM Auto-Download] Chat media stored to local device: ${url.substring(0, 50)}`);
          return blobUrl;
        }
      }
    } catch (err) {
      console.warn('Auto-download background fetch notice:', err);
    } finally {
      this.downloadingUrls.delete(url);
    }

    return url;
  }

  // Pre-fetch all media in conversations so they are already on-disk when opening a chat
  public prefetchList(urls: string[]) {
    urls.forEach((url) => {
      if (url && !this.isCached(url) && !this.downloadingUrls.has(url)) {
        this.autoDownload(url);
      }
    });
  }

  // Optional manual save/export to device Downloads/Gallery folder
  public async exportToDevice(url: string, fileName = 'AAM_Media'): Promise<void> {
    try {
      const targetUrl = this.getLocalUrl(url);
      const res = await fetch(targetUrl);
      const blob = await res.blob();
      const tempUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = tempUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(tempUrl);
    } catch (err) {
      console.error('Failed to export media:', err);
    }
  }
}

export const mediaCache = new MediaCacheService();
