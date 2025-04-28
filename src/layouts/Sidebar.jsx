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
  LayoutDashboard,
  FileText,
  BookOpen,
  Database,
  LineChart,
  BarChart3,
  Mail
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
    title: "Kiến thức",
    url: "/manager/knowledge",
    icon: "bookOpen",
    isActive: true
  },
  {
    title: "Báo cáo khiếu nại",
    url: "/manager/reports",
    icon: "fileText",
    isActive: true
  },
  {
    title: "Quản lý Scraper",
    url: "/manager/scraper",
    icon: "database",
    isActive: true
  },
  {
    title: "Quản lý dữ liệu",
    url: "/manager/data",
    icon: "settings",
    isActive: true
  },
  {
    title: "Quản lý cổ phiếu",
    url: "/manager/stock-info",
    icon: "lineChart",
    isActive: true
  },
  {
    title: "Gửi Email",
    url: "/manager/send-email",
    icon: "mail",
    isActive: true
  },
];

// Mock company data
export const company = {
  name: 'StockFlow',
  logo: GalleryVerticalEnd,
  plan: 'Manager'
};

// Mock Icons component
export const Icons = {
  logo: GalleryVerticalEnd,
  bookOpen: ({ isActive }) => <BookOpen className={`size-4 ${isActive ? 'text-[#09D1C7]' : ''}`} />,
  fileText: ({ isActive }) => <FileText className={`size-4 ${isActive ? 'text-[#09D1C7]' : ''}`} />,
  database: ({ isActive }) => <Database className={`size-4 ${isActive ? 'text-[#09D1C7]' : ''}`} />,
  barChart: ({ isActive }) => <BarChart3 className={`size-4 ${isActive ? 'text-[#09D1C7]' : ''}`} />,
  lineChart: ({ isActive }) => <LineChart className={`size-4 ${isActive ? 'text-[#09D1C7]' : ''}`} />,
  settings: ({ isActive }) => <Settings className={`size-4 ${isActive ? 'text-[#09D1C7]' : ''}`} />,
  mail: ({ isActive }) => <Mail className={`size-4 ${isActive ? 'text-[#09D1C7]' : ''}`} />
};

// Custom sidebar trigger component
export function CustomSidebarTrigger() {
  const { toggleSidebar, open } = useSidebar();
  
  // Không cần nút toggle riêng vì sidebar đã có sẵn
  return null;
}

export default function AppSidebar() {
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
            <span className='truncate text-xs text-[#09D1C7]'>Quản lý</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden'>
        <SidebarGroup>
          <SidebarGroupLabel>Mục lục</SidebarGroupLabel>
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
                        {item.icon && <Icon isActive={isActive} />}
                        <span>{item.title}</span>
                        <ChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === subItem.url}
                              className={
                                pathname === subItem.url 
                                  ? 'transition-all duration-300 bg-[#09D1C7]/10 text-[#09D1C7] font-medium'
                                  : 'transition-all duration-300 text-gray-400 hover:text-[#09D1C7] hover:bg-gray-800'
                              }
                            >
                              <a href={subItem.url}>
                                <span>{subItem.title}</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
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
                      <Icon isActive={isActive} />
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
        {/* Removed user dropdown menu */}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
