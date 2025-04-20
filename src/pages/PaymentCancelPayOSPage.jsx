import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/Authentication/AuthContext';
import { apiService } from '@/api/Api';
import { motion } from "framer-motion";
import { X, ArrowRight, RefreshCw, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PaymentCancelPayOSPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderCode, setOrderCode] = useState(null);
  const [cancelReason, setCancelReason] = useState(null);
  const paymentProcessed = useRef(false);

  useEffect(() => {
    let isMounted = true;
    
    const processCancellation = async () => {
      try {
        // Kiểm tra xem đã có dữ liệu trực tiếp từ PayOS event hay chưa
        // Event có thể được truyền qua state của location
        const payOSEvent = location.state?.payOSEvent;
        
        // Extract query parameters from URL
        const params = new URLSearchParams(location.search);
        const code = params.get('code') || params.get('orderCode') || payOSEvent?.orderCode;
        const status = params.get('status') || payOSEvent?.status;
        const reason = params.get('reason');
        const cancel = payOSEvent?.cancel;
        
        console.log('Payment cancel processing:', { code, status, reason, cancel, payOSEvent });
        
        // Lưu lý do hủy (nếu có)
        if (reason) {
          setCancelReason(reason);
        }
        
        if (!code) {
          throw new Error('Không tìm thấy mã đơn hàng');
        }
        
        // Nếu có status trong URL và status không phải CANCELLED thì ghi log
        if (status && status !== 'CANCELLED') {
          console.warn(`Trạng thái hủy thanh toán không như mong đợi: ${status}`);
        }
        
        setOrderCode(code);

        if (!user) {
          console.log('User not logged in, redirecting to login');
          if (isMounted) {
            toast.error("Vui lòng đăng nhập để xử lý hủy thanh toán");
            navigate('/login', {
              state: { message: 'Vui lòng đăng nhập để xử lý hủy thanh toán' }
            });
          }
          return;
        }

        // API /cancel đã xử lý việc cập nhật trạng thái nên không cần gọi updatePaymentStatus nữa
        
        if (isMounted) {
          // Check if we've already shown a cancellation notification for this order
          const hasShownNotification = sessionStorage.getItem(`payment_cancel_notified_${code}`);
          
          if (!hasShownNotification) {
            // Show only one notification for all cancellation cases
            const message = reason === 'timeout' ? 
              "Đã hủy thanh toán do hết thời gian" : 
              "Đã hủy thanh toán";
              
            toast.error(message, {
              duration: 3000,
              style: { backgroundColor: '#ef4444', color: 'white' }
            });
            
            // Mark this order as having shown a notification
            sessionStorage.setItem(`payment_cancel_notified_${code}`, 'true');
          }
        }

      } catch (err) {
        console.error('Error processing cancellation:', err);
        if (isMounted) {
          setError(err.message || 'Có lỗi xảy ra khi xử lý hủy thanh toán');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    processCancellation();
    
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Đang xử lý hủy thanh toán</h2>
            <p className="text-gray-400">Vui lòng đợi trong giây lát...</p>
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
            <h2 className="text-2xl font-bold text-red-500 mb-4">Lỗi</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <div className="flex flex-col gap-4">
              <Button
                onClick={() => navigate('/stock')}
                className="w-full bg-blue-600 hover:bg-blue-700"
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
      <div className="text-center max-w-md p-8 bg-black/40 backdrop-blur-sm border border-red-500/20 rounded-xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="rounded-full bg-red-500/20 p-4 mx-auto w-fit mb-6">
            {cancelReason === 'timeout' ? (
              <Clock className="h-12 w-12 text-red-500" />
            ) : (
              <X className="h-12 w-12 text-red-500" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-red-500 mb-2">
            {cancelReason === 'timeout' ? 'Hết thời gian thanh toán' : 'Đã hủy thanh toán'}
          </h2>
          
          <p className="text-gray-400 mb-6">
            {cancelReason === 'timeout' 
              ? 'Đơn hàng đã bị hủy do thời gian thanh toán đã hết. Bạn có thể tạo đơn hàng mới để thử lại.'
              : 'Bạn đã hủy giao dịch thanh toán. Bạn có thể quay lại trang chính hoặc thử thanh toán lại.'}
          </p>
          
          {orderCode && (
            <div className="mb-6 p-3 bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Mã đơn hàng đã hủy:</p>
              <p className="font-mono text-gray-300">{orderCode}</p>
            </div>
          )}
          
          <div className="flex flex-col gap-4">
            <Button 
              onClick={() => navigate('/upgrade-package')}
              className="w-full bg-purple-600 hover:bg-purple-700 group"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              <span>Thử thanh toán lại</span>
            </Button>
            
            <Button 
              onClick={() => navigate('/stock')}
              variant="outline"
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 group"
            >
              <span>Về trang chính</span>
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentCancelPayOSPage; 