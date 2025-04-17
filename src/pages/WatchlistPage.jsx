import React, { useState, useEffect, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, X, Eye, ChevronRight, AlertTriangle } from 'lucide-react';
import { toast } from "sonner";
import CandlestickChart from '@/components/CandlestickChart';
import { getUserId } from '@/api/Api';
import { stockService } from '@/api/StockApi';
import signalRService from '@/api/signalRService';
import moment from 'moment';
import axios from 'axios';
import Cookies from 'js-cookie';

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
  const [lastTimestamp, setLastTimestamp] = useState(null);
  
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

  // CSS Animations cho thay đổi giá và khối lượng
  const priceChangeAnimations = `
    @keyframes priceUp {
      0% { background-color: rgba(0, 255, 0, 0); }
      50% { background-color: rgba(0, 255, 0, 0.2); }
      100% { background-color: rgba(0, 255, 0, 0); }
    }

    @keyframes priceDown {
      0% { background-color: rgba(255, 74, 74, 0); }
      50% { background-color: rgba(255, 74, 74, 0.2); }
      100% { background-color: rgba(255, 74, 74, 0); }
    }

    .price-up-animation {
      animation: priceUp 1s ease-out;
    }

    .price-down-animation {
      animation: priceDown 1s ease-out;
    }
  `;

  // Tạo hiệu ứng flash khi giá thay đổi
  const createFlashEffect = (stockCode, field, newValue, oldValue) => {
    if (!newValue || !oldValue) return;
    
    try {
      const current = parseFloat(newValue);
      const previous = parseFloat(oldValue);
      
      if (current !== previous) {
        setFlashingCells(prev => ({
          ...prev,
          [`${stockCode}-${field}`]: current > previous ? 'increase' : 'decrease'
        }));
        
        // Xóa hiệu ứng flash sau 1 giây
        setTimeout(() => {
          setFlashingCells(prev => {
            const newState = {...prev};
            delete newState[`${stockCode}-${field}`];
            return newState;
          });
        }, 1000);
      }
    } catch (error) {
      console.error(`Error creating flash effect for ${stockCode}-${field}:`, error);
    }
  };

  // Lấy class cho animation
  const getFlashClass = (stockCode, field) => {
    const flashType = flashingCells[`${stockCode}-${field}`];
    return flashType ? `${flashType === 'increase' ? 'price-up-animation' : 'price-down-animation'}` : '';
  };

  // Hàm xác định màu sắc dựa trên giá
  const getPriceColor = (stock, field) => {
    if (!stock || !field) return 'text-white';

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

    return 'text-white';
  };

  // Hàm kết hợp màu sắc và animation cho cell
  const getCellClasses = (stock, field) => {
    if (!stock) return 'text-white border-r border-[#333] text-center whitespace-nowrap py-2';
    
    const colorClass = getPriceColor(stock, field);
    const flashClass = getFlashClass(stock.stockCode, field);
    
    return `${colorClass} ${flashClass} border-r border-[#333] text-center whitespace-nowrap py-2`;
  };

  // Update watchlist data khi có dữ liệu mới từ SignalR
  const updateWatchlistData = (newStockData) => {
    if (!Array.isArray(newStockData) || newStockData.length === 0) {
      console.warn("[SignalR] Invalid or empty stock data received");
      return;
    }

    setWatchlist(prevWatchlist => {
      return prevWatchlist.map(stock => {
        const updatedStock = newStockData.find(s => 
          s.stockCode && stock.stockCode && s.stockCode.toLowerCase() === stock.stockCode.toLowerCase()
        );
        
        if (!updatedStock) return stock;

        // So sánh và tạo hiệu ứng cho các trường thay đổi
        const fieldsToCheck = {
          matchPrice: true,
          matchedOrderVolume: true,
          volumeAccumulation: true,
          price3Buy: true,
          price2Buy: true,
          price1Buy: true,
          price1Sell: true,
          price2Sell: true,
          price3Sell: true,
          volume3Buy: true,
          volume2Buy: true,
          volume1Buy: true,
          volume1Sell: true,
          volume2Sell: true,
          volume3Sell: true,
          foreignBuyVolume: true,
          foreignSellVolume: true
        };

        // Kiểm tra và tạo hiệu ứng cho các trường thay đổi
        Object.keys(fieldsToCheck).forEach(field => {
          if (stock[field] !== updatedStock[field]) {
            createFlashEffect(stock.stockCode, field, updatedStock[field], stock[field]);
          }
        });

        // Cập nhật dữ liệu mới
        return {
          ...stock,
          ...updatedStock,
          matchChange: updatedStock.plusMinus !== undefined ? 
            `${updatedStock.plusMinus > 0 ? '+' : ''}${updatedStock.plusMinus.toFixed(2)}%` : 
            stock.matchChange
        };
      });
    });
  };

  // Fetch stock data from API
  const fetchStockData = async () => {
    console.log("=== Fetching watchlist data ===");
    setIsLoading(true);
    
    try {
      const userId = getUserId();
      console.log("Current user ID:", userId);
    
      if (!userId) {
        console.warn("No user ID found");
        setWatchlist([]);
        setIsLoading(false);
        toast.error("Bạn cần đăng nhập để xem danh sách theo dõi");
        return false;
      }

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
      
      console.log("Watchlist API response:", response);
      
      if (response?.data?.value?.data) {
        const watchlistStocks = response.data.value.data;
        setWatchlist(watchlistStocks);
      } else {
        console.warn("No stocks found in watchlist response");
        setWatchlist([]);
      }
      
      setIsLoading(false);
      setIsInitialLoading(false);
      return true;
    } catch (error) {
      console.error("Error in fetchStockData:", error);
      setIsLoading(false);
      setIsInitialLoading(false);
      toast.error("Không thể tải dữ liệu danh sách theo dõi");
      return false;
    }
  };

  // Tách riêng việc thiết lập SignalR ra khỏi fetching data
  const setupSignalRConnection = async () => {
    try {
      console.log("=== Setting up SignalR for watchlist ===");
      
      const connection = await signalRService.getConnection();
      if (!connection) {
        console.error("[SignalR] No active connection available");
        return;
      }

      // Lắng nghe sự kiện HSX
      signalRService.onStock("ReceiveHSXStockUpdate", async (data) => {
        if (activeTab === 'hsx') {
          try {
            console.log("[SignalR] Received HSX update:", data);
            // Gọi API để lấy dữ liệu mới nhất của sàn HSX
            const userId = getUserId();
            const response = await axios.get(
              `https://stockmonitoring-api-gateway.onrender.com/api/watchlist-stock/${userId}`,
              {
                params: {
                  exchange: 'hsx'
                },
                headers: {
                  'Authorization': `Bearer ${Cookies.get('auth_token')}`,
                  'accept': '*/*'
                }
              }
            );
            
            if (response?.data?.value?.data) {
              setWatchlist(response.data.value.data);
            }
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
            // Gọi API để lấy dữ liệu mới nhất của sàn HNX
            const userId = getUserId();
            const response = await axios.get(
              `https://stockmonitoring-api-gateway.onrender.com/api/watchlist-stock/${userId}`,
              {
                params: {
                  exchange: 'hnx'
                },
                headers: {
                  'Authorization': `Bearer ${Cookies.get('auth_token')}`,
                  'accept': '*/*'
                }
              }
            );
            
            if (response?.data?.value?.data) {
              setWatchlist(response.data.value.data);
            }
          } catch (error) {
            console.error("[SignalR] Error processing HNX update:", error);
          }
        }
      });

      console.log("[SignalR] Watchlist listeners setup complete");
    } catch (error) {
      console.error("[SignalR] Error setting up watchlist listeners:", error);
    }
  };

  // Initial data loading and SignalR setup
  useEffect(() => {
    console.log("WatchlistPage - Component mounted");
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
      try {
        // Call API to get historical data
        const response = await stockService.getStockHistory(stock.code);
        if (response && response.value && response.value.data) {
          setChartData(response.value.data);
        } else {
          setChartData([]);
          toast.error("Không thể tải dữ liệu biểu đồ");
        }
      } catch (error) {
        console.error("Error fetching chart data:", error);
        setChartData([]);
        toast.error("Có lỗi khi tải dữ liệu biểu đồ");
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
    console.log("WatchlistPage - Component mounted");
    fetchStockData();
    
    // Thiết lập SignalR và kết nối
    const signalRCleanup = setupSignalRConnection();
    
    // Cleanup khi unmount
    return () => {
      console.log("WatchlistPage - Component unmounting, cleaning up");
      
      // Hủy đăng ký các lắng nghe SignalR
      try {
        signalRService.offStock("ReceiveHSXStockUpdate");
        signalRService.offStock("ReceiveHNXStockUpdate");
        console.log("WatchlistPage - Unregistered SignalR listeners");
      } catch (error) {
        console.error("WatchlistPage - Error removing SignalR listeners:", error);
      }
      
      // Gọi cleanup từ setupSignalR nếu có
      if (typeof signalRCleanup === 'function') {
        signalRCleanup();
      }
    };
  }, []);

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

  return (
    <div className="bg-[#0a0a14] min-h-screen">
      {/* Thêm animations vào CSS */}
      <style jsx global>{priceChangeAnimations}</style>
      
      {/* Page Header */}
      <div className="sticky top-0 z-50 bg-[#0a0a14] border-b border-[#1a1a1a] px-4 py-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Danh mục theo dõi</h1>
            <p className="text-[#666]">Theo dõi và phân tích cổ phiếu theo ngành</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] rounded-lg border border-[#333]">
              <span className="text-[#666]">Cập nhật:</span>
              <span className="text-[#09D1C7] font-medium">
                {new Date().toLocaleTimeString('vi-VN')}
              </span>
            </div>
            <Button
              onClick={() => {
                fetchAvailableStocks();
                setIsAddStockDialogOpen(true);
              }}
              className="bg-[#09D1C7] hover:bg-[#3a5ad9] text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline">Thêm cổ phiếu</span>
            </Button>
            <Button
              onClick={() => {
                fetchAvailableIndustries();
                setIsAddIndustryDialogOpen(true);
              }}
              className="bg-[#09D1C7] hover:bg-[#0a8f88] text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline">Thêm ngành</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left section - Stock Table */}
          <div className="w-full lg:w-[70%] space-y-4">
            {/* Exchange Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('hsx')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'hsx'
                    ? 'bg-[#09D1C7] text-white'
                    : 'bg-[#1a1a1a] text-[#666] hover:bg-[#252525]'
                }`}
              >
                HOSE
              </button>
              <button
                onClick={() => setActiveTab('hnx')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'hnx'
                    ? 'bg-[#09D1C7] text-white'
                    : 'bg-[#1a1a1a] text-[#666] hover:bg-[#252525]'
                }`}
              >
                HNX
              </button>
            </div>

            {/* Stock Table */}
            <div className="bg-[#1a1a1a] rounded-xl border border-[#333] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <colgroup>
                    <col className="w-[60px]" />
                    <col className="w-[60px]" />
                    <col className="w-[60px]" />
                    <col className="w-[60px]" />
                    <col className="w-[60px]" />
                    <col className="w-[80px]" />
                    <col className="w-[60px]" />
                    <col className="w-[80px]" />
                    <col className="w-[60px]" />
                    <col className="w-[80px]" />
                    <col className="w-[60px]" />
                    <col className="w-[80px]" />
                    <col className="w-[70px]" />
                    <col className="w-[60px]" />
                    <col className="w-[80px]" />
                    <col className="w-[60px]" />
                    <col className="w-[80px]" />
                    <col className="w-[60px]" />
                    <col className="w-[80px]" />
                    <col className="w-[60px]" />
                    <col className="w-[60px]" />
                    <col className="w-[60px]" />
                    <col className="w-[100px]" />
                    <col className="w-[80px]" />
                    <col className="w-[80px]" />
                    <col className="w-[80px]" />
                  </colgroup>
                  <thead className="sticky top-0 bg-[#1a1a1a] z-50">
                    <tr>
                      <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2" rowSpan={2}>Mã CK</th>
                      <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2" rowSpan={2}>Trần</th>
                      <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2" rowSpan={2}>Sàn</th>
                      <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2" rowSpan={2}>TC</th>
                      <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2" colSpan={6}>Bên mua</th>
                      <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2" colSpan={3}>Khớp lệnh</th>
                      <th className="text-[#999] border-r border-[#333] text-center whitespace-nowrap py-2" colSpan={6}>Bên bán</th>
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
                      watchlist.map((stock) => (
                        <tr key={stock.stockCode} className="hover:bg-[#1a1a1a]">
                          <td className={`${getCellClasses(stock, 'matchPrice')} border-r border-[#333] text-center font-medium transition-colors duration-300 cursor-pointer py-2`} onClick={() => handleStockClick(stock)}>
                            {stock.stockCode}
                          </td>
                          <td className="text-[#B388FF] border-r border-[#333] text-center whitespace-nowrap py-2">{stock.ceilPrice}</td>
                          <td className="text-[#00BCD4] border-r border-[#333] text-center whitespace-nowrap py-2">{stock.floorPrice}</td>
                          <td className="text-[#F4BE37] border-r border-[#333] text-center whitespace-nowrap py-2">{stock.priorClosePrice}</td>
                          <td className={getCellClasses(stock, 'price3Buy')}>
                            {stock.price3Buy}
                          </td>
                          <td className={getCellClasses(stock, 'volume3Buy')}>
                            {stock.volume3Buy}
                          </td>
                          <td className={getCellClasses(stock, 'price2Buy')}>
                            {stock.price2Buy}
                          </td>
                          <td className={getCellClasses(stock, 'volume2Buy')}>
                            {stock.volume2Buy}
                          </td>
                          <td className={getCellClasses(stock, 'price1Buy')}>
                            {stock.price1Buy}
                          </td>
                          <td className={getCellClasses(stock, 'volume1Buy')}>
                            {stock.volume1Buy}
                          </td>
                          <td className={getCellClasses(stock, 'matchPrice')}>
                            {stock.matchPrice}
                          </td>
                          <td className={getCellClasses(stock, 'volumeAccumulation')}>
                            {stock.volumeAccumulation}
                          </td>
                          <td className={`${parseFloat(stock.plusMinus) > 0 ? 'text-[#00FF00]' : 'text-[#FF4A4A]'} border-r border-[#333] text-center whitespace-nowrap py-2`}>
                            {stock.plusMinus !== '--' ? `${parseFloat(stock.plusMinus) > 0 ? '+' : ''}${stock.plusMinus}%` : '--'}
                          </td>
                          <td className={getCellClasses(stock, 'price1Sell')}>
                            {stock.price1Sell}
                          </td>
                          <td className={getCellClasses(stock, 'volume1Sell')}>
                            {stock.volume1Sell}
                          </td>
                          <td className={getCellClasses(stock, 'price2Sell')}>
                            {stock.price2Sell}
                          </td>
                          <td className={getCellClasses(stock, 'volume2Sell')}>
                            {stock.volume2Sell}
                          </td>
                          <td className={getCellClasses(stock, 'price3Sell')}>
                            {stock.price3Sell}
                          </td>
                          <td className={getCellClasses(stock, 'volume3Sell')}>
                            {stock.volume3Sell}
                          </td>
                          <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.matchedOrderVolume}</td>
                          <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.foreignBuyVolume}</td>
                          <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.foreignSellVolume}</td>
                          <td className="text-center py-2">
                            <button
                              onClick={() => removeFromWatchlist(stock)}
                              className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                              title="Xóa khỏi danh sách theo dõi"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right section - Industries */}
          <div className="w-full lg:w-[30%] space-y-6">
            {/* Industries List */}
            <div className="bg-[#1a1a1a] rounded-xl border border-[#333] overflow-hidden">
              <div className="p-4 border-b border-[#333]">
                <h2 className="text-xl font-semibold text-white">Ngành theo dõi</h2>
              </div>

              <div className="p-4">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[#999] text-sm font-medium">
                  <div className="col-span-4">Tên ngành</div>
                  <div className="col-span-2 text-center">SMG</div>
                  <div className="col-span-5 grid grid-cols-3 gap-2 text-center">
                    <span>%D</span>
                    <span>%W</span>
                    <span>%M</span>
                  </div>
                  <div className="col-span-1"></div>
                </div>

                {/* Industry Items */}
                {!isLoadingIndustries && industries && industries.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {industries.map((industry) => (
                      <div
                        key={industry.id}
                        className="bg-[#252525] hover:bg-[#2a2a2a] rounded-lg transition-all duration-200"
                      >
                        <div className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center">
                          <div className="col-span-4 flex items-center gap-2 min-w-0">
                            <button
                              onClick={() => handleIndustryClick(industry)}
                              className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                                selectedIndustry?.id === industry.id 
                                  ? 'bg-[#09D1C7]/10 text-[#09D1C7]' 
                                  : 'text-[#666] hover:bg-[#333] hover:text-[#09D1C7]'
                              }`}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <span className="text-white font-medium truncate">{industry.name}</span>
                          </div>
                          <div className="col-span-2 flex justify-center">
                            <span className={`rounded-full w-8 h-8 flex items-center justify-center font-medium text-sm
                              ${industry.smg >= 80 ? 'bg-[#09D1C7]/10 text-[#09D1C7]' : 
                                industry.smg >= 50 ? 'bg-[#FF6B00]/10 text-[#FF6B00]' :
                                'bg-red-500/10 text-red-500'}`}>
                              {industry.smg}
                            </span>
                          </div>
                          <div className="col-span-5 grid grid-cols-3 gap-2 text-center text-xs">
                            <span className={`rounded px-1 py-0.5 overflow-hidden whitespace-nowrap ${
                              industry.percentD > 0 
                                ? 'bg-[#00FF00]/10 text-[#00FF00]' 
                                : 'bg-[#FF4A4A]/10 text-[#FF4A4A]'
                            }`}>
                              {industry.percentD > 0 ? '+' : ''}{industry.percentD.toFixed(2)}%
                            </span>
                            <span className={`rounded px-1 py-0.5 overflow-hidden whitespace-nowrap ${
                              industry.percentW > 0 
                                ? 'bg-[#00FF00]/10 text-[#00FF00]' 
                                : 'bg-[#FF4A4A]/10 text-[#FF4A4A]'
                            }`}>
                              {industry.percentW > 0 ? '+' : ''}{industry.percentW.toFixed(2)}%
                            </span>
                            <span className={`rounded px-1 py-0.5 overflow-hidden whitespace-nowrap ${
                              industry.percentM > 0 
                                ? 'bg-[#00FF00]/10 text-[#00FF00]' 
                                : 'bg-[#FF4A4A]/10 text-[#FF4A4A]'
                            }`}>
                              {industry.percentM > 0 ? '+' : ''}{industry.percentM.toFixed(2)}%
                            </span>
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <button
                              onClick={(e) => handleDeleteSector(industry, e)}
                              className="flex-shrink-0 p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                              title="Xóa ngành khỏi danh sách theo dõi"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Loading State */}
                {isLoadingIndustries && (
                  <div className="flex justify-center items-center py-8">
                    <div className="w-8 h-8 border-2 border-[#09D1C7] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}

                {/* Empty State */}
                {!isLoadingIndustries && (!industries || industries.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 bg-[#252525] rounded-full flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-[#666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h3 className="text-white font-medium mb-1">Chưa có ngành theo dõi</h3>
                    <p className="text-[#666] text-sm">Thêm ngành để bắt đầu theo dõi cổ phiếu</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-4">
                <h3 className="text-[#666] text-sm mb-2">Tổng số cổ phiếu</h3>
                <p className="text-xl font-semibold text-white">{watchlist.length}</p>
              </div>
              <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-4">
                <h3 className="text-[#666] text-sm mb-2">Số ngành</h3>
                <p className="text-xl font-semibold text-white">{industries.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Industry Detail Dialog */}
      <Dialog open={isIndustryDetailOpen} onOpenChange={setIsIndustryDetailOpen}>
        <DialogContent className="bg-[#1a1a1a] text-white border-[#333] max-w-[800px] w-[95vw]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="bg-[#4A72FF] text-white px-3 py-1 rounded-full text-sm font-medium">
                {selectedIndustry?.name}
              </span>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[#666]">SMG Score:</span>
                <span className={`font-medium ${
                  selectedIndustry?.smg >= 80 ? 'text-[#09D1C7]' : 
                  selectedIndustry?.smg >= 50 ? 'text-[#FF6B00]' :
                  'text-red-500'
                }`}>
                  {selectedIndustry?.smg}
                </span>
              </div>
            </div>
          </div>

          {/* Stocks Table */}
          <div className="space-y-1">
            {/* Header */}
            <div className="grid grid-cols-6 gap-2 px-3 py-2 text-[#999] text-sm font-medium border-b border-[#333]">
              <div className="col-span-1">Mã</div>
              <div className="col-span-1">Chart</div>
              <div className="col-span-1 text-center">SMG</div>
              <div className="col-span-3 grid grid-cols-3 gap-1 text-center">
                <span>%D</span>
                <span>%W</span>
                <span>%M</span>
              </div>
            </div>

            {/* Stock Items */}
            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2">
              {selectedIndustry?.stocks.map((stock) => (
                <div
                  key={stock.id}
                  className="grid grid-cols-6 gap-2 px-3 py-2.5 items-center hover:bg-[#252525] rounded-lg transition-colors"
                >
                  <div className="col-span-1 flex items-center gap-1.5">
                    <ChevronRight className="h-4 w-4 text-[#4A72FF]" />
                    <span className="text-white font-medium">{stock.ticketSymbol}</span>
                  </div>
                  <div className="col-span-1">
                    {renderMiniChart([stock.percentD, stock.percentW, stock.percentM])}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <span className={`rounded-full w-7 h-7 flex items-center justify-center font-medium text-sm
                      ${stock.smg >= 95 ? 'bg-[#09D1C7]/10 text-[#09D1C7]' : 
                        stock.smg >= 90 ? 'bg-[#5BD75B]/10 text-[#5BD75B]' :
                        'bg-[#FF6B00]/10 text-[#FF6B00]'}`}>
                      {stock.smg}
                    </span>
                  </div>
                  <div className="col-span-3 grid grid-cols-3 gap-1 text-center text-sm">
                    <span className={`rounded px-1 py-0.5 ${
                      stock.percentD > 0 
                        ? 'bg-[#5BD75B]/10 text-[#5BD75B]' 
                        : 'bg-[#FF4A4A]/10 text-[#FF4A4A]'
                    }`}>
                      {stock.percentD > 0 ? '+' : ''}{stock.percentD.toFixed(2)}%
                    </span>
                    <span className={`rounded px-1 py-0.5 ${
                      stock.percentW > 0 
                        ? 'bg-[#5BD75B]/10 text-[#5BD75B]' 
                        : 'bg-[#FF4A4A]/10 text-[#FF4A4A]'
                    }`}>
                      {stock.percentW > 0 ? '+' : ''}{stock.percentW.toFixed(2)}%
                    </span>
                    <span className={`rounded px-1 py-0.5 ${
                      stock.percentM > 0 
                        ? 'bg-[#5BD75B]/10 text-[#5BD75B]' 
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
        <DialogContent className="bg-[#1a1a1a] text-white border-[#333] max-w-[500px] w-[95vw] max-h-[80vh]">
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
              className="w-full bg-[#252525] border border-[#333] rounded-lg pl-10 pr-3 py-2 text-white placeholder-[#666] focus:outline-none focus:border-[#09D1C7]"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="flex items-center gap-3 p-3 bg-[#252525] hover:bg-[#2a2a2a] rounded-lg transition-colors"
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
                      className="w-4 h-4 rounded border-[#333] bg-[#1a1a1a] checked:bg-[#09D1C7] focus:ring-[#09D1C7] focus:ring-offset-0"
                    />
                    <label
                      htmlFor={`industry-${industry.id}`}
                      className="flex-1 flex items-center justify-between cursor-pointer"
                    >
                      <span className="text-white">{industry.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm px-2 py-0.5 rounded ${
                          industry.smg >= 80 ? 'bg-[#09D1C7]/10 text-[#09D1C7]' : 
                          industry.smg >= 50 ? 'bg-[#FF6B00]/10 text-[#FF6B00]' :
                          'bg-red-500/10 text-red-500'
                        }`}>
                          SMG: {industry.smg}
                        </span>
                        <span className="text-[#666] text-sm">{industry.code}</span>
                      </div>
                    </label>
                  </div>
                ))
            ) : (
              <div className="text-center py-4 text-[#666]">
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
              <div className="bg-[#252525] p-4 rounded-lg text-center">
                <div className="w-10 h-10 bg-[#333] rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#09D1C7]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                {newIndustryName ? (
                  <p className="text-[#999]">Không tìm thấy ngành phù hợp với từ khóa "{newIndustryName}"</p>
                ) : (
                  <p className="text-[#999]">Bạn đã theo dõi tất cả các ngành có sẵn</p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center gap-2 mt-4 pt-4 border-t border-[#333]">
            <div className="text-[#666] text-sm">
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
                className="bg-transparent border-[#333] text-white hover:bg-[#252525]"
              >
                Hủy
              </Button>
              <Button
                onClick={handleAddSectors}
                className="bg-[#09D1C7] hover:bg-[#0a8f88] text-white"
                disabled={selectedIndustryIds.length === 0}
              >
                Thêm ({selectedIndustryIds.length})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Delete Sector Confirmation Dialog */}
      <Dialog open={isDeleteSectorDialogOpen} onOpenChange={setIsDeleteSectorDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] text-white border-[#333] max-w-[400px]">
          <DialogTitle className="font-semibold text-xl">Xóa ngành theo dõi</DialogTitle>
          <DialogDescription className="text-[#999]">
            Bạn có chắc chắn muốn xóa ngành "{sectorToDelete?.name}" khỏi danh sách theo dõi?
          </DialogDescription>
          
          <div className="bg-[#252525] p-3 rounded-lg border border-[#333] mt-2 mb-4">
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
              className="bg-transparent border-[#333] text-white hover:bg-[#252525]"
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
        <DialogContent className="bg-[#1a1a1a] text-white border-[#333] max-w-[400px]">
          <DialogTitle className="font-semibold text-xl">Xóa cổ phiếu</DialogTitle>
          <DialogDescription className="text-[#999]">
            Bạn có chắc chắn muốn xóa cổ phiếu <span className="text-white font-medium">{stockToDelete?.stockCode}</span> khỏi danh sách theo dõi?
          </DialogDescription>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsDeleteStockDialogOpen(false)}
              className="bg-transparent border-[#333] text-white hover:bg-[#252525]"
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
        <DialogContent className="bg-[#1a1a1a] text-white border-[#333] max-w-[500px] w-[95vw] max-h-[80vh]">
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
              className="w-full bg-[#252525] border border-[#333] rounded-lg pl-10 pr-3 py-2 text-white placeholder-[#666] focus:outline-none focus:border-[#09D1C7]"
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
                    className="flex items-center gap-3 p-3 bg-[#252525] hover:bg-[#2a2a2a] rounded-lg transition-colors"
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
                      className="w-4 h-4 rounded border-[#333] bg-[#1a1a1a] checked:bg-[#4A72FF] focus:ring-[#4A72FF] focus:ring-offset-0"
                    />
                    <label
                      htmlFor={`stock-${stock.id}`}
                      className="flex-1 flex items-center justify-between cursor-pointer"
                    >
                      <span className="text-white font-medium">{stock.ticketSymbol}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm px-2 py-0.5 rounded ${
                          stock.smg >= 80 ? 'bg-[#09D1C7]/10 text-[#09D1C7]' : 
                          stock.smg >= 50 ? 'bg-[#FF6B00]/10 text-[#FF6B00]' :
                          'bg-red-500/10 text-red-500'
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

          <div className="flex justify-between items-center gap-2 mt-4 pt-4 border-t border-[#333]">
            <div className="text-[#666] text-sm">
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
                className="bg-transparent border-[#333] text-white hover:bg-[#252525]"
              >
                Hủy
              </Button>
              <Button
                onClick={addSelectedStocksToWatchlist}
                className="bg-[#4A72FF] hover:bg-[#3a5ad9] text-white"
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
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WatchlistPage;