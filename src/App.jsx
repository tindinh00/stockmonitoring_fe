import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'; // Thêm Router
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
import ManagerKnowledge from './pages/Manager/ManagerKnowledge';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from './layouts/Sidebar';
import SidebarLogined from './layouts/SidebarLogined';
import HeaderManager from './layouts/headerManager';
import HeaderLogined from './layouts/headerLogined';
import UpgradePackage from './pages/UpgradePackagePage';
import CheckoutPage from './pages/CheckoutPage';

function App() {
  return (
    <AuthProvider>
      <Router>
          <Routes>
            {/* Manager routes with Manager Header and Sidebar */}
            <Route 
              path="/manager/*" 
              element={
                <SidebarProvider defaultOpen={false}>
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
                          </Routes>
                          <Toaster position="top-right" richColors />
                        </div>
                      </main>
                    </div>
                  </div>
                </SidebarProvider>
              } 
            />

            <Route 
              path="/stock" 
              element={
                <SidebarProvider defaultOpen={false}>
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
              } 
            />
            
            {/* Regular routes with Header and Footer */}
            <Route path="*" element={
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow mt-16">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/education" element={<Education/>} />
                    <Route path="/login" element={<Login/>} />
                    <Route path="/register" element={<Register/>} />
                    <Route path="/otp" element={<OtpPage/>} />
                    <Route path="/forgot-password" element={<ForgotPassword/>} />
                    <Route path="/reset-password" element={<ResetPassword/>} />
                    <Route path="/knowledge" element={<Knowledge/>} />
                    <Route path="/profile" element={<ProfilePage/>} />
                    <Route path="/upgrade-package" element={<UpgradePackage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="*" element={<NotFound/>} />
                  </Routes>
                  <Toaster position="top-right" richColors />
                </main>
                <Footer />
              </div>
            } />
          </Routes>
        </Router>
      </AuthProvider>
  );
}

export default App;