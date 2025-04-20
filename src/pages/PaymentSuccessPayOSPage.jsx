import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/Authentication/AuthContext';
import { apiService } from '@/api/Api';
import { motion } from "framer-motion";
import { Check, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PaymentSuccessPayOSPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const processPayment = async () => {
      try {
        // Kiểm tra xem đã có dữ liệu trực tiếp từ PayOS event hay chưa
        // Event có thể được truyền qua state của location
        const payOSEvent = location.state?.payOSEvent;
        
        // Extract query parameters from URL
        const params = new URLSearchParams(location.search);
        const orderCode = params.get('code') || params.get('orderCode') || (payOSEvent?.orderCode);
        const status = params.get('status') || (payOSEvent?.status);
        
        console.log('Payment success processing:', { orderCode, status, payOSEvent });
        
        if (!orderCode) {
          throw new Error('Không tìm thấy mã đơn hàng');
        }

        // Nếu có status trong URL và status không phải PAID thì hiển thị lỗi
        if (status && status !== 'PAID') {
          throw new Error(`Trạng thái thanh toán không hợp lệ: ${status}`);
        }

        if (!user) {
          console.log('User not logged in, redirecting to login');
          if (isMounted) {
            toast.error("Vui lòng đăng nhập để hoàn tất thanh toán");
            navigate('/login', {
              state: { message: 'Vui lòng đăng nhập để hoàn tất thanh toán' }
            });
          }
          return;
        }
        
        // API /success đã xử lý việc cập nhật trạng thái nên không cần gọi updatePaymentStatus nữa
        console.log('Payment already processed by success API webhook');
        
        if (isMounted) {
          setSuccess(true);
          setProcessing(false);
          
          // Show success toast
          toast.success("Thanh toán thành công! Cảm ơn bạn đã nâng cấp gói dịch vụ.", {
            duration: 5000,
          });
          
          // Không tự động logout mà để người dùng bấm nút
          console.log('Payment successful, waiting for user to click login button');
        }
      } catch (err) {
        console.error('Error processing payment:', err);
        if (isMounted) {
          setError(err.message || 'Có lỗi xảy ra khi xử lý thanh toán');
          setProcessing(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    processPayment();
    
    return () => {
      isMounted = false;
    };
  }, [location, navigate, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a14]">
        <div className="text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <Loader2 className="animate-spin h-16 w-16 text-purple-500 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Đang xử lý thanh toán</h2>
            <p className="text-gray-400">Vui lòng không đóng trang này...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a14]">
        <div className="text-center max-w-md p-8 bg-black/40 backdrop-blur-sm border border-red-500/20 rounded-xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-500 mb-4">Thanh toán thất bại</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <div className="flex flex-col gap-4">
              <Button
                onClick={() => navigate('/upgrade-package')}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Thử thanh toán lại
              </Button>
              <Button
                onClick={() => navigate('/stock')}
                variant="outline"
                className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Về trang chính
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a14]">
      <div className="text-center max-w-md p-8 bg-black/40 backdrop-blur-sm border border-green-500/20 rounded-xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="rounded-full bg-green-500/20 p-4 mx-auto w-fit mb-6">
            <Check className="h-12 w-12 text-green-500" />
          </div>
          
          <h2 className="text-2xl font-bold text-green-500 mb-2">Thanh toán thành công!</h2>
          <p className="text-gray-400 mb-6">
            Cảm ơn bạn đã nâng cấp gói dịch vụ. Để sử dụng các tính năng mới, vui lòng đăng nhập lại vào hệ thống.
          </p>
          
          {processing ? (
            <div className="flex items-center justify-center gap-2 text-purple-400">
              <Loader2 className="animate-spin h-5 w-5" />
              <span>Đang hoàn tất giao dịch...</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Button 
                onClick={() => {
                  // Logout người dùng khi họ bấm nút
                  apiService.logout().then(() => {
                    navigate('/login', { 
                      state: { 
                        message: "Thanh toán thành công! Vui lòng đăng nhập lại để sử dụng gói dịch vụ mới."
                      } 
                    });
                  });
                }}
                className="w-full bg-purple-600 hover:bg-purple-700 group"
              >
                <span>Đăng nhập lại</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentSuccessPayOSPage; 