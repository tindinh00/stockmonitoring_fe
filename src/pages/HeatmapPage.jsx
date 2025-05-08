import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from "sonner";
import Cookies from 'js-cookie';

const HeatmapPage = () => {
  const [activeTab, setActiveTab] = useState('hose');
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

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
            'Content-Type': 'application/json',
            'appname': 'STOCK_MONITORING'
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

  // Format số thành dạng phần trăm
  const formatChange = (change) => {
    if (!change && change !== 0) return '0.00%';
    if (change > 0) return `+${formatDecimal(change)}%`;
    return `${formatDecimal(change)}%`;
  };
  
  // Hiển thị tooltip chi tiết
  const showDetails = (event, stock) => {
    const tooltip = document.getElementById('stock-tooltip');
    if (!tooltip) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Kiểm tra xem tooltip cần hiển thị ở trên hay dưới
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceRight = window.innerWidth - rect.left;
    
    // Thiết lập nội dung tooltip
    tooltip.innerHTML = `
      <div class="p-1 text-xs">
        <div>TC: ${formatDecimal(stock.priorClosePrice)}</div>
        <div>Trần: ${formatDecimal(stock.ceilPrice)}</div>
        <div>Sàn: ${formatDecimal(stock.floorPrice)}</div>
        <div>Giá: ${formatDecimal(stock.matchPrice)}</div>
        <div>KL: ${formatNumber(stock.volume)}</div>
        <div>%KL: ${formatDecimal(stock.volumePercent || 0)}%</div>
      </div>
    `;
    
    // Đặt vị trí tooltip
    tooltip.style.display = 'block';
    
    // Xử lý vị trí theo chiều dọc
    if (spaceBelow < 150) {
      tooltip.style.top = 'auto';
      tooltip.style.bottom = (containerRect.bottom - rect.top + 5) + 'px';
    } else {
      tooltip.style.top = (rect.bottom - containerRect.top + 5) + 'px';
      tooltip.style.bottom = 'auto';
    }
    
    // Xử lý vị trí theo chiều ngang
    if (spaceRight < 150) {
      tooltip.style.right = '5px';
      tooltip.style.left = 'auto';
    } else {
      tooltip.style.left = rect.left - containerRect.left + 'px';
      tooltip.style.right = 'auto';
    }
  };
  
  // Ẩn tooltip chi tiết
  const hideDetails = () => {
    const tooltip = document.getElementById('stock-tooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#0a0a14] h-[calc(100vh-132px)] flex items-center justify-center">
        <div className="text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  // Định nghĩa cấu trúc hiển thị
  const sectorLayout = [
    { 
      name: 'Bất động sản', 
      sector: 'Bất động sản',
      colSpan: 3,
      rowSpan: 4,
      gridArea: '1 / 1 / span 4 / span 3',
      maxStocks: 10
    },
    { 
      name: 'Nguyên vật liệu', 
      sector: 'Nguyên vật liệu',
      colSpan: 3,
      rowSpan: 4,
      gridArea: '1 / 4 / span 4 / span 3',
      maxStocks: 10
    },
    { 
      name: 'Hàng tiêu dùng thiết yếu', 
      sector: 'Hàng tiêu dùng thiết yếu',
      colSpan: 3,
      rowSpan: 3,
      gridArea: '1 / 7 / span 3 / span 3',
      maxStocks: 10
    },
    { 
      name: 'Tài chính', 
      sector: 'Tài chính',
      colSpan: 3,
      rowSpan: 3,
      gridArea: '1 / 10 / span 3 / span 3',
      maxStocks: 10
    },
    { 
      name: 'Công nghiệp', 
      sector: 'Công nghiệp',
      colSpan: 3,
      rowSpan: 3,
      gridArea: '1 / 13 / span 3 / span 3',
      maxStocks: 10
    },
    { 
      name: 'Dịch vụ tiêu dùng', 
      sector: 'Dịch vụ tiện ích',
      colSpan: 3,
      rowSpan: 3,
      gridArea: '5 / 1 / span 3 / span 3',
      maxStocks: 10
    },
    { 
      name: 'Hàng tiêu dùng', 
      sector: 'Hàng tiêu dùng',
      colSpan: 3,
      rowSpan: 3,
      gridArea: '5 / 4 / span 3 / span 3',
      maxStocks: 10
    },
    { 
      name: 'Chăm sóc sức khỏe', 
      sector: 'Chăm sóc sức khỏe',
      colSpan: 3,
      rowSpan: 3,
      gridArea: '4 / 7 / span 3 / span 3',
      maxStocks: 8
    },
    { 
      name: 'Công nghệ thông tin', 
      sector: 'Công nghệ thông tin',
      colSpan: 3,
      rowSpan: 3,
      gridArea: '4 / 10 / span 3 / span 3',
      maxStocks: 8
    },
    { 
      name: 'Dịch vụ viễn thông', 
      sector: 'Dịch vụ viễn thông',
      colSpan: 3,
      rowSpan: 3,
      gridArea: '4 / 13 / span 3 / span 3',
      maxStocks: 8
    },
    { 
      name: 'Năng lượng', 
      sector: 'Năng lượng',
      colSpan: 3,
      rowSpan: 2,
      gridArea: '7 / 7 / span 2 / span 9',
      maxStocks: 10
    }
  ];

  // Lấy dữ liệu cổ phiếu theo tên ngành
  const getSectorStocks = (sectorName) => {
    if (!heatmapData?.sectors) return [];
    const sector = heatmapData.sectors.find(s => s.name === sectorName);
    if (!sector) return [];
    
    return sector.stocks.map(stock => ({
      ...stock,
      volumePercent: parseFloat(stock.volumePercent || 0)
    })).sort((a, b) => b.volumePercent - a.volumePercent);
  };

  // Hàm tính kích thước dựa trên phần trăm khối lượng
  const calculateStockSize = (volumePercent, sector) => {
    // Special case for very high volume stocks
    if (volumePercent >= 45) return { colSpan: 3, rowSpan: 2 }; // IDJ (48.66%)
    if (volumePercent >= 30) return { colSpan: 3, rowSpan: 1 }; // DDG (74.55%)
    if (volumePercent >= 25) return { colSpan: 2, rowSpan: 2 }; // LDP, SED
    if (volumePercent >= 20) return { colSpan: 2, rowSpan: 1 }; // PPT, MST, etc.
    if (volumePercent >= 15) return { colSpan: 1, rowSpan: 2 }; // HCC, etc.
    return { colSpan: 1, rowSpan: 1 };
  };

  return (
    <div className="bg-white dark:bg-[#0a0a14] h-[calc(100vh-132px)] flex flex-col">
      {/* Tab headers */}
      <div className="border-b border-gray-200 dark:border-[#1C1C28] shrink-0">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`px-4 py-1 text-sm ${
                activeTab === tab.id 
                  ? 'text-gray-900 dark:text-white border-b-2 border-[#26A65B]' 
                  : 'text-gray-500 dark:text-[#808191] hover:text-gray-900 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 relative overflow-auto" ref={containerRef}>
        {/* Tooltip Element */}
        <div 
          id="stock-tooltip" 
          className="bg-[#1C1C28] text-white rounded shadow-lg absolute z-50 whitespace-nowrap"
          style={{ display: 'none' }}
        ></div>

        {/* Custom Grid Layout */}
        <div className="h-auto min-h-full grid grid-cols-15 gap-0.5 p-1">
          {sectorLayout.map((sectorConfig, index) => {
            const stocks = getSectorStocks(sectorConfig.sector).slice(0, sectorConfig.maxStocks);
            return (
              <div
                key={index}
                className="bg-[#0a0a14] border border-[#1C1C28] relative flex flex-col"
                style={{ gridArea: sectorConfig.gridArea }}
              >
                <div className="bg-[#1C1C28] px-1 py-0.5 text-white text-xs font-medium sticky top-0 z-10">
                  {sectorConfig.name}
                </div>
                
                <div className="flex-1 grid gap-px p-px overflow-visible" 
                  style={{
                    gridTemplateColumns: `repeat(${Math.min(6, sectorConfig.colSpan * 2)}, minmax(32px, 1fr))`,
                    gridAutoRows: 'minmax(30px, auto)'
                  }}
                >
                  {stocks.map((stock, idx) => {
                    // Tính toán kích thước dựa trên phần trăm khối lượng và ngành
                    const { colSpan, rowSpan } = calculateStockSize(stock.volumePercent, sectorConfig.sector);
                    
                    // Điều chỉnh cỡ chữ dựa trên kích thước ô
                    const fontSize = colSpan > 1 || rowSpan > 1 ? 'text-sm' : 'text-xs';
                    const changeSize = colSpan > 1 || rowSpan > 1 ? 'text-xs' : 'text-[10px]';
                    
                    return (
                      <div
                        key={stock.ticketSymbol}
                        className={`${getColorByChange(stock.plusMinus)} flex flex-col items-center justify-center text-white cursor-pointer`}
                        style={{
                          gridColumn: `span ${Math.min(colSpan, 3)}`,
                          gridRow: `span ${Math.min(rowSpan, 2)}`
                        }}
                        onMouseEnter={(e) => showDetails(e, stock)}
                        onMouseLeave={hideDetails}
                      >
                        <div className={`font-semibold ${fontSize}`}>
                          {stock.ticketSymbol}
                        </div>
                        <div className={`${changeSize}`}>
                          {formatChange(stock.plusMinus)}
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