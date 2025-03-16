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
  MessageSquare,
  FileText
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
    title: "Dashboard",
    url: "/staff/dashboard",
    icon: "layoutDashboard",
    isActive: true
  },
  {
    title: "Chat với khách hàng",
    url: "/staff/chat",
    icon: "messageSquare",
    isActive: true
  },
  {
    title: "Báo cáo khiếu nại",
    url: "/staff/reports",
    icon: "fileText",
    isActive: true
  },
  {
    title: "Cài đặt",
    url: "/staff/settings",
    icon: "settings"
  }
];

// Mock company data
export const company = {
  name: 'StockFlow',
  logo: GalleryVerticalEnd,
  plan: 'Staff'
};

// Mock Icons component
export const Icons = {
  logo: GalleryVerticalEnd,
  layoutDashboard: () => <LayoutDashboard className="size-4" />,
  messageSquare: () => <MessageSquare className="size-4" />,
  fileText: () => <FileText className="size-4" />,
  settings: () => <Settings className="size-4" />
};

// Custom sidebar trigger component
export function CustomSidebarTrigger() {
  const { toggleSidebar, open } = useSidebar();
  
  // Không cần nút toggle riêng vì sidebar đã có sẵn
  return null;
}

export default function StaffSidebar() {
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
        <div className='flex gap-2 py-2 text-sidebar-accent-foreground'>
          <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
            <company.logo className='size-4' />
          </div>
          <div className='grid flex-1 text-left text-sm leading-tight'>
            <span className='truncate font-semibold'>{company.name}</span>
            <span className='truncate text-xs'>{user?.tier || company.plan}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden'>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;
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
                        isActive={pathname === item.url}
                      >
                        {item.icon && <Icon />}
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
                    isActive={pathname === item.url}
                  >
                    <a href={item.url}>
                      <Icon />
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
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                >
                  <Avatar className='h-8 w-8 rounded-lg'>
                    {user?.avatar ? (
                      <AvatarImage src={user.avatar} alt={user.name || "User"} className="rounded-lg" />
                    ) : null}
                    <AvatarFallback className='rounded-lg'>
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-semibold'>
                      {user?.name || "Người dùng"}
                    </span>
                    <span className='truncate text-xs'>
                      {user?.email || "email@example.com"}
                    </span>
                  </div>
                  <ChevronsUpDown className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
                side='bottom'
                align='end'
                sideOffset={4}
              >
                <DropdownMenuLabel className='p-0 font-normal'>
                  <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                    <Avatar className='h-8 w-8 rounded-lg'>
                      {user?.avatar ? (
                        <AvatarImage src={user.avatar} alt={user.name || "User"} className="rounded-lg" />
                      ) : null}
                      <AvatarFallback className='rounded-lg'>
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className='grid flex-1 text-left text-sm leading-tight'>
                      <span className='truncate font-semibold'>
                        {user?.name || "Người dùng"}
                      </span>
                      <span className='truncate text-xs'>
                        {user?.email || "email@example.com"}
                      </span>
                      {user?.role && (
                        <span className='truncate text-xs text-teal-400'>
                          {user.role === "admin" ? "Quản trị viên" : user.role}
                        </span>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate('/staff/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Hồ sơ
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/staff/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Cài đặt
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:text-red-300">
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
