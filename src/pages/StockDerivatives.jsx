import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useFeatureStore from '@/store/featureStore';
import UnauthorizedFeatureMessage from '@/components/UnauthorizedFeatureMessage';
// import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from "@/components/ui/input";
import moment from 'moment';
import axios from 'axios';
// import TradingViewChart from '@/components/TradingViewChart';
// import {
//   LineChart,
//   Line,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   AreaChart,
//   Area,
// } from 'recharts';
// import Chart from 'react-apexcharts';
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// import signalRService from '@/api/signalRService';
import {
  // ChevronDown,
  // BarChart3,
  // DollarSign,
  // Star,
  // Bell,
  AlertTriangle,
  Info,
  Loader2,
  // CheckCircle
} from 'lucide-react';
import Cookies from 'js-cookie';
import { getUserId, apiService, APP_BASE_URL } from '@/api/Api'; // Import APP_BASE_URL
import { stockService } from '@/api/StockApi'; // Update import to use named import
import axiosInstance from '@/api/axiosInstance'; // Import axiosInstance
import CandlestickChart from '@/components/CandlestickChart';
import useStockWorkerStore from '../stores/useStockWorkerStore';
import useWorkerMetricsStore from '../stores/useWorkerMetricsStore';
import { useStock } from '../hooks/useStock';

// Define the BASE_URL constant for API calls
const BASE_URL = APP_BASE_URL;

// Define exchanges available in the UI
const exchanges = [
  {
    id: 'HOSE',
    name: 'HOSE',
    description: 'Sàn Giao Dịch Chứng Khoán Hồ Chí Minh',
    color: '#00C087'
  },
  {
    id: 'HNX',
    name: 'HNX',
    description: 'Sàn Giao Dịch Chứng Khoán Hà Nội',
    color: '#00B4D8'
  }
];

// Cache helpers
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

// Get cached stock data
const getStockCache = (exchange) => {
  try {
    const cacheKey = `stock_data_${exchange}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (!cachedData) return null;
    
    const parsedData = JSON.parse(cachedData);
    const now = new Date().getTime();
    
    // Check if cache is expired
    if (now - parsedData.timestamp > CACHE_EXPIRY_TIME) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return parsedData.data;
  } catch (error) {
    console.error('Error reading stock cache:', error);
    return null;
  }
};

// Set stock data in cache
const setStockCache = (exchange, data) => {
  try {
    const cacheKey = `stock_data_${exchange}`;
    const cacheData = {
      timestamp: new Date().getTime(),
      data
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error storing stock cache:', error);
  }
};

// Get cached watchlist data
const getWatchlistCache = (exchange, userId) => {
  try {
    const cacheKey = `watchlist_${userId}_${exchange}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (!cachedData) return null;
    
    const parsedData = JSON.parse(cachedData);
    const now = new Date().getTime();
    
    // Check if cache is expired
    if (now - parsedData.timestamp > CACHE_EXPIRY_TIME) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return parsedData.data;
  } catch (error) {
    console.error('Error reading watchlist cache:', error);
    return null;
  }
};

// Set watchlist data in cache
const setWatchlistCache = (exchange, userId, data) => {
  try {
    const cacheKey = `watchlist_${userId}_${exchange}`;
    const cacheData = {
      timestamp: new Date().getTime(),
      data
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error storing watchlist cache:', error);
  }
};

// SVG for Workspace Premium icon from Material Symbols Outlined
const WorkspacePremiumIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" height={size} viewBox="0 -960 960 960" width={size} className={className} fill="currentColor">
    <path d="M190-100v-60h60v-324q0-82 48.5-148.5T420-722v-68q0-24 18-42t42-42q24 0 42 18t18 42v68q74 29 122 95.5T710-484v324h60v60H190Zm290-360q-12 0-21-9t-9-21q0-12 9-21t21-9q12 0 21 9t9 21q0 12-9 21t-21 9Zm0-100q-12 0-21-9t-9-21q0-12 9-21t21-9q12 0 21 9t9 21q0 12-9 21t-21 9Zm0-100q-12 0-21-9t-9-21q0-12 9-21t21-9q12 0 21 9t9 21q0 12-9 21t-21 9Z"/>
  </svg>
);

// Debounce utility
function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    const context = this;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(context, args);
    }, delay);
  };
}

// Custom hook to manage stock data states efficiently
function useStockState() {
  // Main stock data state
  const [data, setData] = useState({
    realTimeStockData: [],
    watchlist: [],
    previousValues: {},
    priceHistory: {},
    priceChangeColors: {},
    volumeHistory: {},
    filteredData: [],
    chartData: [] // Add chartData to the data state
  });
  
  // UI state
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
  
  // Performance metrics state
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
  
  // Add state for color cache and animation cache
  const [colorCache, setColorCache] = useState({});
  const [animationCache, setAnimationCache] = useState({});
  
  // Helper functions to update specific parts of the state
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
  
  const updatePriceColors = useCallback((newColors) => {
    setData(prevData => ({
      ...prevData,
      priceChangeColors: newColors
    }));
  }, []);
  
  const updateFilteredData = useCallback((newData) => {
    setData(prevData => ({
      ...prevData,
      filteredData: newData
    }));
  }, []);
  
  // Add updateChartData function
  const updateChartData = useCallback((newData) => {
    setData(prevData => ({
      ...prevData,
      chartData: newData
    }));
  }, []);
  
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
      currentTime: time
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
  
  // Add update functions for color cache and animation cache
  const updateColorCache = useCallback((newData) => {
    setColorCache(prevCache => {
      if (typeof newData === 'function') {
        return newData(prevCache);
      }
      return newData;
    });
  }, []);
  
  const updateAnimationCache = useCallback((newData) => {
    setAnimationCache(prevCache => {
      if (typeof newData === 'function') {
        return newData(prevCache);
      }
      return newData;
    });
  }, []);
  
  // Batch update function to update multiple pieces of state at once
  const batchUpdate = useCallback((updates) => {
    if (updates.stockData) {
      setData(prevData => ({
        ...prevData,
        ...updates.stockData
      }));
    }
    
    if (updates.uiState) {
      setUiState(prevState => ({
        ...prevState,
        ...updates.uiState
      }));
    }
    
    if (updates.metrics) {
      setMetrics(prevMetrics => ({
        ...prevMetrics,
        ...updates.metrics
      }));
    }
  }, []);
  
  // Add updatePriceHistory function
  const updatePriceHistory = useCallback((newData) => {
    setData(prevData => ({
      ...prevData,
      priceHistory: newData
    }));
  }, []);
  
  // Add updateVolumeHistory function
  const updateVolumeHistory = useCallback((newData) => {
    setData(prevData => ({
      ...prevData,
      volumeHistory: newData
    }));
  }, []);
  
  // Add updatePreviousValues function
  const updatePreviousValues = useCallback((newData) => {
    setData(prevData => ({
      ...prevData,
      previousValues: newData
    }));
  }, []);
  
  return {
    ...data,
    ...uiState,
    ...metrics,
    colorCache,
    animationCache,
    updateStockData,
    updateWatchlist,
    updatePriceColors,
    updateFilteredData,
    updateChartData,
    updateLoading,
    updateWatchlistLoading,
    updateInitialWatchlistLoad,
    updateSignalRUpdating,
    updateLastTimestamp,
    updateCurrentTime,
    updateChartState,
    updateShowWatchlist,
    updatePerformanceMetrics,
    updateColorWorkerMetrics,
    togglePerformanceMetrics,
    batchUpdate,
    updatePriceHistory,
    updateVolumeHistory,
    updatePreviousValues,
    updateColorCache,
    updateAnimationCache
  };
}

