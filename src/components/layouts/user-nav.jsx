import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BadgeCheck, 
  Bell, 
  ChevronsUpDown, 
  CreditCard, 
  LogOut, 
  Settings, 
  User 
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/Authentication/AuthContext';
import { toast } from 'sonner';

export function UserNav() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const handleNavigate = (path) => {
    navigate(path);
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

  // Lấy chữ cái đầu của tên người dùng cho avatar
  const getInitials = () => {
    if (!user || !user.name) return "U";
    return user.name.charAt(0).toUpperCase();
  };

  // Nếu chưa đăng nhập, hiển thị nút đăng nhập
  if (!isAuthenticated) {
    return (
      <Button 
        variant="outline" 
        className="text-teal-500 border-teal-500 hover:bg-teal-500/20"
        onClick={() => navigate('/login')}
      >
        Đăng nhập
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            {user?.avatar ? (
              <AvatarImage src={user.avatar} alt={user.name || "User"} />
            ) : null}
            <AvatarFallback className="bg-teal-500 text-white">{getInitials()}</AvatarFallback>
          </Avatar>
          {user?.isVerified && (
            <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-teal-500 flex items-center justify-center">
              <BadgeCheck className="h-3 w-3 text-white" />
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-white border-gray-200 text-black" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name || "Người dùng"}</p>
            <p className="text-xs leading-none text-gray-400">{user?.email || "email@example.com"}</p>
            {user?.role && (
              <p className="text-xs leading-none text-teal-400 mt-1">
                {user.role === "admin" ? "Quản trị viên" : user.role}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-200" />
        <DropdownMenuGroup>
          <DropdownMenuItem 
            className="hover:bg-gray-200 focus:bg-gray-200 cursor-pointer"
            onClick={() => handleNavigate('/profile')}
          >
            <User className="mr-2 h-4 w-4" />
            <span>Hồ sơ</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="hover:bg-gray-200 focus:bg-gray-200 cursor-pointer"
            onClick={() => handleNavigate('/profile?tab=subscriptions')}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Gói dịch vụ {user?.tier && `(${user.tier})`}</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="hover:bg-gray-200 focus:bg-gray-200 cursor-pointer"
            onClick={() => handleNavigate('/profile?tab=settings')}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Cài đặt</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-[#1f1f30]" />
        <DropdownMenuItem 
          className="hover:bg-gray-200 focus:bg-gray-200 cursor-pointer text-red-400 hover:text-red-300"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Đăng xuất</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 