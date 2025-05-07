import { useState, useCallback } from 'react';

export function useStockMetrics() {
  const [metrics, setMetrics] = useState({
    performanceMetrics: {
      processingTime: 0,
      itemsIn: 0,
      itemsOut: 0
    },
    colorWorkerMetrics: {
      processingTime: 0,
      stockCount: 0
    },
    showPerformanceMetrics: false
  });

  const updatePerformanceMetrics = useCallback((newMetrics) => {
    setMetrics(prevMetrics => ({
      ...prevMetrics,
      performanceMetrics: newMetrics
    }));
  }, []);

  const updateColorWorkerMetrics = useCallback((newMetrics) => {
    setMetrics(prevMetrics => ({
      ...prevMetrics,
      colorWorkerMetrics: newMetrics
    }));
  }, []);

  const togglePerformanceMetrics = useCallback(() => {
    setMetrics(prevMetrics => ({
      ...prevMetrics,
      showPerformanceMetrics: !prevMetrics.showPerformanceMetrics
    }));
  }, []);

  return {
    ...metrics,
    updatePerformanceMetrics,
    updateColorWorkerMetrics,
    togglePerformanceMetrics
  };
} 