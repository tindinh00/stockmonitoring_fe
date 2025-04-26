import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useFeatureStore from '@/store/featureStore';
import UnauthorizedFeatureMessage from '@/components/UnauthorizedFeatureMessage';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from "@/components/ui/input";
import moment from 'moment';
import axios from 'axios';
import TradingViewChart from '@/components/TradingViewChart';
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
  Info,
  Loader2,
  CheckCircle
} from 'lucide-react';
import Cookies from 'js-cookie';
import { getUserId, apiService, APP_BASE_URL } from '@/api/Api'; // Import APP_BASE_URL
import { stockService } from '@/api/StockApi'; // Update import to use named import
import axiosInstance from '@/api/axiosInstance'; // Import axiosInstance
import CandlestickChart from '@/components/CandlestickChart';

// Define the BASE_URL constant for API calls
const BASE_URL = APP_BASE_URL;

// SVG for Workspace Premium icon from Material Symbols Outlined
const WorkspacePremiumIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" height={size} viewBox="0 -960 960 960" width={size} className={className} fill="currentColor">
    <path d="M190-100v-60h60v-324q0-82 48.5-148.5T420-722v-68q0-24 18-42t42-42q24 0 42 18t18 42v68q74 29 122 95.5T710-484v324h60v60H190Zm290-360q-12 0-21-9t-9-21q0-12 9-21t21-9q12 0 21 9t9 21q0 12-9 21t-21 9Zm0-100q-12 0-21-9t-9-21q0-12 9-21t21-9q12 0 21 9t9 21q0 12-9 21t-21 9Zm0-100q-12 0-21-9t-9-21q0-12 9-21t21-9q12 0 21 9t9 21q0 12-9 21t-21 9Z"/>
  </svg>
);

