import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from "sonner";
import { stockService } from "../api/StockApi";
import { Button } from "../components/ui/button";

const HeatmapPage = () => {
  const [activeTab, setActiveTab] = useState('market');
  const [activeSubTab, setActiveSubTab] = useState('price');
  const [sectorData, setSectorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tabs = [
    { id: 'market', label: 'Toàn thị trường' },
    { id: 'hose', label: 'HOSE' },
    { id: 'hnx', label: 'HNX' },
    { id: 'upcom', label: 'UPCOM' }
  ];

  const subTabs = [
    { id: 'price', label: 'Giá trị' },
    { id: 'volume', label: 'Khối lượng' },
    { id: 'marketcap', label: 'Vốn hóa' },
    { id: 'foreignBuyValue', label: 'GTNN Mua' },
    { id: 'foreignSellValue', label: 'GTNN Bán' },
    { id: 'foreignBuyVolume', label: 'KLNN Mua' },
    { id: 'foreignSellVolume', label: 'KLNN Bán' }
  ];

  // Cấu trúc các ngành chính
  const sectorStructure = [
    { id: "nang-luong", name: "Năng lượng", row: 0 },
    { id: "hang-tieu-dung", name: "Hàng tiêu dùng", row: 0 },
    { id: "nguyen-vat-lieu", name: "Nguyên vật liệu", row: 0 },
    { id: "tai-chinh", name: "Tài chính", row: 0 },
    { id: "bat-dong-san", name: "Bất động sản", row: 1 },
    { id: "cham-soc-suc-khoe", name: "Chăm sóc sức khỏe", row: 1 },
    { id: "cong-nghe-thong-tin", name: "Công nghệ thông tin", row: 1 },
    { id: "cong-nghiep", name: "Công nghiệp", row: 2 },
    { id: "dich-vu-tien-ich", name: "Dịch vụ tiện ích", row: 2 },
    { id: "dich-vu-vien-thong", name: "Dịch vụ viễn thông", row: 2 }
  ];

  useEffect(() => {
    fetchHeatmapData();
  }, [activeTab, activeSubTab]);

  const fetchHeatmapData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Gọi API để lấy dữ liệu bản đồ nhiệt
      const response = await stockService.getHeatmapData();
      console.log("Heatmap data:", response);
      
      let sectors = [];
      
      // Xử lý dữ liệu API theo cấu trúc phản hồi
      if (response && response.value && response.value.data && response.value.data.sectors) {
        // Lấy danh sách các sectors từ API
        sectors = response.value.data.sectors;
      } else if (response && response.sectors) {
        // Cấu trúc phản hồi khác
        sectors = response.sectors;
      } else if (response && Array.isArray(response)) {
        // Trường hợp API trả về mảng sectors trực tiếp
        sectors = response;
      }
      
      // Lọc dữ liệu theo tab đang chọn nếu cần
      if (activeTab !== 'market') {
        // Giả sử API trả về thông tin sàn trong mỗi stock
        sectors = sectors.map(sector => {
          const filteredStocks = sector.stocks.filter(stock => {
            // Lọc theo sàn giao dịch nếu có thông tin này
            return stock.exchange && stock.exchange.toLowerCase() === activeTab.toLowerCase();
          });
          return {...sector, stocks: filteredStocks};
        });
      }
      
      // Lưu dữ liệu vào state
      setSectorData(sectors);
    } catch (err) {
      console.error("Error fetching heatmap data:", err);
      setError("Không thể tải dữ liệu bản đồ nhiệt. Vui lòng thử lại sau.");
      toast.error("Không thể tải dữ liệu bản đồ nhiệt");
    } finally {
      setLoading(false);
    }
  };

  // Màu sắc dựa trên phần trăm thay đổi
  const getColorByChange = (change) => {
    if (change === null || change === undefined) return 'bg-[#1C1C28]'; // Màu nền cho không có dữ liệu
    
    // Chuyển đổi và kiểm tra giá trị
    let numericChange = parseFloat(change);
    if (isNaN(numericChange)) return 'bg-[#1C1C28]';
    
    if (numericChange === 0) return 'bg-[#F0B90B]'; // Vàng cho không đổi
    if (numericChange > 0) return 'bg-[#16A34A]'; // Xanh cho tăng
    if (numericChange < 0) return 'bg-[#DC2626]'; // Đỏ cho giảm
    
    return 'bg-[#1C1C28]';
  };

  // Chuyển đổi volume string sang số
  const parseVolume = (volumeStr) => {
    if (!volumeStr) return 0;
    
    // Loại bỏ 'M' hoặc 'K' và chuyển đổi sang số
    const value = parseFloat(volumeStr.replace(/[MK]/g, ''));
    if (isNaN(value)) return 0;
    
    // Nhân với hệ số tương ứng
    if (volumeStr.endsWith('M')) {
      return value * 1000000;
    }
    if (volumeStr.endsWith('K')) {
      return value * 1000;
    }
    return value;
  };

  // Tính toán kích thước ô dựa trên volume
  const getTileSize = (volumeStr) => {
    const volume = parseVolume(volumeStr);
    
    // Phân loại kích thước dựa trên volume
    if (volume >= 15000000) { // >= 15M
      return "w-[160px] h-[100px] text-lg";
    }
    if (volume >= 10000000) { // >= 10M
      return "w-[140px] h-[90px] text-base";
    }
    if (volume >= 5000000) { // >= 5M
      return "w-[120px] h-[80px] text-base";
    }
    if (volume >= 1000000) { // >= 1M
      return "w-[100px] h-[70px] text-sm";
    }
    return "w-[80px] h-[60px] text-xs";
  };

  // Format volume để hiển thị
  const formatVolume = (volume) => {
    if (!volume || volume === 0) return "0";
    
    let numericVolume = 0;
    if (typeof volume === 'string') {
      if (volume.endsWith('M')) {
        numericVolume = parseFloat(volume.replace('M', '')) * 1000000;
      } else if (volume.endsWith('K')) {
        numericVolume = parseFloat(volume.replace('K', '')) * 1000;
      } else {
        numericVolume = parseFloat(volume);
      }
    } else {
      numericVolume = parseFloat(volume);
    }
    
    if (isNaN(numericVolume)) return "0";
    
    if (numericVolume >= 1000000) {
      return `${(numericVolume / 1000000).toFixed(1)}M`;
    } else if (numericVolume >= 1000) {
      return `${(numericVolume / 1000).toFixed(1)}K`;
    }
    return numericVolume.toString();
  };

  // Format phần trăm thay đổi
  const formatChange = (change) => {
    if (change === null || change === undefined) return '0.00%';
    
    // Chuyển đổi và kiểm tra giá trị
    let numericChange = parseFloat(change);
    if (isNaN(numericChange)) return '0.00%';
    
    return numericChange > 0 
      ? `+${numericChange.toFixed(2)}%` 
      : `${numericChange.toFixed(2)}%`;
  };

  // Phân loại cổ phiếu vào các ngành và lấy top 5 volume cao nhất
  const groupStocksBySector = () => {
    if (!sectorData || sectorData.length === 0) return [];
    
    const groupedData = {};
    sectorStructure.forEach(sector => {
      groupedData[sector.id] = {
        name: sector.name,
        row: sector.row,
        stocks: []
      };
    });
    
    sectorData.forEach(sector => {
      if (!sector.stocks || sector.stocks.length === 0) return;
      
      const matchingSector = sectorStructure.find(s => 
        sector.name.toLowerCase().includes(s.name.toLowerCase()) || 
        s.name.toLowerCase().includes(sector.name.toLowerCase())
      );
      
      if (matchingSector) {
        sector.stocks.forEach(stock => {
          const volume = parseVolume(stock.volume);
          if (volume > 0) {
            groupedData[matchingSector.id].stocks.push({
              ...stock,
              numericVolume: volume
            });
          }
        });
      }
    });
    
    // Sắp xếp và lấy top 5 cổ phiếu có volume cao nhất trong mỗi ngành
    Object.keys(groupedData).forEach(sectorId => {
      groupedData[sectorId].stocks.sort((a, b) => b.numericVolume - a.numericVolume);
      groupedData[sectorId].stocks = groupedData[sectorId].stocks.slice(0, 5);
    });
    
    return groupedData;
  };

  // Render giao diện heatmap
  const renderHeatmap = () => {
    if (!sectorData || sectorData.length === 0) {
      return <div className="text-center text-white mt-10">Không có dữ liệu</div>;
    }
    
    const groupedData = groupStocksBySector();
    
    const renderSectorRow = (rowNum) => {
      const sectorsInRow = sectorStructure.filter(s => s.row === rowNum);
      
      if (sectorsInRow.length === 0) return null;
      
      return (
        <div className="flex gap-4 mb-4">
          {sectorsInRow.map(sector => {
            const sectorData = groupedData[sector.id];
            if (!sectorData || !sectorData.stocks || sectorData.stocks.length === 0) return null;
            
            return (
              <div key={sector.id} className="flex-1">
                <div className="text-[10px] text-white font-medium p-1 mb-2 bg-[#1C1C28] text-center">
                  {sector.name}
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {sectorData.stocks.map((stock, index) => {
                    const changeValue = parseFloat(stock.percentageChange || 0);
                    
                    return (
                      <div 
                        key={`${stock.ticketSymbol}-${index}`} 
                        className={`${getColorByChange(changeValue)} ${getTileSize(stock.volume)} flex flex-col items-center justify-center text-white border border-[#0a0a14] border-opacity-20`}
                      >
                        <div className="font-bold">{stock.ticketSymbol}</div>
                        <div className="opacity-80 text-[10px]">{stock.volume}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      );
    };
    
    return (
      <div className="flex flex-col p-4">
        {renderSectorRow(0)}
        {renderSectorRow(1)}
        {renderSectorRow(2)}
      </div>
    );
  };

  return (
    <div className="bg-[#0a0a14] h-[calc(100vh-132px)] flex flex-col">
      {/* Tab Menu */}
      <div className="border-b border-[#1C1C28] shrink-0">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`px-3 py-1 text-xs ${
                activeTab === tab.id 
                  ? 'text-white border-b-2 border-[#26A65B]' 
                  : 'text-[#808191] hover:text-white'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sub Menu */}
      <div className="border-b border-[#1C1C28] bg-[#0E0E15] px-1 shrink-0">
        <div className="flex items-center h-6 overflow-x-auto">
          {subTabs.map(tab => (
            <button
              key={tab.id}
              className={`px-2 text-xs whitespace-nowrap ${
                activeSubTab === tab.id
                  ? 'text-white bg-[#1C1C28] rounded'
                  : 'text-[#808191] hover:text-white'
              }`}
              onClick={() => setActiveSubTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap Content */}
      <div className="flex-1 overflow-hidden p-0">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#26A65B]"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col justify-center items-center h-full text-white">
            <p className="text-sm mb-2">{error}</p>
            <Button 
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs py-1 px-2"
              onClick={fetchHeatmapData}
            >
              Thử lại
            </Button>
          </div>
        ) : (
          renderHeatmap()
        )}
      </div>
    </div>
  );
};

export default HeatmapPage; 