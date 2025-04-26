import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getUserId } from '@/api/Api';
import axios from 'axios';
import { toast } from "sonner";
import { ArrowUpDown, ArrowDown, ArrowUp, Info, Loader2, ChevronLeft, ChevronRight, Save, Settings } from 'lucide-react';
import Cookies from 'js-cookie';
import { cn } from "@/lib/utils";

const PersonalAnalyticsPage = () => {
  const [stocks, setStocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState('ticketSymbol');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isUpdatingWeights, setIsUpdatingWeights] = useState(false);
  const [editedWeights, setEditedWeights] = useState({});
  const [isWeightDialogOpen, setIsWeightDialogOpen] = useState(false);
  const itemsPerPage = 5;
  
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

      // Format dates to MM/DD/YY
      const formatDate = (date) => {
        const d = new Date(date);
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const year = String(d.getFullYear()).slice(-2);
        return `${month}/${day}/${year}`;
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
      className="px-3 py-3 text-sm font-medium text-gray-500 dark:text-[#999] cursor-pointer hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors whitespace-nowrap"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center justify-center gap-1">
        <span>{label}</span>
        {getSortIcon(field)}
        {tooltip && (
          <div className="relative group">
            <Info className="h-4 w-4 text-gray-400 dark:text-[#666] opacity-70" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-gray-700 dark:bg-[#333] rounded-md text-xs text-white w-48 invisible group-hover:visible z-10 shadow-lg border border-gray-600 dark:border-[#444]">
              {tooltip}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-700 dark:border-t-[#333]"></div>
            </div>
          </div>
        )}
      </div>
    </th>
  );

  // Xử lý thay đổi trọng số
  const handleWeightChange = (stockId, value) => {
    const numericValue = parseFloat(value) || 0;
    setEditedWeights(prev => ({
      ...prev,
      [stockId]: numericValue
    }));
  };

  // Kiểm tra tổng trọng số
  const calculateTotalWeight = () => {
    const weights = stocks.map(stock => 
      editedWeights[stock.id] !== undefined ? editedWeights[stock.id] : stock.weight
    );
    return weights.reduce((sum, weight) => sum + (weight || 0), 0);
  };

  // Reset edited weights
  const handleOpenWeightDialog = () => {
    setEditedWeights({});
    setIsWeightDialogOpen(true);
  };

  // Cập nhật trọng số
  const handleUpdateWeights = async () => {
    try {
      const totalWeight = calculateTotalWeight();
      
      if (Math.abs(totalWeight - 100) > 0.01) {
        toast.error("Tổng trọng số phải bằng 100%", {
          description: `Tổng hiện tại: ${totalWeight.toFixed(2)}%`
        });
        return;
      }

      setIsUpdatingWeights(true);
      const userId = getUserId();
      
      if (!userId) {
        toast.error("Bạn cần đăng nhập để thực hiện chức năng này");
        return;
      }

      const stockWeights = stocks.map(stock => ({
        stockId: stock.id,
        weight: editedWeights[stock.id] !== undefined ? editedWeights[stock.id] : stock.weight
      }));

      await axios.put(
        'https://stockmonitoring-api-gateway.onrender.com/api/personal-analysis',
        {
          userId: userId,
          stockWeights: stockWeights
        },
        {
          headers: {
            'Authorization': `Bearer ${Cookies.get('auth_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success("Cập nhật trọng số thành công");
      await fetchStocksData(); // Refresh data
      setEditedWeights({}); // Reset edited weights
      setIsWeightDialogOpen(false); // Close dialog
    } catch (error) {
      console.error("Error updating weights:", error);
      toast.error("Không thể cập nhật trọng số", {
        description: error.message || "Vui lòng thử lại sau"
      });
    } finally {
      setIsUpdatingWeights(false);
    }
  };

  // Render value cell with editable weight
  const renderValueCell = (stock, field, type) => {
    // Special handling for weight field
    if (field === 'weight') {
      return (
        <td className="px-3 py-3 text-center">
          <input
            type="number"
            value={editedWeights[stock.id] !== undefined ? editedWeights[stock.id] : stock.weight}
            onChange={(e) => handleWeightChange(stock.id, e.target.value)}
            className="w-16 px-2 py-1 bg-gray-100 dark:bg-[#252525] border border-gray-300 dark:border-[#333] rounded text-gray-900 dark:text-white text-center"
            min="0"
            max="100"
            step="0.01"
          />
        </td>
      );
    }

    // Original renderValueCell logic for other fields
    let color = 'text-gray-900 dark:text-white';
    let formattedValue = stock[field];
    
    switch (type) {
      case 'percentage':
        formattedValue = formattedValue ? `${formattedValue > 0 ? '+' : ''}${formattedValue.toFixed(2)}%` : '--';
        color = formattedValue > 0 ? 'text-[#00FF00]' : formattedValue < 0 ? 'text-[#FF4A4A]' : 'text-gray-900 dark:text-white';
        break;
      case 'beta':
        formattedValue = formattedValue ? `${formattedValue.toFixed(2)}%` : '--';
        break;
      case 'betaWeight':
        formattedValue = formattedValue ? `${formattedValue.toFixed(2)}%` : '--';
        break;
      case 'returnLevel':
        switch (formattedValue) {
          case 'Sinh lời cao': color = 'text-[#00FF00]'; break;
          case 'Sinh lời thấp': color = 'text-[#FF4A4A]'; break;
          default: color = 'text-[#F4BE37]';
        }
        break;
      case 'riskLevel':
        switch (formattedValue) {
          case 'Rủi ro thấp': color = 'text-[#00FF00]'; break;
          case 'Rủi ro cao': color = 'text-[#FF4A4A]'; break;
          default: color = 'text-[#F4BE37]';
        }
        break;
      case 'recommendation':
        switch (formattedValue) {
          case 'Nên mua': color = 'text-[#00FF00]'; break;
          case 'Nên bán': color = 'text-[#FF4A4A]'; break;
          default: color = 'text-[#F4BE37]';
        }
        break;
      case 'number':
        formattedValue = formattedValue?.toFixed(2) || '--';
        break;
      default:
        formattedValue = formattedValue || '--';
    }
    
    return (
      <td className={`px-3 py-3 ${color} text-center`}>
        {formattedValue}
      </td>
    );
  };

  // Tính toán số trang
  const totalPages = Math.ceil(stocks.length / itemsPerPage);

  // Lấy dữ liệu cho trang hiện tại
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return stocks.slice(startIndex, endIndex);
  };

  // Xử lý chuyển trang
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Component phân trang
  const Pagination = () => {
    return (
      <div className="flex items-center justify-end gap-2 mt-4 pb-4">
        <div className="text-sm text-gray-500 dark:text-[#666] mr-2">
          Trang {currentPage} / {totalPages}
        </div>
        <Button
          variant="outline"
          className="bg-transparent border-gray-300 dark:border-[#333] text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#252525] px-2"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
          <Button
            key={pageNum}
            variant={currentPage === pageNum ? "default" : "outline"}
            className={`${
              currentPage === pageNum
                ? "bg-[#09D1C7] hover:bg-[#0a8f88] text-white"
                : "bg-transparent border-gray-300 dark:border-[#333] text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#252525]"
            } w-8 h-8 p-0`}
            onClick={() => handlePageChange(pageNum)}
          >
            {pageNum}
          </Button>
        ))}
        
        <Button
          variant="outline"
          className="bg-transparent border-gray-300 dark:border-[#333] text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-[#252525] px-2"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-[#09D1C7] animate-spin mb-4" />
        <p className="text-gray-500 dark:text-[#999]">Đang tải dữ liệu phân tích...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0a0a14] min-h-screen -mx-4 md:-mx-8">
      {/* Page Header */}
      <div className="px-4 py-6 border-b border-gray-200 dark:border-[#1a1a1a]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Phân tích cá nhân</h1>
            <p className="text-gray-500 dark:text-[#666]">Phân tích chuyên sâu danh mục cổ phiếu của bạn</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleOpenWeightDialog}
              className="bg-[#09D1C7] hover:bg-[#0a8f88] text-white px-4 py-2 rounded-lg"
            >
              <Settings className="mr-2 h-4 w-4" />
              Cài đặt trọng số
            </Button>
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
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#333] overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-[#333] flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Phân tích danh mục đầu tư</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-[#999]">
              <span>Tổng số cổ phiếu:</span>
              <span className="text-gray-900 dark:text-white font-medium">{stocks.length}</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <div className="min-w-full inline-block align-middle">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-[#333] table-fixed">
                  <thead className="bg-white dark:bg-[#1a1a1a] sticky top-0">
                    <tr>
                      <th className="w-[8%] px-3 py-3 text-sm font-medium text-gray-500 dark:text-[#999] cursor-pointer hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors">
                        <div className="flex items-center justify-center gap-1">
                          <span>Mã CK</span>
                          {getSortIcon('ticketSymbol')}
                        </div>
                      </th>
                      <th className="w-[10%] px-3 py-3 text-sm font-medium text-gray-500 dark:text-[#999] cursor-pointer hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors">
                        <div className="flex items-center justify-center gap-1">
                          <span>Trọng số (%)</span>
                          {getSortIcon('weight')}
                          <div className="relative group">
                            <Info className="h-4 w-4 text-gray-400 dark:text-[#666] opacity-70" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-gray-700 dark:bg-[#333] rounded-md text-xs text-white w-48 invisible group-hover:visible z-10">
                              Trọng số của cổ phiếu trong danh mục
                            </div>
                          </div>
                        </div>
                      </th>
                      <th className="w-[10%] px-3 py-3 text-sm font-medium text-gray-500 dark:text-[#999] cursor-pointer hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors">
                        <div className="flex items-center justify-center gap-1">
                          <span>Lợi nhuận</span>
                          {getSortIcon('stockReturn')}
                        </div>
                      </th>
                      <th className="w-[12%] px-3 py-3 text-sm font-medium text-gray-500 dark:text-[#999] cursor-pointer hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors">
                        <div className="flex items-center justify-center gap-1">
                          <span>TS Lợi nhuận</span>
                          {getSortIcon('returnWeight')}
                        </div>
                      </th>
                      <th className="w-[10%] px-3 py-3 text-sm font-medium text-gray-500 dark:text-[#999] cursor-pointer hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors">
                        <div className="flex items-center justify-center gap-1">
                          <span>Beta</span>
                          {getSortIcon('beta')}
                        </div>
                      </th>
                      <th className="w-[10%] px-3 py-3 text-sm font-medium text-gray-500 dark:text-[#999] cursor-pointer hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors">
                        <div className="flex items-center justify-center gap-1">
                          <span>TS Beta</span>
                          {getSortIcon('betaWeight')}
                        </div>
                      </th>
                      <th className="w-[12%] px-3 py-3 text-sm font-medium text-gray-500 dark:text-[#999] cursor-pointer hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors">
                        <div className="flex items-center justify-center gap-1">
                          <span>Mức sinh lời</span>
                          {getSortIcon('returnLevel')}
                        </div>
                      </th>
                      <th className="w-[13%] px-3 py-3 text-sm font-medium text-gray-500 dark:text-[#999] cursor-pointer hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors">
                        <div className="flex items-center justify-center gap-1">
                          <span>Mức độ rủi ro</span>
                          {getSortIcon('riskLevel')}
                        </div>
                      </th>
                      <th className="w-[15%] px-3 py-3 text-sm font-medium text-gray-500 dark:text-[#999] cursor-pointer hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors">
                        <div className="flex items-center justify-center gap-1">
                          <span>Khuyến nghị</span>
                          {getSortIcon('recommendation')}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-50 dark:bg-[#0a0a14] divide-y divide-gray-200 dark:divide-[#333]">
                    {getCurrentPageData().map((stock) => (
                      <tr key={stock.id} className="hover:bg-gray-100 dark:hover:bg-[#1a1a1a]">
                        <td className="px-3 py-3 whitespace-nowrap font-medium text-gray-900 dark:text-white text-center">{stock.ticketSymbol}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-gray-900 dark:text-white text-center">{stock.weight.toFixed(2)}%</td>
                        {renderValueCell(stock, 'stockReturn', 'percentage')}
                        {renderValueCell(stock, 'returnWeight', 'percentage')}
                        {renderValueCell(stock, 'beta', 'beta')}
                        {renderValueCell(stock, 'betaWeight', 'betaWeight')}
                        {renderValueCell(stock, 'returnLevel', 'returnLevel')}
                        {renderValueCell(stock, 'riskLevel', 'riskLevel')}
                        {renderValueCell(stock, 'recommendation', 'recommendation')}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Phân trang */}
          {stocks.length > 0 && <Pagination />}
        </div>
        
        <div className="mt-6 text-sm text-gray-500 dark:text-[#666] px-4">
          <p>* Lưu ý: Các phân tích trên chỉ mang tính chất tham khảo. Nhà đầu tư cần cân nhắc kỹ trước khi đưa ra quyết định.</p>
          <p>* Dữ liệu được cập nhật định kỳ mỗi ngày giao dịch.</p>
        </div>
      </div>

      {/* Weight Edit Dialog */}
      <Dialog open={isWeightDialogOpen} onOpenChange={setIsWeightDialogOpen}>
        <DialogContent className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white border-gray-200 dark:border-[#333] max-w-[480px] p-0">
          <div className="p-6 border-b border-gray-200 dark:border-[#333]">
            <DialogTitle className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Cài đặt trọng số</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-[#666]">
              Điều chỉnh trọng số cho từng cổ phiếu trong danh mục. Tổng trọng số phải bằng 100%.
            </DialogDescription>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-100 dark:bg-[#252525] rounded-lg">
              <span className="text-gray-500 dark:text-[#666]">Tổng trọng số:</span>
              <span className={`font-medium ${
                Math.abs(calculateTotalWeight() - 100) < 0.01 
                  ? 'text-[#09D1C7]' 
                  : 'text-[#FF4A4A]'
              }`}>
                {calculateTotalWeight().toFixed(2)}%
              </span>
            </div>

            <div className="grid grid-cols-[1fr,120px] gap-4">
              <div className="text-gray-500 dark:text-[#999] text-sm">Mã CK</div>
              <div className="text-gray-500 dark:text-[#999] text-sm text-center">Trọng số (%)</div>
            </div>

            <div className="max-h-[320px] overflow-y-auto pr-2 -mr-2">
              <div className="space-y-3">
                {stocks.map((stock) => (
                  <div key={stock.id} className="grid grid-cols-[1fr,120px] gap-4 items-center">
                    <div className="font-medium">{stock.ticketSymbol}</div>
                    <input
                      type="number"
                      value={editedWeights[stock.id] !== undefined ? editedWeights[stock.id] : stock.weight}
                      onChange={(e) => handleWeightChange(stock.id, e.target.value)}
                      className="w-full px-3 py-2 bg-gray-100 dark:bg-[#252525] border border-gray-300 dark:border-[#333] rounded text-gray-900 dark:text-white text-center focus:outline-none focus:border-[#09D1C7]"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-[#333]">
            <Button
              variant="outline"
              onClick={() => {
                setEditedWeights({});
                setIsWeightDialogOpen(false);
              }}
              className="bg-gray-100 dark:bg-[#252525] border-gray-300 dark:border-[#333] text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-[#333] min-w-[100px]"
            >
              Hủy
            </Button>
            <Button
              onClick={handleUpdateWeights}
              className="bg-[#09D1C7] hover:bg-[#0a8f88] text-white min-w-[140px]"
              disabled={isUpdatingWeights || Math.abs(calculateTotalWeight() - 100) > 0.01}
            >
              {isUpdatingWeights ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                'Cập nhật trọng số'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PersonalAnalyticsPage;