// Debounce utility
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export default function StockDerivatives() {
  const navigate = useNavigate();
  const { hasFeature } = useFeatureStore();
  
  // Feature message state
  const [showFeatureMessage, setShowFeatureMessage] = useState(false);
  const [featureMessageInfo, setFeatureMessageInfo] = useState({ name: '', returnPath: '' });

  // Không cần kiểm tra quyền truy cập tính năng nữa vì đã đưa vào tính năng miễn phí

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
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [isPriceAlertOpen, setIsPriceAlertOpen] = useState(false);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertType, setAlertType] = useState('above');
  const [selectedAlertStock, setSelectedAlertStock] = useState(null);
  const [currentTime, setCurrentTime] = useState(moment());
  const [isSubmittingAlert, setIsSubmittingAlert] = useState(false);
  const [userWatchlist, setUserWatchlist] = useState([]);
  const [showPriceAlertDialog, setShowPriceAlertDialog] = useState(false);
  const [showWatchlist, setShowWatchlist] = useState(false); // Add this state for toggle
  // const tableContainerRef = useRef(null);

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
  const getFilteredData = (data) => {
    let filteredData = data.filter(stock => {
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
        const volume = parseFloat(stock.totalVolume?.toString().replace(/,/g, ''));
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
        const volume = parseFloat(stock.totalVolume?.toString().replace(/,/g, ''));
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
          aValue = parseFloat(aValue?.toString().replace(/,/g, ''));
          bValue = parseFloat(bValue?.toString().replace(/,/g, ''));
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

  // CSS Animation cho thay đổi giá và khối lượng
  const priceChangeAnimation = `
    @keyframes priceUp {
      0% { 
        background-color: rgba(0, 255, 0, 0.3);
        transform: scale(1.1);
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
        background-color: rgba(255, 0, 0, 0.3);
        transform: scale(1.1);
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
        background-color: rgba(244, 190, 55, 0.3);
        transform: scale(1.1);
        border-right: 1px solid #333;
      }
      100% { 
        background-color: transparent;
        transform: scale(1);
        border-right: 1px solid #333;
      }
    }

    .price-up {
      animation: priceUp 1s ease-out forwards;
    }
    
    .price-down {
      animation: priceDown 1s ease-out forwards;
    }

    .price-equal {
      animation: priceEqual 1s ease-out forwards;
    }
  `;

  // Cập nhật hàm getPriceColor để hỗ trợ cả light và dark mode
  const getPriceColor = (price, refPrice, ceilPrice, floorPrice) => {
    // Xử lý trường hợp giá trị là "--" (chuỗi đại diện cho giá trị null)
    if (price === '--' || refPrice === '--' || ceilPrice === '--' || floorPrice === '--') {
      return 'text-gray-900 dark:text-white';
    }
    
    // Xử lý trường hợp null, undefined hoặc giá trị không phải số
    if (price === null || refPrice === null || ceilPrice === null || floorPrice === null) {
      return 'text-gray-900 dark:text-white';
    }
    
    // Chuyển đổi sang số để so sánh, nhưng không làm tròn
    let numPrice = parseFloat(price);
    let numRefPrice = parseFloat(refPrice);
    let numCeilPrice = parseFloat(ceilPrice);
    let numFloorPrice = parseFloat(floorPrice);

    if (isNaN(numPrice) || isNaN(numRefPrice) || isNaN(numCeilPrice) || isNaN(numFloorPrice)) {
      return 'text-gray-900 dark:text-white';
    }

    // So sánh với sai số
    const epsilon = 0.001; // Sai số cho phép 0.001
    const equals = (a, b) => Math.abs(a - b) < epsilon;

    if (equals(numPrice, numRefPrice)) return 'text-[#F4BE37]'; // Vàng - Bằng giá tham chiếu
    if (equals(numPrice, numCeilPrice)) return 'text-[#B388FF]'; // Tím - Bằng giá trần
    if (equals(numPrice, numFloorPrice)) return 'text-[#00BCD4]'; // Xanh biển - Bằng giá sàn
    if (numPrice > numRefPrice && numPrice < numCeilPrice) return 'text-[#00FF00]'; // Xanh lá - Giữa tham chiếu và trần
    if (numPrice < numRefPrice && numPrice > numFloorPrice) return 'text-[#FF4A4A]'; // Đỏ - Giữa sàn và tham chiếu
    
    return 'text-gray-900 dark:text-white';
  };

  // Hàm xác định animation class
  const getChangeAnimation = (currentValue, previousValue, type = 'price') => {
    if (!currentValue || !previousValue) return '';
    
    currentValue = parseFloat(currentValue.toString().replace(/,/g, ''));
    previousValue = parseFloat(previousValue.toString().replace(/,/g, ''));
    
    if (isNaN(currentValue) || isNaN(previousValue)) return '';
    
    if (type === 'price') {
      if (currentValue > previousValue) return 'price-up';
      if (currentValue < previousValue) return 'price-down';
      return 'price-equal';
    }
    
    if (type === 'volume' && currentValue !== previousValue) {
      return 'volume-change';
    }
    
    return '';
  };

  // Cập nhật hàm getCellClass để hỗ trợ cả light và dark mode
  const getCellClass = (stock, field, type = 'price') => {
    // Kiểm tra stock và field tồn tại
    if (!stock) return 'text-gray-900 dark:text-white border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2';
    
    // Kiểm tra trường đặc biệt (tổng khối lượng luôn màu trắng)
    if (field === 'totalVolume') {
      return 'text-gray-900 dark:text-white border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2';
    }
    
    // Kiểm tra giá trị field
    const fieldValue = stock[field];
    
    // Xử lý trường hợp giá trị rỗng
    if (fieldValue === null || fieldValue === undefined || fieldValue === '' || fieldValue === '--') {
      if (type === 'volume') {
        // Đối với khối lượng, nếu giá trị rỗng, sử dụng màu của giá tương ứng
        const priceField = getPriceFieldForVolume(field);
        if (stock[priceField] && stock[priceField] !== '--') {
          const colorClass = getPriceColor(
            stock[priceField],
            stock.ref,
            stock.ceiling,
            stock.floor
          );
          return `${colorClass} border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2`;
        }
      }
      return 'text-gray-900 dark:text-white border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2';
    }

    // Xác định màu sắc
    let colorClass = 'text-gray-900 dark:text-white';
    
    if (type === 'price') {
      colorClass = getPriceColor(
        stock[field],
        stock.ref,
        stock.ceiling,
        stock.floor
      );
    } else if (type === 'volume') {
      // Xác định trường giá tương ứng với trường khối lượng
      const priceField = getPriceFieldForVolume(field);
      
      // Sử dụng màu sắc của giá tương ứng cho khối lượng
      if (stock[priceField]) {
        colorClass = getPriceColor(
          stock[priceField],
          stock.ref,
          stock.ceiling,
          stock.floor
        );
      }
    }

    // Determine animation class based on current and previous values
    let animationClass = '';
    const stockCode = stock.code;
    
    // Check if there's a specific animation stored for this stock and field in priceChangeColors
    const changeKey = `${stockCode}-${field}`;
    if (priceChangeColors[changeKey]) {
      animationClass = priceChangeColors[changeKey];
    } 
    // Otherwise, determine animation based on previous values if they exist
    else if (previousValues[stockCode] && previousValues[stockCode][field]) {
      const prevValue = previousValues[stockCode][field];
      animationClass = getChangeAnimation(
        fieldValue, 
        prevValue,
        type
      );
    }

    return `${colorClass} ${animationClass} border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2`;
  };

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

  // Theo dõi thay đổi giá và cập nhật màu sắc
  const updatePriceColors = (stockCode, currentPrice, previousPrice) => {
    if (!previousPrice || isNaN(currentPrice) || isNaN(previousPrice)) return 'text-white';
    
    const stock = realTimeStockData.find(s => s.code === stockCode);
    if (!stock) return 'text-white';

    const matchPrice = parseFloat(stock.matchPrice);
    const refPrice = parseFloat(stock.ref);
    const ceilPrice = parseFloat(stock.ceiling);
    const floorPrice = parseFloat(stock.floor);

    // So sánh với các mức giá
    let colorClass = '';
    if (matchPrice === refPrice) {
      colorClass = 'text-[#F4BE37]'; // Vàng - Bằng giá tham chiếu
    } else if (matchPrice === ceilPrice) {
      colorClass = 'text-[#B388FF]'; // Tím - Bằng giá trần
    } else if (matchPrice === floorPrice) {
      colorClass = 'text-[#00BCD4]'; // Xanh biển - Bằng giá sàn
    } else if (matchPrice > refPrice && matchPrice < ceilPrice) {
      colorClass = 'text-[#00FF00]'; // Xanh lá - Giữa tham chiếu và trần
    } else if (matchPrice < refPrice && matchPrice > floorPrice) {
      colorClass = 'text-[#FF4A4A]'; // Đỏ - Giữa sàn và tham chiếu
    }

    // Thêm animation dựa trên sự thay đổi
    if (currentPrice > previousPrice) {
      return `${colorClass} price-up`;
    } else if (currentPrice < previousPrice) {
      return `${colorClass} price-down`;
    } else if (currentPrice === previousPrice) {
      return `${colorClass} price-equal`;
    }
    
    return colorClass;
  };

  // Theo dõi thay đổi khối lượng
  const [volumeHistory, setVolumeHistory] = useState({});

  useEffect(() => {
    if (realTimeStockData.length > 0) {
      const newVolumeHistory = { ...volumeHistory };
      
      realTimeStockData.forEach(stock => {
        const oldStock = volumeHistory[stock.code];
        if (oldStock) {
          const currentVolume = parseFloat(stock.totalVolume.replace(/,/g, ''));
          const previousVolume = parseFloat(oldStock.replace(/,/g, ''));
          
          if (currentVolume !== previousVolume) {
            newVolumeHistory[stock.code] = stock.totalVolume;
          }
        } else {
          newVolumeHistory[stock.code] = stock.totalVolume;
        }
      });
      
      setVolumeHistory(newVolumeHistory);
    }
  }, [realTimeStockData]);

  // Hàm kiểm tra thay đổi khối lượng
  const getVolumeChangeClass = (stock, volumeField) => {
    const oldVolume = volumeHistory[stock.code];
    if (!oldVolume) return '';

    const currentVolume = stock[volumeField];
    if (currentVolume !== oldVolume) {
      return 'volume-change';
    }
    return '';
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
  const fetchStockData = async (timestamp = null, retry = false) => {
    try {
      // Map exchange based on selected tab
      let exchange = selectedExchange === 'HOSE' ? 'hsx' : 'hnx';
      
      // Reset data và hiển thị loading khi chuyển sàn hoặc tải lần đầu
      if (!timestamp) {
        setRealTimeStockData([]);
        setIsLoading(true);
      }
      
      let response;
      if (timestamp) {
        // Nếu có timestamp, sử dụng session API và không hiển thị loading
        console.log(`Updating ${exchange} stock data with timestamp:`, timestamp);
        response = await axios.get(`https://stockmonitoring-api-gateway.onrender.com/api/stock/session`, {
          params: {
            exchange: exchange,
            timestamp: timestamp
          }
        });
      } else {
        // Cho lần tải đầu tiên hoặc khi chuyển sàn
        console.log(`Fetching initial ${exchange} stock data`);
        response = await axios.get(`https://stockmonitoring-api-gateway.onrender.com/api/stock/latest`, {
          params: {
            exchange: exchange
          }
        });
      }
      
      if (response?.data?.value?.data) {
        const stockData = response.data.value.data;
        
        // Cập nhật dữ liệu theo cách mới
        setRealTimeStockData(prevData => {
          // Nếu đang chuyển sàn, tạo mảng mới
          if (!timestamp && !prevData.length) {
            return stockData.map(stock => {
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
          }

          // Nếu là cập nhật realtime, chỉ cập nhật các giá trị thay đổi
          const newData = [...prevData];
          const newPriceHistory = { ...priceHistory };
          const newPriceChangeColors = { ...priceChangeColors };
          let newPreviousValues = { ...previousValues };
          let hasChanges = false;

          stockData.forEach(stock => {
            const existingIndex = newData.findIndex(item => item.code === stock.stockCode);
            if (existingIndex === -1) return;

            const formatValue = (value) => {
              if (value === null || value === undefined || value === '' || value === 0) {
                return '--';
              }
              return String(value);
            };

            const newValues = {
              matchPrice: formatValue(stock.matchPrice),
              matchVolume: formatValue(stock.matchedOrderVolume),
              matchChange: stock.plusMinus !== null ? `${parseFloat(stock.plusMinus) > 0 ? '+' : ''}${stock.plusMinus}%` : '--',
              buyPrice1: formatValue(stock.price1Buy),
              buyVolume1: formatValue(stock.volume1Buy),
              buyPrice2: formatValue(stock.price2Buy),
              buyVolume2: formatValue(stock.volume2Buy),
              buyPrice3: formatValue(stock.price3Buy),
              buyVolume3: formatValue(stock.volume3Buy),
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

            // Save the current values to previousValues before updating
            if (!newPreviousValues[stock.stockCode]) {
              newPreviousValues[stock.stockCode] = {};
            }
            
            // We need to store the previous value for each field that changes
            const currentData = newData[existingIndex];
            const stockCode = stock.stockCode;
            
            // Check for price changes and apply color animations
            const priceFields = [
              'matchPrice', 'buyPrice1', 'buyPrice2', 'buyPrice3', 
              'sellPrice1', 'sellPrice2', 'sellPrice3'
            ];
            
            priceFields.forEach(field => {
              const currentValue = parseFloat(newValues[field]?.replace(/,/g, '') || '0');
              const oldValue = parseFloat(currentData[field]?.replace(/,/g, '') || '0');
              
              // Only register changes for valid numbers
              if (!isNaN(currentValue) && !isNaN(oldValue) && currentValue !== oldValue) {
                hasChanges = true;
                
                // Store the previous value
                newPreviousValues[stockCode][field] = currentData[field];
                
                // Apply animation class
                if (currentValue > oldValue) {
                  newPriceChangeColors[`${stockCode}-${field}`] = 'price-up';
                } else if (currentValue < oldValue) {
                  newPriceChangeColors[`${stockCode}-${field}`] = 'price-down';
                }
              }
            });

            // Cập nhật giá trị mới
            newData[existingIndex] = {
              ...newData[existingIndex],
              ...newValues
            };
          });

          // Chỉ cập nhật state nếu có thay đổi
          if (hasChanges) {
            setPreviousValues(newPreviousValues);
            setPriceHistory(newPriceHistory);
            setPriceChangeColors(newPriceChangeColors);
          }

          return newData;
        });
      }
      
      setIsLoading(false);
      return true;
    } catch (error) {
      if (error.response && error.response.status === 404 && exchange === 'hnx' && !retry) {
        // Nếu là HNX và bị 404, thử lại 1 lần sau 2 giây
        setTimeout(() => fetchStockData(timestamp, true), 2000);
        setIsLoading(false);
        return false;
      } else if (error.response && error.response.status === 404) {
        // Nếu là 404 (không phải HNX), chỉ clear data, không hiện lỗi nặng
        setRealTimeStockData([]);
        setIsLoading(false);
        return false;
      }
      // Các lỗi khác
      setRealTimeStockData([]);
      setIsLoading(false);
      toast.error('Không thể tải dữ liệu sàn ' + selectedExchange + '. Vui lòng thử lại sau.');
      return false;
    }
  };

  // Add useEffect to refetch data when exchange changes
  useEffect(() => {
    console.log("Exchange changed to:", selectedExchange);
    // Reset data when changing exchange
    setRealTimeStockData([]);
    setPriceHistory({});
    setPriceChangeColors({});
    
    // Clear watchlist data immediately when exchange changes
    if (showWatchlist) {
      setWatchlist([]);
      fetchWatchlistData();
    } else {
      fetchStockData();
    }
  }, [selectedExchange]); // Chỉ quan tâm đến sự thay đổi của selectedExchange

  // Debounced fetch for watchlist and main table
  const debouncedFetchWatchlist = useRef(debounce(() => fetchWatchlistData(), 1000)).current;
  const debouncedFetchStockData = useRef(debounce((timestamp) => fetchStockData(timestamp), 1000)).current;

  // Add SignalR event listeners (debounced, only fetch when correct exchange)
  useEffect(() => {
    const handleStockUpdate = (event) => {
      const { exchange, timestamp } = event.detail;
      if (
        showWatchlist &&
        ((exchange === 'hsx' && selectedExchange === 'HOSE') ||
          (exchange === 'hnx' && selectedExchange === 'HNX'))
      ) {
        debouncedFetchWatchlist();
      } else if (
        !showWatchlist &&
        ((exchange === 'hsx' && selectedExchange === 'HOSE') ||
          (exchange === 'hnx' && selectedExchange === 'HNX'))
      ) {
        debouncedFetchStockData(timestamp);
      }
    };
    window.addEventListener('stockUpdate', handleStockUpdate);
    return () => {
      window.removeEventListener('stockUpdate', handleStockUpdate);
    };
  }, [selectedExchange, showWatchlist, debouncedFetchWatchlist, debouncedFetchStockData]);

  // Add sample chart data
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [chartError, setChartError] = useState(null);

  useEffect(() => {
    const fetchChartData = async () => {
      if (!selectedStock) return;

      setIsChartLoading(true);
      setChartError(null);

      try {
        const token = Cookies.get('auth_token');
      
        if (!token) {
          setChartError('Vui lòng đăng nhập để xem dữ liệu');
          toast.error('Vui lòng đăng nhập để xem dữ liệu');
          return;
        }

        const response = await axios.get(
          `https://stockmonitoring-api-gateway.onrender.com/api/stock-price-history?ticketSymbol=${selectedStock.code}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'accept': 'text/plain'
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
          setChartData(formattedData);
        } else {
          setChartError('Không có dữ liệu cho mã này');
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
        setChartError('Không thể tải dữ liệu biểu đồ');
        toast.error('Không thể tải dữ liệu biểu đồ');
      } finally {
        setIsChartLoading(false);
      }
    };

    fetchChartData();
  }, [selectedStock]);

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
    
    /* Sticky header styles */
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
    
    .dark .stock-table-container {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
    
    /* Đảm bảo header luôn cố định trên cùng và không bị ẩn khi scroll */
    .stock-table-container thead tr:first-child th {
      position: sticky;
      background-color: #f9fafb;
      top: 0;
      padding-bottom: 10px;
    }
    
    .dark .stock-table-container thead tr:first-child th {
      background-color: #1a1a1a;
    }
    
    /* Đảm bảo header row thứ hai hiển thị đúng */
    .stock-table-container thead tr:nth-child(2) th {
      position: sticky;
      top: 38px; /* Chiều cao của header row đầu tiên */
      background-color: #f9fafb;
      padding-top: 10px;
      border-top: none !important;
    }
    
    .dark .stock-table-container thead tr:nth-child(2) th {
      background-color: #1a1a1a;
    }
    
    /* Force inline borders to display */
    [style*="border-bottom"] {
      border-bottom-style: solid !important;
    }
    
    /* Tạo các line header cố định */
    .stock-table-container .header-benmua::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background-color: #e5e7eb;
      z-index: 11;
    }
    
    .dark .stock-table-container .header-benmua::after {
      background-color: #444;
    }
    
    .stock-table-container .header-khoplеnh::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background-color: #e5e7eb;
      z-index: 11;
    }
    
    .dark .stock-table-container .header-khoplеnh::after {
      background-color: #444;
    }
    
    .stock-table-container .header-benban::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background-color: #e5e7eb;
      z-index: 11;
    }
    
    .dark .stock-table-container .header-benban::after {
      background-color: #444;
    }
    
    .stock-table-container .header-dtnn::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background-color: #e5e7eb;
      z-index: 11;
    }
    
    .dark .stock-table-container .header-dtnn::after {
      background-color: #444;
    }
  `;

  // Add this function to fetch watchlist data
  const fetchWatchlistData = async (retry = false) => {
    try {
      // Kiểm tra quyền truy cập tính năng trước khi gọi API
      const hasNotificationFeature = hasFeature("Quản lý thông báo theo nhu cầu");
      if (!hasNotificationFeature) {
        // Nếu không có quyền truy cập, không tiếp tục thực hiện gọi API
        // Chuyển về chế độ xem tất cả
        setShowWatchlist(false);
        setFeatureMessageInfo({
          name: 'Danh sách theo dõi và Thông báo',
          returnPath: '/stock'
        });
        setShowFeatureMessage(true);
        return;
      }
      
      // Reset watchlist data FIRST before loading
      setWatchlist([]);
      setIsWatchlistLoading(true);
      
      const userId = getUserId();
      if (!userId) {
        toast.error("Vui lòng đăng nhập để xem danh sách theo dõi");
        setIsWatchlistLoading(false);
        return;
      }

      const token = Cookies.get("auth_token");
      if (!token) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại");
        setIsWatchlistLoading(false);
        return;
      }

      // Map exchange based on selected tab
      let exchange = selectedExchange === 'HOSE' ? 'hsx' : 'hnx';

      const response = await axios.get(
        `${APP_BASE_URL}/api/watchlist-stock/${userId}`,
        {
          params: {
            exchange: exchange
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );

      if (response?.data?.value?.data) {
        const watchlistStocks = response.data.value.data.map(stock => ({
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
        setWatchlist(watchlistStocks);
      } else {
        setWatchlist([]);
      }
      setIsWatchlistLoading(false);
    } catch (error) {
      let exchange = selectedExchange === 'HOSE' ? 'hsx' : 'hnx';
      if (error.response && error.response.status === 404 && exchange === 'hnx' && !retry) {
        // Nếu là HNX và bị 404, thử lại 1 lần sau 2 giây
        setTimeout(() => fetchWatchlistData(true), 2000);
        setWatchlist([]);
        setIsWatchlistLoading(false);
        return;
      } else if (error.response && error.response.status === 404) {
        // Nếu là 404 (không phải HNX), chỉ clear data, không hiện lỗi nặng
        setWatchlist([]);
        setIsWatchlistLoading(false);
        return;
      }
      // Các lỗi khác
      setWatchlist([]);
      setIsWatchlistLoading(false);
      toast.error("Không thể tải danh sách theo dõi");
    }
  };

  // Add useEffect to fetch watchlist data when toggled or exchange changes
  useEffect(() => {
    if (showWatchlist) {
      fetchWatchlistData();
    } else {
      // When switching back to realtime mode, fetch the latest data
      fetchStockData();
    }
  }, [showWatchlist, selectedExchange]);

  // Xử lý hành động thêm vào danh sách theo dõi

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
        const response = await axios.delete(
          `${APP_BASE_URL}/api/watchlist-stock`,
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
        
        setWatchlist(watchlist.filter(item => item.code !== stock.code));
        toast.success(`Đã xóa ${stock.code} khỏi danh sách theo dõi`);
      } else {
        // Add to watchlist with correct request format
        const response = await axios.post(
          `${APP_BASE_URL}/api/watchlist-stock`,
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
        
        setWatchlist([...watchlist, stock]);
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
      setAlertPrice(stock.price || stock.priorClosePrice || '');
      setIsPriceAlertOpen(true);
    } catch (error) {
      console.error("Set price alert error:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại sau", {
        position: "top-right",
        duration: 3000,
      });
    }
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
    if (alertType === 'above' && price < currentPrice) {
      toast.error('Giá cảnh báo phải bằng hoặc cao hơn giá hiện tại');
      return;
    }

    if (alertType === 'below' && price > currentPrice) {
      toast.error('Giá cảnh báo phải bằng hoặc thấp hơn giá hiện tại');
      return;
    }

    try {
      setIsSubmittingAlert(true);
      // Gọi API tạo cảnh báo giá
      const alertTypeApi = alertType === 'above' ? 'increase' : 'decrease';
      
      const result = await apiService.createPriceAlert(
        selectedAlertStock.code.toUpperCase(),
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
      setCurrentTime(moment());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  // Add state for previous values after other state declarations
  const [previousValues, setPreviousValues] = useState({});

  // Add useEffect for handling animation cleanup
  useEffect(() => {
    const timeoutIds = [];
    
    Object.keys(priceChangeColors).forEach(key => {
      const timeoutId = setTimeout(() => {
        setPriceChangeColors(prev => {
          const newColors = { ...prev };
          delete newColors[key];
          return newColors;
        });
      }, 1000); // 1000ms = duration of animation
      
      timeoutIds.push(timeoutId);
    });

    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, [priceChangeColors]);

  // Add state for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stockToDelete, setStockToDelete] = useState(null);
  const [isDeletingStock, setIsDeletingStock] = useState(false);

  // useMemo for filtered data
  const dataToDisplay = showWatchlist ? watchlist : realTimeStockData;
  const filteredData = useMemo(() => getFilteredData(dataToDisplay), [dataToDisplay, searchQuery, selectedIndustry, filters, sortConfig]);

  // useCallback for handlers
  const handleAddToWatchlistCb = useCallback(handleAddToWatchlist, [watchlist]);
  const handleSetPriceAlertCb = useCallback(handleSetPriceAlert, [hasFeature]);

  // Thêm useEffect để phản ứng khi chuyển đổi giữa chế độ watchlist và bảng giá thông thường
  useEffect(() => {
    // Khi bật/tắt chế độ watchlist, tải dữ liệu phù hợp
    if (showWatchlist) {
      setWatchlist([]); // Reset watchlist data
      fetchWatchlistData();
    } else {
      fetchStockData(); // Load regular stock data
    }
  }, [showWatchlist]);

  // Thêm hàm để kiểm tra và xử lý chuyển đổi chế độ danh sách theo dõi
  const handleToggleWatchlist = () => {
    // Kiểm tra nếu người dùng có quyền "Quản lý thông báo theo nhu cầu"
    const hasNotificationFeature = hasFeature("Quản lý thông báo theo nhu cầu");
    
    if (!hasNotificationFeature) {
      // Hiển thị dialog thông báo nâng cấp gói
      setFeatureMessageInfo({
        name: 'Danh sách theo dõi và Thông báo',
        returnPath: '/stock'
      });
      setShowFeatureMessage(true);
      return;
    }
    
    // Nếu có quyền, cho phép chuyển đổi chế độ danh sách theo dõi
    setShowWatchlist(!showWatchlist);
  };

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
              onChange={(e) => setSearchQuery(e.target.value)}
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
            {exchanges.map((exchange) => (
              <button
                key={exchange.id}
                onClick={() => setSelectedExchange(exchange.id)}
                className={`
                  relative group flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md
                  transition-all duration-300 ease-in-out
                  ${selectedExchange === exchange.id
                    ? 'bg-gray-200 dark:bg-[#2a2a2a] text-gray-900 dark:text-white shadow-md'
                    : 'text-gray-600 dark:text-[#888] hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a]/50'
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
                <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-200 dark:bg-[#2a2a2a] text-gray-900 dark:text-white rounded whitespace-nowrap">
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
            <SelectTrigger className="w-[180px] bg-gray-50 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333] text-gray-900 dark:text-white">
              <SelectValue placeholder="Chọn ngành" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333] text-gray-900 dark:text-white">
              {industryOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Watchlist Toggle - With Feature Check */}
          <div className="flex items-center gap-2 relative">
            <label 
              className="relative inline-flex items-center cursor-pointer" 
              title={hasFeature("Quản lý thông báo theo nhu cầu") ? "Chuyển chế độ danh sách theo dõi" : "Tính năng của gói nâng cao"}
              onClick={(e) => {
                // Ngăn chặn hành vi mặc định nếu không có quyền
                if (!hasFeature("Quản lý thông báo theo nhu cầu")) {
                  e.preventDefault();
                  // Hiển thị dialog thông báo nâng cấp gói
                  setFeatureMessageInfo({
                    name: 'Danh sách theo dõi và Thông báo',
                    returnPath: '/stock'
                  });
                  setShowFeatureMessage(true);
                }
              }}
            >
              <input
                type="checkbox"
                className="sr-only peer"
                checked={showWatchlist}
                onChange={handleToggleWatchlist}
              />
              <div className={`w-11 h-6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer ${hasFeature("Quản lý thông báo theo nhu cầu") ? "dark:bg-gray-700 bg-gray-200" : "dark:bg-gray-600 bg-gray-300"} peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600`}></div>
              <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Danh sách theo dõi</span>
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

        {/* Date and Time Display */}
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
              ) : chartData.length === 0 ? (
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
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm">Giá</label>
              <div className="col-span-3">
                <Input
                  type="number"
                  step="0.01"
                  value={alertPrice}
                  onChange={(e) => setAlertPrice(e.target.value)}
                  className="bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#333] text-gray-900 dark:text-white"
                  placeholder={`Giá hiện tại: ${selectedAlertStock?.matchPrice}`}
                  disabled={isSubmittingAlert}
                />
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
                  <thead>
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
                    {(showWatchlist ? isWatchlistLoading : isLoading) ? (
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
                    ) : (filteredData.length === 0 ? (
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
                    ) : null)}
                    {filteredData.length > 0 && filteredData.map((stock) => (
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
                        <td className={`${stock.matchChange?.includes('+') ? 'text-[#00FF00]' : 'text-[#FF4A4A]'} border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap px-2 py-1.5`}>{stock.matchChange}</td>
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
              
              {/* Footer with exchange information */}
              <div className="sticky -bottom-4 bg-white dark:bg-[#0a0a14] border-t border-gray-200 dark:border-[#333] py-4 mt-4">
                <div className="text-xs text-gray-500 dark:text-[#999] text-right px-4">
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
                  setWatchlist(watchlist.filter(item => item.code !== stockToDelete.code));
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