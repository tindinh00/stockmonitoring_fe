import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, Sparkles, Zap, Shield, TrendingUp, Clock, Award, Percent } from "lucide-react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"

const pricingPlans = [
  {
    name: "Basic Trader",
    price: 199000,
    originalPrice: 299000,
    onSale: true,
    description: "Khởi đầu hành trình đầu tư của bạn",
    gradient: "from-[#3CA55C] to-[#B5AC49]",
    bgGlow: "group-hover:shadow-[#3CA55C]/20",
    icon: <TrendingUp className="w-6 h-6" />,
    features: [
      "AI Signals cơ bản",
      "5 chiến lược giao dịch",
      "Phân tích thị trường hàng ngày",
      "Cộng đồng Basic Trader",
      "Hỗ trợ qua email",
    ],
    stats: {
      accuracy: "85%",
      signals: "20/ngày",
      support: "12/5"
    }
  },
  {
    name: "Elite Trader",
    price: 499000,
    originalPrice: 699000,
    onSale: true,
    description: "Tối ưu lợi nhuận với công nghệ AI",
    gradient: "from-[#FF512F] to-[#DD2476]",
    bgGlow: "group-hover:shadow-[#DD2476]/20",
    icon: <Sparkles className="w-6 h-6" />,
    features: [
      "Tất cả tính năng Basic",
      "AI Signals nâng cao",
      "15 chiến lược độc quyền",
      "Phân tích realtime",
      "Cảnh báo thị trường 24/7",
      "Tư vấn 1-1 với chuyên gia",
    ],
    stats: {
      accuracy: "92%",
      signals: "50/ngày",
      support: "24/7"
    },
    isPopular: true
  },
  {
    name: "Institutional",
    price: 1499000,
    originalPrice: 1499000,
    onSale: false,
    description: "Giải pháp toàn diện cho tổ chức",
    gradient: "from-[#7F00FF] to-[#E100FF]",
    bgGlow: "group-hover:shadow-[#7F00FF]/20",
    icon: <Shield className="w-6 h-6" />,
    features: [
      "Tất cả tính năng Elite",
      "API tích hợp độc quyền",
      "AI Model tùy chỉnh",
      "Quản lý rủi ro chuyên sâu",
      "Báo cáo phân tích tùy chỉnh",
      "Đội ngũ hỗ trợ riêng",
      "Đào tạo trực tiếp",
    ],
    stats: {
      accuracy: "95%",
      signals: "100+/ngày",
      support: "24/7 VIP"
    }
  },
]

// Tính phần trăm giảm giá
const calculateDiscountPercentage = (originalPrice, salePrice) => {
  if (!originalPrice || !salePrice || originalPrice <= salePrice) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

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

export default function UpgradePackage() {
  const navigate = useNavigate()

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
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group h-full"
            >
              <Card className={`relative h-full flex flex-col backdrop-blur-sm bg-black/40 border-2 
                transition-all duration-500 hover:translate-y-[-4px]
                ${plan.isPopular ? 'border-purple-500' : 'border-gray-800'}
                group-hover:border-opacity-100 group-hover:border-purple-500
                ${plan.bgGlow} group-hover:shadow-2xl`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 
                    rounded-full text-white text-sm font-medium shadow-lg shadow-purple-500/30 whitespace-nowrap">
                    Phổ biến nhất
                  </div>
                )}
                
                {plan.onSale && plan.originalPrice > plan.price && (
                  <div className="absolute -top-4 right-4 px-3 py-1 bg-gradient-to-r from-red-500 to-orange-500 
                    rounded-full text-white text-sm font-medium shadow-lg shadow-red-500/30 flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    Giảm {calculateDiscountPercentage(plan.originalPrice, plan.price)}%
                  </div>
                )}

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${plan.gradient}`}>
                      {plan.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      <p className="text-sm text-gray-400">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    {plan.onSale && plan.originalPrice > plan.price ? (
                      <div className="flex flex-col">
                        <span className={`text-4xl font-bold bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>
                          {plan.price.toLocaleString()}đ
                        </span>
                        <span className="text-gray-400 line-through text-lg">
                          {plan.originalPrice.toLocaleString()}đ
                        </span>
                        <span className="text-gray-400 mt-1">/tháng</span>
                      </div>
                    ) : (
                      <>
                        <span className={`text-4xl font-bold bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>
                          {plan.price.toLocaleString()}đ
                        </span>
                        <span className="text-gray-400 ml-2">/tháng</span>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <StatCard 
                      icon={<Award className="w-5 h-5 text-green-500" />}
                      label="Độ chính xác"
                      value={plan.stats.accuracy}
                      gradient={plan.gradient}
                    />
                    <StatCard 
                      icon={<Zap className="w-5 h-5 text-yellow-500" />}
                      label="Tín hiệu"
                      value={plan.stats.signals}
                      gradient={plan.gradient}
                    />
                    <StatCard 
                      icon={<Clock className="w-5 h-5 text-blue-500" />}
                      label="Hỗ trợ"
                      value={plan.stats.support}
                      gradient={plan.gradient}
                      className="col-span-2"
                    />
                  </div>

                  <div className="flex-grow">
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3">
                          <div className={`rounded-full p-1 bg-gradient-to-r ${plan.gradient} flex-shrink-0`}>
                            <Check className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto">
                    <Button 
                      onClick={() => {
                        navigate('/checkout', {
                          state: {
                            plan: {
                              name: plan.name,
                              price: plan.price,
                              originalPrice: plan.originalPrice,
                              onSale: plan.onSale,
                              gradient: plan.gradient,
                              period: "1 tháng",
                              features: plan.features,
                              stats: plan.stats
                            }
                          }
                        })
                      }}
                      className={`w-full h-14 text-base font-semibold
                        bg-gradient-to-r ${plan.gradient} hover:opacity-90
                        transition-all duration-300 hover:scale-[1.02] shadow-xl`}
                    >
                      Bắt đầu ngay
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
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
