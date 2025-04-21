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
import signalRService from '@/api/signalRService';

export default function HeaderLogined() {
  // State to store notifications
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

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
        const notificationMessages = response.value.data.map(notification => {
          // Extract information from message using regex
          const messageRegex = /\[(.*?)\] Thông báo: Giá của mã (.*?) đã đạt hoặc vượt qua mức (.*?)\. Tại mức: (.*?) theo sàn (.*?)$/;
          const matches = notification.message.match(messageRegex);
          
          let stockCode = '';
          let targetPrice = '';
          let currentPrice = '';
          let exchange = '';
          let messageTime = '';
          
          if (matches && matches.length >= 6) {
            messageTime = matches[1]; // "2025-04-17 12:07:49"
            stockCode = matches[2].trim(); // Ensure no whitespace
            targetPrice = matches[3].trim();
            currentPrice = matches[4].trim();
            exchange = matches[5].trim(); // Ensure no whitespace
          }

          // Determine if price is increasing or decreasing
          const priceChange = parseFloat(currentPrice) - parseFloat(targetPrice);

          // Convert message time string to Date object and adjust for Vietnam timezone (-7 hours)
          const timeStr = messageTime.replace(' ', 'T') + 'Z';
          const messageDate = new Date(timeStr);
          messageDate.setHours(messageDate.getHours() - 7); // Adjust for Vietnam timezone

          return {
            id: notification.id,
            type: priceChange >= 0 ? 'increase' : 'decrease',
            title: 'Thông báo giá',
            message: notification.message,
            time: messageDate.toLocaleString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            }),
            read: false,
            stockCode: stockCode,
            exchange: exchange,
            createdAt: messageTime
          };
        });

        // Sort by createdAt in descending order
        notificationMessages.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );

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

  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Setup SignalR listener for real-time notifications
    const setupNotificationListener = async () => {
      try {
        const connection = await signalRService.getConnection();
        if (!connection) {
          console.error("[SignalR] No active connection available");
          return;
        }

        const handleNotification = (event) => {
          const data = event.detail;
          console.log("[SignalR] Received notification:", data);
          
          // Extract information from message using regex
          const messageRegex = /\[(.*?)\] Thông báo: Giá của mã (.*?) đã đạt hoặc vượt qua mức (.*?)\. Tại mức: (.*?) theo sàn (.*?)$/;
          const matches = data.message.match(messageRegex);
          
          let stockCode = '';
          let targetPrice = '';
          let currentPrice = '';
          let exchange = data.exchange || '';
          
          if (matches && matches.length >= 6) {
            stockCode = matches[2].trim();
            targetPrice = matches[3].trim();
            currentPrice = matches[4].trim();
            if (!exchange) {
              exchange = matches[5].trim();
            }
          }

          // Determine if price is increasing or decreasing
          const priceChange = parseFloat(currentPrice) - parseFloat(targetPrice);

          // Add new notification to the list
          setNotifications(prev => {
            const newNotification = {
              id: crypto.randomUUID(),
              type: priceChange >= 0 ? 'increase' : 'decrease',
              title: 'Thông báo giá',
              message: data.message,
              time: new Date(data.time).toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              }),
              read: false,
              stockCode: stockCode,
              exchange: exchange,
              createdAt: data.time
            };
            return [newNotification, ...prev];
          });

          // Show toast notification
          toast.info("Có thông báo giá mới!", {
            description: `${stockCode} - ${exchange}`,
            action: {
              label: "Xem",
              onClick: () => setIsOpen(true)
            }
          });
        };

        // Add event listener
        window.addEventListener('stockNotification', handleNotification);

        // Setup SignalR notification listeners
        await signalRService.setupNotificationListeners();
        console.log("[SignalR] Notification listener setup complete");

        // Handle connection status changes
        const handleConnectionStatus = (event) => {
          const { status } = event.detail;
          if (status === 'connected') {
            console.log("[SignalR] Reconnected, re-setting up notification listeners");
            signalRService.setupNotificationListeners();
          }
        };

        window.addEventListener('signalrConnectionStatus', handleConnectionStatus);

        // Return cleanup function
        return () => {
          window.removeEventListener('stockNotification', handleNotification);
          window.removeEventListener('signalrConnectionStatus', handleConnectionStatus);
        };
      } catch (error) {
        console.error("[SignalR] Error setting up notification listener:", error);
      }
    };

    const cleanup = setupNotificationListener();
    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(cleanupFn => {
          if (cleanupFn) cleanupFn();
        });
      }
    };
  }, []);

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

  const handleNotificationClick = (id) => {
    markAsRead(id);
    setExpandedId(expandedId === id ? null : id);
  };

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
            <div className="max-h-[400px] overflow-auto">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`px-4 py-3 hover:bg-gray-50 transition-all duration-200 cursor-pointer border-b border-gray-100 last:border-0 bg-white
                      ${expandedId === notification.id ? 'bg-gray-50' : ''}`}
                    onClick={() => handleNotificationClick(notification.id)}
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
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-black">{notification.title}</p>
                          {notification.stockCode && (
                            <Badge 
                              variant="default"
                              className={`text-[10px] px-2 ${
                                notification.type === 'increase' 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                              }`}
                            >
                              {notification.stockCode}
                            </Badge>
                          )}
                          {notification.exchange && (
                            <Badge 
                              variant="outline" 
                              className="text-[10px] px-2 border-gray-300 text-gray-700 bg-gray-50"
                            >
                              {notification.exchange}
                            </Badge>
                          )}
                        </div>
                        <div className={`text-sm text-gray-700 transition-all duration-200 overflow-hidden
                          ${expandedId === notification.id ? 'max-h-[500px]' : 'max-h-[20px]'}`}>
                          <p className={expandedId === notification.id ? '' : 'line-clamp-1'}>
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500">{notification.time}</p>
                          {expandedId === notification.id && (
                            <button 
                              className="text-xs text-blue-600 hover:text-blue-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedId(null);
                              }}
                            >
                              Thu gọn
                            </button>
                          )}
                        </div>
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