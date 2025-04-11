import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getUserId } from '@/api/Api';
import { stockService } from '@/api/StockApi';
import { toast } from "sonner";
import { Loader2, Bell, AlertTriangle, ArrowUpDown, ArrowDown, ArrowUp, Trash2, Pencil } from 'lucide-react';
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
import signalRService from "@/api/signalRService";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [watchlistStocks, setWatchlistStocks] = useState([]);
  const [newNotification, setNewNotification] = useState({
    tickerSymbol: '',
    price: '',
    type: 'increase' // Thay đổi giá trị mặc định
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [newPrice, setNewPrice] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingNotification, setDeletingNotification] = useState(null);
  const [deletingIds, setDeletingIds] = useState([]); // Track which notifications are being deleted

  useEffect(() => {
    fetchNotifications();
    fetchWatchlistStocks();
    
    const setupNotificationListener = async () => {
      try {
        const userId = getUserId();
        if (!userId) {
          console.warn("No user ID found for notification subscription");
          return;
        }
        console.log("[Notifications] Setting up notification listener for user:", userId);

        // Đảm bảo kết nối được thiết lập trước
        const connection = await signalRService.startStockConnection();
        console.log("[Notifications] SignalR connection state:", connection?.state);
        
        // Đợi một chút để kết nối ổn định
        await new Promise(resolve => setTimeout(resolve, 1000));

        const result = await signalRService.setupNotificationListener(userId);
        console.log("[Notifications] Setup result:", result);
        
        if (result.success) {
          console.log("[Notifications] Listener setup successful, registering event handler");
          
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
            signalRService.leaveNotificationGroup(userId).catch(console.error);
          };
        } else {
          console.error("Failed to setup notification listener:", result.message);
          // Thử kết nối lại sau 5 giây
          setTimeout(() => setupNotificationListener(), 5000);
        }
      } catch (error) {
        console.error("Error setting up notification listener:", error);
        // Thử kết nối lại sau 5 giây
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
        tickerSymbol: newNotification.tickerSymbol.toLowerCase(),
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
      
      // Reset form
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
        tickerSymbol: editingNotification.tickerSymbol,
        userId: editingNotification.userId,
        price: parseFloat(newPrice),
        type: editingNotification.type
      };
      
      const response = await stockService.updateNotificationPrice(editingNotification.id, data);
      toast.success(response?.value?.data || "Cập nhật giá thành công", {
        duration: 5000
      });
      setIsEditDialogOpen(false);
      fetchNotifications(); // Refresh the list
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

  const renderTable = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-[#09D1C7] animate-spin mb-4" />
          <p className="text-[#999]">Đang tải dữ liệu thông báo...</p>
        </div>
      );
    }

    if (notifications.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-[#252525] rounded-full flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-[#666]" />
          </div>
          <h3 className="text-white font-medium mb-2">Chưa có lệnh thông báo</h3>
          <p className="text-[#666] max-w-md">
            Bạn chưa có lệnh thông báo nào. Hãy tạo lệnh thông báo mới để theo dõi biến động giá cổ phiếu.
          </p>
        </div>
      );
    }

    return (
      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white">Mã cổ phiếu</TableHead>
              <TableHead className="text-white">Giá mục tiêu</TableHead>
              <TableHead className="text-white">Loại thông báo</TableHead>
              <TableHead className="text-white">Trạng thái</TableHead>
              <TableHead className="text-white">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications.map((notification) => (
              <TableRow key={notification.id}>
                <TableCell className="font-medium text-white text-left">
                  {notification.tickerSymbol.toUpperCase()}
                </TableCell>
                <TableCell className="text-white text-left">
                  {notification.price.toLocaleString()}
                </TableCell>
                <TableCell className="text-white text-left">
                  {notification.type === 'increase' ? 'Khi giá tăng' : 'Khi giá giảm'}
                </TableCell>
                <TableCell className="text-white text-left">
                  <Badge 
                    variant={notification.status === 'ACTIVE' ? 'success' : 'secondary'}
                    className={notification.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-500'}
                  >
                    {notification.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã kết thúc'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700"
                      onClick={() => handleEditPrice(notification)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
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
      </div>
    );
  };

  return (
    <div className="bg-[#0a0a14] min-h-screen -mx-4 md:-mx-8">
      {/* Page Header */}
      <div className="px-4 py-6 border-b border-[#1a1a1a]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Quản lý thông báo</h1>
            <p className="text-[#666]">Theo dõi và quản lý các lệnh thông báo giá cổ phiếu</p>
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
              <DialogContent className="bg-[#1a1a1a] text-white border-[#333]">
                <DialogHeader>
                  <DialogTitle>Tạo thông báo mới</DialogTitle>
                  <DialogDescription className="text-[#666]">
                    Thiết lập thông báo khi giá cổ phiếu đạt đến mức mong muốn.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="stock">Mã cổ phiếu</Label>
                    <Select
                      value={newNotification.tickerSymbol}
                      onValueChange={(value) => setNewNotification(prev => ({ ...prev, tickerSymbol: value }))}
                    >
                      <SelectTrigger className="bg-[#0a0a14] border-[#333] text-white">
                        <SelectValue placeholder="Chọn mã cổ phiếu" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-[#333]">
                        {watchlistStocks.map((stock) => (
                          <SelectItem 
                            key={stock.id} 
                            value={stock.ticketSymbol}
                            className="text-white hover:bg-[#252525] focus:bg-[#252525]"
                          >
                            {stock.ticketSymbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Loại thông báo</Label>
                    <Select
                      value={newNotification.type}
                      onValueChange={(value) => setNewNotification(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger className="bg-[#0a0a14] border-[#333] text-white">
                        <SelectValue placeholder="Chọn loại thông báo" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-[#333]">
                        <SelectItem 
                          value="increase" 
                          className="text-white hover:bg-[#252525] focus:bg-[#252525]"
                        >
                          Khi giá tăng
                        </SelectItem>
                        <SelectItem 
                          value="decrease" 
                          className="text-white hover:bg-[#252525] focus:bg-[#252525]"
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
                      className="bg-[#0a0a14] border-[#333] text-white"
                      placeholder="Nhập giá mục tiêu"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="bg-transparent border-[#333] text-white hover:bg-[#252525]"
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
              className="bg-[#1a1a1a] hover:bg-[#252525] text-white px-4 py-2 rounded-lg border border-[#333]"
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

      {/* Main Content */}
      <div className="p-4">
        <div className="bg-[#1a1a1a] rounded-xl border border-[#333] overflow-hidden">
          <div className="p-4 border-b border-[#333] flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Danh sách lệnh thông báo</h2>
            <div className="flex items-center gap-2 text-sm text-[#999]">
              <span>Tổng số lệnh:</span>
              <span className="text-white font-medium">{notifications.length}</span>
            </div>
          </div>
          
          <div className="p-4">
            {renderTable()}
          </div>
        </div>
      </div>

      {/* Edit Price Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] text-white border-[#333]">
          <DialogHeader>
            <DialogTitle>Cập nhật giá thông báo</DialogTitle>
            <DialogDescription className="text-[#666]">
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
                className="bg-[#0a0a14] border-[#333] text-white"
                placeholder="Nhập giá mới"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="bg-transparent text-white border-[#333] hover:bg-[#333]"
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] text-white border-[#333]">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa thông báo</DialogTitle>
            <DialogDescription className="text-[#666]">
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
              className="bg-transparent text-white border-[#333] hover:bg-[#333]"
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