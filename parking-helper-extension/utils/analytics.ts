import { supabase } from './supabase';

interface AnalyticsEvent {
  name: string;
  payload?: Record<string, any>;
}

class Analytics {
  private queue: AnalyticsEvent[] = [];
  private isOnline = navigator.onLine;
  private clientId: string;

  constructor() {
    // Generate or retrieve client ID
    this.initializeClientId();
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
    
    // Flush queue periodically
    setInterval(() => this.flushQueue(), 30000); // 30 seconds
  }

  private async initializeClientId() {
    const stored = await chrome.storage.local.get('analytics_client_id');
    if (stored.analytics_client_id) {
      this.clientId = stored.analytics_client_id;
    } else {
      this.clientId = crypto.randomUUID();
      await chrome.storage.local.set({ analytics_client_id: this.clientId });
    }
  }

  track(name: string, payload?: Record<string, any>) {
    const event: AnalyticsEvent = {
      name,
      payload: {
        ...payload,
        client_id: this.clientId,
        timestamp: new Date().toISOString(),
        extension_version: chrome.runtime.getManifest().version
      }
    };

    this.queue.push(event);

    // Try to send immediately if online
    if (this.isOnline) {
      this.flushQueue();
    }
  }

  private async flushQueue() {
    if (this.queue.length === 0 || !this.isOnline) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser();

      // Send events to Supabase
      const { error } = await supabase
        .from('events')
        .insert(
          events.map(event => ({
            user_id: user?.id || null,
            name: event.name,
            payload: event.payload
          }))
        );

      if (error) {
        console.error('Failed to send analytics:', error);
        // Put events back in queue
        this.queue.unshift(...events);
      }
    } catch (error) {
      console.error('Analytics error:', error);
      // Put events back in queue
      this.queue.unshift(...events);
    }
  }

  // Common event tracking methods
  trackPlaceView(place: { provider: string; externalId?: string; name: string }) {
    this.track('view_place', {
      provider: place.provider,
      external_place_id: place.externalId,
      place_name: place.name
    });
  }

  trackSearchResultClick(query: string, placeId: string) {
    this.track('search_result_click', {
      query,
      place_id: placeId
    });
  }

  trackReviewCreated(subjectType: string, targetId: string) {
    this.track('review_created', {
      subject_type: subjectType,
      target_id: targetId
    });
  }

  trackError(error: Error, context?: Record<string, any>) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      ...context
    });
  }
}

// Singleton instance
export const analytics = new Analytics();