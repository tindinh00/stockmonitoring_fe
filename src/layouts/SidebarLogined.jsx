'use client';
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  ChevronRight, 
  ChevronsUpDown, 
  GalleryVerticalEnd,
  BadgeCheck,
  Bell,
  CreditCard,
  LogOut,
  PanelLeft,
  User,
  Settings,
  LineChart,
  Bookmark,
  Newspaper,
  Star,
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Bot,
  BrainCircuit,
  Presentation,
  Wallet,
  TrendingUp,
  LayoutGrid,
  BookOpen,
  Zap,
  Shield,
  ChevronLeft,
  ArrowRight,
  ArrowRightFromLine,
  ArrowLeftFromLine
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarProvider,
  useSidebar
} from '@/components/ui/sidebar';
import { useAuth } from '@/Authentication/AuthContext';
import { toast } from 'sonner';
import useFeatureStore, { FREE_FEATURES, PREMIUM_FEATURES, FEATURE_MAPPING } from '@/store/featureStore';
import UnauthorizedFeatureMessage from '@/components/UnauthorizedFeatureMessage.jsx';

// Icons component
const Icons = {
  stock: LineChart,
  watchlist: Star,
  news: Newspaper,
  heatmap: LayoutDashboard,
  notifications: Bell,
  chat: MessageSquare,
  'ai-chat': Bot,
  analytics: BarChart3,
  forecast: BrainCircuit,
  knowledge: BookOpen
};

// Configuration for navigation items with their required features and categories
const categoryGroups = [
  {
    name: "Chung",
    items: [
      {
        title: 'Bảng giá',
        icon: 'stock',
        href: '/stock',
        feature: 'Hiển thị dữ liệu thị trường chứng khoán',
        isFree: true
      },
      {
        title: 'Bản đồ nhiệt',
        icon: 'heatmap',
        href: '/heatmap',
        feature: 'Bản đồ nhiệt',
        isFree: true
      }
    ]
  },
  {
    name: "Theo dõi",
    items: [
      {
        title: 'Danh mục theo dõi',
        icon: 'watchlist',
        href: '/watchlist',
        feature: 'Quản lý danh mục theo dõi cổ phiếu',
        isPremium: true
      },
      {
        title: 'Thông báo',
        icon: 'notifications',
        href: '/notifications',
        feature: 'Quản lý thông báo theo nhu cầu',
        isPremium: true
      }
    ]
  },
  {
    name: "Phân tích",
    items: [
      {
        title: 'Phân tích cá nhân',
        icon: 'analytics',
        href: '/analytics',
        feature: 'Phân tích và gợi ý theo cá nhân hóa',
        isPremium: true
      },
      {
        title: 'Dự đoán giá',
        icon: 'forecast',
        href: '/forecast',
        feature: 'Dự đoán giá',
        isPremium: true
      },
      {
        title: 'Chat với AI',
        icon: 'ai-chat',
        href: '/ai-chat',
        feature: 'Trợ lý AI',
        isPremium: true
      }
    ]
  },
  {
    name: "Blog",
    items: [
      {
        title: 'Tin tức',
        icon: 'news',
        href: '/news',
        feature: 'Xem tin tức thị trường',
        isFree: true
      },
      {
        title: 'Kiến thức',
        icon: 'knowledge',
        href: '/knowledge',
        feature: 'Xem kiến thức đầu tư',
        isFree: true
      }
    ]
  },
  {
    name: "Hỗ trợ",
    items: [
      {
        title: 'Chat với hỗ trợ',
        icon: 'chat',
        href: '/chat',
        feature: 'Hộp thoại hỗ trợ người dùng (Chatbox)',
        isFree: true
      }
    ]
  }
];

// For backwards compatibility, create a flat menuItems array
const menuItems = categoryGroups.flatMap(group => group.items);

// Company data
export const company = {
  name: 'StockFlow',
  logo: GalleryVerticalEnd,
  plan: 'Enterprise'
};

