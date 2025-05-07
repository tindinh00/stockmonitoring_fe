import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useWorkerMetricsStore = create(
  devtools(
    (set, get) => ({
      // Batch processing state
      latestBatchTimestamp: 0,
      batchProcessingQueue: [],
      isProcessingBatch: false,

      // Worker performance metrics
      colorWorkerMetrics: {
        processedItems: 0,
        totalProcessingTime: 0,
        averageProcessingTime: 0,
        lastUpdateTime: Date.now(),
      },

      // Actions
      setLatestBatchTimestamp: (timestamp) => {
        set({ latestBatchTimestamp: timestamp });
      },

      updateColorWorkerMetrics: (metrics) => {
        set((state) => ({
          colorWorkerMetrics: {
            ...state.colorWorkerMetrics,
            ...metrics,
            lastUpdateTime: Date.now(),
          },
        }));
      },

      // Batch processing actions
      addToBatchQueue: (items) => {
        set((state) => ({
          batchProcessingQueue: [...state.batchProcessingQueue, ...items],
        }));
      },

      clearBatchQueue: () => {
        set({ batchProcessingQueue: [] });
      },

      setIsProcessingBatch: (isProcessing) => {
        set({ isProcessingBatch: isProcessing });
      },

      // Performance monitoring
      getWorkerPerformanceStats: () => {
        const state = get();
        const {
          processedItems,
          totalProcessingTime,
          averageProcessingTime,
          lastUpdateTime,
        } = state.colorWorkerMetrics;

        return {
          processedItems,
          totalProcessingTime,
          averageProcessingTime,
          lastUpdateTime,
          itemsPerSecond: processedItems > 0 
            ? (processedItems / (totalProcessingTime / 1000)).toFixed(2)
            : 0,
        };
      },

      // Reset all metrics
      resetMetrics: () => {
        set({
          latestBatchTimestamp: 0,
          batchProcessingQueue: [],
          isProcessingBatch: false,
          colorWorkerMetrics: {
            processedItems: 0,
            totalProcessingTime: 0,
            averageProcessingTime: 0,
            lastUpdateTime: Date.now(),
          },
        });
      },
    }),
    {
      name: 'worker-metrics-store',
    }
  )
);

export default useWorkerMetricsStore; 