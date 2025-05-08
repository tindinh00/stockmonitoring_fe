import React, { useState, useEffect, useMemo } from 'react';
import { 
  Loader2,
  Star,
  AlertCircle,
  CreditCard,
  CheckCircle,
  TrendingUp,
  Zap,
  Receipt,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  History
} from "lucide-react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiService } from '@/api/Api';
import { toast, Toaster } from "sonner";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Loader } from 'lucide-react';
import Cookies from 'js-cookie';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';

// Transaction status types and their display properties
const statusMap = {
  'COMPLETED': { label: 'Thành công', color: 'bg-green-100 text-green-800' },
  'SUCCESS': { label: 'Thành công', color: 'bg-green-100 text-green-800' },
  'PENDING': { label: 'Đang xử lý', color: 'bg-yellow-100 text-yellow-800' },
  'REJECTED': { label: 'Bị từ chối', color: 'bg-red-100 text-red-800' },
  'FAILED': { label: 'Thất bại', color: 'bg-red-100 text-red-800' },
  'CANCELLED': { label: 'Đã hủy', color: 'bg-gray-100 text-gray-800' },
};

const typeMap = {
  'SUBSCRIPTION': { label: 'Đăng ký gói', description: 'Thanh toán đăng ký gói' },
  'UPGRADE': { label: 'Nâng cấp gói', description: 'Thanh toán nâng cấp gói' },
};

// Status options for the filter dropdown
const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'SUCCESS', label: 'Thành công' },
  { value: 'FAILED', label: 'Thất bại' }
];

