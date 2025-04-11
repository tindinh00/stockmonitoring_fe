import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getUserId } from '@/api/Api';
import axios from 'axios';
import { toast } from "sonner";
import { ArrowUpDown, ArrowDown, ArrowUp, Info, Loader2 } from 'lucide-react';
import Cookies from 'js-cookie';

const PersonalAnalyticsPage = () => {
  const [stocks, setStocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState('ticketSymbol');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Add new state for date range
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1), // January 1st of current year
    endDate: new Date() // Current date
  });

  useEffect(() => {
    fetchStocksData();
  }, []);

  const fetchStocksData = async () => {
    try {
      setIsLoading(true);
      
      const token = Cookies.get('auth_token');
      if (!token) {
        toast.error("Vui lòng đăng nhập để xem danh sách theo dõi");
        setIsLoading(false);
        return;
      }
      
      const userId = getUserId();
      if (!userId) {
        toast.error("Không tìm thấy thông tin người dùng");
        setIsLoading(false);
        return;
      }

      // Format dates to DD-MM-YYYY
      const formatDate = (date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      };

      // Gọi API phân tích cá nhân với các tham số mới
      const response = await axios.get(
        `https://stockmonitoring-api-gateway.onrender.com/api/personal-analysis/${userId}`,
        {
          params: {
            startDate: formatDate(dateRange.startDate),
            endDate: formatDate(dateRange.endDate),
            isAsc: sortDirection === 'asc'
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data?.value?.data?.stocks) {
        setStocks(response.data.value.data.stocks);
      } else {
        setStocks([]);
        toast.info("Danh sách phân tích trống", {
          description: "Hãy thêm cổ phiếu vào danh sách theo dõi để xem phân tích",
          duration: 5000
        });
      }
    } catch (error) {
      console.error("Error fetching analysis data:", error);
      if (error.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
      } else {
        toast.error("Không thể tải dữ liệu phân tích", {
          description: error.message || "Vui lòng thử lại sau",
          duration: 5000
        });
      }
      setStocks([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm sắp xếp dữ liệu
  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    
    const sortedStocks = [...stocks].sort((a, b) => {
      let valA = a[field];
      let valB = b[field];
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      
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

  // Render table header cell
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

  // Render value cell
  const renderValueCell = (value, type) => {
    let color = 'text-white';
    let formattedValue = value;
    
    switch (type) {
      case 'percentage':
        formattedValue = value ? `${value > 0 ? '+' : ''}${value.toFixed(2)}%` : '--';
        color = value > 0 ? 'text-[#00FF00]' : value < 0 ? 'text-[#FF4A4A]' : 'text-white';
        break;
      case 'beta':
        formattedValue = value ? `${value.toFixed(2)}%` : '--';
        break;
      case 'betaWeight':
        formattedValue = value ? `${value.toFixed(2)}%` : '--';
        break;
      case 'returnLevel':
        switch (value) {
          case 'Sinh lời cao': color = 'text-[#00FF00]'; break;
          case 'Sinh lời thấp': color = 'text-[#FF4A4A]'; break;
          default: color = 'text-[#F4BE37]';
        }
        break;
      case 'riskLevel':
        switch (value) {
          case 'Rủi ro thấp': color = 'text-[#00FF00]'; break;
          case 'Rủi ro cao': color = 'text-[#FF4A4A]'; break;
          default: color = 'text-[#F4BE37]';
        }
        break;
      case 'recommendation':
        switch (value) {
          case 'Nên mua': color = 'text-[#00FF00]'; break;
          case 'Nên bán': color = 'text-[#FF4A4A]'; break;
          default: color = 'text-[#F4BE37]';
        }
        break;
      case 'number':
        formattedValue = value?.toFixed(2) || '--';
        break;
      default:
        formattedValue = value || '--';
    }
    
    return (
      <td className={`px-3 py-3 ${color} text-center`}>
        {formattedValue}
      </td>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-[#09D1C7] animate-spin mb-4" />
        <p className="text-[#999]">Đang tải dữ liệu phân tích...</p>
      </div>
    );
  }

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
          
          <div className="p-4 overflow-x-auto">
            <table className="w-full border-collapse min-w-full">
              <thead className="bg-[#1a1a1a] sticky top-0">
                <tr>
                  {renderHeaderCell('ticketSymbol', 'Mã CK')}
                  {renderHeaderCell('weight', 'Trọng số', 'Trọng số của cổ phiếu trong danh mục')}
                  {renderHeaderCell('stockReturn', 'Lợi nhuận', 'Tỷ suất sinh lời của cổ phiếu')}
                  {renderHeaderCell('returnWeight', 'TS Lợi nhuận', 'Trọng số lợi nhuận')}
                  {renderHeaderCell('beta', 'Beta', 'Hệ số Beta - Đo lường độ biến động so với thị trường')}
                  {renderHeaderCell('betaWeight', 'TS Beta', 'Trọng số Beta')}
                  {renderHeaderCell('returnLevel', 'Mức sinh lời', 'Đánh giá mức độ sinh lời')}
                  {renderHeaderCell('riskLevel', 'Mức độ rủi ro', 'Đánh giá mức độ rủi ro')}
                  {renderHeaderCell('recommendation', 'Khuyến nghị', 'Khuyến nghị dựa trên phân tích')}
                </tr>
              </thead>
              <tbody className="bg-[#0a0a14]">
                {stocks.map((stock) => (
                  <tr key={stock.id} className="hover:bg-[#1a1a1a] border-b border-[#333]">
                    <td className="px-3 py-3 font-medium text-white text-center">{stock.ticketSymbol}</td>
                    {renderValueCell(stock.weight, 'number')}
                    {renderValueCell(stock.stockReturn, 'percentage')}
                    {renderValueCell(stock.returnWeight, 'percentage')}
                    {renderValueCell(stock.beta, 'beta')}
                    {renderValueCell(stock.betaWeight, 'betaWeight')}
                    {renderValueCell(stock.returnLevel, 'returnLevel')}
                    {renderValueCell(stock.riskLevel, 'riskLevel')}
                    {renderValueCell(stock.recommendation, 'recommendation')}
                  </tr>
                ))}
              </tbody>
            </table>
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