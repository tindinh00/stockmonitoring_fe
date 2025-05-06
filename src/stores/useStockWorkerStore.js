import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useStockWorkerStore = create(
  devtools(
    (set, get) => ({
      // Workers
      filterWorker: null,
      colorWorker: null,

      // Caches
      colorCache: new Map(),
      animationCache: new Map(),
      isDarkMode: false,
      
      // Batch processing
      latestBatchTimestamp: 0,
      
      // Performance metrics
      metrics: {
        filterWorkerMetrics: {
          processingTime: 0,
          itemsIn: 0,
          itemsOut: 0
        },
        colorWorkerMetrics: {
          processingTime: 0,
          stockCount: 0,
          cacheHits: 0,
          cacheMisses: 0
        }
      },

      // Actions
      initializeWorkers: () => {
        const currentFilterWorker = get().filterWorker;
        const currentColorWorker = get().colorWorker;

        // Cleanup existing workers
        if (currentFilterWorker) {
          currentFilterWorker.terminate();
        }
        if (currentColorWorker) {
          currentColorWorker.terminate();
        }

        // Create new workers
        const newFilterWorker = new Worker(
          new URL('../workers/stockFilterWorker.js', import.meta.url),
          { type: 'module' }
        );

        const newColorWorker = new Worker(
          new URL('../workers/priceColorWorker.js', import.meta.url),
          { type: 'module' }
        );

        set({
          filterWorker: newFilterWorker,
          colorWorker: newColorWorker
        });

        return { filterWorker: newFilterWorker, colorWorker: newColorWorker };
      },

      terminateWorkers: () => {
        const { filterWorker, colorWorker } = get();
        
        if (filterWorker) {
          filterWorker.terminate();
        }
        if (colorWorker) {
          colorWorker.terminate();
        }

        set({
          filterWorker: null,
          colorWorker: null
        });
      },

      // Batch timestamp management
      updateLatestBatchTimestamp: (timestamp) => {
        const currentTimestamp = get().latestBatchTimestamp;
        if (timestamp > currentTimestamp) {
          set({ latestBatchTimestamp: timestamp });
          return true; // Timestamp was updated
        }
        return false; // Timestamp was not updated (older than current)
      },

      // Cache management
      updateColorCache: (newCache) => {
        set((state) => ({
          colorCache: new Map(state.colorCache).set(newCache.key, {
            color: newCache.color,
            timestamp: Date.now()
          })
        }));
      },

      updateAnimationCache: (newCache) => {
        set((state) => ({
          animationCache: new Map(state.animationCache).set(newCache.key, {
            animation: newCache.animation,
            timestamp: Date.now()
          })
        }));
      },

      clearCaches: () => {
        set({
          colorCache: new Map(),
          animationCache: new Map(),
          latestBatchTimestamp: 0
        });
      },

      // Single cache entry updates
      setCacheEntry: (cacheType, key, value) => {
        if (cacheType === 'color') {
          set((state) => ({
            colorCache: new Map(state.colorCache).set(key, {
              color: value,
              timestamp: Date.now()
            })
          }));
        } else if (cacheType === 'animation') {
          set((state) => ({
            animationCache: new Map(state.animationCache).set(key, {
              animation: value,
              timestamp: Date.now()
            })
          }));
        }
      },

      // Metrics management
      updateFilterWorkerMetrics: (newMetrics) => {
        set((state) => ({
          metrics: {
            ...state.metrics,
            filterWorkerMetrics: {
              ...state.metrics.filterWorkerMetrics,
              ...newMetrics
            }
          }
        }));
      },

      updateColorWorkerMetrics: (newMetrics) => {
        set((state) => ({
          metrics: {
            ...state.metrics,
            colorWorkerMetrics: {
              ...state.metrics.colorWorkerMetrics,
              ...newMetrics
            }
          }
        }));
      },

      resetMetrics: () => {
        set((state) => ({
          metrics: {
            filterWorkerMetrics: {
              processingTime: 0,
              itemsIn: 0,
              itemsOut: 0
            },
            colorWorkerMetrics: {
              processingTime: 0,
              stockCount: 0,
              cacheHits: 0,
              cacheMisses: 0
            }
          }
        }));
      },

      // Color cache actions
      setColorCache: (key, color) => {
        set((state) => ({
          colorCache: new Map(state.colorCache).set(key, {
            color,
            timestamp: Date.now(),
          }),
        }));
      },

      getColorCache: (key) => {
        const state = get();
        const cached = state.colorCache.get(key);
        if (cached && Date.now() - cached.timestamp < 5000) { // 5 second cache validity
          return cached.color;
        }
        return null;
      },

      clearColorCache: () => {
        set({ colorCache: new Map() });
      },

      // Animation cache actions
      setAnimationCache: (key, animation) => {
        set((state) => ({
          animationCache: new Map(state.animationCache).set(key, {
            animation,
            timestamp: Date.now(),
          }),
        }));
      },

      getAnimationCache: (key) => {
        const state = get();
        const cached = state.animationCache.get(key);
        if (cached && Date.now() - cached.timestamp < 2000) { // 2 second cache validity
          return cached.animation;
        }
        return null;
      },

      clearAnimationCache: () => {
        set({ animationCache: new Map() });
      },

      // Dark mode actions
      setIsDarkMode: (darkMode) => {
        set({ isDarkMode: darkMode });
        // Clear caches when dark mode changes as colors need to be recalculated
        get().clearColorCache();
      },

      // Helper function to generate cache key
      generateCacheKey: (price, refPrice, ceilPrice, floorPrice) => {
        return `${price}-${refPrice}-${ceilPrice}-${floorPrice}-${get().isDarkMode}`;
      },

      generateAnimationCacheKey: (currentValue, previousValue, type) => {
        return `${currentValue}-${previousValue}-${type}`;
      }
    }),
    {
      name: 'stock-worker-store',
    }
  )
);

export default useStockWorkerStore; 