// Custom sidebar trigger component
export function CustomSidebarTrigger() {
  const { toggleSidebar, open } = useSidebar();
  return null;
}

// Add state for feature message
export default function SidebarLogined() {
  const { open, state, isMobile, setOpen } = useSidebar();
  const location = useLocation();
  const pathname = location.pathname;
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const features = useFeatureStore((state) => state.features);
  const [showFeatureMessage, setShowFeatureMessage] = useState(false);
  const [lockedFeature, setLockedFeature] = useState(null);
  const [featureMessageInfo, setFeatureMessageInfo] = useState({ name: '', returnPath: '/stock' });
  const { hasFeature, hasMenuAccess } = useFeatureStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("");
  
  // Create ref for sidebar
  const sidebarRef = React.useRef(null);
  
  // Track if the sidebar is actually collapsed visually
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Check sidebar state
  useEffect(() => {
    const checkIfCollapsed = () => {
      // First check if the DOM is ready and sidebar element exists
      if (sidebarRef.current) {
        // Check if sidebar is visually collapsed
        const sidebarWidth = sidebarRef.current.offsetWidth;
        const isCollapsed = !open || sidebarWidth < 100;
        setSidebarCollapsed(isCollapsed);
        console.log('Sidebar collapsed:', isCollapsed, 'width:', sidebarWidth);
      }
    };
    
    // Check on mount and whenever open state changes
    checkIfCollapsed();
    
    // Also check after a short delay to account for animations
    const timeoutId = setTimeout(checkIfCollapsed, 300);
    
    // Clean up the timeout
    return () => clearTimeout(timeoutId);
  }, [open]);

  // Initialize sidebar state from cookie only once when component mounts
  useEffect(() => {
    const cookies = document.cookie.split(';');
    const sidebarCookie = cookies.find(cookie => cookie.trim().startsWith('sidebar_state='));
    if (sidebarCookie) {
      const savedState = sidebarCookie.split('=')[1] === 'true';
      setOpen(savedState);
    }
  }, []); // Empty dependency array means this runs only once on mount

  // Debug log to check features
  useEffect(() => {
    console.log('Current user features from store:', features);
    
    // Kiểm tra các tính năng quan trọng
    const importantFeatures = [
      "Hiển thị dữ liệu thị trường chứng khoán",
      "Quản lý danh mục theo dõi cổ phiếu",
      "Phân tích và gợi ý theo cá nhân hóa",
      "Quản lý thông báo theo nhu cầu",
      "Trợ lý AI"
    ];
    
    console.log('Tình trạng các tính năng quan trọng:');
    importantFeatures.forEach(feature => {
      console.log(`- ${feature}: ${hasFeature(feature) ? 'Có quyền truy cập' : 'Không có quyền truy cập'}`);
    });
    
    // Log gói hiện tại
    console.log('Gói dịch vụ hiện tại:', user?.tier || 'Chưa đăng nhập');
  }, [features, user]);

  const checkFeatureAccess = (requiredFeature) => {
    // Debug log
    console.log('Checking feature access:', {
      requiredFeature,
      availableFeatures: features
    });

    // Nếu là tính năng miễn phí trong FREE_FEATURES, luôn cho phép truy cập
    if (FREE_FEATURES.includes(requiredFeature)) {
      console.log(`"${requiredFeature}" là tính năng miễn phí`);
      return true;
    }

    // Kiểm tra trực tiếp trong features array
    const hasAccess = features.includes(requiredFeature);
    console.log(`Access check result for "${requiredFeature}":`, hasAccess);
    return hasAccess;
  };

  // Avatar initials
  const getInitials = () => {
    if (!user || !user.name) return "U";
    return user.name.charAt(0).toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Đăng xuất thành công!", {
        position: "top-right",
        duration: 2000,
      });
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Có lỗi xảy ra khi đăng xuất", {
        position: "top-right",
        duration: 3000,
      });
    }
  };
  
  const renderNavItem = (item) => {
    const isActiveLink = pathname === item.href;
    
    // Xác định quyền truy cập
    let userHasFeature = false;
    
    if (item.isFree) {
      // Tính năng miễn phí, luôn cho phép truy cập
      userHasFeature = true;
    } else if (item.feature) {
      // Nếu là tính năng cao cấp, kiểm tra quyền truy cập
      userHasFeature = checkFeatureAccess(item.feature);
    }
    
    const isDisabled = !userHasFeature;
    const Icon = Icons[item.icon];
    const isPremium = item.isPremium === true;

    const handleNavItemClick = (e) => {
      if (isDisabled) {
        e.preventDefault();
        e.stopPropagation();
        setFeatureMessageInfo({
          name: item.title,
          returnPath: '/stock'
        });
        setShowFeatureMessage(true);
        setLockedFeature(item.title);
      }
    };

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          asChild={userHasFeature}
          tooltip={item.title}
          isActive={isActiveLink}
          className={`
            transition-all duration-300 
            ${isActiveLink ? 'bg-[#09D1C7]/10 dark:bg-[#09D1C7]/10 text-[#09D1C7] font-medium' : 'text-gray-600 dark:text-gray-400 hover:text-[#09D1C7] hover:bg-gray-200 dark:hover:bg-gray-800'}
            ${!userHasFeature ? 'opacity-65 cursor-not-allowed' : ''}
            py-0.5 text-sm
          `}
          onClick={handleNavItemClick}
        >
          {userHasFeature ? (
            <Link
              to={item.href}
              className={cn(
                "flex items-center gap-1.5 w-full sidebar-link",
                isActiveLink && "text-[#09D1C7] bg-gray-100 dark:bg-[#1a1a1a]",
                "group-[[data-collapsed=true]]:px-2"
              )}
            >
              <span className="icon-wrapper flex-shrink-0">
                <Icon className={`size-4 ${isActiveLink ? 'text-[#09D1C7]' : ''}`} />
              </span>
              <span className="link-text text-sm">{item.title}</span>
            </Link>
          ) : (
            <div 
              className="flex items-center justify-between w-full cursor-pointer sidebar-link"
              onClick={handleNavItemClick}
            >
              <div className="flex items-center gap-1.5">
                <span className="icon-wrapper flex-shrink-0">
                  <Icon className="size-4 text-gray-500" />
                </span>
                <span className="link-text text-sm text-gray-500">{item.title}</span>
              </div>
              <span className="icon-wrapper flex-shrink-0">
                <img 
                  src="/icons/workspace_premium.svg" 
                  alt="Premium" 
                  className="size-4" 
                />
              </span>
            </div>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  // Expand the sidebar styles
  const sidebarStyles = `
    /* Ensure all icons are the same size in collapsed state */
    .group-data-[collapsible=icon] .icon-wrapper svg,
    .group-data-[collapsible=icon] .icon-wrapper img {
      width: 1.5rem !important;
      height: 1.5rem !important;
      min-width: 1.5rem !important;
      min-height: 1.5rem !important;
    }

    /* Make all sidebar menu buttons display icons consistently */
    [data-sidebar="menu-button"] {
      display: flex;
      align-items: center;
      padding-top: 2px !important;
      padding-bottom: 2px !important;
      min-height: 28px !important;
    }

    /* Force consistent sizing in collapsed state */
    .group-data-[collapsible=icon] [data-sidebar="menu-button"] .icon-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    /* Force text to hide in collapsed state */
    .group-data-[collapsible=icon] .link-text {
      display: none;
    }

    /* Ensure icons are centered in collapsed state */
    .group-data-[collapsible=icon] .sidebar-link {
      justify-content: center;
      width: 100%;
    }

    /* Set fixed size for all icons regardless of sidebar state */
    .icon-wrapper svg,
    .icon-wrapper img {
      width: 1.25rem;
      height: 1.25rem;
      min-width: 1.25rem;
      min-height: 1.25rem;
    }

    /* Extreme reduction of spacing between menu items */
    [data-sidebar="menu-item"] {
      margin: 0 !important;
      padding: 0 !important;
    }
    
    /* Make sidebar groups more compact */
    [data-sidebar="group"] {
      margin-top: 0.25rem !important;
      margin-bottom: 0.25rem !important;
      padding-top: 0 !important;
      padding-bottom: 0 !important;
    }
    
    /* Make group labels ultra compact */
    [data-sidebar="group-label"] {
      padding-top: 0.35rem !important;
      padding-bottom: 0.15rem !important;
      margin-bottom: 0.1rem !important;
      font-size: 0.8rem !important;
      font-weight: 500 !important;
      opacity: 0.85;
    }
    
    /* Complete fix for hiding group labels in collapsed state - using multiple selectors for redundancy */
    [data-collapsed="true"] [data-sidebar="group-label"],
    [data-state="closed"] [data-sidebar="group-label"],
    [data-collapsible="icon"][data-state="closed"] [data-sidebar="group-label"],
    .group-data-[collapsible=icon] [data-sidebar="group-label"],
    div[data-collapsible="icon"][data-state="closed"] div[data-sidebar="group-label"] {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      height: 0 !important;
      overflow: hidden !important;
      position: absolute !important;
      pointer-events: none !important;
      z-index: -1 !important;
    }
    
    /* Remove default padding from menus */
    [data-sidebar="menu"] {
      padding: 0 !important;
    }
    
    /* Make sidebar content more compact */
    [data-sidebar="content"] {
      gap: 0.2rem !important;
    }
  `;

  // Function to get tier icon and color
  const getTierStyles = (tier) => {
    if (!tier) return { icon: Star, color: "#09D1C7" };
    
    switch(tier.toLowerCase()) {
      case 'free':
        return { 
          icon: Star, 
          color: "#80EE98",
          name: "Free"
        };
      case 'tracking':
        return { 
          icon: LineChart, 
          color: "#6A11CB",
          name: "Tracking"
        };
      case 'analyze':
        return { 
          icon: BarChart3, 
          color: "#fe5d6a",
          name: "Analyze"
        };
      case 'premium':
        return { 
          icon: Shield, 
          color: "#ff9f43",
          name: "Premium"
        };
      default:
        return { 
          icon: Star, 
          color: "#09D1C7",
          name: tier
        };
    }
  };

  return (
    <>
      <style>{sidebarStyles}</style>
      <Sidebar collapsible='icon' className="bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800" ref={sidebarRef}>
        <SidebarHeader className="bg-white dark:bg-black">
          <div className='flex gap-2 py-2 text-gray-900 dark:text-white'>
            <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-r from-[#09D1C7] to-[#0a8f88]'>
              <company.logo className='size-4 text-white' />
            </div>
            <div className='grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden'>
              <span className='truncate font-semibold text-primary'>{company.name}</span>
              {user?.tier && (() => {
                const tierInfo = getTierStyles(user.tier);
                const { icon: TierIcon, color, name } = tierInfo;
                return (
                  <div className='inline-flex items-center gap-1'>
                    <span className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded-full`} 
                      style={{ 
                        color: color,
                        backgroundColor: `${color}10`,
                        borderColor: `${color}30`,
                        borderWidth: '1px'
                      }}>
                      <TierIcon className="w-3 h-3" />
                      {name}
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className='overflow-x-hidden'>
          {categoryGroups.map((category) => (
            <SidebarGroup key={category.name}>
              {!sidebarCollapsed && (
                <SidebarGroupLabel className="text-gray-500 dark:text-[#666]">{category.name}</SidebarGroupLabel>
              )}
              <SidebarMenu>
                {category.items.map((item) => renderNavItem(item))}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      
      {/* Feature Message Dialog */}
      {showFeatureMessage && (
        <UnauthorizedFeatureMessage
          featureName={lockedFeature}
          returnPath={featureMessageInfo.returnPath}
          showUpgradeOption={true}
          onClose={() => setShowFeatureMessage(false)}
        />
      )}
    </>
  );
}
