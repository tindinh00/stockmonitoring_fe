import { useCallback } from 'react';
import { useStockData } from './useStockData';
import { useStockUIState } from './useStockUIState';
import { useStockMetrics } from './useStockMetrics';
import { useStockCache } from './useStockCache';

export function useStock() {
  const stockData = useStockData();
  const uiState = useStockUIState();
  const metrics = useStockMetrics();
  const cache = useStockCache();

  // Batch update function to update multiple pieces of state at once
  const batchUpdate = useCallback((updates) => {
    if (updates.stockData) {
      Object.entries(updates.stockData).forEach(([key, value]) => {
        const updateFn = stockData[`update${key.charAt(0).toUpperCase() + key.slice(1)}`];
        if (updateFn) {
          updateFn(value);
        }
      });
    }
    
    if (updates.uiState) {
      Object.entries(updates.uiState).forEach(([key, value]) => {
        const updateFn = uiState[`update${key.charAt(0).toUpperCase() + key.slice(1)}`];
        if (updateFn) {
          updateFn(value);
        }
      });
    }
    
    if (updates.metrics) {
      Object.entries(updates.metrics).forEach(([key, value]) => {
        const updateFn = metrics[`update${key.charAt(0).toUpperCase() + key.slice(1)}`];
        if (updateFn) {
          updateFn(value);
        }
      });
    }

    if (updates.cache) {
      Object.entries(updates.cache).forEach(([key, value]) => {
        const updateFn = cache[`update${key.charAt(0).toUpperCase() + key.slice(1)}`];
        if (updateFn) {
          updateFn(value);
        }
      });
    }
  }, [stockData, uiState, metrics, cache]);

  return {
    ...stockData,
    ...uiState,
    ...metrics,
    ...cache,
    batchUpdate
  };
} 