import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getUserId } from '@/api/Api';
import axios from 'axios';
import { toast } from "sonner";
import { ArrowUpDown, ArrowDown, ArrowUp, Info, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import Cookies from 'js-cookie';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from 'lucide-react';
import { cn } from "@/lib/utils";

const ForecastPage = () => {
  const [forecastData, setForecastData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState('ticketSymbol');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Reusable classes for badges
  const badgeClass = "text-xs bg-gray-100 dark:bg-[#252525] text-gray-500 dark:text-[#999] border-gray-200 dark:border-[#333]";

  useEffect(() => {
    fetchForecastData();
  }, []);

  const fetchForecastData = async () => {
    try {
      setIsLoading(true);
      
      const token = Cookies.get('auth_token');
      if (!token) {
        toast.error("Vui lòng đăng nhập để xem dự đoán");
        setIsLoading(false);
        return;
      }
      
      const userId = getUserId();
      if (!userId) {
        toast.error("Không tìm thấy thông tin người dùng");
        setIsLoading(false);
        return;
      }

      const response = await axios.get(
        `https://stockmonitoring-api-gateway.onrender.com/api/forecast/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data?.value?.data) {
        setForecastData(response.data.value.data);
      } else {
        setForecastData(null);
        toast.info("Không có dữ liệu dự đoán", {
          description: "Hãy thêm cổ phiếu vào danh mục để xem dự đoán",
          duration: 5000
        });
      }
    } catch (error) {
      console.error("Error fetching forecast data:", error);
      if (error.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
      } else {
        toast.error("Không thể tải dữ liệu dự đoán", {
          description: error.message || "Vui lòng thử lại sau",
          duration: 5000
        });
      }
      setForecastData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    
    const sortedStocks = [...forecastData.stocks].sort((a, b) => {
      let valA = a[field];
      let valB = b[field];
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      
      if (valA < valB) return newDirection === 'asc' ? -1 : 1;
      if (valA > valB) return newDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setForecastData({
      ...forecastData,
      stocks: sortedStocks
    });
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 text-[#666]" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-[#09D1C7]" />
      : <ArrowDown className="h-4 w-4 text-[#09D1C7]" />;
  };

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderValueCell = (value, type) => {
    let color = 'text-white';
    let formattedValue = value;
    
    switch (type) {
      case 'percentage':
        formattedValue = value ? `${value > 0 ? '+' : ''}${value.toFixed(2)}%` : '--';
        color = value > 0 ? 'text-[#00FF00]' : value < 0 ? 'text-[#FF4A4A]' : 'text-white';
        break;
      case 'price':
        formattedValue = value ? value.toFixed(2) : '--';
        break;
      case 'trend':
        switch (value) {
          case 'Xu hướng tăng': color = 'text-[#00FF00]'; break;
          case 'Xu hướng giảm': color = 'text-[#FF4A4A]'; break;
          default: color = 'text-[#F4BE37]';
        }
        break;
      case 'recommendation':
        switch (value) {
          case 'Nên mua':
          case 'Nên mua mạnh': color = 'text-[#00FF00]'; break;
          case 'Nên bán': color = 'text-[#FF4A4A]'; break;
          default: color = 'text-[#F4BE37]';
        }
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

  const totalPages = forecastData?.stocks ? Math.ceil(forecastData.stocks.length / itemsPerPage) : 0;

  const getCurrentPageData = () => {
    if (!forecastData?.stocks) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return forecastData.stocks.slice(startIndex, endIndex);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const renderMetricCard = (title, value, change, date, type = 'percentage') => {
    const isPositive = change > 0;
    const changeColor = isPositive ? 'text-[#00FF00]' : 'text-[#FF4A4A]';
    const bgColor = isPositive ? 'bg-[#002108]' : 'bg-[#290000]';
    
    return (
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333]">
        <CardContent className="p-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#666]">{title}</p>
              <Badge variant="outline" className={badgeClass}>
                {formatDate(date)}
              </Badge>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline space-x-2">
                <span className={cn("text-2xl font-bold", "dark:text-white text-gray-900")}>
                  {type === 'percentage' ? `${value.toFixed(2)}%` : value.toFixed(2)}
                </span>
              </div>
              <div className={`flex items-center gap-1 ${changeColor} ${bgColor} px-2 py-1 rounded`}>
                {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                <span className="text-sm font-medium">{isPositive ? '+' : ''}{change.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative">
          <Loader2 className="h-12 w-12 text-[#09D1C7] animate-spin" />
        </div>
        <p className="text-[#999] mt-4 font-medium">Đang phân tích dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#0a0a14] min-h-screen -mx-4 md:-mx-8">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-[#1a1a1a]">
        <div className="px-4 py-4 md:px-8 flex items-center justify-between">
          <h1 className={cn("text-lg font-medium", "dark:text-white text-gray-900")}>Dự đoán giá</h1>
          <Button
            onClick={fetchForecastData}
            className="bg-[#09D1C7] hover:bg-[#0a8f88] text-white h-8 px-3 rounded-md text-sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Đang phân tích...
              </>
            ) : (
              'Cập nhật'
            )}
          </Button>
        </div>
      </div>

      {forecastData?.portfolioPrediction && (
        <div className="p-4 md:p-8 space-y-8">
          {/* Portfolio Overview - Beta and Recommendation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-[#666]">Khuyến nghị</span>
                <Badge variant="outline" className={badgeClass}>
                  {formatDate(forecastData.predictionDate)}
                </Badge>
              </div>
              <div className="text-2xl font-medium text-[#F4BE37]">
                {forecastData.portfolioPrediction.portfolioRecommendation}
              </div>
              <div className="mt-2 text-xs text-[#666]">
                {forecastData.portfolioPrediction.totalStocks} CP / {forecastData.portfolioPrediction.stocksWithSufficientData} đủ dữ liệu
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-[#666]">Chỉ số Beta</span>
                <Badge variant="outline" className={badgeClass}>
                  Độ nhạy thị trường
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className={cn("text-2xl font-medium", "dark:text-white text-gray-900")}>
                      {forecastData.portfolioPrediction.portfolioBeta.toFixed(2)}
                    </span>
                    <span className="text-lg text-[#666]">β</span>
                  </div>
                  <div className="mt-2 text-xs text-[#666]">
                    Độ biến động: {forecastData.portfolioPrediction.portfolioVolatility.toFixed(2)}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#666]">
                    {forecastData.portfolioPrediction.portfolioBeta > 1 
                      ? 'Biến động mạnh hơn thị trường' 
                      : forecastData.portfolioPrediction.portfolioBeta < 1 
                      ? 'Biến động yếu hơn thị trường'
                      : 'Biến động tương đương thị trường'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Time Period Predictions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-[#666]">1 Ngày</span>
                <Badge variant="outline" className={badgeClass}>
                  1D
                </Badge>
              </div>
              <div className={`text-2xl font-medium ${
                forecastData.portfolioPrediction.nextDayChange > 0 
                  ? 'text-[#00FF00]' 
                  : 'text-[#FF4A4A]'
              }`}>
                {forecastData.portfolioPrediction.nextDayChange > 0 ? '+' : ''}
                {forecastData.portfolioPrediction.nextDayChange.toFixed(2)}%
              </div>
              <div className="mt-4 text-xs text-gray-500 dark:text-[#666] flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  forecastData.portfolioPrediction.nextDayChange > 0 
                    ? 'bg-[#00FF00]' 
                    : 'bg-[#FF4A4A]'
                }`}></div>
                {forecastData.portfolioPrediction.nextDayChange > 0 ? 'Tăng' : 'Giảm'}
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-[#666]">1 Tuần</span>
                <Badge variant="outline" className={badgeClass}>
                  1W
                </Badge>
              </div>
              <div className={`text-2xl font-medium ${
                forecastData.portfolioPrediction.nextWeekChange > 0 
                  ? 'text-[#00FF00]' 
                  : 'text-[#FF4A4A]'
              }`}>
                {forecastData.portfolioPrediction.nextWeekChange > 0 ? '+' : ''}
                {forecastData.portfolioPrediction.nextWeekChange.toFixed(2)}%
              </div>
              <div className="mt-4 text-xs text-gray-500 dark:text-[#666] flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  forecastData.portfolioPrediction.nextWeekChange > 0 
                    ? 'bg-[#00FF00]' 
                    : 'bg-[#FF4A4A]'
                }`}></div>
                {forecastData.portfolioPrediction.nextWeekChange > 0 ? 'Tăng' : 'Giảm'}
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-[#666]">1 Tháng</span>
                <Badge variant="outline" className={badgeClass}>
                  1M
                </Badge>
              </div>
              <div className={`text-2xl font-medium ${
                forecastData.portfolioPrediction.nextMonthChange > 0 
                  ? 'text-[#00FF00]' 
                  : 'text-[#FF4A4A]'
              }`}>
                {forecastData.portfolioPrediction.nextMonthChange > 0 ? '+' : ''}
                {forecastData.portfolioPrediction.nextMonthChange.toFixed(2)}%
              </div>
              <div className="mt-4 text-xs text-gray-500 dark:text-[#666] flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  forecastData.portfolioPrediction.nextMonthChange > 0 
                    ? 'bg-[#00FF00]' 
                    : 'bg-[#FF4A4A]'
                }`}></div>
                {forecastData.portfolioPrediction.nextMonthChange > 0 ? 'Tăng' : 'Giảm'}
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-[#666]">1 Quý</span>
                <Badge variant="outline" className={badgeClass}>
                  1Q
                </Badge>
              </div>
              <div className={`text-2xl font-medium ${
                forecastData.portfolioPrediction.nextQuarterChange > 0 
                  ? 'text-[#00FF00]' 
                  : 'text-[#FF4A4A]'
              }`}>
                {forecastData.portfolioPrediction.nextQuarterChange > 0 ? '+' : ''}
                {forecastData.portfolioPrediction.nextQuarterChange.toFixed(2)}%
              </div>
              <div className="mt-4 text-xs text-gray-500 dark:text-[#666] flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  forecastData.portfolioPrediction.nextQuarterChange > 0 
                    ? 'bg-[#00FF00]' 
                    : 'bg-[#FF4A4A]'
                }`}></div>
                {forecastData.portfolioPrediction.nextQuarterChange > 0 ? 'Tăng' : 'Giảm'}
              </div>
            </div>
          </div>

          {/* Stock Details */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg">
            <div className="p-4 border-b border-gray-200 dark:border-[#333] flex items-center justify-between">
              <div className={cn("text-sm font-medium", "dark:text-white text-gray-900")}>Chi tiết dự đoán</div>
              <div className="flex gap-2">
                <Badge variant="outline" className={badgeClass}>
                  {formatDate(forecastData.predictionDate)}
                </Badge>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-[#333]">
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-[#666] p-4">Mã CK</th>
                    <th className="text-right text-xs font-medium text-gray-500 dark:text-[#666] p-4">Giá hiện tại</th>
                    <th className="text-center text-xs font-medium text-gray-500 dark:text-[#666] p-4">Xu hướng</th>
                    <th className="text-right text-xs font-medium text-gray-500 dark:text-[#666] p-4">Dự đoán 1D</th>
                    <th className="text-right text-xs font-medium text-gray-500 dark:text-[#666] p-4">Dự đoán 1W</th>
                    <th className="text-right text-xs font-medium text-gray-500 dark:text-[#666] p-4">Dự đoán 1M</th>
                    <th className="text-right text-xs font-medium text-gray-500 dark:text-[#666] p-4">Dự đoán 1Q</th>
                    <th className="text-center text-xs font-medium text-gray-500 dark:text-[#666] p-4">Khuyến nghị</th>
                  </tr>
                </thead>
                <tbody>
                  {getCurrentPageData().map((stock) => (
                    <tr key={stock.id} className="border-b border-gray-200 dark:border-[#333] hover:bg-gray-100 dark:hover:bg-[#252525]">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={cn("font-medium", "dark:text-white text-gray-900")}>{stock.ticketSymbol}</span>
                          <Badge variant="outline" className={badgeClass}>
                            {stock.weight}%
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4 text-right font-medium dark:text-white text-gray-900">
                        {stock.currentPrice.toFixed(2)}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          <Badge className={`${
                            stock.trend === 'Xu hướng tăng'
                              ? 'bg-[#002108] text-[#00FF00]'
                              : stock.trend === 'Xu hướng giảm'
                              ? 'bg-[#290000] text-[#FF4A4A]'
                              : 'bg-[#252525] text-[#F4BE37]'
                          }`}>
                            {stock.trend}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <span className={
                            stock.nextDayChange > 0 ? 'text-[#00FF00]' : 'text-[#FF4A4A]'
                          }>
                            {stock.nextDayChange > 0 ? '+' : ''}
                            {stock.nextDayChange.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <span className={
                            stock.nextWeekChange > 0 ? 'text-[#00FF00]' : 'text-[#FF4A4A]'
                          }>
                            {stock.nextWeekChange > 0 ? '+' : ''}
                            {stock.nextWeekChange.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <span className={
                            stock.nextMonthChange > 0 ? 'text-[#00FF00]' : 'text-[#FF4A4A]'
                          }>
                            {stock.nextMonthChange > 0 ? '+' : ''}
                            {stock.nextMonthChange.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <span className={
                            stock.nextQuarterChange > 0 ? 'text-[#00FF00]' : 'text-[#FF4A4A]'
                          }>
                            {stock.nextQuarterChange > 0 ? '+' : ''}
                            {stock.nextQuarterChange.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          <Badge className={`${
                            stock.recommendation.includes('mua')
                              ? 'bg-[#002108] text-[#00FF00]'
                              : stock.recommendation === 'Nên bán'
                              ? 'bg-[#290000] text-[#FF4A4A]'
                              : 'bg-[#252525] text-[#F4BE37]'
                          }`}>
                            {stock.recommendation}
                          </Badge>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {forecastData?.stocks?.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-[#333] flex items-center justify-between">
                <div className="text-xs text-[#666]">
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, forecastData.stocks.length)} 
                  trên tổng số {forecastData.stocks.length} cổ phiếu
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn("h-7 px-2 bg-transparent", "dark:text-white text-gray-900", "dark:border-[#333] border-gray-200", "dark:hover:bg-[#252525] hover:bg-gray-100")}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className={`${
                        currentPage === pageNum
                          ? "bg-[#09D1C7] hover:bg-[#0a8f88] text-white"
                          : cn("bg-transparent", "dark:text-white text-gray-900", "dark:border-[#333] border-gray-200", "dark:hover:bg-[#252525] hover:bg-gray-100")
                      } h-7 w-7 p-0`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn("h-7 px-2 bg-transparent", "dark:text-white text-gray-900", "dark:border-[#333] border-gray-200", "dark:hover:bg-[#252525] hover:bg-gray-100")}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500 dark:text-[#666] space-y-1.5 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <p>Các phân tích trên chỉ mang tính chất tham khảo. Nhà đầu tư cần cân nhắc kỹ trước khi đưa ra quyết định.</p>
            </div>
            <div className="flex items-start gap-2">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <p>Dữ liệu được cập nhật định kỳ mỗi ngày giao dịch.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForecastPage; 