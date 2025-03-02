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
import { AuthProvider } from "../src/Authentication/AuthContext";

function App() {
  return (
    <AuthProvider>
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow mt-16">
          <Routes>
            <Route path="/" element={<Home />} /> {/* Trang Home là trang chính */}
            <Route path="*" element={<NotFound/>} /> {/* Route mặc định */}
            <Route path="/education" element={<Education/>} />
            <Route path="/login" element={<Login/>} />
            <Route path="/register" element={<Register/>} />
            <Route path="/otp" element={<OtpPage/>} />
            <Route path="/stock" element={<StockDerivatives/>} />

           
          </Routes>
          <Toaster position="top-right" richColors />
        </main>
        <Footer />
      </div>
    </Router>
    </AuthProvider>
  );
}

export default App;