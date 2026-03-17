import { supabase, Content } from './supabaseClient';
import { DeviceService } from './deviceService';

export class ContentService {
  // Get content for current device
  static async getDeviceContent(): Promise<Content[]> {
    const deviceId = DeviceService.getDeviceId();
    console.log('Fetching content for device:', deviceId);

    try {
      let allContent: Content[] = [];
      const contentMap = new Map<string, Content>();

      // 1. Fetch from Local Offline Server
      try {
        const offlineContent = await this.getOfflineContent();
        if (offlineContent && offlineContent.length > 0) {
          console.log('📡 Fetched Offline Content:', offlineContent.length);
          offlineContent.forEach(item => contentMap.set(item.id, item));
        }
      } catch (offlineError) {
        // Local server unreachable, ignore
      }

      // 2. Fetch from Supabase (Online)
      try {
        const { data, error } = await supabase
          .from('device_content')
          .select(`
            *,
            content (*)
          `)
          .eq('device_id', deviceId)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (!error && data) {
          console.log('☁️ Fetched Supabase Content:', data.length);
          data.forEach(item => {
            if (item.content) {
              contentMap.set(item.content.id, item.content);
            }
          });
        }
      } catch (onlineError) {
        // Offline or Supabase error
      }

      // 3. Merge and Sort by Timestamp (Newest First)
      allContent = Array.from(contentMap.values());
      
      if (allContent.length > 0) {
        allContent.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA; // Newest first
        });
        
        console.log('✅ Synchronized Content Ready:', allContent.length, 'items');
        return allContent;
      }

