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
  Calendar
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
        // Use mock data if API fails
        const mockTransactions = [
          {
            id: '1',
            orderCode: 'ORD0001',
            name: 'Premium',
            amount: 299000,
            createdAt: new Date().toISOString(),
            status: 'SUCCESS',
            expireDate: new Date(Date.now() + 30*24*60*60*1000).toISOString()
          },
          {
            id: '2',
            orderCode: 'ORD0002',
            name: 'VIP',
            amount: 599000,
            createdAt: new Date(Date.now() - 7*24*60*60*1000).toISOString(),
            status: 'PENDING'
          },
          {
            id: '3',
            orderCode: 'ORD0003',
            name: 'Premium',
            amount: 299000,
            createdAt: new Date(Date.now() - 30*24*60*60*1000).toISOString(),
            status: 'FAILED'
          }
        ];
        
        console.log("Using mock data as fallback");
        setTransactions(mockTransactions);
        setCurrentPackage(mockTransactions[0]);
        setError(result.message || 'API trả về lỗi. Hiển thị dữ liệu mẫu.');
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      
      // Use mock data if API throws an exception
      const mockTransactions = [
        {
          id: '1',
          orderCode: 'ORD0001',
          name: 'Premium',
          amount: 299000,
          createdAt: new Date().toISOString(),
          status: 'SUCCESS',
          expireDate: new Date(Date.now() + 30*24*60*60*1000).toISOString()
        },
        {
          id: '2',
          orderCode: 'ORD0002',
          name: 'VIP',
          amount: 599000,
          createdAt: new Date(Date.now() - 7*24*60*60*1000).toISOString(),
          status: 'PENDING'
        },
        {
          id: '3',
          orderCode: 'ORD0003',
          name: 'Premium',
          amount: 299000,
          createdAt: new Date(Date.now() - 30*24*60*60*1000).toISOString(),
          status: 'FAILED'
        }
      ];
      
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
    if (!status) return { text: 'Không xác định', className: 'bg-gray-100 text-gray-800' };
     
    switch(status.toUpperCase()) {
      case 'SUCCESS':
        return { text: 'Thành công', className: 'bg-green-100 text-green-800' };
      case 'PENDING':
        return { text: 'Đang xử lý', className: 'bg-yellow-100 text-yellow-800' };
      case 'FAILED':
        return { text: 'Đã hủy', className: 'bg-red-100 text-red-800' };
      case 'CANCELLED':
        return { text: 'Đã hủy', className: 'bg-red-100 text-red-800' };
      default:
        return { text: status, className: 'bg-gray-100 text-gray-800' };
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
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset về trang 1 khi thay đổi filter
    handleSearch(searchTerm, e.target.value);
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
        setTransactions(result.data);
        if (result.data.length === 0) {
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
      <div className="flex flex-col items-center justify-center p-12 bg-black text-white">
        <Loader2 className="h-12 w-12 animate-spin text-[#09D1C7] mb-4" />
        <p className="text-center text-gray-300">Đang tải lịch sử giao dịch...</p>
      </div>
    );
  }
  
  if (error && transactions.length === 0) {
    return (
      <div className="text-center p-8 bg-black text-white">
        <div className="text-red-500 mb-4">
          {error}
        </div>
        <button 
          onClick={() => fetchPaymentHistory()}
          className="px-4 py-2 bg-[#09D1C7] text-black rounded hover:bg-opacity-90"
        >
          Tải lại
        </button>
      </div>
    );
  }
  
  return (
    <div className="bg-black text-white rounded-lg shadow p-6 space-y-6">
      {/* Transaction History Section */}
      <h2 className="text-2xl font-bold mb-4">Lịch sử giao dịch</h2>
      
      {/* Search and Filter Controls */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Tìm kiếm giao dịch..."
            className="pl-8 h-10 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white w-full"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
        </div>
        
        <select
          className="h-10 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white w-full md:w-48"
          value={statusFilter}
          onChange={handleStatusFilterChange}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="SUCCESS">Thành công</option>
          <option value="FAILED">Đã hủy</option>
        </select>
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
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-[#09D1C7]" />
          <span className="ml-2 text-gray-300">Đang tải dữ liệu...</span>
        </div>
      )}
      
      {/* No transactions */}
      {!loading && Array.isArray(filteredTransactions) && filteredTransactions.length === 0 && !error && (
        <div className="text-center py-12 bg-gray-900 rounded-md border border-gray-800">
          <Receipt className="mx-auto h-12 w-12 text-gray-600" />
          <h3 className="mt-4 text-lg font-medium text-gray-300">Không có giao dịch nào</h3>
          <p className="mt-2 text-sm text-gray-500">Bạn chưa có giao dịch nào trong lịch sử.</p>
          </div>
      )}
      
      {/* Transaction list */}
      {!loading && Array.isArray(filteredTransactions) && filteredTransactions.length > 0 && (
        <div className="bg-gray-900 rounded-md shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Mã đơn hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Gói dịch vụ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Số tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-800">
              {currentItems.map((transaction, index) => {
                const statusDisplay = getStatusDisplay(transaction.status);
                  return (
                  <tr key={transaction.id || index} className="hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">
                      {transaction.orderCode || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {transaction.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {transaction.amount ? `${transaction.amount.toLocaleString()} VND` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {transaction.createdAt ? formatDate(transaction.createdAt) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusDisplay.className}`}>
                        {statusDisplay.text}
                        </span>
                    </td>
                  </tr>
                  );
                })}
            </tbody>
          </table>
          
          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-800 bg-gray-900 px-4 py-3 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                    currentPage === 1 
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                >
                  Trước
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                    currentPage === totalPages 
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                >
                  Sau
                </button>
          </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-400">
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
                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
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
                            ? 'bg-[#09D1C7] text-black'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
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
                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
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
      
      <Toaster position="top-center" />
    </div>
  );
}

export default TransactionHistory; 