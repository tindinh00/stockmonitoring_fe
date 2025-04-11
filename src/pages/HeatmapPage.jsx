import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from "sonner";
import Cookies from 'js-cookie';

const HeatmapPage = () => {
  const [activeTab, setActiveTab] = useState('hose');
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'hose', label: 'HOSE', exchange: 'hsx' },
    { id: 'hnx', label: 'HNX', exchange: 'hnx' }
  ];

  // Format number with commas
  const formatNumber = (number) => {
    if (number === undefined || number === null) return '0';
    return number.toLocaleString('en-US');
  };

  // Format decimal number
  const formatDecimal = (number, decimals = 2) => {
    if (number === undefined || number === null) return '0.00';
    return Number(number).toFixed(decimals);
  };

  // Fetch heatmap data
  const fetchHeatmapData = async (exchange) => {
    try {
      setLoading(true);
      const token = Cookies.get('auth_token');
      
      if (!token) {
        toast.error('Vui lòng đăng nhập để xem dữ liệu');
        return;
      }

      const response = await axios.get(
        'https://stockmonitoring-api-gateway.onrender.com/api/heatmap',
        {
          params: {
            exchange: exchange,
            timestamp: null // Get latest data
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data?.value?.data) {
        setHeatmapData(response.data.value.data);
      } else {
        toast.error('Không có dữ liệu heatmap');
      }
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      } else {
        toast.error('Không thể tải dữ liệu heatmap');
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and when tab changes
  useEffect(() => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    fetchHeatmapData(currentTab.exchange);
  }, [activeTab]);

  // Hàm tính màu dựa trên phần trăm thay đổi
  const getColorByChange = (change) => {
    if (!change && change !== 0) return 'bg-[#F0B90B]';
    
    const absChange = Math.abs(change);
    
    if (change > 0) {
      if (absChange >= 6.7) return 'bg-[#006400]'; // Trần
      if (absChange >= 5) return 'bg-[#008000]';
      if (absChange >= 3) return 'bg-[#229954]';
      if (absChange >= 1) return 'bg-[#52BE80]';
      return 'bg-[#82E0AA]';
    }
    
    if (change < 0) {
      if (absChange >= 6.7) return 'bg-[#7C0A02]'; // Sàn
      if (absChange >= 5) return 'bg-[#B41D1D]';
      if (absChange >= 3) return 'bg-[#C92626]';
      if (absChange >= 1) return 'bg-[#D64545]';
      return 'bg-[#FF6B6B]';
    }
    
    return 'bg-[#F0B90B]'; // Tham chiếu
  };

  // Hàm tính kích thước ô dựa trên volume percent
  const getTileSize = (volumePercent) => {
    // Calculate relative size based on volume percentage
    const minSize = 80; // Minimum size in pixels
    const maxSize = 200; // Maximum size in pixels
    const size = minSize + (maxSize - minSize) * (volumePercent / 100);
    return Math.min(maxSize, Math.max(minSize, size));
  };

  // Format số thành dạng phần trăm
  const formatChange = (change) => {
    if (!change && change !== 0) return '0.00%';
    if (change > 0) return `+${formatDecimal(change)}%`;
    return `${formatDecimal(change)}%`;
  };

  if (loading) {
    return (
      <div className="bg-[#0a0a14] h-[calc(100vh-132px)] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Tính toán tỷ lệ kích thước dựa trên vốn hóa hoặc volume
  const calculateSize = (stock, totalValue) => {
    const value = stock.volume || 0;
    return (value / totalValue) * 100;
  };

  // Tổ chức dữ liệu theo ngành
  const organizeDataByIndustry = () => {
    if (!heatmapData?.sectors) return [];

    const industries = {};
    let totalMarketValue = 0;

    // Tính tổng giá trị thị trường
    heatmapData.sectors.forEach(sector => {
      if (sector.name && sector.name !== "Chưa xác định") { // Bỏ qua ngành "Chưa xác định"
        sector.stocks.forEach(stock => {
          totalMarketValue += stock.volume || 0;
        });
      }
    });

    // Tổ chức dữ liệu theo ngành
    heatmapData.sectors.forEach(sector => {
      // Bỏ qua sector không có tên hoặc "Chưa xác định"
      if (!sector.name || sector.name === "Chưa xác định") {
        return;
      }

      const sectorValue = sector.stocks.reduce((sum, stock) => sum + (stock.volume || 0), 0);
      const sectorSize = (sectorValue / totalMarketValue) * 100;

      // Map tên ngành tiếng Anh sang tiếng Việt nếu cần
      const sectorNameMap = {
        'Real Estate': 'Bất động sản',
        'Materials': 'Nguyên vật liệu',
        'Financials': 'Tài chính',
        'Healthcare': 'Chăm sóc sức khỏe',
        'Information Technology': 'Công nghệ thông tin',
        'Industrials': 'Công nghiệp',
        'Consumer Services': 'Dịch vụ tiêu dùng',
        'Telecommunications': 'Dịch vụ viễn thông',
        'Consumer Staples': 'Hàng tiêu dùng',
        'Consumer Discretionary': 'Hàng tiêu dùng thiết yếu',
        'Energy': 'Năng lượng'
        // Thêm các ngành khác nếu cần
      };

      const displayName = sectorNameMap[sector.name] || sector.name;

      industries[displayName] = {
        name: displayName,
        size: sectorSize,
        stocks: sector.stocks
          .filter(stock => stock && stock.ticketSymbol) // Lọc bỏ cổ phiếu không hợp lệ
          .map(stock => ({
            ...stock,
            relativeSize: calculateSize(stock, sectorValue)
          }))
      };
    });

    return industries;
  };

  const industries = organizeDataByIndustry();

  return (
    <div className="bg-[#0a0a14] h-[calc(100vh-132px)] flex flex-col">
      <div className="border-b border-[#1C1C28] shrink-0">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`px-4 py-1.5 text-sm ${
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

      <div className="flex-1 p-1">
        <div className="h-full grid auto-rows-fr gap-0.5" style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))'
        }}>
          {Object.values(industries).map((industry) => {
            // Tính số cột dựa trên tỷ lệ volume
            const columnSpan = Math.max(1, Math.round((industry.size / 100) * 24));
            const rowSpan = Math.max(1, Math.round(columnSpan / 2));
            
            return (
              <div 
                key={industry.name}
                className="relative border border-[#1C1C28] bg-[#1C1C28]/50"
                style={{
                  gridColumn: `span ${columnSpan}`,
                  gridRow: `span ${rowSpan}`
                }}
              >
                <div className="absolute top-0 left-0 right-0 bg-[#1C1C28] text-white text-xs font-medium py-0.5 px-2">
                  {industry.name}
      </div>

                <div className="h-full pt-5 grid gap-px bg-[#1C1C28]" style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
                  gridAutoRows: 'minmax(40px, 1fr)'
                }}>
                  {industry.stocks
                    .filter(stock => stock && stock.ticketSymbol)
                    .sort((a, b) => (b.volumePercent || 0) - (a.volumePercent || 0))
                    .map((stock) => {
                      const stockSpan = (stock.volumePercent || 0) >= 5 ? 2 : 1;
                      return (
                        <div
                          key={stock.ticketSymbol}
                          className={`${getColorByChange(stock.plusMinus)} flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-[1.02] hover:z-10 group`}
                          style={{
                            gridColumn: `span ${stockSpan}`,
                            gridRow: `span ${stockSpan}`
                          }}
                        >
                          <div className="font-bold text-white text-sm">
                            {stock.ticketSymbol}
              </div>
                          <div className="text-white text-xs">
                            {formatChange(stock.plusMinus)}
          </div>

                          <div className="hidden group-hover:block absolute top-full left-1/2 transform -translate-x-1/2 mt-1 p-1.5 bg-[#1C1C28] rounded shadow-lg z-20 whitespace-nowrap">
                            <div className="text-white text-xs space-y-0.5">
                              <div>TC: {formatDecimal(stock.priorClosePrice)}</div>
                              <div>Trần: {formatDecimal(stock.ceilPrice)}</div>
                              <div>Sàn: {formatDecimal(stock.floorPrice)}</div>
                              <div>Giá: {formatDecimal(stock.matchPrice)}</div>
                              <div>KL: {formatNumber(stock.volume)}</div>
                              <div>%KL: {formatDecimal(stock.volumePercent)}%</div>
              </div>
            </div>
          </div>
                      );
                    })}
              </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HeatmapPage; 