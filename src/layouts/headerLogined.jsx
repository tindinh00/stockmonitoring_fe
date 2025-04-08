import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import SearchInput from '@/components/search-input';
import { UserNav } from '@/components/layouts/user-nav';
import ThemeToggle from '@/components/layouts/ThemeToggle/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from 'sonner';
import { getUserId } from '@/api/Api';
import { stockService } from '@/api/StockApi';
import TradingSessionBadge from '@/components/TradingSessionBadge';

export default function HeaderLogined() {
  // State to store notifications
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notifications when popup opens
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const userId = getUserId();
      if (!userId) {
        console.warn("No user ID found for notifications");
        return;
      }

      const response = await stockService.getNotificationMessages(userId);
      if (response?.value?.data) {
        const notificationMessages = response.value.data.map(notification => ({
          id: notification.id,
          type: notification.type?.toLowerCase() || 'info',
          title: notification.title || 'Thông báo giá',
          message: notification.message,
          time: new Date(notification.time).toLocaleString(),
          read: notification.read || false,
          stockCode: notification.tickerSymbol?.toUpperCase(),
          exchange: notification.exchange
        }));
        setNotifications(notificationMessages);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Không thể tải thông báo");
    } finally {
      setLoading(false);
    }
  };

  // Setup auto-refresh when popup is open
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000); // Refresh every minute when open
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({
        ...notification,
        read: true
      }))
    );
    toast.success("Đã đánh dấu tất cả thông báo là đã đọc");
  };

  // Mark single notification as read
  const markAsRead = (id) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className='bg-[white] flex h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
      <div className='flex items-center gap-4 px-4 flex-1 overflow-hidden'>
        <SidebarTrigger className='-ml-1 text-black' />
        <Separator orientation='vertical' className='h-4' />
        <Breadcrumb />
        <div className='hidden md:flex'>
          <SearchInput />
        </div>
        <TradingSessionBadge />
        <Separator orientation='vertical' className='hidden sm:block h-4' />
        
        {/* Market Indices */}
        <div className='hidden lg:flex items-center gap-4 text-sm flex-1 min-w-0'>
          <div className='flex items-center gap-2 border border-gray-200 rounded-md px-3 py-1.5 w-full max-w-[500px] overflow-hidden relative'>
            <style>{`
              @keyframes scroll {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .scroll-container {
                animation: scroll 20s linear infinite;
                display: flex;
                width: max-content;
              }
              .scroll-container:hover {
                animation-play-state: paused;
              }
            `}</style>
            <div className="scroll-container">
              <div className='flex items-center gap-6'>
                <span className='text-[#00FF00] whitespace-nowrap'>VN30: 1,335.68 +2.72 (+0.2%)</span>
                <span className='text-[#FF4A4A] whitespace-nowrap'>HNX30: 495.07 -1.31 (-0.26%)</span>
                <span className='text-[#FF4A4A] whitespace-nowrap'>VNXALL: 2,186.07 -5.22 (-0.24%)</span>
              </div>
              <div className='flex items-center gap-6'>
                <span className='text-[#00FF00] whitespace-nowrap'>VN30: 1,335.68 +2.72 (+0.2%)</span>
                <span className='text-[#FF4A4A] whitespace-nowrap'>HNX30: 495.07 -1.31 (-0.26%)</span>
                <span className='text-[#FF4A4A] whitespace-nowrap'>VNXALL: 2,186.07 -5.22 (-0.24%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='flex items-center gap-2 px-4 shrink-0'>
        <Link to="/upgrade-package">
          <button className='hidden sm:flex bg-[#0ABDB4] hover:bg-[#0C6478] text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap'>
            Mua dịch vụ
          </button>
        </Link>
        
        <Popover onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                  {unreadCount}
                </span>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 bg-white" align="end">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h4 className="font-semibold text-sm text-black">Thông báo giá</h4>
              <button 
                className="text-xs text-blue-600 hover:text-blue-700"
                onClick={markAllAsRead}
              >
                Đánh dấu tất cả đã đọc
              </button>
            </div>
            <div className="max-h-[300px] overflow-auto">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-0 bg-white"
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        {notification.type === 'increase' && (
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          </div>
                        )}
                        {notification.type === 'decrease' && (
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-black">{notification.title}</p>
                          {notification.stockCode && (
                            <Badge variant={notification.type === 'increase' ? 'success' : 'destructive'} className="text-[10px]">
                              {notification.stockCode}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 truncate">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                      </div>
                      {!notification.read && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-gray-700 bg-white">
                  <p>Không có thông báo nào</p>
                </div>
              )}
            </div>
            <div className="p-2 text-center border-t border-gray-200 bg-white">
              <Link to="/notifications">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Xem tất cả thông báo
                </button>
              </Link>
            </div>
          </PopoverContent>
        </Popover>

        <UserNav />
      </div>
    </header>
  );
} 