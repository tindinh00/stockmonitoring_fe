import React, { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import SearchInput from '@/components/search-input';
import { UserNav } from '@/components/layouts/user-nav';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, AlertCircle, TrendingUp, TrendingDown, ChevronDown, Sun, Moon } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { getUserId } from '@/api/Api';
import { stockService } from '@/api/StockApi';
import TradingSessionBadge from '@/components/TradingSessionBadge';
import signalRService from '@/api/signalRService';
import axios from 'axios';
import { useAuth } from '@/Authentication/AuthContext';

// Component MarketIndices - được tách riêng và memo hóa để không re-render không cần thiết
const MarketIndexStyles = () => (
  <style>{`
    @-webkit-keyframes scroll {
      0% { -webkit-transform: translateX(0); transform: translateX(0); }
      100% { -webkit-transform: translateX(-50%); transform: translateX(-50%); }
    }
    
    @keyframes scroll {
      0% { -webkit-transform: translateX(0); transform: translateX(0); }
      100% { -webkit-transform: translateX(-50%); transform: translateX(-50%); }
    }
    
    .scroll-container {
      -webkit-animation: scroll 20s linear infinite;
      animation: scroll 20s linear infinite;
      display: flex;
      width: max-content;
      -webkit-transition: none;
      transition: none;
      will-change: transform;
      transform: translateZ(0);
      -webkit-transform: translateZ(0);
      -moz-transform: translateZ(0);
      -ms-transform: translateZ(0);
      -o-transform: translateZ(0);
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
    }
    
    .scroll-container:hover {
      -webkit-animation-play-state: paused;
      animation-play-state: paused;
    }
    
    @media (prefers-reduced-motion: reduce) {
      .scroll-container {
        -webkit-animation-play-state: paused;
        animation-play-state: paused;
      }
    }
    
    /* Khoảng cách giữa repeating blocks */
    .indices-block:last-child {
      margin-left: 40px; /* Thêm khoảng cách lớn giữa 2 khối */
    }
    
    /* Fix cho Safari */
    @supports (-webkit-hyphens:none) {
      .scroll-container {
        -webkit-animation: scroll 20s linear infinite;
        transform: translate3d(0, 0, 0);
        -webkit-transform: translate3d(0, 0, 0);
      }
    }
    
    /* Fix cho Firefox */
    @-moz-document url-prefix() {
      .scroll-container {
        animation: scroll 20s linear infinite;
        transform: translate3d(0, 0, 0);
      }
    }
    
    /* Fix cho IE và Edge cũ */
    @media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
      .scroll-container {
        animation: scroll 20s linear infinite;
        -ms-transform: translateX(0);
      }
      @keyframes scroll {
        0% { -ms-transform: translateX(0); }
        100% { -ms-transform: translateX(-50%); }
      }
    }
  `}</style>
);

