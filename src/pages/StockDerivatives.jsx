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
import { getUserId } from '@/api/Api'; // Import hàm getUserId

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

  // Fetch real-time stock data
  const fetchStockData = async () => {
    try {
      // Chỉ hiển thị loading lần đầu, khi chưa có dữ liệu
      if (realTimeStockData.length === 0) {
        setIsLoading(true);
      }
      
      console.log("Fetching stock data...");
      const response = await axios.get(`https://stockmonitoring-be-stock-service.onrender.com/api/stock/get-stock-in-session`, {
        params: {
          exchange: 'hsx',
          timestamp: "20250316122322" // Timestamp cố định theo yêu cầu
        }
      });
      
      console.log("API response:", response.data);
      
      if (response.data.value && response.data.value.data && response.data.value.data.length > 0) {
        console.log("Number of stocks received:", response.data.value.data.length);
        
        const formattedData = response.data.value.data.map(stock => ({
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
        
        console.log("Formatted data first item:", formattedData.length > 0 ? formattedData[0] : "No data");
        
        // Đối với mỗi cổ phiếu mới, so sánh với dữ liệu cũ để cập nhật màu sắc
        const newPriceHistory = { ...priceHistory };
        const newPriceChangeColors = { ...priceChangeColors };
        
        formattedData.forEach(newStock => {
          // Tìm cổ phiếu trong dữ liệu hiện tại để lấy giá trước đó
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
            // Nếu là cổ phiếu mới, không thay đổi màu
            newPriceHistory[newStock.code] = currentPrice;
            newPriceChangeColors[newStock.code] = 'text-white';
          }
        });
        
        // Cập nhật state
        setPriceHistory(newPriceHistory);
        setPriceChangeColors(newPriceChangeColors);
        setRealTimeStockData(formattedData);
        
        console.log("Updated realTimeStockData, new length:", formattedData.length);
      } else {
        console.error("Invalid data format from server or empty data", response.data);
        
        // Tạo dữ liệu mẫu cho trường hợp API không trả về dữ liệu
        if (realTimeStockData.length === 0) {
          console.log("Creating sample data for testing");
          const sampleStocks = [
            {
              code: "VNM",
              ceiling: "85.00",
              floor: "78.00",
              ref: "81.50",
              buyPrice3: "80.80",
              buyVolume3: "1,200",
              buyPrice2: "80.90",
              buyVolume2: "800",
              buyPrice1: "81.00",
              buyVolume1: "500",
              matchPrice: "81.20",
              matchVolume: "2,300",
              matchChange: "+0.35%",
              sellPrice1: "81.30",
              sellVolume1: "600",
              sellPrice2: "81.40",
              sellVolume2: "900",
              sellPrice3: "81.50",
              sellVolume3: "1,100",
              totalVolume: "12,500",
              high: "81.80",
              low: "80.90",
              foreignBuy: "2,000",
              foreignSell: "1,800"
            },
            {
              code: "FPT",
              ceiling: "115.00",
              floor: "105.00",
              ref: "110.00",
              buyPrice3: "109.50",
              buyVolume3: "800",
              buyPrice2: "109.60",
              buyVolume2: "600",
              buyPrice1: "109.70",
              buyVolume1: "400",
              matchPrice: "110.20",
              matchVolume: "1,800",
              matchChange: "+0.18%",
              sellPrice1: "110.30",
              sellVolume1: "500",
              sellPrice2: "110.40",
              sellVolume2: "700",
              sellPrice3: "110.50",
              sellVolume3: "900",
              totalVolume: "10,200",
              high: "110.80",
              low: "109.50",
              foreignBuy: "1,500",
              foreignSell: "1,200"
            },
            {
              code: "VIC",
              ceiling: "65.00",
              floor: "59.00",
              ref: "62.00",
              buyPrice3: "61.50",
              buyVolume3: "1,100",
              buyPrice2: "61.60",
              buyVolume2: "900",
              buyPrice1: "61.70",
              buyVolume1: "700",
              matchPrice: "61.80",
              matchVolume: "2,100",
              matchChange: "-0.32%",
              sellPrice1: "61.90",
              sellVolume1: "800",
              sellPrice2: "62.00",
              sellVolume2: "1,000",
              sellPrice3: "62.10",
              sellVolume3: "1,200",
              totalVolume: "11,500",
              high: "62.20",
              low: "61.40",
              foreignBuy: "1,800",
              foreignSell: "2,000"
            }
          ];
          
          setRealTimeStockData(sampleStocks);
          const newPriceHistory = {};
          const newPriceChangeColors = {};
          
          sampleStocks.forEach(stock => {
            newPriceHistory[stock.code] = parseFloat(stock.matchPrice);
            newPriceChangeColors[stock.code] = stock.matchChange.includes('+') ? 'text-[#00FF00]' : 'text-[#FF4A4A]';
          });
          
          setPriceHistory(newPriceHistory);
          setPriceChangeColors(newPriceChangeColors);
          
          console.log("Sample data created with", sampleStocks.length, "items");
        } else {
          toast.error("Không nhận được dữ liệu hợp lệ từ máy chủ");
        }
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
      
      // Tạo dữ liệu mẫu khi có lỗi và chưa có dữ liệu
      if (realTimeStockData.length === 0) {
        console.log("Creating sample data for testing due to API error");
        const sampleStocks = [
          {
            code: "MSN",
            ceiling: "95.00",
            floor: "85.00",
            ref: "90.00",
            buyPrice3: "89.50",
            buyVolume3: "1,300",
            buyPrice2: "89.60",
            buyVolume2: "1,100",
            buyPrice1: "89.70",
            buyVolume1: "900",
            matchPrice: "90.20",
            matchVolume: "2,500",
            matchChange: "+0.22%",
            sellPrice1: "90.30",
            sellVolume1: "1,000",
            sellPrice2: "90.40",
            sellVolume2: "1,200",
            sellPrice3: "90.50",
            sellVolume3: "1,400",
            totalVolume: "14,000",
            high: "90.80",
            low: "89.40",
            foreignBuy: "2,200",
            foreignSell: "2,000"
          },
          {
            code: "HPG",
            ceiling: "42.00",
            floor: "38.00",
            ref: "40.00",
            buyPrice3: "39.80",
            buyVolume3: "1,500",
            buyPrice2: "39.90",
            buyVolume2: "1,300",
            buyPrice1: "40.00",
            buyVolume1: "1,100",
            matchPrice: "39.70",
            matchVolume: "3,000",
            matchChange: "-0.75%",
            sellPrice1: "39.60",
            sellVolume1: "1,200",
            sellPrice2: "39.50",
            sellVolume2: "1,400",
            sellPrice3: "39.40",
            sellVolume3: "1,600",
            totalVolume: "16,000",
            high: "40.10",
            low: "39.30",
            foreignBuy: "2,500",
            foreignSell: "2,800"
          }
        ];
        
        setRealTimeStockData(sampleStocks);
        const newPriceHistory = {};
        const newPriceChangeColors = {};
        
        sampleStocks.forEach(stock => {
          newPriceHistory[stock.code] = parseFloat(stock.matchPrice);
          newPriceChangeColors[stock.code] = stock.matchChange.includes('+') ? 'text-[#00FF00]' : 'text-[#FF4A4A]';
        });
        
        setPriceHistory(newPriceHistory);
        setPriceChangeColors(newPriceChangeColors);
        
        console.log("Sample data created with", sampleStocks.length, "items due to error");
      } else {
        toast.error("Lỗi khi tải dữ liệu chứng khoán");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Thay đổi trong useEffect để sử dụng signalR thay vì polling
  useEffect(() => {
    fetchStockData(); // Vẫn gọi một lần cho dữ liệu ban đầu
    
    // Conexão SignalR com fallback para polling
    const connectSignalR = async () => {
      let usePolling = false;
      let cleanupFunction = () => {}; // Khởi tạo hàm cleanup mặc định
      
      try {
        // Verifica o status atual das conexões SignalR
        const connectionStatus = signalRService.isConnected();
        
        // Se a conexão com o hub de ações falhou, usa polling
        if (connectionStatus.connectionFailed || !connectionStatus.stockHub) {
          usePolling = true;
          console.log("Using polling fallback for stock data");
        } else {
          // Tenta configurar o listener SignalR
          try {
            signalRService.onStock("ReceiveHSXStockUpdate", (data) => {
              console.log("Received stock data update via SignalR:", data);
              
              // Busca novos dados quando receber notificação
              if (data && data.hsxAnalysisKey) {
                fetchStockData();
              }
            });
            console.log("SignalR listener setup successful");
            
            // Lưu hàm cleanup cho SignalR
            cleanupFunction = () => {
              try {
                signalRService.offStock("ReceiveHSXStockUpdate");
                console.log("Cleaned up SignalR stock listener");
              } catch (error) {
                console.warn("Error unsubscribing from SignalR:", error);
              }
            };
          } catch (error) {
            console.error("Error setting up SignalR listener:", error);
            usePolling = true;
          }
        }
      } catch (error) {
        console.error("Error connecting to SignalR:", error);
        usePolling = true;
      }
      
      // Configura polling como fallback
      if (usePolling) {
        console.log("Setting up polling fallback for stock data");
        // Kéo dài khoảng thời gian polling để tránh tải quá nhiều
        const pollingInterval = setInterval(fetchStockData, 30000); // Tăng thời gian giữa các lần polling lên 30 giây
        
        // Cập nhật hàm cleanup cho polling
        cleanupFunction = () => {
          console.log("Cleaning up polling interval for stock data");
          clearInterval(pollingInterval);
        };
      }
      
      // Luôn trả về một hàm cleanup hợp lệ
      return cleanupFunction;
    };
    
    // Tenta conectar e configura o mecanismo apropriado
    let cleanup;
    connectSignalR().then(cleanupFn => {
      cleanup = cleanupFn;
    }).catch(error => {
      console.error("Error in connectSignalR:", error);
      cleanup = () => {};
    });
    
    return () => {
      // Executa a função de limpeza retornada pela função connectSignalR
      if (typeof cleanup === 'function') {
        cleanup();
      } else {
        console.warn("Cleanup is not available or not a function");
      }
    };
  }, []);

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

  // Thêm hàm xử lý thêm vào watchlist
  const handleAddToWatchlist = async (stock) => {
    try {
      // Lấy thông tin userId từ hàm getUserId 
      const userId = getUserId();
      console.log("Attempting to add to watchlist. User ID:", userId);
      console.log("All cookies:", document.cookie);
      console.log("Backup user ID in localStorage:", localStorage.getItem('user_id_backup'));
      
      if (!userId) {
        toast.error("Vui lòng đăng nhập để sử dụng tính năng này");
        return;
      }
      
      // Kiểm tra xem stock đã có trong watchlist chưa
      const isAlreadyInWatchlist = watchlist.some(item => item.code === stock.code);
      
      if (isAlreadyInWatchlist) {
        // Gọi API để xóa khỏi watchlist (API chưa hỗ trợ DELETE method nên tạm thời xử lý bằng state)
        setWatchlist(watchlist.filter(item => item.code !== stock.code));
        toast.success(`Đã xóa ${stock.code} khỏi danh sách theo dõi`);
      } else {
        // Gọi API để thêm vào watchlist
        console.log("Calling API with userId:", userId, "and stockId:", stock.code);
        const response = await axios.post('https://stockmonitoring-be-stock-service.onrender.com/api/WatchListStock', {
          userId: userId,
          stockIds: [stock.code]
        });
        
        console.log("Add to watchlist response:", response.data);
        
        // Cập nhật state watchlist
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
  const handleSavePriceAlert = () => {
    if (!alertPrice || isNaN(alertPrice)) {
      toast.error('Vui lòng nhập giá hợp lệ');
      return;
    }

    const price = parseFloat(alertPrice);
    const currentPrice = parseFloat(selectedAlertStock.matchPrice);

    if (alertType === 'above' && price <= currentPrice) {
      toast.error('Giá cảnh báo phải cao hơn giá hiện tại');
      return;
    }

    if (alertType === 'below' && price >= currentPrice) {
      toast.error('Giá cảnh báo phải thấp hơn giá hiện tại');
      return;
    }

    // Lưu cài đặt thông báo
    // TODO: Implement API call to save price alert
    toast.success(`Đã cài đặt thông báo khi giá ${selectedAlertStock.code} ${alertType === 'above' ? 'vượt lên' : 'giảm xuống'} ${alertPrice}`);
    setIsPriceAlertOpen(false);
  };

  // Fetch watchlist when component mounts
  useEffect(() => {
    const fetchUserWatchlist = async () => {
      try {
        // Lấy userId từ hàm getUserId
        const userId = getUserId();
        console.log("Fetching watchlist for user ID:", userId);
        
        if (!userId) {
          console.log("No user ID found, skipping watchlist fetch");
          return; // Không có userId, không cần fetch watchlist
        }
        
        // Gọi API để lấy watchlist của user
        const response = await axios.get(`https://stockmonitoring-be-stock-service.onrender.com/api/WatchListStock/get-by-user/${userId}`);
        
        console.log("Fetched watchlist:", response.data);
        
        if (response.data && response.data.value) {
          // Tìm các mã chứng khoán trong realTimeStockData mà có trong watchlist
          const watchlistStocks = realTimeStockData.filter(stock => 
            response.data.value.includes(stock.code)
          );
          
          setWatchlist(watchlistStocks);
        }
      } catch (error) {
        console.error('Error fetching watchlist:', error);
        // Không hiển thị toast error vì đây là hoạt động ngầm
      }
    };
    
    if (realTimeStockData.length > 0) {
      fetchUserWatchlist();
    }
  }, [realTimeStockData]);

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
      <div className="p-4 flex flex-wrap items-center gap-6 animate-[fadeIn_0.3s_ease-in-out] flex-shrink-0">
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
            <DialogTitle className="text-lg font-semibold">
              Cài đặt thông báo giá - {selectedAlertStock?.code}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-400">
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
                      {realTimeStockData
                        .filter(stock => stock.code.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((stock) => (
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
                        ))}
                    </tbody>
                  </table>
                  {isLoading && (
                    <div className="flex justify-center items-center py-4">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="animate-spin h-8 w-8 text-[#00FF00]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-[#888] text-sm">Đang tải dữ liệu...</span>
                      </div>
                    </div>
                  )}
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