import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import StaffSidebar from "./StaffSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import ChatNotification from "@/components/ChatNotification";
import HeaderManager from "./headerManager";

// Thêm props children để nhận các component từ Route
export default function StaffLayout({ children }) {
  return (
    <SidebarProvider>
      <div className="grid h-screen w-full overflow-hidden bg-[#0a0a14] text-slate-50 lg:grid-cols-[auto_1fr]">
        <StaffSidebar />
        <div className="flex flex-col">
          <HeaderManager />
          <ScrollArea className="h-[calc(100vh-64px)]">
            <main className="p-4 md:p-8 flex-1 overflow-y-auto">
              <div className="max-w-full">
                {children}
              </div>
            </main>
          </ScrollArea>
        </div>
      </div>
      <ChatNotification />
    </SidebarProvider>
  );
} 