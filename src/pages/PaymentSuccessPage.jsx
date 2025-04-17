import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiService } from "@/api/Api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Check, Loader2, ArrowRight, AlertTriangle, ExternalLink } from "lucide-react";
import Cookies from "js-cookie";

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [orderCode, setOrderCode] = useState(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const isInitialMount = useRef(true);

  // Process payment callback only on initial mount
  useEffect(() => {
    if (!isInitialMount.current) return;
    isInitialMount.current = false;

    const processPayment = async () => {
      try {
        setLoading(true);
        console.log("Processing payment callback");
        
        // Check if user is logged in
        const token = Cookies.get("auth_token");
        console.log("Auth token present:", !!token);
        
        // Parse URL parameters
        const params = new URLSearchParams(location.search);
        const orderCodeFromQuery = params.get("orderCode");
        
        // Store payment details
        const paymentInfo = {
          orderCode: orderCodeFromQuery,
          timestamp: new Date().toISOString()
        };
        
        setPaymentDetails(paymentInfo);
        console.log("Payment callback details:", paymentInfo);
        
        // Get orderCode from query or state
        const finalOrderCode = orderCodeFromQuery || location.state?.orderCode;
        
        if (!finalOrderCode) {
          console.error("No order code found in request");
          setError("Không tìm thấy mã đơn hàng. Vui lòng kiểm tra lại URL.");
          setLoading(false);
          return;
        }
        
        setOrderCode(finalOrderCode);
        
        // Check if user needs to log in
        if (!token) {
          console.log("User not authenticated, need to login first");
          setNeedsLogin(true);
          setLoading(false);
          return;
        }
        
        // User is authenticated, update payment status immediately
        console.log("Updating payment status for order:", finalOrderCode);
        await updatePaymentTier(finalOrderCode);
      } catch (error) {
        console.error("Error processing payment:", error);
        setError("Đã xảy ra lỗi khi xử lý thanh toán. " + error.message);
        setLoading(false);
      }
    };
    
    processPayment();
  }, []); // Empty dependency array to run only once on mount

  // Function to update user's subscription tier
  const updatePaymentTier = async (code) => {
    try {
      setLoading(true);
      
      // Call API to update payment status
      console.log("Calling updatePaymentStatus API with order code:", code);
      const result = await apiService.updatePaymentStatus(code);
      console.log("Update payment status result:", result);
      
      if (result.success) {
        setSuccess(true);
        toast.success(result.message || "Cập nhật gói dịch vụ thành công!");
      } else {
        setError(result.error || "Không thể cập nhật trạng thái thanh toán.");
        toast.error("Đã xảy ra lỗi khi cập nhật trạng thái thanh toán. Vui lòng thử lại!!!");
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
      setError(error.message || "Đã xảy ra lỗi khi cập nhật trạng thái thanh toán.");
      toast.error("Đã xảy ra lỗi khi cập nhật trạng thái thanh toán. Vui lòng thử lại!!!");
    } finally {
      setLoading(false);
    }
  };

  // Handle login and then update payment
  const handleLoginAndUpdate = async () => {
    try {
      // Log out the user first
      await apiService.logout();
      
      // Redirect to login page
      navigate('/login', { 
        state: { 
          message: "Thanh toán thành công! Vui lòng đăng nhập lại để sử dụng gói dịch vụ mới."
        } 
      });
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Đã xảy ra lỗi khi đăng xuất. Vui lòng thử lại!");
    }
  };

  // Format timestamp to readable date/time
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] relative py-16 px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto max-w-2xl relative"
      >
        <div className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-lg p-8 text-center">
          {loading ? (
            <div className="py-16 flex flex-col items-center">
              <Loader2 className="h-16 w-16 text-purple-500 animate-spin mb-6" />
              <h2 className="text-2xl font-bold text-white mb-2">Đang xử lý thanh toán...</h2>
              <p className="text-gray-400">Vui lòng đợi trong giây lát, chúng tôi đang cập nhật gói dịch vụ của bạn.</p>
            </div>
          ) : success ? (
            <div className="py-12">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Thanh toán thành công!</h2>
              <p className="text-gray-400 mb-8">Chúc mừng! Gói dịch vụ của bạn đã được nâng cấp thành công. Vui lòng đăng nhập lại để sử dụng gói dịch vụ mới.</p>
              {paymentDetails && (
                <div className="bg-black/30 rounded-lg p-4 mb-8 text-left text-sm">
                  <p className="text-white"><span className="text-gray-400">Mã đơn hàng:</span> {paymentDetails.orderCode}</p>
                  <p className="text-white"><span className="text-gray-400">Thời gian:</span> {formatTimestamp(paymentDetails.timestamp)}</p>
                </div>
              )}
              <div className="space-y-4">
                <Button 
                  onClick={handleLoginAndUpdate}
                  className="bg-gradient-to-r from-[#7F00FF] to-[#E100FF] hover:opacity-90 w-full"
                >
                  Đăng nhập lại
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : error ? (
            <div className="py-12">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Đã xảy ra lỗi!</h2>
              <p className="text-gray-400 mb-8">{error}</p>
              {paymentDetails && (
                <div className="bg-black/30 rounded-lg p-4 mb-8 text-left text-sm">
                  <p className="text-white"><span className="text-gray-400">Mã đơn hàng:</span> {paymentDetails.orderCode || "N/A"}</p>
                  <p className="text-white"><span className="text-gray-400">Thời gian:</span> {formatTimestamp(paymentDetails.timestamp)}</p>
                </div>
              )}
              <div className="space-y-4">
                <Button 
                  onClick={() => navigate('/stock')}
                  className="bg-purple-600 hover:bg-purple-700 w-full mb-2"
                >
                  Quay lại trang chính
                </Button>
                <Button 
                  onClick={() => updatePaymentTier(orderCode)}
                  variant="outline"
                  className="border border-gray-700 hover:bg-gray-800 text-white w-full"
                  disabled={!orderCode}
                >
                  Thử cập nhật lại
                </Button>
                <div className="pt-4 mt-2 border-t border-gray-800">
                  <p className="text-sm text-gray-500 mb-2">Nếu bạn đã thanh toán thành công nhưng vẫn gặp lỗi, vui lòng liên hệ hỗ trợ với mã đơn hàng trên.</p>
                  <Button
                    variant="link"
                    className="text-blue-400 hover:text-blue-300 p-0 h-auto text-sm"
                    onClick={() => navigate('/chat')}
                  >
                    Liên hệ hỗ trợ
                    <ExternalLink className="ml-1 w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
} 