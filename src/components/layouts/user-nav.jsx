import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDown, 
  LogOut,
  User,
  CreditCard
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
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

  // Chuyển đổi role thành tiếng Việt
  const translateRole = (role) => {
    if (!role) return "";
    
    switch(role.toLowerCase()) {
      case "customer": return "Hội viên";
      case "staff": return "Nhân viên";
      case "manager": return "Quản lý";
      case "admin": return "Quản trị viên";
      default: return role;
    }
  };

  // Kiểm tra xem người dùng có phải là khách hàng không
  const isCustomer = () => {
    return !user?.role || user.role.toLowerCase() === "customer";
  };

  // Xử lý hiển thị tên - chỉ cắt bớt nếu tên quá dài (> 15 ký tự hoặc > 3 từ)
  const getDisplayName = () => {
    if (!user?.name) return "Người dùng";
    
    const words = user.name.split(' ');
    if (words.length > 3 || user.name.length > 15) {
      // Nếu tên quá dài, hiển thị kèm dấu ...
      return user.name;
    }
    
    return user.name;
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
        <Button variant="ghost" className="relative flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-200 dark:bg-[#213A51] hover:bg-gray-300 dark:hover:bg-[#192b3c] text-gray-900 dark:text-white border-0">
          <Avatar className="h-8 w-8">
            {user?.avatar ? (
              <AvatarImage src={user.avatar} alt={user.name || "User"} />
            ) : null}
            <AvatarFallback className="bg-teal-500 text-white">{getInitials()}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden md:inline truncate max-w-[150px]">{getDisplayName()}</span>
          <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-white dark:bg-[#0a0a14] border-gray-200 dark:border-[#1f1f30]" align="start" sideOffset={5} forceMount>
        <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-[#1f1f30]">
          <Avatar className="h-10 w-10">
            {user?.avatar ? (
              <AvatarImage src={user.avatar} alt={user.name || "User"} />
            ) : null}
            <AvatarFallback className="bg-teal-500 text-white">{getInitials()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium leading-none text-gray-900 dark:text-white">{user?.name || "Người dùng"}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{user?.email || "email@example.com"}</p>
            {user?.role && (
              <p className="text-xs leading-none text-teal-500 mt-1">
                {translateRole(user.role)}
              </p>
            )}
          </div>
        </div>
        
        {isCustomer() ? (
          <>
            <DropdownMenuGroup className="p-2">
              <DropdownMenuItem 
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1f1f30] rounded-md text-gray-900 dark:text-white"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Hồ sơ</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/profile?tab=subscriptions')}
                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1f1f30] rounded-md text-gray-900 dark:text-white"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Dịch vụ & Giao dịch</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-[#1f1f30]" />
            <div className="p-2">
              <DropdownMenuItem 
                onClick={handleLogout}
                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/20 rounded-md text-red-500"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </div>
          </>
        ) : (
          <div className="py-2">
            <DropdownMenuItem 
              onClick={handleLogout}
              className="flex items-center gap-2 p-2 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/20 rounded-md text-red-500 mx-2"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 