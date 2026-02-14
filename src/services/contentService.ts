import { supabase, Content } from './supabaseClient';
import { DeviceService } from './deviceService';

export class ContentService {
  // Get content for current device
  static async getDeviceContent(): Promise<Content[]> {
    const deviceId = DeviceService.getDeviceId();

    try {
      console.log('Fetching content for device:', deviceId);

      const { data, error } = await supabase
        .from('device_content')
        .select(`
          *,
          content (*)
        `)
        .eq('device_id', deviceId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Supabase error fetching device content:', error);
        throw error;
      }

      console.log('Raw device content data:', data);

      const content = data
        ?.map(item => item.content)
        .filter(Boolean) as Content[] || [];

      console.log('Processed content for display:', content);

      return content;
    } catch (error) {
      console.error('Error fetching device content:', error);
      return [];
    }
  }

  // Subscribe to real-time content updates
  static subscribeToContentUpdates(callback: (content: Content[]) => void) {
    const deviceId = DeviceService.getDeviceId();

    console.log('🔔 Setting up real-time subscription for device:', deviceId);

    // Create a unique channel for this device
    const channelName = `content-updates-${deviceId}-${Date.now()}`;
    const channel = supabase.channel(channelName);

    let debounceTimer: NodeJS.Timeout | null = null;

    const fetchAndCallback = () => {
      if (debounceTimer) clearTimeout(debounceTimer);

      debounceTimer = setTimeout(async () => {
        try {
          const content = await this.getDeviceContent();
          console.log('📦 Realtime Update: Fetched specific content:', content.length, 'items');
          callback(content);
        } catch (error) {
          console.error('❌ Error fetching content after update:', error);
        }
      }, 500); // Debounce for 500ms
    };

    // Listen for CHANGES to the link table (device_content)
    // This handles:
    // 1. Content added to device (INSERT)
    // 2. Content removed from device (DELETE)
    // 3. Order changed or Active status changed (UPDATE)
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'device_content',
        filter: `device_id=eq.${deviceId}`,
      },
      (payload) => {
        console.log('🔄 Device Content Change:', payload.eventType);
        fetchAndCallback();
      }
    );

    // Listen for CHANGES to the actual content (title, file_url, etc.)
    // We only care if the content items LINKED to this device are updated.
    // However, Supabase RLS limits what we see. 
    // Optimization: Only listen for UPDATE (unlikely to need INSERT/DELETE here as that's handled by device_content usually)
    // But if a user deletes a content item globally, it cascades.
    channel.on(
      'postgres_changes',
      {
        event: '*', // Listen to all, but Filter logic is hard without join.
        schema: 'public',
        table: 'content',
      },
      (payload) => {
        // Optimization: We could check if the ID is in our current list, but for now, 
        // let's just refresh. The excessive load came from polling, not this.
        // And since we debounce, multiple updates won't kill us.
        console.log('📝 Global Content Change:', payload.eventType);
        fetchAndCallback();
      }
    );

    // Subscribe and handle connection status
    const subscription = channel.subscribe((status, err) => {
      console.log('🔗 Subscription status:', status);
      if (err) {
        console.error('❌ Subscription error:', err);
      }

      if (status === 'SUBSCRIBED') {
        console.log('✅ Real-time subscription active for device:', deviceId);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Channel error - attempting to reconnect...');
        // Attempt to reconnect after a delay
        setTimeout(() => {
          this.subscribeToContentUpdates(callback);
        }, 5000);
      }
    });

    return subscription;
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