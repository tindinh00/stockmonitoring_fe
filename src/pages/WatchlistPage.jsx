import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from "sonner";
import CandlestickChart from '@/components/CandlestickChart';
import axios from 'axios';

const WatchlistPage = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [priceHistory, setPriceHistory] = useState({});
  const [priceChangeColors, setPriceChangeColors] = useState({});

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

  // Fetch real-time stock data
  const fetchStockData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`https://stockmonitoring-be-stock-service.onrender.com/api/stock/get-stock-in-session`, {
        params: {
          exchange: 'hsx',
          timestamp: '20250316122322'
        }
      });
      
      if (response.data.value && response.data.value.data) {
        const allStocks = response.data.value.data;
        // Lọc chỉ các mã trong watchlist
        const watchedStocks = allStocks.filter(stock => 
          watchlist.some(watchedStock => watchedStock.code === stock.stockCode)
        ).map(stock => ({
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
        setWatchlist(watchedStocks);
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
      toast.error('Không thể tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data initially and set up polling
  useEffect(() => {
    fetchStockData();
    const interval = setInterval(fetchStockData, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Update price colors based on real-time data
  useEffect(() => {
    const interval = setInterval(() => {
      const newPriceHistory = { ...priceHistory };
      const newPriceChangeColors = { ...priceChangeColors };

      watchlist.forEach(stock => {
        const currentPrice = parseFloat(stock.matchPrice);
        const previousPrice = newPriceHistory[stock.code] || currentPrice;

        newPriceHistory[stock.code] = currentPrice;
        newPriceChangeColors[stock.code] = updatePriceColors(
          stock.code,
          currentPrice,
          previousPrice
        );
      });

      setPriceHistory(newPriceHistory);
      setPriceChangeColors(newPriceChangeColors);
    }, 1000);

    return () => clearInterval(interval);
  }, [watchlist]);

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

  const removeFromWatchlist = (stock) => {
    const updatedWatchlist = watchlist.filter(item => item.code !== stock.code);
    setWatchlist(updatedWatchlist);
    localStorage.setItem('watchlist', JSON.stringify(updatedWatchlist));
    toast.success(`Đã xóa ${stock.code} khỏi danh sách theo dõi`);
  };

  return (
    <div className="bg-[#0a0a14] min-h-screen -mx-4 md:-mx-8 p-4">
      <h1 className="text-white text-2xl font-bold mb-4">Danh sách theo dõi</h1>
      
      {/* Stock Table */}
      <div className="overflow-x-auto">
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
            <col className="w-[80px]" /> {/* Thao tác */}
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

      {/* Empty State */}
      {!isLoading && watchlist.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8">
          <svg className="w-16 h-16 text-[#666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <p className="mt-4 text-[#666]">Chưa có mã chứng khoán nào trong danh sách theo dõi</p>
        </div>
      )}

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