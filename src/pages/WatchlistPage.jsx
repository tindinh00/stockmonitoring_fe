import React, { useState, useEffect, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, X, Eye, ChevronRight, AlertTriangle, Info, Clock, Bell, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import CandlestickChart from '@/components/CandlestickChart';
import { getUserId } from '@/api/Api';
import { stockService } from '@/api/StockApi';
import signalRService from '@/api/signalRService';
import moment from 'moment';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import useFeatureStore from '@/store/featureStore';
import debounce from 'lodash/debounce';

// Tạo hàm debounce dự phòng trong trường hợp không import được từ lodash
const createDebounce = (fn, delay) => {
  let timer = null;
  return function(...args) {
    const context = this;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(context, args);
    }, delay);
  };
};

// Sử dụng debounce từ lodash nếu có, nếu không thì dùng hàm createDebounce
const safeDebounce = typeof debounce === 'function' ? debounce : createDebounce;

const WatchlistPage = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [watchlistCodes, setWatchlistCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [priceHistory, setPriceHistory] = useState({});
  const [priceChangeColors, setPriceChangeColors] = useState({});
  const [industries, setIndustries] = useState([]);
  const [isLoadingIndustries, setIsLoadingIndustries] = useState(true);
  const [isAddIndustryDialogOpen, setIsAddIndustryDialogOpen] = useState(false);
  const [newIndustryName, setNewIndustryName] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [industryStocks, setIndustryStocks] = useState([]);
  const [isIndustryDetailOpen, setIsIndustryDetailOpen] = useState(false);
  const [availableIndustries, setAvailableIndustries] = useState([]);
  const [isLoadingSectors, setIsLoadingSectors] = useState(false);
  const [selectedIndustryIds, setSelectedIndustryIds] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [activeTab, setActiveTab] = useState('hsx');
  const [isDeleteSectorDialogOpen, setIsDeleteSectorDialogOpen] = useState(false);
  const [sectorToDelete, setSectorToDelete] = useState(null);
  const [isDeleteStockDialogOpen, setIsDeleteStockDialogOpen] = useState(false);
  const [stockToDelete, setStockToDelete] = useState(null);
  const [lastTimestamp, setLastTimestamp] = useState(new Date());
  
  // Tab quản lý phần hiển thị (ngành hoặc danh sách theo dõi)
  const [watchlistTab, setWatchlistTab] = useState('industries'); // 'industries' hoặc 'stocks'
  
  // Add new states for add stock feature
  const [isAddStockDialogOpen, setIsAddStockDialogOpen] = useState(false);
  const [availableStocks, setAvailableStocks] = useState([]);
  const [selectedStockIds, setSelectedStockIds] = useState([]);
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [isLoadingStocks, setIsLoadingStocks] = useState(false);

  // Thêm state để theo dõi việc flash giá và khối lượng
  const [flashingCells, setFlashingCells] = useState({});
  const [volumeHistory, setVolumeHistory] = useState({});
  const previousStockPrices = useRef({});
  const previousStockVolumes = useRef({});

  // Thêm state để phân biệt initial loading và update loading
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Add loading state for add stock
  const [isAddingStocks, setIsAddingStocks] = useState(false);

  // Add this near other state declarations
  const [isLoadingAvailableIndustries, setIsLoadingAvailableIndustries] = useState(false);

  // Add new state for tracking when to refresh industries
  const [shouldRefreshIndustries, setShouldRefreshIndustries] = useState(false);

  // Add new state for delete sector loading
  const [isDeletingSector, setIsDeletingSector] = useState(false);

  // Thêm state cho trạng thái đang xóa cổ phiếu
  const [isDeletingStock, setIsDeletingStock] = useState(false);

  // Add new state for notification dialog
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [selectedNotificationStock, setSelectedNotificationStock] = useState(null);
  const [notificationData, setNotificationData] = useState({
    price: '',
    type: 'increase'
  });
  const [isCreatingNotification, setIsCreatingNotification] = useState(false);

  // Add states for subscription check
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [userSubscription, setUserSubscription] = useState(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  // Get feature check function from store
  const features = useFeatureStore((state) => state.features);

  // Lấy hàm kiểm tra quyền từ featureStore
  const hasFeature = useFeatureStore(state => state.hasFeature);
  
  // Cờ kiểm tra quyền truy cập
  const hasIndustryFeature = hasFeature("Quản lý danh mục theo dõi theo ngành");
  const hasWatchlistFeature = hasFeature("Quản lý danh mục theo dõi cổ phiếu");

  // Add function to refresh industries data
  const refreshIndustries = () => {
    setShouldRefreshIndustries(prev => !prev);
  };

  // Add this function to fetch available industries
  const fetchAvailableIndustries = async () => {
    try {
      setIsLoadingAvailableIndustries(true);
      const response = await axios.get(
        'https://stockmonitoring-api-gateway.onrender.com/api/watchlist-sector',
        {
          headers: {
            'Authorization': `Bearer ${Cookies.get('auth_token')}`,
            'accept': '*/*'
          }
        }
      );

      if (response?.data?.value?.data) {
        setAvailableIndustries(response.data.value.data);
      } else {
        setAvailableIndustries([]);
        toast.error('Không thể tải danh sách ngành');
      }
    } catch (error) {
      console.error('Error fetching industries:', error);
      toast.error('Không thể tải danh sách ngành');
      setAvailableIndustries([]);
    } finally {
      setIsLoadingAvailableIndustries(false);
    }
  };

  // Thêm useEffect để debug dữ liệu
  useEffect(() => {
    console.log("Watchlist data:", watchlist);
    console.log("WatchlistCodes:", watchlistCodes);
  }, [watchlist, watchlistCodes]);

  // Thêm useEffect để fetch các sectors đã thêm vào watchlist của user
  useEffect(() => {
    const fetchUserSectors = async () => {
      try {
        setIsLoadingIndustries(true);
        const userId = getUserId();
        console.log("Fetching sectors for user ID:", userId);
        
        if (!userId) {
          console.warn("No user ID found");
          setIndustries([]);
          setIsLoadingIndustries(false);
          return;
        }

        const token = Cookies.get("auth_token");
        if (!token) {
          console.warn("No auth token found");
          setIndustries([]);
          setIsLoadingIndustries(false);
          return;
        }

        // Gọi API với cấu hình giống Postman
        const response = await axios({
          method: 'GET',
          url: `https://stockmonitoring-api-gateway.onrender.com/api/watchlist-sector/${userId}`,
          headers: {
            'accept': '*/*',
            'Authorization': `Bearer ${token}`
          }
        });

        console.log("Raw API Response:", response);

        // Kiểm tra và xử lý dữ liệu từ API
        if (response?.data?.value?.data?.sectors) {
          const sectors = response.data.value.data.sectors;
          console.log("Sectors data:", sectors);
          
          // Transform data to match the required format
          const formattedSectors = sectors.map(sector => ({
              id: sector.id,
              name: sector.name,
            smg: sector.smg || 0,
            percentD: sector.percentD || 0,
            percentW: sector.percentW || 0,
            percentM: sector.percentM || 0,
            stocks: sector.stocks || []
          }));
          
          setIndustries(formattedSectors);
        } else if (response?.data?.value?.status === 200 && !response?.data?.value?.data?.sectors) {
          console.log("No sectors found in watchlist");
          setIndustries([]);
        } else {
          console.warn("Invalid response format:", response);
          setIndustries([]);
        }
      } catch (error) {
        console.error("Error fetching sectors:", error);
        toast.error("Không thể tải danh sách ngành");
        setIndustries([]);
      } finally {
        setIsLoadingIndustries(false);
      }
    };
    
    fetchUserSectors();
  }, [shouldRefreshIndustries]); // Add dependency on shouldRefreshIndustries

  // Lấy thông tin cổ phiếu đã theo dõi
  useEffect(() => {
    if (watchlist.length > 0) {
      const codes = watchlist.map(stock => stock.stockCode);
      setWatchlistCodes(codes);
    }
  }, [watchlist]);

  // CSS for animations, using the same logic as StockDerivatives
  const priceChangeAnimations = `
    @keyframes priceUp {
      0% { background-color: rgba(0, 255, 0, 0.3); }
      100% { background-color: transparent; }
    }
    
    @keyframes priceDown {
      0% { background-color: rgba(255, 0, 0, 0.3); }
      100% { background-color: transparent; }
    }
    
    @keyframes volumeUp {
      0% { background-color: rgba(0, 255, 0, 0.2); }
      100% { background-color: transparent; }
    }
    
    @keyframes volumeDown {
      0% { background-color: rgba(255, 0, 0, 0.2); }
      100% { background-color: transparent; }
    }

    .price-up {
      animation: priceUp 1s ease-out;
    }
    
    .price-down {
      animation: priceDown 1s ease-out;
    }
    
    .volume-up {
      animation: volumeUp 1s ease-out;
    }
    
    .volume-down {
      animation: volumeDown 1s ease-out;
    }
  `;

  // Hàm xác định animation class (giống StockDerivatives)
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

  // Hàm xác định màu sắc dựa trên giá
  const getPriceColor = (stock, field) => {
    if (!stock || !field) return 'text-gray-900 dark:text-white';

    // Xác định giá tương ứng với khối lượng
    let priceField = field;
    if (field.startsWith('volume')) {
      // Chuyển đổi tên trường volume thành price tương ứng
      priceField = field.replace('volume', 'price');
    }

    if (field === 'volumeAccumulation') {
      priceField = 'matchPrice';
    }

    if (priceField === 'matchPrice' || priceField.includes('price') || priceField.includes('Price')) {
      if (stock[priceField] !== '--' && stock.priorClosePrice !== '--') {
        const numPrice = parseFloat(stock[priceField]);
        const numRefPrice = parseFloat(stock.priorClosePrice);
        const numCeilPrice = parseFloat(stock.ceilPrice);
        const numFloorPrice = parseFloat(stock.floorPrice);

        if (!isNaN(numPrice) && !isNaN(numRefPrice) && !isNaN(numCeilPrice) && !isNaN(numFloorPrice)) {
          const epsilon = 0.001;
          const equals = (a, b) => Math.abs(a - b) < epsilon;

          if (equals(numPrice, numRefPrice)) return 'text-[#F4BE37]';
          if (equals(numPrice, numCeilPrice)) return 'text-[#B388FF]';
          if (equals(numPrice, numFloorPrice)) return 'text-[#00BCD4]';
          if (numPrice > numRefPrice && numPrice < numCeilPrice) return 'text-[#00FF00]';
          if (numPrice < numRefPrice && numPrice > numFloorPrice) return 'text-[#FF4A4A]';
        }
      }
    }

    return 'text-gray-900 dark:text-white';
  };

  // Hàm kết hợp màu sắc và animation cho cell
  const getCellClasses = (stock, field) => {
    if (!stock) return 'text-gray-900 dark:text-white border-r border-gray-200/60 dark:border-[#333] text-center whitespace-nowrap py-1';
    
    // Xác định màu sắc cơ bản
    const colorClass = getPriceColor(stock, field);
    
    // Xác định animation class
    let animationClass = '';
    const stockCode = stock.stockCode;
    const changeKey = `${stockCode}-${field}`;
    
    // Kiểm tra có animation được lưu trữ cho field này không
    if (priceChangeColors[changeKey]) {
      animationClass = priceChangeColors[changeKey];
    }
    
    return `${colorClass} ${animationClass} border-r border-gray-200/60 dark:border-[#333] text-center whitespace-nowrap py-1`;
  };

  // Lưu giá trị cũ trong một ref để duy trì giữa các lần render
  const previousStockValues = useRef({});
  
  // Thêm log để debug animation
  const logAnimationDetails = (stockCode, field, oldValue, newValue, animClass) => {
    console.log(
      `%c[Animation] ${stockCode}-${field}: ${oldValue} → ${newValue} (${animClass || 'no animation'})`, 
      `color: ${animClass === 'price-up' ? 'green' : animClass === 'price-down' ? 'red' : 'gray'}`
    );
  };

  // Fetch stock data from API
  const fetchStockData = async () => {
    console.log("=== Fetching watchlist data ===");
    // Chỉ hiển thị loading khi là lần tải ban đầu
    if (isInitialLoading) {
      setIsLoading(true);
    }
    
    try {
      const userId = getUserId();
      console.log("Current user ID:", userId);
    
      if (!userId) {
        console.warn("No user ID found");
        setWatchlist([]);
        setIsLoading(false);
        setIsInitialLoading(false);
        toast.error("Bạn cần đăng nhập để xem danh sách theo dõi");
        return false;
      }

      // Lấy thời gian bắt đầu để đo performance
      const startTime = performance.now();

      // Gọi API watchlist với exchange parameter
      const response = await axios.get(
        `https://stockmonitoring-api-gateway.onrender.com/api/watchlist-stock/${userId}`,
        {
          params: {
            exchange: activeTab
          },
          headers: {
            'Authorization': `Bearer ${Cookies.get('auth_token')}`,
            'accept': '*/*'
          }
        }
      );
      
      // Tính thời gian API call
      const apiTime = performance.now() - startTime;
      console.log(`Watchlist API call took ${apiTime.toFixed(0)}ms`);
      
      console.log("Watchlist API response:", response);
      
      // Lấy thời gian bắt đầu xử lý dữ liệu
      const processStart = performance.now();
      
      if (response?.data?.value?.data) {
        const watchlistStocks = response.data.value.data;
        
        // Kiểm tra là mảng trước khi xử lý
        if (Array.isArray(watchlistStocks)) {
          // Tạo một object lưu trữ animation classes mới
          const newAnimations = {};
          
          // Kiểm tra thay đổi và tạo animation classes
          watchlistStocks.forEach(newStock => {
            const stockCode = newStock.stockCode;
            
            // Truy xuất giá trị cũ từ ref
            const previousStock = previousStockValues.current[stockCode];
            
            if (previousStock) {
              // Các trường cần kiểm tra
              const fieldsToTrack = [
                'matchPrice', 'matchedOrderVolume', 'volumeAccumulation',
                'price3Buy', 'price2Buy', 'price1Buy',
                'price1Sell', 'price2Sell', 'price3Sell',
                'volume3Buy', 'volume2Buy', 'volume1Buy',
                'volume1Sell', 'volume2Sell', 'volume3Sell',
                'foreignBuyVolume', 'foreignSellVolume'
              ];
              
              // Kiểm tra thay đổi từng trường
              fieldsToTrack.forEach(field => {
                const newValue = newStock[field];
                const oldValue = previousStock[field];
                
                // Chỉ xử lý khi cả 2 giá trị đều tồn tại và không phải '--'
                if (
                  newValue !== undefined && 
                  oldValue !== undefined && 
                  newValue !== oldValue &&
                  newValue !== '--' && 
                  oldValue !== '--'
                ) {
                  // Xác định loại trường (giá hoặc khối lượng)
                  const fieldType = field.includes('volume') || field.includes('Volume') ? 'volume' : 'price';
                  
                  // Lấy animation class
                  const animClass = getChangeAnimation(newValue, oldValue, fieldType);
                  
                  // Log chi tiết
                  logAnimationDetails(stockCode, field, oldValue, newValue, animClass);
                  
                  // Lưu animation class nếu có
                  if (animClass) {
                    newAnimations[`${stockCode}-${field}`] = animClass;
                  }
                }
              });
            }
            
            // Luôn cập nhật giá trị vào ref, bất kể có thay đổi hay không
            previousStockValues.current[stockCode] = { ...newStock };
          });
          
          // Cập nhật state animation một lần duy nhất sau khi xử lý tất cả
          const animationCount = Object.keys(newAnimations).length;
          console.log('Updating animations:', animationCount, 'items');
          if (animationCount > 0) {
            setPriceChangeColors(prev => ({ ...prev, ...newAnimations }));
          }
          
          // Cập nhật danh sách cổ phiếu
          setWatchlist(watchlistStocks);
          
          // Lưu danh sách mã cổ phiếu
          setWatchlistCodes(watchlistStocks.map(stock => stock.stockCode));
        } else {
          console.warn("Watchlist data is not an array:", watchlistStocks);
          setWatchlist([]);
        }
      } else {
        console.warn("No stocks found in watchlist response");
        setWatchlist([]);
      }
      
      // Tính thời gian xử lý dữ liệu
      const processTime = performance.now() - processStart;
      console.log(`Data processing took ${processTime.toFixed(0)}ms`);
      
      // Tổng thời gian thực hiện
      const totalTime = performance.now() - startTime;
      console.log(`Total fetchStockData time: ${totalTime.toFixed(0)}ms`);
      
      // Chỉ khi là lần tải ban đầu thì mới cần tắt loading
      if (isInitialLoading) {
        setIsLoading(false);
        setIsInitialLoading(false);
      }
      
      // Cập nhật timestamp
      setLastTimestamp(new Date());
      
      return true;
    } catch (error) {
      console.error("Error in fetchStockData:", error);
      setIsLoading(false);
      setIsInitialLoading(false);
      toast.error("Không thể tải dữ liệu danh sách theo dõi");
      setWatchlist([]);
      return false;
    }
  };

  // Xóa hiệu ứng sau khi hiển thị
  useEffect(() => {
    if (Object.keys(priceChangeColors).length > 0) {
      const timer = setTimeout(() => {
        setPriceChangeColors({});
      }, 1000); // Hiển thị trong 1 giây
      
      return () => clearTimeout(timer);
    }
  }, [priceChangeColors]);

  // Tách riêng việc thiết lập SignalR ra khỏi fetching data
  const setupSignalRConnection = async () => {
    try {
      console.log("=== Setting up SignalR for watchlist ===");
      
      const connection = await signalRService.getConnection();
      if (!connection) {
        console.error("[SignalR] No active connection available");
        return;
      }

      // Tạo một debounce function để tránh gọi API quá nhiều lần khi nhận nhiều thông báo
      const debouncedFetchData = safeDebounce((exchange) => {
        console.log(`[SignalR] Debounced fetching ${exchange} data`);
        // Đánh dấu không phải là lần tải đầu tiên để tránh hiển thị loading spinner
        setIsInitialLoading(false);
        fetchStockData();
      }, 300);

      // Lắng nghe sự kiện HSX
      signalRService.onStock("ReceiveHSXStockUpdate", async (data) => {
        if (activeTab === 'hsx') {
          try {
            console.log("[SignalR] Received HSX update:", data);
            // Không hiển thị loading spinner khi đang cập nhật
            setIsLoading(false);
            setIsInitialLoading(false);
            // Khi nhận thông báo từ SignalR, gọi API để lấy dữ liệu mới
            debouncedFetchData('hsx');
          } catch (error) {
            console.error("[SignalR] Error processing HSX update:", error);
          }
        }
      });

      // Lắng nghe sự kiện HNX
      signalRService.onStock("ReceiveHNXStockUpdate", async (data) => {
        if (activeTab === 'hnx') {
          try {
            console.log("[SignalR] Received HNX update:", data);
            // Không hiển thị loading spinner khi đang cập nhật
            setIsLoading(false);
            setIsInitialLoading(false);
            // Khi nhận thông báo từ SignalR, gọi API để lấy dữ liệu mới
            debouncedFetchData('hnx');
          } catch (error) {
            console.error("[SignalR] Error processing HNX update:", error);
          }
        }
      });

      return () => {
        // Clean up SignalR event handlers if component unmounts
        connection.off("ReceiveHSXStockUpdate");
        connection.off("ReceiveHNXStockUpdate");
      };
    } catch (error) {
      console.error("Error setting up SignalR:", error);
      return () => {};
    }
  };

  // Initial data loading and SignalR setup
  useEffect(() => {
    console.log("WatchlistPage - Component mounted");
    setIsInitialLoading(true); // Đánh dấu mỗi khi thay đổi tab là đang tải lần đầu
    fetchStockData();
    setupSignalRConnection();
    
    // Cleanup khi unmount
    return () => {
      console.log("WatchlistPage - Component unmounting");
      try {
        signalRService.offStock("ReceiveHSXStockUpdate");
        signalRService.offStock("ReceiveHNXStockUpdate");
        console.log("WatchlistPage - Unregistered SignalR listeners");
      } catch (error) {
        console.error("WatchlistPage - Error removing SignalR listeners:", error);
      }
    };
  }, [activeTab]); // Thêm activeTab vào dependencies

  const removeFromWatchlist = (stock) => {
    setStockToDelete(stock);
    setIsDeleteStockDialogOpen(true);
  };

  const confirmDeleteStock = async () => {
    try {
      setIsDeletingStock(true);
      // Lấy userId từ getUserId
      const userId = getUserId();
      
      if (!userId) {
        toast.error("Bạn cần đăng nhập để sử dụng tính năng này");
        setIsDeletingStock(false);
        return;
      }
      
      // Gọi API để xóa khỏi watchlist - sử dụng stockCode như là tickerSymbol
      await stockService.deleteStockFromWatchlist(userId, stockToDelete.stockCode);
      
      // Cập nhật state
      setStocks(stocks.filter(stock => stock.stockCode !== stockToDelete.stockCode));
      setWatchlistCodes(watchlistCodes.filter(stockCode => stockCode !== stockToDelete.stockCode));
      setWatchlist(watchlist.filter(stock => stock.stockCode !== stockToDelete.stockCode));
      
      toast.success(`Đã xóa ${stockToDelete.stockCode} khỏi danh sách theo dõi`);
      setIsDeleteStockDialogOpen(false);
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      toast.error("Không thể xóa khỏi danh sách theo dõi. Vui lòng thử lại sau.");
    } finally {
      setIsDeletingStock(false);
    }
  };

  const handleStockClick = (stock) => {
    setSelectedStock(stock);
    setIsDialogOpen(true);
    
    // Fetch real chart data from API instead of generating sample data
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
          `https://stockmonitoring-api-gateway.onrender.com/api/stock-price-history?ticketSymbol=${selectedStock.stockCode}`,
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
          setChartData(formattedData);
        } else {
          setChartData([]);
          setChartError('Không có dữ liệu cho mã này');
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
        setChartData([]);
        setChartError('Không thể tải dữ liệu biểu đồ');
        toast.error('Không thể tải dữ liệu biểu đồ');
      } finally {
        setIsChartLoading(false);
      }
    };

    fetchChartData();
  };

  const handleIndustryClick = (industry) => {
    setSelectedIndustry(industry);
    setIsIndustryDetailOpen(true);
  };

  const renderMiniChart = (data) => {
    // Kiểm tra dữ liệu trước khi render
    if (!data || !Array.isArray(data) || data.length === 0) {
      return (
        <div className="w-20 h-8 relative flex items-center justify-center">
          <div className="w-full h-px bg-[#4A72FF]/30"></div>
        </div>
      );
    }
    
    // Chỉ lọc ra các giá trị hợp lệ từ dữ liệu
    const validData = data.filter(v => typeof v === 'number' && !isNaN(v) && v !== null);
    
    // Nếu không có giá trị hợp lệ, hiển thị đường cơ bản
    if (validData.length === 0) {
      return (
        <div className="w-20 h-8 relative flex items-center justify-center">
          <div className="w-full h-px bg-[#4A72FF]/30"></div>
        </div>
      );
    }
    
    // Tìm giá trị max và min để normalize dữ liệu
    const maxValue = Math.max(...validData);
    const minValue = Math.min(...validData);
    const range = Math.max(Math.abs(maxValue), Math.abs(minValue));

    // Tính toán điểm cho đường chart
    const points = validData.map((value, index) => {
      const x = (index * 100) / (validData.length - 1);
      // Normalize giá trị để nằm trong khoảng 0-30 (chiều cao SVG)
      // 15 là điểm giữa, giá trị âm sẽ đi lên trên, dương đi xuống dưới
      const y = 15 - ((value / range) * 12); // Scale factor 12 để chart không quá cao/thấp
      return `${x},${y}`;
    }).join(' ');

    // Xác định màu dựa trên xu hướng (trend)
    const trend = validData[validData.length - 1] - validData[0];
    const chartColor = trend >= 0 ? "#00FF00" : "#FF4A4A";
    
    return (
      <div className="w-20 h-8 relative">
        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
          {/* Thêm đường cơ sở ở giữa */}
          <line x1="0" y1="15" x2="100" y2="15" stroke="#333" strokeWidth="0.5" />
          <polyline
            points={points}
            fill="none"
            stroke={chartColor}
            strokeWidth="2"
          />
        </svg>
      </div>
    );
  };

  const handleDeleteSector = (sector, e) => {
    e.stopPropagation(); // Ngăn không cho event lan sang parent (tránh mở industry detail)
    setSectorToDelete(sector);
    setIsDeleteSectorDialogOpen(true);
  };

  const confirmDeleteSector = async () => {
    try {
      setIsDeletingSector(true);
      const userId = getUserId();
      
      if (!userId) {
        toast.error("Bạn cần đăng nhập để sử dụng tính năng này");
        setIsDeletingSector(false);
        return;
      }
      
      // Update API call to use query parameters
      await axios.delete(
        'https://stockmonitoring-api-gateway.onrender.com/api/watchlist-sector',
        {
          params: {
            userId: userId,
            sectorId: sectorToDelete.id
          },
          headers: {
            'Authorization': `Bearer ${Cookies.get('auth_token')}`,
            'accept': '*/*'
          }
        }
      );
      
      // Refresh industries data
      refreshIndustries();
      
      toast.success(`Đã xóa ngành "${sectorToDelete.name}" khỏi danh sách theo dõi`);
      setIsDeleteSectorDialogOpen(false);
    } catch (error) {
      console.error("Error deleting sector:", error);
      toast.error("Không thể xóa ngành khỏi danh sách theo dõi. Vui lòng thử lại sau.");
    } finally {
      setIsDeletingSector(false);
    }
  };

  // Hook để fetch dữ liệu ban đầu và thiết lập SignalR
  useEffect(() => {
    fetchStockData();
    
    // Thiết lập kết nối SignalR
    const signalRCleanup = setupSignalRConnection();
    
    // Cleanup khi component unmount
    return () => {
      if (typeof signalRCleanup === 'function') {
        signalRCleanup();
      }
    };
  }, [activeTab]);

  // Hàm nội bộ để xử lý dữ liệu cổ phiếu
  function processStocks(stocks) {
    console.log("Processing stocks data:", stocks);
    
    // Map data cho UI hiển thị
    const stocksData = stocks.map(stock => {
      // Lấy mã chứng khoán - xử lý đúng field name
      const stockCode = stock.ticketSymbol;
      if (!stockCode) {
        console.warn("Stock missing ticketSymbol:", stock);
        return null;
      }
      
      // Tạo dữ liệu chart từ thông tin có sẵn
      const returnValue = parseFloat(stock.stockReturn || 0);
      const baseValue = 100;
      const rangePercent = returnValue / 100;
      
      // Tạo chart data dạng đường với các điểm dựa trên stockReturn
      const chartData = [
        baseValue * (1 - rangePercent/2), // Điểm đầu (thấp hơn một chút)
        baseValue * (1 - rangePercent/4), // Điểm 2 
        baseValue,                        // Điểm giữa (điểm tham chiếu)
        baseValue * (1 + rangePercent/3), // Điểm 4
        baseValue * (1 + rangePercent)    // Điểm cuối (tăng theo stockReturn)
      ];
      
      // Lấy các giá trị khác từ API response
      const weight = parseInt(stock.weight) || 96;
      const returnWeight = parseFloat(stock.returnWeight) || 0;
      
      // Tính % thay đổi dựa trên stockReturn
      const dayChange = returnValue || 0;
      const weekChange = returnValue ? returnValue * 1.5 : 0;
      const monthChange = returnValue ? Math.abs(returnValue) * 5 + 2 : 0;
      
      return {
        code: stockCode,
        chart: chartData,
        smg: weight,
        price: returnWeight,
        dayChange: dayChange,
        weekChange: weekChange,
        monthChange: monthChange
      };
    }).filter(stock => stock !== null); // Lọc bỏ các cổ phiếu null
    
    console.log("Processed stocks for display:", stocksData);
    
    if (stocksData.length > 0) {
      setIndustryStocks(stocksData);
    } else {
      toast.error("Không có cổ phiếu hợp lệ trong danh sách theo dõi");
    }
  }

  // Add sectors to watchlist
  const addSectorsToWatchlist = async (userId, sectorIds) => {
    try {
      console.log(`Adding sectors to watchlist for user ${userId}:`, sectorIds);
      
      // Đảm bảo sectorIds là mảng
      const sectorIdArray = Array.isArray(sectorIds) ? sectorIds : [sectorIds];
      
      const response = await axiosInstance.post(`/api/watchlist-sector/${userId}`, sectorIdArray, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Add sectors to watchlist response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Add sectors to watchlist error:", error);
      throw error;
    }
  };

  // Lấy danh sách ngành theo dõi của một user
  const getUserSectors = async (userId) => {
    try {
      console.log(`Getting user sectors for userId: ${userId}`);
      
      const response = await axiosInstance.get(`/api/watchlist-sector/${userId}`, {
        timeout: 15000
      });
      
      console.log("User sectors response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching user sectors:', error);
      throw error;
    }
  };

  // Xóa sector khỏi watchlist
  const deleteSectorFromWatchlist = async (userId, sectorId) => {
    try {
      console.log(`Deleting sector ${sectorId} for user ${userId}`);
      
      const response = await axiosInstance.delete(`/api/watchlist-sector/${userId}/${sectorId}`);
      
      console.log("Delete sector from watchlist response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Delete sector from watchlist error:", error);
      throw error;
    }
  };

  // Xóa sector khỏi watchlist sử dụng query parameter
  const deleteSectorWithQuery = async (userId, sectorId) => {
    try {
      console.log(`Deleting sector ${sectorId} for user ${userId} using query parameters`);
      
      const response = await axiosInstance.delete('/api/watchlist-sector', {
        params: {
          userId: userId,
          sectorId: sectorId
        }
      });
      
      console.log("Delete sector with query params response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Delete sector with query params error:", error);
      throw error;
    }
  };

  // Add stocks to watchlist (multiple)
  const addStocksToWatchlist = async (userId, stockCodes) => {
    try {
      const requests = stockCodes.map(code => 
        stockService.addToWatchlist(userId, code)
      );
      
      const responses = await Promise.all(requests);
      console.log("Add stocks to watchlist responses:", responses);
      return responses;
    } catch (error) {
      console.error("Add stocks to watchlist error:", error);
      throw error;
    }
  };

  // Fetch available stocks
  const fetchAvailableStocks = async () => {
    try {
      setIsLoadingStocks(true);
      const response = await axios.get(
        'https://stockmonitoring-api-gateway.onrender.com/api/watchlist-stock',
        {
          params: {
            pageIndex: 0,
            pageSize: 2000
          },
          headers: {
            'Authorization': `Bearer ${Cookies.get('auth_token')}`,
            'accept': '*/*'
          }
        }
      );

      if (response?.data?.value?.data) {
        setAvailableStocks(response.data.value.data);
      }
    } catch (error) {
      console.error('Error fetching stocks:', error);
      toast.error('Không thể tải danh sách cổ phiếu');
    } finally {
      setIsLoadingStocks(false);
    }
  };

  // Add selected stocks to watchlist
  const addSelectedStocksToWatchlist = async () => {
    try {
      setIsAddingStocks(true);
      const userId = getUserId();
      if (!userId) {
        toast.error('Bạn cần đăng nhập để sử dụng tính năng này');
        return;
      }

      // Filter out stocks that are already in the watchlist
      const newStocks = selectedStockIds
        .map(id => {
          const stock = availableStocks.find(s => s.id === id);
          return stock ? stock.ticketSymbol : null;
        })
        .filter(Boolean)
        .filter(ticker => !watchlist.some(w => w.stockCode === ticker));

      if (newStocks.length === 0) {
        toast.info('Tất cả cổ phiếu đã được chọn đã có trong danh sách theo dõi');
        return;
      }

      await axios.post(
        'https://stockmonitoring-api-gateway.onrender.com/api/watchlist-stock',
        {
          userId: userId,
          tickerSymbol: newStocks
        },
        {
          headers: {
            'Authorization': `Bearer ${Cookies.get('auth_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success('Đã thêm cổ phiếu vào danh sách theo dõi');
      setIsAddStockDialogOpen(false);
      setSelectedStockIds([]);
      fetchStockData(); // Refresh watchlist
    } catch (error) {
      console.error('Error adding stocks:', error);
      toast.error('Không thể thêm cổ phiếu vào danh sách theo dõi. Hoặc bạn đã thêm cổ phiếu này vào danh sách theo dõi rồi');
    } finally {
      setIsAddingStocks(false);
    }
  };

  // Update addSectorsToWatchlist success handler
  const handleAddSectors = async () => {
    if (selectedIndustryIds.length > 0) {
      const userId = getUserId();
      
      if (!userId) {
        toast.error("Bạn cần đăng nhập để sử dụng tính năng này");
        return;
      }
      
      setIsAddIndustryDialogOpen(false);
      toast.promise(
        stockService.addSectorsToWatchlist(userId, selectedIndustryIds),
        {
          loading: 'Đang thêm ngành...',
          success: (response) => {
            // Refresh industries data instead of manual state update
            refreshIndustries();
            setSelectedIndustryIds([]);
            setNewIndustryName('');
            return "Đã thêm ngành thành công!";
          },
          error: (err) => {
            console.error("Error adding sectors:", err);
            return "Không thể thêm ngành. Vui lòng thử lại sau.";
          }
        }
      );
    }
  };

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
          `https://stockmonitoring-api-gateway.onrender.com/api/stock-price-history?ticketSymbol=${selectedStock.stockCode}`,
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
          setChartData(formattedData);
        } else {
          setChartData([]);
          setChartError('Không có dữ liệu cho mã này');
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
        setChartData([]);
        setChartError('Không thể tải dữ liệu biểu đồ');
        toast.error('Không thể tải dữ liệu biểu đồ');
      } finally {
        setIsChartLoading(false);
      }
    };

    fetchChartData();
  }, [selectedStock]);

  // Add helper function to handle null values
  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return '--';
    }
    return value;
  };

  // Add useEffect for real-time timestamp update
  useEffect(() => {
    const timer = setInterval(() => {
      setLastTimestamp(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Add function to handle notification creation
  const handleCreateNotification = (stock) => {
    setSelectedNotificationStock(stock);
    setNotificationData({
      price: '',
      type: 'increase'
    });
    setIsNotificationDialogOpen(true);
  };

  // Add function to validate notification price
  const validateNotificationPrice = (price) => {
    if (!price || isNaN(price) || price <= 0) {
      toast.error("Vui lòng nhập giá hợp lệ lớn hơn 0");
      return false;
    }

    const currentPrice = parseFloat(selectedNotificationStock?.matchPrice);
    if (isNaN(currentPrice)) {
      toast.error("Không thể lấy được giá hiện tại của cổ phiếu");
      return false;
    }

    if (notificationData.type === "increase") {
      if (parseFloat(price) <= currentPrice) {
        toast.error(`Giá mục tiêu (${price}) phải cao hơn giá hiện tại (${currentPrice})`);
        return false;
      }
    } else {
      if (parseFloat(price) >= currentPrice) {
        toast.error(`Giá mục tiêu (${price}) phải thấp hơn giá hiện tại (${currentPrice})`);
        return false;
      }
    }

    // Validate with floor/ceil price
    const ceilPrice = parseFloat(selectedNotificationStock?.ceilPrice);
    const floorPrice = parseFloat(selectedNotificationStock?.floorPrice);
    
    if (!isNaN(ceilPrice) && parseFloat(price) > ceilPrice) {
      toast.error(`Giá mục tiêu không được vượt quá giá trần (${ceilPrice})`);
      return false;
    }
    
    if (!isNaN(floorPrice) && parseFloat(price) < floorPrice) {
      toast.error(`Giá mục tiêu không được thấp hơn giá sàn (${floorPrice})`);
      return false;
    }

    return true;
  };

  // Update handleSubmitNotification with validation
  const handleSubmitNotification = async () => {
    try {
      const userId = getUserId();
      
      if (!userId) {
        toast.error("Bạn cần đăng nhập để tạo thông báo");
        return;
      }

      if (!notificationData.price) {
        toast.error("Vui lòng nhập giá mục tiêu");
        return;
      }

      // Add price validation
      if (!validateNotificationPrice(notificationData.price)) {
        return;
      }

      setIsCreatingNotification(true);

      const data = {
        tickerSymbol: selectedNotificationStock.stockCode,
        userId: userId,
        price: parseFloat(notificationData.price),
        type: notificationData.type
      };

      const response = await stockService.createNotification(data);
      toast.success(response?.value?.data || "Tạo thông báo thành công");
      setIsNotificationDialogOpen(false);
    } catch (error) {
      console.error("Error creating notification:", error);
      toast.error("Không thể tạo thông báo: " + (error.message || "Vui lòng thử lại sau"));
    } finally {
      setIsCreatingNotification(false);
    }
  };

  // Update the Input component to show current price
  <div className="grid gap-2">
    <Label htmlFor="price">Giá mục tiêu</Label>
    <div className="space-y-2">
      <Input
        id="price"
        type="number"
        value={notificationData.price}
        onChange={(e) => setNotificationData(prev => ({ ...prev, price: e.target.value }))}
        className="bg-gray-50 dark:bg-[#0a0a14] border-gray-200 dark:border-[#333] text-gray-900 dark:text-white"
        placeholder="Nhập giá mục tiêu"
      />
      <div className="text-sm text-gray-500 dark:text-[#666] flex items-center justify-between">
        <span>Giá hiện tại: {selectedNotificationStock?.matchPrice}</span>
        <div className="flex gap-2">
          <span>Giá trần: {selectedNotificationStock?.ceilPrice}</span>
          <span>Giá sàn: {selectedNotificationStock?.floorPrice}</span>
        </div>
      </div>
    </div>
  </div>

  // Add function to check subscription
  const checkSubscription = () => {
    try {
      setIsLoadingSubscription(true);
      
      // Kiểm tra quyền truy cập từ featureStore thay vì localStorage
      setUserSubscription({
        isPremium: hasIndustryFeature || hasWatchlistFeature,
        hasIndustryFeature: hasIndustryFeature,
        hasWatchlistFeature: hasWatchlistFeature,
        features: useFeatureStore.getState().features
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setUserSubscription(null);
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  // Add useEffect to check subscription on mount
  useEffect(() => {
    checkSubscription();
  }, []);

  // Add function to handle tab change with feature check
  const handleTabChange = (tab) => {
    try {
      console.log('Attempting to switch to tab:', tab);
      
      if (tab === 'industries') {
        console.log('Has industry feature:', hasIndustryFeature);
        
        if (!hasIndustryFeature) {
          setIsUpgradeDialogOpen(true);
          return;
        }
      } else if (tab === 'stocks') {
        console.log('Has watchlist feature:', hasWatchlistFeature);
        
        if (!hasWatchlistFeature) {
          setIsUpgradeDialogOpen(true);
          return;
        }
      }
      
      setWatchlistTab(tab);
    } catch (error) {
      console.error('Error in handleTabChange:', error);
      // Mặc định cho phép chuyển tab nếu có lỗi
      setWatchlistTab(tab);
    }
  };

  // CSS styles for table and animations
  const tableStyles = `
    tbody tr:hover {
      background-color: #f9fafb;
    }
    .dark tbody tr:hover {
      background-color: #1a1a1a;
    }
    
    @keyframes priceUp {
      0% { background-color: rgba(0, 255, 0, 0.3); }
      100% { background-color: transparent; }
    }
    
    @keyframes priceDown {
      0% { background-color: rgba(255, 0, 0, 0.3); }
      100% { background-color: transparent; }
    }
    
    @keyframes volumeUp {
      0% { background-color: rgba(0, 255, 0, 0.2); }
      100% { background-color: transparent; }
    }
    
    @keyframes volumeDown {
      0% { background-color: rgba(255, 0, 0, 0.2); }
      100% { background-color: transparent; }
    }

    .price-up {
      animation: priceUp 1s ease-out;
    }
    
    .price-down {
      animation: priceDown 1s ease-out;
    }
    
    .volume-up {
      animation: volumeUp 1s ease-out;
    }
    
    .volume-down {
      animation: volumeDown 1s ease-out;
    }
  `;

  // Update the tab buttons to use handleTabChange
  return (
    <div className="bg-white dark:bg-[#0a0a14] min-h-screen">
      {/* Thêm animations vào CSS */}
      <style dangerouslySetInnerHTML={{ __html: priceChangeAnimations }} />
      {/* Page Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-[#0a0a14] border-b border-gray-200 dark:border-[#1a1a1a] px-4 py-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Danh mục theo dõi</h1>
            <p className="text-gray-500 dark:text-[#666]">Theo dõi và phân tích cổ phiếu theo ngành</p>
          </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#333] min-w-[120px]">
              <Clock className="w-4 h-4 text-gray-400 dark:text-[#666]" />
              <span className="text-[#09D1C7] font-medium w-[70px] inline-block">
                {lastTimestamp.toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                })}
              </span>
            </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {/* Main Tabs - Industries vs Watchlist */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => handleTabChange('industries')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg transition-colors ${
                watchlistTab === 'industries'
                  ? 'bg-[#09D1C7] text-white'
                  : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-[#666] hover:bg-gray-200 dark:hover:bg-[#252525]'
              }`}
            >
              Theo ngành
            </button>
            <button
              onClick={() => handleTabChange('stocks')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg transition-colors ${
                watchlistTab === 'stocks'
                  ? 'bg-[#09D1C7] text-white'
                  : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-[#666] hover:bg-gray-200 dark:hover:bg-[#252525]'
              }`}
            >
              Danh sách theo dõi
            </button>
          </div>
          {watchlistTab === 'industries' && (
            <Button
              onClick={() => {
                if (!hasIndustryFeature) {
                  setIsUpgradeDialogOpen(true);
                  return;
                }
                fetchAvailableIndustries();
                setIsAddIndustryDialogOpen(true);
              }}
              className="bg-[#09D1C7] hover:bg-[#0a8f88] text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm ngành</span>
            </Button>
          )}
      </div>

        {/* Exchange Tabs - Only show when in stocks view */}
        {watchlistTab === 'stocks' && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('hsx')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'hsx'
                ? 'bg-[#09D1C7] text-white'
                : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-[#666] hover:bg-gray-200 dark:hover:bg-[#252525]'
            }`}
          >
            HOSE
          </button>
          <button
            onClick={() => setActiveTab('hnx')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'hnx'
                ? 'bg-[#09D1C7] text-white'
                : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-[#666] hover:bg-gray-200 dark:hover:bg-[#252525]'
            }`}
          >
            HNX
          </button>
        </div>
            <Button
              onClick={() => {
                if (!hasWatchlistFeature) {
                  setIsUpgradeDialogOpen(true);
                  return;
                }
                fetchAvailableStocks();
                setIsAddStockDialogOpen(true);
              }}
              className="bg-[#09D1C7] hover:bg-[#3a5ad9] text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm cổ phiếu</span>
            </Button>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {watchlistTab === 'stocks' ? (
            <>
          {/* Left section - Stock Table */}
              <div className="lg:col-span-12">
            {/* Stock Table */}
                <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200/30 dark:border-[#333] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] border-collapse">
                  <colgroup>
                    <col className="w-[40px]" />
                    <col className="w-[35px]" />
                    <col className="w-[35px]" />
                    <col className="w-[35px]" />
                    <col className="w-[35px]" />
                    <col className="w-[40px]" />
                    <col className="w-[35px]" />
                    <col className="w-[40px]" />
                    <col className="w-[35px]" />
                    <col className="w-[40px]" />
                    <col className="w-[35px]" />
                    <col className="w-[40px]" />
                    <col className="w-[40px]" />
                    <col className="w-[35px]" />
                    <col className="w-[40px]" />
                    <col className="w-[35px]" />
                    <col className="w-[40px]" />
                    <col className="w-[35px]" />
                    <col className="w-[40px]" />
                    <col className="w-[45px]" />
                    <col className="w-[35px]" />
                    <col className="w-[35px]" />
                    <col className="w-[40px]" />
                  </colgroup>
                  <thead className="sticky top-0 bg-white dark:bg-[#1a1a1a] z-50">
                        <tr className="border-b border-gray-200/60 dark:border-[#333]">
                          <th className="text-gray-500 dark:text-[#999] border-r border-gray-200/60 dark:border-[#333] text-center whitespace-nowrap py-2" rowSpan={2}>Mã CK</th>
                          <th className="text-gray-500 dark:text-[#999] border-r border-gray-200/60 dark:border-[#333] text-center whitespace-nowrap py-2" rowSpan={2}>Trần</th>
                          <th className="text-gray-500 dark:text-[#999] border-r border-gray-200/60 dark:border-[#333] text-center whitespace-nowrap py-2" rowSpan={2}>Sàn</th>
                          <th className="text-gray-500 dark:text-[#999] border-r border-gray-200/60 dark:border-[#333] text-center whitespace-nowrap py-2" rowSpan={2}>TC</th>
                          <th className="text-gray-500 dark:text-[#999] border-r border-gray-200/60 dark:border-[#333] text-center whitespace-nowrap py-2" colSpan={6}>Bên mua</th>
                          <th className="text-gray-500 dark:text-[#999] border-r border-gray-200/60 dark:border-[#333] text-center whitespace-nowrap py-2" colSpan={3}>Khớp lệnh</th>
                          <th className="text-gray-500 dark:text-[#999] border-r border-gray-200/60 dark:border-[#333] text-center whitespace-nowrap py-2" colSpan={6}>Bên bán</th>
                          <th className="text-gray-500 dark:text-[#999] border-r border-gray-200/60 dark:border-[#333] text-center whitespace-nowrap py-2" rowSpan={2}>Tổng KL</th>
                          <th className="text-gray-500 dark:text-[#999] border-r border-gray-200/60 dark:border-[#333] text-center whitespace-nowrap py-2" colSpan={2}>ĐTNN</th>
                          <th className="text-gray-500 dark:text-[#999] text-center whitespace-nowrap py-2" rowSpan={2}>Thao tác</th>
                    </tr>
                        <tr className="border-b border-gray-200/60 dark:border-[#333]">
                          <th className="text-gray-500 dark:text-[#999] border-r border-gray-200/60 dark:border-[#333] text-center whitespace-nowrap py-2">Giá 3</th>
                          <th className="text-gray-500 dark:text-[#999] border-r border-gray-200/60 dark:border-[#333] text-center whitespace-nowrap py-2">KL 3</th>
                          <th className="text-gray-500 dark:text-[#999] border-r border-gray-200/60 dark:border-[#333] text-center whitespace-nowrap py-2">Giá 2</th>
                          <th className="text-gray-500 dark:text-[#999] border-r border-gray-200/60 dark:border-[#333] text-center whitespace-nowrap py-2">KL 2</th>
                          <th className="text-gray-500 dark:text-[#999] border-r border-gray-200/60 dark:border-[#333] text-center whitespace-nowrap py-2">Giá 1</th>
                          <th className="text-gray-500 dark:text-[#999] border-r border-gray-200/60 dark:border-[#333] text-center whitespace-nowrap py-2">KL 1</th>
                          <th className="text-gray-500 dark:text-[#999] border-r border-gray-200/60 dark:border-[#333] text-center whitespace-nowrap py-2">Giá</th>
                          <th className="text-gray-500 dark:text-[#999] border-r border-gray-200/60 dark:border-[#333] text-center whitespace-nowrap py-2">KL</th>
                          <th className="text-gray-500 dark:text-[#999] border-r border-gray-200/60 dark:border-[#333] text-center whitespace-nowrap py-2">+/-</th>
                          <th className="text-gray-500 dark:text-[#999] border-r border-gray-200/60 dark:border-[#333] text-center whitespace-nowrap py-2">Giá 1</th>
                          <th className="text-gray-500 dark:text-[#999] border-r border-gray-200/60 dark:border-[#333] text-center whitespace-nowrap py-2">KL 1</th>
                          <th className="text-gray-500 dark:text-[#999] border-r border-gray-200/60 dark:border-[#333] text-center whitespace-nowrap py-2">Giá 2</th>
                          <th className="text-gray-500 dark:text-[#999] border-r border-gray-200/60 dark:border-[#333] text-center whitespace-nowrap py-2">KL 2</th>
                          <th className="text-gray-500 dark:text-[#999] border-r border-gray-200/60 dark:border-[#333] text-center whitespace-nowrap py-2">Giá 3</th>
                          <th className="text-gray-500 dark:text-[#999] border-r border-gray-200/60 dark:border-[#333] text-center whitespace-nowrap py-2">KL 3</th>
                          <th className="text-gray-500 dark:text-[#999] border-r border-gray-200/60 dark:border-[#333] text-center whitespace-nowrap py-2">Mua</th>
                          <th className="text-gray-500 dark:text-[#999] text-center whitespace-nowrap py-2">Bán</th>
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
                    ) : watchlist.length === 0 ? (
                      <tr>
                        <td colSpan="26" className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <AlertTriangle className="h-8 w-8 text-yellow-500" />
                            <span className="text-gray-400">Không có cổ phiếu nào trong danh sách theo dõi</span>
                            <span className="text-gray-500 text-sm">Hãy thêm cổ phiếu từ trang "Bảng giá"</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      // Thêm kiểm tra watchlist có phải là mảng hay không
                      Array.isArray(watchlist) ? 
                      watchlist.map((stock) => (
                        <tr key={stock.stockCode} className="hover:bg-gray-100 dark:hover:bg-[#1a1a1a]">
                              <td className={`${getCellClasses(stock, 'matchPrice')} border-r text-center font-medium transition-colors duration-300 cursor-pointer py-1`} onClick={() => handleStockClick(stock)}>
                            {formatValue(stock.stockCode)}
                          </td>
                              <td className="text-[#B388FF] border-r text-center whitespace-nowrap py-1">{formatValue(stock.ceilPrice)}</td>
                              <td className="text-[#00BCD4] border-r text-center whitespace-nowrap py-1">{formatValue(stock.floorPrice)}</td>
                              <td className="text-[#F4BE37] border-r text-center whitespace-nowrap py-1">{formatValue(stock.priorClosePrice)}</td>
                          <td className={getCellClasses(stock, 'price3Buy')}>
                            {formatValue(stock.price3Buy)}
                          </td>
                          <td className={getCellClasses(stock, 'volume3Buy')}>
                            {formatValue(stock.volume3Buy)}
                          </td>
                          <td className={getCellClasses(stock, 'price2Buy')}>
                            {formatValue(stock.price2Buy)}
                          </td>
                          <td className={getCellClasses(stock, 'volume2Buy')}>
                            {formatValue(stock.volume2Buy)}
                          </td>
                          <td className={getCellClasses(stock, 'price1Buy')}>
                            {formatValue(stock.price1Buy)}
                          </td>
                          <td className={getCellClasses(stock, 'volume1Buy')}>
                            {formatValue(stock.volume1Buy)}
                          </td>
                          <td className={getCellClasses(stock, 'matchPrice')}>
                            {formatValue(stock.matchPrice)}
                          </td>
                          <td className={getCellClasses(stock, 'volumeAccumulation')}>
                            {formatValue(stock.volumeAccumulation)}
                          </td>
                              <td className={`${parseFloat(stock.plusMinus) > 0 ? 'text-[#00FF00]' : 'text-[#FF4A4A]'} border-r text-center whitespace-nowrap py-1`}>
                            {stock.plusMinus !== null && stock.plusMinus !== undefined && stock.plusMinus !== '--' ? 
                              `${parseFloat(stock.plusMinus) > 0 ? '+' : ''}${stock.plusMinus}%` : 
                              '--'}
                          </td>
                          <td className={getCellClasses(stock, 'price1Sell')}>
                            {formatValue(stock.price1Sell)}
                          </td>
                          <td className={getCellClasses(stock, 'volume1Sell')}>
                            {formatValue(stock.volume1Sell)}
                          </td>
                          <td className={getCellClasses(stock, 'price2Sell')}>
                            {formatValue(stock.price2Sell)}
                          </td>
                          <td className={getCellClasses(stock, 'volume2Sell')}>
                            {formatValue(stock.volume2Sell)}
                          </td>
                          <td className={getCellClasses(stock, 'price3Sell')}>
                            {formatValue(stock.price3Sell)}
                          </td>
                          <td className={getCellClasses(stock, 'volume3Sell')}>
                            {formatValue(stock.volume3Sell)}
                          </td>
                          <td className="text-gray-900 dark:text-white border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-1">{formatValue(stock.matchedOrderVolume)}</td>
                          <td className="text-gray-900 dark:text-white border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-1">{formatValue(stock.foreignBuyVolume)}</td>
                          <td className="text-gray-900 dark:text-white border-r border-gray-200 dark:border-[#333] text-center whitespace-nowrap py-1">{formatValue(stock.foreignSellVolume)}</td>
                          <td className="text-center py-1">
                                <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => removeFromWatchlist(stock)}
                              className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                              title="Xóa khỏi danh sách theo dõi"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                                  <button
                                    onClick={() => handleCreateNotification(stock)}
                                    className="p-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 transition-colors"
                                    title="Tạo thông báo"
                                  >
                                    <Bell className="h-4 w-4" />
                                  </button>
                                </div>
                          </td>
                        </tr>
                      )) : (
                        // Hiển thị trường hợp watchlist không phải là mảng
                        <tr>
                          <td colSpan="26" className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <AlertTriangle className="h-8 w-8 text-red-500" />
                              <span className="text-gray-400">Đã xảy ra lỗi khi tải dữ liệu</span>
                              <span className="text-gray-500 text-sm">Vui lòng làm mới trang để thử lại</span>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
            </>
          ) : (
            <>
              {/* Industries View */}
              <div className="lg:col-span-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {isLoadingIndustries ? (
                    <div className="col-span-full flex justify-center items-center py-8">
                      <div className="w-8 h-8 border-2 border-[#09D1C7] border-t-transparent rounded-full animate-spin"></div>
              </div>
                  ) : industries.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-[#252525] rounded-full flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-gray-400 dark:text-[#666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                  </div>
                      <h3 className="text-gray-900 dark:text-white font-medium mb-1">Chưa có ngành theo dõi</h3>
                      <p className="text-gray-500 dark:text-[#666] text-sm">Thêm ngành để bắt đầu theo dõi cổ phiếu</p>
                </div>
                  ) : (
                    industries.map((industry) => (
                      <div
                        key={industry.id}
                        className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#333] p-4 hover:border-[#09D1C7] transition-colors cursor-pointer"
                        onClick={() => handleIndustryClick(industry)}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-medium text-gray-900 dark:text-white">{industry.name}</h3>
                            <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSector(industry, e);
                            }}
                            className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                          >
                            <X className="h-4 w-4" />
                            </button>
                          </div>
                        
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-1 ${
                              industry.smg >= 80 ? 'bg-[#09D1C7]/10 text-[#09D1C7]' : 
                                industry.smg >= 50 ? 'bg-[#FF6B00]/10 text-[#FF6B00]' :
                              'bg-red-500/10 text-red-500'
                            }`}>
                              {industry.smg}
                          </div>
                            <div className="text-xs text-gray-500 dark:text-[#666]">SMG</div>
                          </div>
                          <div className="text-center">
                            <div className={`text-sm font-medium mb-1 ${
                              industry.percentD > 0 ? 'text-[#00FF00]' : 'text-[#FF4A4A]'
                            }`}>
                              {industry.percentD > 0 ? '+' : ''}{industry.percentD.toFixed(2)}%
                            </div>
                            <div className="text-xs text-gray-500 dark:text-[#666]">Ngày</div>
                          </div>
                          <div className="text-center">
                            <div className={`text-sm font-medium mb-1 ${
                              industry.percentW > 0 ? 'text-[#00FF00]' : 'text-[#FF4A4A]'
                            }`}>
                              {industry.percentW > 0 ? '+' : ''}{industry.percentW.toFixed(2)}%
                            </div>
                            <div className="text-xs text-gray-500 dark:text-[#666]">Tuần</div>
                          </div>
                          <div className="text-center">
                            <div className={`text-sm font-medium mb-1 ${
                              industry.percentM > 0 ? 'text-[#00FF00]' : 'text-[#FF4A4A]'
                            }`}>
                              {industry.percentM > 0 ? '+' : ''}{industry.percentM.toFixed(2)}%
                          </div>
                            <div className="text-xs text-gray-500 dark:text-[#666]">Tháng</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-[#666]">
                            {industry.stocks?.length || 0} cổ phiếu
                          </span>
                          <button className="text-[#09D1C7] hover:text-[#0a8f88] flex items-center gap-1">
                            Chi tiết
                            <ChevronRight className="h-4 w-4" />
                          </button>
                      </div>
                  </div>
                    ))
                )}
                  </div>
              </div>
            </>
          )}

          {/* Right section - Only show in stocks view */}
          
              </div>
            </div>
            
      {/* Quick Stats - Show in both views */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#333] p-4">
                <h3 className="text-gray-500 dark:text-[#666] text-sm mb-2">Tổng số cổ phiếu</h3>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{watchlist.length}</p>
              </div>
              <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#333] p-4">
                <h3 className="text-gray-500 dark:text-[#666] text-sm mb-2">Số ngành</h3>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{industries.length}</p>
              </div>
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#333] p-4">
          <h3 className="text-gray-500 dark:text-[#666] text-sm mb-2">Tăng trong ngày</h3>
          <p className="text-xl font-semibold text-[#00FF00]">
            {watchlist.filter(stock => parseFloat(stock.plusMinus) > 0).length}
          </p>
            </div>
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#333] p-4">
          <h3 className="text-gray-500 dark:text-[#666] text-sm mb-2">Giảm trong ngày</h3>
          <p className="text-xl font-semibold text-[#FF4A4A]">
            {watchlist.filter(stock => parseFloat(stock.plusMinus) < 0).length}
          </p>
        </div>
      </div>

      {/* Industry Detail Dialog */}
      <Dialog open={isIndustryDetailOpen} onOpenChange={setIsIndustryDetailOpen}>
        <DialogContent className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white border-gray-200 dark:border-[#333] max-w-[800px] w-[95vw]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <DialogTitle className="text-xl font-semibold mb-1">{selectedIndustry?.name}</DialogTitle>
              <DialogDescription className="text-[#666] flex items-center gap-2">
                <span>SMG Score:</span>
                <span className={`font-medium ${
                  selectedIndustry?.smg >= 80 ? 'text-[#09D1C7]' : 
                  selectedIndustry?.smg >= 50 ? 'text-[#FF6B00]' :
                  'text-red-500'
                }`}>
                  {selectedIndustry?.smg}
                </span>
              </DialogDescription>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-[#252525] rounded-lg border border-gray-200 dark:border-[#333]">
                <span className="text-[#666]">Số cổ phiếu:</span>
                <span className="text-[#09D1C7] font-medium">{selectedIndustry?.stocks?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Performance Overview */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-100 dark:bg-[#252525] rounded-lg p-4 border border-gray-200 dark:border-[#333]">
              <div className="text-[#666] text-sm mb-1">Thay đổi theo ngày</div>
              <div className={`text-lg font-semibold ${selectedIndustry?.percentD > 0 ? 'text-[#00FF00]' : 'text-[#FF4A4A]'}`}>
                {selectedIndustry?.percentD > 0 ? '+' : ''}{selectedIndustry?.percentD.toFixed(2)}%
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-[#252525] rounded-lg p-4 border border-gray-200 dark:border-[#333]">
              <div className="text-[#666] text-sm mb-1">Thay đổi theo tuần</div>
              <div className={`text-lg font-semibold ${selectedIndustry?.percentW > 0 ? 'text-[#00FF00]' : 'text-[#FF4A4A]'}`}>
                {selectedIndustry?.percentW > 0 ? '+' : ''}{selectedIndustry?.percentW.toFixed(2)}%
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-[#252525] rounded-lg p-4 border border-gray-200 dark:border-[#333]">
              <div className="text-[#666] text-sm mb-1">Thay đổi theo tháng</div>
              <div className={`text-lg font-semibold ${selectedIndustry?.percentM > 0 ? 'text-[#00FF00]' : 'text-[#FF4A4A]'}`}>
                {selectedIndustry?.percentM > 0 ? '+' : ''}{selectedIndustry?.percentM.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Stocks Table */}
          <div className="bg-gray-100 dark:bg-[#252525] rounded-lg border border-gray-200 dark:border-[#333] overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-200/50 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#333] text-sm font-medium text-[#666]">
              <div className="col-span-2">Mã CK</div>
              <div className="col-span-3">Biến động</div>
              <div className="col-span-1 text-center">SMG</div>
              <div className="col-span-2 text-center">%D</div>
              <div className="col-span-2 text-center">%W</div>
              <div className="col-span-2 text-center">%M</div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {selectedIndustry?.stocks.map((stock) => (
                <div
                  key={stock.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-gray-200/50 dark:hover:bg-[#2a2a2a] border-b border-gray-200 dark:border-[#333] last:border-0 transition-colors"
                >
                  <div className="col-span-2 flex items-center gap-2">
                    <span className="font-medium">{stock.ticketSymbol}</span>
                  </div>
                  <div className="col-span-3">
                    {renderMiniChart([stock.percentD, stock.percentW, stock.percentM])}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <span className={`rounded-full w-8 h-8 flex items-center justify-center font-medium text-sm
                      ${stock.smg >= 80 ? 'bg-[#09D1C7]/10 text-[#09D1C7]' : 
                        stock.smg >= 50 ? 'bg-[#FF6B00]/10 text-[#FF6B00]' :
                        'bg-red-500/10 text-red-500'}`}>
                      {stock.smg}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={`inline-block min-w-[80px] text-sm px-2 py-1 rounded ${
                      stock.percentD > 0 
                        ? 'bg-[#00FF00]/10 text-[#00FF00]' 
                        : 'bg-[#FF4A4A]/10 text-[#FF4A4A]'
                    }`}>
                      {stock.percentD > 0 ? '+' : ''}{stock.percentD.toFixed(2)}%
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={`inline-block min-w-[80px] text-sm px-2 py-1 rounded ${
                      stock.percentW > 0 
                        ? 'bg-[#00FF00]/10 text-[#00FF00]' 
                        : 'bg-[#FF4A4A]/10 text-[#FF4A4A]'
                    }`}>
                      {stock.percentW > 0 ? '+' : ''}{stock.percentW.toFixed(2)}%
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={`inline-block min-w-[80px] text-sm px-2 py-1 rounded ${
                      stock.percentM > 0 
                        ? 'bg-[#00FF00]/10 text-[#00FF00]' 
                        : 'bg-[#FF4A4A]/10 text-[#FF4A4A]'
                    }`}>
                      {stock.percentM > 0 ? '+' : ''}{stock.percentM.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Industry Dialog */}
      <Dialog open={isAddIndustryDialogOpen} onOpenChange={setIsAddIndustryDialogOpen}>
        <DialogContent className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white border-gray-200 dark:border-[#333] max-w-[500px] w-[95vw] max-h-[80vh]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <DialogTitle className="text-xl font-semibold mb-1">Thêm ngành theo dõi</DialogTitle>
              <DialogDescription className="text-[#666]">
                Chọn những ngành bạn muốn theo dõi
              </DialogDescription>
            </div>
          </div>
          
          {/* Search Box */}
          <div className="relative mb-4">
            <input
              type="text"
              value={newIndustryName}
              onChange={(e) => setNewIndustryName(e.target.value)}
              placeholder="Tìm kiếm ngành..."
              className="w-full bg-gray-100 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg pl-10 pr-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-[#666] focus:outline-none focus:border-[#09D1C7]"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-[#666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Industries List */}
          <div className="space-y-2 overflow-y-auto max-h-[400px] pr-2">
            {isLoadingAvailableIndustries ? (
              <div className="flex justify-center items-center py-4">
                <div className="w-6 h-6 border-2 border-[#09D1C7] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : availableIndustries.length > 0 ? (
              availableIndustries
                .filter(industry => 
                  (industry.name.toLowerCase().includes(newIndustryName.toLowerCase()) ||
                  industry.code.toLowerCase().includes(newIndustryName.toLowerCase())) &&
                  !industries.some(existingIndustry => existingIndustry.id === industry.id)
                )
                .map(industry => (
                  <div
                    key={industry.id}
                    className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-[#252525] hover:bg-gray-200/80 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
                  >
                    <input
                      type="checkbox"
                      id={`industry-${industry.id}`}
                      checked={selectedIndustryIds.includes(industry.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIndustryIds([...selectedIndustryIds, industry.id]);
                        } else {
                          setSelectedIndustryIds(selectedIndustryIds.filter(id => id !== industry.id));
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 dark:border-[#333] bg-white dark:bg-[#1a1a1a] checked:bg-[#09D1C7] focus:ring-[#09D1C7] focus:ring-offset-0"
                    />
                    <label
                      htmlFor={`industry-${industry.id}`}
                      className="flex-1 flex items-center justify-between cursor-pointer"
                    >
                      <span className="text-gray-900 dark:text-white">{industry.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm px-2 py-0.5 rounded ${
                          industry.smg >= 80 ? 'bg-[#09D1C7]/10 text-[#09D1C7] dark:text-[#09D1C7]' : 
                          industry.smg >= 50 ? 'bg-[#FF6B00]/10 text-[#FF6B00] dark:text-[#FF6B00]' :
                          'bg-red-500/10 text-red-500 dark:text-red-500'
                        }`}>
                          SMG: {industry.smg}
                        </span>
                      </div>
                    </label>
                  </div>
                ))
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-[#666]">
                Không tìm thấy ngành nào
              </div>
            )}
            
            {/* Hiển thị thông báo nếu tất cả ngành đều đã được theo dõi */}
            {!isLoadingAvailableIndustries && availableIndustries.length > 0 && 
             availableIndustries.filter(industry => 
               (industry.name.toLowerCase().includes(newIndustryName.toLowerCase()) ||
               industry.code.toLowerCase().includes(newIndustryName.toLowerCase())) &&
               !industries.some(existingIndustry => existingIndustry.id === industry.id)
             ).length === 0 && (
              <div className="bg-gray-100 dark:bg-[#252525] p-4 rounded-lg text-center">
                <div className="w-10 h-10 bg-gray-200 dark:bg-[#333] rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#09D1C7]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                {newIndustryName ? (
                  <p className="text-gray-500 dark:text-[#999]">Không tìm thấy ngành phù hợp với từ khóa "{newIndustryName}"</p>
                ) : (
                  <p className="text-gray-500 dark:text-[#999]">Bạn đã theo dõi tất cả các ngành có sẵn</p>
                )}
              </div>
            )}
          </div>

          {/* Footer with buttons */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a]">
            <div className="flex items-center justify-between">
            <div className="text-gray-500 dark:text-[#666] text-sm">
              Đã chọn: {selectedIndustryIds.length} ngành
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setSelectedIndustryIds([]);
                  setNewIndustryName('');
                  setIsAddIndustryDialogOpen(false);
                }}
                variant="outline"
                className="bg-transparent border-gray-200 dark:border-[#333] text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#252525]"
              >
                Hủy
              </Button>
              <Button
                onClick={handleAddSectors}
                  className="bg-[#09D1C7] hover:bg-[#0a8f88] text-white min-w-[100px]"
                disabled={selectedIndustryIds.length === 0}
              >
                Thêm ({selectedIndustryIds.length})
              </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock Chart Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white dark:bg-[#131722] text-gray-900 dark:text-white border-gray-200 dark:border-[#2a2e39] max-w-[1200px] w-[95vw] h-[80vh] p-0">
          <DialogTitle className="sr-only">Stock Chart</DialogTitle>
          <DialogDescription className="sr-only">Interactive stock chart with drawing tools</DialogDescription>
          <div className="flex flex-col h-full">
            {/* Chart Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a2e39]">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{selectedStock?.stockCode}</span>
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
            </div>

            {/* Chart Area */}
            <div className="flex-1 bg-white dark:bg-[#131722] min-h-[500px]">
              {isChartLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                    <span className="text-[#888] text-sm">Đang tải dữ liệu biểu đồ...</span>
                  </div>
                </div>
              ) : chartError ? (
                <div className="h-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4 text-center px-4">
                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                    <span className="text-[#888] text-sm">{chartError}</span>
                  </div>
                </div>
              ) : chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4 text-center px-4">
                    <Info className="w-8 h-8 text-blue-500" />
                    <span className="text-[#888] text-sm">Không có dữ liệu biểu đồ cho mã này</span>
                  </div>
                </div>
              ) : (
                <CandlestickChart 
                  stockCode={selectedStock?.stockCode}
                  data={chartData}
                />
              )}
            </div>

            {/* Chart Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200/30 dark:border-[#2a2e39] bg-white dark:bg-[#1e222d] text-xs text-gray-500 dark:text-[#a9a9a9]">
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

      {/* Delete Sector Confirmation Dialog */}
      <Dialog open={isDeleteSectorDialogOpen} onOpenChange={setIsDeleteSectorDialogOpen}>
        <DialogContent className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white border-gray-200 dark:border-[#333] max-w-[400px]">
          <DialogTitle className="font-semibold text-xl">Xóa ngành theo dõi</DialogTitle>
          <DialogDescription className="text-[#999]">
            Bạn có chắc chắn muốn xóa ngành "{sectorToDelete?.name}" khỏi danh sách theo dõi?
          </DialogDescription>
          
          <div className="bg-gray-100 dark:bg-[#252525] p-3 rounded-lg border border-gray-200 dark:border-[#333] mt-2 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#FF6B00]" />
              <p className="text-[#FF6B00] font-medium">Lưu ý:</p>
            </div>
            <p className="text-[#999] text-sm mt-1">Tất cả cổ phiếu trong ngành này sẽ không còn được hiển thị trong danh sách theo dõi của ngành.</p>
          </div>
          
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteSectorDialogOpen(false)}
              className="bg-transparent border-gray-200 dark:border-[#333] text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#252525]"
              disabled={isDeletingSector}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteSector}
              className="bg-red-500 hover:bg-red-600"
              disabled={isDeletingSector}
            >
              {isDeletingSector ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang xóa...</span>
                </div>
              ) : "Xóa ngành"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Stock Confirmation Dialog */}
      <Dialog open={isDeleteStockDialogOpen} onOpenChange={setIsDeleteStockDialogOpen}>
        <DialogContent className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white border-gray-200 dark:border-[#333] max-w-[400px]">
          <DialogTitle className="font-semibold text-xl">Xóa cổ phiếu</DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-[#999]">
            Bạn có chắc chắn muốn xóa cổ phiếu <span className="text-gray-900 dark:text-white font-medium">{stockToDelete?.stockCode}</span> khỏi danh sách theo dõi?
          </DialogDescription>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsDeleteStockDialogOpen(false)}
              className="bg-transparent border-gray-200 dark:border-[#333] text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#252525]"
              disabled={isDeletingStock}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteStock}
              className="bg-red-500 hover:bg-red-600"
              disabled={isDeletingStock}
            >
              {isDeletingStock ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang xóa...</span>
                </div>
              ) : "Xóa cổ phiếu"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Stock Dialog */}
      <Dialog open={isAddStockDialogOpen} onOpenChange={setIsAddStockDialogOpen}>
        <DialogContent className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white border-gray-200 dark:border-[#333] max-w-[500px] w-[95vw] max-h-[80vh]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <DialogTitle className="text-xl font-semibold mb-1">Thêm cổ phiếu theo dõi</DialogTitle>
              <DialogDescription className="text-[#666]">
                Chọn những cổ phiếu bạn muốn theo dõi
              </DialogDescription>
            </div>
          </div>
          
          {/* Search Box */}
          <div className="relative mb-4">
            <input
              type="text"
              value={stockSearchQuery}
              onChange={(e) => setStockSearchQuery(e.target.value)}
              placeholder="Tìm kiếm mã cổ phiếu..."
              className="w-full bg-gray-100 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg pl-10 pr-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-[#666] focus:outline-none focus:border-[#09D1C7]"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Stocks List */}
          <div className="space-y-2 overflow-y-auto max-h-[400px] pr-2">
            {isLoadingStocks ? (
              <div className="flex justify-center items-center py-4">
                <div className="w-6 h-6 border-2 border-[#09D1C7] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : availableStocks.length > 0 ? (
              availableStocks
                .filter(stock => 
                  stock.ticketSymbol.toLowerCase().includes(stockSearchQuery.toLowerCase()) &&
                  !watchlist.some(w => w.stockCode.toLowerCase() === stock.ticketSymbol.toLowerCase())
                )
                .map(stock => (
                  <div
                    key={stock.id}
                    className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-[#252525] hover:bg-gray-200/80 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
                  >
                    <input
                      type="checkbox"
                      id={`stock-${stock.id}`}
                      checked={selectedStockIds.includes(stock.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStockIds([...selectedStockIds, stock.id]);
                        } else {
                          setSelectedStockIds(selectedStockIds.filter(id => id !== stock.id));
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 dark:border-[#333] bg-white dark:bg-[#1a1a1a] checked:bg-[#09D1C7] focus:ring-[#09D1C7] focus:ring-offset-0"
                    />
                    <label
                      htmlFor={`stock-${stock.id}`}
                      className="flex-1 flex items-center justify-between cursor-pointer"
                    >
                      <span className="text-gray-900 dark:text-white font-medium">{stock.ticketSymbol}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm px-2 py-0.5 rounded ${
                          stock.smg >= 80 ? 'bg-[#09D1C7]/10 text-[#09D1C7] dark:text-[#09D1C7]' : 
                          stock.smg >= 50 ? 'bg-[#FF6B00]/10 text-[#FF6B00] dark:text-[#FF6B00]' :
                          'bg-red-500/10 text-red-500 dark:text-red-500'
                        }`}>
                          SMG: {stock.smg}
                        </span>
                      </div>
                    </label>
                  </div>
                ))
            ) : (
              <div className="text-center py-4 text-[#666]">
                {stockSearchQuery ? 
                  `Không tìm thấy mã "${stockSearchQuery}"` : 
                  'Không có cổ phiếu nào để thêm'}
              </div>
            )}
          </div>

          {/* Footer with buttons */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a]">
            <div className="flex items-center justify-between">
            <div className="text-gray-500 dark:text-[#666] text-sm">
              Đã chọn: {selectedStockIds.length} cổ phiếu
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setSelectedStockIds([]);
                  setStockSearchQuery('');
                  setIsAddStockDialogOpen(false);
                }}
                variant="outline"
                className="bg-transparent border-gray-200 dark:border-[#333] text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#252525]"
              >
                Hủy
              </Button>
              <Button
                onClick={addSelectedStocksToWatchlist}
                  className="bg-[#09D1C7] hover:bg-[#0a8f88] text-white min-w-[100px]"
                disabled={selectedStockIds.length === 0 || isAddingStocks}
              >
                {isAddingStocks ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang thêm...</span>
                  </div>
                ) : (
                  `Thêm (${selectedStockIds.length})`
                )}
              </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Notification Dialog */}
      <Dialog open={isNotificationDialogOpen} onOpenChange={setIsNotificationDialogOpen}>
        <DialogContent className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white border-gray-200 dark:border-[#333]">
          <DialogHeader>
            <DialogTitle>Tạo thông báo giá</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-[#666]">
              Thiết lập thông báo khi giá cổ phiếu {selectedNotificationStock?.stockCode} đạt đến mức mong muốn
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Loại thông báo</Label>
              <Select
                value={notificationData.type}
                onValueChange={(value) => setNotificationData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="bg-gray-50 dark:bg-[#0a0a14] border-gray-200 dark:border-[#333] text-gray-900 dark:text-white">
                  <SelectValue placeholder="Chọn loại thông báo" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333]">
                  <SelectItem 
                    value="increase" 
                    className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#252525] focus:bg-gray-100 dark:focus:bg-[#252525]"
                  >
                    Khi giá tăng
                  </SelectItem>
                  <SelectItem 
                    value="decrease" 
                    className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#252525] focus:bg-gray-100 dark:focus:bg-[#252525]"
                  >
                    Khi giá giảm
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Giá mục tiêu</Label>
              <div className="space-y-2">
                <Input
                  id="price"
                  type="number"
                  value={notificationData.price}
                  onChange={(e) => setNotificationData(prev => ({ ...prev, price: e.target.value }))}
                  className="bg-gray-50 dark:bg-[#0a0a14] border-gray-200 dark:border-[#333] text-gray-900 dark:text-white"
                  placeholder="Nhập giá mục tiêu"
                />
                <div className="text-sm text-gray-500 dark:text-[#666] flex items-center justify-between">
                  <span>Giá hiện tại: {selectedNotificationStock?.matchPrice}</span>
                  <div className="flex gap-2">
                    <span>Giá trần: {selectedNotificationStock?.ceilPrice}</span>
                    <span>Giá sàn: {selectedNotificationStock?.floorPrice}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNotificationDialogOpen(false)}
              className="bg-transparent border-gray-200 dark:border-[#333] text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#252525]"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmitNotification}
              className="bg-[#09D1C7] hover:bg-[#0a8f88] text-white"
              disabled={isCreatingNotification}
            >
              {isCreatingNotification ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                'Tạo thông báo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Upgrade Package Dialog */}
      <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
        <DialogContent className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white border-gray-200 dark:border-[#333] max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Nâng cấp gói dịch vụ</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-[#666]">
              Để sử dụng tính năng này, bạn cần nâng cấp lên gói Premium
            </DialogDescription>
          </DialogHeader>

          <div className="bg-gray-100 dark:bg-[#252525] rounded-lg p-4 mt-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#09D1C7]/10 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#09D1C7]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Tính năng của gói Premium</h4>
                <ul className="space-y-2 text-sm text-gray-500 dark:text-[#999]">
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#09D1C7]" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Theo dõi cổ phiếu theo ngành
                  </li>
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#09D1C7]" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Phân tích chuyên sâu theo ngành
                  </li>
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#09D1C7]" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Thông báo biến động ngành
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setIsUpgradeDialogOpen(false)}
              className="bg-transparent border-gray-200 dark:border-[#333] text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#252525]"
            >
              Để sau
            </Button>
            <Link to="/upgrade-package">
              <Button className="bg-[#09D1C7] hover:bg-[#0a8f88] text-white">
                Nâng cấp ngay
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WatchlistPage;