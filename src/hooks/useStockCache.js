import { useState, useCallback, useRef, useEffect } from 'react';

// Configure cache options
const COLOR_CACHE_OPTIONS = {
  max: 5000, // Maximum number of items
  ttl: 1000 * 60 * 5, // 5 minutes
  updateAgeOnGet: true,
  allowStale: false,
  maxSize: 5 * 1024 * 1024, // 5MB
  sizeCalculation: (value, key) => {
    // Estimate size in bytes: key length + value length * 2 (for UTF-16)
    return key.length + (typeof value === 'string' ? value.length * 2 : 100);
  },
};

const ANIMATION_CACHE_OPTIONS = {
  max: 2000, // Fewer items for animations
  ttl: 1000 * 2, // 2 seconds
  updateAgeOnGet: true,
  allowStale: false,
  maxSize: 2 * 1024 * 1024, // 2MB
  sizeCalculation: (value, key) => {
    return key.length + (typeof value === 'string' ? value.length * 2 : 100);
  },
};

export function useStockCache() {
  // Create refs to hold the LRU caches
  const colorCacheRef = useRef(null);
  const animationCacheRef = useRef(null);

  // Initialize caches on first render
  useEffect(() => {
    const initializeCaches = async () => {
      try {
        // Dynamically import LRUCache
        const { default: LRUCache } = await import('lru-cache');
        
        // Create new instances
        colorCacheRef.current = new LRUCache(COLOR_CACHE_OPTIONS);
        animationCacheRef.current = new LRUCache(ANIMATION_CACHE_OPTIONS);
      } catch (error) {
        console.error('Error initializing LRU cache:', error);
        // Initialize with simple Map as fallback
        colorCacheRef.current = new Map();
        animationCacheRef.current = new Map();
      }
    };

    initializeCaches();

    return () => {
      if (colorCacheRef.current) {
        colorCacheRef.current.clear();
      }
      if (animationCacheRef.current) {
        animationCacheRef.current.clear();
      }
    };
  }, []);

  // State to trigger re-renders when cache changes
  const [cacheState, setCacheState] = useState({
    colorCacheSize: 0,
    animationCacheSize: 0,
    priceChangeColors: {}
  });

  const updateColorCache = useCallback((newData) => {
    if (!colorCacheRef.current) return;

    if (typeof newData === 'function') {
      // Handle functional updates
      const currentCache = {};
      colorCacheRef.current.forEach((value, key) => {
        currentCache[key] = value;
      });
      const updatedData = newData(currentCache);
      
      // Update the cache with new data
      Object.entries(updatedData).forEach(([key, value]) => {
        colorCacheRef.current.set(key, value);
      });
    } else {
      // Handle direct updates
      Object.entries(newData).forEach(([key, value]) => {
        colorCacheRef.current.set(key, value);
      });
    }
    
    // Trigger re-render
    setCacheState(prev => ({
      ...prev,
      colorCacheSize: colorCacheRef.current.size
    }));
  }, []);

  const updateAnimationCache = useCallback((newData) => {
    if (!animationCacheRef.current) return;

    if (typeof newData === 'function') {
      // Handle functional updates
      const currentCache = {};
      animationCacheRef.current.forEach((value, key) => {
        currentCache[key] = value;
      });
      const updatedData = newData(currentCache);
      
      // Update the cache with new data
      Object.entries(updatedData).forEach(([key, value]) => {
        animationCacheRef.current.set(key, value);
      });
    } else {
      // Handle direct updates
      Object.entries(newData).forEach(([key, value]) => {
        animationCacheRef.current.set(key, value);
      });
    }
    
    // Trigger re-render
    setCacheState(prev => ({
      ...prev,
      animationCacheSize: animationCacheRef.current.size
    }));
  }, []);

  const updatePriceColors = useCallback((newColors) => {
    setCacheState(prev => ({
      ...prev,
      priceChangeColors: newColors
    }));
  }, []);

  const clearCaches = useCallback(() => {
    colorCacheRef.current?.clear();
    animationCacheRef.current?.clear();
    setCacheState(prev => ({
      ...prev,
      colorCacheSize: 0,
      animationCacheSize: 0,
      priceChangeColors: {}
    }));
  }, []);

  // Helper function to get cache contents as objects
  const getColorCache = useCallback(() => {
    if (!colorCacheRef.current) return {};
    const cache = {};
    colorCacheRef.current.forEach((value, key) => {
      cache[key] = value;
    });
    return cache;
  }, []);

  const getAnimationCache = useCallback(() => {
    if (!animationCacheRef.current) return {};
    const cache = {};
    animationCacheRef.current.forEach((value, key) => {
      cache[key] = value;
    });
    return cache;
  }, []);

  // Get a single value from cache
  const getColorCacheValue = useCallback((key) => {
    return colorCacheRef.current?.get(key);
  }, []);

  const getAnimationCacheValue = useCallback((key) => {
    return animationCacheRef.current?.get(key);
  }, []);

  return {
    colorCache: getColorCache(),
    animationCache: getAnimationCache(),
    priceChangeColors: cacheState.priceChangeColors,
    colorCacheSize: cacheState.colorCacheSize,
    animationCacheSize: cacheState.animationCacheSize,
    updateColorCache,
    updateAnimationCache,
    updatePriceColors,
    clearCaches,
    getColorCacheValue,
    getAnimationCacheValue
  };
} 