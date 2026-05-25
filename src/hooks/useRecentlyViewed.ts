import { useState, useEffect } from 'react';

const STORAGE_KEY = 'calnza_recently_viewed';
const MAX_ITEMS = 12;

export function useRecentlyViewed() {
  const [viewedIds, setViewedIds] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setViewedIds(JSON.parse(stored));
      } catch (e) {
        logger.error('Failed to parse recently viewed', e);
      }
    }
  }, []);

  const addViewedProduct = (productId: string) => {
    setViewedIds((prev) => {
      const filtered = prev.filter((id) => id !== productId);
      const updated = [productId, ...filtered].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentlyViewed = () => {
    localStorage.removeItem(STORAGE_KEY);
    setViewedIds([]);
  };

  return { viewedIds, addViewedProduct, clearRecentlyViewed };
}
