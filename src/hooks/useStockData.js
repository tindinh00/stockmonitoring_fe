import { useState, useCallback } from 'react';

export function useStockData() {
  const [data, setData] = useState({
    realTimeStockData: [],
    watchlist: [],
    previousValues: {},
    priceHistory: {},
    volumeHistory: {},
    filteredData: [],
    chartData: []
  });

  const updateStockData = useCallback((newData) => {
    setData(prevData => ({
      ...prevData,
      realTimeStockData: newData
    }));
  }, []);

  const updateWatchlist = useCallback((newData) => {
    setData(prevData => ({
      ...prevData,
      watchlist: typeof newData === 'function' ? newData(prevData.watchlist) : newData
    }));
  }, []);

  const updateFilteredData = useCallback((newData) => {
    setData(prevData => ({
      ...prevData,
      filteredData: newData
    }));
  }, []);

  const updateChartData = useCallback((newData) => {
    setData(prevData => ({
      ...prevData,
      chartData: newData
    }));
  }, []);

  const updatePriceHistory = useCallback((newData) => {
    setData(prevData => ({
      ...prevData,
      priceHistory: newData
    }));
  }, []);

  const updateVolumeHistory = useCallback((newData) => {
    setData(prevData => ({
      ...prevData,
      volumeHistory: newData
    }));
  }, []);

  const updatePreviousValues = useCallback((newData) => {
    setData(prevData => ({
      ...prevData,
      previousValues: newData
    }));
  }, []);

  return {
    ...data,
    updateStockData,
    updateWatchlist,
    updateFilteredData,
    updateChartData,
    updatePriceHistory,
    updateVolumeHistory,
    updatePreviousValues
  };
} 