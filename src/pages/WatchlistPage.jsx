import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, X, Eye, ChevronRight } from 'lucide-react';
import { toast } from "sonner";
import CandlestickChart from '@/components/CandlestickChart';
import axios from 'axios';
import Cookies from 'js-cookie';
import { getUserId } from '@/api/Api'; // Import hàm getUserId

const WatchlistPage = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [watchlistCodes, setWatchlistCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [priceHistory, setPriceHistory] = useState({});
  const [priceChangeColors, setPriceChangeColors] = useState({});
  const [industries, setIndustries] = useState([
    { 
      id: 1, 
      name: 'Vận tải đường bộ', 
      stocks: ['VJC', 'HVN', 'AST'],
      smg: 98,
      dayChange: -0.3,
      weekChange: 0.4,
      monthChange: -0.5
    },
    { 
      id: 2, 
      name: 'Tập đoàn công nghiệp', 
      stocks: ['FPT', 'VNG', 'CMG'],
      smg: 96,
      dayChange: 1.0,
      weekChange: -0.3,
      monthChange: 13.3
    },
    { 
      id: 3, 
      name: 'Quản lý và phát triển BĐS', 
      stocks: ['VIC', 'NVL', 'DXG'],
      smg: 92,
      dayChange: 0.3,
      weekChange: -1.9,
      monthChange: 9.6
    }
  ]);
  const [isAddIndustryDialogOpen, setIsAddIndustryDialogOpen] = useState(false);
  const [newIndustryName, setNewIndustryName] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [industryStocks, setIndustryStocks] = useState([
    {
      code: 'TOS',
      chart: [135000, 134000, 135400],
      smg: 98,
      price: 135400,
      dayChange: -0.7,
      weekChange: -0.2,
      monthChange: 0.4
    },
    {
      code: 'MVN',
      chart: [80000, 79000, 80400],
      smg: 95,
      price: 80400,
      dayChange: 2.2,
      weekChange: -1.5,
      monthChange: 0.1
    },
    {
      code: 'TCL',
      chart: [42000, 42200, 42450],
      smg: 86,
      price: 42450,
      dayChange: 0.1,
      weekChange: 1.8,
      monthChange: 0.5
    },
    {
      code: 'HAH',
      chart: [51000, 50500, 50800],
      smg: 64,
      price: 50800,
      dayChange: 1.8,
      weekChange: 5.9,
      monthChange: -4.5
    },
    {
      code: 'SKG',
      chart: [11500, 11700, 11800],
      smg: 57,
      price: 11800,
      dayChange: 1.3,
      weekChange: -0.4,
      monthChange: 1.7
    }
  ]);
  const [isIndustryDetailOpen, setIsIndustryDetailOpen] = useState(false);
  const [availableIndustries] = useState([
    { id: 1, name: 'Bất động sản', code: 'BDS' },
    { id: 2, name: 'Ngân hàng', code: 'NH' },
    { id: 3, name: 'Chứng khoán', code: 'CK' },
    { id: 4, name: 'Dầu khí', code: 'DK' },
    { id: 5, name: 'Xây dựng', code: 'XD' },
    { id: 6, name: 'Thép', code: 'THEP' },
    { id: 7, name: 'Điện', code: 'DIEN' },
    { id: 8, name: 'Cao su', code: 'CS' },
    { id: 9, name: 'Dệt may', code: 'DM' },
    { id: 10, name: 'Thủy sản', code: 'TS' },
    { id: 11, name: 'Công nghệ', code: 'CN' },
    { id: 12, name: 'Bán lẻ', code: 'BL' },
    { id: 13, name: 'Logistics', code: 'LOG' },
    { id: 14, name: 'Du lịch', code: 'DL' },
    { id: 15, name: 'Dược phẩm', code: 'DP' }
  ]);
  const [selectedIndustryIds, setSelectedIndustryIds] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [activeTab, setActiveTab] = useState('price');

  // Lấy watchlist từ localStorage khi component mount
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('watchlist');
    if (savedWatchlist) {
      setWatchlist(JSON.parse(savedWatchlist));
    }
  }, []);

  // Theo dõi thay đổi giá và cập nhật màu sắc
  const updatePriceColors = (stockCode, currentPrice, previousPrice) => {
    if (!previousPrice) return null;
    
    if (currentPrice > previousPrice) {
      return 'text-[#00FF00]'; // Tăng giá - màu xanh
    } else if (currentPrice < previousPrice) {
      return 'text-[#FF4A4A]'; // Giảm giá - màu đỏ
    }
    return 'text-white'; // Giữ nguyên - màu trắng
  };

  // Fetch stock data on component mount
  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setIsLoading(true);
        
        // Lấy userId từ getUserId
        const userId = getUserId();
        
        if (!userId) {
          console.log("No user ID found, skipping watchlist fetch");
          setIsLoading(false);
          return;
        }
        
        // Gọi API để lấy danh sách mã chứng khoán trong watchlist
        const watchlistResponse = await axios.get(`https://stockmonitoring-be-stock-service.onrender.com/api/WatchListStock/get-by-user/${userId}`);
        console.log("Watchlist response:", watchlistResponse.data);
        
        if (watchlistResponse.data && watchlistResponse.data.value) {
          // Lưu lại danh sách mã CK trong watchlist
          const watchlistCodes = watchlistResponse.data.value;
          setWatchlistCodes(watchlistCodes);
          
          if (watchlistCodes.length === 0) {
            setStocks([]);
            setIsLoading(false);
            return;
          }
          
          // Gọi API để lấy dữ liệu chi tiết của các mã CK
          const stockResponse = await axios.get(`https://stockmonitoring-be-stock-service.onrender.com/api/stock/get-stock-in-session`, {
            params: {
              exchange: 'hsx',
              timestamp: "20250316122322" // Timestamp cố định theo yêu cầu
            }
          });
          
          if (stockResponse.data && stockResponse.data.value && stockResponse.data.value.data) {
            // Lọc ra chỉ các mã CK có trong watchlist
            const watchlistStocks = stockResponse.data.value.data.filter(
              stock => watchlistCodes.includes(stock.stockCode)
            ).map(stock => ({
              code: stock.stockCode,
              name: stock.stockName || `Cổ phiếu ${stock.stockCode}`,
              currentPrice: stock.matchPrice?.toFixed(2) || '--',
              change: stock.plusMinus ? `${stock.plusMinus > 0 ? '+' : ''}${stock.plusMinus.toFixed(2)}%` : '--',
              volume: stock.volumeAccumulation?.toLocaleString() || '--',
              ceiling: stock.ceilPrice?.toFixed(2) || '--',
              floor: stock.floorPrice?.toFixed(2) || '--',
              reference: stock.priorClosePrice?.toFixed(2) || '--',
              high: stock.highPrice?.toFixed(2) || '--',
              low: stock.lowPrice?.toFixed(2) || '--',
              openPrice: stock.openPrice?.toFixed(2) || '--',
              foreignBuy: stock.foreignBuyVolume?.toLocaleString() || '--',
              foreignSell: stock.foreignSellVolume?.toLocaleString() || '--'
            }));
            
            setStocks(watchlistStocks);
          } else {
            console.log("No stock data available");
            setStocks([]);
          }
        } else {
          console.log("No watchlist data available");
          setStocks([]);
        }
      } catch (error) {
        console.error("Error fetching watchlist data:", error);
        setStocks([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStockData();
    
    // Cập nhật dữ liệu mỗi 30 giây
    const interval = setInterval(fetchStockData, 30000);
    return () => clearInterval(interval);
  }, []);

  const removeFromWatchlist = async (code) => {
    try {
      // Lấy userId từ getUserId
      const userId = getUserId();
      
      if (!userId) {
        toast.error("Bạn cần đăng nhập để sử dụng tính năng này");
        return;
      }
      
      // Gọi API để xóa khỏi watchlist (Giả định API chưa hỗ trợ DELETE thì chỉ cập nhật UI)
      // await axios.delete(`https://stockmonitoring-be-stock-service.onrender.com/api/WatchListStock/remove/${userId}/${code}`);
      
      // Cập nhật state
      setStocks(stocks.filter(stock => stock.code !== code));
      setWatchlistCodes(watchlistCodes.filter(stockCode => stockCode !== code));
      
      toast.success(`Đã xóa ${code} khỏi danh sách theo dõi`);
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

  return (
    <div className="bg-[#0a0a14] min-h-screen -mx-4 md:-mx-8">
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
                        <td className="text-[#00FF00] border-r border-[#333] text-center whitespace-nowrap py-2">{stock.high}</td>
                        <td className="text-[#FF4A4A] border-r border-[#333] text-center whitespace-nowrap py-2">{stock.low}</td>
                        <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">--</td>
                        <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.totalVolume}</td>
                        <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.foreignBuy}</td>
                        <td className="text-white border-r border-[#333] text-center whitespace-nowrap py-2">{stock.foreignSell}</td>
                        <td className="text-center py-2">
                          <button
                            onClick={() => removeFromWatchlist(stock.code)}
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
                        <div className="col-span-5 grid grid-cols-3 gap-1 text-center text-sm">
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
                      </div>
                    </div>
                  ))}
                </div>

                {/* Empty State */}
                {industries.length === 0 && (
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
            {availableIndustries
              .filter(industry => 
                industry.name.toLowerCase().includes(newIndustryName.toLowerCase()) ||
                industry.code.toLowerCase().includes(newIndustryName.toLowerCase())
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
                    <span className="text-[#666] text-sm">{industry.code}</span>
                  </label>
                </div>
              ))}
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
                    const newIndustries = availableIndustries
                      .filter(industry => selectedIndustryIds.includes(industry.id))
                      .map(industry => ({
                        id: industry.id,
                        name: industry.name,
                        stocks: [],
                        smg: 0,
                        dayChange: 0,
                        weekChange: 0,
                        monthChange: 0
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
                    setIsAddIndustryDialogOpen(false);
                    toast.success('Đã thêm ngành mới');
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
    </div>
  );
};

export default WatchlistPage; 