import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { createChart } from 'lightweight-charts';
import moment from 'moment';
import CandlestickChart from '@/components/CandlestickChart';

const StockDerivatives = () => {
  const [activeTab, setActiveTab] = useState('price');
  const [selectedStock, setSelectedStock] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Dữ liệu mẫu cho các mã phái sinh
  const stockData = [
    {
      code: 'VN30F2503',
      date: '20/03/2025',
      session: 'LO',
      oi: '39432',
      ceiling: '1459.4',
      floor: '1268.6',
      ref: '1364.0',
      deviation: '0.77',
      buyPrice3: '1357.4',
      buyVolume3: '42',
      buyPrice2: '1357.5',
      buyVolume2: '9',
      buyPrice1: '1357.6',
      buyVolume1: '72',
      matchPrice: '1357.2',
      matchVolume: '156',
      matchChange: '-6.80',
      sellPrice1: '1357.8',
      sellVolume1: '61',
      sellPrice2: '1357.9',
      sellVolume2: '45',
      sellPrice3: '1358.0',
      sellVolume3: '358',
      totalVolume: '138,073',
      high: '1361.4',
      low: '1346.6',
      foreignBuy: '5,052',
      foreignSell: '4,188'
    },
    {
      code: 'VN30F2504',
      date: '17/04/2025',
      session: 'LO',
      oi: '722',
      ceiling: '1460.0',
      floor: '1269.0',
      ref: '1364.5',
      deviation: '3.37',
      buyPrice3: '1359.6',
      buyVolume3: '2',
      buyPrice2: '1359.7',
      buyVolume2: '3',
      buyPrice1: '1359.8',
      buyVolume1: '1',
      matchPrice: '1359.8',
      matchVolume: '1',
      matchChange: '-4.70',
      sellPrice1: '1360.6',
      sellVolume1: '1',
      sellPrice2: '1360.9',
      sellVolume2: '1',
      sellPrice3: '1361.3',
      sellVolume3: '1',
      totalVolume: '243',
      high: '1363.5',
      low: '1351.0',
      foreignBuy: '110',
      foreignSell: '9'
    }
  ];

  // Dữ liệu mẫu cho biểu đồ
  const chartData = {
    VN30F2503: [
      { time: 1710460800, open: 1357.4, high: 1358.0, low: 1356.8, close: 1357.2 }, // 2024-03-15
      { time: 1710547200, open: 1357.2, high: 1359.0, low: 1356.5, close: 1358.5 }, // 2024-03-16
      { time: 1710633600, open: 1358.5, high: 1360.2, low: 1357.8, close: 1359.6 }, // 2024-03-17
      { time: 1710720000, open: 1359.6, high: 1361.5, low: 1358.9, close: 1360.8 }, // 2024-03-18
      { time: 1710806400, open: 1360.8, high: 1362.4, low: 1359.7, close: 1361.2 }, // 2024-03-19
      { time: 1710892800, open: 1361.2, high: 1363.0, low: 1360.0, close: 1362.5 }, // 2024-03-20
      { time: 1710979200, open: 1362.5, high: 1364.2, low: 1361.8, close: 1363.7 }, // 2024-03-21
      { time: 1711065600, open: 1363.7, high: 1365.5, low: 1362.9, close: 1364.8 }  // 2024-03-22
    ],
    VN30F2504: [
      { time: 1713052800, open: 1359.6, high: 1360.5, low: 1358.7, close: 1359.8 }, // 2024-04-15
      { time: 1713139200, open: 1359.8, high: 1361.2, low: 1359.0, close: 1360.5 }, // 2024-04-16
      { time: 1713225600, open: 1360.5, high: 1362.0, low: 1359.8, close: 1361.4 }, // 2024-04-17
      { time: 1713312000, open: 1361.4, high: 1363.0, low: 1360.6, close: 1362.2 }, // 2024-04-18
      { time: 1713398400, open: 1362.2, high: 1364.0, low: 1361.5, close: 1363.5 }, // 2024-04-19
      { time: 1713484800, open: 1363.5, high: 1365.2, low: 1362.8, close: 1364.7 }, // 2024-04-20
      { time: 1713571200, open: 1364.7, high: 1366.5, low: 1363.9, close: 1365.8 }, // 2024-04-21
      { time: 1713657600, open: 1365.8, high: 1367.6, low: 1364.9, close: 1366.7 }  // 2024-04-22
    ]
  };

  const handleStockClick = (stockCode) => {
    setSelectedStock(stockCode);
    setIsDialogOpen(true);
  };

  return (
    <div className="bg-[#1C1C1C] min-h-screen p-5">
      {/* Header */}
      <header className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-5">
          <h1 className="text-white text-2xl font-bold">Phái sinh</h1>
          <div className="flex gap-4">
            <span className="text-[#00FF00]">VN30: 1,335.68 +2.72 (+0.2%)</span>
            <span className="text-[#FF4A4A]">VNINDEX: 1,305.36 -2.44 (-0.19%)</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[#888]">
          Cập nhật: {moment().format('HH:mm:ss')}
          <div className="w-2 h-2 bg-[#00FF00] rounded-full" />
        </div>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-5">
        <TabsList className="bg-[#1C1C1C] border-b border-[#333]">
          <TabsTrigger
            value="price"
            className="text-[#888] data-[state=active]:text-[#00C9FF] data-[state=active]:border-b-2 data-[state=active]:border-[#00C9FF]"
          >
            BẢNG GIÁ PHÁI SINH
          </TabsTrigger>
          <TabsTrigger
            value="analysis"
            className="text-[#888] data-[state=active]:text-[#00C9FF] data-[state=active]:border-b-2 data-[state=active]:border-[#00C9FF]"
          >
            PHÂN TÍCH PHÁI SINH
          </TabsTrigger>
        </TabsList>

        <TabsContent value="price">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#2A2A2A]">
                <TableRow>
                  <TableHead className="text-[#999] border-r border-[#333] text-center" rowSpan={2}>Mã CK</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center" rowSpan={2}>Ngày ĐH</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center" rowSpan={2}>Phiên</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center" rowSpan={2}>OI</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center" rowSpan={2}>Trần</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center" rowSpan={2}>Sàn</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center" rowSpan={2}>TC</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center" rowSpan={2}>Độ lệch</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center" colSpan={6}>Bên mua</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center" colSpan={3}>Khớp lệnh</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center" colSpan={6}>Bên bán</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center" rowSpan={2}>Tổng KL</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center" rowSpan={2}>Cao</TableHead>
                  <TableHead className="text-[#999] border-r border-[#333] text-center" rowSpan={2}>Thấp</TableHead>
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
                {stockData.map((stock) => (
                  <TableRow key={stock.code} className="hover:bg-[#2A2A2A]">
                    <Dialog 
                      open={isDialogOpen && selectedStock === stock.code} 
                      onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) setSelectedStock(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <TableCell
                          className="text-[#FF424E] border-r border-[#333] text-center cursor-pointer"
                          onClick={() => handleStockClick(stock.code)}
                        >
                          {stock.code}
                        </TableCell>
                      </DialogTrigger>
                      <DialogContent className="bg-[#1C1C1C] text-white border-[#333] max-w-[90vw] max-h-[90vh]">
                        <DialogHeader>
                          <DialogTitle>Biểu đồ {stock.code}</DialogTitle>
                        </DialogHeader>
                        {selectedStock && (
                          <div className="p-4 h-[80vh]">
                            <div className="text-sm text-gray-400 mb-2">
                              Mã: {selectedStock} | Dữ liệu: {chartData[selectedStock]?.length || 0} điểm
                            </div>
                            <CandlestickChart
                              stockCode={selectedStock}
                              data={chartData[selectedStock] || []}
                            />
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <TableCell className="text-white border-r border-[#333] text-center">{stock.date}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-center">{stock.session}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.oi}</TableCell>
                    <TableCell className="text-[#FF424E] border-r border-[#333] text-right">{stock.ceiling}</TableCell>
                    <TableCell className="text-[#00C9FF] border-r border-[#333] text-right">{stock.floor}</TableCell>
                    <TableCell className="text-[#F4BE37] border-r border-[#333] text-right">{stock.ref}</TableCell>
                    <TableCell className="text-[#FF4A4A] border-r border-[#333] text-right">{stock.deviation}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.buyPrice3}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.buyVolume3}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.buyPrice2}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.buyVolume2}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.buyPrice1}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.buyVolume1}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.matchPrice}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.matchVolume}</TableCell>
                    <TableCell className="text-[#FF4A4A] border-r border-[#333] text-right">{stock.matchChange}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.sellPrice1}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.sellVolume1}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.sellPrice2}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.sellVolume2}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.sellPrice3}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.sellVolume3}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.totalVolume}</TableCell>
                    <TableCell className="text-[#00FF00] border-r border-[#333] text-right">{stock.high}</TableCell>
                    <TableCell className="text-[#FF4A4A] border-r border-[#333] text-right">{stock.low}</TableCell>
                    <TableCell className="text-white border-r border-[#333] text-right">{stock.foreignBuy}</TableCell>
                    <TableCell className="text-white border-[#333] text-right">{stock.foreignSell}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="analysis">
          <div className="text-white">Nội dung phân tích phái sinh sẽ được thêm ở đây.</div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockDerivatives;