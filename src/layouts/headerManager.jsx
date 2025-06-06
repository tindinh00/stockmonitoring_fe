import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { UserNav } from '@/components/layouts/user-nav';
import ThemeToggle from '@/components/layouts/ThemeToggle/theme-toggle';

export default function HeaderManager() {
  return (
    <header className='bg-[#213A51] flex h-14 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
      <div className='flex items-center gap-2 px-4'>
        <SidebarTrigger className='-ml-1 text-white' />
        <Separator orientation='vertical' className='mr-2 h-4 bg-[#15919B]/30' />
        <Breadcrumb />
      </div>

      <div className='flex items-center gap-2 px-4'>
        <UserNav />
      </div>
    </header>
  );
} 