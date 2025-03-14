import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from "@/components/ui/input";
import moment from 'moment';
import CandlestickChart from '@/components/CandlestickChart';

const StockDerivatives = () => {
  const [activeTab, setActiveTab] = useState('price');
  const [selectedStock, setSelectedStock] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [priceHistory, setPriceHistory] = useState({});
  const [priceChangeColors, setPriceChangeColors] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExchange, setSelectedExchange] = useState('HOSE');
  const [chartData, setChartData] = useState([]);

  // Thêm dữ liệu cho các sàn
  const exchanges = [
    { id: 'HOSE', name: 'HOSE', color: '#00C087', description: 'Sở GDCK TP.HCM' },
    { id: 'HNX', name: 'HNX', color: '#00B4D8', description: 'Sở GDCK Hà Nội' },
    { id: 'UPCOM', name: 'UPCOM', color: '#FF9F1C', description: 'Thị trường OTC' },
  ];

  // Dữ liệu mẫu cho các mã phái sinh
  const stockData = [
    {
      code: 'AAA',
      date: '20/03/2025',
      session: 'LO',
      oi: '39432',
      ceiling: '9.50',
      floor: '8.26',
      ref: '8.88',
      deviation: '0.77',
      buyPrice3: '8.75',
      buyVolume3: '39,600',
      buyPrice2: '8.76',
      buyVolume2: '16,500',
      buyPrice1: '8.77',
      buyVolume1: '58,600',
      matchPrice: '8.77',
      matchVolume: '86,400',
      matchChange: '-1.24%',
      sellPrice1: '8.79',
      sellVolume1: '2,600',
      sellPrice2: '8.80',
      sellVolume2: '26,400',
      sellPrice3: '8.81',
      sellVolume3: '3,100',
      totalVolume: '1,717,100',
      high: '8.91',
      low: '8.75',
      foreignBuy: '21,900',
      foreignSell: '236,355'
    },
    {
      code: 'AAM',
      date: '20/03/2025',
      session: 'LO',
      oi: '722',
      ceiling: '7.49',
      floor: '6.51',
      ref: '7.00',
      deviation: '2.86',
      buyPrice3: '6.90',
      buyVolume3: '1,000',
      buyPrice2: '7.00',
      buyVolume2: '600',
      buyPrice1: '7.10',
      buyVolume1: '100',
      matchPrice: '7.20',
      matchVolume: '200',
      matchChange: '+2.86%',
      sellPrice1: '7.20',
      sellVolume1: '600',
      sellPrice2: '7.23',
      sellVolume2: '1,000',
      sellPrice3: '7.25',
      sellVolume3: '600',
      totalVolume: '9,100',
      high: '7.20',
      low: '7.10',
      foreignBuy: '0',
      foreignSell: '0'
    }
  ];

  const handleStockClick = (stock) => {
    setSelectedStock(stock);
    setIsDialogOpen(true);
  };

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

  // Giả lập cập nhật giá realtime
  useEffect(() => {
    const interval = setInterval(() => {
      const newPriceHistory = { ...priceHistory };
      const newPriceChangeColors = { ...priceChangeColors };

      stockData.forEach(stock => {
        const currentPrice = parseFloat(stock.matchPrice);
        const previousPrice = newPriceHistory[stock.code] || currentPrice;

        // Lưu giá hiện tại vào lịch sử
        newPriceHistory[stock.code] = currentPrice;

        // Cập nhật màu sắc dựa trên thay đổi giá
        newPriceChangeColors[stock.code] = updatePriceColors(
          stock.code,
          currentPrice,
          previousPrice
        );
      });

      setPriceHistory(newPriceHistory);
      setPriceChangeColors(newPriceChangeColors);
    }, 1000); // Cập nhật mỗi giây

    return () => clearInterval(interval);
  }, [stockData]);

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
      from { background-color: rgba(0, 255, 0, 0.2); }
      to { background-color: transparent; }
    }
    @keyframes priceDown {
      from { background-color: rgba(255, 0, 0, 0.2); }
      to { background-color: transparent; }
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

    ${priceChangeAnimation}
  `;

  return (
    <div className="bg-[#0a0a14] min-h-screen">
      <style>{animations}</style>
      
      {/* Navigation Tabs */}
      <div className="border-b border-[#333]">
        <div className="flex items-center gap-4 px-4">
          <button
            className={`py-3 px-4 text-sm font-medium relative transition-all duration-300 ease-in-out ${
              activeTab === 'price' 
                ? 'text-white' 
                : 'text-[#888] hover:text-white'
            }`}
            onClick={() => setActiveTab('price')}
          >
            Bảng giá
            {activeTab === 'price' && (
              <div className="absolute bottom-0 left-0 h-0.5 bg-blue-500 w-full animate-[borderSlide_0.3s_ease-in-out]" />
            )}
          </button>
          <button
            className={`py-3 px-4 text-sm font-medium relative transition-all duration-300 ease-in-out ${
              activeTab === 'market' 
                ? 'text-white' 
                : 'text-[#888] hover:text-white'
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
      <div className="p-4 flex flex-wrap items-center gap-6 animate-[fadeIn_0.3s_ease-in-out]">
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

      {/* Content with smooth transitions */}
      <div className="relative">
        {activeTab === 'price' ? (
          <div className="animate-[fadeIn_0.3s_ease-in-out]">
      {/* Header */}
            <header className="flex justify-between items-center px-4 mb-4">
              <div className="flex items-center gap-4 animate-[slideIn_0.3s_ease-in-out]">
          <div className="flex gap-4">
            <span className="text-[#00FF00]">VN30: 1,335.68 +2.72 (+0.2%)</span>
            <span className="text-[#FF4A4A]">VNINDEX: 1,305.36 -2.44 (-0.19%)</span>
          </div>
        </div>
              <div className="flex items-center gap-2 text-[#888] animate-[slideIn_0.3s_ease-in-out]">
          Cập nhật: {moment().format('HH:mm:ss')}
          <div className="w-2 h-2 bg-[#00FF00] rounded-full" />
        </div>
      </header>

            {/* Price Table */}
            <div className="overflow-x-auto px-4 animate-[fadeIn_0.4s_ease-in-out]">
            <Table>
                <TableHeader className="bg-[#1a1a1a] sticky top-0">
                <TableRow>
                  <TableHead className="text-[#999] border-r border-[#333] text-center" rowSpan={2}>Mã CK</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center" rowSpan={2}>Trần</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center" rowSpan={2}>Sàn</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center" rowSpan={2}>TC</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center" colSpan={6}>Bên mua</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center" colSpan={3}>Khớp lệnh</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center" colSpan={6}>Bên bán</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center" rowSpan={2}>Cao</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center" rowSpan={2}>Thấp</TableHead>
                    <TableHead className="text-[#999] border-r border-[#333] text-center" rowSpan={2}>TB</TableHead>
                    <TableHead className="text-[#999] border-r border-[#333] text-center" rowSpan={2}>Tổng KL</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center" colSpan={2}>ĐTNN</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="text-[#999] border-r border-[#333] text-center">Giá 3</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center">KL 3</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center">Giá 2</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center">KL 2</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center">Giá 1</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center">KL 1</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center">Giá</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center">KL</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center">+/-</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center">Giá 1</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center">KL 1</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center">Giá 2</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center">KL 2</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center">Giá 3</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center">KL 3</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center">Mua</TableHead>
                  <TableHead className="text-[#999] text-center">Bán</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {stockData
                    .filter(stock => stock.code.toLowerCase().includes(searchQuery.toLowerCase()))
                    .filter(stock => {
                      // Lọc theo sàn được chọn
                      if (selectedExchange === 'HOSE') {
                        return ['AAA', 'AAM'].includes(stock.code); // Thêm các mã HOSE khác
                      } else if (selectedExchange === 'HNX') {
                        return ['HNX1', 'HNX2'].includes(stock.code); // Thay bằng mã HNX thực tế
                      } else if (selectedExchange === 'UPCOM') {
                        return ['UPC1', 'UPC2'].includes(stock.code); // Thay bằng mã UPCOM thực tế
                      }
                      return true;
                    })
                    .map((stock) => (
                      <TableRow 
                        key={stock.code} 
                        className="hover:bg-[#1a1a1a]"
                      >
                        <TableCell
                          className={`border-r border-[#333] text-center font-medium transition-colors duration-300 cursor-pointer ${
                            priceChangeColors[stock.code] || 'text-white'
                          }`}
                          onClick={() => handleStockClick(stock)}
                        >
                          {stock.code}
                        </TableCell>
                    <TableCell className="text-[#FF424E] border-r border-[#333] text-right">{stock.ceiling}</TableCell>
                    <TableCell className="text-[#00C9FF] border-r border-[#333] text-right">{stock.floor}</TableCell>
                    <TableCell className="text-[#F4BE37] border-r border-[#333] text-right">{stock.ref}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.buyPrice3}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.buyVolume3}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.buyPrice2}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.buyVolume2}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.buyPrice1}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.buyVolume1}</TableCell>
                        <TableCell 
                          className={`border-r border-[#333] text-right transition-colors duration-300 ${
                            priceChangeColors[stock.code] || 'text-white'
                          }`}
                        >
                          {stock.matchPrice}
                        </TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.matchVolume}</TableCell>
                        <TableCell className={`${stock.matchChange.includes('+') ? 'text-[#00FF00]' : 'text-[#FF4A4A]'} border-r border-[#333] text-right`}>
                          {stock.matchChange}
                        </TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.sellPrice1}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.sellVolume1}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.sellPrice2}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.sellVolume2}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.sellPrice3}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.sellVolume3}</TableCell>
                    <TableCell className="text-[#00FF00] border-r border-[#333] text-right">{stock.high}</TableCell>
                    <TableCell className="text-[#FF4A4A] border-r border-[#333] text-right">{stock.low}</TableCell>
                        <TableCell className="text-white border-r border-[#333] text-right">--</TableCell>
                        <TableCell className="text-white border-r border-[#333] text-right">{stock.totalVolume}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.foreignBuy}</TableCell>
                        <TableCell className="text-white text-right">{stock.foreignSell}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          </div>
        ) : (
          <div className="p-4 text-white animate-[fadeIn_0.3s_ease-in-out]">
            {/* Toàn cảnh thị trường content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-[#1a1a1a] p-4 rounded-lg transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg animate-[fadeIn_0.3s_ease-in-out]">
                <h3 className="text-lg font-medium mb-4">Top tăng giá</h3>
                {/* Add content for top gainers */}
              </div>
              <div className="bg-[#1a1a1a] p-4 rounded-lg transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg animate-[fadeIn_0.4s_ease-in-out]">
                <h3 className="text-lg font-medium mb-4">Top giảm giá</h3>
                {/* Add content for top losers */}
              </div>
              <div className="bg-[#1a1a1a] p-4 rounded-lg transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg animate-[fadeIn_0.5s_ease-in-out]">
                <h3 className="text-lg font-medium mb-4">Top khối lượng</h3>
                {/* Add content for top volume */}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockDerivatives;