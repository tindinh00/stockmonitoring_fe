import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, Sparkles, Zap, Shield, TrendingUp, Clock, Award, Percent, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { apiService } from "@/api/Api"
import { toast } from "sonner"

const UpgradePackage = () => {
  const navigate = useNavigate()
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [processingPackageId, setProcessingPackageId] = useState(null)

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
    try {
      setProcessingPackageId(pkg.id)
      // Gọi API thanh toán PayOS
      const response = await apiService.createPayment({
        amount: pkg.isDiscounted ? pkg.discountedPrice : pkg.price,
        packageId: pkg.id
      });
      
      console.log('Payment response in UpgradePackage:', response);
      console.log('Payment data structure:', JSON.stringify(response.data, null, 2));
      
      // Debug chi tiết từng thuộc tính
      if (response?.value?.data) {
        console.log('Payment data details:');
        console.log('- orderCode:', response.value.data.orderCode);
        console.log('- qrCode:', response.value.data.qrCode);
        console.log('- qrCode length:', response.value.data.qrCode?.length);
        console.log('- checkoutUrl:', response.value.data.checkoutUrl);
        
        // Chuyển hướng người dùng trực tiếp đến trang thanh toán PayOS
        if (response.value.data.checkoutUrl) {
          window.location.href = response.value.data.checkoutUrl;
        } else {
          toast.error('Không tìm thấy link thanh toán. Vui lòng thử lại sau.');
          setProcessingPackageId(null);
        }
      } else {
        console.error('Invalid payment response structure:', response);
        console.error('Response structure:', Object.keys(response || {}));
        if (response?.data) console.error('Data structure:', Object.keys(response.data || {}));
        if (response?.data?.value) console.error('Value structure:', Object.keys(response.data.value || {}));
        
        toast.error('Cấu trúc dữ liệu thanh toán không hợp lệ. Vui lòng thử lại sau.');
        setProcessingPackageId(null)
      }
    } catch (error) {
      console.error('Lỗi thanh toán:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      
      toast.error(error.message || 'Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại.');
      setProcessingPackageId(null)
    }
  };

  // Tính phần trăm giảm giá
  const calculateDiscountPercentage = (originalPrice, salePrice) => {
    if (!originalPrice || !salePrice || originalPrice <= salePrice) return 0
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100)
  }

  // Xác định theme và icon dựa trên tên gói
  const getPackageTheme = (packageName) => {
    const name = packageName.toLowerCase()
    
    if (name.includes("premium") || name.includes("vàng") || name.includes("elite")) {
      return {
    name: "Elite Trader",
    description: "Tối ưu lợi nhuận với công nghệ AI",
    gradient: "from-[#FF512F] to-[#DD2476]",
    bgGlow: "group-hover:shadow-[#DD2476]/20",
        icon: <Sparkles className="w-6 h-6 text-white" />,
        isPopular: true,
    stats: {
      accuracy: "92%",
      signals: "50/ngày",
      support: "24/7"
        }
      }
    } else if (name.includes("vip") || name.includes("kim cương") || name.includes("institutional")) {
      return {
    name: "Institutional",
    description: "Giải pháp toàn diện cho tổ chức",
    gradient: "from-[#7F00FF] to-[#E100FF]",
    bgGlow: "group-hover:shadow-[#7F00FF]/20",
        icon: <Shield className="w-6 h-6 text-white" />,
        isPopular: false,
    stats: {
      accuracy: "95%",
      signals: "100+/ngày",
      support: "24/7 VIP"
    }
      }
    } else {
      return {
        name: "Basic Trader",
        description: "Khởi đầu hành trình đầu tư của bạn",
        gradient: "from-[#3CA55C] to-[#B5AC49]",
        bgGlow: "group-hover:shadow-[#3CA55C]/20",
        icon: <TrendingUp className="w-6 h-6 text-white" />,
        isPopular: false,
        stats: {
          accuracy: "85%",
          signals: "20/ngày",
          support: "12/5"
        }
      }
    }
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
                  ${theme.isPopular ? 'border-purple-500' : 'border-gray-800'}
                group-hover:border-opacity-100 group-hover:border-purple-500
                  ${theme.bgGlow} group-hover:shadow-2xl`}
              >
                  {theme.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 
                    rounded-full text-white text-sm font-medium shadow-lg shadow-purple-500/30 whitespace-nowrap">
                    Phổ biến nhất
                  </div>
                )}
                
                  {isDiscounted && (
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
                        disabled={isProcessing}
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
    </div>
  )
}

export default UpgradePackage
