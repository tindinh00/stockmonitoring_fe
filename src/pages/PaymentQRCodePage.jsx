import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, Copy, RefreshCw, Ban, ExternalLink, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { apiService } from '@/api/Api';
import * as signalR from '@microsoft/signalr';
import Cookies from 'js-cookie';

const PaymentQRCodePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  
  const paymentProcessed = useRef(false);
  const signalRConnection = useRef(null);
  const connectionAttempts = useRef(0);
  const payosInitialized = useRef(false);

  // Initialize payment data
  useEffect(() => {
    const paymentState = location.state?.paymentData;
    
    if (!paymentState) {
      toast.error("Không tìm thấy thông tin thanh toán!");
      navigate('/upgrade-package');
      return;
    }
    
    setPaymentData(paymentState);
    setLoading(false);
  }, [location, navigate]);

  // Hàm xử lý khi thanh toán thành công
  const handlePaymentSuccess = (orderCode) => {
    if (paymentProcessed.current) return;
    
    paymentProcessed.current = true;
    console.log(`💰 Payment successful for order: ${orderCode}`);
    
    // Đảm bảo sử dụng tham số 'code' nhất quán
    navigate(`/payment-successfully?code=${orderCode}`);
  };

  // Hàm xử lý khi thanh toán bị hủy
  const handlePaymentCancelled = (orderCode) => {
    if (paymentProcessed.current) return;
    
    paymentProcessed.current = true;
    console.log(`❌ Payment cancelled for order: ${orderCode}`);
    
    // Đảm bảo sử dụng tham số 'code' nhất quán
    navigate(`/cancel-payment?code=${orderCode}`);
  };

  // Setup SignalR connection
  useEffect(() => {
    if (!paymentData?.orderCode) return;

    const setupSignalR = async () => {
      try {
        console.log("Attempting to connect to SignalR hub...");
        console.log("Connection attempt #", connectionAttempts.current + 1);
        connectionAttempts.current += 1;
        
        const token = Cookies.get('auth_token');
        if (!token) {
          console.error("No auth token found");
          return;
        }
        
        console.log("Setting up SignalR connection...");
        
        // Sử dụng URL trực tiếp thay vì biến môi trường để tránh lỗi
        const signalRUrl = "https://stockmonitoring-api-gateway.onrender.com/appDataHub";
        console.log("SignalR URL:", signalRUrl);
        
        signalRConnection.current = new signalR.HubConnectionBuilder()
          .withUrl(signalRUrl, {
            accessTokenFactory: () => token,
            skipNegotiation: true,
            transport: signalR.HttpTransportType.WebSockets
          })
          .withAutomaticReconnect([0, 2000, 5000, 10000, 15000, 30000])
          .configureLogging(signalR.LogLevel.Information)
          .build();
          
        console.log("Connecting to SignalR hub...");
        
        await signalRConnection.current.start();
        console.log("SignalR Connected!");
        
        const orderCode = paymentData.orderCode;
        
        // Listen for payment updates
        signalRConnection.current.on("PaymentUpdate", (message) => {
          console.log("SignalR PaymentUpdate received:", message);
          
          try {
            const data = typeof message === 'string' ? JSON.parse(message) : message;
            console.log("Payment update data:", data);
            
            // Handle payment update based on data structure
            const paymentStatus = data.status || data.Status;
            const responseCode = data.code || data.Code || data.responseCode || data.ResponseCode;
            const currentOrderCode = data.orderCode || data.OrderCode;
            
            console.log(`Payment update for order ${currentOrderCode}: Status=${paymentStatus}, Code=${responseCode}`);
            
            // Check if this update is for our current payment
            if (currentOrderCode === orderCode) {
              if (responseCode === "00" || paymentStatus === "PAID") {
                console.log("💰 SignalR payment success detected - redirecting");
                handlePaymentSuccess(orderCode);
              } else if (responseCode === "01" || paymentStatus === "CANCELLED") {
                console.log("❌ SignalR payment cancelled detected - redirecting");
                handlePaymentCancelled(orderCode);
              }
            }
          } catch (error) {
            console.error("Error processing SignalR message:", error);
            toast.error("Không thể kết nối với máy chủ thanh toán. Vui lòng làm mới trang.");
          }
        });
        
        // Đăng ký lắng nghe cả hai sự kiện PaymentStatusUpdated và PaymentUpdate
        signalRConnection.current.on("PaymentStatusUpdated", (data) => {
          console.log("----------------------------------------");
          console.log("🔔 PAYMENT STATUS UPDATED EVENT RECEIVED!");
          console.log("📋 Full event data:", JSON.stringify(data, null, 2));
          console.log("🔑 Current order code (client):", orderCode);

          try {
            // Hỗ trợ cả 2 dạng payload: phẳng và lồng
            const receivedOrderCode = data.orderCode || (data.data && data.data.orderCode);
            const paymentStatus = data.status || (data.data && data.data.status);

            console.log("🔑 Received order code:", receivedOrderCode);
            console.log("💰 Payment status:", paymentStatus);
            console.log("----------------------------------------");

            if (String(receivedOrderCode) === String(orderCode)) {
              if (paymentStatus === "PAID") {
                console.log("💰 PaymentStatusUpdated: Thanh toán thành công!");
                handlePaymentSuccess(orderCode);
              } else if (paymentStatus === "CANCELLED") {
                console.log("❌ PaymentStatusUpdated: Thanh toán đã bị hủy");
                handlePaymentCancelled(orderCode);
              } else {
                console.log("❓ Unknown status:", paymentStatus);
              }
            } else {
              console.log("❌ Order code mismatch. Ignoring event.");
            }
          } catch (error) {
            console.error("Error processing PaymentStatusUpdated event:", error);
          }
        });

        // Join the order group to receive updates specifically for this order
        const orderCodeStr = String(orderCode);
        console.log("📤 Joining SignalR group with orderCode:", orderCodeStr);
          
        await signalRConnection.current.invoke("JoinOrderGroup", orderCodeStr);
        console.log("✅ Joined payment group for orderCode:", orderCodeStr);
      } catch (err) {
        console.error("SignalR Connection Error during setup:", err);
        console.error("Error details:", err.message);
        
        if (connectionAttempts.current < 3) {
          console.log("Retrying connection in 3 seconds...");
          setTimeout(setupSignalR, 3000);
        } else {
          toast.error("Không thể kết nối với máy chủ thanh toán. Vui lòng làm mới trang.");
        }
      }
    };

    setupSignalR();

    // Setup PayOS integration
    const setupPayOS = () => {
      if (!paymentData || payosInitialized.current) return;
      
      const orderCode = paymentData.orderCode;
      const checkoutUrl = paymentData.checkoutUrl;
      
      if (!checkoutUrl) {
        console.error("No checkout URL available for PayOS integration");
        return;
      }
      
      try {
        // Create the PayOS script element
        const script = document.createElement('script');
        script.async = true;
        script.src = "https://cdn.payos.vn/payos-checkout/production/stable/payos-checkout.min.js";
        
        // Define the success and cancel handlers on the window object
        window.onPayOSSuccess = function(data) {
          console.log("💰 PayOS onSuccess event:", data);
          paymentProcessed.current = true;
          handlePaymentSuccess(orderCode);
        };
        
        window.onPayOSCancel = function(data) {
          console.log("❌ PayOS onCancel event:", data);
          paymentProcessed.current = true;
          handlePaymentCancelled(orderCode);
        };
        
        // Configure PayOS options
        window.payosConfig = {
          url: checkoutUrl,
          hideReturnButton: true,  // Hide the "Return to main page" button
          elementId: "payos-checkout"
        };
        
        script.onload = () => {
          console.log("PayOS script loaded successfully");
          payosInitialized.current = true;
          
          // Initialize the checkout with the config object
          if (typeof window.PayOS !== 'undefined') {
            window.PayOS.init(window.payosConfig);
          } else {
            console.error("PayOS object not available after script load");
          }
        };
        
        script.onerror = (error) => {
          console.error("Error loading PayOS script:", error);
        };
        
        document.body.appendChild(script);
      } catch (error) {
        console.error("Error setting up PayOS:", error);
      }
    };
    
    setupPayOS();

    // Polling backup to ensure payment status is updated even if SignalR fails
    const backupPollInterval = setInterval(async () => {
      try {
        // Skip if payment was already processed
        if (paymentProcessed.current) {
          console.log("🛑 Payment already processed, stopping polling");
          clearInterval(backupPollInterval);
          return;
        }

        setCheckingPayment(true);
        const response = await apiService.getPaymentStatus(paymentData.orderCode);
        console.log("Backup polling - Payment status:", response);
        setCheckingPayment(false);
        
        // Handle different response formats
        const responseData = response?.data || {};
        console.log("Response data structure:", JSON.stringify(responseData, null, 2));
        
        // Extract status information from various possible response formats
        const responseCode = responseData.code || responseData.responseCode || responseData.data?.code;
        const paymentStatus = responseData.status || responseData.data?.status;
        
        console.log("Extracted payment info - responseCode:", responseCode, "status:", paymentStatus);
        
        if (responseCode === "00" || paymentStatus === "PAID") {
          console.log("💰 Polling detected successful payment - redirecting");
          clearInterval(backupPollInterval);
          handlePaymentSuccess(paymentData.orderCode);
        } else if (responseCode === "01" || paymentStatus === "CANCELLED") {
          console.log("❌ Polling detected cancelled payment - redirecting");
          clearInterval(backupPollInterval);
          handlePaymentCancelled(paymentData.orderCode);
        }
      } catch (error) {
        console.error("Error in backup polling:", error);
        setCheckingPayment(false);
      }
    }, 5000); // Check every 5 seconds
    
    // Cleanup when component unmounts
    return () => {
      if (signalRConnection.current) {
        console.log("Stopping SignalR connection...");
        signalRConnection.current.stop();
        console.log("SignalR connection stopped");
      }
      clearInterval(backupPollInterval);
    };
  }, [paymentData?.orderCode, navigate]);

  const handleCancelPayment = async () => {
    if (!paymentData?.orderCode || isCancelling) return;
    
    try {
      setIsCancelling(true);
      await apiService.cancelPayment(paymentData.orderCode);
      handlePaymentCancelled(paymentData.orderCode);
    } catch (error) {
      console.error("Error cancelling payment:", error);
      toast.error("Không thể hủy thanh toán: " + (error.message || "Đã có lỗi xảy ra"));
      setIsCancelling(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopySuccess(true);
        toast.success("Đã sao chép vào clipboard!");
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        toast.error("Không thể sao chép: " + err);
      });
  };

  const handleOpenPaymentLink = () => {
    if (paymentData?.checkoutUrl) {
      window.open(paymentData.checkoutUrl, '_blank');
      toast.info("Đã mở liên kết thanh toán trong tab mới");
    } else {
      toast.error("Không tìm thấy liên kết thanh toán!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin thanh toán...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a14]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full"
      >
        <Card className="bg-black/40 backdrop-blur-sm border border-gray-800">
          <div className="flex flex-col md:flex-row">
            {/* Left side - QR Code */}
            <div className="p-6 md:w-[350px] border-r border-gray-800">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white">Quét mã QR để thanh toán</h2>
              </div>
              
              {/* QR Code */}
              {paymentData?.qrCode ? (
                <div className="p-4 bg-white rounded-lg w-[260px] h-[260px] flex items-center justify-center mx-auto">
                  <QRCodeSVG 
                    value={paymentData.qrCode} 
                    size={240}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              ) : (
                <div className="text-center text-yellow-500 w-[260px] mx-auto">
                  <p>QR code không khả dụng. Vui lòng sử dụng phương thức thanh toán khác.</p>
                </div>
              )}
              
              {/* Action buttons at the bottom with spacing */}
              <div className="flex justify-center items-center mt-6">
                <Button 
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleCancelPayment}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Đang hủy...
                    </>
                  ) : (
                    <>
                      <Ban className="mr-2 h-4 w-4" />
                      Hủy thanh toán
                    </>
                  )}
                </Button>
              </div>
              
              {/* Status message */}
              <p className="mt-4 text-center text-gray-300 text-sm">
                {checkingPayment ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2"></div>
                    Đang kiểm tra trạng thái thanh toán...
                  </span>
                ) : (
                  "Sau khi thanh toán, hệ thống sẽ tự động chuyển hướng bạn đến trang xác nhận."
                )}
              </p>
            </div>
            
            {/* Right side - Bank Transfer Info */}
            <div className="p-6 flex-1">
              <div className="flex items-center justify-center mb-4">
                <CreditCard className="text-blue-400 mr-2" />
                <h3 className="text-white font-medium text-lg">Thông tin chuyển khoản</h3>
              </div>
              
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-gray-400 text-left">Trạng thái</p>
                  <div className="flex items-center mt-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                    <p className="text-yellow-500 font-medium text-left">Đang chờ thanh toán</p>
                  </div>
                </div>
              
                <div>
                  <p className="text-gray-400 text-left">Mô tả</p>
                  <p className="text-white text-left">{`Thanh toán gói ${paymentData?.packageName || "nâng cấp"}`}</p>
                </div>

                <div>
                  <p className="text-gray-400 text-left">Ngân hàng</p>
                  <p className="text-white font-medium text-left">Ngân hàng TMCP Quân đội</p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-left">Chủ tài khoản</p>
                  <p className="text-white font-medium text-left">DOAN DINH TIN</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-gray-400 text-left">Số tài khoản</p>
                    <p className="text-white font-mono text-left">0845333577</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-7 px-2 text-xs border-gray-700 hover:bg-gray-800 ml-4"
                    onClick={() => copyToClipboard("0845333577")}
                  >
                    {copySuccess ? "Đã sao chép" : "Sao chép"}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-gray-400 text-left">Số tiền</p>
                    <p className="text-white font-mono text-left">{paymentData?.amount?.toLocaleString('vi-VN')} đ</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-7 px-2 text-xs border-gray-700 hover:bg-gray-800 ml-4"
                    onClick={() => paymentData?.amount && copyToClipboard(paymentData.amount)}
                  >
                    {copySuccess ? "Đã sao chép" : "Sao chép"}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-gray-400 text-left">Mã đơn hàng</p>
                    <p className="text-white font-mono text-left">{paymentData?.orderCode}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-7 px-2 text-xs border-gray-700 hover:bg-gray-800 ml-4"
                    onClick={() => copyToClipboard(paymentData?.orderCode)}
                  >
                    {copySuccess ? "Đã sao chép" : "Sao chép"}
                  </Button>
                </div>
                
                <div className="pt-2 text-sm text-gray-400 italic text-center">
                  <p>Lưu ý: Nhập chính xác số tiền và nội dung chuyển khoản</p>
                </div>
              </div>
              
              {/* Container for PayOS checkout */}
              <div id="payos-checkout" className="w-full mt-4"></div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentQRCodePage;