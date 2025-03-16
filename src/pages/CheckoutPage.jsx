import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { motion } from "framer-motion"
import { Shield, CreditCard, Wallet, Check, Lock, Clock, ArrowLeft } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { toast } from "sonner"

const StyledInput = ({ className, ...props }) => (
  <Input 
    {...props}
    className={`
      h-12 
      bg-black/30 
      border-gray-800 
      text-white
      placeholder:text-gray-500
      focus:ring-2 
      ring-purple-500/20
      ${className}
    `} 
  />
)

const PaymentMethod = ({ icon: Icon, name, description, value }) => (
  <div className="relative">
    <RadioGroupItem 
      value={value} 
      id={value} 
      className="absolute top-4 right-4 before:bg-purple-500"
    />
    <Label
      htmlFor={value}
      className="flex items-center gap-4 rounded-xl border-2 border-gray-800 p-4 cursor-pointer
        transition-all duration-300 hover:bg-gray-900/50
        peer-data-[state=checked]:border-purple-500 peer-data-[state=checked]:bg-purple-500/10"
    >
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-lg bg-gray-900 flex items-center justify-center">
          <Icon className="w-6 h-6 text-purple-500" />
        </div>
      </div>
      <div className="flex-grow">
        <h4 className="font-medium text-white">{name}</h4>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </Label>
  </div>
)

// Thêm các hàm validation
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

const validateCardNumber = (number) => {
  const regex = /^[0-9]{16}$/
  return regex.test(number.replace(/\s/g, ''))
}

const validateExpiry = (expiry) => {
  const regex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/
  if (!regex.test(expiry)) return false
  
  const [month, year] = expiry.split('/')
  const expDate = new Date(2000 + parseInt(year), parseInt(month) - 1)
  const today = new Date()
  return expDate > today
}

const validateCVV = (cvv) => {
  const regex = /^[0-9]{3,4}$/
  return regex.test(cvv)
}

