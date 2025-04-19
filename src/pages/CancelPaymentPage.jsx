import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/Authentication/AuthContext';
import { apiService } from '@/api/Api';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { X, ArrowRight, ExternalLink, Loader2 } from "lucide-react";
import Cookies from "js-cookie";

const CancelPaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const processCancellation = async () => {
      try {
        const orderCode = new URLSearchParams(location.search).get('orderCode');
        if (!orderCode) {
          throw new Error('Không tìm thấy mã đơn hàng');
        }

        if (!user) {
          navigate('/login', {
            state: { message: 'Vui lòng đăng nhập để xử lý hủy thanh toán' }
          });
          return;
        }

        setLoading(true);
        await apiService.updatePaymentStatus(orderCode, 'cancelled');
        
        // Không đăng xuất người dùng
        setSuccess(true);
        toast.success("Đã hủy thanh toán thành công", {
          position: "top-right",
          duration: 3000,
        });

      } catch (err) {
        setError(err.message || 'Có lỗi xảy ra khi xử lý hủy thanh toán');
      } finally {
        setLoading(false);
      }
    };

    processCancellation();
  }, [location, user, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang xử lý hủy thanh toán...</p>
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
          <Button
            onClick={() => navigate('/stock')}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Đến trang chính
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md p-6 bg-white rounded-xl shadow-lg">
          <div className="text-yellow-500 text-6xl mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-16 h-16 mx-auto">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Hủy thanh toán thành công</h2>
          <p className="text-gray-600 mb-6">Bạn đã hủy giao dịch thanh toán. Bạn có thể quay lại trang chính hoặc thử thanh toán lại.</p>
          
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => navigate('/stock')}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <ArrowRight className="h-5 w-5" />
              <span>Đến trang chính</span>
            </Button>
            
            <Button
              onClick={() => navigate('/upgrade-package')}
              variant="outline"
              className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium rounded-lg transition-colors"
            >
              Thử lại thanh toán
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback UI (should not reach here)
  return null;
};

export default CancelPaymentPage; 