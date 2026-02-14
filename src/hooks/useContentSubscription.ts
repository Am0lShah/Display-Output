import { useState, useEffect } from 'react';
import { ContentService } from '../services/contentService';
import { Content } from '../services/supabaseClient';

export const useContentSubscription = (isPaired: boolean) => {
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPaired) {
      // Show default content when not paired
      console.log('Device not paired, showing default content');
      setContent(ContentService.getDefaultContent());
      setLoading(false);
      return;
    }

    console.log('Device is paired, loading content...');
    loadContent();

    // Subscribe to real-time updates
    const subscription = ContentService.subscribeToContentUpdates((newContent) => {
      console.log('🔔 Received content update via subscription:', newContent);

      setLoading(false);
      setError(null);

      if (newContent.length > 0) {
        console.log('✅ Setting user content from subscription:', newContent.length, 'items');
        setContent(newContent);
        // Cache the content
        ContentService.cacheContent(newContent);
        // Preload media
        ContentService.preloadMedia(newContent);
      } else {
        console.log('📭 No user content, showing default content');
        setContent(ContentService.getDefaultContent());
        // Clear cache when no content
        localStorage.removeItem('cached_content');
        localStorage.removeItem('cache_timestamp');
      }
    });

    return () => {
      console.log('🔌 Cleaning up subscriptions...');
      subscription.unsubscribe();
    };
  }, [isPaired]);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading content for paired device...');

      // Get fresh content directly (no fallback logic here, let subscription handle updates)
      const freshContent = await ContentService.getDeviceContent();
      console.log('Initial content load:', freshContent);

      if (freshContent.length > 0) {
        console.log('Setting initial user content:', freshContent.length, 'items');
        setContent(freshContent);
        ContentService.cacheContent(freshContent);
        await ContentService.preloadMedia(freshContent);
      } else {
        console.log('No initial content, showing default');
        setContent(ContentService.getDefaultContent());
      }
    } catch (err) {
      console.error('Error loading initial content:', err);
      setError('Failed to load content');

      // Try cached content as fallback
      const cachedContent = ContentService.getCachedContent();
      if (cachedContent.length > 0 && ContentService.isCacheValid()) {
        console.log('Using cached content as fallback:', cachedContent);
        setContent(cachedContent);
        setError('Using cached content (offline)');
      } else {
        console.log('No valid cache, using default content');
        setContent(ContentService.getDefaultContent());
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshContent = () => {
    loadContent();
  };

  // Debug helper - can be removed in production
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'r' && e.ctrlKey) {
        console.log('Manual refresh triggered');
        loadContent();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return {
    content,
    loading,
    error,
    refreshContent,
  };
};