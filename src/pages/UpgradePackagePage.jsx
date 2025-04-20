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
    
    // Expanded array of gradient color combinations including the provided colors
    const colorThemes = [
      { gradient: "from-[#28c76f] to-[#dfd142]", bgGlow: "group-hover:shadow-[#28c76f]/20" },  // Green to Yellow
      { gradient: "from-[#fe5d6a] to-[#fe82a7]", bgGlow: "group-hover:shadow-[#fe5d6a]/20" },  // Red to Pink
      { gradient: "from-[#ff9f43] to-[#ffbd59]", bgGlow: "group-hover:shadow-[#ff9f43]/20" },  // Orange to Light Orange
      { gradient: "from-[#0396ff] to-[#abdcff]", bgGlow: "group-hover:shadow-[#0396ff]/20" },  // Blue to Light Blue
      { gradient: "from-[#ffd200] to-[#f7f779]", bgGlow: "group-hover:shadow-[#ffd200]/20" },  // Yellow to Light Yellow
    ];
    
    // Array of possible icons with their respective components
    const iconOptions = [
      { component: <Sparkles className="w-6 h-6 text-white" />, name: "sparkles" },
      { component: <Shield className="w-6 h-6 text-white" />, name: "shield" },
      { component: <TrendingUp className="w-6 h-6 text-white" />, name: "trendingUp" },
      { component: <Zap className="w-6 h-6 text-white" />, name: "zap" },
      { component: <Award className="w-6 h-6 text-white" />, name: "award" },
      { component: <Clock className="w-6 h-6 text-white" />, name: "clock" },
    ];
    
    // Create a consistent hash from the package name
    const hash = name.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    // Select colors and icon based on the hash
    const colorIndex = hash % colorThemes.length;
    const iconIndex = (hash * 13) % iconOptions.length; // Use a different modulo operation for icon selection
    
    const colors = colorThemes[colorIndex];
    const icon = iconOptions[iconIndex];
    
    // Base package details
    let packageDetails = {};
    
    if (name.includes("premium") || name.includes("vàng") || name.includes("elite")) {
      packageDetails = {
        name: "Elite Trader",
        description: "Tối ưu lợi nhuận với công nghệ AI",
        isPopular: true,
        stats: {
          accuracy: "92%",
          signals: "50/ngày",
          support: "24/7"
        }
      };
    } else if (name.includes("vip") || name.includes("kim cương") || name.includes("institutional")) {
      packageDetails = {
        name: "Institutional",
        description: "Giải pháp toàn diện cho tổ chức",
        isPopular: false,
        stats: {
          accuracy: "95%",
          signals: "100+/ngày",
          support: "24/7 VIP"
        }
      };
    } else {
      packageDetails = {
        name: "Basic Trader",
        description: "Khởi đầu hành trình đầu tư của bạn",
        isPopular: false,
        stats: {
          accuracy: "85%",
          signals: "20/ngày",
          support: "12/5"
        }
      };
    }
    
    // Combine the details with the color theme and icon
    return {
      ...packageDetails,
      gradient: colors.gradient,
      bgGlow: colors.bgGlow,
      icon: icon.component
    };
  }

