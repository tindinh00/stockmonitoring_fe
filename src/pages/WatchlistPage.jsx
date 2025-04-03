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
  const [activeTab, setActiveTab] = useState('price');
  const [isDeleteSectorDialogOpen, setIsDeleteSectorDialogOpen] = useState(false);
  const [sectorToDelete, setSectorToDelete] = useState(null);
  const [isDeleteStockDialogOpen, setIsDeleteStockDialogOpen] = useState(false);
  const [stockToDelete, setStockToDelete] = useState(null);
  const [lastTimestamp, setLastTimestamp] = useState(null);

  // Thêm state để theo dõi việc flash giá
  const [flashingCells, setFlashingCells] = useState({});
  const previousStockPrices = useRef({});

  // Thêm state để phân biệt initial loading và update loading
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Lấy watchlist từ localStorage khi component mount
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('watchlist');
    if (savedWatchlist) {
      setWatchlist(JSON.parse(savedWatchlist));
    }
  }, []);

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
        
        if (!userId) {
          console.log("No user ID found, skipping sectors fetch");
          setIsLoadingIndustries(false);
          return;
        }
        
        // Gọi API để lấy danh sách sectors của user
        const response = await stockService.getUserSectors(userId);
        console.log("User sectors response:", response);
        
        // Kiểm tra cấu trúc response và lấy data
        if (response?.value?.data) {
          const userSectors = response.value.data;
          setIndustries(userSectors.map(sector => ({
            id: sector.id,
            name: sector.name,
            stocks: sector.stocks || [],
            smg: sector.smg || 0,
            dayChange: sector.percentD || 0,
            weekChange: sector.percentW || 0,
            monthChange: sector.percentM || 0
          })));
        } else {
          console.log("No user sectors data found in response");
          setIndustries([]);
        }
      } catch (error) {
        console.error("Error fetching user sectors:", error);
        toast.error("Không thể tải danh sách ngành theo dõi");
      } finally {
        setIsLoadingIndustries(false);
      }
    };
    
    fetchUserSectors();
  }, []);

  // Theo dõi thay đổi giá và cập nhật màu sắc
  const updatePriceColors = (stockCode, currentPrice, previousPrice) => {
    if (!previousPrice || !currentPrice) return null;
    
    const current = parseFloat(currentPrice);
    const previous = parseFloat(previousPrice);
    
    if (current > previous) {
      return 'text-[#00FF00]'; // Tăng giá - màu xanh
    } else if (current < previous) {
      return 'text-[#FF4A4A]'; // Giảm giá - màu đỏ
    }
    return 'text-white'; // Giữ nguyên - màu trắng
  };

  // Tạo hiệu ứng flash khi giá thay đổi
  const createFlashEffect = (stockCode, currentPrice, previousPrice) => {
    if (!previousPrice || !currentPrice) return;
    
    const current = parseFloat(currentPrice);
    const previous = parseFloat(previousPrice);
    
    if (current !== previous) {
      // Tạo hiệu ứng flash
      setFlashingCells(prev => ({
        ...prev,
        [stockCode]: current > previous ? 'increase' : 'decrease'
      }));
      
      // Xóa hiệu ứng flash sau 1 giây
      setTimeout(() => {
        setFlashingCells(prev => {
          const newState = {...prev};
          delete newState[stockCode];
          return newState;
        });
      }, 1000);
    }
  };

  // Update watchlist data khi có dữ liệu mới từ SignalR
  const updateWatchlistData = (newStockData) => {
    // Chỉ cập nhật stocks đã có trong watchlist, không làm loading lại toàn bộ
    setWatchlist(prevWatchlist => {
      const updatedWatchlist = prevWatchlist.map(stock => {
        // Tìm stock cập nhật trong dữ liệu mới
        const updatedStock = newStockData.find(s => 
          s.stockCode && stock.code && s.stockCode.toLowerCase() === stock.code.toLowerCase()
        );
        
        if (!updatedStock) return stock;
        
        // Lưu giá cũ để so sánh
        const oldPrice = stock.matchPrice !== '--' ? stock.matchPrice : null;
        const newPrice = updatedStock.matchPrice?.toFixed(2) || stock.matchPrice;
        
        // Tạo hiệu ứng flash nếu giá thay đổi
        if (oldPrice && newPrice && parseFloat(oldPrice) !== parseFloat(newPrice)) {
          createFlashEffect(stock.code, newPrice, oldPrice);
          
          // Cập nhật màu sắc cho ô giá
          const newPriceColor = updatePriceColors(stock.code, newPrice, oldPrice);
          if (newPriceColor) {
            setPriceChangeColors(prev => ({
              ...prev,
              [stock.code]: newPriceColor
            }));
          }
          
          // Lưu lại giá mới để tham chiếu sau này
          previousStockPrices.current[stock.code] = newPrice;
        }
        
        // Trả về stock với dữ liệu cập nhật
        return {
          ...stock,
          matchPrice: newPrice,
          matchChange: updatedStock.plusMinus ? 
            `${updatedStock.plusMinus > 0 ? '+' : ''}${updatedStock.plusMinus.toFixed(2)}%` : 
            stock.matchChange,
          totalVolume: updatedStock.volumeAccumulation?.toLocaleString() || stock.totalVolume,
          matchVolume: updatedStock.matchedOrderVolume?.toLocaleString() || stock.matchVolume,
          high: updatedStock.highPrice?.toFixed(2) || stock.high,
          low: updatedStock.lowPrice?.toFixed(2) || stock.low,
          foreignBuy: updatedStock.foreignBuyVolume?.toLocaleString() || stock.foreignBuy,
          foreignSell: updatedStock.foreignSellVolume?.toLocaleString() || stock.foreignSell
        };
      });
      
      // Lưu vào localStorage
      localStorage.setItem('watchlist', JSON.stringify(updatedWatchlist));
      return updatedWatchlist;
    });
  };

  // Fetch stock data from API
  const fetchStockData = async () => {
    console.log("=== Fetching watchlist and stock data ===");
    setLoading(true);
    
    try {
      const userId = localStorage.getItem('userId');
      console.log("Current user ID:", userId);
    
      // Đầu tiên lấy danh sách watchlist từ API
      let watchlistData = null;
      try {
        if (userId) {
          console.log(`Fetching watchlist for user ID: ${userId}`);
          watchlistData = await stockService.getWatchlistByUser(userId);
          console.log("Watchlist API response:", watchlistData);
        } else {
          console.warn("No user ID found, creating sample watchlist");
        }
      } catch (watchlistError) {
        console.error("Error fetching watchlist:", watchlistError);
      }
      
      // Trích xuất mã chứng khoán từ watchlist data
      let stockCodes = [];
      if (watchlistData && watchlistData.length > 0) {
        stockCodes = watchlistData
          .map(stock => stock.tickerSymbol || stock.ticketSymbol)
          .filter(Boolean);
        console.log("Extracted stock codes from watchlist:", stockCodes);
      } else {
        console.warn("No watchlist data received or empty watchlist");
      }
      
      // Nếu watchlist trống, sử dụng danh sách mẫu
      if (stockCodes.length === 0) {
        stockCodes = ['VIC', 'VNM', 'HPG', 'VRE', 'MSN', 'BID'];
        console.log("Using sample stock codes:", stockCodes);
      }
      
      setWatchlistCodes(stockCodes);
      console.log("Set watchlistCodes state to:", stockCodes);
      
      // Lấy dữ liệu phiên giao dịch hiện tại với timestamp
      console.log("Fetching current stock session data");
      const timestampStr = lastTimestamp || moment().format('YYYYMMDDHHmmss');
      
      // Thiết lập exchange là HSX (mặc định)
      const exchange = "HSX";
      console.log(`Using exchange: ${exchange}, timestamp: ${timestampStr}`);
      
      // Gọi API với tham số exchange và timestamp
      const sessionData = await stockService.getStockInSession(exchange, timestampStr);
      console.log("Stock session API response:", sessionData);
      
      // Xử lý dữ liệu từ phản hồi API
      if (sessionData && sessionData.value && sessionData.value.data) {
        let allStocks = sessionData.value.data;
        console.log(`Received ${allStocks.length} stocks from API`);
        
        // Lọc những mã chứng khoán trong watchlist
        const watchlistStocks = allStocks.filter(stock => {
          if (!stock.stockCode) return false;
          return stockCodes.some(code => 
            code.toLowerCase() === stock.stockCode.toLowerCase()
          );
        });
        
        console.log(`Filtered ${watchlistStocks.length} stocks that are in watchlist`);
        setWatchlist(watchlistStocks);
        
        // Cập nhật trạng thái hiển thị
        setNoStocks(watchlistStocks.length === 0);
        if (watchlistStocks.length > 0) {
          console.log("Watchlist has stocks, setting noStocks to false");
        } else {
          console.warn("No stocks found in watchlist after filtering, setting noStocks to true");
        }
      } else {
        console.error("Invalid or empty session data format", sessionData);
        setNoStocks(true);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error in fetchStockData:", error);
      setLoading(false);
      setNoStocks(true);
    }
  };

  // Thêm useEffect để fetch sectors khi component mount
  useEffect(() => {
    const fetchSectors = async () => {
      try {
        setIsLoadingSectors(true);
        const response = await stockService.getWatchListSectors();
        console.log("Sectors response:", response);
        
        // Kiểm tra cấu trúc response và lấy data
        if (response?.value?.data) {
          const sectors = response.value.data;
          setAvailableIndustries(sectors.map(sector => ({
            id: sector.id,
            name: sector.name,
            code: sector.code || sector.id,
            smg: sector.smg || 0,
            dayChange: sector.percentD || 0,
            weekChange: sector.percentW || 0,
            monthChange: sector.percentM || 0
          })));
        } else {
          console.log("No sectors data found in response");
          setAvailableIndustries([]);
        }
      } catch (error) {
        console.error("Error fetching sectors:", error);
        toast.error("Không thể tải danh sách ngành");
        setAvailableIndustries([]);
      } finally {
        setIsLoadingSectors(false);
      }
    };

    fetchSectors();
  }, []);

  const removeFromWatchlist = (stock) => {
    setStockToDelete(stock);
    setIsDeleteStockDialogOpen(true);
  };

  const confirmDeleteStock = async () => {
    try {
      // Lấy userId từ getUserId
      const userId = getUserId();
      
      if (!userId) {
        toast.error("Bạn cần đăng nhập để sử dụng tính năng này");
        return;
      }
      
      // Gọi API để xóa khỏi watchlist
      await stockService.deleteStockFromWatchlist(userId, stockToDelete.code);
      
      // Cập nhật state
      setStocks(stocks.filter(stock => stock.code !== stockToDelete.code));
      setWatchlistCodes(watchlistCodes.filter(stockCode => stockCode !== stockToDelete.code));
      setWatchlist(watchlist.filter(stock => stock.code !== stockToDelete.code));
      
      toast.success(`Đã xóa ${stockToDelete.code} khỏi danh sách theo dõi`);
      setIsDeleteStockDialogOpen(false);
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      toast.error("Không thể xóa khỏi danh sách theo dõi. Vui lòng thử lại sau.");
    }
  };

  const handleStockClick = (stock) => {
    setSelectedStock(stock);
    setIsDialogOpen(true);

    // Generate sample data for the chart
    const data = Array.from({ length: 30 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (30 - index));
      const basePrice = parseFloat(stock.ref);
      const randomChange = (Math.random() - 0.5) * 2;
      
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
  };

  const handleIndustryClick = (industry) => {
    setSelectedIndustry(industry);
    setIsIndustryDetailOpen(true);
    
    // Lấy danh sách cổ phiếu trong ngành từ API
    const fetchIndustryStocks = async () => {
      try {
        // Kiểm tra nếu có danh sách cổ phiếu trong industry
        if (industry.stocks && industry.stocks.length > 0) {
          // Gọi API để lấy dữ liệu chi tiết của các mã CK
          const stockResponse = await stockService.getStockInSession();
          
          if (stockResponse && stockResponse.value && stockResponse.value.data) {
            // Lọc ra chỉ các mã CK có trong ngành
            const industryStocksData = stockResponse.value.data
              .filter(stock => industry.stocks.includes(stock.stockCode))
              .map(stock => ({
                code: stock.stockCode,
                chart: [stock.priorClosePrice, stock.lowPrice, stock.matchPrice].filter(Boolean).map(Number),
                smg: Math.floor(Math.random() * 30) + 70, // Giả lập SMG score
                price: stock.matchPrice || 0,
                dayChange: stock.plusMinus || 0,
                weekChange: ((Math.random() * 4) - 2).toFixed(1),
                monthChange: ((Math.random() * 10) - 5).toFixed(1)
              }));
            
            setIndustryStocks(industryStocksData);
          } else {
            console.log("No stock data available for industry");
            // Hiển thị dữ liệu giả nếu không có dữ liệu thực
            const sampleStocks = industry.stocks.map(code => ({
              code: code,
              chart: [
                Math.floor(Math.random() * 50000) + 10000, 
                Math.floor(Math.random() * 50000) + 10000, 
                Math.floor(Math.random() * 50000) + 10000
              ],
              smg: Math.floor(Math.random() * 30) + 70,
              price: Math.floor(Math.random() * 50000) + 10000,
              dayChange: ((Math.random() * 4) - 2).toFixed(1),
              weekChange: ((Math.random() * 4) - 2).toFixed(1),
              monthChange: ((Math.random() * 10) - 5).toFixed(1)
            }));
            setIndustryStocks(sampleStocks);
          }
        } else {
          // Không có danh sách cổ phiếu, hiển thị trạng thái rỗng
          setIndustryStocks([]);
        }
      } catch (error) {
        console.error("Error fetching industry stocks:", error);
        toast.error("Không thể tải danh sách cổ phiếu trong ngành");
        setIndustryStocks([]);
      }
    };
    
    fetchIndustryStocks();
  };

  const renderMiniChart = (data) => {
    // Giả lập mini chart bằng div
    return (
      <div className="w-16 h-6 flex items-end space-x-[2px]">
        {data.map((value, index) => {
          const height = (value / Math.max(...data)) * 100;
          return (
            <div
              key={index}
              className="flex-1 bg-[#09D1C7]/20"
              style={{ height: `${height}%` }}
            />
          );
        })}
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
      const userId = getUserId();
      
      if (!userId) {
        toast.error("Bạn cần đăng nhập để sử dụng tính năng này");
        return;
      }
      
      await stockService.deleteSectorFromWatchlist(userId, sectorToDelete.id);
      
      // Cập nhật state UI
      setIndustries(industries.filter(industry => industry.id !== sectorToDelete.id));
      
      toast.success(`Đã xóa ngành "${sectorToDelete.name}" khỏi danh sách theo dõi`);
      setIsDeleteSectorDialogOpen(false);
    } catch (error) {
      console.error("Error deleting sector:", error);
      toast.error("Không thể xóa ngành khỏi danh sách theo dõi. Vui lòng thử lại sau.");
    }
  };

  // Thêm CSS cho hiệu ứng flash
  const getFlashStyle = (stockCode) => {
    const flashType = flashingCells[stockCode];
    if (!flashType) return {};
    
    return {
      animation: `${flashType === 'increase' ? 'flashGreen' : 'flashRed'} 1s ease-out`,
      backgroundColor: flashType === 'increase' ? 'rgba(0, 255, 0, 0.15)' : 'rgba(255, 0, 0, 0.15)'
    };
  };

  // Thêm phương thức để cập nhật hiển thị với dữ liệu mẫu khi API thất bại
  const updateDisplayWithSampleData = (market = "HSX") => {
    console.log(`Creating sample ${market} data for display...`);
    
    // Khởi tạo một danh sách mẫu dựa trên watchlistCodes hiện tại
    const sampleData = watchlistCodes.map(code => {
      const isUp = Math.random() > 0.5;
      const basePrice = 10 + Math.random() * 90;
      const changePercent = Math.random() * 5;
      const changeValue = basePrice * (changePercent / 100);
      
      return {
        stockCode: code,
        tickerSymbol: code,
        exchange: market,
        currentPrice: basePrice.toFixed(2),
        changePercent: isUp ? changePercent.toFixed(2) : (-changePercent).toFixed(2),
        changeValue: isUp ? changeValue.toFixed(2) : (-changeValue).toFixed(2),
        totalVolume: Math.floor(Math.random() * 1000000),
        referencePrice: (basePrice - changeValue).toFixed(2),
        openPrice: (basePrice - (changeValue / 2)).toFixed(2),
        highestPrice: isUp ? (basePrice + (changeValue / 2)).toFixed(2) : basePrice.toFixed(2),
        lowestPrice: isUp ? basePrice.toFixed(2) : (basePrice - changeValue - (changeValue / 2)).toFixed(2),
        lastUpdated: new Date().toISOString()
      };
    });
    
    if (sampleData.length > 0) {
      console.log(`Created ${sampleData.length} sample stock items for ${market}`);
      console.log("Sample data:", sampleData[0]);
      
      // Cập nhật dữ liệu hiển thị bằng mẫu đã tạo
      updateWatchlistData(sampleData);
    } else {
      console.warn("No watchlist codes available to create sample data");
    }
  };

  // Setup SignalR connection for real-time updates
  const setupSignalR = async () => {
    try {
      console.log("=== Setting up SignalR for watchlist with detailed logging ===");
      
      // Start the SignalR connection
      await signalRService.startStockConnection();
      
      // Check connection status
      const connectionStatus = signalRService.isConnected();
      console.log("WatchlistPage - SignalR Connection Status:", connectionStatus);
      
      if (connectionStatus.stockHub) {
        console.log("WatchlistPage - SignalR connected successfully, setting up event listeners");
        
        // Đăng ký lắng nghe sự kiện ReceiveHSXStockUpdate - logic từ Android
        console.log("WatchlistPage - Registering for HSX stock updates via ReceiveHSXStockUpdate event");
        signalRService.onStock("ReceiveHSXStockUpdate", (messageObj) => {
          // Sử dụng IIFE để không trả về Promise
          (async () => {
            try {
              console.log("WatchlistPage - RECEIVED HSX STOCK UPDATE:", messageObj);
              
              // Trích xuất thông tin từ message object
              const message = messageObj.Message;
              const timestamp = messageObj.Timestamp;
              
              console.log("WatchlistPage - HSX update message:", message);
              console.log("WatchlistPage - Using timestamp:", timestamp);
              
              // Lưu timestamp mới vào state
              setLastTimestamp(timestamp);
              
              // Tiến hành gọi API để lấy dữ liệu mới với tham số chính xác
              console.log("WatchlistPage - Fetching HSX stock data with timestamp:", timestamp);
              try {
                const response = await stockService.getStockInSession("hsx", timestamp);
                if (response && response.value && response.value.data) {
                  console.log("WatchlistPage - Received new HSX stock data:", response.value.data.length, "stocks");
                  // Cập nhật dữ liệu watchlist với đúng exchange
                  updateWatchlistData(response.value.data);
                } else {
                  console.warn("WatchlistPage - Invalid response format from HSX API, using sample data");
                  updateDisplayWithSampleData("HSX");
                }
              } catch (apiError) {
                console.error("WatchlistPage - Error fetching HSX stock data:", apiError);
                updateDisplayWithSampleData("HSX");
              }
            } catch (error) {
              console.error("WatchlistPage - Error processing HSX update:", error);
            }
          })();
          
          // KHÔNG trả về bất kỳ giá trị nào để tránh lỗi "asynchronous response"
        });
        
        // Đăng ký lắng nghe sự kiện ReceiveHNXStockUpdate - logic từ Android
        console.log("WatchlistPage - Registering for HNX stock updates via ReceiveHNXStockUpdate event");
        signalRService.onStock("ReceiveHNXStockUpdate", (messageObj) => {
          // Sử dụng IIFE để không trả về Promise
          (async () => {
            try {
              console.log("WatchlistPage - RECEIVED HNX STOCK UPDATE:", messageObj);
              
              // Trích xuất thông tin từ message object
              const message = messageObj.Message;
              const timestamp = messageObj.Timestamp;
              
              console.log("WatchlistPage - HNX update message:", message);
              console.log("WatchlistPage - Using timestamp:", timestamp);
              
              // Lưu timestamp mới vào state
              setLastTimestamp(timestamp);
              
              // Tiến hành gọi API để lấy dữ liệu mới với tham số chính xác
              console.log("WatchlistPage - Fetching HNX stock data with timestamp:", timestamp);
              try {
                const response = await stockService.getStockInSession("hnx", timestamp);
                if (response && response.value && response.value.data) {
                  console.log("WatchlistPage - Received new HNX stock data:", response.value.data.length, "stocks");
                  // Cập nhật dữ liệu watchlist với đúng exchange
                  updateWatchlistData(response.value.data);
                } else {
                  console.warn("WatchlistPage - Invalid response format from HNX API, using sample data");
                  updateDisplayWithSampleData("HNX");
                }
              } catch (apiError) {
                console.error("WatchlistPage - Error fetching HNX stock data:", apiError);
                updateDisplayWithSampleData("HNX");
              }
            } catch (error) {
              console.error("WatchlistPage - Error processing HNX update:", error);
            }
          })();
          
          // KHÔNG trả về bất kỳ giá trị nào để tránh lỗi "asynchronous response"
        });
        
        console.log("WatchlistPage - SignalR setup complete, waiting for updates");
      } else {
        console.warn("WatchlistPage - SignalR not connected, using polling fallback");
        
        // Set up polling as fallback
        const pollingInterval = setInterval(() => {
          console.log("WatchlistPage - Polling for stock updates (fallback)");
          fetchStockData();
        }, 30000); // Poll every 30 seconds
        
        // Cleanup when component unmounts
        return () => {
          console.log("WatchlistPage - Cleaning up polling");
          clearInterval(pollingInterval);
        };
      }
    } catch (error) {
      console.error("WatchlistPage - Error setting up SignalR:", error);
      
      // Set up polling as fallback
      const pollingInterval = setInterval(() => {
        console.log("WatchlistPage - Polling for stock updates (error fallback)");
        fetchStockData();
      }, 30000); // Poll every 30 seconds
      
      // Cleanup when component unmounts
      return () => {
        console.log("WatchlistPage - Cleaning up polling");
        clearInterval(pollingInterval);
      };
    }
  };

  // Hook để fetch dữ liệu ban đầu và thiết lập SignalR
  useEffect(() => {
    console.log("WatchlistPage - Component mounted");
    fetchStockData();
    
    // Thiết lập SignalR và kết nối
    const signalRCleanup = setupSignalR();
    
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

  return (
    <div className="bg-[#0a0a14] min-h-screen -mx-4 md:-mx-8">
      {/* Add CSS for flash animations */}
      <style jsx global>{`
        @keyframes flashGreen {
          0%, 100% { background-color: transparent; }
          50% { background-color: rgba(0, 255, 0, 0.15); }
        }
        
        @keyframes flashRed {
          0%, 100% { background-color: transparent; }
          50% { background-color: rgba(255, 0, 0, 0.15); }
        }
        
        .price-cell-transition {
          transition: color 0.3s ease;
        }
      `}</style>
      
      {/* Page Header */}
      <div className="px-4 py-6 border-b border-[#1a1a1a]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Danh mục theo dõi</h1>
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
              onClick={() => setIsAddIndustryDialogOpen(true)}
              className="bg-[#09D1C7] hover:bg-[#0a8f88] text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm ngành</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex gap-6">
          {/* Left section - Stock Table (70%) */}
          <div className="w-[70%]">
            {/* Stock Table */}
            <div className="bg-[#1a1a1a] rounded-xl border border-[#333] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <colgroup>
                    <col className="w-[60px]" />{/* Mã CK */}
                    <col className="w-[60px]" />{/* Trần */}
                    <col className="w-[60px]" />{/* Sàn */}
                    <col className="w-[60px]" />{/* TC */}
                    <col className="w-[60px]" />{/* Giá 3 */}
                    <col className="w-[80px]" />{/* KL 3 */}
                    <col className="w-[60px]" />{/* Giá 2 */}
                    <col className="w-[80px]" />{/* KL 2 */}
                    <col className="w-[60px]" />{/* Giá 1 */}
                    <col className="w-[80px]" />{/* KL 1 */}
                    <col className="w-[60px]" />{/* Giá */}
                    <col className="w-[80px]" />{/* KL */}
                    <col className="w-[70px]" />{/* +/- */}
                    <col className="w-[60px]" />{/* Giá 1 */}
                    <col className="w-[80px]" />{/* KL 1 */}
                    <col className="w-[60px]" />{/* Giá 2 */}
                    <col className="w-[80px]" />{/* KL 2 */}
                    <col className="w-[60px]" />{/* Giá 3 */}
                    <col className="w-[80px]" />{/* KL 3 */}
                    <col className="w-[60px]" />{/* Cao */}
                    <col className="w-[60px]" />{/* Thấp */}
                    <col className="w-[60px]" />{/* TB */}
                    <col className="w-[100px]" />{/* Tổng KL */}
                    <col className="w-[80px]" />{/* Mua */}
                    <col className="w-[80px]" />{/* Bán */}
                    <col className="w-[80px]" />{/* Thao tác */}
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
                    {watchlist.map((stock) => (
                      <tr key={stock.code} className="hover:bg-[#1a1a1a]">
                        <td className={`border-r border-[#333] text-center font-medium transition-colors duration-300 cursor-pointer py-2 ${
                          priceChangeColors[stock.code] || 'text-white'
                        }`} onClick={() => handleStockClick(stock)}>
                          {stock.code}
                        </td>
                        <td className="text-[#FF424E] border-r border-[#333] text-center whitespace-nowrap py-2">{stock.ceiling}</td>
                        <td className="text-[#00C9FF] border-r border-[#333] text-center whitespace-nowrap py-2">{stock.floor}</td>
                        <td className="text-[#F4BE37] border-r border-[#333] text-center whitespace-nowrap py-2">{stock.ref}</td>
                        <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.buyPrice3 || '--'}</td>
                        <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.buyVolume3 || '--'}</td>
                        <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.buyPrice2 || '--'}</td>
                        <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.buyVolume2 || '--'}</td>
                        <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.buyPrice1 || '--'}</td>
                        <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.buyVolume1 || '--'}</td>
                        <td 
                          className={`border-r border-[#333] text-center whitespace-nowrap price-cell-transition py-2 ${
                          priceChangeColors[stock.code] || 'text-white'
                          }`}
                          style={getFlashStyle(stock.code)}
                        >
                          {stock.matchPrice}
                        </td>
                        <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.matchVolume}</td>
                        <td className={`${stock.matchChange?.includes('+') ? 'text-[#00FF00]' : 'text-[#FF4A4A]'} border-r border-[#333] text-center whitespace-nowrap py-2`}>
                          {stock.matchChange}
                        </td>
                        <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.sellPrice1 || '--'}</td>
                        <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.sellVolume1 || '--'}</td>
                        <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.sellPrice2 || '--'}</td>
                        <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.sellVolume2 || '--'}</td>
                        <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.sellPrice3 || '--'}</td>
                        <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.sellVolume3 || '--'}</td>
                        <td className="text-[#00FF00] border-r border-[#333] text-center whitespace-nowrap py-2">{stock.high}</td>
                        <td className="text-[#FF4A4A] border-r border-[#333] text-center whitespace-nowrap py-2">{stock.low}</td>
                        <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">--</td>
                        <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.totalVolume}</td>
                        <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.foreignBuy}</td>
                        <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.foreignSell}</td>
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
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex justify-center items-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-2 border-[#09D1C7] border-t-transparent animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-[#0a8f88] border-t-transparent animate-spin"></div>
                      </div>
                    </div>
                    <span className="text-[#666] text-sm">Đang tải dữ liệu...</span>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && watchlist.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-[#252525] rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-[#666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                  <h3 className="text-white font-medium mb-2">Chưa có cổ phiếu</h3>
                  <p className="text-[#666] text-sm">Thêm cổ phiếu vào danh sách để theo dõi</p>
                </div>
              )}
            </div>
          </div>

          {/* Right section - Industries (30%) */}
          <div className="w-[30%] space-y-6">
            {/* Industries List */}
            <div className="bg-[#1a1a1a] rounded-xl border border-[#333] overflow-hidden">
              <div className="p-4 border-b border-[#333]">
                <h2 className="text-xl font-semibold text-white">Ngành theo dõi</h2>
              </div>

              <div className="p-4">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[#999] text-sm font-medium">
                  <div className="col-span-5">Tên ngành</div>
                  <div className="col-span-2 text-center">SMG</div>
                  <div className="col-span-5 grid grid-cols-3 gap-1 text-center">
                    <span>%D</span>
                    <span>%W</span>
                    <span>%M</span>
                  </div>
                </div>

                {/* Industry Items */}
                {isLoadingIndustries ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full border-2 border-[#09D1C7] border-t-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full border-2 border-[#0a8f88] border-t-transparent animate-spin"></div>
                        </div>
                      </div>
                      <span className="text-[#666] text-sm">Đang tải dữ liệu...</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 mt-2">
                    {industries.map((industry) => (
                      <div
                        key={industry.id}
                        className="bg-[#252525] hover:bg-[#2a2a2a] rounded-lg transition-all duration-200"
                      >
                        <div className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center">
                          <div className="col-span-5 flex items-center gap-2">
                            <button
                              onClick={() => handleIndustryClick(industry)}
                              className={`p-1.5 rounded-lg transition-colors ${
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
                          <div className="col-span-4 grid grid-cols-3 gap-1 text-center text-sm">
                            <span className={`rounded px-1.5 py-0.5 ${
                              industry.dayChange > 0 
                                ? 'bg-[#00FF00]/10 text-[#00FF00]' 
                                : 'bg-[#FF4A4A]/10 text-[#FF4A4A]'
                            }`}>
                              {industry.dayChange > 0 ? '+' : ''}{industry.dayChange}%
                            </span>
                            <span className={`rounded px-1.5 py-0.5 ${
                              industry.weekChange > 0 
                                ? 'bg-[#00FF00]/10 text-[#00FF00]' 
                                : 'bg-[#FF4A4A]/10 text-[#FF4A4A]'
                            }`}>
                              {industry.weekChange > 0 ? '+' : ''}{industry.weekChange}%
                            </span>
                            <span className={`rounded px-1.5 py-0.5 ${
                              industry.monthChange > 0 
                                ? 'bg-[#00FF00]/10 text-[#00FF00]' 
                                : 'bg-[#FF4A4A]/10 text-[#FF4A4A]'
                            }`}>
                              {industry.monthChange > 0 ? '+' : ''}{industry.monthChange}%
                            </span>
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <button
                              onClick={(e) => handleDeleteSector(industry, e)}
                              className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
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

                {/* Empty State */}
                {!isLoadingIndustries && industries.length === 0 && (
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
                <p className="text-2xl font-bold text-white">{watchlist.length}</p>
              </div>
              <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-4">
                <h3 className="text-[#666] text-sm mb-2">Số ngành</h3>
                <p className="text-2xl font-bold text-white">{industries.length}</p>
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
            <div className="grid grid-cols-7 gap-2 px-3 py-2 text-[#999] text-sm font-medium border-b border-[#333]">
              <div className="col-span-1">Mã</div>
              <div className="col-span-1">Chart</div>
              <div className="col-span-1 text-center">SMG</div>
              <div className="col-span-1 text-right">Giá</div>
              <div className="col-span-3 grid grid-cols-3 gap-1 text-center">
                <span>%D</span>
                <span>%W</span>
                <span>%M</span>
              </div>
            </div>

            {/* Stock Items */}
            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2">
              {industryStocks.map((stock) => (
                <div
                  key={stock.code}
                  className="grid grid-cols-7 gap-2 px-3 py-2.5 items-center hover:bg-[#252525] rounded-lg transition-colors"
                >
                  <div className="col-span-1 flex items-center gap-1.5">
                    <ChevronRight className="h-4 w-4 text-[#4A72FF]" />
                    <span className="text-white font-medium">{stock.code}</span>
                  </div>
                  <div className="col-span-1">
                    {renderMiniChart(stock.chart)}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <span className={`rounded-full w-7 h-7 flex items-center justify-center font-medium text-sm
                      ${stock.smg >= 80 ? 'bg-[#09D1C7]/10 text-[#09D1C7]' : 
                        stock.smg >= 50 ? 'bg-[#FF6B00]/10 text-[#FF6B00]' :
                        'bg-red-500/10 text-red-500'}`}>
                      {stock.smg}
                    </span>
                  </div>
                  <div className="col-span-1 text-right font-medium text-white">
                    {stock.price.toLocaleString()}
                  </div>
                  <div className="col-span-3 grid grid-cols-3 gap-1 text-center text-sm">
                    <span className={`rounded px-2 py-0.5 ${
                      stock.dayChange > 0 
                        ? 'bg-[#00FF00]/10 text-[#00FF00]' 
                        : 'bg-[#FF4A4A]/10 text-[#FF4A4A]'
                    }`}>
                      {stock.dayChange > 0 ? '+' : ''}{stock.dayChange}%
                    </span>
                    <span className={`rounded px-2 py-0.5 ${
                      stock.weekChange > 0 
                        ? 'bg-[#00FF00]/10 text-[#00FF00]' 
                        : 'bg-[#FF4A4A]/10 text-[#FF4A4A]'
                    }`}>
                      {stock.weekChange > 0 ? '+' : ''}{stock.weekChange}%
                    </span>
                    <span className={`rounded px-2 py-0.5 ${
                      stock.monthChange > 0 
                        ? 'bg-[#00FF00]/10 text-[#00FF00]' 
                        : 'bg-[#FF4A4A]/10 text-[#FF4A4A]'
                    }`}>
                      {stock.monthChange > 0 ? '+' : ''}{stock.monthChange}%
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
            {isLoadingSectors ? (
              <div className="flex justify-center items-center py-4">
                <div className="w-6 h-6 border-2 border-[#09D1C7] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : availableIndustries.length > 0 ? (
              availableIndustries
                .filter(industry => 
                  (industry.name.toLowerCase().includes(newIndustryName.toLowerCase()) ||
                  industry.code.toLowerCase().includes(newIndustryName.toLowerCase())) &&
                  // Lọc ra các ngành chưa được theo dõi
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
            {!isLoadingSectors && availableIndustries.length > 0 && 
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
                onClick={() => {
                  if (selectedIndustryIds.length > 0) {
                    // Lấy userId từ getUserId
                    const userId = getUserId();
                    
                    if (!userId) {
                      toast.error("Bạn cần đăng nhập để sử dụng tính năng này");
                      return;
                    }
                    
                    // Gọi API để thêm ngành
                    setIsAddIndustryDialogOpen(false); // Đóng dialog trước khi gọi API
                    toast.promise(
                      stockService.addSectorsToWatchlist(userId, selectedIndustryIds),
                      {
                        loading: 'Đang thêm ngành...',
                        success: (response) => {
                          // Thêm ngành đã chọn vào state
                          const newIndustries = availableIndustries
                            .filter(industry => selectedIndustryIds.includes(industry.id))
                            .map(industry => ({
                              id: industry.id,
                              name: industry.name,
                              stocks: [],
                              smg: industry.smg || 0,
                              dayChange: industry.dayChange || 0,
                              weekChange: industry.weekChange || 0,
                              monthChange: industry.monthChange || 0
                            }));
                          
                          setIndustries(prevIndustries => {
                            const existingIds = prevIndustries.map(ind => ind.id);
                            const uniqueNewIndustries = newIndustries.filter(
                              ind => !existingIds.includes(ind.id)
                            );
                            return [...prevIndustries, ...uniqueNewIndustries];
                          });
                          
                          setSelectedIndustryIds([]);
                          setNewIndustryName('');
                          
                          return `Đã thêm ${newIndustries.length} ngành`;
                        },
                        error: (err) => {
                          console.error("Error adding sectors:", err);
                          return "Không thể thêm ngành. Vui lòng thử lại sau.";
                        }
                      }
                    );
                  }
                }}
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
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteSector}
              className="bg-red-500 hover:bg-red-600"
            >
              Xóa ngành
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Stock Confirmation Dialog */}
      <Dialog open={isDeleteStockDialogOpen} onOpenChange={setIsDeleteStockDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] text-white border-[#333] max-w-[400px]">
          <DialogTitle className="font-semibold text-xl">Xóa cổ phiếu</DialogTitle>
          <DialogDescription className="text-[#999]">
            Bạn có chắc chắn muốn xóa cổ phiếu <span className="text-white font-medium">{stockToDelete?.code}</span> khỏi danh sách theo dõi?
          </DialogDescription>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsDeleteStockDialogOpen(false)}
              className="bg-transparent border-[#333] text-white hover:bg-[#252525]"
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteStock}
              className="bg-red-500 hover:bg-red-600"
            >
              Xóa cổ phiếu
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WatchlistPage; 