import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Lock,
  Edit,
  Save,
  X,
  Upload,
  Camera,
  CreditCard,
  History,
  Settings,
  Bell,
  Crown,
  LogOut,
  Star,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import Cookies from "js-cookie";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useAuth } from "@/Authentication/AuthContext";
import UserSubscription from "@/components/UserSubscription";
import TransactionHistory from "@/components/TransactionHistory";
import { apiService } from "@/api/Api";

// FormInput component với validation trực tiếp
const FormInput = ({ 
  label, 
  type = "text", 
  id, 
  value, 
  onChange, 
  required = false, 
  minLength, 
  error, 
  placeholder,
  className = "",
  icon: Icon,
  hint
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const actualType = type === "password" && showPassword ? "text" : type;
  
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="text-gray-900 dark:text-white text-sm font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
        )}
        <input
          id={id}
          name={id}
          type={actualType}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          className={`w-full px-3 py-2 ${Icon ? 'pl-10' : ''} ${type === 'password' ? 'pr-10' : ''} rounded-md border ${error ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-[#333]'} bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#09D1C7] ${className}`}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex="-1"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hint}</p>
      )}
    </div>
  );
};

// Component hiển thị lỗi
const ErrorMessage = ({ message }) => {
  if (!message) return null;
  
  return (
    <p className="text-red-500 text-xs mt-1 pl-7">{message}</p>
  );
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser, isAuthenticated, logout, changePassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  // Thêm state để kiểm soát validation errors cho đổi mật khẩu
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  // Thêm state errors cho form thông tin cá nhân
  const [profileErrors, setProfileErrors] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    address: ""
  });
  
  // Lấy tab từ query params (nếu có)
  const queryParams = new URLSearchParams(location.search);
  const tabFromQuery = queryParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromQuery || "profile");
  
  // Thêm state cho thông tin gói dịch vụ
  const [subscription, setSubscription] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  
  // Thông tin người dùng
  const [userInfo, setUserInfo] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    avatar: user?.avatar || null,
    isVerified: user?.isVerified || false,
    isActive: user?.isActive !== false,
    role: user?.role || "user",
    dateOfBirth: user?.dateOfBirth || "",
    address: user?.address || "",
    tier: user?.tier || "Free"
  });
  
  // Lưu trữ thông tin ban đầu để có thể hủy chỉnh sửa
  const [initialUserInfo, setInitialUserInfo] = useState({...userInfo});
  
  // Enhanced data loading function to check both sources
  useEffect(() => {
    try {
      // Get data from both localStorage sources
      const userInfoStr = localStorage.getItem('user_info');
      const userDataStr = localStorage.getItem('user_data');
      
      let localUserInfo = null;
      let localUserData = null;
      
      if (userInfoStr) {
        localUserInfo = JSON.parse(userInfoStr);
        console.log("Loaded user_info from localStorage:", localUserInfo);
      }
      
      if (userDataStr) {
        localUserData = JSON.parse(userDataStr);
        console.log("Loaded user_data from localStorage:", localUserData);
      }
      
      // Check if tier is available in cookies
      const tierFromCookie = Cookies.get("user_tier");
      if (tierFromCookie) {
        console.log("Found tier in cookie:", tierFromCookie);
        
        // Update localStorage if the tier in cookie is different
        if (localUserInfo && tierFromCookie !== localUserInfo.tier) {
          localUserInfo.tier = tierFromCookie;
          localStorage.setItem('user_info', JSON.stringify(localUserInfo));
          console.log("Updated user_info tier from cookie:", tierFromCookie);
        }
        
        if (localUserData && tierFromCookie !== localUserData.tier) {
          localUserData.tier = tierFromCookie;
          localStorage.setItem('user_data', JSON.stringify(localUserData));
          console.log("Updated user_data tier from cookie:", tierFromCookie);
        }
      }
      
      // Ưu tiên lấy tier từ user_data
      let userTier = "Free";
      if (localUserData && localUserData.tier) {
        userTier = localUserData.tier;
      } else if (tierFromCookie) {
        userTier = tierFromCookie;
      } else if (localUserInfo && localUserInfo.tier) {
        userTier = localUserInfo.tier;
      }
      
      // Combine data from all sources, prioritizing in this order:
      // 1. Context data (user)
      // 2. user_info from localStorage (most likely to have latest profile edits)
      // 3. user_data from localStorage
      
      const combinedData = {
        name: user?.name || localUserInfo?.name || localUserData?.name || "",
        email: user?.email || localUserInfo?.email || localUserData?.email || "",
        phone: user?.phone || localUserInfo?.phone || localUserData?.phone || "",
        avatar: user?.avatar || localUserInfo?.avatar || localUserData?.avatar || null,
        isVerified: user?.isVerified || localUserInfo?.isVerified || localUserData?.isVerified || false,
        isActive: (user?.isActive !== false) || (localUserInfo?.isActive !== false) || (localUserData?.isActive !== false),
        role: user?.role || localUserInfo?.role || localUserData?.role || "user",
        // For these fields, prioritize user_info which might have updated profile data
        dateOfBirth: localUserInfo?.dateOfBirth || user?.dateOfBirth || localUserData?.dateOfBirth || "",
        address: localUserInfo?.address || user?.address || localUserData?.address || "",
        tier: userTier,
        features: localUserData?.features || user?.features || localUserInfo?.features || []
      };
      
      console.log("Combined user data:", combinedData);
      
      // Set the user info with the combined data
      setUserInfo(combinedData);
      setInitialUserInfo(combinedData);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }, [user]);
  
  // Lấy thông tin gói dịch vụ và lịch sử thanh toán
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoadingSubscription(true);
        
        // Lấy thông tin subscription
        const subscriptionResponse = await apiService.getUserSubscription();
        console.log("User Subscription API Response:", subscriptionResponse);
        
        if (subscriptionResponse.success && subscriptionResponse.data) {
          setSubscription(subscriptionResponse.data);
        } else {
          console.log("No active subscription found");
        }
        
        // Lấy thông tin lịch sử thanh toán để biết ngày thanh toán và hết hạn
        const paymentHistoryResponse = await apiService.getUserPaymentHistory();
        console.log("Payment History API Response:", paymentHistoryResponse);
        
        if (paymentHistoryResponse.status === 'success' && Array.isArray(paymentHistoryResponse.data)) {
          // Tìm gói đăng ký hiện tại (đầu tiên có status SUCCESS)
          const latestSuccessPayment = paymentHistoryResponse.data.find(t => t.status === 'SUCCESS');
          
          if (latestSuccessPayment) {
            console.log("Found latest SUCCESS payment:", latestSuccessPayment);
            // Cập nhật lại thông tin subscription với ngày thanh toán và hết hạn từ lịch sử thanh toán SUCCESS
            setSubscription(prev => ({
              ...prev,
              createdAt: latestSuccessPayment.createdAt,
              expireDate: latestSuccessPayment.expireDate
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoadingSubscription(false);
      }
    };
    
    if (isAuthenticated) {
      fetchUserData();
    }
  }, [isAuthenticated]);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate, loading]);
  
  // Thêm hàm để xác định màu sắc của badge dựa trên tier
  const getTierBadgeColor = (tier) => {
    if (!tier) return "border-transparent bg-emerald-500 text-white hover:bg-emerald-500/80"; // Default: Free
    
    // Chuyển đổi tier thành chuỗi và lowercase để so sánh
    const tierLower = (tier + "").toLowerCase();
    
    // Tạo hash từ tên tier để có màu nhất quán
    let hash = 0;
    for (let i = 0; i < tierLower.length; i++) {
      hash = tierLower.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Một số tier đặc biệt có thể được gán màu cố định
    if (tierLower === "free") return "border-transparent bg-emerald-500 text-white hover:bg-emerald-500/80";
    if (tierLower.includes("vip")) return "border-transparent bg-blue-600 text-white hover:bg-blue-600/80";
    if (tierLower.includes("premium")) return "border-transparent bg-amber-500 text-white hover:bg-amber-500/80";
    if (tierLower.includes("platinum")) return "border-transparent bg-purple-600 text-white hover:bg-purple-600/80";
    if (tierLower.includes("standard")) return "border-transparent bg-sky-500 text-white hover:bg-sky-500/80";
    
    // Các tier khác: dùng hash để chọn màu
    const colors = [
      "border-transparent bg-amber-500 text-white hover:bg-amber-500/80",
      "border-transparent bg-blue-600 text-white hover:bg-blue-600/80",
      "border-transparent bg-purple-600 text-white hover:bg-purple-600/80",
      "border-transparent bg-emerald-500 text-white hover:bg-emerald-500/80",
      "border-transparent bg-sky-500 text-white hover:bg-sky-500/80",
      "border-transparent bg-red-500 text-white hover:bg-red-500/80",
      "border-transparent bg-pink-500 text-white hover:bg-pink-500/80",
      "border-transparent bg-indigo-600 text-white hover:bg-indigo-600/80",
      "border-transparent bg-orange-500 text-white hover:bg-orange-500/80",
      "border-transparent bg-teal-500 text-white hover:bg-teal-500/80"
    ];
    
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserInfo(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset lỗi khi người dùng nhập lại
    setProfileErrors(prev => ({
      ...prev,
      [name]: ""
    }));
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset lỗi khi người dùng nhập lại
    setPasswordErrors(prev => ({
      ...prev,
      [name]: ""
    }));
  };
  
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setUserInfo(prev => ({
          ...prev,
          avatar: file
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleEditToggle = () => {
    if (isEditing) {
      // Nếu đang chỉnh sửa và muốn hủy
      setUserInfo(initialUserInfo);
      setAvatarPreview(null);
    }
    setIsEditing(!isEditing);
  };
  
  const handleSaveProfile = async () => {
    setIsLoading(true);
    
    // Validate form trước khi gọi API
    let validationErrors = {};
    let hasErrors = false;
    
    // Validate họ tên
    if (!userInfo.name || userInfo.name.trim().length === 0) {
      validationErrors.name = "Họ và tên không được để trống";
      hasErrors = true;
    } else if (userInfo.name.length > 30) {
      validationErrors.name = "Họ và tên không được vượt quá 30 ký tự";
      hasErrors = true;
      toast.error("Họ và tên không được vượt quá 30 ký tự");
    }
    
    // Validate số điện thoại
    if (userInfo.phone) {
      if (!/^\d{10}$/.test(userInfo.phone)) {
        validationErrors.phone = "Số điện thoại phải có đúng 10 chữ số";
        hasErrors = true;
      }
    }
    
    // Validate ngày sinh
    if (userInfo.dateOfBirth) {
      if (userInfo.dateOfBirth.length > 30) {
        validationErrors.dateOfBirth = "Ngày sinh không được vượt quá 30 ký tự";
        hasErrors = true;
        toast.error("Ngày sinh không được vượt quá 30 ký tự");
      } else {
        const birthDate = new Date(userInfo.dateOfBirth);
        const today = new Date();
        // Đặt giờ về 0 để so sánh chính xác ngày
        birthDate.setHours(0,0,0,0);
        today.setHours(0,0,0,0);
        if (birthDate >= today) {
          validationErrors.dateOfBirth = "Ngày sinh không thể là ngày hiện tại hoặc trong tương lai";
          hasErrors = true;
          toast.error("Ngày sinh không thể là ngày hiện tại hoặc trong tương lai");
        }
      }
    }
    
    // Nếu có lỗi validation, cập nhật state và dừng xử lý
    if (hasErrors) {
      setProfileErrors(validationErrors);
      setIsLoading(false);
      return;
    }
    
    try {
      // Format date properly if it exists
      let formattedDate = userInfo.dateOfBirth;
      if (formattedDate && !formattedDate.includes('T')) {
        // If date is in YYYY-MM-DD format, convert to ISO string
        formattedDate = new Date(formattedDate + 'T00:00:00').toISOString();
      }

      // Gọi API cập nhật thông tin
      const response = await apiService.updateProfile({
        name: userInfo.name,
        email: userInfo.email,
        phone: userInfo.phone,
        birthDate: formattedDate,
        address: userInfo.address
      });
      
      // Cập nhật thông tin ban đầu
      setInitialUserInfo({...userInfo, dateOfBirth: formattedDate});
      
      // Update both localStorage data sources to keep them in sync
      const updatedUserData = {
        name: userInfo.name,
        email: userInfo.email,
        phone: userInfo.phone, 
        dateOfBirth: formattedDate,
        address: userInfo.address
      };
      
      // Update user_info
      const currentUserInfo = JSON.parse(localStorage.getItem('user_info')) || {};
      localStorage.setItem('user_info', JSON.stringify({
        ...currentUserInfo,
        ...updatedUserData,
        tier: currentUserInfo.tier || userInfo.tier || "Free"
      }));
      
      // Update user_data 
      const currentUserData = JSON.parse(localStorage.getItem('user_data')) || {};
      localStorage.setItem('user_data', JSON.stringify({
        ...currentUserData,
        ...updatedUserData,
        tier: currentUserData.tier || userInfo.tier || "Free"
      }));
      
      // Force refresh the page data
      setUserInfo(prev => ({
        ...prev,
        dateOfBirth: formattedDate,
        address: userInfo.address
      }));
      
      setIsEditing(false);
      toast.success("Cập nhật thông tin thành công");
    } catch (error) {
      console.error("Error saving profile:", error);
      
      // Xử lý lỗi API
      if (error.response && error.response.data && error.response.data.errors) {
        const apiErrors = error.response.data.errors;
        const translatedErrors = {};
        
        // Chuyển đổi thông báo lỗi sang tiếng Việt
        if (apiErrors.Phone) {
          translatedErrors.phone = apiErrors.Phone[0].includes("exactly 10 digits") 
            ? "Số điện thoại phải có đúng 10 chữ số"
            : apiErrors.Phone[0];
        }
        
        if (apiErrors.Name) {
          translatedErrors.name = apiErrors.Name[0].includes("required") 
            ? "Họ và tên không được để trống"
            : apiErrors.Name[0];
        }
        
        if (apiErrors.Email) {
          translatedErrors.email = apiErrors.Email[0].includes("format") 
            ? "Email không đúng định dạng"
            : apiErrors.Email[0];
        }
        
        if (apiErrors.BirthDate) {
          translatedErrors.dateOfBirth = apiErrors.BirthDate[0].includes("future") 
            ? "Ngày sinh không thể là ngày trong tương lai"
            : apiErrors.BirthDate[0];
        }
        
        // Cập nhật state errors
        setProfileErrors(translatedErrors);
      } else {
        toast.error(error.message || "Không thể cập nhật thông tin");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Reset lỗi
    setPasswordErrors({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    
    // Validate form
    let hasErrors = false;
    let errors = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    };
    
    // Kiểm tra mật khẩu hiện tại
    if (!passwordData.currentPassword) {
      errors.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
      hasErrors = true;
    } else if (passwordData.currentPassword.length < 8) {
      errors.currentPassword = "Mật khẩu phải có ít nhất 8 ký tự";
      hasErrors = true;
    }
    
    // Kiểm tra mật khẩu mới
    if (!passwordData.newPassword) {
      errors.newPassword = "Vui lòng nhập mật khẩu mới";
      hasErrors = true;
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = "Mật khẩu phải có ít nhất 8 ký tự";
      hasErrors = true;
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(passwordData.newPassword)) {
      errors.newPassword = "Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt";
      hasErrors = true;
    }
    
    // Kiểm tra xác nhận mật khẩu
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
      hasErrors = true;
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp";
      hasErrors = true;
    }
    
    // Nếu có lỗi, cập nhật state và dừng xử lý
    if (hasErrors) {
      setPasswordErrors(errors);
      return;
    }
    
    setIsLoading(true);
    try {
      // Sử dụng API changePassword từ AuthContext
      console.log("Changing password for user:", user.id);
      const result = await changePassword(user.id, passwordData.currentPassword, passwordData.newPassword);
      
      if (result.success) {
        // Reset form
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        
        setIsPasswordDialogOpen(false);
        // Đảm bảo message hiển thị bằng tiếng Việt
        let successMessage = result.message || "Đổi mật khẩu thành công";
        if (successMessage === "Change password sucessfully" || 
            successMessage === "Change password successfully") {
          successMessage = "Đổi mật khẩu thành công";
        }
        toast.success(successMessage);
      } else {
        // Xử lý lỗi từ API
        if (result.message.toLowerCase().includes("hiện tại") || result.message.toLowerCase().includes("không chính xác")) {
          setPasswordErrors(prev => ({
            ...prev,
            currentPassword: result.message
          }));
        } else if (result.message.toLowerCase().includes("mới")) {
          setPasswordErrors(prev => ({
            ...prev,
            newPassword: result.message
          }));
        } else {
          // Lỗi chung
          toast.error(result.message || "Không thể đổi mật khẩu");
        }
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Không thể đổi mật khẩu");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Tạo chữ cái đầu cho avatar
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Đăng xuất thành công");
      navigate("/login");
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi đăng xuất");
    }
  };
  
  // Cập nhật URL khi tab thay đổi
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/profile?tab=${tab}`, { replace: true });
  };
  
  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-[#09090B]">
      {/* Animated gradient overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(9, 209, 199, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(76, 29, 149, 0.15) 0%, transparent 50%)
          `,
          animation: 'gradient 15s ease infinite',
        }}
      ></div>
      
      {/* Pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '30px 30px'
        }}
      ></div>

      {/* Moving light effect */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(9, 209, 199, 0.2), transparent)',
          animation: 'slide-right 3s linear infinite'
        }}
      ></div>

      <style jsx="true">{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes slide-right {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
      `}</style>

      <div className="container mx-auto py-8 px-4 md:px-6 relative">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white relative">
          Hồ sơ người dùng
          <div className="absolute inset-0 bg-[#09D1C7]/20 blur-xl -z-10"></div>
        </h1>
      
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <Card className="bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm border border-gray-200 dark:border-[#1f1f30] shadow-lg hover:shadow-[#09D1C7]/10 transition-all duration-300">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4 relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarPreview || userInfo.avatar} />
                    <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                      {getInitials(userInfo.name)}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && activeTab === "profile" && (
                    <div className="absolute bottom-0 right-0">
                      <Label htmlFor="avatar-upload" className="cursor-pointer">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                          <Camera className="h-4 w-4" />
                        </div>
                      </Label>
                      <Input 
                        id="avatar-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleAvatarChange}
                      />
                    </div>
                  )}
                </div>
                <CardTitle className="text-gray-900 dark:text-white">{userInfo.name}</CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">{userInfo.email}</CardDescription>
                {/* Component hiển thị trong sidebar */}
                {loadingSubscription ? (
                  <div className="text-xs text-gray-500 dark:text-muted-foreground mt-2 bg-gray-100/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm border border-gray-200 dark:border-[#1f1f30] p-4 rounded-lg">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-b-0 border-r-0 border-[#09D1C7] rounded-full"></div>
                      Đang tải thông tin gói...
                    </div>
                  </div>
                ) : subscription ? (
                  <div className="mt-2">
                    <Badge 
                      style={{ 
                        backgroundColor: userInfo.tier?.toLowerCase().includes('premium') ? '#f59e0b' : 
                                          userInfo.tier?.toLowerCase().includes('vip') ? '#2563eb' : 
                                          userInfo.tier?.toLowerCase().includes('standard') ? '#0ea5e9' : 
                                          userInfo.tier?.toLowerCase().includes('platinum') ? '#9333ea' : 
                                          '#10b981',
                        color: 'white',
                        borderColor: 'transparent'
                      }}
                    >
                      {subscription.packageName || userInfo.tier || "Free"}
                    </Badge>
                    <div className="flex items-center justify-center mt-1 text-xs">
                      <div className="flex items-center text-gray-500 dark:text-muted-foreground">
                        <div className="h-2 w-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></div>
                        Đang hoạt động
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2">
                    <Badge 
                      style={{ 
                        backgroundColor: userInfo.tier?.toLowerCase().includes('premium') ? '#f59e0b' : 
                                          userInfo.tier?.toLowerCase().includes('vip') ? '#2563eb' : 
                                          userInfo.tier?.toLowerCase().includes('standard') ? '#0ea5e9' : 
                                          userInfo.tier?.toLowerCase().includes('platinum') ? '#9333ea' : 
                                          '#10b981',
                        color: 'white',
                        borderColor: 'transparent'
                      }}
                    >
                      {userInfo.tier || "Free"}
                    </Badge>
                    <div className="flex items-center justify-center mt-1">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></div>
                      <span className="text-xs text-gray-500 dark:text-muted-foreground">Đang hoạt động</span>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <nav className="space-y-2">
                  <Button 
                    variant={activeTab === "profile" ? "default" : "ghost"} 
                    className={`w-full justify-start ${
                      activeTab === "profile" 
                        ? "bg-[#09D1C7] hover:bg-[#09D1C7]/90 text-white" 
                        : "hover:bg-[#09D1C7]/10 hover:text-[#09D1C7] text-gray-700 dark:text-gray-300"
                    }`}
                    onClick={() => handleTabChange("profile")}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Thông tin cá nhân
                  </Button>
                  <Button 
                    variant={activeTab === "subscriptions" ? "default" : "ghost"} 
                    className={`w-full justify-start ${
                      activeTab === "subscriptions" 
                        ? "bg-[#09D1C7] hover:bg-[#09D1C7]/90 text-white" 
                        : "hover:bg-[#09D1C7]/10 hover:text-[#09D1C7] text-gray-700 dark:text-gray-300"
                    }`}
                    onClick={() => handleTabChange("subscriptions")}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Dịch vụ & Giao dịch
                  </Button>
                </nav>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#1f1f30] hover:bg-[#09D1C7] hover:text-white transition-colors duration-200"
                  onClick={() => setIsPasswordDialogOpen(true)}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Đổi mật khẩu
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#1f1f30] hover:bg-[#09D1C7] hover:text-white transition-colors duration-200"
                  onClick={() => navigate('/stock')}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Về trang chính
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {/* Main Content */}
          <div className="md:col-span-3">
            {/* Thông tin cá nhân */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <Card className="bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm border border-gray-200 dark:border-[#1f1f30] shadow-lg hover:shadow-[#09D1C7]/10 transition-all duration-300">
                  <CardHeader>
                    <div className="flex flex-col items-center text-center mb-4">
                      <CardTitle className="text-gray-900 dark:text-white">Thông tin cá nhân</CardTitle>
                      <CardDescription className="text-gray-500 dark:text-gray-400">
                        {isEditing 
                          ? "Chỉnh sửa thông tin cá nhân của bạn" 
                          : "Xem thông tin cá nhân của bạn"}
                      </CardDescription>
                    </div>
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleEditToggle}
                        className={`${
                          isEditing 
                            ? "bg-red-500 hover:bg-red-600 text-white" 
                            : "bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#1f1f30] hover:bg-[#09D1C7] hover:text-white"
                        } transition-colors duration-200`}
                      >
                        {isEditing ? (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Hủy chỉnh sửa
                          </>
                        ) : (
                          <>
                            <Edit className="h-4 w-4 mr-2" />
                            Chỉnh sửa thông tin
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-gray-500 dark:text-gray-400 text-left block pl-7">Họ và tên</Label>
                          <div className="flex items-center space-x-3">
                            <User className="h-4 w-4 text-gray-500 dark:text-gray-500" />
                            <Input
                              id="name"
                              name="name"
                              value={userInfo.name}
                              onChange={handleInputChange}
                              disabled={!isEditing || isLoading}
                              placeholder="Họ và tên"
                              className={`flex-1 text-gray-900 dark:text-white ${profileErrors.name ? 'border-red-500' : ''}`}
                            />
                          </div>
                          <ErrorMessage message={profileErrors.name} />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-gray-500 dark:text-gray-400 text-left block pl-7">Email</Label>
                          <div className="flex items-center space-x-3">
                            <Mail className="h-4 w-4 text-gray-500 dark:text-gray-500" />
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={userInfo.email}
                              disabled={true}
                              placeholder="Email"
                              className="flex-1 cursor-not-allowed opacity-60 text-gray-900 dark:text-white"
                            />
                          </div>
                          <ErrorMessage message={profileErrors.email} />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-gray-500 dark:text-gray-400 text-left block pl-7">Số điện thoại</Label>
                          <div className="flex items-center space-x-3">
                            <Phone className="h-4 w-4 text-gray-500 dark:text-gray-500" />
                            <Input
                              id="phone"
                              name="phone"
                              value={userInfo.phone}
                              onChange={handleInputChange}
                              disabled={!isEditing || isLoading}
                              placeholder="Số điện thoại"
                              className={`flex-1 text-gray-900 dark:text-white ${profileErrors.phone ? 'border-red-500' : ''}`}
                            />
                          </div>
                          <ErrorMessage message={profileErrors.phone} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="dateOfBirth" className="text-gray-500 dark:text-gray-400 text-left block pl-7">Ngày sinh</Label>
                          <div className="flex items-center space-x-3">
                            <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-500" />
                            <Input
                              id="dateOfBirth"
                              name="dateOfBirth"
                              type="date"
                              value={userInfo.dateOfBirth && userInfo.dateOfBirth !== "" ? 
                                (userInfo.dateOfBirth.includes('T') ? 
                                  userInfo.dateOfBirth.split('T')[0] : 
                                  userInfo.dateOfBirth) : 
                                ''}
                              onChange={handleInputChange}
                              disabled={!isEditing || isLoading}
                              className={`flex-1 text-gray-900 dark:text-white ${profileErrors.dateOfBirth ? 'border-red-500' : ''}`}
                            />
                          </div>
                          <ErrorMessage message={profileErrors.dateOfBirth} />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="address" className="text-gray-500 dark:text-gray-400 text-left block pl-7">Địa chỉ</Label>
                          <div className="flex items-center space-x-3">
                            <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-500" />
                            <Input
                              id="address"
                              name="address"
                              value={userInfo.address}
                              onChange={handleInputChange}
                              disabled={!isEditing || isLoading}
                              placeholder="Địa chỉ"
                              className={`flex-1 text-gray-900 dark:text-white ${profileErrors.address ? 'border-red-500' : ''}`}
                            />
                          </div>
                          <ErrorMessage message={profileErrors.address} />
                        </div>
                      </div>
                    </form>
                  </CardContent>
                  {isEditing && (
                    <CardFooter>
                      <Button 
                        className="ml-auto bg-[#09D1C7] hover:bg-[#09D1C7]/90 text-white" 
                        onClick={handleSaveProfile}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-0 border-r-0 border-white rounded-full"></div>
                            Đang lưu...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Lưu thông tin
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </div>
            )}
            
            {/* Gói dịch vụ và Lịch sử giao dịch */}
            {activeTab === "subscriptions" && (
              <div className="space-y-6">
                {/* Component hiển thị gói dịch vụ hiện tại */}
                {!loadingSubscription && (
                  <Card className="bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm border border-gray-200 dark:border-[#1f1f30] shadow-lg hover:shadow-[#09D1C7]/10 transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div style={{ 
                            backgroundColor: userInfo.tier?.toLowerCase().includes('premium') ? '#f59e0b' : 
                                             userInfo.tier?.toLowerCase().includes('vip') ? '#2563eb' : 
                                             userInfo.tier?.toLowerCase().includes('standard') ? '#0ea5e9' : 
                                             userInfo.tier?.toLowerCase().includes('platinum') ? '#9333ea' : 
                                             '#10b981',
                            padding: '0.5rem',
                            borderRadius: '0.375rem'
                          }}>
                            <Star className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">Gói dịch vụ hiện tại</CardTitle>
                            <CardDescription className="text-gray-500 dark:text-gray-400">Thông tin gói dịch vụ bạn đang sử dụng</CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-0">
                      {userInfo.tier === 'Free' || !userInfo.tier ? (
                        <div className="flex items-center justify-between bg-gray-100 dark:bg-[#171727] p-4 mx-2 mb-4 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="bg-yellow-500/20 p-2 rounded-full">
                              <AlertCircle className="w-5 h-5 text-yellow-500" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">Bạn đang dùng gói Free</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Vui lòng chọn một gói dịch vụ phù hợp để nâng cấp tài khoản</p>
                            </div>
                          </div>
                          <Button 
                            className="bg-[#09D1C7] hover:bg-[#09D1C7]/90 whitespace-nowrap"
                            onClick={() => navigate('/upgrade-package')}
                          >
                            Nâng cấp ngay
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <div style={{ 
                            backgroundColor: userInfo.tier?.toLowerCase().includes('premium') ? '#f59e0b' : 
                                             userInfo.tier?.toLowerCase().includes('vip') ? '#2563eb' : 
                                             userInfo.tier?.toLowerCase().includes('standard') ? '#0ea5e9' : 
                                             userInfo.tier?.toLowerCase().includes('platinum') ? '#9333ea' : 
                                             '#10b981',
                            padding: '0.75rem 1rem',
                            color: 'white'
                          }}>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div className="bg-white/20 p-1.5 rounded-full">
                                  <CreditCard className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-white">
                                  Gói {userInfo.tier}
                                </h3>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-4">
                            {/* Thông tin thời gian */}
                            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="bg-gray-100 dark:bg-[#171727] p-3 rounded-md">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Ngày thanh toán</span>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {subscription?.createdAt ? new Date(subscription.createdAt).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit', year: 'numeric'}) : 'N/A'}
                                </p>
                              </div>
                              <div className="bg-gray-100 dark:bg-[#171727] p-3 rounded-md">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Ngày hết hạn</span>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {subscription?.expireDate ? new Date(subscription.expireDate).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit', year: 'numeric'}) : 'N/A'}
                                </p>
                              </div>
                            </div>

                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Tính năng của gói:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {Array.isArray(userInfo.features) && userInfo.features.length > 0 ? 
                                userInfo.features.map((feature, index) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                                  </div>
                                )) : 
                                (
                                  <div className="col-span-2 text-center text-gray-500 dark:text-gray-400">
                                    <p>Không có thông tin về tính năng gói</p>
                                  </div>
                                )
                              }
                            </div>
                            
                            <div className="mt-4 flex justify-end">
                              <Button 
                                className="bg-[#09D1C7] hover:bg-[#09D1C7]/90 text-white"
                                onClick={() => navigate('/upgrade-package')}
                              >
                                Nâng cấp gói
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {/* Thêm lịch sử giao dịch */}
                <TransactionHistory className="bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-sm border border-gray-200 dark:border-[#1f1f30] shadow-lg hover:shadow-[#09D1C7]/10 transition-all duration-300 rounded-md overflow-hidden" />
              </div>
            )}
            
            {/* Cài đặt */}
            {activeTab === "settings" && (
              <Card className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#1f1f30] shadow-lg hover:shadow-[#09D1C7]/10 transition-all duration-300">
                <CardHeader>
                  <CardTitle>Cài đặt tài khoản</CardTitle>
                  <CardDescription>Quản lý cài đặt và tùy chọn cho tài khoản của bạn</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Thông báo</h3>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p>Thông báo qua email</p>
                        <p className="text-sm text-muted-foreground">Nhận thông báo qua email</p>
                      </div>
                      <div>
                        <input type="checkbox" id="email-notifications" className="toggle" defaultChecked />
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p>Thông báo về giao dịch</p>
                        <p className="text-sm text-muted-foreground">Nhận thông báo khi có giao dịch mới</p>
                      </div>
                      <div>
                        <input type="checkbox" id="transaction-notifications" className="toggle" defaultChecked />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Bảo mật</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p>Xác thực hai yếu tố</p>
                          <p className="text-sm text-muted-foreground">Bảo vệ tài khoản bằng xác thực hai yếu tố</p>
                        </div>
                        <Button variant="outline">Thiết lập</Button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p>Phiên đăng nhập</p>
                          <p className="text-sm text-muted-foreground">Quản lý các phiên đăng nhập của bạn</p>
                        </div>
                        <Button variant="outline">Quản lý</Button>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Ngôn ngữ và khu vực</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="language">Ngôn ngữ</Label>
                        <Select defaultValue="vi">
                          <SelectTrigger id="language">
                            <SelectValue placeholder="Chọn ngôn ngữ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vi">Tiếng Việt</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timezone">Múi giờ</Label>
                        <Select defaultValue="asia_ho_chi_minh">
                          <SelectTrigger id="timezone">
                            <SelectValue placeholder="Chọn múi giờ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="asia_ho_chi_minh">Asia/Ho_Chi_Minh (GMT+7)</SelectItem>
                            <SelectItem value="asia_bangkok">Asia/Bangkok (GMT+7)</SelectItem>
                            <SelectItem value="america_new_york">America/New_York (GMT-5)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="ml-auto">Lưu cài đặt</Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
        
        {/* Dialog đổi mật khẩu */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent className="bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-md border border-gray-200 dark:border-[#1f1f30] shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">Đổi mật khẩu</DialogTitle>
              <DialogDescription className="text-gray-500 dark:text-gray-400">
                Nhập mật khẩu hiện tại và mật khẩu mới để thay đổi
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleChangePassword}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <FormInput
                    label="Mật khẩu hiện tại"
                    type="password"
                    id="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={8}
                    error={passwordErrors.currentPassword}
                    className="text-gray-900 dark:text-white border-gray-200 dark:border-[#333]"
                    icon={Lock}
                    hint="Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt."
                  />
                </div>
                <Separator className="bg-gray-200 dark:bg-[#333]" />
                <div className="space-y-2">
                  <FormInput
                    label="Mật khẩu mới"
                    type="password"
                    id="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={8}
                    error={passwordErrors.newPassword}
                    className="text-gray-900 dark:text-white border-gray-200 dark:border-[#333]"
                    icon={Lock}
                    hint="Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt."
                  />
                </div>
                <div className="space-y-2">
                  <FormInput
                    label="Xác nhận mật khẩu mới"
                    type="password"
                    id="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={8}
                    error={passwordErrors.confirmPassword}
                    className="text-gray-900 dark:text-white border-gray-200 dark:border-[#333]"
                    icon={Lock}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 border-gray-200 dark:border-white/10 text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-white transition-colors">
                    Hủy
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isLoading} className="bg-[#09D1C7] hover:bg-[#09D1C7]/90 text-white">
                  {isLoading ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-0 border-r-0 border-white rounded-full"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    "Đổi mật khẩu"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ProfilePage; 