export function TransactionHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userTier, setUserTier] = useState('Free');
  const [userFeatures, setUserFeatures] = useState([]);
  const [currentPackage, setCurrentPackage] = useState(null);
  const navigate = useNavigate();
  
  // Fetch user subscription data on mount
  useEffect(() => {
    try {
      // Try to get tier from cookie (priority)
      const cookieTier = Cookies.get('user_tier');
      
      // Try to get data from localStorage as fallback
      let localStorageUserInfo;
      let localStorageUserData;
      let localStorageFeatures;
      
      try {
        localStorageUserInfo = JSON.parse(localStorage.getItem('user_info')) || {};
        localStorageUserData = JSON.parse(localStorage.getItem('user_data')) || {};
        localStorageFeatures = JSON.parse(localStorage.getItem('user_features')) || [];
      } catch (e) {
        console.error('Error parsing localStorage data:', e);
      }
      
      // Set tier with priority to cookie value
      const finalTier = cookieTier || localStorageUserInfo?.tier || localStorageUserData?.tier || 'Free';
      setUserTier(finalTier);
      
      // Set features from localStorage
      if (Array.isArray(localStorageFeatures) && localStorageFeatures.length > 0) {
        setUserFeatures(localStorageFeatures);
      } else {
        // Tạo tính năng mặc định theo gói
        const defaultFeatures = [];
        if (finalTier !== 'Free') {
          defaultFeatures.push('Quản lý danh mục cổ phiếu', 'Quản lý thông báo');
          if (finalTier === 'Premium' || finalTier === 'VIP') {
            defaultFeatures.push('Phân tích kỹ thuật nâng cao', 'Dự đoán giá');
          }
          if (finalTier === 'VIP') {
            defaultFeatures.push('AI hỗ trợ đầu tư', 'Khuyến nghị cổ phiếu theo lĩnh vực');
          }
        }
        setUserFeatures(defaultFeatures);
      }
      
    } catch (error) {
      console.error('Error fetching user subscription data:', error);
      // Set default values if error
      setUserTier('Free');
      setUserFeatures([]);
    }
  }, []);
  
  // Fetch payment history on initial load
  useEffect(() => {
    fetchPaymentHistory();
  }, []);
  
  const fetchPaymentHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching payment history...");
      // Không truyền search và filter khi lần đầu load
      const result = await apiService.getUserPaymentHistory();
      console.log("Payment history result:", result);
      
      if (result.status === 'success' && Array.isArray(result.data)) {
        console.log("Setting transactions:", result.data);
        setTransactions(result.data);
        
        // Tìm gói subscription hiện tại (đầu tiên có status SUCCESS)
        const activePackage = result.data.find(t => t.status === 'SUCCESS');
        if (activePackage) {
          setCurrentPackage(activePackage);
        }
      } else {
        console.error("Payment history error response:", result);
       
        
        console.log("Using mock data as fallback");
        setTransactions(mockTransactions);
        setCurrentPackage(mockTransactions[0]);
        setError(result.message || 'API trả về lỗi. Hiển thị dữ liệu mẫu.');
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      
      
      
      console.log("Using mock data as fallback due to exception");
      setTransactions(mockTransactions);
      setCurrentPackage(mockTransactions[0]);
      setError('Không thể kết nối đến API. Hiển thị dữ liệu mẫu.');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter transactions based on search term and status
  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) {
      console.error("transactions is not an array:", transactions);
      return [];
    }
    
    // Mặc định hiển thị toàn bộ dữ liệu, chỉ lọc khi người dùng chủ động tìm kiếm
    if (searchTerm === '' && statusFilter === 'ALL') {
      return transactions;
    }
    
    return transactions.filter((transaction) => {
      // Đảm bảo orderCode và name là chuỗi trước khi gọi toLowerCase
      const orderCode = transaction.orderCode ? String(transaction.orderCode).toLowerCase() : '';
      const name = transaction.name ? String(transaction.name).toLowerCase() : '';
      const searchTermLower = searchTerm ? searchTerm.toLowerCase() : '';
      
      const matchesSearch =
        !searchTerm ||
        orderCode.includes(searchTermLower) ||
        name.includes(searchTermLower);
      
      const matchesStatus =
        statusFilter === "ALL" || 
        (transaction.status && transaction.status.toUpperCase() === statusFilter);
    
    return matchesSearch && matchesStatus;
  });
  }, [transactions, searchTerm, statusFilter]);
  
  // Pagination logic - mỗi trang hiển thị 5 kết quả
  const itemsPerPage = 5;
  const totalPages = Math.ceil((filteredTransactions?.length || 0) / itemsPerPage);
  const currentItems = useMemo(() => {
    return Array.isArray(filteredTransactions) 
      ? filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
      : [];
  }, [filteredTransactions, currentPage, itemsPerPage]);
  
  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString;
    }
  };
  
  // Get status display properties
  const getStatusDisplay = (status) => {
    if (!status) return { text: 'Không xác định', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' };
     
    switch(status.toUpperCase()) {
      case 'SUCCESS':
        return { text: 'Thành công', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' };
      case 'PENDING':
        return { text: 'Đang xử lý', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' };
      case 'FAILED':
        return { text: 'Đã hủy', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' };
      case 'CANCELLED':
        return { text: 'Đã hủy', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' };
      default:
        return { text: status, className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' };
    }
  };
  
  // Get payment type display properties
  const getTypeInfo = (type) => {
    return typeMap[type] || { label: type, description: 'Thanh toán' };
  };
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset về trang 1 khi tìm kiếm
    handleSearch(e.target.value, statusFilter);
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset về trang 1 khi thay đổi filter
    handleSearch(searchTerm, value);
  };
  
  // Handle search button click - perform search with API
  const handleSearch = async (searchValue = searchTerm, statusValue = statusFilter) => {
    setLoading(true);
    setError(null);
    
    try {
      // Trim search term and convert empty strings to undefined
      const cleanSearchTerm = searchValue?.trim() ? searchValue.trim() : '';
      
      // Only use filter if it's not "ALL"
      const cleanStatusFilter = statusValue !== 'ALL' ? statusValue : '';
      
      console.log("Searching with term:", cleanSearchTerm, "and filter:", cleanStatusFilter);
      
      const result = await apiService.getUserPaymentHistory(cleanSearchTerm, cleanStatusFilter);
      
      if (result.status === 'success' && Array.isArray(result.data)) {
        // Filter transactions based on status if a specific status is selected
        const filteredData = statusValue === 'ALL' 
          ? result.data 
          : result.data.filter(transaction => transaction.status === statusValue);
        
        setTransactions(filteredData);
        if (filteredData.length === 0) {
          setError('Không tìm thấy giao dịch nào phù hợp');
        }
      } else {
        setTransactions([]);
        setError(result.message || 'Không thể tìm kiếm lịch sử giao dịch');
      }
    } catch (error) {
      console.error('Error searching payment history:', error);
      setError('Đã xảy ra lỗi khi tìm kiếm');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm border border-gray-200 dark:border-[#1f1f30] rounded-lg">
        <div className="flex items-center gap-2">
          <div className="animate-spin h-5 w-5 border-2 border-b-0 border-r-0 border-[#09D1C7] rounded-full"></div>
          <span className="text-gray-500 dark:text-gray-400">Đang tải lịch sử giao dịch...</span>
        </div>
      </div>
    );
  }
  
  if (error && transactions.length === 0) {
    return (
      <div className="text-center p-8 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm border border-gray-200 dark:border-[#1f1f30] rounded-lg">
        <div className="text-red-500 mb-4">
          {error}
        </div>
        <button 
          onClick={() => fetchPaymentHistory()}
          className="px-4 py-2 bg-[#09D1C7] text-white rounded hover:bg-opacity-90"
        >
          Tải lại
        </button>
      </div>
    );
  }
  
  return (
    <Card className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#1f1f30]">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-[#09D1C7] p-2 rounded-md">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">Lịch sử giao dịch</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">Xem lại các giao dịch đã thực hiện</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm theo mã đơn hàng..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#1f1f30] text-gray-900 dark:text-white"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-full md:w-[180px] bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#1f1f30] text-gray-900 dark:text-white">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#1f1f30] text-gray-900 dark:text-white">
              <SelectItem value="ALL">Tất cả</SelectItem>
              <SelectItem value="SUCCESS">Thành công</SelectItem>
              <SelectItem value="FAILED">Thất bại</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 border border-red-800 bg-red-900 text-red-200 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        )}
        
        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center p-8 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm border border-gray-200 dark:border-[#1f1f30] rounded-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin h-5 w-5 border-2 border-b-0 border-r-0 border-[#09D1C7] rounded-full"></div>
              <span className="text-gray-500 dark:text-gray-400">Đang tải lịch sử giao dịch...</span>
            </div>
          </div>
        )}
        
        {/* No transactions */}
        {!loading && Array.isArray(filteredTransactions) && filteredTransactions.length === 0 && !error && (
          <div className="text-center py-12 bg-gray-100 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800">
            <Receipt className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">Không có giao dịch nào</h3>
            <p className="mt-2 text-sm text-gray-500">Bạn chưa có giao dịch nào trong lịch sử.</p>
          </div>
        )}
        
        {/* Transaction list */}
        {!loading && Array.isArray(filteredTransactions) && filteredTransactions.length > 0 && (
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-[#1a1a1a] border-y border-gray-200 dark:border-[#1f1f30]">
                <tr>
                  <th scope="col" className="px-4 py-3 text-gray-600 dark:text-gray-400">Mã đơn hàng</th>
                  <th scope="col" className="px-4 py-3 text-gray-600 dark:text-gray-400">Gói dịch vụ</th>
                  <th scope="col" className="px-4 py-3 text-gray-600 dark:text-gray-400">Số tiền</th>
                  <th scope="col" className="px-4 py-3 text-gray-600 dark:text-gray-400">Ngày tạo</th>
                  <th scope="col" className="px-4 py-3 text-gray-600 dark:text-gray-400">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((transaction, index) => {
                  const statusDisplay = getStatusDisplay(transaction.status);
                  return (
                    <tr key={transaction.id || index} className="border-b border-gray-200 dark:border-[#1f1f30] bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#252525]">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {transaction.orderCode || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {transaction.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {transaction.amount ? `${transaction.amount.toLocaleString()} VND` : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {transaction.createdAt ? formatDate(transaction.createdAt) : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge 
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusDisplay.className}`}>
                          {statusDisplay.text}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                      currentPage === 1 
                        ? 'bg-white dark:bg-[#1a1a1a] text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                        : 'bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                      currentPage === totalPages 
                        ? 'bg-white dark:bg-[#1a1a1a] text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                        : 'bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    Sau
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Hiển thị <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> đến{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, filteredTransactions.length)}
                      </span>{' '}
                      trong tổng số <span className="font-medium">{filteredTransactions.length}</span> kết quả
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${
                          currentPage === 1 
                            ? 'bg-white dark:bg-[#1a1a1a] text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                            : 'bg-white dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white'
                        }`}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      
                      {/* Hiển thị số trang */}
                      {Array.from({ length: totalPages }).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => handlePageChange(idx + 1)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            currentPage === idx + 1
                              ? 'bg-[#09D1C7] text-white'
                              : 'bg-white dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${
                          currentPage === totalPages 
                            ? 'bg-white dark:bg-[#1a1a1a] text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                            : 'bg-white dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white'
                        }`}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TransactionHistory; 