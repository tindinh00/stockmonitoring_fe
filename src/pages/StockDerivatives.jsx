import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from "@/components/ui/input";
import moment from 'moment';
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
            {/* Market Overview Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#FF4A4A] text-lg font-medium">VNINDEX</span>
                      <span className="text-[#FF4A4A]">1,326.15</span>
                      <span className="text-[#FF4A4A]">-0.12 (-0.01%)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <span className="text-[#00FF00]">↑170 (0)</span>
                      <span className="text-[#FF4A4A]">↓283</span>
                      <span className="text-[#999]">(0)</span>
                      <span className="text-white">1,023,002,500CP</span>
                      <span className="text-white">23,043.57TY</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#999]">
                <span>Hết giờ</span>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 gap-4">
              {/* HOSE Charts */}
              <div>
                <div className="text-sm font-medium text-white mb-1">Sàn HOSE</div>
                <div className="grid grid-cols-3 gap-2">
                  {/* VN-Index Chart */}
                  <div className="bg-[#1a1a1a] rounded-lg p-2">
                    <div className="flex flex-col gap-1 mb-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#FF4A4A]"></div>
                          <span className="text-sm font-medium text-white">Dữ liệu thống kê HOSE</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-[#999]">Mở cửa:</span>
                            <span className="text-white">1,328.15</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[#999]">Cao:</span>
                            <span className="text-[#00FF00]">1,331.27</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[#999]">Thấp:</span>
                            <span className="text-[#FF4A4A]">1,325.89</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-xs">
                        <div className="flex flex-col">
                          <span className="text-[#999]">GTGD (tỷ)</span>
                          <span className="text-white font-medium">23,043.57</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#999]">KLGD (triệu CP)</span>
                          <span className="text-white font-medium">1,023.00</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#999]">Dư mua (tỷ)</span>
                          <span className="text-[#00FF00] font-medium">+2,145.32</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#999]">Dư bán (tỷ)</span>
                          <span className="text-[#FF4A4A] font-medium">-1,897.45</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={vnIndexData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.5} />
                          <XAxis 
                            dataKey="time"
                            tick={{ fontSize: 11, fill: '#999' }}
                            stroke="#333"
                          />
                          <YAxis 
                            yAxisId="price"
                            orientation="right"
                            tick={{ fontSize: 11, fill: '#999' }}
                            stroke="#333"
                          />
                          <YAxis 
                            yAxisId="volume"
                            orientation="left"
                            tick={{ fontSize: 11, fill: '#999' }}
                            stroke="#333"
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(26,26,26,0.95)', 
                              border: '1px solid #333',
                              borderRadius: '4px'
                            }}
                            labelStyle={{ color: '#999' }}
                          />
                          <Line 
                            yAxisId="price"
                            type="monotone" 
                            dataKey="value" 
                            stroke="#FF4A4A"
                            dot={false}
                          />
                          <Bar
                            yAxisId="volume"
                            dataKey="volume"
                            fill="#2a2a2a"
                            opacity={0.5}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Liquidity Chart */}
                  <div className="bg-[#1a1a1a] rounded-lg p-2">
                    <div className="flex flex-col gap-1 mb-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#F4BE37]"></div>
                          <span className="text-sm font-medium text-white">Thanh khoản HOSE (TỶ VND)</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-[#FF4A4A] rounded-full"></div>
                              <span className="text-[#999]">Hiện tại</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-[#00FF00] rounded-full"></div>
                              <span className="text-[#999]">Hôm qua</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-[#F4BE37] rounded-full"></div>
                              <span className="text-[#999]">TB 5 ngày</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div className="flex flex-col">
                          <span className="text-[#999]">Hiện tại</span>
                          <span className="text-[#FF4A4A] font-medium">23,043.57</span>
                          <span className="text-[#FF4A4A] text-[10px]">-12.5%</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#999]">Hôm qua</span>
                          <span className="text-[#00FF00] font-medium">26,321.45</span>
                          <span className="text-[#00FF00] text-[10px]">+8.2%</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#999]">TB 5 ngày</span>
                          <span className="text-[#F4BE37] font-medium">24,567.89</span>
                          <span className="text-[#F4BE37] text-[10px]">-2.1%</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={liquidityData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.5} />
                          <XAxis 
                            dataKey="time"
                            tick={{ fontSize: 11, fill: '#999' }}
                            stroke="#333"
                          />
                          <YAxis 
                            tick={{ fontSize: 11, fill: '#999' }}
                            stroke="#333"
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(26,26,26,0.95)', 
                              border: '1px solid #333',
                              borderRadius: '4px'
                            }}
                            labelStyle={{ color: '#999' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#FF4A4A"
                            dot={false}
                            name="Hiện tại"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="previousDay" 
                            stroke="#00FF00"
                            dot={false}
                            name="Hôm qua"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="yesterday" 
                            stroke="#F4BE37"
                            dot={false}
                            name="TB 5 ngày trước"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Distribution Chart */}
                  <div className="bg-[#1a1a1a] rounded-lg p-2">
                    <div className="flex flex-col gap-1 mb-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#00FF00]"></div>
                          <span className="text-sm font-medium text-white">Biến động cổ phiếu HOSE</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="px-2 py-1 rounded bg-[#1E1E1E] border border-[#333]">
                            <span className="text-[#FF4A4A]">Giảm: 283</span>
                            <span className="text-[#999] mx-2">|</span>
                            <span className="text-[#F4BE37]">Đứng: 0</span>
                            <span className="text-[#999] mx-2">|</span>
                            <span className="text-[#00FF00]">Tăng: 170</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-xs">
                        <div className="flex flex-col">
                          <span className="text-[#999]">Trần</span>
                          <span className="text-[#FF424E] font-medium">15</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#999]">Sàn</span>
                          <span className="text-[#00C9FF] font-medium">23</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#999]">Tăng mạnh</span>
                          <span className="text-[#00FF00] font-medium">42</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#999]">Giảm mạnh</span>
                          <span className="text-[#FF4A4A] font-medium">38</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-[200px]">
                      <Chart
                        options={distributionChartOptions}
                        series={[{
                          name: 'Số lượng CP',
                          data: distributionData.map(item => item.count)
                        }]}
                        type="bar"
                        height="100%"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* HNX Charts */}
              <div>
                <div className="text-sm font-medium text-white mb-1 mt-2">Sàn HNX</div>
                <div className="grid grid-cols-3 gap-2">
                  {/* HNX-Index Chart */}
                  <div className="bg-[#1a1a1a] rounded-lg p-2">
                    <div className="flex flex-col gap-1 mb-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#00B4D8]"></div>
                          <span className="text-sm font-medium text-white">Dữ liệu thống kê HNX</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-[#999]">Mở cửa:</span>
                            <span className="text-white">228.15</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[#999]">Cao:</span>
                            <span className="text-[#00FF00]">231.27</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[#999]">Thấp:</span>
                            <span className="text-[#FF4A4A]">225.89</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-xs">
                        <div className="flex flex-col">
                          <span className="text-[#999]">GTGD (tỷ)</span>
                          <span className="text-white font-medium">3,043.57</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#999]">KLGD (triệu CP)</span>
                          <span className="text-white font-medium">223.00</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#999]">Dư mua (tỷ)</span>
                          <span className="text-[#00FF00] font-medium">+445.32</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#999]">Dư bán (tỷ)</span>
                          <span className="text-[#FF4A4A] font-medium">-397.45</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={vnIndexData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.5} />
                          <XAxis 
                            dataKey="time"
                            tick={{ fontSize: 11, fill: '#999' }}
                            stroke="#333"
                          />
                          <YAxis 
                            yAxisId="price"
                            orientation="right"
                            tick={{ fontSize: 11, fill: '#999' }}
                            stroke="#333"
                          />
                          <YAxis 
                            yAxisId="volume"
                            orientation="left"
                            tick={{ fontSize: 11, fill: '#999' }}
                            stroke="#333"
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(26,26,26,0.95)', 
                              border: '1px solid #333',
                              borderRadius: '4px'
                            }}
                            labelStyle={{ color: '#999' }}
                          />
                          <Line 
                            yAxisId="price"
                            type="monotone" 
                            dataKey="value" 
                            stroke="#00B4D8"
                            dot={false}
                          />
                          <Bar
                            yAxisId="volume"
                            dataKey="volume"
                            fill="#2a2a2a"
                            opacity={0.5}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* HNX Liquidity Chart */}
                  <div className="bg-[#1a1a1a] rounded-lg p-2">
                    <div className="flex flex-col gap-1 mb-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#F4BE37]"></div>
                          <span className="text-sm font-medium text-white">Thanh khoản HNX (TỶ VND)</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-[#00B4D8] rounded-full"></div>
                              <span className="text-[#999]">Hiện tại</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-[#00FF00] rounded-full"></div>
                              <span className="text-[#999]">Hôm qua</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-[#F4BE37] rounded-full"></div>
                              <span className="text-[#999]">TB 5 ngày</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div className="flex flex-col">
                          <span className="text-[#999]">Hiện tại</span>
                          <span className="text-[#00B4D8] font-medium">3,043.57</span>
                          <span className="text-[#00B4D8] text-[10px]">-8.5%</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#999]">Hôm qua</span>
                          <span className="text-[#00FF00] font-medium">3,321.45</span>
                          <span className="text-[#00FF00] text-[10px]">+5.2%</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#999]">TB 5 ngày</span>
                          <span className="text-[#F4BE37] font-medium">3,567.89</span>
                          <span className="text-[#F4BE37] text-[10px]">-1.1%</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={liquidityData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.5} />
                          <XAxis 
                            dataKey="time"
                            tick={{ fontSize: 11, fill: '#999' }}
                            stroke="#333"
                          />
                          <YAxis 
                            tick={{ fontSize: 11, fill: '#999' }}
                            stroke="#333"
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(26,26,26,0.95)', 
                              border: '1px solid #333',
                              borderRadius: '4px'
                            }}
                            labelStyle={{ color: '#999' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#00B4D8"
                            dot={false}
                            name="Hiện tại"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="previousDay" 
                            stroke="#00FF00"
                            dot={false}
                            name="Hôm qua"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="yesterday" 
                            stroke="#F4BE37"
                            dot={false}
                            name="TB 5 ngày trước"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* HNX Distribution Chart */}
                  <div className="bg-[#1a1a1a] rounded-lg p-2">
                    <div className="flex flex-col gap-1 mb-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#00B4D8]"></div>
                          <span className="text-sm font-medium text-white">Biến động cổ phiếu HNX</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="px-2 py-1 rounded bg-[#1E1E1E] border border-[#333]">
                            <span className="text-[#FF4A4A]">Giảm: 83</span>
                            <span className="text-[#999] mx-2">|</span>
                            <span className="text-[#F4BE37]">Đứng: 0</span>
                            <span className="text-[#999] mx-2">|</span>
                            <span className="text-[#00FF00]">Tăng: 70</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-xs">
                        <div className="flex flex-col">
                          <span className="text-[#999]">Trần</span>
                          <span className="text-[#FF424E] font-medium">5</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#999]">Sàn</span>
                          <span className="text-[#00C9FF] font-medium">3</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#999]">Tăng mạnh</span>
                          <span className="text-[#00FF00] font-medium">12</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#999]">Giảm mạnh</span>
                          <span className="text-[#FF4A4A] font-medium">8</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-[200px]">
                      <Chart
                        options={{
                          ...distributionChartOptions,
                          colors: ['#FF4A4A', '#FF4A4A', '#FF4A4A', '#FF4A4A', '#FF4A4A', '#FF4A4A', '#F4BE37', '#00FF00', '#00FF00', '#00FF00', '#00FF00', '#00FF00']
                        }}
                        series={[{
                          name: 'Số lượng CP',
                          data: [14, 8, 25, 20, 46, 81, 231, 36, 28, 10, 5, 10]
                        }]}
                        type="bar"
                        height="100%"
                      />
                    </div>
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