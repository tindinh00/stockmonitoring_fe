import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getUserId } from '@/api/Api';
import { stockService } from '@/api/StockApi';
import { toast } from "sonner";
import { Loader2, Bell, AlertTriangle, ArrowUpDown, ArrowDown, ArrowUp, Trash2, Pencil, Check, ChevronsUpDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils"
import signalRService from "@/api/signalRService";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from 'react-router-dom';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [watchlistStocks, setWatchlistStocks] = useState([]);
  const [open, setOpen] = useState(false);
  const [newNotification, setNewNotification] = useState({
    tickerSymbol: '',
    price: '',
    type: 'increase'
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [newPrice, setNewPrice] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingNotification, setDeletingNotification] = useState(null);
  const [deletingIds, setDeletingIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
  const itemsPerHistoryPage = 10;
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'active';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const filtered = watchlistStocks.filter(stock =>
      stock.ticketSymbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredStocks(filtered);
  }, [searchQuery, watchlistStocks]);

  useEffect(() => {
    fetchNotifications();
    fetchWatchlistStocks();
    fetchNotificationHistory();
    
    const setupNotificationListener = async () => {
      try {
        const userId = getUserId();
        if (!userId) {
          console.warn("No user ID found for notification subscription");
          return;
        }
        console.log("[Notifications] Setting up notification listener for user:", userId);

        const connection = await signalRService.getConnection();
        if (!connection) {
          console.error("Failed to establish SignalR connection");
          return;
        }
        console.log("[Notifications] SignalR connection state:", connection?.state);
        
        await new Promise(resolve => setTimeout(resolve, 1000));

        await signalRService.setupNotificationListeners();
        
        const handleNotification = (event) => {
          console.log("[Notifications] Received notification event:", event);
          const notification = event.detail;
          if (notification.userId === userId) {
            console.log("[Notifications] Processing notification for current user:", notification);
            
            toast.info(notification.message, {
              description: `Thời gian: ${new Date(notification.time).toLocaleString()} - Sàn: ${notification.exchange}`,
              duration: 10000,
              action: {
                label: "Xem",
                onClick: () => fetchNotifications()
              }
            });

            fetchNotifications();
          }
        };

        window.addEventListener('stockNotification', handleNotification);
        
        return () => {
          window.removeEventListener('stockNotification', handleNotification);
        };
      } catch (error) {
        console.error("Error setting up notification listener:", error);
        setTimeout(() => setupNotificationListener(), 5000);
      }
    };

    const cleanup = setupNotificationListener();
    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(cleanupFn => {
          if (cleanupFn) cleanupFn();
        });
      } else if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, []);

  const fetchWatchlistStocks = async () => {
    try {
      const response = await stockService.getWatchlistStocks();
      console.log("Watchlist stocks response:", response);
      if (response?.value?.data && Array.isArray(response.value.data)) {
        setWatchlistStocks(response.value.data);
        setFilteredStocks(response.value.data);
      }
    } catch (error) {
      console.error("Error fetching watchlist stocks:", error);
      toast.error("Không thể tải danh sách cổ phiếu theo dõi");
    }
  };

  const handleCreateNotification = async () => {
    try {
      setIsCreating(true);
      if (!newNotification.tickerSymbol || !newNotification.price || !newNotification.type) {
        toast.error("Vui lòng điền đầy đủ thông tin");
        setIsCreating(false);
        return;
      }

      const userId = getUserId();
      if (!userId) {
        toast.error("Vui lòng đăng nhập để tạo thông báo");
        setIsCreating(false);
        return;
      }

      const data = {
        tickerSymbol: newNotification.tickerSymbol.toUpperCase(),
        userId: userId,
        price: parseFloat(newNotification.price),
        type: newNotification.type.toLowerCase()
      };

      const response = await stockService.createNotification(data);
      toast.success(response?.value?.data || "Tạo thông báo thành công", {
        duration: 5000
      });
      setIsDialogOpen(false);
      fetchNotifications();
      
      setNewNotification({
        tickerSymbol: '',
        price: '',
        type: 'increase'
      });
    } catch (error) {
      console.error("Error creating notification:", error);
      toast.error("Không thể tạo thông báo: " + (error.message || "Vui lòng thử lại sau"));
    } finally {
      setIsCreating(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      
      const userId = getUserId();
      if (!userId) {
        toast.error("Vui lòng đăng nhập để xem thông báo");
        return;
      }

      const response = await stockService.getNotifications(userId);
      console.log("Notifications:", response);

      if (response?.value?.data && Array.isArray(response.value.data)) {
        setNotifications(response.value.data);
      } else {
        setNotifications([]);
        toast.info("Chưa có lệnh thông báo nào", {
          description: "Hãy tạo lệnh thông báo mới để theo dõi cổ phiếu",
          duration: 5000
        });
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Không thể tải dữ liệu thông báo", {
        description: error.message || "Vui lòng thử lại sau",
        duration: 5000
      });
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    
    const sortedNotifications = [...notifications].sort((a, b) => {
      let valA = a[field];
      let valB = b[field];
      
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      
      if (field === 'createdAt') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }
      
      if (valA < valB) return newDirection === 'asc' ? -1 : 1;
      if (valA > valB) return newDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setNotifications(sortedNotifications);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 text-[#666]" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-[#09D1C7]" />
      : <ArrowDown className="h-4 w-4 text-[#09D1C7]" />;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'text-green-500';
      case 'triggered': return 'text-yellow-500';
      case 'completed': return 'text-blue-500';
      case 'cancelled': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEditPrice = (notification) => {
    setEditingNotification(notification);
    setNewPrice(notification.price.toString());
    setIsEditDialogOpen(true);
  };

  const handleUpdatePrice = async () => {
    try {
      setIsUpdating(true);
      const data = {
        tickerSymbol: editingNotification.tickerSymbol.toUpperCase(),
        userId: editingNotification.userId,
        price: parseFloat(newPrice),
        type: editingNotification.type
      };
      
      const response = await stockService.updateNotificationPrice(editingNotification.id, data);
      toast.success(response?.value?.data || "Cập nhật giá thành công", {
        duration: 5000
      });
      setIsEditDialogOpen(false);
      fetchNotifications();
    } catch (error) {
      console.error("Error updating price:", error);
      toast.error("Không thể cập nhật giá: " + (error.message || "Vui lòng thử lại sau"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (notification) => {
    setDeletingNotification(notification);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingNotification) return;
    
    try {
      setDeletingIds(prev => [...prev, deletingNotification.id]);
      const data = {
        tickerSymbol: deletingNotification.tickerSymbol,
        userId: deletingNotification.userId,
        type: deletingNotification.type
      };
      
      const response = await stockService.deleteNotification(data);
      toast.success(response?.value?.data || "Xóa thông báo thành công");
      setIsDeleteDialogOpen(false);
      fetchNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Không thể xóa thông báo: " + (error.message || "Vui lòng thử lại sau"));
    } finally {
      setDeletingIds(prev => prev.filter(id => id !== deletingNotification.id));
      setDeletingNotification(null);
    }
  };

  const totalPages = Math.ceil(notifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNotifications = notifications.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => handlePageChange(currentPage - 1)}
              className={cn(
                "cursor-pointer", 
                currentPage === 1 
                  ? "pointer-events-none opacity-50" 
                  : "dark:hover:bg-[#252525] hover:bg-gray-100"
              )}
            />
          </PaginationItem>
          
          {[...Array(totalPages)].map((_, index) => {
            const pageNumber = index + 1;
            if (
              pageNumber <= 3 ||
              pageNumber > totalPages - 3 ||
              Math.abs(pageNumber - currentPage) <= 1
            ) {
              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    onClick={() => handlePageChange(pageNumber)}
                    isActive={currentPage === pageNumber}
                    className={cn(
                      "cursor-pointer",
                      currentPage === pageNumber
                        ? "bg-[#09D1C7] text-white hover:bg-[#09D1C7]/90"
                        : "dark:hover:bg-[#252525] hover:bg-gray-100"
                    )}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            } else if (
              (pageNumber === 4 && currentPage < totalPages - 3) ||
              (pageNumber === totalPages - 3 && currentPage > 4)
            ) {
              return (
                <PaginationItem key={pageNumber}>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }
            return null;
          })}

          <PaginationItem>
            <PaginationNext 
              onClick={() => handlePageChange(currentPage + 1)}
              className={cn(
                "cursor-pointer", 
                currentPage === totalPages 
                  ? "pointer-events-none opacity-50" 
                  : "dark:hover:bg-[#252525] hover:bg-gray-100"
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const renderTable = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-[#09D1C7] animate-spin mb-4" />
          <p className={cn("dark:text-[#999] text-gray-500")}>Đang tải dữ liệu thông báo...</p>
        </div>
      );
    }

    if (notifications.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-4", "dark:bg-[#252525] bg-gray-200")}>
            <Bell className="h-8 w-8 text-[#666]" />
          </div>
          <h3 className={cn("font-medium mb-2", "dark:text-white text-gray-900")}>Chưa có lệnh thông báo</h3>
          <p className="text-[#666] max-w-md">
            Bạn chưa có lệnh thông báo nào. Hãy tạo lệnh thông báo mới để theo dõi biến động giá cổ phiếu.
          </p>
        </div>
      );
    }

    return (
      <div className="w-full overflow-x-auto">
        <div className="min-w-[800px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={cn("w-16 text-center", "dark:text-white text-gray-900")}>STT</TableHead>
                <TableHead className={cn("w-32 text-center", "dark:text-white text-gray-900")}>Mã cổ phiếu</TableHead>
                <TableHead className={cn("w-40 text-center", "dark:text-white text-gray-900")}>Giá mục tiêu</TableHead>
                <TableHead className={cn("w-40 text-center", "dark:text-white text-gray-900")}>Loại thông báo</TableHead>
                <TableHead className={cn("w-32 text-center", "dark:text-white text-gray-900")}>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentNotifications.map((notification, index) => (
                <TableRow key={notification.id} className={cn("transition-colors", "dark:hover:bg-[#252525] hover:bg-gray-100")}>
                  <TableCell className={cn("text-center font-medium", "dark:text-white text-gray-900")}>
                    {startIndex + index + 1}
                  </TableCell>
                  <TableCell className={cn("text-center font-medium", "dark:text-white text-gray-900")}>
                    {notification.tickerSymbol.toUpperCase()}
                  </TableCell>
                  <TableCell className={cn("text-center", "dark:text-white text-gray-900")}>
                    {notification.price.toLocaleString()}
                  </TableCell>
                  <TableCell className={cn("text-center", "dark:text-white text-gray-900")}>
                    {notification.type === 'increase' ? 'Khi giá tăng' : 'Khi giá giảm'}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20"
                        onClick={() => handleEditPrice(notification)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20"
                        onClick={() => handleDeleteClick(notification)}
                        disabled={deletingIds.includes(notification.id)}
                      >
                        {deletingIds.includes(notification.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {renderPagination()}
        </div>
      </div>
    );
  };

  const fetchNotificationHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const userId = getUserId();
      const cookies = document.cookie.split(';');
      const authToken = cookies
        .find(cookie => cookie.trim().startsWith('auth_token='))
        ?.split('=')[1];
      
      if (!authToken) {
        throw new Error('Không tìm thấy token xác thực');
      }

      const response = await fetch(`https://stockmonitoring-api-gateway.onrender.com/api/notifications/${userId}/messages`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data?.value?.data) {
        setNotificationHistory(data.value.data);
      }
    } catch (error) {
      console.error("Error fetching notification history:", error);
      toast.error("Không thể tải lịch sử thông báo");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const renderHistory = () => {
    if (isLoadingHistory) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-[#09D1C7] animate-spin mb-4" />
          <p className={cn("dark:text-[#999] text-gray-500")}>Đang tải lịch sử thông báo...</p>
        </div>
      );
    }

    if (notificationHistory.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-4", "dark:bg-[#252525] bg-gray-200")}>
            <Bell className="h-8 w-8 text-[#666]" />
          </div>
          <h3 className={cn("font-medium mb-2", "dark:text-white text-gray-900")}>Chưa có thông báo nào</h3>
          <p className="text-[#666] max-w-md">
            Bạn chưa nhận được thông báo nào. Các thông báo sẽ xuất hiện khi giá cổ phiếu đạt đến mức mục tiêu.
          </p>
        </div>
      );
    }

    const startIndex = (currentHistoryPage - 1) * itemsPerHistoryPage;
    const endIndex = startIndex + itemsPerHistoryPage;
    const currentHistoryItems = notificationHistory.slice(startIndex, endIndex);
    const totalHistoryPages = Math.ceil(notificationHistory.length / itemsPerHistoryPage);

    return (
      <>
        <div className="w-full overflow-x-auto">
          <div className="min-w-[800px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={cn("w-16 text-center", "dark:text-white text-gray-900")}>STT</TableHead>
                  <TableHead className={cn("text-left", "dark:text-white text-gray-900")}>Nội dung thông báo</TableHead>
                  <TableHead className={cn("w-48 text-left", "dark:text-white text-gray-900")}>Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentHistoryItems.map((notification, index) => (
                  <TableRow key={notification.id} className={cn("transition-colors", "dark:hover:bg-[#252525] hover:bg-gray-100")}>
                    <TableCell className={cn("text-center font-medium", "dark:text-white text-gray-900")}>
                      {startIndex + index + 1}
                    </TableCell>
                    <TableCell className={cn("text-left", "dark:text-white text-gray-900")}>
                      {notification.message}
                    </TableCell>
                    <TableCell className={cn("text-left", "dark:text-white text-gray-900")}>
                      {new Date(notification.createdAt).toLocaleString('vi-VN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {totalHistoryPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="outline"
                  className={cn(
                    "cursor-pointer h-9 px-4",
                    "dark:hover:bg-[#252525] hover:bg-gray-100",
                    "dark:border-[#333] border-gray-200",
                    "dark:text-white text-gray-900",
                    currentHistoryPage === 1 && "pointer-events-none opacity-50"
                  )}
                  onClick={() => setCurrentHistoryPage(prev => Math.max(prev - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Trang trước
                </Button>
              </PaginationItem>

              {[...Array(totalHistoryPages)].map((_, index) => {
                const pageNumber = index + 1;
                if (
                  pageNumber <= 3 ||
                  pageNumber > totalHistoryPages - 3 ||
                  Math.abs(pageNumber - currentHistoryPage) <= 1
                ) {
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => setCurrentHistoryPage(pageNumber)}
                        isActive={currentHistoryPage === pageNumber}
                        className={cn(
                          "cursor-pointer",
                          currentHistoryPage === pageNumber
                            ? "bg-[#09D1C7] text-white hover:bg-[#09D1C7]/90"
                            : "dark:hover:bg-[#252525] hover:bg-gray-100"
                        )}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (
                  (pageNumber === 4 && currentHistoryPage < totalHistoryPages - 3) ||
                  (pageNumber === totalHistoryPages - 3 && currentHistoryPage > 4)
                ) {
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return null;
              })}

              <PaginationItem>
                <Button
                  variant="outline"
                  className={cn(
                    "cursor-pointer h-9 px-4",
                    "dark:hover:bg-[#252525] hover:bg-gray-100",
                    "dark:border-[#333] border-gray-200",
                    "dark:text-white text-gray-900",
                    currentHistoryPage === totalHistoryPages && "pointer-events-none opacity-50"
                  )}
                  onClick={() => setCurrentHistoryPage(prev => Math.min(prev + 1, totalHistoryPages))}
                >
                  Trang sau
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </>
    );
  };

  return (
    <div className="bg-gray-50 dark:bg-[#0a0a14] min-h-screen -mx-4 md:-mx-8">
      <div className="px-4 py-6 border-b border-gray-200 dark:border-[#1a1a1a]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Quản lý thông báo</h1>
            <p className="text-gray-500 dark:text-[#666]">Theo dõi và quản lý các lệnh thông báo giá cổ phiếu</p>
          </div>
          <div className="flex items-center gap-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-[#09D1C7] hover:bg-[#0a8f88] text-white px-4 py-2 rounded-lg"
                >
                  Tạo thông báo mới
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white border-gray-200 dark:border-[#333]">
                <DialogHeader>
                  <DialogTitle>Tạo thông báo mới</DialogTitle>
                  <DialogDescription className="text-gray-500 dark:text-[#666]">
                    Thiết lập thông báo khi giá cổ phiếu đạt đến mức mong muốn.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="stock">Mã cổ phiếu</Label>
                    <Dialog open={open} onOpenChange={setOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between bg-gray-50 dark:bg-[#0a0a14] border-gray-200 dark:border-[#333] text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#252525]"
                        >
                          {newNotification.tickerSymbol
                            ? watchlistStocks.find((stock) => stock.ticketSymbol === newNotification.tickerSymbol)?.ticketSymbol
                            : "Chọn mã cổ phiếu..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white border-gray-200 dark:border-[#333] p-0">
                        <div className="p-4 border-b border-gray-200 dark:border-[#333]">
                          <div className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-gray-500 dark:text-[#666]" />
                            <Input
                              placeholder="Tìm kiếm mã cổ phiếu..."
                              value={searchQuery}
                              onChange={(e) => {
                                setSearchQuery(e.target.value);
                                const filtered = watchlistStocks.filter(stock =>
                                  stock.ticketSymbol.toLowerCase().includes(e.target.value.toLowerCase())
                                );
                                setFilteredStocks(filtered);
                              }}
                              className="border-0 p-0 text-sm bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                          </div>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto p-2">
                          {filteredStocks.length === 0 ? (
                            <div className="text-gray-500 dark:text-[#666] py-6 text-center text-sm">
                              Không tìm thấy mã cổ phiếu
                            </div>
                          ) : (
                            filteredStocks.map((stock) => (
                              <div
                                key={stock.id}
                                className={cn(
                                  "flex items-center gap-2 rounded-sm px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors",
                                  newNotification.tickerSymbol === stock.ticketSymbol ? "bg-gray-100 dark:bg-[#252525]" : ""
                                )}
                                onClick={() => {
                                  setNewNotification(prev => ({
                                    ...prev,
                                    tickerSymbol: stock.ticketSymbol
                                  }));
                                  setOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "h-4 w-4",
                                    newNotification.tickerSymbol === stock.ticketSymbol ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span>{stock.ticketSymbol}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Loại thông báo</Label>
                    <Select
                      value={newNotification.type}
                      onValueChange={(value) => setNewNotification(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger className="bg-gray-50 dark:bg-[#0a0a14] border-gray-200 dark:border-[#333] text-gray-900 dark:text-white">
                        <SelectValue placeholder="Chọn loại thông báo" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333]">
                        <SelectItem 
                          value="increase" 
                          className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#252525] focus:bg-gray-100 dark:focus:bg-[#252525]"
                        >
                          Khi giá tăng
                        </SelectItem>
                        <SelectItem 
                          value="decrease" 
                          className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#252525] focus:bg-gray-100 dark:focus:bg-[#252525]"
                        >
                          Khi giá giảm
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Giá mục tiêu</Label>
                    <Input
                      id="price"
                      type="number"
                      value={newNotification.price}
                      onChange={(e) => setNewNotification(prev => ({ ...prev, price: e.target.value }))}
                      className="bg-gray-50 dark:bg-[#0a0a14] border-gray-200 dark:border-[#333] text-gray-900 dark:text-white"
                      placeholder="Nhập giá mục tiêu"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="bg-transparent border-gray-200 dark:border-[#333] text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#252525]"
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleCreateNotification}
                    className="bg-[#09D1C7] hover:bg-[#0a8f88] text-white"
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      'Tạo thông báo'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              onClick={fetchNotifications}
              className="bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#252525] text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-[#333]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tải...
                </>
              ) : (
                'Làm mới'
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue={initialTab} className="w-full" onValueChange={(value) => setActiveTab(value)}>
          <TabsList className="bg-transparent border-b border-gray-200 dark:border-[#333] p-0 h-12 relative overflow-hidden rounded-t-lg">
            <div className="absolute bottom-0 left-0 h-full bg-[#09D1C7] transition-all duration-300 ease-in-out rounded-t-lg" 
                 style={{
                   width: '50%',
                   transform: `translateX(${activeTab === 'history' ? '100%' : '0'})`
                 }}
            />
            <TabsTrigger 
              value="active" 
              className="flex-1 h-12 relative z-10 data-[state=active]:text-white text-gray-500 dark:text-[#666] hover:text-gray-900 dark:hover:text-white transition-colors duration-300 data-[state=active]:bg-transparent rounded-tl-lg"
            >
              Lệnh đang theo dõi
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex-1 h-12 relative z-10 data-[state=active]:text-white text-gray-500 dark:text-[#666] hover:text-gray-900 dark:hover:text-white transition-colors duration-300 data-[state=active]:bg-transparent rounded-tr-lg"
            >
              Lịch sử thông báo
            </TabsTrigger>
          </TabsList>
          <TabsContent 
            value="active" 
            className="mt-4 transition-all duration-500 ease-in-out data-[state=inactive]:opacity-0 data-[state=active]:opacity-100 data-[state=inactive]:translate-x-[-20px] data-[state=active]:translate-x-0 data-[state=inactive]:scale-95 data-[state=active]:scale-100"
          >
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#333] overflow-hidden transform">
              <div className="p-4 border-b border-gray-200 dark:border-[#333] flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Danh sách lệnh thông báo</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-[#999]">
                  <span>Tổng số lệnh:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{notifications.length}</span>
                </div>
              </div>
              <div className="p-4">
                {renderTable()}
              </div>
            </div>
          </TabsContent>
          <TabsContent 
            value="history" 
            className="mt-4 transition-all duration-500 ease-in-out data-[state=inactive]:opacity-0 data-[state=active]:opacity-100 data-[state=inactive]:translate-x-[20px] data-[state=active]:translate-x-0 data-[state=inactive]:scale-95 data-[state=active]:scale-100"
          >
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#333] overflow-hidden transform">
              <div className="p-4 border-b border-gray-200 dark:border-[#333] flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Lịch sử thông báo</h2>
                <Button
                  onClick={fetchNotificationHistory}
                  className="bg-gray-100 dark:bg-[#252525] hover:bg-gray-200 dark:hover:bg-[#333] text-gray-900 dark:text-white px-4 py-2 rounded-lg"
                  disabled={isLoadingHistory}
                >
                  {isLoadingHistory ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang tải...
                    </>
                  ) : (
                    'Làm mới'
                  )}
                </Button>
              </div>
              <div className="p-4">
                {renderHistory()}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white border-gray-200 dark:border-[#333]">
          <DialogHeader>
            <DialogTitle>Cập nhật giá thông báo</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-[#666]">
              Thay đổi giá mục tiêu cho mã {editingNotification?.tickerSymbol?.toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Giá mục tiêu mới</Label>
              <Input
                id="price"
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="bg-gray-50 dark:bg-[#0a0a14] border-gray-200 dark:border-[#333] text-gray-900 dark:text-white"
                placeholder="Nhập giá mới"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="bg-transparent text-gray-900 dark:text-white border-gray-200 dark:border-[#333] hover:bg-gray-100 dark:hover:bg-[#333]"
            >
              Hủy
            </Button>
            <Button
              onClick={handleUpdatePrice}
              className="bg-[#09D1C7] hover:bg-[#0a8f88] text-white"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                'Cập nhật'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white border-gray-200 dark:border-[#333]">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa thông báo</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-[#666]">
              Bạn có chắc chắn muốn xóa thông báo cho mã {deletingNotification?.tickerSymbol?.toUpperCase()}?
              <br />
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeletingNotification(null);
              }}
              className="bg-transparent text-gray-900 dark:text-white border-gray-200 dark:border-[#333] hover:bg-gray-100 dark:hover:bg-[#333]"
              disabled={deletingIds.includes(deletingNotification?.id)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={deletingIds.includes(deletingNotification?.id)}
            >
              {deletingIds.includes(deletingNotification?.id) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                'Xóa thông báo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificationsPage; 