// Component riêng cho Market Indices
const MarketIndices = memo(({ isLoadingIndices, marketIndices }) => {
  return (
    <div className='hidden lg:flex items-center gap-4 text-sm flex-1 min-w-0'>
      <div className='flex items-center gap-2 border border-[#15919B]/30 bg-gray-300 dark:bg-[#1a2e3f] rounded-md px-3 py-1.5 w-full max-w-[1050px] overflow-hidden relative'>
        <MarketIndexStyles />
        <div className="scroll-container">
          <div className='flex items-center gap-8 indices-block'>
            {isLoadingIndices ? (
              <span className="text-[#666]">Đang tải...</span>
            ) : (
              marketIndices.map((index) => (
                <span 
                  key={index.id} 
                  className={`whitespace-nowrap ${
                    index.changeClass === 'txt-green' ? 'dark:text-[#00FF00] text-[#10B981]' : 
                    index.changeClass === 'txt-red' ? 'text-[#FF4A4A]' :
                    'text-[#F4BE37]'
                  }`}
                >
                  {index.market}: {index.close} {' '}
                  {index.arrow === 'icon-arrow-up' ? '↑' : 
                   index.arrow === 'icon-arrow-down' ? '↓' : '■'} {' '}
                  {index.change}
                </span>
              ))
            )}
          </div>
          <div className='flex items-center gap-8 indices-block'>
            {!isLoadingIndices && marketIndices.map((index) => (
              <span 
                key={`${index.id}-duplicate`}
                className={`whitespace-nowrap ${
                  index.changeClass === 'txt-green' ? 'dark:text-[#00FF00] text-[#10B981]' : 
                  index.changeClass === 'txt-red' ? 'text-[#FF4A4A]' :
                  'text-[#F4BE37]'
                }`}
              >
                {index.market}: {index.close} {' '}
                {index.arrow === 'icon-arrow-up' ? '↑' : 
                 index.arrow === 'icon-arrow-down' ? '↓' : '■'} {' '}
                {index.change}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

MarketIndices.displayName = 'MarketIndices';

export default function HeaderLogined() {
  // State to store notifications
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [isTradingHours, setIsTradingHours] = useState(false);
  const [marketIndices, setMarketIndices] = useState([]);
  const [isLoadingIndices, setIsLoadingIndices] = useState(true);
  const [theme, setTheme] = useState('dark');
  const { user } = useAuth();
  
  // Tạo ref để theo dõi việc gắn listener cho marketIndices
  const marketIndicesListenerRef = React.useRef(false);

  // Add function to get read notifications from localStorage
  const getReadNotifications = () => {
    const userId = getUserId();
    try {
      const readNotifications = JSON.parse(localStorage.getItem(`readNotifications_${userId}`)) || {};
      return readNotifications;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return {};
    }
  };

  // Add function to save read notifications to localStorage
  const saveReadNotifications = (notificationIds) => {
    const userId = getUserId();
    try {
      localStorage.setItem(`readNotifications_${userId}`, JSON.stringify(notificationIds));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  // Toggle between light and dark mode
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  // Apply theme to the document
  const applyTheme = (theme) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Function to check if current time is within trading hours
  const checkTradingHours = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday

    // Check if it's weekend first
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      setIsTradingHours(false);
      return;
    }

    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 60 + minutes; // Convert to minutes since midnight

    // Morning session: 9:00 - 11:30 (540 - 690 minutes)
    // Afternoon session: 13:00 - 15:00 (780 - 900 minutes)
    const isMorningSession = currentTime >= 540 && currentTime <= 690;
    const isAfternoonSession = currentTime >= 780 && currentTime <= 900;

    setIsTradingHours(isMorningSession || isAfternoonSession);
  };

  // Fetch market indices
  const fetchMarketIndices = React.useCallback(async () => {
    try {
      console.log('[Market Indices] Fetching market indices');
      const response = await axios.get('https://stockmonitoring-api-gateway.onrender.com/api/stock/indexes/latest');
      if (response?.data?.value?.data) {
        setMarketIndices(response.data.value.data);
      }
    } catch (error) {
      console.error('Error fetching market indices:', error);
    } finally {
      setIsLoadingIndices(false);
    }
  }, []);

  // Update trading hours status every minute
  useEffect(() => {
    checkTradingHours(); // Initial check
    const interval = setInterval(checkTradingHours, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Fetch market indices initially and setup SignalR listener - tách thành useEffect riêng
  useEffect(() => {
    // Initial fetch
    fetchMarketIndices();

    // Setup SignalR listener for market indices updates
    const setupMarketIndicesListener = async () => {
      try {
        if (marketIndicesListenerRef.current) return;
        
        // Wait for connection to be established
        await signalRService.getConnection();
        
        // Setup market indices listener
        const handleMarketIndices = (event) => {
          const { data } = event.detail;
          if (data) {
            setMarketIndices(data);
          }
        };

        // Add event listener
        window.addEventListener('ReceiveIndexUpdate', handleMarketIndices);
        marketIndicesListenerRef.current = true;

        // Handle connection status changes
        const handleConnectionStatus = (event) => {
          const { status } = event.detail;
          if (status === 'connected') {
            console.log("[SignalR] Reconnected, re-fetching market indices");
            fetchMarketIndices();
          }
        };

        window.addEventListener('signalrConnectionStatus', handleConnectionStatus);

        // Return cleanup function
        return () => {
          window.removeEventListener('ReceiveIndexUpdate', handleMarketIndices);
          window.removeEventListener('signalrConnectionStatus', handleConnectionStatus);
          marketIndicesListenerRef.current = false;
        };
      } catch (error) {
        console.error("[SignalR] Error setting up market indices listener:", error);
        // Fallback to polling if SignalR fails
        const interval = setInterval(fetchMarketIndices, 60000);
        return () => clearInterval(interval);
      }
    };

    const cleanup = setupMarketIndicesListener();
    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(cleanupFn => {
          if (cleanupFn) cleanupFn();
        });
      }
    };
  }, [fetchMarketIndices]); // Chỉ phụ thuộc vào fetchMarketIndices

  // Modify fetchNotifications to include read status from localStorage
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
        const readNotifications = getReadNotifications();
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
            messageTime = matches[1];
            stockCode = matches[2].trim();
            targetPrice = matches[3].trim();
            currentPrice = matches[4].trim();
            exchange = matches[5].trim();
          }

          // If regex fails, try to extract data differently
          if (!stockCode && notification.message.includes("Thông báo: Giá của mã")) {
            const parts = notification.message.split(" ");
            for (let i = 0; i < parts.length; i++) {
              if (parts[i] === "mã" && i+1 < parts.length) {
                stockCode = parts[i+1];
              }
              if (parts[i] === "sàn" && i+1 < parts.length) {
                exchange = parts[i+1];
              }
            }
          }

          // Xác định kiểu thông báo dựa trên phân tích giá
          let notificationType = 'neutral';
          let priceChange = 0;
          
          if (targetPrice && currentPrice) {
            try {
              priceChange = parseFloat(currentPrice) - parseFloat(targetPrice);
              notificationType = priceChange >= 0 ? 'increase' : 'decrease';
            } catch (e) {
              console.error('Error calculating price change:', e);
            }
          }

          // Xử lý thời gian thông báo để tránh Invalid Date
          let formattedTime = '';
          try {
            if (messageTime) {
              const date = new Date(messageTime.replace(' ', 'T') + '.000Z');
              // Adjust for timezone by subtracting 7 hours
              date.setHours(date.getHours() - 7);
              formattedTime = date.toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              });
            } else if (notification.createdAt) {
              const date = new Date(notification.createdAt);
              date.setHours(date.getHours() - 7);
              formattedTime = date.toLocaleString('vi-VN');
            }
          } catch (e) {
            console.error('Error formatting time:', e, messageTime || notification.createdAt);
            formattedTime = messageTime || notification.createdAt || 'N/A'; // Fallback
          }

          const result = {
            id: notification.id,
            type: notificationType,
            title: 'Thông báo giá',
            message: notification.message,
            time: formattedTime || 'N/A',
            read: readNotifications[notification.id] === true,
            stockCode: stockCode || 'Unknown', // Always provide a stock code
            exchange: exchange || 'HSX', // Default to HSX if not found
            createdAt: notification.createdAt || messageTime || new Date().toISOString()
          };
          
          
          return result;
        });

        // Sort notifications by date
        notificationMessages.sort((a, b) => {
          // Ensure we have valid dates for comparison
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          
          // Use isValid check for Date objects
          const isValidA = !isNaN(dateA.getTime());
          const isValidB = !isNaN(dateB.getTime());
          
          // If both dates are valid, compare them
          if (isValidA && isValidB) {
            return dateB - dateA;
          }
          // If only one date is valid, prioritize the valid one
          if (isValidA) return -1;
          if (isValidB) return 1;
          
          // If neither date is valid, maintain original order
          return 0;
        });

        console.log("Final processed notifications:", notificationMessages);
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

    // Setup poll interval for notifications - always run regardless of SignalR
    const pollInterval = setInterval(() => {
      console.log("[Polling] Checking for new notifications");
      fetchNotifications();
    }, 10000); // Check every 10 seconds

    // Setup SignalR listener for real-time notifications
    const setupNotificationListener = async () => {
      try {
        // Wait for connection to be established
        await signalRService.getConnection();
        
        // Setup notification listeners
        const result = await signalRService.setupNotificationListeners();
        if (!result.success) {
          console.error("[SignalR] Failed to setup notification listeners:", result.message);
          return;
        }

        const handleNotification = (event) => {
          const data = event.detail;
          console.log("[SignalR] Received notification:", data);
          
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

          const priceChange = parseFloat(currentPrice) - parseFloat(targetPrice);
          const readNotifications = getReadNotifications();

          // Create a unique ID for the new notification
          const newNotificationId = crypto.randomUUID();

          setNotifications(prev => {
            const newNotification = {
              id: newNotificationId,
              type: priceChange >= 0 ? 'increase' : 'decrease',
              title: 'Thông báo giá',
              message: data.message,
              time: (() => {
                const date = new Date(data.time);
                // Adjust for timezone by subtracting 7 hours
                date.setHours(date.getHours() - 7);
                return date.toLocaleString('vi-VN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                });
              })(),
              read: readNotifications[newNotificationId] === true, // Use the ID directly
              stockCode: stockCode,
              exchange: exchange,
              createdAt: data.time
            };
            
            // Verify notification has all required properties
            console.log("New notification details:", {
              id: newNotification.id,
              type: newNotification.type,
              stockCode: newNotification.stockCode,
              exchange: newNotification.exchange,
            });
            
            return [newNotification, ...prev];
          });

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
        console.log("[SignalR] Falling back to polling mechanism entirely");
        // Retry connection after 5 seconds
        setTimeout(() => setupNotificationListener(), 5000);
      }
    };

    const cleanup = setupNotificationListener();
    
    // Clear both polling interval and SignalR listeners on unmount
    return () => {
      clearInterval(pollInterval);
      
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(cleanupFn => {
          if (cleanupFn) cleanupFn();
        });
      }
    };
  }, []);

  // Modify markAllAsRead to save to localStorage
  const markAllAsRead = () => {
    const readNotifications = getReadNotifications();
    const updatedReadNotifications = { ...readNotifications };
    
    notifications.forEach(notification => {
      updatedReadNotifications[notification.id] = true;
    });
    
    saveReadNotifications(updatedReadNotifications);
    
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({
        ...notification,
        read: true
      }))
    );
    toast.success("Đã đánh dấu tất cả thông báo là đã đọc");
  };

  // Modify markAsRead to save to localStorage
  const markAsRead = (id) => {
    const readNotifications = getReadNotifications();
    const updatedReadNotifications = { ...readNotifications, [id]: true };
    saveReadNotifications(updatedReadNotifications);
    
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Modify handleNotificationClick to include read status
  const handleNotificationClick = (id) => {
    markAsRead(id);
    setExpandedId(expandedId === id ? null : id);
  };

  // Hàm kiểm tra ngày hợp lệ
  const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  // Add a helper function to adjust and format dates
  const formatAdjustedDate = (dateString) => {
    if (!isValidDate(dateString)) return dateString;
    
    const date = new Date(dateString);
    // Adjust for timezone by subtracting 7 hours
    date.setHours(date.getHours() - 7);
    return date.toLocaleString('vi-VN');
  };

  return (
    <header className='header-logined bg-gray-200 dark:bg-[#213A51] flex h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
      <div className='flex items-center gap-4 px-4 flex-1 overflow-hidden'>
        <SidebarTrigger className='-ml-1 text-gray-900 dark:text-white' />
        <Separator orientation='vertical' className='h-4 bg-[#15919B]/30' />
        <div className={`px-3 py-1.5 rounded-md text-sm font-medium ${
          isTradingHours 
            ? 'bg-green-900/30 text-green-600 dark:text-green-400' 
            : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
        }`}>
          {isTradingHours ? 'Đang trong phiên' : 'Hết giờ'}
        </div>
        <Separator orientation='vertical' className='hidden sm:block h-4 bg-[#15919B]/30' />
        
        {/* Market Indices - Sử dụng component đã memo hóa */}
        <MarketIndices 
          isLoadingIndices={isLoadingIndices}
          marketIndices={marketIndices}
        />
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
              <button className="p-2 hover:bg-gray-200 dark:hover:bg-[#1a2e3f] rounded-full transition-colors">
                <Bell className="w-5 h-5 text-gray-900 dark:text-gray-300" />
              </button>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                  {unreadCount}
                </span>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 bg-white dark:bg-[#213A51] border-gray-200 dark:border-[#15919B]/30" align="end">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#15919B]/30">
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Thông báo giá</h4>
              <button 
                className="text-xs text-[#46DFB1] hover:text-[#0ABDB4]"
                onClick={markAllAsRead}
              >
                Đánh dấu tất cả đã đọc
              </button>
            </div>
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: rgba(0, 0, 0, 0.1);
                  border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: rgba(21, 145, 155, 0.5);
                  border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: rgba(21, 145, 155, 0.7);
                }
                .dark .custom-scrollbar::-webkit-scrollbar-track {
                  background: rgba(255, 255, 255, 0.05);
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: rgba(21, 145, 155, 0.5);
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: rgba(21, 145, 155, 0.7);
                }
              `}</style>
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#1a2e3f] transition-all duration-200 cursor-pointer border-b border-gray-200 dark:border-[#15919B]/30 last:border-0
                      ${expandedId === notification.id ? 'bg-gray-100 dark:bg-[#1a2e3f]' : ''}`}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        {notification.type === 'increase' ? (
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-[#10B981] dark:text-green-400" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <TrendingDown className="w-4 h-4 text-red-500 dark:text-red-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          
                          {/* Force display stock code badge */}
                          <Badge 
                            variant="default"
                            className={`text-[10px] px-2 ${
                              notification.type === 'increase' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-[#10B981] dark:text-green-400' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400'
                            }`}
                          >
                            {notification.stockCode || 
                              notification.message.match(/Giá của mã (.*?) đã/)?.[1] || 
                              "HTI"}
                          </Badge>
                          
                          {/* Force display exchange badge */}
                          <Badge 
                            variant="outline" 
                            className="text-[10px] px-2 border-gray-300 dark:border-[#15919B]/30 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#1a2e3f]"
                          >
                            {notification.exchange || 
                              notification.message.match(/theo sàn (.*?)$/)?.[1] || 
                              "HSX"}
                          </Badge>
                        </div>
                        <div className={`text-sm text-gray-700 dark:text-gray-300 transition-all duration-200 overflow-hidden
                          ${expandedId === notification.id ? 'max-h-[500px]' : 'max-h-[20px]'}`}>
                          <p className={expandedId === notification.id ? '' : 'line-clamp-1'}>
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(() => {
                              // First try to use the already formatted time
                              if (notification.time && notification.time !== 'Invalid Date' && notification.time !== 'N/A') {
                                return notification.time;
                              }
                              
                              // If that fails, try formatting from createdAt
                              if (isValidDate(notification.createdAt)) {
                                return formatAdjustedDate(notification.createdAt);
                              }
                              
                              // Last resort, show what we have
                              return notification.time || notification.createdAt || 'N/A';
                            })()}
                          </p>
                          {expandedId === notification.id && (
                            <button 
                              className="text-xs text-[#46DFB1] hover:text-[#0ABDB4]"
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
                          <div className="w-2 h-2 bg-[#46DFB1] rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-gray-700 dark:text-gray-300 bg-white dark:bg-[#213A51]">
                  <p>Không có thông báo nào</p>
                </div>
              )}
            </div>
            <div className="p-2 text-center border-t border-gray-200 dark:border-[#15919B]/30 bg-white dark:bg-[#213A51]">
              <Link to="/notifications?tab=history">
                <button className="text-sm text-[#46DFB1] hover:text-[#0ABDB4] font-medium">
                  Xem tất cả thông báo
                </button>
              </Link>
            </div>
          </PopoverContent>
        </Popover>

        {/* Theme Switcher */}
        <button 
          onClick={toggleTheme}
          className="p-2 hover:bg-gray-200 dark:hover:bg-[#1a2e3f] rounded-full transition-colors"
          title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-gray-300" />
          ) : (
            <Moon className="w-5 h-5 text-gray-900" />
          )}
        </button>

        <UserNav />
      </div>
    </header>
  );
} 