      return [];

    } catch (error) {
      console.error('Error fetching content:', error);
      return [];
    }
  }

  // Fetch content from local Node.js server (Offline Mode)
  static async getOfflineContent(): Promise<Content[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout for local server

      const response = await fetch('http://10.87.134.21:3001/api/content', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Offline server returned ${response.status}`);
      }

      const content = await response.json();
      // Ensure content matches Content interface
      return Array.isArray(content) ? content : [];
    } catch (error) {
      // console.warn('Offline server unreachable:', error);
      throw error;
    }
  }

  // Subscribe to real-time content updates
  static subscribeToContentUpdates(callback: (content: Content[]) => void) {
    const deviceId = DeviceService.getDeviceId();

    console.log('🔔 Setting up real-time subscription for device:', deviceId);

    // Create a unique channel for postgres_changes (device_content table only)
    const pgChannelName = `content-updates-${deviceId}-${Date.now()}`;
    const pgChannel = supabase.channel(pgChannelName);

    let debounceTimer: NodeJS.Timeout | null = null;

    const fetchAndCallback = (source: string) => {
      if (debounceTimer) clearTimeout(debounceTimer);

      debounceTimer = setTimeout(async () => {
        try {
          const content = await this.getDeviceContent();
          console.log(`📦 [${source}] Fetched content:`, content.length, 'items');
          callback(content);
        } catch (error) {
          console.error('❌ Error fetching content after update:', error);
        }
      }, 500); // Debounce for 500ms
    };

    // Listen for CHANGES to device_content table (filtered to this device only)
    // This fires when content is added/removed/reordered for this device
    pgChannel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'device_content',
        filter: `device_id=eq.${deviceId}`,
      },
      (payload) => {
        console.log('🔄 Device Content Change (postgres_changes):', payload.eventType);
        fetchAndCallback('postgres_changes');
      }
    );

    // Subscribe to postgres_changes channel
    pgChannel.subscribe((status, err) => {
      console.log('🔗 Postgres Changes subscription status:', status);
      if (err) {
        console.error('❌ Postgres Changes subscription error:', err);
      }
      if (status === 'SUBSCRIBED') {
        console.log('✅ Postgres Changes subscription active for device:', deviceId);
      }
    });

    // === Broadcast Channel (lightweight fallback) ===
    // The Android app sends a broadcast message when content is pushed.
    // This works even if postgres_changes publication isn't set up.
    // Zero extra DB queries — just a WebSocket message.
    const broadcastChannelName = `device-notify-${deviceId}`;
    const broadcastChannel = supabase.channel(broadcastChannelName);

    broadcastChannel.on(
      'broadcast',
      { event: 'content-updated' },
      (payload) => {
        console.log('📡 Broadcast received: content-updated', payload);
        fetchAndCallback('broadcast');
      }
    );

    broadcastChannel.subscribe((status, err) => {
      console.log('🔗 Broadcast subscription status:', status);
      if (err) {
        console.error('❌ Broadcast subscription error:', err);
      }
      if (status === 'SUBSCRIBED') {
        console.log('✅ Broadcast subscription active on channel:', broadcastChannelName);
      }
    });

    // Return a combined unsubscribe object
    return {
      unsubscribe: () => {
        console.log('🔌 Unsubscribing from all channels...');
        pgChannel.unsubscribe();
        broadcastChannel.unsubscribe();
      },
    };
  }

  // Cache content for offline use
  static cacheContent(content: Content[]): void {
    try {
      localStorage.setItem('cached_content', JSON.stringify(content));
      localStorage.setItem('cache_timestamp', Date.now().toString());
    } catch (error) {
      console.error('Error caching content:', error);
    }
  }

  // Get cached content
  static getCachedContent(): Content[] {
    try {
      const cached = localStorage.getItem('cached_content');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Error getting cached content:', error);
    }
    return [];
  }

  // Check if cache is valid (less than 1 hour old)
  static isCacheValid(): boolean {
    try {
      const timestamp = localStorage.getItem('cache_timestamp');
      if (timestamp) {
        const cacheAge = Date.now() - parseInt(timestamp);
        return cacheAge < 60 * 60 * 1000; // 1 hour
      }
    } catch (error) {
      console.error('Error checking cache validity:', error);
    }
    return false;
  }

  // Get content with fallback to cache (optimized to reduce requests)
  static async getContentWithFallback(): Promise<Content[]> {
    try {
      // Check cache first to avoid unnecessary requests
      if (this.isCacheValid()) {
        const cachedContent = this.getCachedContent();
        if (cachedContent.length > 0) {
          console.log('Using valid cached content:', cachedContent.length, 'items');
          return cachedContent;
        }
      }

      // Only fetch from database if cache is invalid or empty
      const freshContent = await this.getDeviceContent();
      console.log('Fresh content fetched:', freshContent.length, 'items');

      if (freshContent.length > 0) {
        console.log('Using fresh content from database');
        this.cacheContent(freshContent);
        return freshContent;
      }
    } catch (error) {
      console.error('Error fetching fresh content:', error);

      // Try cached content even if expired in case of network issues
      const cachedContent = this.getCachedContent();
      if (cachedContent.length > 0) {
        console.log('Using expired cached content due to network error:', cachedContent.length, 'items');
        return cachedContent;
      }
    }

    // Return default content if no cache and no fresh content
    console.log('No content available, using default content');
    return this.getDefaultContent();
  }

  // Get default content when no content is available
  static getDefaultContent(): Content[] {
    return [
      {
        id: 'default-welcome',
        user_id: '',
        title: 'Welcome to PiBoard Innovators',
        content_type: 'text',
        text_content: '🚀 Digital Signage Revolution\n\nTransforming communication through innovative display technology\n\nConnect • Display • Engage',
        duration: 12,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'default-features',
        user_id: '',
        title: 'Powered by Innovation',
        content_type: 'text',
        text_content: '✨ Real-time Content Updates\n📱 Mobile App Control\n🎨 Rich Media Support\n🔄 Seamless Synchronization\n\nYour content, everywhere, instantly',
        duration: 10,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'default-pairing',
        user_id: '',
        title: 'Ready to Connect',
        content_type: 'text',
        text_content: `📲 Device Code: ${DeviceService.getDeviceCode()}\n\n🔗 Open your PiBoard mobile app\n📝 Enter the device code above\n🎯 Start sending amazing content!\n\nLet's make your display come alive!`,
        duration: 15,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }

  // Preload media content
  static async preloadMedia(content: Content[]): Promise<void> {
    const mediaContent = content.filter(c =>
      (c.content_type === 'image' || c.content_type === 'video') && c.file_url
    );

    for (const item of mediaContent) {
      try {
        if (item.content_type === 'image' && item.file_url) {
          const img = document.createElement('img');
          img.src = item.file_url;
        }
        // For videos, we'll let the browser handle preloading
      } catch (error) {
        console.error('Error preloading media:', error);
      }
    }
  }
}