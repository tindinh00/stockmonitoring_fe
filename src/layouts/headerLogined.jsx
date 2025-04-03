import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import SearchInput from '@/components/search-input';
import { UserNav } from '@/components/layouts/user-nav';
import ThemeToggle from '@/components/layouts/ThemeToggle/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, AlertCircle } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { User, CreditCard, Settings, LogOut } from "lucide-react";

export default function HeaderLogined() {
  // Mock notifications data
  const notifications = [
    {
      id: 1,
      type: 'success',
      title: 'Đặt lệnh thành công',
      message: 'Lệnh mua 1000 cổ phiếu VNM đã được thực hiện',
      time: '5 phút trước',
      read: false
    },
    {
      id: 2,
      type: 'warning',
      title: 'Cảnh báo biến động',
      message: 'VN30 giảm 15 điểm trong 30 phút',
      time: '30 phút trước',
      read: false
    },
    {
      id: 3,
      type: 'info',
      title: 'Thông báo bảo trì',
      message: 'Hệ thống sẽ bảo trì vào 22:00 tối nay',
      time: '2 giờ trước',
      read: false
    }
  ];

  return (
    <header className='bg-[white] flex h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
      <div className='flex items-center gap-4 px-4 flex-1 overflow-hidden'>
        <SidebarTrigger className='-ml-1 text-black' />
        <Separator orientation='vertical' className='h-4' />
        <Breadcrumb />
        <div className='hidden md:flex'>
          <SearchInput />
        </div>
        <Badge className='hidden sm:inline-flex text-black bg-white hover:bg-white whitespace-nowrap'>Hết giờ</Badge>
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
        
        <Popover>
          <PopoverTrigger asChild>
            <div className="relative">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                {notifications.filter(n => !n.read).length}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h4 className="font-semibold text-sm">Thông báo</h4>
              <button className="text-xs text-blue-600 hover:text-blue-700">
                Đánh dấu tất cả đã đọc
              </button>
            </div>
            <div className="max-h-[300px] overflow-auto">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-0"
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      {notification.type === 'success' && (
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                      )}
                      {notification.type === 'warning' && (
                        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                        </div>
                      )}
                      {notification.type === 'info' && (
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Bell className="w-4 h-4 text-blue-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                      <p className="text-sm text-gray-500 truncate">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                    </div>
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 text-center border-t border-gray-200">
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Xem tất cả thông báo
              </button>
            </div>
          </PopoverContent>
        </Popover>

        <UserNav />
      </div>
    </header>
  );
} 