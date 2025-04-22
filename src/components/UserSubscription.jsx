import React, { useState, useEffect } from "react";
import { CheckCircle as Check, Clock, Zap, Star, TrendingUp, ChevronRight, AlertCircle, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiService } from "@/api/Api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistance, format } from "date-fns";
import { vi } from "date-fns/locale";
import { useAuth } from "@/Authentication/AuthContext";

const UserSubscription = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userSubscription, setUserSubscription] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Format prices in VND
  const formatPrice = (price) => {
    if (!price) return "0 đ";
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price).replace('₫', 'đ');
  };

  // Format dates in Vietnamese format
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  // Calculate time remaining until subscription end
  const getTimeRemaining = (endDateString) => {
    if (!endDateString) return "Không thời hạn";
    
    try {
      const endDate = new Date(endDateString);
      if (isNaN(endDate.getTime())) return "Không xác định";
      
      const now = new Date();
      
      // Nếu đã hết hạn
      if (endDate < now) {
        return "Đã hết hạn";
      }
      
      const diffTime = Math.abs(endDate - now);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return "Hết hạn trong hôm nay";
      } else if (diffDays === 1) {
        return "Còn 1 ngày";
      } else if (diffDays <= 30) {
        return `Còn ${diffDays} ngày`;
      } else if (diffDays <= 365) {
        const months = Math.floor(diffDays / 30);
        const days = diffDays % 30;
        return `Còn ${months} tháng ${days > 0 ? `${days} ngày` : ''}`;
      } else {
        const years = Math.floor(diffDays / 365);
        const months = Math.floor((diffDays % 365) / 30);
        return `Còn ${years} năm ${months > 0 ? `${months} tháng` : ''}`;
      }
    } catch (error) {
      console.error("Error calculating time remaining:", error);
      return "Không xác định";
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoadingSubscription(true);
        
        // Lấy thông tin user từ localStorage
        const userInfoStr = localStorage.getItem('user_info');
        if (!userInfoStr) {
          console.log("No user info found in localStorage");
          setUserSubscription(null);
          return;
        }
        
        const userInfo = JSON.parse(userInfoStr);
        console.log("Retrieved user data from localStorage:", userInfo);
        
        // Tạo đối tượng subscription từ thông tin user
        const subscription = {
          packageName: userInfo.tier || "Free",
          status: "Active", // Giả sử đang active vì user đã đăng nhập
          features: userInfo.features || [],
          startDate: new Date().toISOString(), // Sử dụng ngày hiện tại làm mặc định
          endDate: userInfo.endDate || null,
          id: "default-subscription-id",
          userId: userInfo.id || "unknown",
          packageId: "default-package-id",
          price: 0,
          discountedPrice: 0,
          isActive: true
        };
        
        console.log("Constructed subscription data:", subscription);
        setUserSubscription(subscription);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Không thể tải thông tin gói dịch vụ");
      } finally {
        setLoadingSubscription(false);
      }
    };

    const fetchPackages = async () => {
      try {
        setLoading(true);
        const response = await apiService.getPackages();
        console.log("API Response:", response);
        
        if (response && Array.isArray(response)) {
          setPackages(response);
        } else if (response?.value?.data && Array.isArray(response.value.data)) {
          setPackages(response.value.data);
        } else {
          console.error("Invalid response structure:", response);
          setError("Dữ liệu không hợp lệ");
          toast.error("Dữ liệu không hợp lệ");
        }
      } catch (error) {
        console.error("Error fetching packages:", error);
        setError("Không thể tải danh sách gói dịch vụ");
        toast.error("Không thể tải danh sách gói dịch vụ");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    fetchPackages();
  }, []);

  // Get visual details for different package types
  const getPackageInfo = (packageName) => {
    const name = packageName.toLowerCase();
    
    if (name.includes("premium") || name.includes("vàng")) {
      return {
        badge: "Phổ biến nhất",
        bgColor: "bg-[#9A2617]",
        badgeBgColor: "bg-[#d24638]",
        iconBgColor: "bg-white/20",
        icon: <Zap className="w-4 h-4" />,
        description: "Vàng"
      };
    } else if (name.includes("vip") || name.includes("kim cương")) {
      return {
        badge: "VIP",
        bgColor: "bg-[#2D4B8E]",
        badgeBgColor: "bg-[#4167b0]",
        iconBgColor: "bg-white/20",
        icon: <Star className="w-4 h-4" />,
        description: "Kim cương"
      };
    } else {
      return {
        badge: "Basic",
        bgColor: "bg-[#2C614E]",
        badgeBgColor: "bg-[#3a7c65]",
        iconBgColor: "bg-white/20",
        icon: <TrendingUp className="w-4 h-4" />,
        description: "Bạc"
      };
    }
  };

  // Hàm xử lý đăng ký gói
  const handleRegister = async (pkg) => {
    try {
      // Chuyển đến trang nâng cấp với thông tin gói
      navigate('/upgrade-package', { 
        state: { 
          packageId: pkg.id,
          packageName: pkg.name,
          price: pkg.isDiscounted ? pkg.discountedPrice : pkg.price 
        } 
      });
    } catch (error) {
      console.error("Error registering for package:", error);
      toast.error("Không thể đăng ký gói dịch vụ. Vui lòng thử lại sau.");
    }
  };

  // Hiển thị phần loading khi đang tải dữ liệu
  if (loading && loadingSubscription) {
    return (
      <div className="space-y-4">
        <Card className="bg-[#111121] border border-[#1f1f30]">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Hiển thị lỗi nếu có
  if (error) {
    return (
      <Card className="bg-[#111121] border border-[#1f1f30]">
        <CardContent className="pt-6">
          <div className="text-center py-6">
            <p className="text-muted-foreground">{error}</p>
            <Button className="mt-4 bg-[#09D1C7] hover:bg-[#09D1C7]/90" onClick={() => window.location.reload()}>
              Thử lại
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hiển thị thông tin gói đã đăng ký */}
      {!loadingSubscription && (
        <Card className="bg-[#111121] border border-[#1f1f30] overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-[#09D1C7] p-2 rounded-md">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Gói dịch vụ hiện tại</CardTitle>
                  <CardDescription>Thông tin gói dịch vụ bạn đang sử dụng</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {!userSubscription ? (
              <div className="flex items-center justify-between bg-[#111121] p-4 mx-2 mb-4 rounded-lg border border-[#1f1f30]">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-500/20 p-2 rounded-full">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Chưa đăng ký gói nào</h3>
                    <p className="text-sm text-gray-400">Vui lòng chọn một gói dịch vụ phù hợp bên dưới để nâng cấp tài khoản</p>
                  </div>
                </div>
                <Button 
                  className="bg-[#09D1C7] hover:bg-[#09D1C7]/90 whitespace-nowrap text-white"
                  onClick={() => {
                    const element = document.getElementById('available-packages');
                    if (element) element.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Xem các gói
                </Button>
              </div>
            ) : (
              <div>
                <div className={`${getPackageInfo(userSubscription.packageName || "Basic").bgColor} py-3 px-4 text-white`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={`${getPackageInfo(userSubscription.packageName || "Basic").iconBgColor} p-1.5 rounded-full`}>
                        {getPackageInfo(userSubscription.packageName || "Basic").icon}
                      </div>
                      <h3 className="font-bold text-white">{userSubscription.packageName || "Gói Free"}</h3>
                    </div>
                    <Badge className={`${getPackageInfo(userSubscription.packageName || "Basic").badgeBgColor} border-none`}>
                      {userSubscription.status === "Active" ? "Đang hoạt động" : 
                       userSubscription.status === "Expired" ? "Đã hết hạn" : 
                       userSubscription.status === "Pending" ? "Đang xử lý" : "Không xác định"}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-4 space-y-4 bg-[#111121] rounded-b-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#111121] p-3 rounded-md border border-[#1f1f30]">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-400">Ngày bắt đầu</span>
                        <p className="font-medium text-white">{formatDate(userSubscription.startDate)}</p>
                      </div>
                    </div>
                    
                    <div className="bg-[#111121] p-3 rounded-md border border-[#1f1f30]">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-400">Ngày kết thúc</span>
                        <p className="font-medium text-white">
                          {userSubscription.endDate ? formatDate(userSubscription.endDate) : "Không thời hạn"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-[#111121] p-3 rounded-md border border-[#1f1f30]">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-400">Thời gian còn lại</span>
                        <p className="font-medium text-white">{getTimeRemaining(userSubscription.endDate)}</p>
                      </div>
                    </div>
                  </div>
                  
                  {Array.isArray(userSubscription.features) && userSubscription.features.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-white mb-2">Tính năng được bao gồm</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {userSubscription.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Check className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm text-gray-300">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {userSubscription.status === "Expired" && (
                    <div className="mt-4 flex justify-end">
                      <Button 
                        className="bg-[#09D1C7] hover:bg-[#09D1C7]/90 text-white whitespace-nowrap"
                        onClick={() => navigate('/upgrade-package')}
                      >
                        Nâng cấp ngay
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Danh sách các gói dịch vụ có sẵn */}
      <Card className="bg-[#111121] border border-[#1f1f30]" id="available-packages">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-[#09D1C7] p-2 rounded-md">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Gói dịch vụ</CardTitle>
                <CardDescription>Chọn gói phù hợp với bạn</CardDescription>
              </div>
            </div>
            <Badge className="bg-[#09D1C7] text-white px-3">
              Đang hoạt động
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {packages.length === 0 ? (
            <div className="text-center py-6 px-4">
              <p className="text-muted-foreground">Không có gói dịch vụ nào</p>
              <Button className="mt-4 bg-[#09D1C7] hover:bg-[#09D1C7]/90">Liên hệ hỗ trợ</Button>
            </div>
          ) : (
            <div className="space-y-4 px-2 pt-2 pb-4">
              {packages.map((pkg, index) => {
                const { badge, bgColor, badgeBgColor, iconBgColor, icon, description } = getPackageInfo(pkg.name);
                
                return (
                  <div 
                    key={pkg.id}
                    className="flex flex-col lg:flex-row overflow-hidden"
                  >
                    {/* Phần trái - icon và tên gói */}
                    <div className={`${bgColor} py-5 px-4 w-full lg:w-[140px] flex items-center justify-center flex-col text-center rounded-lg`}>
                      <div className={`${iconBgColor} p-2.5 rounded-full mb-2`}>
                        {icon}
                      </div>
                      <h3 className="font-bold text-white text-base mb-0.5">{pkg.name}</h3>
                      <p className="text-xs text-white/80 mb-1">{description}</p>
                      <Badge className={`${badgeBgColor} text-white border-none text-xs py-0.5 px-2`}>
                        {badge}
                      </Badge>
                    </div>
                    
                    {/* Phần phải - thông tin chi tiết */}
                    <div className="flex-grow flex flex-col lg:flex-row bg-[#111121] rounded-lg mt-0.5 lg:mt-0 lg:ml-0.5 border border-[#1f1f30]">
                      {/* Giá gói */}
                      <div className="p-4 lg:w-[180px] border-b lg:border-b-0 lg:border-r border-[#1f1f30] h-full">
                        <p className="text-xs text-gray-400">Giá gói:</p>
                        <div className="min-h-[60px]">
                          <div className="flex flex-col">
                            <span className="text-2xl font-bold text-white truncate max-w-full">
                              {formatPrice(pkg.isDiscounted ? pkg.discountedPrice : pkg.price)}
                            </span>
                            {pkg.isDiscounted && (
                              <span className="text-sm text-gray-400 line-through">
                                {formatPrice(pkg.price)}
                              </span>
                            )}
                          </div>
                          {pkg.isDiscounted && (
                            <Badge className="mt-2 bg-red-800 text-white text-xs border-none inline-flex">
                              Giảm giá
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-400">Thời hạn:</p>
                            <p className="text-sm font-medium text-white truncate">
                              {pkg.duration === 2147483647 ? "Vĩnh viễn" : `${pkg.duration} ngày`}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Tính năng */}
                      <div className="p-4 lg:flex-1 border-b lg:border-b-0 lg:border-r border-[#1f1f30] h-full">
                        <p className="text-xs text-gray-400 mb-2">Tính năng bao gồm:</p>
                        <ul className="space-y-1.5">
                          {pkg.featuresName.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <Check className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-xs text-gray-300">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* Nút đăng ký */}
                      <div className="p-4 lg:w-[140px] flex items-center justify-center">
                        <Button 
                          className={`${bgColor} hover:opacity-90 flex items-center justify-center gap-1 px-4 w-full`}
                          onClick={() => handleRegister(pkg)}
                        >
                          Đăng ký
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserSubscription; 