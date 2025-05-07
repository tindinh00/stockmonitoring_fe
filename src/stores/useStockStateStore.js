import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import moment from 'moment';

const useStockStateStore = create(
  devtools(
    (set, get) => ({
      // Main stock data state
      realTimeStockData: [],
      watchlist: [],
      previousValues: {},
      priceHistory: {},
      priceChangeColors: {},
      volumeHistory: {},
      filteredData: [],
      chartData: [],

      // UI state
      isLoading: true,
      isWatchlistLoading: false,
      isInitialWatchlistLoad: true,
      isSignalRUpdating: false,
      isChartLoading: false,
      chartError: null,
      lastTimestamp: null,
      currentTime: moment(),
      showWatchlist: false,

      // Performance metrics state
      performanceMetrics: {
        processingTime: 0,
        itemsIn: 0,
        itemsOut: 0
      },
      colorWorkerMetrics: {
        processingTime: 0,
        stockCount: 0
      },
      showPerformanceMetrics: false,

      // Cache state
      colorCache: {},
      animationCache: {},

      // Actions
      updateStockData: (newData) => set((state) => ({
        realTimeStockData: newData
      })),

      updateWatchlist: (newData) => set((state) => ({
        watchlist: typeof newData === 'function' ? newData(state.watchlist) : newData
      })),

      updatePriceColors: (newColors) => set((state) => ({
        priceChangeColors: newColors
      })),

      updateFilteredData: (newData) => set((state) => ({
        filteredData: newData
      })),

      updateChartData: (newData) => set((state) => ({
        chartData: newData
      })),

      updateLoading: (isLoading) => set((state) => ({
        isLoading
      })),

      updateWatchlistLoading: (isWatchlistLoading) => set((state) => ({
        isWatchlistLoading
      })),

      updateInitialWatchlistLoad: (isInitialWatchlistLoad) => set((state) => ({
        isInitialWatchlistLoad
      })),

      updateSignalRUpdating: (isSignalRUpdating) => set((state) => ({
        isSignalRUpdating
      })),

      updateLastTimestamp: (timestamp) => set((state) => ({
        lastTimestamp: timestamp
      })),

      updateCurrentTime: (time) => set((state) => ({
        currentTime: time
      })),

      updateChartState: (isLoading, error = null) => set((state) => ({
        isChartLoading: isLoading,
        chartError: error
      })),

      updateShowWatchlist: (showWatchlist) => set((state) => ({
        showWatchlist
      })),

      updatePerformanceMetrics: (newMetrics) => set((state) => ({
        performanceMetrics: newMetrics
      })),

      updateColorWorkerMetrics: (newMetrics) => set((state) => ({
        colorWorkerMetrics: newMetrics
      })),

      togglePerformanceMetrics: () => set((state) => ({
        showPerformanceMetrics: !state.showPerformanceMetrics
      })),

      updateColorCache: (newData) => set((state) => ({
        colorCache: typeof newData === 'function' ? newData(state.colorCache) : newData
      })),

      updateAnimationCache: (newData) => set((state) => ({
        animationCache: typeof newData === 'function' ? newData(state.animationCache) : newData
      })),

      updatePriceHistory: (newData) => set((state) => ({
        priceHistory: newData
      })),

      updateVolumeHistory: (newData) => set((state) => ({
        volumeHistory: newData
      })),

      updatePreviousValues: (newData) => set((state) => ({
        previousValues: newData
      })),

      // Batch update function
      batchUpdate: (updates) => set((state) => {
        const newState = { ...state };
        if (updates.stockData) {
          Object.assign(newState, updates.stockData);
        }
        if (updates.uiState) {
          Object.assign(newState, updates.uiState);
        }
        if (updates.metrics) {
          Object.assign(newState, updates.metrics);
        }
        return newState;
      }),

      // Reset state
      resetState: () => set({
        realTimeStockData: [],
        watchlist: [],
        previousValues: {},
        priceHistory: {},
        priceChangeColors: {},
        volumeHistory: {},
        filteredData: [],
        chartData: [],
        isLoading: true,
        isWatchlistLoading: false,
        isInitialWatchlistLoad: true,
        isSignalRUpdating: false,
        isChartLoading: false,
        chartError: null,
        lastTimestamp: null,
        currentTime: moment(),
        showWatchlist: false,
        performanceMetrics: {
          processingTime: 0,
          itemsIn: 0,
          itemsOut: 0
        },
        colorWorkerMetrics: {
          processingTime: 0,
          stockCount: 0
        },
        showPerformanceMetrics: false,
        colorCache: {},
        animationCache: {}
      })
    }),
    {
      name: 'stock-state-store'
    }
  )
);

export default useStockStateStore; 