export default function CheckoutPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [paymentMethod, setPaymentMethod] = useState("card")
  
  // Lấy thông tin gói từ state
  const selectedPlan = location.state?.plan

  // Nếu không có thông tin gói, chuyển về trang upgrade-package
  useEffect(() => {
    if (!selectedPlan) {
      navigate('/upgrade-package')
    }
  }, [selectedPlan, navigate])

  // Nếu đang chuyển hướng, return null
  if (!selectedPlan) return null

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  })

  const [errors, setErrors] = useState({})

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))

    // Clear error when typing
    if (errors[id]) {
      setErrors(prev => ({
        ...prev,
        [id]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Vui lòng nhập họ'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Vui lòng nhập tên'
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Email không hợp lệ'
    }

    if (paymentMethod === 'card') {
      if (!validateCardNumber(formData.cardNumber)) {
        newErrors.cardNumber = 'Số thẻ không hợp lệ'
      }

      if (!validateExpiry(formData.expiry)) {
        newErrors.expiry = 'Ngày hết hạn không hợp lệ (MM/YY)'
      }

      if (!validateCVV(formData.cvv)) {
        newErrors.cvv = 'CVV không hợp lệ'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      toast.success('Thanh toán thành công!')
      // Xử lý thanh toán ở đây
    } else {
      toast.error('Vui lòng kiểm tra lại thông tin!')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
      
      <div className="relative">
        {/* Header */}
        <header className="border-b border-gray-800 bg-black/40 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/upgrade-package" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Quay lại</span>
            </Link>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-400">Thanh toán bảo mật</span>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-5 gap-8"
          >
            {/* Left Column - Payment Form (3 cols) */}
            <div className="lg:col-span-3 space-y-8">
              <Card className="p-8 bg-black/40 backdrop-blur-sm border-gray-800/50">
                <div className="space-y-8">
                  {/* Billing Information */}
                  <div>
                    <h3 className="text-xl font-semibold mb-6 text-white flex items-center gap-2">
                      <span>Thông tin thanh toán</span>
                      <div className="h-px flex-grow bg-gradient-to-r from-gray-800 to-transparent ml-4" />
                    </h3>
                    <div className="grid gap-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          
                          <StyledInput 
                            id="firstName" 
                            placeholder="Nguyễn" 
                            value={formData.firstName}
                            onChange={handleInputChange}
                          />
                          {errors.firstName && (
                            <span className="text-sm text-red-500">{errors.firstName}</span>
                          )}
                        </div>
                        <div className="space-y-2">
                          
                          <StyledInput 
                            id="lastName" 
                            placeholder="Văn A" 
                            value={formData.lastName}
                            onChange={handleInputChange}
                          />
                          {errors.lastName && (
                            <span className="text-sm text-red-500">{errors.lastName}</span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <StyledInput 
                          id="email" 
                          type="email" 
                          placeholder="example@gmail.com" 
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                        {errors.email && (
                          <span className="text-sm text-red-500">{errors.email}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <h3 className="text-xl font-semibold mb-6 text-white flex items-center gap-2">
                      <span>Phương thức thanh toán</span>
                      <div className="h-px flex-grow bg-gradient-to-r from-gray-800 to-transparent ml-4" />
                    </h3>
                    <RadioGroup 
                      value={paymentMethod} 
                      onValueChange={setPaymentMethod} 
                      className="space-y-4"
                    >
                      <PaymentMethod 
                        icon={CreditCard}
                        name="Thẻ tín dụng/ghi nợ"
                        description="Thanh toán an toàn với Visa, Mastercard"
                        value="card"
                      />
                      <PaymentMethod 
                        icon={Wallet}
                        name="Internet Banking"
                        description="Chuyển khoản qua ngân hàng nội địa"
                        value="banking"
                      />
                    </RadioGroup>

                    {/* Show Card Details only if card payment is selected */}
                    {paymentMethod === "card" && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-6 space-y-6 p-6 rounded-xl bg-gray-900/50 border border-gray-800"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="cardNumber" className="text-gray-200">Số thẻ</Label>
                          <StyledInput 
                            id="cardNumber" 
                            placeholder="1234 5678 9012 3456" 
                            value={formData.cardNumber}
                            onChange={handleInputChange}
                            maxLength={19}
                          />
                          {errors.cardNumber && (
                            <span className="text-sm text-red-500">{errors.cardNumber}</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="expiry" className="text-gray-200">Ngày hết hạn</Label>
                            <StyledInput 
                              id="expiry" 
                              placeholder="MM/YY" 
                              value={formData.expiry}
                              onChange={handleInputChange}
                              maxLength={5}
                            />
                            {errors.expiry && (
                              <span className="text-sm text-red-500">{errors.expiry}</span>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cvv" className="text-gray-200">CVV</Label>
                            <StyledInput 
                              id="cvv" 
                              placeholder="123" 
                              value={formData.cvv}
                              onChange={handleInputChange}
                              maxLength={4}
                            />
                            {errors.cvv && (
                              <span className="text-sm text-red-500">{errors.cvv}</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - Order Summary (2 cols) */}
            <div className="lg:col-span-2">
              <Card className="p-8 bg-black/40 backdrop-blur-sm border-gray-800/50 sticky top-24">
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <span>Chi tiết đơn hàng</span>
                    <div className="h-px flex-grow bg-gradient-to-r from-gray-800 to-transparent ml-4" />
                  </h3>

                  {/* Selected Plan */}
                  <div className="p-6 rounded-xl bg-gray-900/50 border border-gray-800">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-white">{selectedPlan.name}</h4>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>{selectedPlan.period}</span>
                        </div>
                      </div>
                      {selectedPlan.onSale && selectedPlan.originalPrice > selectedPlan.price ? (
                        <div className="flex flex-col items-end">
                          <span className={`text-2xl font-bold bg-gradient-to-r ${selectedPlan.gradient} bg-clip-text text-transparent`}>
                            {selectedPlan.price.toLocaleString()}đ
                          </span>
                          <span className="text-sm text-gray-400 line-through">
                            {selectedPlan.originalPrice.toLocaleString()}đ
                          </span>
                        </div>
                      ) : (
                        <span className={`text-2xl font-bold bg-gradient-to-r ${selectedPlan.gradient} bg-clip-text text-transparent`}>
                          {selectedPlan.price.toLocaleString()}đ
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      {selectedPlan.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-400">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total & Checkout Button */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                      <span className="text-lg font-medium text-gray-400">Tổng cộng</span>
                      <div className="text-right">
                        {selectedPlan.onSale && selectedPlan.originalPrice > selectedPlan.price && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-gray-400">Tiết kiệm:</span>
                            <span className="text-sm text-green-500 font-medium">
                              {(selectedPlan.originalPrice - selectedPlan.price).toLocaleString()}đ
                            </span>
                          </div>
                        )}
                        <span className="text-2xl font-bold text-white">
                          {selectedPlan.price.toLocaleString()}đ
                        </span>
                      </div>
                    </div>

                    <Button 
                      onClick={handleSubmit}
                      className={`w-full h-14 text-base font-semibold
                        bg-gradient-to-r ${selectedPlan.gradient} hover:opacity-90
                        transition-all duration-300 hover:scale-[1.02] shadow-xl`}
                    >
                      Xác nhận thanh toán
                    </Button>

                    {/* Security Badges */}
                    <div className="grid grid-cols-2 gap-4 pt-6">
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-900/50 border border-gray-800">
                        <Shield className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-gray-400">Bảo mật SSL</span>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-900/50 border border-gray-800">
                        <Lock className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-gray-400">Mã hóa dữ liệu</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
} 