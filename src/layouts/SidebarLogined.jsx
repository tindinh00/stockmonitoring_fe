'use client';
import React from "react";
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

// Mock data for navigation items
export const navItems = [
  {
    title: "Bảng giá",
    url: "/stock",
    icon: "lineChart"
  },
  {
    title: "Danh sách theo dõi",
    url: "/watchlist",
    icon: "bookmark"
  },
  {
    title: "Phân tích cá nhân",
    url: "/analytics",
    icon: "barChart3"
  },
  {
    title: "Bản đồ nhiệt",
    url: "/heatmap",
    icon: "thermometer"
  },
  {
    title: "Quản lý thông báo",
    url: "/notifications",
    icon: "bell"
  },
  {
    title: "Tin tức",
    url: "/news",
    icon: "newspaper"
  },
  {
    title: "Chat với hỗ trợ",
    url: "/chat",
    icon: "messageSquare"
  },
  {
    title: "Chat với AI",
    url: "/ai-chat",
    icon: "bot"
  },
  {
    title: "Cài đặt",
    url: "/settings",
    icon: "settings"
  }
];

// Mock company data
export const company = {
  name: 'StockFlow',
  logo: GalleryVerticalEnd,
  plan: 'Enterprise'
};

// Mock Icons component
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
  
  // Không cần nút toggle riêng vì sidebar đã có sẵn
  return null;
}

export default function SidebarLogined() {
  const { state, isMobile } = useSidebar();
  const location = useLocation();
  const pathname = location.pathname;
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Lấy chữ cái đầu của tên người dùng cho avatar
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
  
  return (
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
            {navItems.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;
              const isActive = pathname === item.url;
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
                        isActive={isActive}
                        className={
                          isActive 
                            ? 'transition-all duration-300 bg-[#09D1C7]/10 text-[#09D1C7] font-medium'
                            : 'transition-all duration-300 text-gray-400 hover:text-[#09D1C7] hover:bg-gray-800'
                        }
                      >
                        {item.icon && <Icon className={isActive ? 'text-[#09D1C7]' : ''} />}
                        <span>{item.title}</span>
                        <ChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
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
                                <a href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive}
                    className={
                      isActive 
                        ? 'transition-all duration-300 bg-[#09D1C7]/10 text-[#09D1C7] font-medium'
                        : 'transition-all duration-300 text-gray-400 hover:text-[#09D1C7] hover:bg-gray-800'
                    }
                  >
                    <a href={item.url}>
                      <Icon className={isActive ? 'text-[#09D1C7]' : ''} />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
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
  );
}