const StatCard = ({ icon, label, value, gradient }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-black/40 backdrop-blur-sm border border-gray-800">
    {icon}
    <div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-lg font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
        {value}
      </p>
    </div>
  </div>
)

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

        <div className="grid lg:grid-cols-3 gap-4 md:gap-8 max-w-7xl mx-auto">
          {packages.map((pkg, index) => {
            const theme = getPackageTheme(pkg.name)
            const isDiscounted = pkg.isDiscounted && pkg.price > pkg.discountedPrice
            const displayPrice = isDiscounted ? pkg.discountedPrice : pkg.price
            const isProcessing = processingPackageId === pkg.id
            const isCurrentTier = pkg.name === userTier // Check if this package is the user's current tier
            
            return (
            <motion.div
                key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group h-full"
            >
              <Card className={`relative h-full flex flex-col backdrop-blur-sm bg-black/40 border-2 
                transition-all duration-500 hover:translate-y-[-4px]
                  ${theme.isPopular ? 'border-purple-500' : isCurrentTier ? 'border-green-500' : 'border-gray-800'}
                group-hover:border-opacity-100 ${!isCurrentTier ? 'group-hover:border-purple-500' : ''}
                  ${theme.bgGlow} group-hover:shadow-2xl`}
              >
                  {theme.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 
                    rounded-full text-white text-sm font-medium shadow-lg shadow-purple-500/30 whitespace-nowrap">
                    Phổ biến nhất
                  </div>
                )}
                
                  {isCurrentTier && (
                  <div className="absolute -top-4 right-4 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 
                    rounded-full text-white text-sm font-medium shadow-lg shadow-green-500/30 flex items-center gap-1">
                    Đang sử dụng
                  </div>
                )}
                
                  {!isCurrentTier && isDiscounted && (
                  <div className="absolute -top-4 right-4 px-3 py-1 bg-gradient-to-r from-red-500 to-orange-500 
                    rounded-full text-white text-sm font-medium shadow-lg shadow-red-500/30 flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                      Giảm {calculateDiscountPercentage(pkg.price, displayPrice)}%
                  </div>
                )}

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${theme.gradient}`}>
                        {theme.icon}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">{pkg.name}</h3>
                        <p className="text-sm text-gray-400">{theme.description}</p>
                      </div>
                  </div>

                  <div className="mb-6">
                      {isDiscounted ? (
                      <div className="flex flex-col">
                          <span className={`text-4xl font-bold bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>
                            {displayPrice.toLocaleString()}đ
                        </span>
                        <span className="text-gray-400 line-through text-lg">
                            {pkg.price.toLocaleString()}đ
                        </span>
                        <span className="text-gray-400 mt-1">/tháng</span>
                      </div>
                    ) : (
                      <>
                          <span className={`text-4xl font-bold bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>
                            {displayPrice.toLocaleString()}đ
                        </span>
                        <span className="text-gray-400 ml-2">/tháng</span>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <StatCard 
                      icon={<Award className="w-5 h-5 text-green-500" />}
                      label="Độ chính xác"
                        value={theme.stats.accuracy}
                        gradient={theme.gradient}
                    />
                    <StatCard 
                      icon={<Zap className="w-5 h-5 text-yellow-500" />}
                      label="Tín hiệu"
                        value={theme.stats.signals}
                        gradient={theme.gradient}
                    />
                    <StatCard 
                      icon={<Clock className="w-5 h-5 text-blue-500" />}
                      label="Hỗ trợ"
                        value={theme.stats.support}
                        gradient={theme.gradient}
                      className="col-span-2"
                    />
                  </div>

                  <div className="flex-grow">
                    <ul className="space-y-3 mb-6">
                        {pkg.featuresName.map((feature) => (
                        <li key={feature} className="flex items-center gap-3">
                            <div className={`rounded-full p-1 bg-gradient-to-r ${theme.gradient} flex-shrink-0`}>
                            <Check className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto">
                    <Button 
                        onClick={() => handleStartNow(pkg)}
                        disabled={isProcessing || isCurrentTier}
                      className={`w-full h-14 text-base font-semibold
                          bg-gradient-to-r ${theme.gradient} hover:opacity-90
                          transition-all duration-300 hover:scale-[1.02] shadow-xl
                          disabled:opacity-80 disabled:cursor-not-allowed`}
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
                  </div>
                </div>
              </Card>
            </motion.div>
            )
          })}
        </div>

        {/* Social Proof Section */}
        <div className="mt-20 text-center">
          <p className="text-gray-400 mb-6">Được tin dùng bởi hơn 10,000+ nhà đầu tư</p>
          <div className="flex flex-wrap justify-center gap-8 opacity-50">
            {/* Add partner/client logos here */}
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
