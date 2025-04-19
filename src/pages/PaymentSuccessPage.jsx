import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/Authentication/AuthContext';
import { apiService } from '@/api/Api';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Check, Loader2, ArrowRight, AlertTriangle, ExternalLink } from "lucide-react";
import Cookies from "js-cookie";

// Create a global variable outside the component to ensure it persists across re-renders
let hasProcessedPayment = false;

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [orderCode, setOrderCode] = useState(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const paymentProcessedRef = useRef(false);
  const [apiCallCompleted, setApiCallCompleted] = useState(false);
  const apiCallCountRef = useRef(0); // Add counter to track API calls
  const orderCodeRef = useRef(null);

  useEffect(() => {
    console.log('PaymentSuccessPage useEffect called. Global flag:', hasProcessedPayment);
    console.log('Ref flag:', paymentProcessedRef.current);
    console.log('API call completed flag:', apiCallCompleted);
    console.log('API call count:', apiCallCountRef.current);
    
    // Extract order code only once and store in ref
    if (!orderCodeRef.current) {
      orderCodeRef.current = new URLSearchParams(location.search).get('orderCode');
      console.log('Extracted orderCode:', orderCodeRef.current);
    }
    
    let isMounted = true;
    
    const processPayment = async () => {
      // Check multiple flags to ensure we don't process payment more than once
      if (paymentProcessedRef.current || hasProcessedPayment || apiCallCompleted) {
        console.log('Payment already processed, skipping');
        return;
      }
      
      // Set flags immediately to prevent multiple calls
      paymentProcessedRef.current = true;
      hasProcessedPayment = true;
      
      console.log('Starting payment processing');

      try {
        const orderCode = orderCodeRef.current;
        console.log('Using orderCode:', orderCode);
        
        if (!orderCode) {
          throw new Error('Không tìm thấy mã đơn hàng');
        }

        if (!user) {
          console.log('User not logged in, redirecting to login');
          if (isMounted) {
            navigate('/login', {
              state: { message: 'Vui lòng đăng nhập để hoàn tất thanh toán' }
            });
          }
          return;
        }
        
        if (isMounted) {
          setLoading(true);
        }
        
        // Log API call with count
        apiCallCountRef.current += 1;
        console.log(`API Call #${apiCallCountRef.current}: updatePaymentStatus(${orderCode}, 'success')`);
        
        const result = await apiService.updatePaymentStatus(orderCode, 'success');
        console.log('API call result:', result);
        
        if (isMounted) {
          setApiCallCompleted(true);
          setSuccess(true);
        }

        // Log out the user after successful payment
        console.log('Logging out user...');
        await apiService.logout();

        // Redirect to login page after a short delay
        console.log('Setting timeout for redirect to login page');
        const redirectTimeout = setTimeout(() => {
          console.log('Redirecting to login page');
          if (isMounted) {
            navigate('/login', { 
              state: { 
                message: "Thanh toán thành công! Vui lòng đăng nhập lại để sử dụng gói dịch vụ mới."
              } 
            });
          }
        }, 2000);

        return () => {
          clearTimeout(redirectTimeout);
        };

      } catch (err) {
        console.error('Error processing payment:', err);
        if (isMounted) {
          setError(err.message || 'Có lỗi xảy ra khi xử lý thanh toán');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    processPayment();
    
    // Cleanup function to handle component unmounting
    return () => {
      console.log('PaymentSuccessPage unmounting');
      isMounted = false;
    };
  }, []); // Empty dependency array to ensure it only runs once

  if (loading) {
  return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang xử lý thanh toán...</p>
              </div>
            </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Lỗi</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/stock')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Đến trang chính
          </button>
              </div>
            </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-green-500 text-4xl mb-4">✓</div>
        <h2 className="text-2xl font-bold text-green-600 mb-2">Thanh toán thành công!</h2>
        <p className="text-gray-600">Đang chuyển hướng về trang đăng nhập...</p>
        </div>
    </div>
  );
};

export default PaymentSuccessPage; 