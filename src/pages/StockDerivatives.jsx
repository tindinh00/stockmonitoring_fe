import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from "@/components/ui/input";
import moment from 'moment';
import axios from 'axios';
import CandlestickChart from '@/components/CandlestickChart';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import Chart from 'react-apexcharts';
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
import signalRService from '@/api/signalRService';
import {
  ChevronDown,
  BarChart3,
  DollarSign,
  Star,
  Bell,
  AlertTriangle,
  Info
} from 'lucide-react';
import Cookies from 'js-cookie';
import { getUserId, apiService } from '@/api/Api'; // Import hàm getUserId và apiService
import { stockService } from '@/api/StockApi'; // Update import to use named import

const StockDerivatives = () => {
  const [activeTab, setActiveTab] = useState('price');
  const [selectedStock, setSelectedStock] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [priceHistory, setPriceHistory] = useState({});
  const [priceChangeColors, setPriceChangeColors] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExchange, setSelectedExchange] = useState('HOSE');
  const [chartData, setChartData] = useState([]);
  const [realTimeStockData, setRealTimeStockData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [watchlist, setWatchlist] = useState([]);
  const [isPriceAlertOpen, setIsPriceAlertOpen] = useState(false);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertType, setAlertType] = useState('above');
  const [selectedAlertStock, setSelectedAlertStock] = useState(null);
  const [currentTime, setCurrentTime] = useState(moment());

  // Add filter states
  const [filters, setFilters] = useState({
    priceChange: 'all', // all, up, down
    volume: 'all', // all, high, low
    percentChange: 'all', // all, positive, negative
    marketCap: 'all' // all, large, medium, small
  });

  // Add filter options
  const filterOptions = {
    priceChange: [
      { value: 'all', label: 'Tất cả' },
      { value: 'up', label: 'Tăng giá' },
      { value: 'down', label: 'Giảm giá' }
    ],
    volume: [
      { value: 'all', label: 'Tất cả' },
      { value: 'high', label: 'Cao' },
      { value: 'low', label: 'Thấp' }
    ],
    percentChange: [
      { value: 'all', label: 'Tất cả' },
      { value: 'positive', label: 'Dương' },
      { value: 'negative', label: 'Âm' }
    ],
    marketCap: [
      { value: 'all', label: 'Tất cả' },
      { value: 'large', label: 'Lớn' },
      { value: 'medium', label: 'Vừa' },
      { value: 'small', label: 'Nhỏ' }
    ]
  };

  // Add sorting state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  // Add industry filter state
  const [selectedIndustry, setSelectedIndustry] = useState('all');

  // Add industry options
  const industryOptions = [
    { value: 'all', label: 'Tất cả ngành' },
    { value: 'banking', label: 'Ngân hàng' },
    { value: 'realestate', label: 'Bất động sản' },
    { value: 'technology', label: 'Công nghệ' },
    { value: 'energy', label: 'Năng lượng' },
    { value: 'consumer', label: 'Tiêu dùng' },
    { value: 'industrial', label: 'Công nghiệp' },
    { value: 'healthcare', label: 'Y tế' },
    { value: 'telecom', label: 'Viễn thông' },
    { value: 'materials', label: 'Vật liệu' }
  ];

  // Add sorting handler
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Add filtered data logic
  const getFilteredData = () => {
    let filteredData = realTimeStockData.filter(stock => {
      // Search filter
      if (!stock.code.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Industry filter
      if (selectedIndustry !== 'all') {
        // TODO: Add industry field to stock data
        // if (stock.industry !== selectedIndustry) return false;
      }

      // Price change filter
      if (filters.priceChange !== 'all') {
        const isUp = parseFloat(stock.matchChange) > 0;
        if (filters.priceChange === 'up' && !isUp) return false;
        if (filters.priceChange === 'down' && isUp) return false;
      }

      // Volume filter
      if (filters.volume !== 'all') {
        const volume = parseFloat(stock.totalVolume.replace(/,/g, ''));
        const avgVolume = 1000000;
        if (filters.volume === 'high' && volume < avgVolume) return false;
        if (filters.volume === 'low' && volume >= avgVolume) return false;
      }

      // Percent change filter
      if (filters.percentChange !== 'all') {
        const change = parseFloat(stock.matchChange);
        if (filters.percentChange === 'positive' && change <= 0) return false;
        if (filters.percentChange === 'negative' && change >= 0) return false;
      }

      // Market cap filter
      if (filters.marketCap !== 'all') {
        const price = parseFloat(stock.matchPrice);
        const volume = parseFloat(stock.totalVolume.replace(/,/g, ''));
        const marketCap = price * volume;
        
        if (filters.marketCap === 'large' && marketCap < 1000000000) return false;
        if (filters.marketCap === 'medium' && (marketCap < 100000000 || marketCap >= 1000000000)) return false;
        if (filters.marketCap === 'small' && marketCap >= 100000000) return false;
      }

      return true;
    });

    // Apply sorting
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle special cases
        if (sortConfig.key === 'matchChange') {
          aValue = parseFloat(aValue);
          bValue = parseFloat(bValue);
        } else if (sortConfig.key === 'totalVolume') {
          aValue = parseFloat(aValue.replace(/,/g, ''));
          bValue = parseFloat(bValue.replace(/,/g, ''));
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filteredData;
  };

  // Thêm dữ liệu cho các sàn
  const exchanges = [
    { id: 'HOSE', name: 'HOSE', color: '#00C087', description: 'Sở GDCK TP.HCM' },
    { id: 'HNX', name: 'HNX', color: '#00B4D8', description: 'Sở GDCK Hà Nội' }
  ];


  // Add mock data for charts
  const vnIndexData = Array.from({ length: 360 }, (_, i) => ({
    time: new Date(2024, 0, 1, 9, i).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    value: 1200 + Math.sin(i / 30) * 50 + Math.random() * 20,
    volume: Math.random() * 1000000
  }));

  const liquidityData = Array.from({ length: 360 }, (_, i) => ({
    time: new Date(2024, 0, 1, 9, i).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    value: Math.random() * 24000,
    previousDay: Math.random() * 24000,
    yesterday: Math.random() * 24000
  }));

  const distributionData = [
    { range: "-7%", count: 24, color: "#FF4A4A" },
    { range: "-5%", count: 15, color: "#FF4A4A" },
    { range: "-3%", count: 35, color: "#FF4A4A" },
    { range: "-2%", count: 30, color: "#FF4A4A" },
    { range: "-1%", count: 66, color: "#FF4A4A" },
    { range: "-0.1%", count: 111, color: "#FF4A4A" },
    { range: "0%", count: 531, color: "#F4BE37" },
    { range: "+0.1%", count: 56, color: "#00FF00" },
    { range: "+2%", count: 38, color: "#00FF00" },
    { range: "+3%", count: 14, color: "#00FF00" },
    { range: "+5%", count: 8, color: "#00FF00" },
    { range: "+7%", count: 20, color: "#00FF00" },
  ];

  const distributionChartOptions = {
    chart: {
      type: 'bar',
      background: '#1a1a1a',
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        columnWidth: '80%',
        distributed: true,
        dataLabels: {
          position: 'top'
        }
      }
    },
    colors: ['#FF4A4A', '#FF4A4A', '#FF4A4A', '#FF4A4A', '#FF4A4A', '#FF4A4A', '#F4BE37', '#00FF00', '#00FF00', '#00FF00', '#00FF00', '#00FF00'],
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return val
      },
      offsetY: -20,
      style: {
        fontSize: '12px',
        colors: ['#fff']
      }
    },
    legend: {
      show: false
    },
    grid: {
      show: false
    },
    xaxis: {
      categories: ['-7%', '-5%', '-3%', '-2%', '-1%', '-0.1%', '0%', '+0.1%', '+2%', '+3%', '+5%', '+7%'],
      labels: {
        style: {
          colors: '#999',
          fontSize: '11px'
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      show: false
    },
    tooltip: {
      enabled: false
    }
  };

  const handleStockClick = (stock) => {
    setSelectedStock(stock);
    setIsDialogOpen(true);
  };

  // Theo dõi thay đổi giá và cập nhật màu sắc
  const updatePriceColors = (stockCode, currentPrice, previousPrice) => {
    if (!previousPrice || isNaN(currentPrice) || isNaN(previousPrice)) return 'text-white';
    
    if (currentPrice > previousPrice) {
      return 'text-[#00FF00] price-up'; // Tăng giá - màu xanh + animation
    } else if (currentPrice < previousPrice) {
      return 'text-[#FF4A4A] price-down'; // Giảm giá - màu đỏ + animation
    }
    return 'text-white'; // Giữ nguyên - màu trắng
  };

  // Add state for timestamp
  const [lastTimestamp, setLastTimestamp] = useState(moment().format('YYYYMMDDHHmmss')); // Set default timestamp

  // Update the existing handleStockDataError function
  const handleStockDataError = () => {
    setRealTimeStockData([]);
    setPriceHistory({});
    setPriceChangeColors({});
    setIsLoading(false);
  };

  // Fetch stock data first, then set up SignalR
  const fetchStockData = async (timestamp = null) => {
    try {
      console.log("=== Fetching stock data ===");
      setIsLoading(true);
      
      // Map exchange based on selected tab
      let exchange = selectedExchange === 'HOSE' ? 'hsx' : 'hnx';
      
      console.log(`Fetching ${exchange} stock data${timestamp ? ' with timestamp: ' + timestamp : ''}`);
      
      let response;
      if (timestamp) {
        // If we have timestamp, use getStockInSession
        response = await stockService.getStockInSession(exchange, timestamp);
      } else {
        // For initial load, use getLatestStockData
        response = await stockService.getLatestStockData(exchange);
      }
      
      if (response?.value?.data) {
        console.log(`Successfully fetched ${response.value.data.length} stocks`);
        handleStockDataResponse(response.value.data);
      } else {
        handleStockDataError();
      }
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error in fetchStockData:', error);
      handleStockDataError();
      return false;
    }
  };

  // Updated SignalR connection function that only sets up event listeners
  const setupSignalR = async () => {
    try {
      console.log("=== Setting up SignalR for stock data ===");
      
      // Initialize SignalR connection
      await signalRService.startStockConnection();
      
      // Check connection status
      const connectionStatus = signalRService.isConnected();
      console.log("SignalR Connection Status:", connectionStatus);
      
      if (connectionStatus.stockHub) {
        console.log("SignalR Stock Connection successful, setting up event listeners");
        
        // Register for HSX stock updates
        console.log("Registering for HSX stock updates");
        signalRService.onStock("ReceiveHSXStockUpdate", (data) => {
          console.log("Received HSX stock update:", data);
          
          try {
            // Only process if current tab is HOSE
            if (selectedExchange !== 'HOSE') {
              console.log("Ignoring HSX update as current tab is", selectedExchange);
              return;
            }

            // Normalize data
            let messageData = data;
            if (typeof data === 'string') {
              try {
                messageData = JSON.parse(data);
              } catch (error) {
                console.warn("Failed to parse HSX update as JSON:", error);
              }
            }
            
            // Get timestamp from message
            const timestamp = messageData.Timestamp || messageData.timestamp;
            console.log("HSX update timestamp:", timestamp);
            
            if (timestamp) {
              fetchStockData(timestamp);
            }
          } catch (error) {
            console.error("Error processing HSX update:", error);
          }
        });
        
        // Register for HNX stock updates
        console.log("Registering for HNX stock updates");
        signalRService.onStock("ReceiveHNXStockUpdate", (data) => {
          console.log("Received HNX stock update:", data);
          
          try {
            // Only process if current tab is HNX
            if (selectedExchange !== 'HNX') {
              console.log("Ignoring HNX update as current tab is", selectedExchange);
              return;
            }

            // Normalize data
            let messageData = data;
            if (typeof data === 'string') {
              try {
                messageData = JSON.parse(data);
              } catch (error) {
                console.warn("Failed to parse HNX update as JSON:", error);
              }
            }
            
            // Get timestamp from message
            const timestamp = messageData.Timestamp || messageData.timestamp;
            console.log("HNX update timestamp:", timestamp);
            
            if (timestamp) {
              fetchStockData(timestamp);
            }
          } catch (error) {
            console.error("Error processing HNX update:", error);
          }
        });
        
        console.log("SignalR event listeners set up successfully");
      } else {
        console.warn("SignalR connection not ready. Status:", connectionStatus);
      }
    } catch (error) {
      console.error("Failed to setup SignalR connection:", error);
    }
  };

  // Fetch initial data and setup SignalR
  useEffect(() => {
    const initializeStockData = async () => {
      console.log("=== Initializing Stock Derivatives Page ===");
      
      try {
        // Step 1: Fetch latest data first to show immediately
        console.log("Fetching initial stock data");
        const fetchSuccess = await fetchStockData();
        
        // Step 2: Set up SignalR only after initial data fetch
        if (fetchSuccess) {
          console.log("Initial data fetched successfully, now setting up SignalR");
          setupSignalR();
        } else {
          console.warn("Failed to fetch initial data, retrying in 5 seconds");
          setTimeout(() => fetchStockData(), 5000);
        }
      } catch (error) {
        console.error("Error initializing stock data:", error);
      }
    };
    
    initializeStockData();
    
    // Cleanup when component unmounts
    return () => {
      console.log("=== Cleaning up Stock Derivatives Page ===");
      // Clean up SignalR connection if needed
      signalRService.stop();
    };
  }, []);

  // Add useEffect to refetch data when exchange changes
  useEffect(() => {
    console.log("Exchange changed to:", selectedExchange);
    // Reset data when changing exchange
    setRealTimeStockData([]);
    setPriceHistory({});
    setPriceChangeColors({});
    // Fetch new data for selected exchange
    fetchStockData();
  }, [selectedExchange]);

  // Add helper function to handle successful stock data response
  const handleStockDataResponse = (responseData) => {
    if (!responseData) {
      handleStockDataError();
      return;
    }

    // Check if data is in the new format (nested in value.data)
    const stockData = responseData.value?.data || responseData;
    
    if (!Array.isArray(stockData)) {
      handleStockDataError();
      return;
    }

    console.log('Processing stock data:', stockData);

    const formattedData = stockData.map(stock => ({
      code: stock.stockCode,
      ceiling: stock.ceilPrice?.toFixed(2) || '--',
      floor: stock.floorPrice?.toFixed(2) || '--',
      ref: stock.priorClosePrice?.toFixed(2) || '--',
      buyPrice3: stock.price3Buy?.toFixed(2) || '--',
      buyVolume3: stock.volume3Buy?.toLocaleString() || '--',
      buyPrice2: stock.price2Buy?.toFixed(2) || '--',
      buyVolume2: stock.volume2Buy?.toLocaleString() || '--',
      buyPrice1: stock.price1Buy?.toFixed(2) || '--',
      buyVolume1: stock.volume1Buy?.toLocaleString() || '--',
      matchPrice: stock.matchPrice?.toFixed(2) || '--',
      matchVolume: stock.matchedOrderVolume?.toLocaleString() || '--',
      matchChange: stock.plusMinus ? `${stock.plusMinus > 0 ? '+' : ''}${stock.plusMinus.toFixed(2)}%` : '--',
      sellPrice1: stock.price1Sell || '--',
      sellVolume1: stock.volume1Sell?.toLocaleString() || '--',
      sellPrice2: stock.price2Sell || '--',
      sellVolume2: stock.volume2Sell?.toLocaleString() || '--',
      sellPrice3: stock.price3Sell || '--',
      sellVolume3: stock.volume3Sell?.toLocaleString() || '--',
      totalVolume: stock.volumeAccumulation?.toLocaleString() || '--',
      high: stock.highPrice?.toFixed(2) || '--',
      low: stock.lowPrice?.toFixed(2) || '--',
      foreignBuy: stock.foreignBuyVolume?.toLocaleString() || '--',
      foreignSell: stock.foreignSellVolume?.toLocaleString() || '--'
    }));

    if (formattedData.length > 0) {
      setRealTimeStockData(formattedData);
      
      // Update price history and colors
      const newPriceHistory = { ...priceHistory };
      const newPriceChangeColors = { ...priceChangeColors };
      
      formattedData.forEach(newStock => {
        const oldStock = realTimeStockData.find(stock => stock.code === newStock.code);
        const currentPrice = parseFloat(newStock.matchPrice);
        
        if (oldStock) {
          const previousPrice = parseFloat(oldStock.matchPrice);
          newPriceHistory[newStock.code] = previousPrice;
          newPriceChangeColors[newStock.code] = updatePriceColors(
            newStock.code,
            currentPrice,
            previousPrice
          );
        } else {
          newPriceHistory[newStock.code] = currentPrice;
          newPriceChangeColors[newStock.code] = 'text-white';
        }
      });
      
      setPriceHistory(newPriceHistory);
      setPriceChangeColors(newPriceChangeColors);
    } else {
      handleStockDataError();
    }
  };

  // Add sample chart data
  useEffect(() => {
    if (selectedStock) {
      // Generate sample data for the last 30 days
      const data = Array.from({ length: 30 }).map((_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (30 - index));
        const basePrice = parseFloat(selectedStock.ref);
        const randomChange = (Math.random() - 0.5) * 2; // Random value between -1 and 1
        
        return {
          time: Math.floor(date.getTime() / 1000),
          open: basePrice + randomChange,
          high: basePrice + randomChange + Math.random() * 0.5,
          low: basePrice + randomChange - Math.random() * 0.5,
          close: basePrice + randomChange + (Math.random() - 0.5),
          volume: Math.floor(Math.random() * 100000)
        };
      });
      setChartData(data);
    }
  }, [selectedStock]);

  // CSS Animation cho thay đổi giá
  const priceChangeAnimation = `
    @keyframes priceUp {
      0% { background-color: rgba(0, 255, 0, 0.3); }
      100% { background-color: transparent; }
    }
    @keyframes priceDown {
      0% { background-color: rgba(255, 0, 0, 0.3); }
      100% { background-color: transparent; }
    }
    
    .price-up {
      animation: priceUp 2s ease-out;
    }
    
    .price-down {
      animation: priceDown 2s ease-out;
    }
  `;

  // CSS Animations
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

    ${priceChangeAnimation}
  `;

  // Fetch watchlist when component mounts
  useEffect(() => {
    const fetchUserWatchlist = async () => {
      try {
        const userId = getUserId();
        console.log("Fetching watchlist for user ID:", userId);
        
        if (!userId) {
          console.log("No user ID found, skipping watchlist fetch");
          return;
        }
        
        // Get auth token from cookies
        const token = Cookies.get("auth_token");
        if (!token) {
          console.log("No auth token found");
          return;
        }
        
        // Call the new watchlist API endpoint
        const response = await axios.get(
          `https://stockmonitoring-api-gateway.onrender.com/api/watchlist-stock/${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'accept': '*/*'
            }
          }
        );
        
        console.log("Fetched watchlist response:", response.data);
        
        if (response.data?.value?.data?.stocks) {
          // Extract stock codes from the response
          const watchlistStockCodes = response.data.value.data.stocks.map(stock => stock.ticketSymbol);
          
          // Find stocks in realTimeStockData that match the watchlist
          const watchlistStocks = realTimeStockData.filter(stock => 
            watchlistStockCodes.includes(stock.code)
          );
          
          setWatchlist(watchlistStocks);
        }
      } catch (error) {
        console.error('Error fetching watchlist:', error);
      }
    };
    
    if (realTimeStockData.length > 0) {
      fetchUserWatchlist();
    }
  }, [realTimeStockData]);

  // Update handleAddToWatchlist to handle the new API response format
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
        await axios.delete(
          `https://stockmonitoring-api-stock-service.onrender.com/api/WatchListStock`,
          {
            params: {
              userId: userId,
              stockId: stock.code
            },
            headers: {
              'Authorization': `Bearer ${token}`,
              'accept': '*/*'
            }
          }
        );
        
        setWatchlist(watchlist.filter(item => item.code !== stock.code));
        toast.success(`Đã xóa ${stock.code} khỏi danh sách theo dõi`);
      } else {
        // Add to watchlist
        await axios.post(
          `https://stockmonitoring-api-gateway.onrender.com/api/WatchListStock`,
          {
            userId: userId,
            tickerSymbol: stock.code
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'accept': '*/*',
              'Content-Type': 'application/json'
            }
          }
        );
        
        setWatchlist([...watchlist, stock]);
        toast.success(`Đã thêm ${stock.code} vào danh sách theo dõi`);
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
      toast.error("Không thể cập nhật danh sách theo dõi, vui lòng thử lại sau");
    }
  };

  // Thêm hàm xử lý cài đặt thông báo giá
  const handleSetPriceAlert = (stock) => {
    setSelectedAlertStock(stock);
    setAlertPrice('');
    setAlertType('above');
    setIsPriceAlertOpen(true);
  };

  // Thêm hàm xử lý lưu cài đặt thông báo giá
  const handleSavePriceAlert = async () => {
    if (!alertPrice || isNaN(alertPrice)) {
      toast.error('Vui lòng nhập giá hợp lệ');
      return;
    }

    const price = parseFloat(alertPrice);
    const currentPrice = parseFloat(selectedAlertStock.matchPrice);

    // Kiểm tra logic giá cảnh báo
    if (alertType === 'above' && price <= currentPrice) {
      toast.error('Giá cảnh báo phải cao hơn giá hiện tại');
      return;
    }

    if (alertType === 'below' && price >= currentPrice) {
      toast.error('Giá cảnh báo phải thấp hơn giá hiện tại');
      return;
    }

    try {
      // Gọi API tạo cảnh báo giá
      const alertTypeApi = alertType === 'above' ? 'increase' : 'decrease';
      
      const result = await apiService.createPriceAlert(
        selectedAlertStock.code,
        price,
        alertTypeApi
      );
      
      if (result.success) {
        toast.success(result.message);
        setIsPriceAlertOpen(false);
      } else {
        toast.error(result.message || 'Không thể tạo cảnh báo giá');
      }
    } catch (error) {
      console.error('Error creating price alert:', error);
      toast.error(error.message || 'Đã xảy ra lỗi khi tạo cảnh báo giá');
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
      setCurrentTime(moment());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-[#0a0a14] min-h-[calc(100vh-4rem)] -mx-4 md:-mx-8 flex flex-col">
      <style>{animations}</style>
      
      {/* Navigation Tabs */}
      <div className="border-b border-[#333] flex-shrink-0">
        <div className="flex items-center gap-4 px-4">
          <button
            className={`py-3 px-4 text-sm font-medium relative transition-all duration-300 ease-in-out rounded-t-lg ${
              activeTab === 'price' 
                ? 'text-white bg-[#1a1a1a]' 
                : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]/50'
            }`}
            onClick={() => setActiveTab('price')}
          >
            Bảng giá
            {activeTab === 'price' && (
              <div className="absolute bottom-0 left-0 h-0.5 bg-blue-500 w-full animate-[borderSlide_0.3s_ease-in-out]" />
            )}
          </button>
          <button
            className={`py-3 px-4 text-sm font-medium relative transition-all duration-300 ease-in-out rounded-t-lg ${
              activeTab === 'market' 
                ? 'text-white bg-[#1a1a1a]' 
                : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]/50'
            }`}
            onClick={() => setActiveTab('market')}
          >
            Toàn cảnh thị trường
            {activeTab === 'market' && (
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[200px] bg-[#1a1a1a] border-[#333] text-white placeholder:text-[#666] pl-10 transition-all duration-300 ease-in-out focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]"
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
          <div className="flex items-center bg-[#1a1a1a] rounded-lg p-1 shadow-lg">
            {exchanges.map((exchange) => (
              <button
                key={exchange.id}
                onClick={() => setSelectedExchange(exchange.id)}
                className={`
                  relative group flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md
                  transition-all duration-300 ease-in-out
                  ${selectedExchange === exchange.id
                    ? 'bg-[#2a2a2a] text-white shadow-md'
                    : 'text-[#888] hover:text-white hover:bg-[#2a2a2a]/50'
                  }
                `}
              >
                {/* Exchange Icon */}
                <div
                  className={`
                    w-2 h-2 rounded-full
                    ${selectedExchange === exchange.id
                      ? `bg-[${exchange.color}] animate-[glowPulse_2s_infinite]`
                      : `bg-[${exchange.color}]/50`
                    }
                  `}
                />
                
                {/* Exchange Name */}
                <span>{exchange.name}</span>
                
                {/* Description Tooltip */}
                <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-[#2a2a2a] text-white rounded whitespace-nowrap">
                  {exchange.description}
                </div>

                {/* Active Indicator */}
                {selectedExchange === exchange.id && (
                  <div className="absolute bottom-0 left-0 h-0.5 bg-blue-500 w-full animate-[borderSlide_0.3s_ease-in-out]" />
                )}
              </button>
            ))}
          </div>

          {/* Industry Filter */}
          <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
            <SelectTrigger className="w-[180px] bg-[#1a1a1a] border-[#333]">
              <SelectValue placeholder="Chọn ngành" />
            </SelectTrigger>
            <SelectContent>
              {industryOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date and Time Display */}
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2 bg-[#1a1a1a] px-4 py-2 rounded-lg border border-[#333] shadow-lg hover:border-[#444] transition-all duration-300 w-[140px]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#666] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-white font-medium w-full text-center">{currentTime.format('DD/MM/YYYY')}</span>
          </div>
          <div className="flex items-center gap-2 bg-[#1a1a1a] px-4 py-2 rounded-lg border border-[#333] shadow-lg hover:border-[#444] transition-all duration-300 w-[120px]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#666] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-white font-medium w-full text-center">{currentTime.format('HH:mm:ss')}</span>
          </div>
        </div>
      </div>

      {/* Stock Chart Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#131722] text-white border-[#2a2e39] max-w-[1200px] w-[95vw] h-[80vh] p-0">
          <DialogTitle className="sr-only">Stock Chart</DialogTitle>
          <DialogDescription className="sr-only">Interactive stock chart with drawing tools</DialogDescription>
          <div className="flex flex-col h-full">
            {/* Chart Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a2e39]">
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
                <div className="h-4 w-[1px] bg-[#2a2e39]"></div>
                <div className="flex items-center gap-4 text-sm text-[#a9a9a9]">
                  <div>O <span className="text-white">{selectedStock?.ref}</span></div>
                  <div>H <span className="text-[#26a69a]">{selectedStock?.high}</span></div>
                  <div>L <span className="text-[#ef5350]">{selectedStock?.low}</span></div>
                  <div>C <span className="text-white">{selectedStock?.matchPrice}</span></div>
                </div>
              </div>
              <button className="hover:bg-[#2a2e39] p-2 rounded" onClick={() => setIsDialogOpen(false)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chart Area */}
            <div className="flex-1 bg-[#131722] min-h-[500px]">
              <CandlestickChart 
                stockCode={selectedStock?.code}
                data={chartData}
              />
            </div>

            {/* Chart Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-[#2a2e39] bg-[#1e222d] text-xs text-[#a9a9a9]">
              <div className="flex items-center gap-4">
                <div>Vol: <span className="text-white font-medium">{selectedStock?.totalVolume}</span></div>
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
        <DialogContent className="bg-[#1a1a1a] text-white border-[#2a2e39] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-center">
              Cài đặt thông báo giá - {selectedAlertStock?.code}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-400 text-center">
              Thiết lập mức giá bạn muốn nhận thông báo
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm">Loại</label>
              <div className="col-span-3">
                <Select value={alertType} onValueChange={setAlertType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại thông báo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="above">Khi giá vượt lên</SelectItem>
                    <SelectItem value="below">Khi giá giảm xuống</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm">Giá</label>
              <div className="col-span-3">
                <Input
                  type="number"
                  step="0.01"
                  value={alertPrice}
                  onChange={(e) => setAlertPrice(e.target.value)}
                  className="bg-[#2a2a2a] border-[#333]"
                  placeholder={`Giá hiện tại: ${selectedAlertStock?.matchPrice}`}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button className="bg-red-500 hover:bg-red-600" variant="outline" onClick={() => setIsPriceAlertOpen(false)}>
              Hủy
            </Button>
            <Button className="bg-green-500 hover:bg-green-600" onClick={handleSavePriceAlert}>
              Lưu cài đặt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden p-4 animate-[fadeIn_0.3s_ease-in-out]">
        {activeTab === 'price' && (
          <div className="h-full relative">
            <div className="h-[calc(83vh-132px)] overflow-auto">
              <div className="min-h-full flex flex-col">
                <div className="flex-grow">
                  <table className="w-full border-collapse">
                    <colgroup>
                      <col className="w-[60px]" /> {/* Mã CK */}
                      <col className="w-[60px]" /> {/* Trần */}
                      <col className="w-[60px]" /> {/* Sàn */}
                      <col className="w-[60px]" /> {/* TC */}
                      <col className="w-[60px]" /> {/* Giá 3 */}
                      <col className="w-[80px]" /> {/* KL 3 */}
                      <col className="w-[60px]" /> {/* Giá 2 */}
                      <col className="w-[80px]" /> {/* KL 2 */}
                      <col className="w-[60px]" /> {/* Giá 1 */}
                      <col className="w-[80px]" /> {/* KL 1 */}
                      <col className="w-[60px]" /> {/* Giá */}
                      <col className="w-[80px]" /> {/* KL */}
                      <col className="w-[70px]" /> {/* +/- */}
                      <col className="w-[60px]" /> {/* Giá 1 */}
                      <col className="w-[80px]" /> {/* KL 1 */}
                      <col className="w-[60px]" /> {/* Giá 2 */}
                      <col className="w-[80px]" /> {/* KL 2 */}
                      <col className="w-[60px]" /> {/* Giá 3 */}
                      <col className="w-[80px]" /> {/* KL 3 */}
                      <col className="w-[60px]" /> {/* Cao */}
                      <col className="w-[60px]" /> {/* Thấp */}
                      <col className="w-[60px]" /> {/* TB */}
                      <col className="w-[100px]" /> {/* Tổng KL */}
                      <col className="w-[80px]" /> {/* Mua */}
                      <col className="w-[80px]" /> {/* Bán */}
                      <col className="w-[100px]" /> {/* Thao tác */}
                    </colgroup>
                    <thead className="sticky top-0 bg-[#1a1a1a] z-50">
                      <tr>
                        <th 
                          className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2 cursor-pointer hover:text-white transition-colors" 
                          rowSpan={2}
                          onClick={() => handleSort('code')}
                        >
                          Mã CK <SortIndicator columnKey="code" />
                        </th>
                        <th 
                          className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2 cursor-pointer hover:text-white transition-colors" 
                          rowSpan={2}
                          onClick={() => handleSort('ceiling')}
                        >
                          Trần <SortIndicator columnKey="ceiling" />
                        </th>
                        <th 
                          className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2 cursor-pointer hover:text-white transition-colors" 
                          rowSpan={2}
                          onClick={() => handleSort('floor')}
                        >
                          Sàn <SortIndicator columnKey="floor" />
                        </th>
                        <th 
                          className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2 cursor-pointer hover:text-white transition-colors" 
                          rowSpan={2}
                          onClick={() => handleSort('ref')}
                        >
                          TC <SortIndicator columnKey="ref" />
                        </th>
                        <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2" colSpan={6}>Bên mua</th>
                        <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2" colSpan={3}>Khớp lệnh</th>
                        <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2" colSpan={6}>Bên bán</th>
                        <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2" rowSpan={2}>Cao</th>
                        <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2" rowSpan={2}>Thấp</th>
                        <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2" rowSpan={2}>TB</th>
                        <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2" rowSpan={2}>Tổng KL</th>
                        <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2" colSpan={2}>ĐTNN</th>
                        <th className="text-[#999] text-center whitespace-nowrap py-2" rowSpan={2}>Thao tác</th>
                      </tr>
                      <tr>
                        <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2">Giá 3</th>
                        <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2">KL 3</th>
                        <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2">Giá 2</th>
                        <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2">KL 2</th>
                        <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2">Giá 1</th>
                        <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2">KL 1</th>
                        <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2">Giá</th>
                        <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2">KL</th>
                        <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2">+/-</th>
                        <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2">Giá 1</th>
                        <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2">KL 1</th>
                        <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2">Giá 2</th>
                        <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2">KL 2</th>
                        <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2">Giá 3</th>
                        <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2">KL 3</th>
                        <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2">Mua</th>
                        <th className="text-[#999] text-center whitespace-nowrap py-2">Bán</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan="26" className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <svg className="animate-spin h-8 w-8 text-[#00FF00]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span className="text-[#888] text-sm">Đang tải dữ liệu...</span>
                            </div>
                          </td>
                        </tr>
                      ) : realTimeStockData.length === 0 ? (
                        <tr>
                          <td colSpan="26" className="text-center py-8">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 13h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div className="text-center">
                                <h3 className="text-lg font-medium text-gray-400">Không tìm thấy dữ liệu</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  Không có dữ liệu cho sàn {selectedExchange} tại thời điểm này
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        getFilteredData().map((stock) => (
                          <tr 
                            key={stock.code} 
                            className="hover:bg-[#1a1a1a]"
                          >
                            <td className={`border-r border-[#333] text-center font-medium transition-colors duration-300 cursor-pointer py-2 ${
                              priceChangeColors[stock.code] || 'text-white'
                            }`}
                              onClick={() => handleStockClick(stock)}
                            >
                              {stock.code}
                            </td>
                            <td className="text-[#FF424E] border-r border-[#333] text-center whitespace-nowrap py-2">{stock.ceiling}</td>
                            <td className="text-[#00C9FF] border-r border-[#333] text-center whitespace-nowrap py-2">{stock.floor}</td>
                            <td className="text-[#F4BE37] border-r border-[#333] text-center whitespace-nowrap py-2">{stock.ref}</td>
                            <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.buyPrice3}</td>
                            <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.buyVolume3}</td>
                            <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.buyPrice2}</td>
                            <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.buyVolume2}</td>
                            <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.buyPrice1}</td>
                            <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.buyVolume1}</td>
                            <td className={`border-r border-[#333] text-center whitespace-nowrap transition-colors duration-300 py-2 ${
                              priceChangeColors[stock.code] || 'text-white'
                            }`}>
                              {stock.matchPrice}
                            </td>
                            <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.matchVolume}</td>
                            <td className={`${stock.matchChange?.includes('+') ? 'text-[#00FF00]' : 'text-[#FF4A4A]'} border-r border-[#333] text-center whitespace-nowrap py-2`}>
                              {stock.matchChange}
                            </td>
                            <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.sellPrice1}</td>
                            <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.sellVolume1}</td>
                            <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.sellPrice2}</td>
                            <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.sellVolume2}</td>
                            <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.sellPrice3}</td>
                            <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.sellVolume3}</td>
                            <td className="text-[#00FF00] border-r border-[#333] text-center whitespace-nowrap py-2">{stock.high || '--'}</td>
                            <td className="text-[#FF4A4A] border-r border-[#333] text-center whitespace-nowrap py-2">{stock.low || '--'}</td>
                            <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">--</td>
                            <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.totalVolume}</td>
                            <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.foreignBuy}</td>
                            <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.foreignSell}</td>
                            <td className="text-center py-2">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToWatchlist(stock);
                                  }}
                                  className="p-1.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 transition-colors"
                                  title="Thêm vào danh sách theo dõi"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetPriceAlert(stock);
                                  }}
                                  className="p-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 transition-colors"
                                  title="Cài đặt thông báo giá"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer with exchange information - Now sticky */}
                <div className="sticky -bottom-4 bg-[#0a0a14] border-t border-[#333] py-4">
                  <div className="text-xs text-[#999] text-right px-4">
                    {selectedExchange === 'HOSE' && (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[#00C087] font-medium">HOSE:</span>
                        <span>Đơn vị giá: 1.000 VND, Khối lượng: 100 CP</span>
                      </div>
                    )}
                    {selectedExchange === 'HNX' && (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[#00B4D8] font-medium">HNX:</span>
                        <span>Đơn vị giá: 1.000 VNĐ, Đơn vị khối lượng: 1.000 CP</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockDerivatives;