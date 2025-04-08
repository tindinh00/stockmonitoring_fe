import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom'; // Xóa BrowserRouter alias Router
import './App.css';
import { Button } from "@/components/ui/button";
import Header from './layouts/header';
import Footer from './layouts/footer';
import Home from './pages/Home'; 
import Education from './pages/Education';
import NotFound from './pages/NotFound';
import Login from './pages/LoginPage';
import { Toaster } from "sonner";
import Register from './pages/RegisterPage';
import OtpPage from './pages/OtpPage';
import StockDerivatives from './pages/StockDerivatives';
import ForgotPassword from './pages/ForgotPasswordPage';
import ResetPassword from './pages/ResetPasswordPage';
import Knowledge from './pages/KnowledgePage';
import ProfilePage from './pages/ProfilePage';
import { AuthProvider } from "../src/Authentication/AuthContext";
import ProtectedRoute from "../src/Authentication/ProtectedRoute";
import ManagerKnowledge from './pages/manager/ManagerKnowledge';
import PackageManagementPage from './pages/admin/PackageManagementPage';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from './layouts/Sidebar';
import SidebarLogined from './layouts/SidebarLogined';
import HeaderManager from './layouts/headerManager';
import HeaderLogined from './layouts/headerLogined';
import UpgradePackage from './pages/UpgradePackagePage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import UserManagementPage from "@/pages/admin/UserManagementPage";
import AdminSidebar from './layouts/AdminSidebar';
import DashboardPage from './pages/dashboard';
import StaffSidebar from './layouts/StaffSidebar';
import StaffChatPage from './pages/staff/StaffChatPage';
import StaffReportPage from './pages/staff/StaffReportPage';
import ManagerReportPage from './pages/manager/ManagerReportPage';
import ScraperManagementPage from "./pages/manager/ScraperManagementPage";
import OAuthCallback from './Authentication/OAuthCallback';
import WatchlistPage from './pages/WatchlistPage';
import NewsPage from './pages/NewsPage';
import HeatmapPage from './pages/HeatmapPage';
import ChatPage from './pages/ChatPage';
import PersonalAnalyticsPage from './pages/PersonalAnalyticsPage';
import NotificationsPage from './pages/NotificationsPage';
import signalRService from './api/signalRService';  // Import signalRService
import AIChatPage from './pages/AIChatPage';

// Function to get sidebar state from cookie
const getSidebarStateFromCookie = () => {
  const cookies = document.cookie.split(';');
  const sidebarCookie = cookies.find(cookie => cookie.trim().startsWith('sidebar_state='));
  if (sidebarCookie) {
    return sidebarCookie.split('=')[1] === 'true';
  }
  return false;
};

// Custom component for the root route that can handle OAuth callback
const RootRoute = () => {
  const location = useLocation();
  
  return (
    <>
      {/* Check for OAuth callback parameters in URL */}
      {location.search && location.search.includes('code=') ? 
        <OAuthCallback /> : 
        <Home />
      }
    </>
  );
};

function App() {
  // Dọn dẹp kết nối khi ứng dụng đóng
  useEffect(() => {
    // Dọn dẹp kết nối khi component unmount
    return () => {
      signalRService.stop();
    };
  }, []);

  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Staff routes with Manager Header and Sidebar */}
        <Route
          path="/staff/*"
          element={
            <ProtectedRoute allowedRoles={['staff']}>
              <SidebarProvider defaultOpen={getSidebarStateFromCookie()}>
                <div className="flex min-h-screen w-full bg-[#0a0a14] overflow-hidden">
                  <div className="flex-shrink-0">
                    <StaffSidebar />
                  </div>
                  <div className="flex-1 flex flex-col bg-[#0a0a14] text-white min-w-0">
                    <HeaderManager />
                    <main className="p-4 md:p-8 w-full overflow-auto">
                      <div className="max-w-full">
                        <Routes>
                          <Route path="chat" element={<StaffChatPage />} />
                          <Route path="reports" element={<StaffReportPage />} />
                        </Routes>
                        <Toaster position="top-right" richColors />
                      </div>
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            </ProtectedRoute>
          }
        />

        {/* Admin routes with Manager Header and Sidebar */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SidebarProvider defaultOpen={getSidebarStateFromCookie()}>
                <div className="flex min-h-screen w-full bg-[#0a0a14] overflow-hidden">
                  <div className="flex-shrink-0">
                    <AdminSidebar />
                  </div>
                  <div className="flex-1 flex flex-col bg-[#0a0a14] text-white min-w-0">
                    <HeaderManager />
                    <main className="p-4 md:p-8 w-full overflow-auto">
                      <div className="max-w-full">
                        <Routes>
                          <Route index element={<DashboardPage />} />
                          <Route path="dashboard" element={<DashboardPage />} />
                          <Route path="packages" element={<PackageManagementPage />} />
                          <Route path="users" element={<UserManagementPage />} />
                        </Routes>
                        <Toaster position="top-right" richColors />
                      </div>
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            </ProtectedRoute>
          }
        />

        {/* Manager routes with Manager Header and Sidebar */}
        <Route 
          path="/manager/*" 
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <SidebarProvider defaultOpen={getSidebarStateFromCookie()}>
                <div className="flex min-h-screen w-full bg-[#0a0a14] overflow-hidden">
                  <div className="flex-shrink-0">
                    <AppSidebar />
                  </div>
                  <div className="flex-1 flex flex-col bg-[#0a0a14] text-white min-w-0">
                    <HeaderManager />
                    <main className="p-4 md:p-8 w-full overflow-auto">
                      <div className="max-w-full">
                        <Routes>
                          <Route path="knowledge" element={<ManagerKnowledge />} />
                          <Route path="reports" element={<ManagerReportPage />} />
                          <Route path="scraper" element={<ScraperManagementPage />} />
                        </Routes>
                        <Toaster position="top-right" richColors />
                      </div>
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/stock" 
          element={
            <ProtectedRoute allowedRoles={['customer', 'admin', 'manager', 'staff']}>
              <SidebarProvider defaultOpen={getSidebarStateFromCookie()}>
                <div className="flex min-h-screen w-full bg-[#0a0a14] overflow-hidden">
                  <div className="flex-shrink-0">
                    <SidebarLogined />
                  </div>
                  <div className="flex-1 flex flex-col bg-[#0a0a14] text-white min-w-0">
                    <HeaderLogined />
                    <main className="p-4 md:p-8 w-full overflow-auto">
                      <div className="max-w-full">
                        <StockDerivatives />
                        <Toaster position="top-right" richColors />
                      </div>
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/watchlist" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <SidebarProvider defaultOpen={getSidebarStateFromCookie()}>
                <div className="flex min-h-screen w-full bg-[#0a0a14] overflow-hidden">
                  <div className="flex-shrink-0">
                    <SidebarLogined />
                  </div>
                  <div className="flex-1 flex flex-col bg-[#0a0a14] text-white min-w-0">
                    <HeaderLogined />
                    <main className="p-4 md:p-8 w-full overflow-auto">
                      <div className="max-w-full">
                        <WatchlistPage />
                        <Toaster position="top-right" richColors />
                      </div>
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/news" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <SidebarProvider defaultOpen={getSidebarStateFromCookie()}>
                <div className="flex min-h-screen w-full bg-[#0a0a14] overflow-hidden">
                  <div className="flex-shrink-0">
                    <SidebarLogined />
                  </div>
                  <div className="flex-1 flex flex-col bg-[#0a0a14] text-white min-w-0">
                    <HeaderLogined />
                    <main className="p-4 md:p-8 w-full overflow-auto">
                      <div className="max-w-full">
                        <NewsPage />
                        <Toaster position="top-right" richColors />
                      </div>
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/heatmap" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <SidebarProvider defaultOpen={getSidebarStateFromCookie()}>
                <div className="flex min-h-screen w-full bg-[#0a0a14] overflow-hidden">
                  <div className="flex-shrink-0">
                    <SidebarLogined />
                  </div>
                  <div className="flex-1 flex flex-col bg-[#0a0a14] text-white min-w-0">
                    <HeaderLogined />
                    <main className="p-4 md:p-8 w-full overflow-auto">
                      <div className="max-w-full">
                        <HeatmapPage />
                        <Toaster position="top-right" richColors />
                      </div>
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/notifications" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <SidebarProvider defaultOpen={getSidebarStateFromCookie()}>
                <div className="flex min-h-screen w-full bg-[#0a0a14] overflow-hidden">
                  <div className="flex-shrink-0">
                    <SidebarLogined />
                  </div>
                  <div className="flex-1 flex flex-col bg-[#0a0a14] text-white min-w-0">
                    <HeaderLogined />
                    <main className="p-4 md:p-8 w-full overflow-auto">
                      <div className="max-w-full">
                        <NotificationsPage />
                        <Toaster position="top-right" richColors />
                      </div>
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/chat" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <SidebarProvider defaultOpen={getSidebarStateFromCookie()}>
                <div className="flex min-h-screen w-full bg-[#0a0a14] overflow-hidden">
                  <div className="flex-shrink-0">
                    <SidebarLogined />
                  </div>
                  <div className="flex-1 flex flex-col bg-[#0a0a14] text-white min-w-0">
                    <HeaderLogined />
                    <main className="p-4 md:p-8 w-full overflow-auto">
                      <div className="max-w-full">
                        <ChatPage />
                        <Toaster position="top-right" richColors />
                      </div>
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            </ProtectedRoute>
          } 
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['customer', 'admin', 'manager', 'staff']}>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow mt-16">
                  <ProfilePage />
                </main>
                <Footer />
              </div>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/upgrade-package"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow mt-16">
                  <UpgradePackage />
                </main>
                <Footer />
              </div>
            </ProtectedRoute>
          }
        />
        
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <SidebarProvider defaultOpen={getSidebarStateFromCookie()}>
                <div className="flex min-h-screen w-full bg-[#0a0a14] overflow-hidden">
                  <div className="flex-shrink-0">
                    <SidebarLogined />
                  </div>
                  <div className="flex-1 flex flex-col bg-[#0a0a14] text-white min-w-0">
                    <HeaderLogined />
                    <main className="p-4 md:p-8 w-full overflow-auto">
                      <div className="max-w-full">
                        <PersonalAnalyticsPage />
                        <Toaster position="top-right" richColors />
                      </div>
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/payment-success" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <SidebarProvider defaultOpen={getSidebarStateFromCookie()}>
                <div className="flex min-h-screen w-full bg-[#0a0a14] overflow-hidden">
                  <div className="flex-shrink-0">
                    <SidebarLogined />
                  </div>
                  <div className="flex-1 flex flex-col bg-[#0a0a14] text-white min-w-0">
                    <HeaderLogined />
                    <main className="p-4 md:p-8 w-full overflow-auto">
                      <div className="max-w-full">
                        <PaymentSuccessPage />
                        <Toaster position="top-right" richColors />
                      </div>
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/ai-chat" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <SidebarProvider defaultOpen={getSidebarStateFromCookie()}>
                <div className="flex min-h-screen w-full bg-[#0a0a14] overflow-hidden">
                  <div className="flex-shrink-0">
                    <SidebarLogined />
                  </div>
                  <div className="flex-1 flex flex-col bg-[#0a0a14] text-white min-w-0">
                    <HeaderLogined />
                    <main className="p-4 md:p-8 w-full overflow-auto">
                      <div className="max-w-full">
                        <AIChatPage />
                        <Toaster position="top-right" richColors />
                      </div>
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            </ProtectedRoute>
          } 
        />
        
        {/* Regular routes with Header and Footer */}
        <Route path="*" element={
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow mt-16">
              <Routes>
                <Route path="/" element={<RootRoute />} />
                <Route path="/education" element={<Education/>} />
                <Route path="/login" element={<Login/>} />
                <Route path="/register" element={<Register/>} />
                <Route path="/otp" element={<OtpPage/>} />
                <Route path="/forgot-password" element={<ForgotPassword/>} />
                <Route path="/reset-password" element={<ResetPassword/>} />
                <Route path="/knowledge" element={<Knowledge/>} />
                <Route path="/oauth/callback" element={<OAuthCallback />} />
                <Route path="/payment-successfully" element={<PaymentSuccessPage />} />
                <Route path="*" element={<NotFound/>} />
              </Routes>
              <Toaster position="top-right" richColors />
            </main>
            <Footer />
          </div>
        } />
      </Routes>
    </AuthProvider>
  );
}

export default App;