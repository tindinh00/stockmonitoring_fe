import { useState, useCallback } from 'react';
import moment from 'moment';

export function useStockUIState() {
  const [uiState, setUiState] = useState({
    isLoading: true,
    isWatchlistLoading: false,
    isInitialWatchlistLoad: true,
    isSignalRUpdating: false,
    isChartLoading: false,
    chartError: null,
    lastTimestamp: null,
    currentTime: moment(),
    showWatchlist: false
  });

  const updateLoading = useCallback((isLoading) => {
    setUiState(prevState => ({
      ...prevState,
      isLoading
    }));
  }, []);

  const updateWatchlistLoading = useCallback((isWatchlistLoading) => {
    setUiState(prevState => ({
      ...prevState,
      isWatchlistLoading
    }));
  }, []);

  const updateInitialWatchlistLoad = useCallback((isInitialWatchlistLoad) => {
    setUiState(prevState => ({
      ...prevState,
      isInitialWatchlistLoad
    }));
  }, []);

  const updateSignalRUpdating = useCallback((isSignalRUpdating) => {
    setUiState(prevState => ({
      ...prevState,
      isSignalRUpdating
    }));
  }, []);

  const updateLastTimestamp = useCallback((timestamp) => {
    setUiState(prevState => ({
      ...prevState,
      lastTimestamp: timestamp
    }));
  }, []);

  const updateCurrentTime = useCallback((time) => {
    setUiState(prevState => ({
      ...prevState,
      currentTime: moment(time)
    }));
  }, []);

  const updateChartState = useCallback((isLoading, error = null) => {
    setUiState(prevState => ({
      ...prevState,
      isChartLoading: isLoading,
      chartError: error
    }));
  }, []);

  const updateShowWatchlist = useCallback((showWatchlist) => {
    setUiState(prevState => ({
      ...prevState,
      showWatchlist
    }));
  }, []);

  return {
    ...uiState,
    updateLoading,
    updateWatchlistLoading,
    updateInitialWatchlistLoad,
    updateSignalRUpdating,
    updateLastTimestamp,
    updateCurrentTime,
    updateChartState,
    updateShowWatchlist
  };
} 