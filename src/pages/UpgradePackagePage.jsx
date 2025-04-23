import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, Sparkles, Zap, Shield, TrendingUp, Clock, Award, Percent, Loader2, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { apiService } from "@/api/Api"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useAuth } from "@/Authentication/AuthContext"
import Cookies from "js-cookie"

const UpgradePackage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [processingPackageId, setProcessingPackageId] = useState(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [userTier, setUserTier] = useState("Free")
  const [hoveredPackage, setHoveredPackage] = useState(null)
  
  useEffect(() => {
    // Lấy tier từ cookie
    const tierFromCookie = Cookies.get("user_tier");
    if (tierFromCookie) {
      setUserTier(tierFromCookie);
      console.log("User tier from cookie:", tierFromCookie);
    } else {
      // Fallback nếu không có cookie
      setUserTier(user?.tier || "Free");
      console.log("User tier from user object:", user?.tier || "Free");
    }
  }, [user]);

  // Kiểm tra xem người dùng có phải tier Free hay không
  const isFreeTier = userTier === "Free" || !userTier;
  console.log("🔍 Is Free Tier:", isFreeTier, "Current tier:", userTier);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true)
        const response = await apiService.getPackages()
        console.log("API Response:", response)
        
        if (response && Array.isArray(response)) {
          setPackages(response)
        } else if (response?.value?.data && Array.isArray(response.value.data)) {
          setPackages(response.value.data)
        } else {
          console.error("Invalid response structure:", response)
          setError("Dữ liệu không hợp lệ")
          toast.error("Dữ liệu không hợp lệ")
        }
      } catch (error) {
        console.error("Error fetching packages:", error)
        setError("Không thể tải danh sách gói dịch vụ")
        toast.error("Không thể tải danh sách gói dịch vụ")
      } finally {
        setLoading(false)
      }
    }

    fetchPackages()
  }, [])

  // Hàm xử lý khi nhấn nút "Bắt đầu ngay"
  const handleStartNow = async (pkg) => {
    console.log("🚀 Start Now clicked for package:", pkg.name);
    console.log("📋 Current user tier:", userTier);
    console.log("📋 Package tier:", pkg.name);
    console.log("📋 Is Free Tier:", isFreeTier);
    console.log("📋 Different package check:", userTier !== pkg.name);
    
    // Nếu không phải Free tier và không phải cùng gói hiện tại, hiển thị xác nhận
    if (!isFreeTier && userTier !== pkg.name) {
      console.log("🔔 Showing confirmation dialog");
      setSelectedPackage(pkg);
      setConfirmDialogOpen(true);
      return;
    } else {
      console.log("➡️ Proceeding directly to payment");
      if (isFreeTier) {
        console.log("🆓 Reason: User is on Free tier");
      } else if (userTier === pkg.name) {
        console.log("🔄 Reason: User is already on this package tier");
      }
    }
    
    // Nếu là Free tier hoặc người dùng đã xác nhận, tiến hành thanh toán
    await processPayment(pkg);
  };
  
  // Hàm xử lý thanh toán sau khi đã xác nhận (nếu cần)
  const processPayment = async (pkg) => {
    try {
      console.log("🔄 Starting payment process for package:", pkg.name);
      setProcessingPackageId(pkg.id);
      
      // Thêm timeout để reset nếu xử lý quá lâu
      const timeoutId = setTimeout(() => {
        console.log("⏱️ Payment processing timeout - resetting state");
        setProcessingPackageId(null);
        toast.error("Xử lý thanh toán quá lâu. Vui lòng thử lại.");
      }, 15000); // 15 giây timeout
      
      // Gọi API thanh toán PayOS
      const response = await apiService.createPayment({
        amount: pkg.isDiscounted ? pkg.discountedPrice : pkg.price,
        packageId: pkg.id
      });
      
      // Clear timeout khi có response
      clearTimeout(timeoutId);
      
      console.log('Payment response in UpgradePackage:', response);
      
      // Debug chi tiết từng thuộc tính
      if (response?.value?.data) {
        console.log('Payment data details:');
        console.log('- orderCode:', response.value.data.orderCode);
        console.log('- qrCode:', response.value.data.qrCode);
        console.log('- qrCode length:', response.value.data.qrCode?.length);
        console.log('- checkoutUrl:', response.value.data.checkoutUrl);
        
        // Định nghĩa dữ liệu thanh toán
        const paymentData = {
          orderCode: response.value.data.orderCode,
          qrCode: response.value.data.qrCode,
          checkoutUrl: response.value.data.checkoutUrl,
          amount: pkg.isDiscounted ? pkg.discountedPrice : pkg.price,
          packageName: pkg.name
        };
        
        // Thay vì chuyển hướng trực tiếp đến trang thanh toán PayOS,
        // chuyển hướng đến trang hiển thị mã QR
        console.log("✅ Payment process successful, navigating to QR code page");
        navigate('/payment-qrcode', { state: { paymentData } });
        
      } else {
        console.error('Invalid payment response structure:', response);
        console.error('Response structure:', Object.keys(response || {}));
        
        toast.error('Cấu trúc dữ liệu thanh toán không hợp lệ. Vui lòng thử lại sau.');
        setProcessingPackageId(null);
      }
    } catch (error) {
      console.error('Lỗi thanh toán:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      
      toast.error(error.message || 'Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại.');
      setProcessingPackageId(null);
    }
  };

  // Tính phần trăm giảm giá
  const calculateDiscountPercentage = (originalPrice, salePrice) => {
    if (!originalPrice || !salePrice || originalPrice <= salePrice) return 0
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100)
  }

  // Xác định theme và icon dựa trên tên gói
  const getPackageTheme = (packageName) => {
    const name = packageName.toLowerCase();
    
    // Color themes for different packages
    let gradient, bgGlow, icon;
    
    if (name.includes("free")) {
      gradient = "from-[#28c76f] to-[#dfd142]";
      bgGlow = "group-hover:shadow-[#28c76f]/20";
      icon = <Sparkles className="w-6 h-6 text-white" />;
    } else if (name.includes("tracking")) {
      gradient = "from-[#6A11CB] to-[#2575FC]";
      bgGlow = "group-hover:shadow-[#6A11CB]/20";
      icon = <TrendingUp className="w-6 h-6 text-white" />;
    } else if (name.includes("analyze")) {
      gradient = "from-[#fe5d6a] to-[#fe82a7]";
      bgGlow = "group-hover:shadow-[#fe5d6a]/20";
      icon = <Award className="w-6 h-6 text-white" />;
    } else if (name.includes("premium")) {
      gradient = "from-[#ff9f43] to-[#ffbd59]";
      bgGlow = "group-hover:shadow-[#ff9f43]/20";
      icon = <Shield className="w-6 h-6 text-white" />;
    } else {
      // Default fallback
      gradient = "from-[#0396ff] to-[#abdcff]";
      bgGlow = "group-hover:shadow-[#0396ff]/20";
      icon = <Zap className="w-6 h-6 text-white" />;
    }
    
    // Base package details
    let description = "Khởi đầu hành trình đầu tư của bạn";
    let isPopular = false;
    
    if (name.includes("premium")) {
      description = "Tối ưu lợi nhuận với công nghệ AI";
      isPopular = true;
    } else if (name.includes("analyze")) {
      description = "Phân tích và dự đoán xu hướng thị trường";
    } else if (name.includes("tracking")) {
      description = "Theo dõi và quản lý danh mục đầu tư";
    }
    
    return {
      gradient,
      bgGlow,
      icon,
      description,
      isPopular
    };
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a14]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a14] p-4 text-center">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold text-white mb-2">Lỗi khi tải dữ liệu</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button 
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => window.location.reload()}
          >
            Thử lại
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-20 px-4 bg-[#0a0a14] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      
      <div className="relative container mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-purple-400/10 to-purple-400/20 border border-purple-500/20 text-purple-400 mb-4 inline-block">
            <Zap className="w-4 h-4 inline-block mr-2" />
            Nâng cấp để mở khóa sức mạnh của AI Trading
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            Chọn Gói Phù Hợp Với Bạn
          </h1>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto">
            Tối ưu hóa danh mục đầu tư của bạn với công nghệ AI tiên tiến và các công cụ phân tích chuyên sâu
          </p>
        </motion.div>

        {/* Package display grid */}
        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-4">
            {packages.map((pkg, index) => {
              const theme = getPackageTheme(pkg.name)
              const isDiscounted = pkg.isDiscounted && pkg.price > pkg.discountedPrice
              const displayPrice = isDiscounted ? pkg.discountedPrice : pkg.price
              const isProcessing = processingPackageId === pkg.id
              const isCurrentTier = pkg.name === userTier
              const isHovered = hoveredPackage === pkg.id
              
              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`group h-full transition-all duration-300 ${isCurrentTier ? 'z-10 scale-105' : 'hover:z-10 hover:scale-105'}`}
                  onMouseEnter={() => setHoveredPackage(pkg.id)}
                  onMouseLeave={() => setHoveredPackage(null)}
                >
                  <Card className={`relative h-full flex flex-col backdrop-blur-sm bg-black/40 border-2 
                    transition-all duration-300
                    ${isCurrentTier ? 'shadow-lg shadow-purple-500/20 border-purple-500' : 
                      isHovered ? `border-purple-500 shadow-lg ${theme.bgGlow}` : 'border-gray-800'}
                    ${theme.isPopular ? 'border-purple-500' : ''}
                    rounded-xl`}
                  >
                    {/* Discount tag */}
                    {!isCurrentTier && isDiscounted && (
                      <div className="absolute -top-3 -right-3 px-3 py-1 bg-gradient-to-r from-red-500 to-orange-500 
                        rounded-full text-white text-sm font-medium shadow-md shadow-red-500/20 flex items-center gap-1 z-10">
                        <Percent className="w-3 h-3" />
                        {calculateDiscountPercentage(pkg.price, displayPrice)}%
                      </div>
                    )}
                    
                    {/* Popular tag */}
                    {theme.isPopular && (
                      <div className="absolute -top-3 left-0 right-0 mx-auto w-max px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 
                        rounded-full text-white text-sm font-medium shadow-md shadow-purple-500/20 whitespace-nowrap z-10">
                        Phổ biến nhất
                      </div>
                    )}
                    
                    {/* Package content */}
                    <div className="p-6 flex flex-col flex-grow">
                      {/* Package header with icon */}
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`p-3 rounded-lg bg-gradient-to-r ${theme.gradient}`}>
                          {theme.icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{pkg.name}</h3>
                          <p className="text-sm text-gray-400">{theme.description}</p>
                        </div>
                      </div>
                      
                      {/* Price display */}
                      <div className="mb-6 text-center">
                        <div className={`bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>
                          {isDiscounted ? (
                            <div className="flex flex-col items-center">
                              <span className="text-4xl font-bold">
                                {displayPrice.toLocaleString()}đ
                              </span>
                              <span className="text-gray-400 line-through text-lg mt-1">
                                {pkg.price.toLocaleString()}đ
                              </span>
                            </div>
                          ) : (
                            <span className="text-4xl font-bold">
                              {displayPrice.toLocaleString()}đ
                            </span>
                          )}
                        </div>
                        <div className="text-gray-400 mt-1">/tháng</div>
                      </div>
                      
                      {/* Features list */}
                      <div className="flex-grow mb-6">
                        <ul className="space-y-3">
                          {pkg.featuresName.map((feature) => (
                            <li key={feature} className="flex items-start gap-3 text-left">
                              <div className={`rounded-full p-1 bg-gradient-to-r ${theme.gradient} flex-shrink-0 mt-1`}>
                                <Check className="h-3 w-3 text-white" />
                              </div>
                              <span className="text-gray-300 text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* Action button */}
                      <div className="mt-auto">
                        {pkg.name.toLowerCase() !== 'free' ? (
                          <Button 
                            onClick={() => handleStartNow(pkg)}
                            disabled={isProcessing || isCurrentTier}
                            className={`w-full h-12 text-base font-semibold
                              bg-gradient-to-r ${theme.gradient} hover:opacity-90
                              transition-all duration-300 hover:scale-[1.02] shadow-xl
                              disabled:opacity-70 disabled:cursor-not-allowed rounded-lg`}
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Đang xử lý...
                              </>
                            ) : isCurrentTier ? (
                              'Đang sử dụng'
                            ) : (
                              'Bắt đầu ngay'
                            )}
                          </Button>
                        ) : (
                          <div className="text-center text-gray-400 text-sm mt-3">
                            
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Xác nhận thay đổi gói */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="bg-[#121212] border-gray-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Xác nhận thay đổi gói
            </DialogTitle>
            <DialogDescription className="text-gray-400 mt-2">
              Bạn đang sử dụng gói <span className="font-semibold text-purple-400">{userTier}</span> và chuẩn bị nâng cấp lên gói <span className="font-semibold text-purple-400">{selectedPackage?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-md text-yellow-200">
            <p className="text-sm">
              Nếu bạn đang trong thời hạn sử dụng một gói, việc thay đổi gói sẽ thay đổi quyền truy cập các tính năng và mất quyền truy cập các tính năng của gói cũ nhưng vẫn được gia hạn ngày bình thường. Vui lòng cân nhắc trước khi thay đổi.
            </p>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialogOpen(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Hủy
            </Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => {
                setConfirmDialogOpen(false);
                processPayment(selectedPackage);
              }}
            >
              Xác nhận thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UpgradePackage
