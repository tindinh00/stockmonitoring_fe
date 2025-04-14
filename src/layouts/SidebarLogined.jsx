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
  Thermometer,
  MessageSquare,
  BarChart3,
  Bot
} from "lucide-react";

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
import Cookies from "js-cookie";
import { getUserFeatures, hasFeature } from "@/utils/featureUtils";
import UnauthorizedFeatureMessage from '@/components/UnauthorizedFeatureMessage.jsx';

// Configuration for navigation items with their required features
export const navItemsConfig = [
  {
    title: "Bảng giá",
    url: "/stock",
    icon: "lineChart",
    requiredFeature: "Hiển thị dữ liệu thị trường chứng khoán"
  },
  {
    title: "Danh sách theo dõi",
    url: "/watchlist",
    icon: "bookmark",
    requiredFeature: "Quản lý danh mục theo dõi cổ phiếu"
  },
  {
    title: "Phân tích cá nhân",
    url: "/analytics",
    icon: "barChart3",
    requiredFeature: "Phân tích và gợi ý theo cá nhân hóa"
  },
  {
    title: "Bản đồ nhiệt",
    url: "/heatmap",
    icon: "thermometer",
    requiredFeature: "Bản đồ nhiệt"
  },
  {
    title: "Quản lý thông báo",
    url: "/notifications",
    icon: "bell",
    requiredFeature: "Quản lý thông báo theo nhu cầu"
  },
  {
    title: "Tin tức",
    url: "/news",
    icon: "newspaper",
    requiredFeature: "Xem tin tức thị trường"
  },
  {
    title: "Chat với hỗ trợ",
    url: "/chat",
    icon: "messageSquare",
    requiredFeature: "Hiển thị dữ liệu thị trường chứng khoán"
  },
  {
    title: "Chat với AI",
    url: "/ai-chat",
    icon: "bot",
    requiredFeature: "Trợ lý AI"
  },
  {
    title: "Cài đặt",
    url: "/settings",
    icon: "settings",
    requiredFeature: null // Always available
  }
];

// Company data
export const company = {
  name: 'StockFlow',
  logo: GalleryVerticalEnd,
  plan: 'Enterprise'
};

// Icons component
export const Icons = {
  logo: GalleryVerticalEnd,
  lineChart: LineChart,
  bookmark: Bookmark,
  newspaper: Newspaper,
  settings: Settings,
  thermometer: Thermometer,
  messageSquare: MessageSquare,
  barChart3: BarChart3,
  bell: Bell,
  bot: Bot
};

// Custom sidebar trigger component
export function CustomSidebarTrigger() {
  const { toggleSidebar, open } = useSidebar();
  return null;
}