export default function StockDerivatives() {
  const navigate = useNavigate();
  const { hasFeature } = useFeatureStore();
  
  // SignalR connection ref
  const connectionRef = useRef(null);
  
  // Worker refs
  const workerRef = useRef(null);
  const colorWorkerRef = useRef(null);
  
  // Refs for color worker message handler to avoid dependency cycles
  const handlerRef = useRef(null);
  
  // Ref to track the latest batch timestamp
  const latestBatchTimestampRef = useRef(0);
  
  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // First check localStorage for saved preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme !== null) {
      return savedTheme === 'dark';
    }
    // Fall back to system preference if no saved preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  // Save theme preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    // Optionally update the document element with class for global styling
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  // UI state variables
  const [selectedExchange, setSelectedExchange] = useState('HOSE');
  const [activeTab, setActiveTab] = useState('price');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog state
  const [selectedStock, setSelectedStock] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPriceAlertOpen, setIsPriceAlertOpen] = useState(false);
  const [selectedAlertStock, setSelectedAlertStock] = useState(null);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertType, setAlertType] = useState('above');
  const [isSubmittingAlert, setIsSubmittingAlert] = useState(false);
  
  // Feature message state
  const [showFeatureMessage, setShowFeatureMessage] = useState(false);
  const [featureMessageInfo, setFeatureMessageInfo] = useState({ name: '', returnPath: '' });
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stockToDelete, setStockToDelete] = useState(null);
  const [isDeletingStock, setIsDeletingStock] = useState(false);
  
  // Sorting and filtering
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({
    priceChange: 'all',
    volume: 'all',
    percentChange: 'all',
    marketCap: 'all'
  });
  
  // Handler functions
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const handleStockClick = (stock) => {
    setSelectedStock(stock);
    setIsDialogOpen(true);
    // Add chart data fetching logic here
    const fetchChartData = async () => {
      updateChartState(true, null); // Start loading

      try {
        const token = Cookies.get('auth_token');
      
        if (!token) {
          updateChartState(false, 'Vui lòng đăng nhập để xem dữ liệu');
          toast.error('Vui lòng đăng nhập để xem dữ liệu');
          return;
        }

        const response = await axios.get(
          `${APP_BASE_URL}/api/stock-price-history?ticketSymbol=${stock.code}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'accept': '*/*'
            }
          }
        );

        if (response.data?.value?.data) {
          const formattedData = response.data.value.data.map(item => ({
            time: Math.floor(new Date(item.tradingDate).getTime() / 1000),
            open: item.openPrice,
            high: item.highPrice,
            low: item.lowPrice,
            close: item.closePrice,
            volume: item.volume
          }));
          updateChartData(formattedData);
        } else {
          updateChartData([]);
          updateChartState(false, 'Không có dữ liệu cho mã này');
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
        updateChartData([]);
        updateChartState(false, 'Không thể tải dữ liệu biểu đồ');
        toast.error('Không thể tải dữ liệu biểu đồ');
      } finally {
        updateChartState(false);
      }
    };

    fetchChartData();
  };
  
  // Function to manually toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };
  
  // Sử dụng custom hook để quản lý state tổng hợp
  const {
    // Main stock data
    realTimeStockData,
    watchlist,
    previousValues,
    priceHistory,
    priceChangeColors,
    volumeHistory,
    chartData,
    filteredData,
    
    // UI state
    isLoading,
    isWatchlistLoading,
    isInitialWatchlistLoad,
    isSignalRUpdating,
    isChartLoading,
    chartError,
    lastTimestamp,
    currentTime,
    showWatchlist,
    
    // Performance metrics
    performanceMetrics,
    colorWorkerMetrics,
    showPerformanceMetrics,
    
    // Color cache state
    colorCache,
    animationCache,
    
    // Update functions
    updateStockData,
    updateWatchlist,
    updatePriceColors,
    updateFilteredData,
    updateChartData,
    updateLoading,
    updateWatchlistLoading,
    updateInitialWatchlistLoad,
    updateSignalRUpdating,
    updateLastTimestamp,
    updateCurrentTime,
    updateChartState,
    updateShowWatchlist,
    updatePerformanceMetrics,
    updateColorWorkerMetrics,
    togglePerformanceMetrics,
    batchUpdate,
    updatePriceHistory,
    updateVolumeHistory,
    updatePreviousValues,
    updateColorCache,
    updateAnimationCache,
    clearCaches
  } = useStock();
  
  // Store update functions in refs to access them in event handlers without dependencies
  const updateColorCacheRef = useRef(updateColorCache);
  const updateAnimationCacheRef = useRef(updateAnimationCache);
  const updateColorWorkerMetricsRef = useRef(updateColorWorkerMetrics);
  const intervalIdRef = useRef(null); // Add ref to track interval ID

  // Fix for line 294 - Make sure to avoid infinite updates from state dependencies
  // Keep refs updated - but with a dependency array so it only runs when functions change
  // This prevents the infinite update cycle caused by lacking a dependency array
  // Store the original functions in a ref to avoid dependency changes
  const functionsRef = useRef({
    updateColorCache,
    updateAnimationCache,
    updateColorWorkerMetrics
  });
  
  // Use a single useEffect with an empty dependency array to only run on mount
  useEffect(() => {
    // On mount, create a function to update the refs
    const updateRefs = () => {
      updateColorCacheRef.current = functionsRef.current.updateColorCache;
      updateAnimationCacheRef.current = functionsRef.current.updateAnimationCache;
      updateColorWorkerMetricsRef.current = functionsRef.current.updateColorWorkerMetrics;
    };
    
    // Initial update
    updateRefs();
    
    // Create a way to update the refs when the functions change
    const intervalId = setInterval(() => {
      // Only update refs if the functions have changed
      if (
        functionsRef.current.updateColorCache !== updateColorCache ||
        functionsRef.current.updateAnimationCache !== updateAnimationCache ||
        functionsRef.current.updateColorWorkerMetrics !== updateColorWorkerMetrics
      ) {
        // Update the stored functions
        functionsRef.current = {
          updateColorCache,
          updateAnimationCache,
          updateColorWorkerMetrics
        };
        
        // Update the refs
        updateRefs();
      }
    }, 1000); // Check once a second, which is fine for this use case
    
    // Store the interval ID in the ref
    intervalIdRef.current = intervalId;
    
    // Function to initialize or re-initialize workers
    const initializeWorkers = () => {
      // Terminate existing workers if any
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      if (colorWorkerRef.current) {
        colorWorkerRef.current.terminate();
      }
      
      console.log("Initializing workers");
      
      // Create the filter worker
      workerRef.current = new Worker(new URL('../workers/stockFilterWorker.js', import.meta.url), { type: 'module' });
      
      // Create the color worker
      colorWorkerRef.current = new Worker(new URL('../workers/priceColorWorker.js', import.meta.url), { type: 'module' });
      
      // Re-establish message handlers
      if (colorWorkerRef.current && handlerRef.current) {
        colorWorkerRef.current.addEventListener('message', handlerRef.current);
      }
      
      // Re-process data if we have it
      if (showWatchlist) {
        if (watchlist && watchlist.length > 0) {
          batchProcessPriceColors(watchlist, previousValues);
        }
      } else {
        if (realTimeStockData && realTimeStockData.length > 0) {
          batchProcessPriceColors(realTimeStockData, previousValues);
        }
      }
    };
    
    // Initialize workers on component mount
    initializeWorkers();
    
    // Handle visibility change to recover from tab focus issues
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("Tab became visible, checking workers");
        
        // Check if workers are still alive
        const workerAlive = workerRef.current && !workerRef.current.terminated;
        const colorWorkerAlive = colorWorkerRef.current && !colorWorkerRef.current.terminated;
        
        if (!workerAlive || !colorWorkerAlive) {
          console.log("Workers need to be reinitialized");
          initializeWorkers();
          
          // Also, refresh data if needed
          const exchangeMap = {
            'HOSE': 'hsx',
            'HNX': 'hnx'
          };
          const apiExchange = exchangeMap[selectedExchange] || 'hsx';
          
          if (showWatchlist) {
            fetchWatchlistData(false, apiExchange);
          } else {
            fetchStockData(false, apiExchange);
          }
        }
      }
    };
    
    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Setup dark mode detection
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleDarkModeChange = (e) => {
      const isDarkMode = e.matches;
      useStockWorkerStore.getState().setIsDarkMode(isDarkMode);
      // Only update based on system preference if user hasn't set an explicit preference
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(e.matches);
      }
    };
    
    if (darkModeMediaQuery.addEventListener) {
      darkModeMediaQuery.addEventListener('change', handleDarkModeChange);
    } else {
      // Fallback for older browsers
      darkModeMediaQuery.addListener(handleDarkModeChange);
    }
    
    // Cleanup on component unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      if (colorWorkerRef.current) {
        colorWorkerRef.current.terminate();
      }
      
      if (darkModeMediaQuery.removeEventListener) {
        darkModeMediaQuery.removeEventListener('change', handleDarkModeChange);
      } else {
        // Fallback for older browsers
        darkModeMediaQuery.removeListener(handleDarkModeChange);
      }
      
      // Clean up the interval
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      
      // Remove visibility change listener
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Add individual request methods for specific calculations
  const requestPriceColor = useCallback((price, refPrice, ceilPrice, floorPrice) => {
    if (!colorWorkerRef.current) return;
    
    const cacheKey = `${price}-${refPrice}-${ceilPrice}-${floorPrice}-${isDarkMode}`;
    
    // Only request if not already in cache
    if (!colorCache[cacheKey]) {
      colorWorkerRef.current.postMessage({
        action: 'getPriceColor',
        data: {
          price,
          refPrice,
          ceilPrice,
          floorPrice,
          isDarkMode,
          cacheKey
        }
      });
    }
  }, [colorCache, isDarkMode, colorWorkerRef]);
  
  const requestChangeAnimation = useCallback((currentValue, previousValue, type = 'price') => {
    if (!colorWorkerRef.current) return;
    
    const cacheKey = `${currentValue}-${previousValue}-${type}`;
    
    // Only request if not already in cache
    if (!animationCache[cacheKey]) {
      colorWorkerRef.current.postMessage({
        action: 'getChangeAnimation',
        data: {
          currentValue,
          previousValue,
          type,
          cacheKey
        }
      });
    }
  }, [animationCache, colorWorkerRef]);
  
  // Add a function to batch process price colors and animations
  const batchProcessPriceColors = useCallback((stocks, prevValues) => {
    if (!colorWorkerRef.current || !stocks || stocks.length === 0) return;
    
    // Determine if page is visible to adjust processing priority
    const pageVisible = document.visibilityState === 'visible';
    
    // Send batch request to worker
    colorWorkerRef.current.postMessage({
      action: 'batchProcess',
      data: {
        stocks: stocks,
        previousValues: prevValues,
        isDarkMode: isDarkMode,
        chunkSize: pageVisible ? 50 : 100, // Smaller chunks when visible for more responsive UI
        priority: pageVisible ? 'high' : 'low' // Lower priority when tab is not visible
      }
    });
  }, [isDarkMode, colorWorkerRef]);

  // Trigger batch processing when data changes
  useEffect(() => {
    // Đảm bảo worker đã được khởi tạo
    if (!colorWorkerRef.current) return;
    
    const dataToProcess = showWatchlist ? watchlist : realTimeStockData;
    
    // Only process if we have data
    if (dataToProcess.length > 0) {
      batchProcessPriceColors(dataToProcess, previousValues);
    }
  }, [
    realTimeStockData, 
    watchlist, 
    previousValues, 
    showWatchlist, 
    batchProcessPriceColors
  ]);

  // Hàm ánh xạ từ trường khối lượng sang trường giá
  const getPriceFieldForVolume = (volumeField) => {
    const fieldMapping = {
      'buyVolume3': 'buyPrice3',
      'buyVolume2': 'buyPrice2',
      'buyVolume1': 'buyPrice1',
      'matchVolume': 'matchPrice',
      'sellVolume1': 'sellPrice1',
      'sellVolume2': 'sellPrice2',
      'sellVolume3': 'sellPrice3',
      'totalVolume': 'matchPrice',
      'foreignBuy': 'matchPrice',
      'foreignSell': 'matchPrice'
    };
    
    return fieldMapping[volumeField] || volumeField.replace('Volume', 'Price');
  };

  /**
   * Fallback getPriceColor function in case the worker is not ready yet or fails.
   * This will prevent "getPriceColor is not defined" errors.
   * This should be identical to the worker implementation for consistency.
   */
  const getPriceColor = (price, refPrice, ceilPrice, floorPrice, isDarkMode = false) => {
    const stockWorkerStore = useStockWorkerStore();
    const cacheKey = stockWorkerStore.generateCacheKey(price, refPrice, ceilPrice, floorPrice);
    
    // Try to get from cache first
    const cachedColor = stockWorkerStore.getColorCache(cacheKey);
    if (cachedColor) {
      return cachedColor;
    }

    // If not in cache, calculate color
    const color = calculatePriceColor(price, refPrice, ceilPrice, floorPrice, isDarkMode);
    
    // Store in cache
    stockWorkerStore.setColorCache(cacheKey, color);
    return color;
  };

  /**
   * Fallback getChangeAnimation function in case the worker is not ready yet or fails.
   * This will prevent "getChangeAnimation is not defined" errors.
   * This should be identical to the worker implementation for consistency.
   */
  const getChangeAnimation = (currentValue, previousValue, type = 'price') => {
    const stockWorkerStore = useStockWorkerStore();
    const cacheKey = stockWorkerStore.generateAnimationCacheKey(currentValue, previousValue, type);
    
    // Try to get from cache first
    const cachedAnimation = stockWorkerStore.getAnimationCache(cacheKey);
    if (cachedAnimation) {
      return cachedAnimation;
    }

    // If not in cache, calculate animation
    const animation = calculateChangeAnimation(currentValue, previousValue, type);
    
    // Store in cache
    stockWorkerStore.setAnimationCache(cacheKey, animation);
    return animation;
  };

  // Helper function for price color calculation
  const calculatePriceColor = (price, refPrice, ceilPrice, floorPrice, isDarkMode) => {
    const num = (v) => parseFloat(String(v).replace(/,/g, ''));
    price = num(price);
    refPrice = num(refPrice);
    ceilPrice = num(ceilPrice);
    floorPrice = num(floorPrice);

    if (price === ceilPrice) return isDarkMode ? '#FF3B3B' : '#FF0000';
    if (price === floorPrice) return isDarkMode ? '#00C7FF' : '#0066FF';
    if (price > refPrice) return isDarkMode ? '#FF6B6B' : '#FF2626';
    if (price < refPrice) return isDarkMode ? '#39DFD6' : '#007AFF';
    return isDarkMode ? '#FFFFFF' : '#000000';
  };

  // Helper function for change animation calculation
  const calculateChangeAnimation = (currentValue, previousValue, type) => {
    if (!previousValue || currentValue === previousValue) return '';
    const current = parseFloat(String(currentValue).replace(/,/g, ''));
    const previous = parseFloat(String(previousValue).replace(/,/g, ''));
    
    if (current > previous) {
      return type === 'price' ? 'price-up' : 'volume-up';
    }
    if (current < previous) {
      return type === 'price' ? 'price-down' : 'volume-down';
    }
    return '';
  };

  // Modify the getCellClass function to use our cache
  const getCellClass = useCallback((stock, field, type = 'price') => {
    // Base styles
    const baseClass = 'border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2';
    
    // Check if stock exists
    if (!stock) return `text-gray-900 dark:text-white ${baseClass}`;
    
    // Get field value
    const fieldValue = stock[field];
    
    // Handle empty values
    if (fieldValue === null || fieldValue === undefined || fieldValue === '' || fieldValue === '--') {
      return `text-gray-900 dark:text-white ${baseClass}`;
    }

    // Get color class from cache or compute it
    let colorClass = 'text-gray-900 dark:text-white';
    const stockCode = stock.code;
    
    if (type === 'price') {
      // Try to get from cache first
      const cacheKey = `${stockCode}-${field}`;
      if (colorCache[cacheKey]) {
        colorClass = colorCache[cacheKey];
      }
    } else if (type === 'volume') {
      // For volume fields, use the price color of associated price field
      const priceField = getPriceFieldForVolume(field);
      
      if (stock[priceField]) {
        const cacheKey = `${stockCode}-${priceField}`;
        if (colorCache[cacheKey]) {
          colorClass = colorCache[cacheKey];
        }
      }
    }

    // Get animation class from cache
    let animationClass = '';
    const changeKey = `${stockCode}-${field}`;
    
    if (animationCache[changeKey]) {
      animationClass = animationCache[changeKey];
    } else if (priceChangeColors[changeKey]) {
      // Fallback to the old system
      animationClass = priceChangeColors[changeKey];
    }

    return `${colorClass} ${animationClass} ${baseClass}`;
  }, [colorCache, animationCache, priceChangeColors, getPriceFieldForVolume]);

  // Function to update CSS classes for price animation
  const handlePriceColorUpdates = useCallback((stock) => {
    if (!stock || !stock.code) return;
    
    // Copy current state
    const newPriceChangeColors = { ...priceChangeColors };
    
    // Số lượng trường giá cần theo dõi
    const priceFields = [
      'matchPrice', 'buyPrice1', 'buyPrice2', 'buyPrice3', 
      'sellPrice1', 'sellPrice2', 'sellPrice3'
    ];
    
    // Kiểm tra và cập nhật cho từng trường
    priceFields.forEach(field => {
      // Get current and previous values
      const currentValue = stock[field];
      const prevValueObj = previousValues[stock.code];
      
      if (!prevValueObj) return;
      
      const prevValue = prevValueObj[field];
      
      // Skip if no previous value to compare
      if (!prevValue) return;
      
      // Apply animation class based on price change
      if (parseFloat(currentValue) > parseFloat(prevValue)) {
        newPriceChangeColors[`${stock.code}-${field}`] = 'price-up';
      } else if (parseFloat(currentValue) < parseFloat(prevValue)) {
        newPriceChangeColors[`${stock.code}-${field}`] = 'price-down';
      } else {
        newPriceChangeColors[`${stock.code}-${field}`] = 'price-equal';
      }
    });
    
    // Update state
    updatePriceColors(newPriceChangeColors);
  }, [priceChangeColors, previousValues, updatePriceColors]);

  // Temporary debug function - có thể xóa sau khi đã sửa xong 
  const debugPriceColors = (stock) => {
    if (!stock) return;
    
    const numPrice = parseFloat(String(stock.matchPrice).replace(/,/g, ''));
    const numRefPrice = parseFloat(String(stock.ref).replace(/,/g, ''));
    const numCeilPrice = parseFloat(String(stock.ceiling).replace(/,/g, ''));
    const numFloorPrice = parseFloat(String(stock.floor).replace(/,/g, ''));
    
    console.log(`Stock: ${stock.code}`);
    console.log(`Price: ${numPrice}, Ref: ${numRefPrice}, Ceil: ${numCeilPrice}, Floor: ${numFloorPrice}`);
    console.log(`Is ceiling? ${Math.abs(numPrice - numCeilPrice) < 0.0001}`);
    console.log(`Is floor? ${Math.abs(numPrice - numFloorPrice) < 0.0001}`);
    console.log(`Is ref? ${Math.abs(numPrice - numRefPrice) < 0.0001}`);
    console.log(`Is up? ${numPrice > numRefPrice}`);
    console.log(`Is down? ${numPrice < numRefPrice}`);
    
    // Return empty to not affect UI
    return '';
  };

  // Hàm kiểm tra thay đổi khối lượng
  const getVolumeChangeClass = (stock, volumeField) => {
    // Use the ref-based volume history to avoid dependency issues
    const currentVolumeHistory = volumeHistoryRef.current;
    const oldVolume = currentVolumeHistory[stock.code];
    if (!oldVolume) return '';

    const currentVolume = stock[volumeField];
    if (currentVolume !== oldVolume) {
      return 'volume-change';
    }
    return '';
  };

  // Update the existing handleStockDataError function
  const handleStockDataError = () => {
    updateStockData([]);
    // Note: priceHistory and priceChangeColors are now part of the data state in useStockState hook
    // But they are also kept as separate state variables for backward compatibility
    updatePriceHistory({});
    updatePriceColors({});
    updateLoading(false);
  };

  // Fetch stock data first, then set up SignalR
  const fetchStockData = async (retry = false, apiExchangeOverride = null, isSignalRUpdate = false) => {
    const exchangeMap = {
      'HOSE': 'hsx',
      'HNX': 'hnx'
    };
    
    let exchange = apiExchangeOverride || exchangeMap[selectedExchange] || 'hsx';
    
    console.log('=== Fetch Stock Data ===');
    console.log(`Time: ${moment().format('HH:mm:ss.SSS')}`);
    console.log(`Selected Exchange: ${selectedExchange}`);
    console.log(`API Exchange Override: ${apiExchangeOverride}`);
    console.log(`Final Exchange Used: ${exchange}`);
    console.log(`Is SignalR Update: ${isSignalRUpdate}`);
    console.log('======================');

    try {
      // Hiển thị loading chỉ khi không phải update từ SignalR và không có cache
      if (!isSignalRUpdate && !isSignalRUpdating) {
        // Reset data trước khi fetch mới
        updateStockData([]);
        updatePriceHistory({});
        updatePriceColors({});
        
        // Kiểm tra cache
        const cachedData = getStockCache(exchange);
        if (cachedData) {
          console.log(`Using cached stock data for ${exchange}`);
          updateStockData(cachedData);
          updateLoading(false);
        } else {
          updateLoading(true);
        }
      }

      console.log(`FETCH STOCK DATA - Current tab: ${selectedExchange}, Using API exchange value: ${exchange}`);
      console.log(`Fetching ${exchange} stock data`);

      const response = await axiosInstance.get(`/api/stock/latest`, {
        params: { exchange }
      });

      console.log(`Direct API call params - exchange: ${exchange}`);
      console.log('API response for exchange:', exchange, response.data);

      if (response?.data?.value?.data) {
        // Update timestamp
        if (isSignalRUpdate) {
          const now = moment();
          const formattedTime = now.format('YYYYMMDDHHmmss');
          console.log("Setting lastTimestamp to current time:", formattedTime);
          updateLastTimestamp(formattedTime);
        } else if (response.data.value.timestamp) {
          updateLastTimestamp(response.data.value.timestamp);
        }

        const stockData = response.data.value.data;
        let newData;

        // Format data
        const formattedData = stockData.map(stock => {
          const formatValue = (value) => {
            if (value === null || value === undefined || value === '' || value === 0) {
              return '--';
            }
            return String(value);
          };

          return {
            code: stock.stockCode,
            ceiling: formatValue(stock.ceilPrice),
            floor: formatValue(stock.floorPrice),
            ref: formatValue(stock.priorClosePrice),
            buyPrice3: formatValue(stock.price3Buy),
            buyVolume3: formatValue(stock.volume3Buy),
            buyPrice2: formatValue(stock.price2Buy),
            buyVolume2: formatValue(stock.volume2Buy),
            buyPrice1: formatValue(stock.price1Buy),
            buyVolume1: formatValue(stock.volume1Buy),
            matchPrice: formatValue(stock.matchPrice),
            matchVolume: formatValue(stock.matchedOrderVolume),
            matchChange: stock.plusMinus !== null ? `${parseFloat(stock.plusMinus) > 0 ? '+' : ''}${stock.plusMinus}%` : '--',
            sellPrice1: formatValue(stock.price1Sell),
            sellVolume1: formatValue(stock.volume1Sell),
            sellPrice2: formatValue(stock.price2Sell),
            sellVolume2: formatValue(stock.volume2Sell),
            sellPrice3: formatValue(stock.price3Sell),
            sellVolume3: formatValue(stock.volume3Sell),
            totalVolume: formatValue(stock.volumeAccumulation),
            high: formatValue(stock.highPrice),
            low: formatValue(stock.lowPrice),
            foreignBuy: formatValue(stock.foreignBuyVolume),
            foreignSell: formatValue(stock.foreignSellVolume)
          };
        });

        // Update cache and state
        setStockCache(exchange, formattedData);
        updateStockData(formattedData);

        // Send data to worker for filtering
        if (workerRef.current) {
          console.log(`Sending ${formattedData.length} items to filter worker`);
          workerRef.current.postMessage({
            action: 'filter',
            data: formattedData,
            searchQuery: searchQuery,
            filters: filters,
            sortConfig: sortConfig,
            showWatchlist: showWatchlist
          });
        }

        // Process price colors in batches
        if (colorWorkerRef.current) {
          console.log(`Processing colors for ${formattedData.length} stocks`);
          batchProcessPriceColors(formattedData, previousValues);
        }

        updateLoading(false);
      } else {
        console.log(`No data in response for ${exchange}`);
        if (!isSignalRUpdate) {
          updateStockData([]);
          updateLoading(false);
        }
      }
    } catch (error) {
      console.error("Error fetching stock data:", error);
      if (!isSignalRUpdate) {
        updateStockData([]);
        updateLoading(false);
      }
      if (retry) {
        toast.error("Không thể tải dữ liệu. Vui lòng thử lại sau.");
      }
    }
  };

  // Update handleSavePriceAlert function
  const handleSavePriceAlert = async () => {
    try {
      // Validate input
      if (!validateNotificationPrice(alertPrice, selectedAlertStock, alertType)) {
        return;
      }
      
      setIsSubmittingAlert(true);
      
      // Convert alertType to API format
      let alertTypeApi;
      if (alertType === 'above') {
        alertTypeApi = 'increase';
      } else if (alertType === 'below') {
        alertTypeApi = 'decrease';
      }
      
      // Gọi API trực tiếp thay vì qua apiService để xử lý lỗi tốt hơn
      const token = Cookies.get("auth_token");
      const userId = getUserId();
      
      if (!token || !userId) {
        toast.error("Vui lòng đăng nhập để sử dụng tính năng này");
        setIsSubmittingAlert(false);
        return;
      }
      
      try {
        const response = await axios.post(
          `${APP_BASE_URL}/api/notifications`,
          {
            tickerSymbol: selectedAlertStock.code.toUpperCase(),
            userId: userId,
            price: parseFloat(alertPrice),
            type: alertTypeApi
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': '*/*'
            }
          }
        );
        
        toast.success(`Đã cài đặt thông báo khi giá ${selectedAlertStock.code} ${alertTypeApi === 'increase' ? 'tăng lên' : 'giảm xuống'} ${alertPrice}`);
        setIsPriceAlertOpen(false);
      } catch (apiError) {
        console.error("API Error:", apiError);
        
        // Xử lý lỗi từ API
        if (apiError.response?.data?.value?.message) {
          toast.error(apiError.response.data.value.message);
        } else if (apiError.response?.status === 400) {
          toast.error("Notification đã tồn tại với giá tương tự.");
        } else {
          toast.error(apiError.message || "Không thể tạo cảnh báo giá");
        }
      }
    } catch (error) {
      console.error('Error in handleSavePriceAlert:', error);
      toast.error("Đã xảy ra lỗi không mong muốn");
    } finally {
      setIsSubmittingAlert(false);
    }
  };

  // Add sort indicator component
  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return (
      <span className="ml-1">
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  // Add useEffect for real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      updateCurrentTime(moment());
    }, 1000);

    // Tự động làm mới dữ liệu mỗi 60 giây để đảm bảo dữ liệu luôn cập nhật
    // ngay cả khi SignalR không hoạt động hoặc bị mất kết nối
    const autoRefreshTimer = setInterval(() => {
      // Kiểm tra xem đã có dữ liệu chưa và thời gian lần cuối cập nhật
      // Chỉ làm mới nếu đã quá 60 giây kể từ lần cập nhật cuối
      const lastUpdateTime = lastTimestamp 
        ? moment(lastTimestamp, 'YYYYMMDDHHmmss') 
        : null;
      
      const needsRefresh = !lastUpdateTime || moment().diff(lastUpdateTime, 'seconds') > 60;
      
      if (needsRefresh) {
        console.log("Auto refreshing data due to inactivity at", moment().format('HH:mm:ss'));
        
        // Sử dụng exchange hiện tại
        const exchangeMap = {
          'HOSE': 'hsx',
          'HNX': 'hnx'
        };
        const apiExchange = exchangeMap[selectedExchange] || 'hsx';
        
        // Gọi API tương ứng mà không thông qua SignalR nhưng vẫn cập nhật thời gian hiện tại
        // bằng cách đánh dấu là isSignalRUpdate để sử dụng thời gian hiện tại
        if (showWatchlist) {
          fetchWatchlistData(false, apiExchange, true); // true = isSignalRUpdate
        } else {
          fetchStockData(false, apiExchange, true); // true = isSignalRUpdate
        }
        
        // Kiểm tra và khởi động lại SignalR nếu cần
        if (connectionRef.current && connectionRef.current.state !== 'Connected') {
          console.log("Reconnecting SignalR due to disconnected state");
          
          // Gọi hàm thiết lập SignalR lại
          const reconnectSignalR = async () => {
            try {
              const signalRService = (await import('@/api/signalRService')).default;
              const connection = await signalRService.getConnection(true); // force reconnect
              connectionRef.current = connection;
              
              // Thiết lập lại các listener
              const result = await signalRService.setupStockListeners();
              console.log("[SignalR] Reconnected, setup result:", result);
            } catch (error) {
              console.error("Error reconnecting to SignalR:", error);
            }
          };
          
          reconnectSignalR();
        }
      }
    }, 60000); // Kiểm tra mỗi 60 giây

    return () => {
      clearInterval(timer);
      clearInterval(autoRefreshTimer); // Dọn dẹp auto refresh timer
    };
  }, [updateCurrentTime, lastTimestamp, selectedExchange, showWatchlist]);

  // Add to watchlist
  const addToWatchlist = async (userId, tickerSymbol) => {
    try {
      console.log(`Adding ${tickerSymbol} to watchlist for user ${userId}`);
      
      const response = await axiosInstance.post(`/api/watchlist-stock/${userId}`, {
        tickerSymbol: tickerSymbol.toLowerCase()
      });
      
      console.log("Add to watchlist response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Add to watchlist error:", error);
      throw error;
    }
  };

  // Handle adding a stock to watchlist (this was missing)
  const handleAddToWatchlist = async (stock) => {
    try {
      const userId = getUserId();
      if (!userId) {
        toast.error("Vui lòng đăng nhập để sử dụng tính năng này");
        return;
      }

      // Get auth token from cookies
      const token = Cookies.get("auth_token");
      if (!token) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại");
        return;
      }

      // Check if stock is already in watchlist
      const isAlreadyInWatchlist = watchlist.some(item => item.code === stock.code);
      
      if (isAlreadyInWatchlist) {
        // Remove from watchlist
        const response = await axiosInstance.delete(
          `/api/watchlist-stock`,
          {
            params: {
              userId: userId,
              tickerSymbol: [stock.code]
            },
            headers: {
              'Authorization': `Bearer ${token}`,
              'accept': '*/*'
            }
          }
        );
        
        updateWatchlist(watchlist.filter(item => item.code !== stock.code));
        toast.success(`Đã xóa ${stock.code} khỏi danh sách theo dõi`);
      } else {
        // Add to watchlist with correct request format
        const response = await axiosInstance.post(
          `/api/watchlist-stock`,
          {
            userId: userId,
            tickerSymbol: [stock.code]
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'accept': '*/*',
              'Content-Type': 'application/json'
            }
          }
        );

        // Kiểm tra nếu có thông báo đã tồn tại trong watchlist
        if (response.data?.value?.message?.includes("already in the watchlist")) {
          toast.error("Mã cổ phiếu đã có trong danh sách theo dõi");
          return;
        }
        
        updateWatchlist([...watchlist, stock]);
        toast.success(`Đã thêm ${stock.code} vào danh sách theo dõi`);
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
      if (error.response?.data?.value?.message?.includes("already in the watchlist")) {
        toast.error("Mã cổ phiếu đã có trong danh sách theo dõi");
      } else if (error.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại");
      } else if (error.response?.status === 403) {
        toast.error("Bạn không có quyền thực hiện thao tác này");
      } else if (error.response?.status === 404) {
        toast.error("Không tìm thấy dữ liệu yêu cầu");
      } else if (error.response?.status >= 500) {
        toast.error("Lỗi hệ thống. Vui lòng thử lại sau");
      } else {
        toast.error("Không thể cập nhật danh sách theo dõi. Vui lòng thử lại sau");
      }
    }
  };

  // Remove from watchlist
  const removeFromWatchlist = async (userId, tickerSymbol) => {
    try {
      console.log(`Removing ${tickerSymbol} from watchlist for user ${userId}`);
      
      const response = await axiosInstance.delete(`/api/watchlist-stock/${userId}`, {
        params: {
          tickerSymbol: tickerSymbol.toLowerCase()
        }
      });
      
      console.log("Remove from watchlist response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Remove from watchlist error:", error);
      throw error;
    }
  };

  // Check if stock is in watchlist
  const isInWatchlist = async (userId, tickerSymbol) => {
    try {
      console.log(`Checking if ${tickerSymbol} is in watchlist for user ${userId}`);
      
      const response = await axiosInstance.get(`/api/watchlist-stock/${userId}`, {
        params: {
          tickerSymbol: tickerSymbol.toLowerCase()
        }
      });
      
      console.log("Check watchlist response:", response.data);
      return response.data && response.data.length > 0;
    } catch (error) {
      console.error("Check watchlist error:", error);
      return false;
    }
  };

  // Xóa hiệu ứng sau khi hiển thị
  useEffect(() => {
    if (Object.keys(priceChangeColors).length > 0) {
      // Use a shorter timeout with the chunking approach to clear animations
      // This makes the UI feel more responsive
      const timer = setTimeout(() => {
        updatePriceColors({});
      }, 800); // Reduced from 1000ms to 800ms for better responsiveness
      
      return () => clearTimeout(timer);
    }
  }, [priceChangeColors, updatePriceColors]);

  // Add state for delete confirmation dialog
  // const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // const [stockToDelete, setStockToDelete] = useState(null);
  // const [isDeletingStock, setIsDeletingStock] = useState(false);

  // Xử lý cài đặt thông báo giá
  const handleSetPriceAlert = (stock) => {
    try {
      const userId = getUserId();
      
      if (!userId) {
        toast.error("Vui lòng đăng nhập để sử dụng tính năng này", {
          position: "top-right",
          duration: 3000,
        });
        return;
      }
      
      // Kiểm tra quyền truy cập tính năng
      const hasNotificationFeature = hasFeature("Quản lý thông báo theo nhu cầu");
      if (!hasNotificationFeature) {
        // Show the feature message dialog instead of toast
        setFeatureMessageInfo({
          name: 'Thông báo giá',
          returnPath: '/stock'
        });
        setShowFeatureMessage(true);
        return;
      }

      // Cài đặt thông báo
      setSelectedAlertStock(stock);
      setAlertPrice(stock.matchPrice?.replace(/,/g, '') || stock.ref?.replace(/,/g, '') || '');
      setIsPriceAlertOpen(true);
    } catch (error) {
      console.error("Set price alert error:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại sau", {
        position: "top-right",
        duration: 3000,
      });
    }
  };

  // Add validation function for price alerts
  const validateNotificationPrice = (price, stock, type) => {
    // Check if price is empty or not a number
    if (!price || isNaN(price)) {
      toast.error('Vui lòng nhập giá hợp lệ');
      return false;
    }

    // Convert price to number for comparison
    const targetPrice = parseFloat(price);
    const currentPrice = parseFloat(stock.matchPrice?.replace(/,/g, '') || '0');
    const ceilingPrice = parseFloat(stock.ceiling?.replace(/,/g, '') || '0');
    const floorPrice = parseFloat(stock.floor?.replace(/,/g, '') || '0');

    // Basic validation
    if (targetPrice <= 0) {
      toast.error('Giá phải lớn hơn 0');
      return false;
    }

    // Validate against ceiling and floor prices
    if (targetPrice > ceilingPrice) {
      toast.error('Giá mục tiêu không được vượt quá giá trần');
      return false;
    }

    if (targetPrice < floorPrice) {
      toast.error('Giá mục tiêu không được thấp hơn giá sàn');
      return false;
    }

    return true;
  };

  // useMemo for filtered data
  const dataToDisplay = showWatchlist ? watchlist : realTimeStockData;

  // Add performance metrics state
  // const [performanceMetrics, setPerformanceMetrics] = useState({
  //   processingTime: 0,
  //   itemsIn: 0,
  //   itemsOut: 0
  // });

  // Update the worker message handler to use a ref-based approach and have proper dependencies
  // Create a ref to store the function
  const updateFilteredDataRef = useRef(updateFilteredData);
  const updatePerformanceMetricsRef = useRef(updatePerformanceMetrics);
  
  // Keep the refs updated
  useEffect(() => {
    updateFilteredDataRef.current = updateFilteredData;
    updatePerformanceMetricsRef.current = updatePerformanceMetrics;
  }, [updateFilteredData, updatePerformanceMetrics]);
  
  // Replace the problematic effect with a better implementation
  useEffect(() => {
    if (!workerRef.current) return;

    // Set up the message handler
    const handleWorkerMessage = (e) => {
      const { filteredData: workerFilteredData, stats } = e.data;
      
      // Use the refs to access the latest update functions
      // Cập nhật dữ liệu lọc
      if (updateFilteredDataRef.current) {
        updateFilteredDataRef.current(workerFilteredData);
      }
      
      // Cập nhật metrics hiệu suất
      if (stats && updatePerformanceMetricsRef.current) {
        updatePerformanceMetricsRef.current(stats);
      }
    };

    // Store the handler in a ref so we can access it in cleanup
    const currentHandler = handleWorkerMessage;
    
    // Add the event listener
    workerRef.current.addEventListener('message', currentHandler);
    
    // Return cleanup function
    return () => {
      if (workerRef.current) {
        workerRef.current.removeEventListener('message', currentHandler);
      }
    };
  }, []); // Empty dependency array to only run once on mount

  // useCallback for handlers
  const handleAddToWatchlistCb = useCallback(handleAddToWatchlist, [watchlist, getUserId]);
  const handleSetPriceAlertCb = useCallback(handleSetPriceAlert, [hasFeature, getUserId]);

  // Define debounced functions
  const debouncedFetchWatchlist = useRef(
    debounce((apiExchange) => {
      // apiExchange is already in API format ('hsx' or 'hnx'), so we use it directly
      console.log(`Creating debounced watchlist function with api exchange: ${apiExchange}`);
      // Thiết lập state để biết đang cập nhật từ SignalR
      updateSignalRUpdating(true);
      // Pass exchange to fetchWatchlistData to override selectedExchange
      // Đánh dấu là update từ SignalR để không hiển thị loading
      fetchWatchlistData(false, apiExchange, true).finally(() => {
        // Khi đã cập nhật xong, reset lại state
        updateSignalRUpdating(false);
      });
    }, 500)  // Giảm từ 1000ms xuống 500ms để cập nhật nhanh hơn
  ).current;

  // Update the debounced function to use API format directly
  const debouncedFetchStockData = useRef(
    debounce((apiExchange) => {
      // apiExchange is already in API format ('hsx' or 'hnx'), so we use it directly
      console.log(`Creating debounced function with api exchange: ${apiExchange}`);
      // Thiết lập state để biết đang cập nhật từ SignalR
      updateSignalRUpdating(true);
      // Pass exchange to fetchStockData to override selectedExchange
      // Đánh dấu là update từ SignalR để không hiển thị loading
      fetchStockData(false, apiExchange, true).finally(() => {
        // Khi đã cập nhật xong, reset lại state
        updateSignalRUpdating(false);
      });
    }, 500)  // Giảm từ 1000ms xuống 500ms để cập nhật nhanh hơn
  ).current;

  // Add SignalR event listeners (debounced, only fetch when correct exchange)
  useEffect(() => {
    const handleStockUpdate = (event) => {
      const { exchange, data, timestamp } = event.detail;
      
      // Define exchange mapping (from API format to display format)
      const exchangeMap = {
        'hsx': 'HOSE',
        'hnx': 'HNX'
      };
      
      console.log('=== Stock Update Event ===');
      console.log(`Time: ${moment().format('HH:mm:ss.SSS')}`);
      console.log(`Received exchange: ${exchange}`);
      console.log(`Selected exchange: ${selectedExchange}`);
      console.log(`Mapped received exchange: ${exchangeMap[exchange]}`);
      console.log(`Show watchlist: ${showWatchlist}`);
      console.log(`Data timestamp: ${timestamp}`);
      console.log('========================');
      
      // IMPORTANT: Only process updates for the currently selected exchange
      // First, convert the received exchange to display format (HOSE/HNX)
      const receivedExchangeDisplay = exchangeMap[exchange];
      
      // If the received update is not for the current exchange, ignore it
      if (receivedExchangeDisplay !== selectedExchange) {
        console.log(`[WebSocket] Ignoring update for ${exchange} as current tab is ${selectedExchange}`);
        return;
      }
      
      // Now we know this update is for the current exchange, process it
      if (showWatchlist) {
        console.log(`[WebSocket] Updating watchlist data for ${selectedExchange}`);
        debouncedFetchWatchlist(exchange);
      } else {
        console.log(`[WebSocket] Updating stock data for ${selectedExchange}`);
        debouncedFetchStockData(exchange);
      }
    };
    
    window.addEventListener('stockUpdate', handleStockUpdate);
    return () => {
      window.removeEventListener('stockUpdate', handleStockUpdate);
    };
  }, [selectedExchange, showWatchlist, debouncedFetchWatchlist, debouncedFetchStockData]);

  // Combined useEffect to handle both watchlist toggle and exchange changes
  useEffect(() => {
    console.log(`Data source changed - showWatchlist: ${showWatchlist}, selectedExchange: ${selectedExchange}`);
    
    // Reset states appropriately
    updateStockData([]);
    updatePriceHistory({});
    updatePriceColors({});
    setSearchQuery('');
    
    // Get the current exchange in API format
    const exchangeMap = {
      'HOSE': 'hsx',
      'HNX': 'hnx'
    };
    const apiExchange = exchangeMap[selectedExchange] || 'hsx';
    
    if (showWatchlist) {
      // Handle watchlist display
      updateWatchlist([]);
      updateInitialWatchlistLoad(true);
      console.log(`Loading watchlist - using API exchange: ${apiExchange} for selected exchange: ${selectedExchange}`);
      fetchWatchlistData(false, apiExchange, false);
    } else {
      // Handle regular stock data display
      console.log(`Loading regular stock data - using API exchange: ${apiExchange} for selected exchange: ${selectedExchange}`);
      fetchStockData(null, false, apiExchange, false);
    }
  }, [showWatchlist, selectedExchange]); // Depend on both showWatchlist and selectedExchange

  const subscribeToStockData = () => {
    try {
      const exchangeMap = {
        'HOSE': 'hsx',
        'HNX': 'hnx'
      };
      const mappedExchange = exchangeMap[selectedExchange] || 'hsx';
      
      console.log(`SUBSCRIBE - Current tab: ${selectedExchange}, mapped to: ${mappedExchange}`);
      
      if (connectionRef.current && connectionRef.current.state === 'Connected') {
        // Unsubscribe from previous channel first to avoid duplicate subscriptions
        connectionRef.current.invoke("LeaveGroup", "stock").catch(err => {
          console.error("Error leaving stock group:", err);
        });
        
        // Subscribe to the appropriate channel based on current exchange
        connectionRef.current.invoke("JoinGroup", "stock").then(() => {
          console.log(`Successfully subscribed to stock updates for ${mappedExchange}`);
        }).catch(err => {
          console.error("Error joining stock group:", err);
        });
      } else {
        console.warn("Cannot subscribe: SignalR connection not established");
      }
    } catch (error) {
      console.error("Error in subscribeToStockData:", error);
    }
  };

  // Define animations CSS
  const animations = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes slideIn {
      from { transform: translateX(-10px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    @keyframes borderSlide {
      from { width: 0; }
      to { width: 100%; }
    }

    @keyframes glowPulse {
      0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); }
      70% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0); }
      100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Price change animations - Optimized for chunking */
    @keyframes priceUp {
      0% { 
        background-color: rgba(0, 255, 0, 0.4);
        transform: scale(1.1);
        border-right: 1px solid #333;
      }
      50% {
        background-color: rgba(0, 255, 0, 0.2);
        transform: scale(1.05);
        border-right: 1px solid #333;
      }
      100% { 
        background-color: transparent;
        transform: scale(1);
        border-right: 1px solid #333;
      }
    }

    @keyframes priceDown {
      0% { 
        background-color: rgba(255, 0, 0, 0.4);
        transform: scale(1.1);
        border-right: 1px solid #333;
      }
      50% {
        background-color: rgba(255, 0, 0, 0.2);
        transform: scale(1.05);
        border-right: 1px solid #333;
      }
      100% { 
        background-color: transparent;
        transform: scale(1);
        border-right: 1px solid #333;
      }
    }

    @keyframes priceEqual {
      0% { 
        background-color: rgba(255, 255, 0, 0.3);
        transform: scale(1.05);
        border-right: 1px solid #333;
      }
      100% { 
        background-color: transparent;
        transform: scale(1);
        border-right: 1px solid #333;
      }
    }
    
    /* Volume change animations - Optimized for chunking */
    @keyframes volume-up {
      0% { 
        background-color: rgba(0, 255, 0, 0.25);
        transform: scale(1.05);
        border-right: 1px solid #333;
      }
      100% { 
        background-color: transparent;
        transform: scale(1);
        border-right: 1px solid #333;
      }
    }

    @keyframes volume-down {
      0% { 
        background-color: rgba(255, 0, 0, 0.25);
        transform: scale(1.05);
        border-right: 1px solid #333;
      }
      100% { 
        background-color: transparent;
        transform: scale(1);
        border-right: 1px solid #333;
      }
    }

    .volume-up {
      animation: volume-up 1.5s ease-out;
    }

    .volume-down {
      animation: volume-down 1.5s ease-out;
    }

    .price-up {
      animation: priceUp 1.5s ease-out;
    }

    .price-down {
      animation: priceDown 1.5s ease-out;
    }

    .price-equal {
      animation: priceEqual 1.5s ease-out;
    }

    /* Table styles */
    .stock-table-container {
      height: calc(83vh - 132px);
      overflow: auto;
      position: relative;
    }

    .stock-table-container thead {
      position: sticky;
      top: 0;
      z-index: 10;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
    }
    
    .stock-table-container th {
      background-color: #f9fafb; /* light mode background */
    }

    /* Dark mode styles */
    .dark .stock-table-container th {
      background-color: #1a1a1a; /* dark mode background */
    }
  `;

  // Thêm hàm để kiểm tra và xử lý chuyển đổi chế độ danh sách theo dõi
  const handleToggleWatchlist = () => {
    const newValue = !showWatchlist;
    updateShowWatchlist(newValue);
    
    if (newValue) {
      // Khi chuyển sang chế độ watchlist, đặt lại isInitialWatchlistLoad nếu watchlist trống
      if (watchlist.length === 0) {
        updateInitialWatchlistLoad(true);
      }
      // Don't call fetchWatchlistData directly here - this will be handled by the useEffect 
      // that watches showWatchlist changes
    }
  };

  // Xử lý thay đổi sàn giao dịch
  const handleExchangeChange = (exchangeId) => {
    console.log('Exchange change triggered:', exchangeId);
    setSelectedExchange(exchangeId);
    
    // Reset các trạng thái 
    if (showWatchlist) {
      updateInitialWatchlistLoad(true);
    } else {
      updateLoading(true);
      updateStockData([]);
    }
    
    // Định nghĩa exchangeMap
    const exchangeMap = {
      'HOSE': 'hsx',
      'HNX': 'hnx'
    };
    
    const apiExchange = exchangeMap[exchangeId];
    console.log('Mapped API exchange:', apiExchange);
    
    // Delay để UI có thể cập nhật trước
    setTimeout(() => {
      if (showWatchlist) {
        console.log('Fetching watchlist data for exchange:', apiExchange);
        fetchWatchlistData(false, apiExchange);
      } else {
        console.log('Fetching stock data for exchange:', apiExchange);
        fetchStockData(null, false, apiExchange);
      }
    }, 100);
  };

  // Add this function to fetch watchlist data
  const fetchWatchlistData = async (retry = false, apiExchangeOverride = null, isSignalRUpdate = false) => {
    // Define exchangeMap at the top of the function to ensure it's available in catch block
    const exchangeMap = {
      'HOSE': 'hsx',
      'HNX': 'hnx'
    };
    
    // If apiExchangeOverride is provided, use it directly (it's already in API format)
    // Otherwise, map from the selected exchange display name to API format
    let exchange = apiExchangeOverride || exchangeMap[selectedExchange] || 'hsx';
    
    try {
      // Kiểm tra quyền truy cập tính năng trước khi gọi API
      const hasNotificationFeature = hasFeature("Quản lý thông báo theo nhu cầu");
      if (!hasNotificationFeature) {
        // Nếu không có quyền truy cập, không tiếp tục thực hiện gọi API
        // Chuyển về chế độ xem tất cả
        updateShowWatchlist(false);
        setFeatureMessageInfo({
          name: 'Danh sách theo dõi và Thông báo',
          returnPath: '/stock'
        });
        setShowFeatureMessage(true);
        return;
      }
      
      const userId = getUserId();
      if (!userId) {
        toast.error("Vui lòng đăng nhập để xem danh sách theo dõi");
        updateWatchlistLoading(false);
        updateInitialWatchlistLoad(false);
        return;
      }

      const token = Cookies.get("auth_token");
      if (!token) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại");
        updateWatchlistLoading(false);
        updateInitialWatchlistLoad(false);
        return;
      }
      
      // Kiểm tra cache trước khi gọi API
      const cachedData = getWatchlistCache(exchange, userId);
      
      // Chỉ hiển thị loading khi:
      // 1. Đang tải lần đầu
      // 2. Không phải là cập nhật từ SignalR
      // 3. Không phải đang trong trạng thái isSignalRUpdating
      if (isInitialWatchlistLoad && !isSignalRUpdate && !isSignalRUpdating) {
        if (cachedData) {
          console.log(`Using cached watchlist data for ${exchange} and user ${userId}`);
          
          // Sử dụng dữ liệu cache ngay lập tức
          updateWatchlist(cachedData);
          updateWatchlistLoading(false);
          updateInitialWatchlistLoad(false);
          
          // Vẫn tiếp tục gọi API để cập nhật dữ liệu mới nhất
        } else {
          // Không có cache, hiển thị loading
          updateWatchlistLoading(true);
        }
      }

      // Log the selected exchange and mapped exchange value
      console.log(`FETCH WATCHLIST - Current tab: ${selectedExchange}, Using API exchange value: ${exchange}`);

      // Use axiosInstance directly with our exchange value
      const response = await axiosInstance.get(`/api/watchlist-stock/${userId}`, {
        params: {
          exchange: exchange // Do not modify this value - we've already mapped it correctly
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Watchlist Direct API call params - exchange: ${exchange}`);

      // Nếu là cập nhật từ SignalR, cập nhật timestamp là thời gian hiện tại
      if (isSignalRUpdate) {
        // Format thời gian hiện tại thành YYYYMMDDHHmmss
        const now = moment();
        const formattedTime = now.format('YYYYMMDDHHmmss');
        console.log("Setting lastTimestamp for watchlist to current time:", formattedTime);
        updateLastTimestamp(formattedTime);
      }
      // Nếu response trả về timestamp, sử dụng nó khi không phải update từ SignalR
      else if (response?.data?.value?.timestamp) {
        updateLastTimestamp(response.data.value.timestamp);
      }

      if (response?.data?.value?.data) {
        const newWatchlistStocks = response.data.value.data.map(stock => ({
          code: stock.stockCode,
          ceiling: stock.ceilPrice?.toString() || '--',
          floor: stock.floorPrice?.toString() || '--',
          ref: stock.priorClosePrice?.toString() || '--',
          buyPrice3: stock.price3Buy?.toString() || '--',
          buyVolume3: stock.volume3Buy?.toString() || '--',
          buyPrice2: stock.price2Buy?.toString() || '--',
          buyVolume2: stock.volume2Buy?.toString() || '--',
          buyPrice1: stock.price1Buy?.toString() || '--',
          buyVolume1: stock.volume1Buy?.toString() || '--',
          matchPrice: stock.matchPrice?.toString() || '--',
          matchVolume: stock.matchedOrderVolume?.toString() || '--',
          matchChange: stock.plusMinus !== null ? `${parseFloat(stock.plusMinus) > 0 ? '+' : ''}${stock.plusMinus}%` : '--',
          sellPrice1: stock.price1Sell?.toString() || '--',
          sellVolume1: stock.volume1Sell?.toString() || '--',
          sellPrice2: stock.price2Sell?.toString() || '--',
          sellVolume2: stock.volume2Sell?.toString() || '--',
          sellPrice3: stock.price3Sell?.toString() || '--',
          sellVolume3: stock.volume3Sell?.toString() || '--',
          totalVolume: stock.volumeAccumulation?.toString() || '--',
          high: stock.highPrice?.toString() || '--',
          low: stock.lowPrice?.toString() || '--',
          foreignBuy: stock.foreignBuyVolume?.toString() || '--',
          foreignSell: stock.foreignSellVolume?.toString() || '--'
        }));
        
        // Lưu dữ liệu vào cache sau khi nhận được từ API
        setWatchlistCache(exchange, userId, newWatchlistStocks);
        
        // If this is an update, merge with existing data and apply animations
        if (!isInitialWatchlistLoad) {
          updateWatchlist(prevList => {
            const updatedList = [...prevList];
            let newPreviousValues = { ...previousValues };
            let newPriceChangeColors = { ...priceChangeColors };
            let hasChanges = false;
            
            // Update existing items with new values and track changes for animation
            newWatchlistStocks.forEach(newStock => {
              const existingIndex = updatedList.findIndex(item => item.code === newStock.code);
              
              if (existingIndex !== -1) {
                const existingStock = updatedList[existingIndex];
                const stockCode = newStock.code;
                
                // If we don't have previous values for this stock, initialize it
                if (!newPreviousValues[stockCode]) {
                  newPreviousValues[stockCode] = {};
                }
                
                // Check for price changes and apply animations
                const priceFields = [
                  'matchPrice', 'buyPrice1', 'buyPrice2', 'buyPrice3', 
                  'sellPrice1', 'sellPrice2', 'sellPrice3'
                ];
                
                priceFields.forEach(field => {
                  const currentValue = parseFloat(newStock[field]?.replace(/,/g, '') || '0');
                  const oldValue = parseFloat(existingStock[field]?.replace(/,/g, '') || '0');
                  
                  // Only register changes for valid numbers
                  if (!isNaN(currentValue) && !isNaN(oldValue) && currentValue !== oldValue) {
                    hasChanges = true;
                    
                    // Store the previous value
                    newPreviousValues[stockCode][field] = existingStock[field];
                    
                    // Apply animation class
                    if (currentValue > oldValue) {
                      newPriceChangeColors[`${stockCode}-${field}`] = 'price-up';
                    } else if (currentValue < oldValue) {
                      newPriceChangeColors[`${stockCode}-${field}`] = 'price-down';
                    }
                  }
                });
                
                // Update the stock with new values
                updatedList[existingIndex] = newStock;
              } else {
                // Add new stock to the list
                updatedList.push(newStock);
              }
            });
            
            // Batch update state if we detected changes
            if (hasChanges) {
              updatePreviousValues(newPreviousValues);
              updatePriceColors(newPriceChangeColors);
            }
            
            return updatedList;
          });
        } else {
          // Initial load, just set the data
          updateWatchlist(newWatchlistStocks);
        }
      } else if (isInitialWatchlistLoad) {
        // Only clear on initial load if no data
        updateWatchlist([]);
      }
      
      // Sau khi hoàn thành lần tải đầu tiên, cập nhật trạng thái
      if (isInitialWatchlistLoad) {
        updateWatchlistLoading(false);
        updateInitialWatchlistLoad(false);
      }
    } catch (error) {
      // No need to redefine exchangeMap here since it's available from the top of the function
      if (error.response && error.response.status === 404 && exchange === 'hnx' && !retry) {
        // Nếu là HNX và bị 404, thử lại 1 lần sau 2 giây
        setTimeout(() => fetchWatchlistData(true), 2000);
        if (isInitialWatchlistLoad) {
          updateWatchlistLoading(false);
          updateInitialWatchlistLoad(false);
        }
        return;
      } else if (error.response && error.response.status === 404) {
        // Nếu là 404 (không phải HNX), chỉ clear data nếu là lần đầu tải, không hiện lỗi nặng
        if (isInitialWatchlistLoad) {
          updateWatchlistLoading(false);
          updateInitialWatchlistLoad(false);
        }
        return;
      }
      // Các lỗi khác
      if (isInitialWatchlistLoad) {
        updateWatchlistLoading(false);
        updateInitialWatchlistLoad(false);
      }
      toast.error("Không thể tải danh sách theo dõi");
    }
  };

  // Thêm useEffect để cập nhật thời gian thực mỗi giây
  useEffect(() => {
    // Cập nhật thời gian hiển thị mỗi giây
    const interval = setInterval(() => {
      updateCurrentTime(moment());
    }, 1000);
    
    // Cleanup interval khi component unmount
    return () => clearInterval(interval);
  }, [updateCurrentTime]);
  
  // Thêm useEffect để log khi lastTimestamp thay đổi để debug
  useEffect(() => {
    // Use the lastTimestamp value directly, not the ref
    if (lastTimestamp) {
      console.log("Last timestamp updated:", lastTimestamp);
      console.log("Formatted time:", moment(lastTimestamp, 'YYYYMMDDHHmmss').format('HH:mm:ss'));
    }
  }, [lastTimestamp]); // Only run when lastTimestamp changes

  // Add useEffect to setup SignalR connection
  useEffect(() => {
    // Khởi tạo và thiết lập kết nối SignalR khi component mount
    const setupSignalR = async () => {
      try {
        console.log("[SignalR] Initializing SignalR connection for StockDerivatives");
        // Import SignalR service
        const signalRService = (await import('@/api/signalRService')).default;
        
        // Đảm bảo kết nối được thiết lập
        const connection = await signalRService.getConnection();
        connectionRef.current = connection;
        
        // Thiết lập các listener cho stock updates
        const result = await signalRService.setupStockListeners();
        console.log("[SignalR] Setup stock listeners result:", result);
        
        if (result.success) {
          console.log(`[SignalR] Successfully connected with ID: ${result.status?.connectionId}`);
          console.log(`[SignalR] HSX listener registered: ${result.status?.hsx}`);
          console.log(`[SignalR] HNX listener registered: ${result.status?.hnx}`);
        }
      } catch (error) {
        console.error("[SignalR] Error setting up SignalR in StockDerivatives:", error);
      }
    };
    
    // Gọi hàm thiết lập
    setupSignalR();
    
    // Cleanup khi component unmount
    return () => {
      // Không cần tắt kết nối vì có thể được sử dụng ở các component khác
      console.log("[SignalR] StockDerivatives component unmounting");
    };
  }, []); // Chỉ chạy một lần khi component mount

  // Thêm state để lưu trữ dữ liệu trước đó khi tìm kiếm
  const [prevDisplayedStocks, setPrevDisplayedStocks] = useState({});
  const prevDataRef = useRef({}); // Reference to avoid dependency cycle
  const animCacheRef = useRef(animationCache);
  const updatePriceColorsRef = useRef(updatePriceColors);
  
  // Keep refs updated with latest values
  useEffect(() => {
    animCacheRef.current = animationCache;
    updatePriceColorsRef.current = updatePriceColors;
  }, [animationCache, updatePriceColors]);
  
  // Create refs for filtered data to avoid dependency cycles
  const filteredDataRef = useRef(filteredData);
  
  // Keep the filtered data ref updated
  useEffect(() => {
    filteredDataRef.current = filteredData;
  }, [filteredData]);
  
  // Replace the animation effect with a more stable implementation
  // This useEffect monitors changes in the filtered data to trigger animations
  useEffect(() => {
    // Skip processing if no data
    if (!filteredDataRef.current || filteredDataRef.current.length === 0) return;
    
    // Get current filtered data from the ref
    const currentFilteredData = filteredDataRef.current;
    
    // Check if the data has actually changed to avoid unnecessary processing
    const currentDataKey = currentFilteredData.map(s => s.code).join(',');
    const prevDataKey = Object.keys(prevDataRef.current).join(',');
    
    // Only process if the data composition has changed
    if (currentDataKey === prevDataKey) {
      // Check if any values have changed before processing
      let hasChanges = false;
      for (const stock of currentFilteredData) {
        if (!stock.code) continue;
        const prevStock = prevDataRef.current[stock.code];
        if (!prevStock) {
          hasChanges = true;
          break;
        }
        
        // Check key fields for changes
        if (stock.matchPrice !== prevStock.matchPrice || 
            stock.totalVolume !== prevStock.totalVolume) {
          hasChanges = true;
          break;
        }
      }
      
      if (!hasChanges) return; // Skip if no actual changes
    }
    
    // Use requestAnimationFrame instead of setTimeout for better performance
    const animationFrameId = requestAnimationFrame(() => {
      const newDisplayedStocks = {};
      
      currentFilteredData.forEach(stock => {
        if (!stock.code) return;
        
        // Create a copy of the current stock to store
        newDisplayedStocks[stock.code] = {...stock};
        
        // If there is previous data and it differs from the current data, trigger animation
        const prevStockRef = prevDataRef.current[stock.code];
        if (prevStockRef) {
          // List of fields to check
          const fieldsToCheck = [
            'matchPrice', 'buyPrice1', 'buyPrice2', 'buyPrice3',
            'sellPrice1', 'sellPrice2', 'sellPrice3',
            'buyVolume1', 'buyVolume2', 'buyVolume3',
            'sellVolume1', 'sellVolume2', 'sellVolume3'
          ];
          
          // Get latest values from refs
          const animCache = animCacheRef.current;
          const updateColors = updatePriceColorsRef.current;
          const colorWorker = colorWorkerRef.current;
          
          // Check each field and create an effect if there is a change
          fieldsToCheck.forEach(field => {
            if (stock[field] !== prevStockRef[field]) {
              const isPrice = field.includes('Price');
              const currentValue = parseFloat(String(stock[field]).replace(/,/g, ''));
              const previousValue = parseFloat(String(prevStockRef[field]).replace(/,/g, ''));
              
              // Only trigger animation when there is a significant change
              if (!isNaN(currentValue) && !isNaN(previousValue) && currentValue !== previousValue) {
                const fieldType = isPrice ? 'price' : 'volume';
                
                // Instead of calling getChangeAnimation directly, use the worker
                const cacheKey = `${currentValue}-${previousValue}-${fieldType}`;
                
                // Check if animation is already in cache
                if (animCache && animCache[cacheKey]) {
                  // Use from cache
                  if (updateColors) {
                    updateColors(prev => ({
                      ...prev,
                      [`${stock.code}-${field}`]: animCache[cacheKey]
                    }));
                  }
                } else if (colorWorker) {
                  // Request from worker only if available
                  colorWorker.postMessage({
                    action: 'getChangeAnimation',
                    data: {
                      currentValue,
                      previousValue,
                      type: fieldType,
                      cacheKey: `${stock.code}-${field}`
                    }
                  });
                }
              }
            }
          });
        }
      });
      
      // Update ref first to avoid dependency cycle
      prevDataRef.current = {...newDisplayedStocks};
      
      // Then update state for component rendering
      setPrevDisplayedStocks(newDisplayedStocks);
    });
    
    // Clean up
    return () => cancelAnimationFrame(animationFrameId);
  }, [filteredData]); // Only depend on filteredData to trigger the effect, but use refs inside

  // Tạo một hàm debounced để xử lý cập nhật tìm kiếm
  const debouncedSetSearchQuery = useRef(
    debounce((value) => {
      setSearchQuery(value);
    }, 300)
  ).current;

  // Add state for showing performance metrics
  // const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);

  // // Add performance metrics for color worker
  // const [colorWorkerMetrics, setColorWorkerMetrics] = useState({
  //   processingTime: 0,
  //   stockCount: 0
  // });

  // Remove this console.log that could cause extra renders
  // console.log("Checking previousValues:", previousValues);

  // Get table data based on active tab and filtering
  const getTableData = useCallback(() => {
    // Default to using the worker's filtered data
    if (filteredData?.length > 0) {
      return filteredData;
    }
    
    // In case filtering hasn't been applied yet, return the appropriate raw data
    // Ensure we always return an array
    if (showWatchlist) {
      return Array.isArray(watchlist) ? watchlist : [];
    } else {
      return Array.isArray(realTimeStockData) ? realTimeStockData : [];
    }
  }, [filteredData, watchlist, realTimeStockData, showWatchlist]);

  // Render the tables
  const renderTables = () => {
    // Only render if we have data
    if ((!showWatchlist && realTimeStockData.length === 0) || (showWatchlist && watchlist.length === 0)) {
      return <div className="flex flex-col items-center justify-center h-96">
        <img src="/empty-data.svg" alt="No data" className="w-48 h-48 mb-4 opacity-50" />
        <p className="text-gray-500 dark:text-gray-400 text-center mb-2">Không có dữ liệu để hiển thị</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm text-center">Vui lòng đợi kết nối dữ liệu</p>
      </div>;
    }

    // Call appropriate data source based on active tab
    // const filteredData = filteredDataFromWorker;
  };

  // Additional refs for all functions that are dependencies in useEffects
  const updateCurrentTimeRef = useRef(updateCurrentTime);
  const lastTimestampRef = useRef(lastTimestamp);
  
  // Update all function refs to their latest versions - this ensures they're always current
  useEffect(() => {
    updateCurrentTimeRef.current = updateCurrentTime;
    lastTimestampRef.current = lastTimestamp;
  }, [updateCurrentTime, lastTimestamp]);
  
  // Fix the timer update effect to use the ref instead of the function directly
  useEffect(() => {
    // Cập nhật thời gian hiển thị mỗi giây
    const interval = setInterval(() => {
      // Use the ref to the function to avoid dependency on the function itself
      if (updateCurrentTimeRef.current) {
        updateCurrentTimeRef.current(moment());
      }
    }, 1000);
    
    // Cleanup interval khi component unmount
    return () => clearInterval(interval);
  }, []); // Empty dependency array - only run once on mount
  
  // Fix the lastTimestamp logging effect to use the ref
  useEffect(() => {
    const currentTimestamp = lastTimestampRef.current;
    if (currentTimestamp) {
      console.log("Last timestamp updated:", currentTimestamp);
      console.log("Formatted time:", moment(currentTimestamp, 'YYYYMMDDHHmmss').format('HH:mm:ss'));
    }
  }, [lastTimestampRef.current]); // Only run when the ref's current value changes

  // Fix the setupSignalR effect - already OK with empty dependency array
  
  // Fix the volume history effect using a ref-based approach
  const updateVolumeHistoryRef = useRef(updateVolumeHistory);
  const volumeHistoryRef = useRef(volumeHistory);
  const realTimeStockDataRef = useRef(realTimeStockData);
  
  // Keep all refs updated
  useEffect(() => {
    updateVolumeHistoryRef.current = updateVolumeHistory;
    volumeHistoryRef.current = volumeHistory;
    realTimeStockDataRef.current = realTimeStockData;
  }, [updateVolumeHistory, volumeHistory, realTimeStockData]);
  
  // Replace the volume history effect with a ref-based approach
  useEffect(() => {
    // Skip if no data
    if (!realTimeStockDataRef.current || realTimeStockDataRef.current.length === 0) {
      return;
    }
    
    const currentRealTimeData = realTimeStockDataRef.current;
    const currentVolumeHistory = volumeHistoryRef.current;
    const currentUpdateFn = updateVolumeHistoryRef.current;
    
    // Process volume changes
    const newVolumeHistory = { ...currentVolumeHistory };
    let hasChanges = false;
    
    currentRealTimeData.forEach(stock => {
      const oldVolume = currentVolumeHistory[stock.code];
      if (oldVolume) {
        const currentVolume = parseFloat(stock.totalVolume.replace(/,/g, ''));
        const previousVolume = parseFloat(oldVolume.replace(/,/g, ''));
        
        if (currentVolume !== previousVolume) {
          newVolumeHistory[stock.code] = stock.totalVolume;
          hasChanges = true;
        }
      } else {
        newVolumeHistory[stock.code] = stock.totalVolume;
        hasChanges = true;
      }
    });
    
    // Only update if necessary
    if (hasChanges && currentUpdateFn) {
      currentUpdateFn(newVolumeHistory);
    }
  }, [realTimeStockData]); // Only re-run when realTimeStockData changes, but use refs inside

  // A separate solution for completely eliminating any chance of dependency cycles:
  // Initialize the refs once on component mount with the current functions
  useEffect(() => {
    // Create a single message handler that will use only refs and never re-create
    const handleColorWorkerMessage = (e) => {
      const { action, result, results, stats, chunkIndex, chunkResults, batchTimestamp } = e.data;
      
      // Kiểm tra batch timestamp (nếu có) để bỏ qua các batch cũ
      if (batchTimestamp && batchTimestamp < latestBatchTimestampRef.current) {
        console.log(`[Main] Ignoring outdated batch: ${batchTimestamp} < ${latestBatchTimestampRef.current}`);
        return;
      }
      
      // Cập nhật latest batch timestamp khi nhận được batch mới
      if (batchTimestamp && batchTimestamp > latestBatchTimestampRef.current) {
        latestBatchTimestampRef.current = batchTimestamp;
      }
      
      if (action === 'priceColorResult') {
        // Make sure we have all necessary data
        if (result && result.colorClass) {
          // Use function form to get latest state and avoid stale closures
          const updateFn = updateColorCacheRef.current;
          if (updateFn) {
            updateFn(prev => ({...prev, [result.cacheKey]: result.colorClass}));
          }
        }
      }
      else if (action === 'animationResult') {
        // Make sure we have all necessary data
        if (result && result.animClass) {
          const updateFn = updateAnimationCacheRef.current;
          if (updateFn) {
            updateFn(prev => ({...prev, [result.cacheKey]: result.animClass}));
          }
        }
      }
      else if (action === 'chunkResults') {
        // Handle chunk processing results as they arrive
        if (!results) return;
        
        // Get current update functions from refs
        const updateColorFn = updateColorCacheRef.current;
        const updateAnimFn = updateAnimationCacheRef.current;
        
        // Process this chunk's results immediately without waiting for all chunks
        if (updateColorFn) {
          updateColorFn(prevCache => {
            const newCache = {...prevCache};
            let hasChanges = false;
            
            // Process each stock's colors in this chunk
            Object.keys(results).forEach(stockCode => {
              const stockColors = results[stockCode].priceColors || {};
              Object.keys(stockColors).forEach(field => {
                const cacheKey = `${stockCode}-${field}`;
                if (newCache[cacheKey] !== stockColors[field]) {
                  newCache[cacheKey] = stockColors[field];
                  hasChanges = true;
                }
              });
            });
            
            return hasChanges ? newCache : prevCache;
          });
        }
        
        if (updateAnimFn) {
          updateAnimFn(prevCache => {
            const newCache = {...prevCache};
            let hasChanges = false;
            
            // Process each stock's animations in this chunk
            Object.keys(results).forEach(stockCode => {
              const stockAnimations = results[stockCode].animations || {};
              Object.keys(stockAnimations).forEach(field => {
                const cacheKey = `${stockCode}-${field}`;
                if (newCache[cacheKey] !== stockAnimations[field]) {
                  newCache[cacheKey] = stockAnimations[field];
                  hasChanges = true;
                }
              });
            });
            
            return hasChanges ? newCache : prevCache;
          });
        }
        
        // No need to update metrics for individual chunks
      }
      else if (action === 'batchResults') {
        // Handle batch processing final results
        // Update performance metrics through ref
        const updateMetricsFn = updateColorWorkerMetricsRef.current;
        if (stats && updateMetricsFn) {
          updateMetricsFn({
            processingTime: stats.processingTime,
            stockCount: stats.stockCount
          });
          
          console.log(`[Color Worker] Processed ${stats.stockCount} stocks in ${stats.processingTime}ms (${stats.chunkCount} chunks)`);
        }
      }
    };
    
    // Set up the handler and attach event listener only once
    handlerRef.current = handleColorWorkerMessage;
    
    if (colorWorkerRef.current && handlerRef.current) {
      colorWorkerRef.current.addEventListener('message', handlerRef.current);
    }
    
    // Clean up on unmount
    return () => {
      if (colorWorkerRef.current && handlerRef.current) {
        colorWorkerRef.current.removeEventListener('message', handlerRef.current);
      }
    };
  }, []); // Empty dependency - only run on mount

  // Fix the effect that updates previous values when real-time data changes
  // Create stable refs for the dependencies
  const updatePreviousValuesRef = useRef(updatePreviousValues);
  
  // Keep the ref updated without causing re-renders
  useEffect(() => {
    updatePreviousValuesRef.current = updatePreviousValues;
  }, [updatePreviousValues]);
  
  // Replace the problematic effect with one that uses refs and has stable dependencies
  useEffect(() => {
    // Skip if no data
    if (!realTimeStockData || realTimeStockData.length === 0) return;
    
    // Create a function that will run after a small delay to batch updates
    // This helps prevent rapid successive updates
    const processUpdates = () => {
      // Make a new object to collect all changes
      const newPreviousValues = { ...previousValues };
      let hasChanges = false;
      
      realTimeStockData.forEach(stock => {
        if (!stock.code) return;
        
        // Ensure we have an object for this stock
        if (!newPreviousValues[stock.code]) {
          newPreviousValues[stock.code] = {};
          hasChanges = true;
        }
        
        // Track all fields we care about
        const fieldsToTrack = [
          'matchPrice', 'matchVolume',
          'buyPrice3', 'buyVolume3',
          'buyPrice2', 'buyVolume2',
          'buyPrice1', 'buyVolume1',
          'sellPrice1', 'sellVolume1',
          'sellPrice2', 'sellVolume2',
          'sellPrice3', 'sellVolume3',
          'totalVolume', 'foreignBuy', 'foreignSell'
        ];
        
        // Process each field
        fieldsToTrack.forEach(field => {
          if (stock[field] !== undefined) {
            // Check if value has changed before updating
            if (newPreviousValues[stock.code][field] !== stock[field]) {
              // Update the previous value
              newPreviousValues[stock.code][field] = stock[field];
              hasChanges = true;
              
              // Request animation from worker if available
              if (colorWorkerRef.current) {
                const isPrice = field.includes('Price');
                const fieldType = isPrice ? 'price' : 'volume';
                const currentValue = stock[field];
                const previousValue = newPreviousValues[stock.code][field];
                
                // Only send request if we have both values
                if (currentValue && previousValue) {
                  colorWorkerRef.current.postMessage({
                    action: 'getChangeAnimation',
                    data: {
                      currentValue,
                      previousValue,
                      type: fieldType,
                      cacheKey: `${stock.code}-${field}`
                    }
                  });
                }
              }
            }
          }
        });
      });
      
      // Only update state if we actually have changes
      if (hasChanges && updatePreviousValuesRef.current) {
        updatePreviousValuesRef.current(newPreviousValues);
      }
    };
    
    // Use requestAnimationFrame to batch updates in sync with browser rendering
    // This helps prevent too many successive state updates
    const frameId = requestAnimationFrame(processUpdates);
    
    // Clean up
    return () => cancelAnimationFrame(frameId);
  }, [realTimeStockData]); // Only depend on realTimeStockData, using refs for other dependencies

  // Replace the original getFilteredData function call with a useEffect to send data to worker
  // Use refs to avoid dependency issues - use the existing realTimeStockDataRef to avoid duplication
  const watchlistRef = useRef(watchlist);
  const searchQueryRef = useRef(searchQuery);
  const filtersRef = useRef(filters);
  const sortConfigRef = useRef(sortConfig);
  const showWatchlistRef = useRef(showWatchlist);
  
  // Keep refs updated
  useEffect(() => {
    watchlistRef.current = watchlist;
    realTimeStockDataRef.current = realTimeStockData; // Use existing ref
    searchQueryRef.current = searchQuery;
    filtersRef.current = filters;
    sortConfigRef.current = sortConfig;
    showWatchlistRef.current = showWatchlist;
  }, [watchlist, realTimeStockData, searchQuery, filters, sortConfig, showWatchlist]);
  
  // Send data to worker at a throttled rate to avoid too many updates
  useEffect(() => {
    if (!workerRef.current) return;
    
    // Use a throttled approach to send data to the worker
    const sendDataToWorker = () => {
      const currentShowWatchlist = showWatchlistRef.current;
      const dataToFilter = currentShowWatchlist ? watchlistRef.current : realTimeStockDataRef.current;
      
      // Only send data to worker if we have data to filter
      if (dataToFilter && dataToFilter.length > 0) {
        workerRef.current.postMessage({
          action: 'filter',
          data: dataToFilter,
          searchQuery: searchQueryRef.current,
          filters: filtersRef.current,
          sortConfig: sortConfigRef.current,
          showWatchlist: currentShowWatchlist
        });
      } else if (updateFilteredDataRef.current) {
        // If no data to filter, just set empty array directly
        updateFilteredDataRef.current([]);
      }
    };
    
    // Use requestAnimationFrame for a throttled approach
    const frameId = requestAnimationFrame(sendDataToWorker);
    
    return () => cancelAnimationFrame(frameId);
  }, [realTimeStockData, watchlist, searchQuery, filters, sortConfig, showWatchlist]);

  // Update worker effect to handle data properly
  useEffect(() => {
    if (!workerRef.current) return;

    const handleWorkerMessage = (e) => {
      const { filteredData: workerFilteredData, stats } = e.data;
      
      console.log(`[Worker] Received filtered data: ${workerFilteredData.length} items`);
      
      // Only update if we have data and it's for the current exchange
      if (workerFilteredData && workerFilteredData.length > 0) {
        // Update filtered data
        if (updateFilteredDataRef.current) {
          updateFilteredDataRef.current(workerFilteredData);
        }
        
        // Update performance metrics
        if (stats && updatePerformanceMetricsRef.current) {
          updatePerformanceMetricsRef.current(stats);
        }
      }
    };

    workerRef.current.addEventListener('message', handleWorkerMessage);
    
    return () => {
      if (workerRef.current) {
        workerRef.current.removeEventListener('message', handleWorkerMessage);
      }
    };
  }, []);

  // Add effect to handle exchange changes
  useEffect(() => {
    console.log(`Exchange changed to: ${selectedExchange}`);
    
    // Reset data when exchange changes
    updateStockData([]);
    updateFilteredData([]);
    updatePriceHistory({});
    updatePriceColors({});
    
    // Clear workers
    if (workerRef.current) {
      workerRef.current.postMessage({
        action: 'filter',
        data: [],
        searchQuery: '',
        filters: {},
        sortConfig: { key: null, direction: 'asc' },
        showWatchlist: false
      });
    }
    
    if (colorWorkerRef.current) {
      colorWorkerRef.current.postMessage({
        action: 'clear'
      });
    }
    
    // Fetch new data for the selected exchange
    const exchangeMap = {
      'HOSE': 'hsx',
      'HNX': 'hnx'
    };
    
    fetchStockData(false, exchangeMap[selectedExchange], false);
  }, [selectedExchange]);

  const workerMetricsStore = useWorkerMetricsStore();

  // Update the worker message handler
  const handleWorkerMessage = (e) => {
    if (e.data.type === 'BATCH_COMPLETE') {
      workerMetricsStore.setLatestBatchTimestamp(Date.now());
      
      // Update metrics
      workerMetricsStore.updateColorWorkerMetrics({
        processedItems: e.data.processedItems,
        totalProcessingTime: e.data.processingTime,
        averageProcessingTime: e.data.processingTime / e.data.processedItems,
      });
    }
    // ... rest of the handler
  };

  // Update the processUpdates function
  const processUpdates = () => {
    const currentTime = Date.now();
    const lastBatchTime = workerMetricsStore.latestBatchTimestamp;
    
    // Only process if enough time has passed since last batch
    if (currentTime - lastBatchTime < 100) { // 100ms throttle
      return;
    }

    if (!workerMetricsStore.isProcessingBatch && workerMetricsStore.batchProcessingQueue.length > 0) {
      workerMetricsStore.setIsProcessingBatch(true);
      
      // Process the batch
      const batch = [...workerMetricsStore.batchProcessingQueue];
      workerMetricsStore.clearBatchQueue();
      
      // Send to worker
      if (colorWorker.current) {
        colorWorker.current.postMessage({
          type: 'PROCESS_BATCH',
          data: batch,
          isDarkMode: theme === 'dark',
        });
      }
    }
  };

  // Update the debug logging if you have any
  const logWorkerMetrics = () => {
    const stats = workerMetricsStore.getWorkerPerformanceStats();
    console.log('Worker Performance Stats:', stats);
  };

  // Update cleanup
  useEffect(() => {
    return () => {
      workerMetricsStore.resetMetrics();
    };
  }, []);

  // Add effect to update current time
  useEffect(() => {
    // Update time immediately
    updateCurrentTime(moment());

    // Update time every second
    const interval = setInterval(() => {
      updateCurrentTime(moment());
    }, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [updateCurrentTime]);

  return (
    <div className="bg-white dark:bg-[#0a0a14] min-h-[calc(100vh-4rem)] -mx-4 md:-mx-8 flex flex-col">
      <style>{animations}</style>
      
      {/* Feature Message Dialog */}
      {showFeatureMessage && (
        <div className="fixed inset-0 flex items-center justify-center z-[11000]">
          <UnauthorizedFeatureMessage
            featureName={featureMessageInfo.name}
            returnPath={featureMessageInfo.returnPath}
            showUpgradeOption={true}
            onClose={() => setShowFeatureMessage(false)}
          />
        </div>
      )}
      
      {/* Navigation Tabs */}
      <div className="border-b border-[#333] dark:border-[#333] border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-4 px-4">
          <button
            className={`py-3 px-4 text-sm font-medium relative transition-all duration-300 ease-in-out rounded-t-lg ${
              activeTab === 'price' 
                ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-[#1a1a1a]' 
                : 'text-gray-600 dark:text-[#888] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1a1a1a]/50'
            }`}
            onClick={() => setActiveTab('price')}
          >
            Bảng giá
            {activeTab === 'price' && (
              <div className="absolute bottom-0 left-0 h-0.5 bg-blue-500 w-full animate-[borderSlide_0.3s_ease-in-out]" />
            )}
          </button>
          
        </div>
      </div>

      {/* Search Bar and Exchange Selector */}
      <div className="p-4 flex flex-wrap items-center justify-between gap-4 animate-[fadeIn_0.3s_ease-in-out] flex-shrink-0">
        {/* Search Input and Exchange Selector */}
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-shrink-0">
            <Input
              type="text"
              placeholder="Tìm kiếm mã"
              value={searchQuery}
              onChange={(e) => debouncedSetSearchQuery(e.target.value)}
              className="w-[200px] bg-gray-50 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-[#666] pl-10 transition-all duration-300 ease-in-out focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-[#666]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Exchange Selector */}
          <div className="flex items-center bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-1 shadow-lg">
            {exchanges.map((exchanges) => (
              <button
                key={exchanges.id}
                onClick={() => setSelectedExchange(exchanges.id)}
                className={`
                  relative group flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md
                  transition-all duration-300 ease-in-out
                  ${selectedExchange === exchanges.id
                    ? 'bg-gray-200 dark:bg-[#2a2a2a] text-gray-900 dark:text-white shadow-md'
                    : 'text-gray-600 dark:text-[#888] hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a]/50'
                  }
                `}
              >
                {/* Exchange Icon */}
                <div
                  className={`
                    w-2 h-2 rounded-full
                    ${selectedExchange === exchanges.id
                      ? `bg-[${exchanges.color}] animate-[glowPulse_2s_infinite]`
                      : `bg-[${exchanges.color}]/50`
                    }
                  `}
                />
                
                {/* Exchange Name */}
                <span>{exchanges.name}</span>
                
                {/* Description Tooltip */}
                <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-200 dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded whitespace-nowrap">
                  {exchanges.description}
                </div>

                {/* Active Indicator */}
                {selectedExchange === exchanges.id && (
                  <div className="absolute bottom-0 left-0 h-0.5 bg-blue-500 w-full animate-[borderSlide_0.3s_ease-in-out]" />
                )}
              </button>
            ))}
          </div>

          

          {/* Watchlist Toggle - With Feature Check */}
          <div className="flex items-center gap-2 relative">
            <label 
              className="relative inline-flex items-center cursor-pointer" 
              title={hasFeature("Quản lý thông báo theo nhu cầu") ? "Chuyển chế độ danh sách theo dõi" : "Tính năng của gói nâng cao"}
            >
              <input
                type="checkbox"
                className="sr-only peer"
                checked={showWatchlist}
                onChange={handleToggleWatchlist}
                disabled={!hasFeature("Quản lý thông báo theo nhu cầu")}
              />
              <div 
                className={`w-11 h-6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer ${hasFeature("Quản lý thông báo theo nhu cầu") ? "dark:bg-gray-700 bg-gray-300 border-2 border-gray-400 dark:border-gray-600" : "dark:bg-gray-600 bg-gray-300 border border-gray-400 dark:border-gray-600"} peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border-2 after:rounded-full after:h-5 after:w-5 after:shadow-md after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 peer-checked:border-blue-700 dark:peer-checked:border-blue-800 transition-all duration-200`}
                onClick={(e) => {
                  // If no feature access, show message
                  if (!hasFeature("Quản lý thông báo theo nhu cầu")) {
                    e.preventDefault();
                    setFeatureMessageInfo({
                      name: 'Danh sách theo dõi và Thông báo',
                      returnPath: '/stock'
                    });
                    setShowFeatureMessage(true);
                  }
                }}
              ></div>
              <span className="ml-3 text-sm font-semibold text-gray-900 dark:text-gray-300">Danh sách theo dõi</span>
              {!hasFeature("Quản lý thông báo theo nhu cầu") && (
                <img 
                  src="/icons/workspace_premium.svg" 
                  alt="Premium" 
                  className="w-4 h-4 absolute -top-2 -right-2" 
                />
              )}
            </label>
          </div>
        </div>

        {/* Date, Time and Last Update Display */}
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#1a1a1a] px-4 py-2 rounded-lg border border-gray-200 dark:border-[#333] shadow-lg hover:border-gray-300 dark:hover:border-[#444] transition-all duration-300 w-[140px]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 dark:text-[#666] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-gray-900 dark:text-white font-medium w-full text-center">{currentTime.format('DD/MM/YYYY')}</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#1a1a1a] px-4 py-2 rounded-lg border border-gray-200 dark:border-[#333] shadow-lg hover:border-gray-300 dark:hover:border-[#444] transition-all duration-300 w-[120px]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 dark:text-[#666] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-900 dark:text-white font-medium w-full text-center">{currentTime.format('HH:mm:ss')}</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#1a1a1a] px-4 py-2 rounded-lg border border-gray-200 dark:border-[#333] shadow-lg hover:border-gray-300 dark:hover:border-[#444] transition-all duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 dark:text-[#666] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-gray-500 dark:text-[#888] text-sm">Cập nhật lúc:</span>
            <span className="text-gray-900 dark:text-white font-medium last-timestamp-display">
              {lastTimestamp ? moment(lastTimestamp, 'YYYYMMDDHHmmss').format('HH:mm:ss') : '--:--:--'}
            </span>
          </div>
        </div>
      </div>

      {/* Stock Chart Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white dark:bg-[#131722] text-gray-900 dark:text-white border-gray-200 dark:border-[#2a2e39] max-w-[1200px] w-[95vw] h-[80vh] p-0">
          <DialogTitle className="sr-only">Stock Chart</DialogTitle>
          <DialogDescription className="sr-only">Interactive stock chart with drawing tools</DialogDescription>
          <div className="flex flex-col h-full">
            {/* Chart Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-[#2a2e39]">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{selectedStock?.code}</span>
                  <span className={`text-base ${
                    selectedStock?.matchChange?.includes('+') 
                      ? 'text-[#26a69a]' 
                      : 'text-[#ef5350]'
                  }`}>
                    {selectedStock?.matchPrice} ({selectedStock?.matchChange})
                  </span>
                </div>
                <div className="h-4 w-[1px] bg-gray-200 dark:bg-[#2a2e39]"></div>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-[#a9a9a9]">
                  <div>O <span className="text-gray-900 dark:text-white">{selectedStock?.ref}</span></div>
                  <div>H <span className="text-[#26a69a]">{selectedStock?.high}</span></div>
                  <div>L <span className="text-[#ef5350]">{selectedStock?.low}</span></div>
                  <div>C <span className="text-gray-900 dark:text-white">{selectedStock?.matchPrice}</span></div>
                </div>
              </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 bg-white dark:bg-[#131722] min-h-[500px]">
              {isChartLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-500 dark:text-[#888] text-sm">Đang tải dữ liệu biểu đồ...</span>
                  </div>
                </div>
              ) : chartError ? (
                <div className="h-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4 text-center px-4">
                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                    <span className="text-gray-500 dark:text-[#888] text-sm">{chartError}</span>
                  </div>
                </div>
              ) : (!chartData || chartData.length === 0) ? (
                <div className="h-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4 text-center px-4">
                    <Info className="w-8 h-8 text-blue-500" />
                    <span className="text-gray-500 dark:text-[#888] text-sm">Không có dữ liệu biểu đồ cho mã này</span>
                  </div>
                </div>
              ) : (
                <CandlestickChart 
                  stockCode={selectedStock?.code}
                  data={chartData}
                />
              )}
            </div>

            {/* Chart Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-[#2a2e39] bg-gray-100 dark:bg-[#1e222d] text-xs text-gray-500 dark:text-[#a9a9a9]">
              <div className="flex items-center gap-4">
                <div>Vol: <span className="text-gray-900 dark:text-white font-medium">{selectedStock?.totalVolume}</span></div>
                <div>ĐTNN: 
                  <span className="text-[#26a69a] font-medium ml-1">+{selectedStock?.foreignBuy}</span>
                  <span className="text-[#ef5350] font-medium ml-1">-{selectedStock?.foreignSell}</span>
                </div>
              </div>
              <div>FE Stock Monitoring</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Price Alert Dialog */}
      <Dialog open={isPriceAlertOpen} onOpenChange={setIsPriceAlertOpen}>
        <DialogContent className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white border-gray-200 dark:border-[#2a2e39] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-center">
              Cài đặt thông báo giá - {selectedAlertStock?.code}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Thiết lập mức giá bạn muốn nhận thông báo
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm">Loại</label>
              <div className="col-span-3">
                <Select value={alertType} onValueChange={setAlertType} disabled={isSubmittingAlert}>
                  <SelectTrigger className="bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#333]">
                    <SelectValue placeholder="Chọn loại thông báo" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#2a2a2a] border-gray-200 dark:border-[#333]">
                    <SelectItem value="above">Khi giá vượt lên</SelectItem>
                    <SelectItem value="below">Khi giá giảm xuống</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <label className="text-right text-sm pt-2">Giá</label>
              <div className="col-span-3 space-y-2">
                <Input
                  type="number"
                  step="0.01"
                  value={alertPrice}
                  onChange={(e) => setAlertPrice(e.target.value)}
                  className="bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#333] text-gray-900 dark:text-white"
                  placeholder={`Giá hiện tại: ${selectedAlertStock?.matchPrice}`}
                  disabled={isSubmittingAlert}
                />
                {/* Price information in single line */}
                <div className="text-xs text-gray-500 dark:text-[#888]">
                  Giá hiện tại: <span className={`${selectedAlertStock ? colorCache[`${selectedAlertStock.code}-matchPrice`] || 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>{selectedAlertStock?.matchPrice}</span> | 
                  Giá trần: <span className="text-[#B388FF]">{selectedAlertStock?.ceiling}</span> | 
                  Giá sàn: <span className="text-[#00BCD4]">{selectedAlertStock?.floor}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              className="bg-red-500 hover:bg-red-600 text-white" 
              variant="outline" 
              onClick={() => setIsPriceAlertOpen(false)}
              disabled={isSubmittingAlert}
            >
              Hủy
            </Button>
            <Button 
              className="bg-green-500 hover:bg-green-600 text-white" 
              onClick={handleSavePriceAlert}
              disabled={isSubmittingAlert}
            >
              {isSubmittingAlert ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang lưu...</span>
                </div>
              ) : (
                'Lưu cài đặt'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden p-4 animate-[fadeIn_0.3s_ease-in-out]">
        {activeTab === 'price' && (
          <div className="h-full">
            <div className="stock-table-container">
              <div className="min-w-[1400px]">
                <table className="w-full border-collapse" style={{ borderCollapse: 'collapse' }}>
                  <colgroup>
                    <col className="w-[80px]" />
                    <col className="w-[60px]" />
                    <col className="w-[60px]" />
                    <col className="w-[60px]" />
                    <col className="w-[60px]" />
                    <col className="w-[70px]" />
                    <col className="w-[60px]" />
                    <col className="w-[70px]" />
                    <col className="w-[60px]" />
                    <col className="w-[70px]" />
                    <col className="w-[70px]" />
                    <col className="w-[70px]" />
                    <col className="w-[70px]" />
                    <col className="w-[60px]" />
                    <col className="w-[70px]" />
                    <col className="w-[60px]" />
                    <col className="w-[70px]" />
                    <col className="w-[60px]" />
                    <col className="w-[70px]" />
                    <col className="w-[80px]" />
                    <col className="w-[70px]" />
                    <col className="w-[70px]" />
                    <col className="w-[100px]" />
                  </colgroup>

                  {/* Table header with sticky positioning */}
                  <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-[#1a1a1a] shadow-sm">
                    <tr className="border-b border-gray-200 dark:border-[#333]">
                      <th 
                        className="text-gray-500 dark:text-[#999] border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2 cursor-pointer hover:text-gray-700 dark:hover:text-white transition-colors" 
                        rowSpan={2}
                        onClick={() => handleSort('code')}
                      >
                        Mã CK <SortIndicator columnKey="code" />
                      </th>
                      <th 
                        className="text-gray-500 dark:text-[#999] border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2 cursor-pointer hover:text-gray-700 dark:hover:text-white transition-colors" 
                        rowSpan={2}
                        onClick={() => handleSort('ceiling')}
                      >
                        Trần <SortIndicator columnKey="ceiling" />
                      </th>
                      <th 
                        className="text-gray-500 dark:text-[#999] border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2 cursor-pointer hover:text-gray-700 dark:hover:text-white transition-colors" 
                        rowSpan={2}
                        onClick={() => handleSort('floor')}
                      >
                        Sàn <SortIndicator columnKey="floor" />
                      </th>
                      <th 
                        className="text-gray-500 dark:text-[#999] border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2 cursor-pointer hover:text-gray-700 dark:hover:text-white transition-colors" 
                        rowSpan={2}
                        onClick={() => handleSort('ref')}
                      >
                        TC <SortIndicator columnKey="ref" />
                      </th>
                      <th 
                        className="text-gray-500 dark:text-[#999] border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2 header-benmua relative" 
                        colSpan={6}
                      >
                        Bên mua
                      </th>
                      <th 
                        className="text-gray-500 dark:text-[#999] border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2 header-khoplеnh relative" 
                        colSpan={3}
                      >
                        Khớp lệnh
                      </th>
                      <th 
                        className="text-gray-500 dark:text-[#999] border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2 header-benban relative" 
                        colSpan={6}
                      >
                        Bên bán
                      </th>
                      <th 
                        className="text-gray-500 dark:text-[#999] border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2" 
                        rowSpan={2}
                      >
                        Tổng KL
                      </th>
                      <th 
                        className="text-gray-500 dark:text-[#999] border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2 header-dtnn relative" 
                        colSpan={2}
                      >
                        ĐTNN
                      </th>
                      <th 
                        className="text-gray-500 dark:text-[#999] text-center whitespace-nowrap py-2" 
                        rowSpan={2}
                      >
                        Thao tác
                      </th>
                    </tr>
                    <tr>
                      <th className="text-gray-500 dark:text-[#999] border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2">Giá 3</th>
                      <th className="text-gray-500 dark:text-[#999] border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2">KL 3</th>
                      <th className="text-gray-500 dark:text-[#999] border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2">Giá 2</th>
                      <th className="text-gray-500 dark:text-[#999] border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2">KL 2</th>
                      <th className="text-gray-500 dark:text-[#999] border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2">Giá 1</th>
                      <th className="text-gray-500 dark:text-[#999] border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2">KL 1</th>
                      <th className="text-gray-500 dark:text-[#999] border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2">Giá</th>
                      <th className="text-gray-500 dark:text-[#999] border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2">KL</th>
                      <th className="text-gray-500 dark:text-[#999] border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2">+/-</th>
                      <th className="text-gray-500 dark:text-[#999] border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2">Giá 1</th>
                      <th className="text-gray-500 dark:text-[#999] border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2">KL 1</th>
                      <th className="text-gray-500 dark:text-[#999] border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2">Giá 2</th>
                      <th className="text-gray-500 dark:text-[#999] border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2">KL 2</th>
                      <th className="text-gray-500 dark:text-[#999] border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2">Giá 3</th>
                      <th className="text-gray-500 dark:text-[#999] border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2">KL 3</th>
                      <th className="text-gray-500 dark:text-[#999] border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2">Mua</th>
                      <th className="text-gray-500 dark:text-[#999] text-center whitespace-nowrap py-2">Bán</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Chỉ hiển thị loading khi:
                        1. Đang trong trạng thái loading ban đầu (isLoading hoặc isWatchlistLoading) 
                        2. KHÔNG phải đang cập nhật từ SignalR (isSignalRUpdating) */}
                    {(showWatchlist ? (isWatchlistLoading && !isSignalRUpdating) : (isLoading && !isSignalRUpdating)) ? (
                      <tr>
                        <td colSpan="26" className="text-center py-8">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-[#00FF00] border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-gray-500 dark:text-[#888] text-sm font-medium">
                              {showWatchlist ? 
                                `Đang tải danh sách theo dõi sàn ${selectedExchange}...` : 
                                `Đang tải dữ liệu sàn ${selectedExchange}...`
                              }
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (getTableData().length === 0 ? (
                      <tr>
                        <td colSpan="26" className="text-center py-8">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 text-gray-400">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 13h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="text-center">
                              <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Không tìm thấy dữ liệu</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                {showWatchlist 
                                  ? `Không có cổ phiếu nào trong danh sách theo dõi sàn ${selectedExchange}` 
                                  : `Không có dữ liệu cho sàn ${selectedExchange} tại thời điểm này`
                                }
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : filteredData.length === 0 ? (
                      <tr>
                        <td colSpan="26" className="text-center py-8">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 text-gray-400">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </div>
                            <div className="text-center">
                              <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Không tìm thấy kết quả phù hợp</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                Không tìm thấy cổ phiếu phù hợp với từ khóa "{searchQuery}"
                              </p>
                              <button 
                                onClick={() => setSearchQuery('')} 
                                className="mt-3 text-sm text-blue-500 hover:text-blue-700 transition-colors"
                              >
                                Xóa bộ lọc tìm kiếm
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null)}
                    {getTableData().length > 0 && getTableData().map((stock) => (
                      <tr 
                        key={stock.code} 
                        className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                      >
                        <td className={`border-r border-gray-200 dark:border-[#333] text-center font-medium transition-colors duration-300 cursor-pointer px-2 py-1.5 ${getCellClass(stock, 'matchPrice', 'price')}`}
                          onClick={() => handleStockClick(stock)}
                        >
                          {stock.code}
                        </td>
                        <td className="text-[#B388FF] border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap px-2 py-1.5">{stock.ceiling}</td>
                        <td className="text-[#00BCD4] border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap px-2 py-1.5">{stock.floor}</td>
                        <td className="text-[#F4BE37] border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap px-2 py-1.5">{stock.ref}</td>
                        <td className={`${getCellClass(stock, 'buyPrice3', 'price')} px-2 py-1.5`}>{stock.buyPrice3}</td>
                        <td className={`${getCellClass(stock, 'buyVolume3', 'volume')} px-2 py-1.5`}>{stock.buyVolume3}</td>
                        <td className={`${getCellClass(stock, 'buyPrice2', 'price')} px-2 py-1.5`}>{stock.buyPrice2}</td> 
                        <td className={`${getCellClass(stock, 'buyVolume2', 'volume')} px-2 py-1.5`}>{stock.buyVolume2}</td>
                        <td className={`${getCellClass(stock, 'buyPrice1', 'price')} px-2 py-1.5`}>{stock.buyPrice1}</td>
                        <td className={`${getCellClass(stock, 'buyVolume1', 'volume')} px-2 py-1.5`}>{stock.buyVolume1}</td>
                        <td className={`${getCellClass(stock, 'matchPrice', 'price')} px-2 py-1.5`}>{stock.matchPrice}</td>
                        <td className={`${getCellClass(stock, 'matchVolume', 'volume')} px-2 py-1.5`}>{stock.totalVolume}</td>
                        <td className={`${stock.matchChange?.includes('+') ? 'text-[#22c55e] dark:text-[#00FF00]' : 'text-[#FF4A4A]'} border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap px-2 py-1.5`}>{stock.matchChange}</td>
                        <td className={`${getCellClass(stock, 'sellPrice1', 'price')} px-2 py-1.5`}>{stock.sellPrice1}</td>
                        <td className={`${getCellClass(stock, 'sellVolume1', 'volume')} px-2 py-1.5`}>{stock.sellVolume1}</td>
                        <td className={`${getCellClass(stock, 'sellPrice2', 'price')} px-2 py-1.5`}>{stock.sellPrice2}</td> 
                        <td className={`${getCellClass(stock, 'sellVolume2', 'volume')} px-2 py-1.5`}>{stock.sellVolume2}</td>
                        <td className={`${getCellClass(stock, 'sellPrice3', 'price')} px-2 py-1.5`}>{stock.sellPrice3}</td>
                        <td className={`${getCellClass(stock, 'sellVolume3', 'volume')} px-2 py-1.5`}>{stock.sellVolume3}</td>
                        <td className={`${getCellClass(stock, 'totalVolume', 'volume')} px-2 py-1.5`}>{stock.matchVolume}</td>
                        <td className="text-gray-900 dark:text-white border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap px-2 py-1.5">{stock.foreignBuy}</td>
                        <td className="text-gray-900 dark:text-white border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap px-2 py-1.5">{stock.foreignSell}</td>
                        <td className="text-center px-2 py-1.5">
                          <div className="flex items-center justify-center gap-2">
                            {showWatchlist ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setStockToDelete(stock);
                                  setDeleteDialogOpen(true);
                                }}
                                className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                                title="Xóa khỏi danh sách theo dõi"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (hasFeature("Quản lý danh mục theo dõi cổ phiếu")) {
                                    handleAddToWatchlistCb(stock);
                                  } else {
                                    setFeatureMessageInfo({
                                      name: 'Danh sách theo dõi',
                                      returnPath: '/stock'
                                    });
                                    setShowFeatureMessage(true);
                                  }
                                }}
                                className={`p-1.5 rounded relative ${hasFeature("Quản lý danh mục theo dõi cổ phiếu") 
                                  ? "bg-blue-500/10 hover:bg-blue-500/20 text-blue-500" 
                                  : "bg-teal-500/10 text-teal-500 hover:bg-teal-500/20 transition-colors"}`}
                                title={hasFeature("Quản lý danh mục theo dõi cổ phiếu") 
                                  ? "Thêm vào danh sách theo dõi" 
                                  : "Tính năng của gói nâng cao"}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                                {!hasFeature("Quản lý danh mục theo dõi cổ phiếu") && (
                                  <img 
                                    src="/icons/workspace_premium.svg" 
                                    alt="Premium" 
                                    className="w-4 h-4 absolute -top-2 -right-2" 
                                  />
                                )}
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetPriceAlertCb(stock);
                              }}
                              className={`p-1.5 rounded relative ${hasFeature("Quản lý thông báo theo nhu cầu") 
                                ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-500" 
                                : "bg-teal-500/10 text-teal-500 hover:bg-teal-500/20 transition-colors"}`}
                              title={hasFeature("Quản lý thông báo theo nhu cầu") 
                                ? "Cài đặt thông báo giá" 
                                : "Tính năng của gói nâng cao"}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                              </svg>
                              {!hasFeature("Quản lý thông báo theo nhu cầu") && (
                                <img 
                                  src="/icons/workspace_premium.svg" 
                                  alt="Premium" 
                                  className="w-4 h-4 absolute -top-2 -right-2" 
                                />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Footer with exchange information */}
            <div className="sticky -bottom-4 bg-white dark:bg-[#0a0a14] border-t border-gray-200 dark:border-[#333] py-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="text-xs">
                  {showPerformanceMetrics && (
                    <div className="text-gray-500 dark:text-[#999] px-4 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Filter Worker:</span>
                        <span>{performanceMetrics.processingTime}ms</span>
                        <span>|</span>
                        <span>Items: {performanceMetrics.itemsIn} → {performanceMetrics.itemsOut}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Color Worker:</span>
                        <span>{colorWorkerMetrics.processingTime}ms</span>
                        <span>|</span>
                        <span>Stocks: {colorWorkerMetrics.stockCount}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-[#999] text-right px-4">
                  {selectedExchange === 'HOSE' && (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-[#00C087] font-medium">HOSE:</span>
                      <span>Đơn vị giá: 1.000 VND, Khối lượng: 100 CP</span>
                      {/* <button 
                        onClick={() => setShowPerformanceMetrics(!showPerformanceMetrics)}
                        className="ml-4 text-blue-500 hover:text-blue-700 transition-colors"
                        title="Toggle performance metrics"
                      >
                        {showPerformanceMetrics ? "Hide metrics" : "Show metrics"}
                      </button> */}
                    </div>
                  )}
                  {selectedExchange === 'HNX' && (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-[#00B4D8] font-medium">HNX:</span>
                      <span>Đơn vị giá: 1.000 VNĐ, Đơn vị khối lượng: 1.000 CP</span>
                      {/* <button 
                        onClick={() => setShowPerformanceMetrics(!showPerformanceMetrics)}
                        className="ml-4 text-blue-500 hover:text-blue-700 transition-colors"
                        title="Toggle performance metrics"
                      >
                        {showPerformanceMetrics ? "Hide metrics" : "Show metrics"}
                      </button> */}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white border-gray-200 dark:border-[#333] max-w-[400px]">
          <DialogTitle className="font-semibold text-xl">Xóa cổ phiếu khỏi danh sách theo dõi</DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-[#999]">
            Bạn có chắc chắn muốn xóa cổ phiếu <span className="text-gray-900 dark:text-white font-medium">{stockToDelete?.code}</span> khỏi danh sách theo dõi?
          </DialogDescription>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="bg-transparent border-gray-200 dark:border-[#333] text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#252525]"
              disabled={isDeletingStock}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!stockToDelete) return;
                const userId = getUserId();
                if (!userId) {
                  toast.error("Vui lòng đăng nhập để sử dụng tính năng này");
                  setDeleteDialogOpen(false);
                  return;
                }
                setIsDeletingStock(true);
                try {
                  await stockService.deleteStockFromWatchlist(userId, stockToDelete.code);
                  updateWatchlist(watchlist.filter(item => item.code !== stockToDelete.code));
                  toast.success(`Đã xóa ${stockToDelete.code} khỏi danh sách theo dõi`);
                } catch (error) {
                  toast.error("Không thể xóa khỏi danh sách theo dõi. Vui lòng thử lại sau.");
                } finally {
                  setIsDeletingStock(false);
                  setDeleteDialogOpen(false);
                  setStockToDelete(null);
                }
              }}
              className="bg-red-500 hover:bg-red-600"
              disabled={isDeletingStock}
            >
              {isDeletingStock ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang xóa...</span>
                </div>
              ) : (
                "Xóa cổ phiếu"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}