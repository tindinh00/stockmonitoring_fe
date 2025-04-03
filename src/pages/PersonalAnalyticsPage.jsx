import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getUserId } from '@/api/Api';
import { stockService, mockAnalyticStocks } from '@/api/StockApi';
import { toast } from "sonner";
import { ArrowUpDown, ArrowDown, ArrowUp, Info, Loader2 } from 'lucide-react';

const PersonalAnalyticsPage = () => {
  const [stocks, setStocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState('code');
  const [sortDirection, setSortDirection] = useState('asc');
  const [activeTab, setActiveTab] = useState('technical'); // 'technical', 'fundamental', 'risk'
  
  useEffect(() => {
    fetchStocksData();
  }, []);

  const fetchStocksData = async () => {
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
      const watchlistResponse = await stockService.getWatchlistByUser(userId);
      console.log("Watchlist response:", watchlistResponse);
      
      if (watchlistResponse && watchlistResponse.value) {
        const watchlistCodes = watchlistResponse.value;
        
        if (watchlistCodes.length === 0) {
          setStocks([]);
          setIsLoading(false);
          return;
        }
        
        // Gọi API để lấy dữ liệu chi tiết của các mã CK
        const stockResponse = await stockService.getStockInSession();
        
        if (stockResponse && stockResponse.value && stockResponse.value.data) {
          // Lọc ra chỉ các mã CK có trong watchlist
          const watchlistStocks = stockResponse.value.data.filter(
            stock => watchlistCodes.includes(stock.stockCode)
          ).map(stock => {
            // Tìm dữ liệu phân tích từ dữ liệu giả
            const analyticData = mockAnalyticStocks.find(
              analyticStock => analyticStock.code === stock.stockCode
            ) || {
              pe: calculateRandomMetric(5, 25),
              pb: calculateRandomMetric(0.5, 5),
              eps: calculateRandomMetric(1000, 10000),
              roe: calculateRandomMetric(5, 30),
              roa: calculateRandomMetric(2, 20),
              dividend: calculateRandomMetric(0, 10),
              rsi: calculateRandomMetric(0, 100),
              macd: calculateRandomMetric(-2, 2),
              signal: calculateRandomMetric(-2, 2),
              beta: calculateRandomMetric(0.5, 2),
              volatility: calculateRandomMetric(10, 50),
              sharpe: calculateRandomMetric(-1, 3),
              risk: calculateRiskRating(),
              recommendation: calculateRecommendation()
            };
            
            return {
              code: stock.stockCode,
              name: stock.stockName || `Cổ phiếu ${stock.stockCode}`,
              currentPrice: stock.matchPrice?.toFixed(2) || '--',
              change: stock.plusMinus || 0,
              changeFormatted: stock.plusMinus ? `${stock.plusMinus > 0 ? '+' : ''}${stock.plusMinus.toFixed(2)}%` : '--',
              volume: stock.volumeAccumulation || 0,
              volumeFormatted: stock.volumeAccumulation?.toLocaleString() || '--',
              ceiling: stock.ceilPrice?.toFixed(2) || '--',
              floor: stock.floorPrice?.toFixed(2) || '--',
              reference: stock.priorClosePrice?.toFixed(2) || '--',
              high: stock.highPrice?.toFixed(2) || '--',
              low: stock.lowPrice?.toFixed(2) || '--',
              openPrice: stock.openPrice?.toFixed(2) || '--',
              foreignBuy: stock.foreignBuyVolume?.toLocaleString() || '--',
              foreignSell: stock.foreignSellVolume?.toLocaleString() || '--',
              
              // Thêm các chỉ số phân tích từ dữ liệu giả
              pe: analyticData.pe,
              pb: analyticData.pb, 
              eps: analyticData.eps,
              roe: analyticData.roe,
              roa: analyticData.roa,
              dividend: analyticData.dividend,
              
              // Các chỉ số kỹ thuật
              rsi: analyticData.rsi,
              macd: analyticData.macd,
              signal: analyticData.signal,
              ma20: analyticData.ma20 || calculateRandomMetric(
                parseFloat(stock.matchPrice || 0) * 0.95, 
                parseFloat(stock.matchPrice || 0) * 1.05
              ),
              ma50: analyticData.ma50 || calculateRandomMetric(
                parseFloat(stock.matchPrice || 0) * 0.9, 
                parseFloat(stock.matchPrice || 0) * 1.1
              ),
              ma200: analyticData.ma200 || calculateRandomMetric(
                parseFloat(stock.matchPrice || 0) * 0.85, 
                parseFloat(stock.matchPrice || 0) * 1.15
              ),
              
              // Phân tích rủi ro
              beta: analyticData.beta,
              volatility: analyticData.volatility,
              sharpe: analyticData.sharpe,
              targetPrice: analyticData.targetPrice || calculateRandomMetric(
                parseFloat(stock.matchPrice || 0) * 1.05, 
                parseFloat(stock.matchPrice || 0) * 1.25
              ),
              stopLoss: analyticData.stopLoss || calculateRandomMetric(
                parseFloat(stock.matchPrice || 0) * 0.8, 
                parseFloat(stock.matchPrice || 0) * 0.95
              ),
              risk: analyticData.risk || calculateRiskRating(),
              recommendation: analyticData.recommendation || calculateRecommendation()
            };
          });
          
          setStocks(watchlistStocks);
          
          // Nếu không có dữ liệu từ API, thêm vài dữ liệu giả để hiển thị UI
          if (watchlistStocks.length === 0) {
            const fakeDemoData = mockAnalyticStocks.slice(0, 5).map(stock => ({
              ...stock,
              currentPrice: String(stock.currentPrice),
              changeFormatted: `${stock.change > 0 ? '+' : ''}${stock.change.toFixed(2)}%`,
              volumeFormatted: stock.volume.toLocaleString()
            }));
            setStocks(fakeDemoData);
            
            // Hiển thị thông báo
            toast.info("Đang hiển thị dữ liệu mẫu cho mục đích demo", {
              description: "Thêm cổ phiếu vào danh sách theo dõi để xem phân tích thực tế",
              duration: 5000
            });
          }
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
      // Hiển thị dữ liệu mẫu trong trường hợp lỗi
      const fakeDemoData = mockAnalyticStocks.slice(0, 5).map(stock => ({
        ...stock,
        currentPrice: String(stock.currentPrice),
        changeFormatted: `${stock.change > 0 ? '+' : ''}${stock.change.toFixed(2)}%`,
        volumeFormatted: stock.volume.toLocaleString()
      }));
      setStocks(fakeDemoData);
      
      toast.error("Có lỗi khi tải dữ liệu, đang hiển thị dữ liệu mẫu", {
        description: error.message || "Vui lòng thử lại sau",
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm tạo số ngẫu nhiên trong khoảng
  const calculateRandomMetric = (min, max) => {
    return Math.random() * (max - min) + min;
  };

  // Hàm tạo xếp hạng rủi ro
  const calculateRiskRating = () => {
    const ratings = ['Thấp', 'Trung bình', 'Cao'];
    return ratings[Math.floor(Math.random() * ratings.length)];
  };

  // Hàm tạo khuyến nghị
  const calculateRecommendation = () => {
    const recommendations = ['Mua', 'Nắm giữ', 'Bán'];
    return recommendations[Math.floor(Math.random() * recommendations.length)];
  };

  // Hàm sắp xếp dữ liệu
  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    
    const sortedStocks = [...stocks].sort((a, b) => {
      let valA = a[field];
      let valB = b[field];
      
      // Chuyển đổi string sang số nếu cần thiết
      if (typeof valA === 'string' && !isNaN(parseFloat(valA))) {
        valA = parseFloat(valA);
      }
      if (typeof valB === 'string' && !isNaN(parseFloat(valB))) {
        valB = parseFloat(valB);
      }
      
      // So sánh
      if (valA < valB) return newDirection === 'asc' ? -1 : 1;
      if (valA > valB) return newDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setStocks(sortedStocks);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 text-[#666]" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-[#09D1C7]" />
      : <ArrowDown className="h-4 w-4 text-[#09D1C7]" />;
  };

  // Render các tabs
  const renderTabs = () => (
    <div className="flex border-b border-[#333] mb-4">
      <button
        className={`px-4 py-2 text-sm font-medium ${
          activeTab === 'technical' 
            ? 'text-[#09D1C7] border-b-2 border-[#09D1C7]' 
            : 'text-[#999] hover:text-white'
        }`}
        onClick={() => setActiveTab('technical')}
      >
        Phân tích kỹ thuật
      </button>
      <button
        className={`px-4 py-2 text-sm font-medium ${
          activeTab === 'fundamental' 
            ? 'text-[#09D1C7] border-b-2 border-[#09D1C7]' 
            : 'text-[#999] hover:text-white'
        }`}
        onClick={() => setActiveTab('fundamental')}
      >
        Phân tích cơ bản
      </button>
      <button
        className={`px-4 py-2 text-sm font-medium ${
          activeTab === 'risk' 
            ? 'text-[#09D1C7] border-b-2 border-[#09D1C7]' 
            : 'text-[#999] hover:text-white'
        }`}
        onClick={() => setActiveTab('risk')}
      >
        Phân tích rủi ro
      </button>
    </div>
  );

  // Render table dựa vào active tab
  const renderTable = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-[#09D1C7] animate-spin mb-4" />
          <p className="text-[#999]">Đang tải dữ liệu phân tích...</p>
        </div>
      );
    }
    
    if (stocks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-[#252525] rounded-full flex items-center justify-center mb-4">
            <Info className="h-8 w-8 text-[#666]" />
          </div>
          <h3 className="text-white font-medium mb-2">Không có dữ liệu</h3>
          <p className="text-[#666] max-w-md">
            Bạn chưa có cổ phiếu nào trong danh sách theo dõi. Vui lòng thêm cổ phiếu vào danh sách theo dõi để xem phân tích.
          </p>
        </div>
      );
    }
    
    switch (activeTab) {
      case 'technical':
        return (
          <div className="w-full">
            <table className="w-full border-collapse min-w-full">
              <thead className="bg-[#1a1a1a] sticky top-0">
                <tr>
                  {renderHeaderCell('code', 'Mã')}
                  {renderHeaderCell('currentPrice', 'Giá')}
                  {renderHeaderCell('change', 'Thay đổi')}
                  {renderHeaderCell('volume', 'Khối lượng')}
                  {renderHeaderCell('rsi', 'RSI', 'Relative Strength Index - Chỉ báo sức mạnh tương đối. <30: quá bán, >70: quá mua')}
                  {renderHeaderCell('macd', 'MACD', 'Moving Average Convergence Divergence - Chỉ báo xu hướng dựa trên đường trung bình động')}
                  {renderHeaderCell('signal', 'Signal', 'Đường tín hiệu của MACD, làm cơ sở để đưa ra quyết định mua/bán')}
                  {renderHeaderCell('ma20', 'MA20', 'Đường trung bình động 20 phiên')}
                  {renderHeaderCell('ma50', 'MA50', 'Đường trung bình động 50 phiên')}
                  {renderHeaderCell('ma200', 'MA200', 'Đường trung bình động 200 phiên')}
                  {renderHeaderCell('recommendation', 'Khuyến nghị', 'Khuyến nghị dựa trên các chỉ báo kỹ thuật')}
                </tr>
              </thead>
              <tbody className="bg-[#0a0a14]">
                {stocks.map((stock) => (
                  <tr key={stock.code} className="hover:bg-[#1a1a1a] border-b border-[#333]">
                    <td className="px-3 py-3 font-medium text-white w-[10%] text-center">{stock.code}</td>
                    {renderValueCell(parseFloat(stock.currentPrice), 'price', 'w-[8%]')}
                    {renderValueCell(stock.change, 'change', 'w-[9%]')}
                    {renderValueCell(stock.volume, 'volume', 'w-[11%]')}
                    {renderValueCell(stock.rsi, 'rsi', 'w-[7%]')}
                    {renderValueCell(stock.macd, 'macd', 'w-[8%]')}
                    {renderValueCell(stock.signal, 'macd', 'w-[8%]')}
                    {renderValueCell(stock.ma20, 'price', 'w-[8%]')}
                    {renderValueCell(stock.ma50, 'price', 'w-[8%]')}
                    {renderValueCell(stock.ma200, 'price', 'w-[8%]')}
                    {renderValueCell(stock.recommendation, 'recommendation', 'w-[15%]')}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        
      case 'fundamental':
        return (
          <div className="w-full">
            <table className="w-full border-collapse min-w-full">
              <thead className="bg-[#1a1a1a] sticky top-0">
                <tr>
                  {renderHeaderCell('code', 'Mã')}
                  {renderHeaderCell('currentPrice', 'Giá')}
                  {renderHeaderCell('change', 'Thay đổi')}
                  {renderHeaderCell('pe', 'P/E', 'Price to Earnings Ratio - Tỷ lệ giá trên thu nhập')}
                  {renderHeaderCell('pb', 'P/B', 'Price to Book Ratio - Tỷ lệ giá trên giá trị sổ sách')}
                  {renderHeaderCell('eps', 'EPS', 'Earnings Per Share - Thu nhập trên mỗi cổ phiếu')}
                  {renderHeaderCell('roe', 'ROE', 'Return on Equity - Tỷ suất sinh lợi trên vốn chủ sở hữu')}
                  {renderHeaderCell('roa', 'ROA', 'Return on Assets - Tỷ suất sinh lợi trên tài sản')}
                  {renderHeaderCell('dividend', 'Cổ tức %', 'Tỷ lệ cổ tức hàng năm')}
                  {renderHeaderCell('recommendation', 'Khuyến nghị', 'Khuyến nghị dựa trên các chỉ số tài chính')}
                </tr>
              </thead>
              <tbody className="bg-[#0a0a14]">
                {stocks.map((stock) => (
                  <tr key={stock.code} className="hover:bg-[#1a1a1a] border-b border-[#333]">
                    <td className="px-3 py-3 font-medium text-white w-[10%] text-center">{stock.code}</td>
                    {renderValueCell(parseFloat(stock.currentPrice), 'price', 'w-[9%]')}
                    {renderValueCell(stock.change, 'change', 'w-[10%]')}
                    {renderValueCell(stock.pe, 'pe', 'w-[9%]')}
                    {renderValueCell(stock.pb, 'pb', 'w-[9%]')}
                    {renderValueCell(stock.eps, 'default', 'w-[12%]')}
                    {renderValueCell(stock.roe, 'percentage', 'w-[9%]')}
                    {renderValueCell(stock.roa, 'percentage', 'w-[9%]')}
                    {renderValueCell(stock.dividend, 'percentage', 'w-[10%]')}
                    {renderValueCell(stock.recommendation, 'recommendation', 'w-[13%]')}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        
      case 'risk':
        return (
          <div className="w-full">
            <table className="w-full border-collapse min-w-full">
              <thead className="bg-[#1a1a1a] sticky top-0">
                <tr>
                  {renderHeaderCell('code', 'Mã')}
                  {renderHeaderCell('currentPrice', 'Giá')}
                  {renderHeaderCell('change', 'Thay đổi')}
                  {renderHeaderCell('beta', 'Beta', 'Đo lường mức độ biến động của cổ phiếu so với thị trường chung')}
                  {renderHeaderCell('volatility', 'Biến động', 'Độ biến động của giá cổ phiếu')}
                  {renderHeaderCell('sharpe', 'Sharpe Ratio', 'Chỉ số đo lường hiệu suất sinh lời đã điều chỉnh theo rủi ro')}
                  {renderHeaderCell('targetPrice', 'Giá mục tiêu', 'Giá dự báo trong tương lai')}
                  {renderHeaderCell('stopLoss', 'Stop Loss', 'Mức giá nên bán để hạn chế lỗ')}
                  {renderHeaderCell('risk', 'Mức độ rủi ro', 'Đánh giá mức độ rủi ro tổng thể')}
                  {renderHeaderCell('recommendation', 'Khuyến nghị', 'Khuyến nghị dựa trên mức độ rủi ro')}
                </tr>
              </thead>
              <tbody className="bg-[#0a0a14]">
                {stocks.map((stock) => (
                  <tr key={stock.code} className="hover:bg-[#1a1a1a] border-b border-[#333]">
                    <td className="px-3 py-3 font-medium text-white w-[10%] text-center">{stock.code}</td>
                    {renderValueCell(parseFloat(stock.currentPrice), 'price', 'w-[8%]')}
                    {renderValueCell(stock.change, 'change', 'w-[9%]')}
                    {renderValueCell(stock.beta, 'default', 'w-[7%]')}
                    {renderValueCell(stock.volatility, 'percentage', 'w-[10%]')}
                    {renderValueCell(stock.sharpe, 'default', 'w-[12%]')}
                    {renderValueCell(stock.targetPrice, 'price', 'w-[10%]')}
                    {renderValueCell(stock.stopLoss, 'price', 'w-[10%]')}
                    {renderValueCell(stock.risk, 'risk', 'w-[12%]')}
                    {renderValueCell(stock.recommendation, 'recommendation', 'w-[12%]')}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        
      default:
        return null;
    }
  };

  // Render color-coded cell dựa trên giá trị
  const renderValueCell = (value, type, widthClass = '') => {
    let color = 'text-white';
    let formattedValue = value;
    
    // Format số và xác định màu sắc
    if (typeof value === 'number') {
      switch (type) {
        case 'percentage':
          formattedValue = value.toFixed(2) + '%';
          color = value > 0 ? 'text-[#00FF00]' : value < 0 ? 'text-[#FF4A4A]' : 'text-white';
          break;
        case 'price':
          formattedValue = value.toFixed(2);
          break;
        case 'change':
          formattedValue = (value > 0 ? '+' : '') + value.toFixed(2) + '%';
          color = value > 0 ? 'text-[#00FF00]' : value < 0 ? 'text-[#FF4A4A]' : 'text-white';
          break;
        case 'rsi':
          formattedValue = value.toFixed(1);
          if (value >= 70) color = 'text-[#FF4A4A]'; // Overbought
          else if (value <= 30) color = 'text-[#00FF00]'; // Oversold
          break;
        case 'macd':
          formattedValue = value.toFixed(3);
          color = value > 0 ? 'text-[#00FF00]' : 'text-[#FF4A4A]';
          break;
        case 'pe':
          formattedValue = value.toFixed(2);
          color = value < 15 ? 'text-[#00FF00]' : value > 25 ? 'text-[#FF4A4A]' : 'text-[#F4BE37]';
          break;
        case 'pb':
          formattedValue = value.toFixed(2);
          color = value < 1 ? 'text-[#00FF00]' : value > 3 ? 'text-[#FF4A4A]' : 'text-[#F4BE37]';
          break;
        case 'recommendation':
          switch (value) {
            case 'Mua': color = 'text-[#00FF00]'; break;
            case 'Bán': color = 'text-[#FF4A4A]'; break;
            default: color = 'text-[#F4BE37]'; // Nắm giữ
          }
          break;
        case 'risk':
          switch (value) {
            case 'Thấp': color = 'text-[#00FF00]'; break;
            case 'Cao': color = 'text-[#FF4A4A]'; break;
            default: color = 'text-[#F4BE37]'; // Trung bình
          }
          break;
        case 'volume':
          formattedValue = value.toLocaleString();
          break;
        default:
          formattedValue = value.toLocaleString();
      }
    }
    
    return (
      <td className={`px-3 py-3 ${color} ${widthClass} text-center`}>
        {formattedValue}
      </td>
    );
  };

  // Render header cell
  const renderHeaderCell = (field, label, tooltip = null) => (
    <th 
      className="px-3 py-3 text-sm font-medium text-[#999] cursor-pointer hover:bg-[#252525] transition-colors whitespace-nowrap"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center justify-center gap-1">
        <span>{label}</span>
        {getSortIcon(field)}
        {tooltip && (
          <div className="relative group">
            <Info className="h-4 w-4 text-[#666] opacity-70" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-[#333] rounded-md text-xs text-white w-48 invisible group-hover:visible z-10 shadow-lg border border-[#444]">
              {tooltip}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#333]"></div>
            </div>
          </div>
        )}
      </div>
    </th>
  );

  return (
    <div className="bg-[#0a0a14] min-h-screen -mx-4 md:-mx-8">
      {/* Page Header */}
      <div className="px-4 py-6 border-b border-[#1a1a1a]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Phân tích cá nhân</h1>
            <p className="text-[#666]">Phân tích chuyên sâu danh mục cổ phiếu của bạn</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] rounded-lg border border-[#333]">
              <span className="text-[#666]">Cập nhật:</span>
              <span className="text-[#09D1C7] font-medium">
                {new Date().toLocaleTimeString('vi-VN')}
              </span>
            </div>
            <Button
              onClick={fetchStocksData}
              className="bg-[#09D1C7] hover:bg-[#0a8f88] text-white px-4 py-2 rounded-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tải...
                </>
              ) : (
                'Làm mới dữ liệu'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <div className="bg-[#1a1a1a] rounded-xl border border-[#333] overflow-hidden">
          <div className="p-4 border-b border-[#333] flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Phân tích danh mục đầu tư</h2>
            <div className="flex items-center gap-2 text-sm text-[#999]">
              <span>Tổng số cổ phiếu:</span>
              <span className="text-white font-medium">{stocks.length}</span>
            </div>
          </div>
          
          <div className="p-4">
            {renderTabs()}
            {renderTable()}
          </div>
        </div>
        
        <div className="mt-6 text-sm text-[#666] px-4">
          <p>* Lưu ý: Các phân tích trên chỉ mang tính chất tham khảo. Nhà đầu tư cần cân nhắc kỹ trước khi đưa ra quyết định.</p>
          <p>* Dữ liệu được cập nhật định kỳ mỗi ngày giao dịch.</p>
        </div>
      </div>
    </div>
  );
};

export default PersonalAnalyticsPage; 