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
  let timer = null;
  return function(...args) {
    const context = this;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(context, args);
    }, delay);
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
  const [isInitialWatchlistLoad, setIsInitialWatchlistLoad] = useState(true);
  const [isSignalRUpdating, setIsSignalRUpdating] = useState(false); // Thêm state mới
  const [watchlist, setWatchlist] = useState([]);
  const [isPriceAlertOpen, setIsPriceAlertOpen] = useState(false);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertType, setAlertType] = useState('above');
  const [selectedAlertStock, setSelectedAlertStock] = useState(null);
  const [currentTime, setCurrentTime] = useState(moment());
  const [lastTimestamp, setLastTimestamp] = useState(null);
  const [isSubmittingAlert, setIsSubmittingAlert] = useState(false);
  const [userWatchlist, setUserWatchlist] = useState([]);
  const [showPriceAlertDialog, setShowPriceAlertDialog] = useState(false);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [chartError, setChartError] = useState(null);
  // const tableContainerRef = useRef(null);

  // Add sorting state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

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
      // Search filter - mở rộng tìm kiếm cả mã và tên
      if (searchQuery && searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const stockCode = (stock.code || '').toLowerCase();
        const stockName = (stock.stockName || stock.companyName || '').toLowerCase();
        
        if (!stockCode.includes(query) && !stockName.includes(query)) {
          return false;
        }
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
    setIsChartLoading(true);
    setChartError(null);
    
    // Fetch chart data for the selected stock
    const fetchChartData = async () => {
      try {
        const token = Cookies.get('auth_token');
        
        if (!token) {
          setChartError('Vui lòng đăng nhập để xem dữ liệu biểu đồ');
          toast.error('Vui lòng đăng nhập để xem dữ liệu biểu đồ');
          setIsChartLoading(false);
          return;
        }
        
        console.log(`Fetching chart data for stock: ${stock.code}`);
        
        const response = await axiosInstance.get(`/api/stock-price-history`, {
          params: {
            ticketSymbol: stock.code // Gửi mã cổ phiếu in hoa thay vì chữ thường
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        console.log("Chart data response:", response);
        
        if (response?.data?.value?.data && response.data.value.data.length > 0) {
          const formattedData = response.data.value.data.map(item => ({
            time: Math.floor(new Date(item.tradingDate).getTime() / 1000),
            open: parseFloat(item.openPrice),
            high: parseFloat(item.highPrice),
            low: parseFloat(item.lowPrice),
            close: parseFloat(item.closePrice),
            volume: parseFloat(item.volume || 0)
          }));
          
          setChartData(formattedData);
          console.log("Formatted chart data:", formattedData);
        } else {
          setChartData([]);
          setChartError('Không có dữ liệu lịch sử cho mã này');
          console.warn("No chart data received from API");
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
        setChartData([]);
        setChartError(`Không thể tải dữ liệu biểu đồ: ${error.message}`);
        toast.error('Không thể tải dữ liệu biểu đồ');
      } finally {
        setIsChartLoading(false);
      }
    };
    
    fetchChartData();
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
    // Bỏ qua các trường hợp giá trị không hợp lệ
    if (price === '--' || refPrice === '--' || ceilPrice === '--' || floorPrice === '--' ||
        price === null || refPrice === null || ceilPrice === null || floorPrice === null) {
      return 'text-gray-900 dark:text-white'; // Màu mặc định cho giá trị rỗng
    }
    
    // Xử lý số dấu phẩy trong chuỗi và chuyển đổi sang số
    const numPrice = parseFloat(String(price).replace(/,/g, ''));
    const numRefPrice = parseFloat(String(refPrice).replace(/,/g, ''));
    const numCeilPrice = parseFloat(String(ceilPrice).replace(/,/g, ''));
    const numFloorPrice = parseFloat(String(floorPrice).replace(/,/g, ''));

    // Kiểm tra tính hợp lệ của các giá trị số
    if (isNaN(numPrice) || isNaN(numRefPrice) || isNaN(numCeilPrice) || isNaN(numFloorPrice)) {
      return 'text-gray-900 dark:text-white'; // Màu mặc định cho giá trị không hợp lệ
    }

    // Xác định màu sắc theo thứ tự ưu tiên rõ ràng
    // Sử dụng sai số nhỏ hơn để so sánh số thực chính xác hơn
    const epsilon = 0.0001;
    
    // Kiểm tra từng trường hợp theo thứ tự ưu tiên
    // 1. Kiểm tra giá trần (tím)
    if (Math.abs(numPrice - numCeilPrice) < epsilon) {
      return 'text-[#B388FF]'; // Màu tím - Bằng giá trần
    }
    
    // 2. Kiểm tra giá sàn (xanh lam)
    if (Math.abs(numPrice - numFloorPrice) < epsilon) {
      return 'text-[#00BCD4]'; // Màu xanh lam - Bằng giá sàn
    }
    
    // 3. Kiểm tra giá tham chiếu (vàng)
    if (Math.abs(numPrice - numRefPrice) < epsilon) {
      return 'text-[#F4BE37]'; // Màu vàng - Bằng giá tham chiếu
    }
    
    // 4. Kiểm tra giá tăng (xanh lá)
    if (numPrice > numRefPrice) {
      return 'text-[#22c55e] dark:text-[#00FF00]'; // Màu xanh lá - Cao hơn giá tham chiếu
    }
    
    // 5. Kiểm tra giá giảm (đỏ)
    if (numPrice < numRefPrice) {
      return 'text-[#FF4A4A]'; // Màu đỏ - Thấp hơn giá tham chiếu
    }
    
    // Trường hợp mặc định (hiếm khi xảy ra)
    return 'text-gray-900 dark:text-white';
  };

  // Hàm xác định animation class
  const getChangeAnimation = (currentValue, previousValue, type = 'price') => {
    if (!currentValue || !previousValue) return '';
    
    // Chuyển đổi cả hai giá trị sang số
    const current = parseFloat(String(currentValue).replace(/,/g, ''));
    const previous = parseFloat(String(previousValue).replace(/,/g, ''));
    
    if (isNaN(current) || isNaN(previous)) return '';
    
    // Thêm threshold để tránh animation với thay đổi rất nhỏ
    const priceChangeThreshold = 0.001; // 0.1% cho giá
    const volumeChangeThreshold = 0.01; // 1% cho khối lượng
    
    if (type === 'price') {
      // Chỉ hiệu ứng khi thay đổi đáng kể
      if (previous !== 0 && Math.abs(current - previous) / Math.abs(previous) > priceChangeThreshold) {
        if (current > previous) return 'price-up';
        if (current < previous) return 'price-down';
      } else if (previous === 0 && current !== 0) {
        // Trường hợp đặc biệt khi giá trước đó là 0
        if (current > 0) return 'price-up';
        if (current < 0) return 'price-down';
      }
      return '';
    }
    
    if (type === 'volume') {
      // Với khối lượng, chỉ hiệu ứng khi thay đổi đáng kể
      if (previous !== 0 && Math.abs(current - previous) / Math.abs(previous) > volumeChangeThreshold) {
        if (current > previous) return 'volume-up';
        if (current < previous) return 'volume-down';
      } else if (previous === 0 && current > 0) {
        // Trường hợp đặc biệt khi khối lượng trước đó là 0
        return 'volume-up';
      }
      return '';
    }
    
    return '';
  };

  // Cập nhật hàm getCellClass để hỗ trợ hiển thị thay đổi khối lượng
  const getCellClass = (stock, field, type = 'price') => {
    // Kiểm tra stock và field tồn tại
    if (!stock) return 'text-gray-900 dark:text-white border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2';
    
    // Kiểm tra giá trị field
    const fieldValue = stock[field];
    
    // Xử lý trường hợp giá trị rỗng
    if (fieldValue === null || fieldValue === undefined || fieldValue === '' || fieldValue === '--') {
      return 'text-gray-900 dark:text-white border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-2';
    }

    // Xác định màu sắc cơ bản dựa trên giá
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

    // Xác định animation class dựa trên thay đổi
    let animationClass = '';
    const stockCode = stock.code;
    const changeKey = `${stockCode}-${field}`;
    
    // Kiểm tra có animation được lưu trữ cho field này không
    if (priceChangeColors[changeKey]) {
      animationClass = priceChangeColors[changeKey];
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

    // Cập nhật thay đổi màu ngay lập tức
    // Sử dụng setTimeout với độ trễ = 0 để đưa vào event loop tiếp theo
    // giúp React render nhanh hơn
    setTimeout(() => {
      setPriceChangeColors(prev => ({
        ...prev,
        [`${stock.code}-matchPrice`]: getChangeAnimation(currentPrice, previousPrice, 'price')
      }));
    }, 0);

    return getPriceColor(currentPrice, stock.ref, stock.ceiling, stock.floor);
  };

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

  // Update the existing handleStockDataError function
  const handleStockDataError = () => {
    setRealTimeStockData([]);
    setPriceHistory({});
    setPriceChangeColors({});
    setIsLoading(false);
  };

  // Fetch stock data first, then set up SignalR
  const fetchStockData = async (timestamp = null, retry = false, apiExchangeOverride = null, isSignalRUpdate = false) => {
    // Define exchangeMap at the top of the function to ensure it's available in catch block
    const exchangeMap = {
      'HOSE': 'hsx',
      'HNX': 'hnx'
    };
    
    // If apiExchangeOverride is provided, use it directly (it's already in API format)
    // Otherwise, map from the selected exchange display name to API format
    let exchange = apiExchangeOverride || exchangeMap[selectedExchange] || 'hsx';
    
    try {
      // Log the selected exchange and exchange value used for API
      console.log(`FETCH STOCK DATA - Current tab: ${selectedExchange}, Using API exchange value: ${exchange}`);
      
      // Chỉ hiển thị loading khi:
      // 1. Không có timestamp (tải lần đầu, không phải update)
      // 2. Không phải update từ SignalR
      // 3. Không đang trong trạng thái isSignalRUpdating
      if (!timestamp && !isSignalRUpdate && !isSignalRUpdating) {
        setRealTimeStockData([]);
        setIsLoading(true);
      }
      
      let response;
      if (timestamp) {
        console.log(`Updating ${exchange} stock data with timestamp:`, timestamp);
        // Use axiosInstance directly with our exchange value
        response = await axiosInstance.get(`/api/stock/session`, {
          params: {
            exchange: exchange, // Do not modify this value - we've already mapped it correctly
            timestamp: timestamp
          }
        });
        
        console.log(`Direct API call params - exchange: ${exchange}, timestamp: ${timestamp}`);
        
        // Cập nhật timestamp từ SignalR một cách trực tiếp
        if (timestamp) {
          console.log("Setting lastTimestamp to:", timestamp);
          setLastTimestamp(timestamp);
        }
      } else {
        console.log(`Fetching initial ${exchange} stock data`);
        // Use axiosInstance directly with our exchange value
        response = await axiosInstance.get(`/api/stock/latest`, {
          params: {
            exchange: exchange // Do not modify this value - we've already mapped it correctly
          }
        });
        
        console.log(`Direct API call params - exchange: ${exchange}`);
      }
      
      if (response?.data?.value?.data) {
        // Update last timestamp from API response if we don't have a timestamp from SignalR
        if (response.data.value.timestamp && !timestamp) {
          setLastTimestamp(response.data.value.timestamp);
        }
        
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
      // Now exchange is available here since we defined it outside the try block
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
        
        setWatchlist(watchlist.filter(item => item.code !== stock.code));
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

  // Lưu trữ dữ liệu cũ từ lần cập nhật trước
  const [previousValues, setPreviousValues] = useState({});

  // Cập nhật dữ liệu trước đó khi có dữ liệu mới
  useEffect(() => {
    if (realTimeStockData.length > 0) {
      const newPreviousValues = { ...previousValues };
      
      realTimeStockData.forEach(stock => {
        if (!stock.code) return;
        
        // Nếu chưa có dữ liệu cho mã này, tạo mới
        if (!newPreviousValues[stock.code]) {
          newPreviousValues[stock.code] = {};
        }
        
        // Lưu lại tất cả các trường liên quan đến giá và khối lượng
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
        
        fieldsToTrack.forEach(field => {
          if (stock[field] !== undefined) {
            // Chỉ cập nhật giá trị trước đó nếu có sự thay đổi
            if (newPreviousValues[stock.code][field] !== stock[field]) {
              // Sử dụng setTimeout với độ trễ = 0 để đưa vào event loop tiếp theo
              // giúp React render nhanh hơn
              setTimeout(() => {
                // Lưu animation class vào priceChangeColors để hiển thị
                setPriceChangeColors(prev => ({
                  ...prev,
                  [`${stock.code}-${field}`]: field.includes('Price') ? 
                    getChangeAnimation(stock[field], newPreviousValues[stock.code][field], 'price') :
                    getChangeAnimation(stock[field], newPreviousValues[stock.code][field], 'volume')
                }));
                
                // Lưu giá trị hiện tại vào previous để sử dụng trong lần cập nhật tiếp theo
                newPreviousValues[stock.code][field] = stock[field];
              }, 0);
            }
          }
        });
      });
      
      setPreviousValues(newPreviousValues);
    }
  }, [realTimeStockData]);

  // Xóa hiệu ứng sau khi hiển thị
  useEffect(() => {
    if (Object.keys(priceChangeColors).length > 0) {
      const timer = setTimeout(() => {
        setPriceChangeColors({});
      }, 1000); // Hiển thị trong 1 giây thay vì 2 giây
      
      return () => clearTimeout(timer);
    }
  }, [priceChangeColors]);

  // Add state for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stockToDelete, setStockToDelete] = useState(null);
  const [isDeletingStock, setIsDeletingStock] = useState(false);

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
  const filteredData = useMemo(() => getFilteredData(dataToDisplay), [dataToDisplay, searchQuery, filters, sortConfig]);

  // useCallback for handlers
  const handleAddToWatchlistCb = useCallback(handleAddToWatchlist, [watchlist]);
  const handleSetPriceAlertCb = useCallback(handleSetPriceAlert, [hasFeature]);

  // Define debounced functions
  const debouncedFetchWatchlist = useRef(
    debounce((apiExchange) => {
      // apiExchange is already in API format ('hsx' or 'hnx'), so we use it directly
      console.log(`Creating debounced watchlist function with api exchange: ${apiExchange}`);
      // Thiết lập state để biết đang cập nhật từ SignalR
      setIsSignalRUpdating(true);
      // Pass exchange to fetchWatchlistData to override selectedExchange
      // Đánh dấu là update từ SignalR để không hiển thị loading
      fetchWatchlistData(false, apiExchange, true).finally(() => {
        // Khi đã cập nhật xong, reset lại state
        setIsSignalRUpdating(false);
      });
    }, 500)  // Giảm từ 1000ms xuống 500ms để cập nhật nhanh hơn
  ).current;

  // Update the debounced function to use API format directly
  const debouncedFetchStockData = useRef(
    debounce((timestamp, apiExchange) => {
      // apiExchange is already in API format ('hsx' or 'hnx'), so we use it directly
      console.log(`Creating debounced function with api exchange: ${apiExchange}`);
      // Thiết lập state để biết đang cập nhật từ SignalR
      setIsSignalRUpdating(true);
      // Pass exchange to fetchStockData to override selectedExchange
      // Đánh dấu là update từ SignalR để không hiển thị loading
      fetchStockData(timestamp, false, apiExchange, true).finally(() => {
        // Khi đã cập nhật xong, reset lại state
        setIsSignalRUpdating(false);
      });
    }, 500)  // Giảm từ 1000ms xuống 500ms để cập nhật nhanh hơn
  ).current;

  // Add SignalR event listeners (debounced, only fetch when correct exchange)
  useEffect(() => {
    const handleStockUpdate = (event) => {
      const { exchange, timestamp } = event.detail;
      
      // Define exchange mapping (from API format to display format)
      const exchangeMap = {
        'hsx': 'HOSE',
        'hnx': 'HNX'
      };
      
      console.log(`[WebSocket] Received update for exchange: ${exchange}, timestamp: ${timestamp}`);
      console.log(`[WebSocket] Current selected exchange: ${selectedExchange}, Mapped from received: ${exchangeMap[exchange]}`);
      
      // Check if the event exchange matches the currently selected exchange
      if (
        showWatchlist &&
        exchangeMap[exchange] === selectedExchange
      ) {
        console.log(`[WebSocket] Updating watchlist data for ${selectedExchange}`);
        // Pass the original API exchange code directly
        debouncedFetchWatchlist(exchange);
      } else if (
        !showWatchlist &&
        exchangeMap[exchange] === selectedExchange
      ) {
        console.log(`[WebSocket] Updating stock data for ${selectedExchange} with timestamp ${timestamp}`);
        // IMPORTANT: Pass the original API exchange code (e.g., 'hsx', 'hnx'), not the display name
        debouncedFetchStockData(timestamp, exchange);
      } else {
        console.log(`[WebSocket] Ignoring update for ${exchange} as it doesn't match current tab ${selectedExchange}`);
      }
    };
    window.addEventListener('stockUpdate', handleStockUpdate);
    return () => {
      window.removeEventListener('stockUpdate', handleStockUpdate);
    };
  }, [selectedExchange, showWatchlist, debouncedFetchWatchlist, debouncedFetchStockData]);

  // Thêm useEffect để phản ứng khi chuyển đổi giữa chế độ watchlist và bảng giá thông thường
  useEffect(() => {
    // Khi bật/tắt chế độ watchlist, tải dữ liệu phù hợp
    if (showWatchlist) {
      setWatchlist([]); // Reset watchlist data
      // Get the current exchange in API format before making the call
      const exchangeMap = {
        'HOSE': 'hsx',
        'HNX': 'hnx'
      };
      const apiExchange = exchangeMap[selectedExchange] || 'hsx';
      console.log(`Watchlist toggle - using API exchange: ${apiExchange} for selected exchange: ${selectedExchange}`);
      // Pass the API exchange directly to avoid any stale closure issues
      // Đây là lần tải ban đầu, không phải SignalR update
      fetchWatchlistData(false, apiExchange, false);
    } else {
      // Đây là lần tải ban đầu, không phải SignalR update
      fetchStockData(null, false, null, false); // Load regular stock data
    }
    
    // Reset tìm kiếm khi chuyển đổi chế độ watchlist
    setSearchQuery('');
  }, [showWatchlist]);

  // Add useEffect to refetch data when exchange changes
  useEffect(() => {
    console.log("Exchange changed to:", selectedExchange);
    // Reset data when changing exchange
    setRealTimeStockData([]);
    setPriceHistory({});
    setPriceChangeColors({});
    
    // Get the current exchange in API format before making the call
    const exchangeMap = {
      'HOSE': 'hsx',
      'HNX': 'hnx'
    };
    const apiExchange = exchangeMap[selectedExchange] || 'hsx';
    
    // Clear watchlist data immediately when exchange changes
    if (showWatchlist) {
      setWatchlist([]);
      // Reset lại isInitialWatchlistLoad khi thay đổi exchange
      setIsInitialWatchlistLoad(true);
      console.log(`Tab change for watchlist - using API exchange: ${apiExchange} for selected exchange: ${selectedExchange}`);
      // Pass the API exchange directly to avoid any stale closure issues
      // Đây là lần tải ban đầu, không phải SignalR update
      fetchWatchlistData(false, apiExchange, false);
    } else {
      // Important: Call fetchStockData directly to ensure it uses the current selectedExchange
      console.log(`Tab change for stock data - using API exchange: ${apiExchange} for selected exchange: ${selectedExchange}`);
      // Pass the API exchange directly to avoid any stale closure issues
      // Đây là lần tải ban đầu, không phải SignalR update
      fetchStockData(null, false, apiExchange, false);
    }
    
    // Reset tìm kiếm khi chuyển đổi sàn
    setSearchQuery('');
  }, [selectedExchange]); // Only run when selectedExchange changes

  const subscribeToStockData = () => {
    try {
      const exchangeMap = {
        'HOSE': 'hsx',
        'HNX': 'hnx'
      };
      const mappedExchange = exchangeMap[selectedExchange] || 'hsx';
      
      console.log(`SUBSCRIBE - Current tab: ${selectedExchange}, mapped to: ${mappedExchange}`);
      
      if (connection && connection.state === signalR.HubConnectionState.Connected) {
        // Unsubscribe from previous channel first to avoid duplicate subscriptions
        connection.invoke("LeaveGroup", "stock").catch(err => {
          console.error("Error leaving stock group:", err);
        });
        
        // Subscribe to the appropriate channel based on current exchange
        connection.invoke("JoinGroup", "stock").then(() => {
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

    /* Price change animations - Cải thiện */
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
    
    /* Volume change animations - Cải thiện */
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
      animation: volume-up 2s ease-out;
    }

    .volume-down {
      animation: volume-down 2s ease-out;
    }

    .price-up {
      animation: priceUp 2s ease-out;
    }

    .price-down {
      animation: priceDown 2s ease-out;
    }

    .price-equal {
      animation: priceEqual 2s ease-out;
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
    setShowWatchlist(newValue);
    
    if (newValue) {
      // Khi chuyển sang chế độ watchlist, đặt lại isInitialWatchlistLoad nếu watchlist trống
      if (watchlist.length === 0) {
        setIsInitialWatchlistLoad(true);
      }
      fetchWatchlistData();
    }
  };

  // Xử lý thay đổi sàn giao dịch
  const handleExchangeChange = (exchangeId) => {
    setSelectedExchange(exchangeId);
    
    // Reset các trạng thái 
    if (showWatchlist) {
      // Reset isInitialWatchlistLoad khi đổi sàn trong chế độ watchlist
      setIsInitialWatchlistLoad(true);
    } else {
      setIsLoading(true);
      setRealTimeStockData([]);
    }
    
    // Định nghĩa exchangeMap
    const exchangeMap = {
      'HOSE': 'hsx',
      'HNX': 'hnx'
    };
    
    // Delay để UI có thể cập nhật trước
    setTimeout(() => {
      if (showWatchlist) {
        fetchWatchlistData(false, exchangeMap[exchangeId]);
      } else {
        fetchStockData(null, false, exchangeMap[exchangeId]);
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
        setShowWatchlist(false);
        setFeatureMessageInfo({
          name: 'Danh sách theo dõi và Thông báo',
          returnPath: '/stock'
        });
        setShowFeatureMessage(true);
        return;
      }
      
      // Chỉ hiển thị loading khi:
      // 1. Đang tải lần đầu
      // 2. Không phải là cập nhật từ SignalR
      // 3. Không phải đang trong trạng thái isSignalRUpdating
      if (isInitialWatchlistLoad && !isSignalRUpdate && !isSignalRUpdating) {
        setIsWatchlistLoading(true);
      }
      
      const userId = getUserId();
      if (!userId) {
        toast.error("Vui lòng đăng nhập để xem danh sách theo dõi");
        setIsWatchlistLoading(false);
        setIsInitialWatchlistLoad(false);
        return;
      }

      const token = Cookies.get("auth_token");
      if (!token) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại");
        setIsWatchlistLoading(false);
        setIsInitialWatchlistLoad(false);
        return;
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
        
        // If this is an update, merge with existing data and apply animations
        if (!isInitialWatchlistLoad) {
          setWatchlist(prevList => {
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
            
            // Update state if we detected changes
            if (hasChanges) {
              setPreviousValues(newPreviousValues);
              setPriceChangeColors(newPriceChangeColors);
            }
            
            return updatedList;
          });
        } else {
          // Initial load, just set the data
          setWatchlist(newWatchlistStocks);
        }
      } else if (isInitialWatchlistLoad) {
        // Only clear on initial load if no data
        setWatchlist([]);
      }
      
      // Sau khi hoàn thành lần tải đầu tiên, cập nhật trạng thái
      if (isInitialWatchlistLoad) {
        setIsWatchlistLoading(false);
        setIsInitialWatchlistLoad(false);
      }
    } catch (error) {
      // No need to redefine exchangeMap here since it's available from the top of the function
      if (error.response && error.response.status === 404 && exchange === 'hnx' && !retry) {
        // Nếu là HNX và bị 404, thử lại 1 lần sau 2 giây
        setTimeout(() => fetchWatchlistData(true), 2000);
        if (isInitialWatchlistLoad) {
          setIsWatchlistLoading(false);
          setIsInitialWatchlistLoad(false);
        }
        return;
      } else if (error.response && error.response.status === 404) {
        // Nếu là 404 (không phải HNX), chỉ clear data nếu là lần đầu tải, không hiện lỗi nặng
        if (isInitialWatchlistLoad) {
          setIsWatchlistLoading(false);
          setIsInitialWatchlistLoad(false);
        }
        return;
      }
      // Các lỗi khác
      if (isInitialWatchlistLoad) {
        setIsWatchlistLoading(false);
        setIsInitialWatchlistLoad(false);
      }
      toast.error("Không thể tải danh sách theo dõi");
    }
  };

  // Thêm useEffect để cập nhật thời gian thực mỗi giây
  useEffect(() => {
    // Cập nhật thời gian hiển thị mỗi giây
    const interval = setInterval(() => {
      setCurrentTime(moment());
    }, 1000);
    
    // Cleanup interval khi component unmount
    return () => clearInterval(interval);
  }, []);
  
  // Thêm useEffect để log khi lastTimestamp thay đổi để debug
  useEffect(() => {
    if (lastTimestamp) {
      console.log("Last timestamp updated:", lastTimestamp);
      console.log("Formatted time:", moment(lastTimestamp, 'YYYYMMDDHHmmss').format('HH:mm:ss'));
    }
  }, [lastTimestamp]);

  // Add useEffect to setup SignalR connection
  useEffect(() => {
    // Khởi tạo và thiết lập kết nối SignalR khi component mount
    const setupSignalR = async () => {
      try {
        console.log("[SignalR] Initializing SignalR connection for StockDerivatives");
        // Import SignalR service
        const signalRService = (await import('@/api/signalRService')).default;
        
        // Đảm bảo kết nối được thiết lập
        await signalRService.getConnection();
        
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
  
  // This useEffect monitors changes in the filtered data to trigger animations
  useEffect(() => {
    // Create a small delay to allow price history to update first
    if (filteredData.length > 0) {
      setTimeout(() => {
        const newDisplayedStocks = {};
        
        filteredData.forEach(stock => {
          if (!stock.code) return;
          
          // Create a copy of the current stock to store
          newDisplayedStocks[stock.code] = {...stock};
          
          // If there is previous data and it differs from the current data, trigger animation
          if (prevDisplayedStocks[stock.code]) {
            const prevStock = prevDisplayedStocks[stock.code];
            
            // List of fields to check
            const fieldsToCheck = [
              'matchPrice', 'buyPrice1', 'buyPrice2', 'buyPrice3',
              'sellPrice1', 'sellPrice2', 'sellPrice3',
              'buyVolume1', 'buyVolume2', 'buyVolume3',
              'sellVolume1', 'sellVolume2', 'sellVolume3'
            ];
            
            // Check each field and create an effect if there is a change
            fieldsToCheck.forEach(field => {
              if (stock[field] !== prevStock[field]) {
                const isPrice = field.includes('Price');
                const currentValue = parseFloat(String(stock[field]).replace(/,/g, ''));
                const previousValue = parseFloat(String(prevStock[field]).replace(/,/g, ''));
                
                // Only trigger animation when there is a significant change
                if (!isNaN(currentValue) && !isNaN(previousValue) && currentValue !== previousValue) {
                  const fieldType = isPrice ? 'price' : 'volume';
                  const animClass = getChangeAnimation(currentValue, previousValue, fieldType);
                  
                  if (animClass) {
                    setPriceChangeColors(prev => ({
                      ...prev,
                      [`${stock.code}-${field}`]: animClass
                    }));
                  }
                }
              }
            });
          }
        });
        
        // Update state with new data
        setPrevDisplayedStocks(newDisplayedStocks);
      }, 100);
    }
  }, [filteredData]); // Depend only on filteredData

  // Tạo một hàm debounced để xử lý cập nhật tìm kiếm
  const debouncedSetSearchQuery = useRef(
    debounce((value) => {
      setSearchQuery(value);
    }, 300)
  ).current;

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
              <div className={`w-11 h-6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer ${hasFeature("Quản lý thông báo theo nhu cầu") ? "dark:bg-gray-700 bg-gray-300 border-2 border-gray-400 dark:border-gray-600" : "dark:bg-gray-600 bg-gray-300 border border-gray-400 dark:border-gray-600"} peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border-2 after:rounded-full after:h-5 after:w-5 after:shadow-md after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 peer-checked:border-blue-700 dark:peer-checked:border-blue-800 transition-all duration-200`}></div>
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
                  Giá hiện tại: <span className={`${getPriceColor(selectedAlertStock?.matchPrice, selectedAlertStock?.ref, selectedAlertStock?.ceiling, selectedAlertStock?.floor)}`}>{selectedAlertStock?.matchPrice}</span> | 
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
                    ) : (dataToDisplay.length === 0 ? (
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