import { useState, useCallback } from 'react';

export function useStockCache() {
  const [cacheState, setCacheState] = useState({
    colorCache: {},
    animationCache: {},
    priceChangeColors: {}
  });

  const updateColorCache = useCallback((newData) => {
    setCacheState(prevCache => ({
      ...prevCache,
      colorCache: typeof newData === 'function' ? newData(prevCache.colorCache) : newData
    }));
  }, []);

  const updateAnimationCache = useCallback((newData) => {
    setCacheState(prevCache => ({
      ...prevCache,
      animationCache: typeof newData === 'function' ? newData(prevCache.animationCache) : newData
    }));
  }, []);

  const updatePriceColors = useCallback((newColors) => {
    setCacheState(prevCache => ({
      ...prevCache,
      priceChangeColors: newColors
    }));
  }, []);

  const clearCaches = useCallback(() => {
    setCacheState({
      colorCache: {},
      animationCache: {},
      priceChangeColors: {}
    });
  }, []);

  return {
    ...cacheState,
    updateColorCache,
    updateAnimationCache,
    updatePriceColors,
    clearCaches
  };
} 