// Add state for feature message
export default function SidebarLogined() {
  const { state, isMobile } = useSidebar();
  const location = useLocation();
  const pathname = location.pathname;
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [userFeatures, setUserFeatures] = useState([]);
  const [showFeatureMessage, setShowFeatureMessage] = useState(false);
  const [lockedFeature, setLockedFeature] = useState(null);
  const [featureMessageInfo, setFeatureMessageInfo] = useState({ name: '', returnPath: '/stock' });

  // Lấy danh sách tính năng của người dùng
  useEffect(() => {
    const features = getUserFeatures();
    setUserFeatures(features);
    
    console.log("User features:", features);
  }, [user]);

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
    const isActiveLink = pathname === item.url;
    const userHasFeature = item.requiredFeature ? userFeatures.includes(item.requiredFeature) : true;
    const isDisabled = item.requiredFeature && !userHasFeature;
    const Icon = Icons[item.icon];

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
            ${isActiveLink ? 'bg-[#09D1C7]/10 text-[#09D1C7] font-medium' : 'text-gray-400 hover:text-[#09D1C7] hover:bg-gray-800'}
            ${!userHasFeature ? 'opacity-65 cursor-not-allowed' : ''}
          `}
          onClick={handleNavItemClick}
        >
          {userHasFeature ? (
            <a href={item.url} className="flex items-center gap-3 w-full sidebar-link">
              <span className="icon-wrapper flex-shrink-0">
                <Icon className={`size-5 ${isActiveLink ? 'text-[#09D1C7]' : ''}`} />
              </span>
              <span className="link-text">{item.title}</span>
            </a>
          ) : (
            <div 
              className="flex items-center justify-between w-full cursor-pointer sidebar-link"
              onClick={handleNavItemClick}
            >
              <div className="flex items-center gap-3">
                <span className="icon-wrapper flex-shrink-0">
                  <Icon className="size-5 text-gray-500" />
                </span>
                <span className="link-text text-gray-500">{item.title}</span>
              </div>
              <span className="icon-wrapper flex-shrink-0">
                <img 
                  src="/icons/workspace_premium.svg" 
                  alt="Premium" 
                  className="size-5" 
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
  `;

  return (
    <>
      <style>{sidebarStyles}</style>
      <Sidebar collapsible='icon'>
        <SidebarHeader>
          <div className='flex gap-2 py-2 text-white'>
            <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-r from-[#09D1C7] to-[#0a8f88]'>
              <company.logo className='size-4 text-white' />
            </div>
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <span className='truncate font-semibold text-primary'>{company.name}</span>
              <span className='truncate text-xs text-[#09D1C7]'>{user?.tier || company.plan}</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className='overflow-x-hidden'>
          <SidebarGroup>
            <SidebarGroupLabel className="text-[#666]">Platform</SidebarGroupLabel>
            <SidebarMenu>
              {navItemsConfig.map((item) => {
                const ItemIcon = item.icon ? Icons[item.icon] : Icons.logo;
                return item?.items && item?.items?.length > 0 ? (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={item.isActive}
                    className='group/collapsible'
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          isActive={item.isActive}
                          className={
                            item.isActive 
                              ? 'transition-all duration-300 bg-[#09D1C7]/10 text-[#09D1C7] font-medium'
                              : 'transition-all duration-300 text-gray-400 hover:text-[#09D1C7] hover:bg-gray-800'
                          }
                        >
                          <div className="flex items-center gap-3 w-full sidebar-link">
                            <span className="icon-wrapper flex-shrink-0">
                              {item.icon && <ItemIcon className={`size-5 ${item.isActive ? 'text-[#09D1C7]' : ''}`} />}
                            </span>
                            <span className="link-text">{item.title}</span>
                          </div>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => {
                            const isSubActive = pathname === subItem.url;
                            return (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isSubActive}
                                  className={
                                    isSubActive 
                                      ? 'transition-all duration-300 bg-[#09D1C7]/10 text-[#09D1C7] font-medium'
                                      : 'transition-all duration-300 text-gray-400 hover:text-[#09D1C7] hover:bg-gray-800'
                                  }
                                >
                                  <a href={subItem.url} className="flex items-center gap-3 sidebar-link">
                                    <span className="link-text">{subItem.title}</span>
                                  </a>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : renderNavItem(item);
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size='lg'
                    className='hover:bg-gray-800 transition-colors duration-300'
                  >
                    <Avatar className='h-8 w-8 rounded-lg ring-2 ring-[#09D1C7]/20'>
                      {user?.avatar ? (
                        <AvatarImage src={user.avatar} alt={user.name || "User"} className="rounded-lg" />
                      ) : null}
                      <AvatarFallback className='rounded-lg bg-gradient-to-r from-[#09D1C7] to-[#0a8f88] text-white'>
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className='grid flex-1 text-left text-sm leading-tight'>
                      <span className='truncate font-medium text-primary'>
                        {user?.name || "Người dùng"}
                      </span>
                      <span className='truncate text-xs text-gray-400'>
                        {user?.email || "email@example.com"}
                      </span>
                    </div>
                    <ChevronsUpDown className='ml-auto size-4 text-gray-400' />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-[#1a1a1a] border-[#333] text-white'
                  side='bottom'
                  align='end'
                  sideOffset={4}
                >
                  <DropdownMenuLabel className='p-0 font-normal'>
                    <div className='flex items-center gap-3 p-3'>
                      <Avatar className='h-10 w-10 rounded-lg ring-2 ring-[#09D1C7]/20'>
                        {user?.avatar ? (
                          <AvatarImage src={user.avatar} alt={user.name || "User"} className="rounded-lg" />
                        ) : null}
                        <AvatarFallback className='rounded-lg bg-gradient-to-r from-[#09D1C7] to-[#0a8f88] text-white'>
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className='grid flex-1 text-left text-sm leading-tight'>
                        <span className='font-medium text-white'>
                          {user?.name || "Người dùng"}
                        </span>
                        <span className='text-xs text-gray-400'>
                          {user?.email || "email@example.com"}
                        </span>
                        {user?.role && (
                          <div className='inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-[#09D1C7]/10 border border-[#09D1C7]/20 w-fit'>
                            <Star className='w-3 h-3 text-[#09D1C7]' />
                            <span className='text-xs text-[#09D1C7]'>
                              {user.role === "admin" ? "Quản trị viên" : user.role}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className='bg-[#333]' />
                  <div className='p-2'>
                    <DropdownMenuGroup>
                      <DropdownMenuItem 
                        onClick={() => navigate('/profile')}
                        className='flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg text-gray-300 hover:text-[#09D1C7] hover:bg-[#252525] transition-colors'
                      >
                        <User className='w-4 h-4' />
                        <span>Hồ sơ cá nhân</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate('/profile?tab=subscriptions')}
                        className='flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg text-gray-300 hover:text-[#09D1C7] hover:bg-[#252525] transition-colors'
                      >
                        <CreditCard className='w-4 h-4' />
                        <div className='flex-1 flex items-center justify-between'>
                          <span>Gói dịch vụ</span>
                          {user?.tier && (
                            <span className='text-xs px-2 py-0.5 rounded-full bg-[#09D1C7]/10 text-[#09D1C7] border border-[#09D1C7]/20'>
                              {user.tier}
                            </span>
                          )}
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate('/profile?tab=settings')}
                        className='flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg text-gray-300 hover:text-[#09D1C7] hover:bg-[#252525] transition-colors'
                      >
                        <Settings className='w-4 h-4' />
                        <span>Cài đặt</span>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </div>
                  <DropdownMenuSeparator className='bg-[#333]' />
                  <div className='p-2'>
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className='flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors'
                    >
                      <LogOut className='w-4 h-4' />
                      <span>Đăng xuất</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
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
