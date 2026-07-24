import { useCallback } from 'react';
import api from '@/lib/api-client';

export function useAnalytics() {
  const trackClick = useCallback(async (businessId: string, clickType: 'website' | 'phone' | 'whatsapp' | 'email' | 'direction') => {
    try {
      await api.post(`/analytics/track/click/${businessId}?click_type=${clickType}`);
    } catch (error) {
      console.error('Failed to track click analytics', error);
    }
  }, []);

  const trackDirections = useCallback(async (businessId: string) => {
    try {
      await api.post(`/analytics/track/directions/${businessId}`);
    } catch (error) {
      console.error('Failed to track directions analytics', error);
    }
  }, []);

  const trackSearch = useCallback(async (query: string, resultCount: number = 0) => {
    if (!query) return;
    try {
      await api.post(`/analytics/track/search?query=${encodeURIComponent(query)}&result_count=${resultCount}`);
    } catch (error) {
      console.error('Failed to track search analytics', error);
    }
  }, []);

  return {
    trackClick,
    trackDirections,
    trackSearch
  };
}
