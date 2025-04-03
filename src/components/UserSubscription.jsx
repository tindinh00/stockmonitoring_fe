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

const UserSubscription = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userSubscription, setUserSubscription] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const navigate = useNavigate();

  // Hàm định dạng ngày tháng
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy", { locale: vi });
  };

  // Hàm tính thời gian còn lại
  const getTimeRemaining = (endDate) => {
    if (!endDate) return "N/A";
    const end = new Date(endDate);
    const now = new Date();
    
    try {
      return formatDistance(end, now, { 
        addSuffix: true, 
        locale: vi 
      });
    } catch (error) {
      console.error("Date formatting error:", error);
      return "N/A";
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoadingSubscription(true);
        const response = await apiService.getUserSubscription();
        console.log("User Subscription API Response:", response);
        
        if (response.success && response.data) {
          setUserSubscription(response.data);
        } else {
          console.log("No active subscription found");
          // Không hiển thị lỗi cho trường hợp này vì có thể user chưa đăng ký gói nào
        }
      } catch (error) {
        console.error("Error fetching user subscription:", error);
        // Không hiển thị lỗi toast cho trường hợp này
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

  // Hàm định dạng giá tiền
  const formatPrice = (price) => {
    return price.toLocaleString('vi-VN') + ' đ';
  };

  // Xác định màu và thông tin dựa trên tên gói
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
      // Hiển thị loading
      toast.loading("Đang chuẩn bị thanh toán...");
      
      // Gọi API thanh toán
      const response = await apiService.createPayment({
        amount: pkg.isDiscounted ? pkg.discountedPrice : pkg.price,
        packageId: pkg.id
      });
      
      // Kiểm tra phản hồi
      if (response?.value?.data?.checkoutUrl) {
        // Chuyển hướng tới URL thanh toán PayOS
        toast.dismiss();
        toast.success("Đang chuyển hướng tới trang thanh toán");
        window.location.href = response.value.data.checkoutUrl;
      } else {
        toast.dismiss();
        toast.error("Không thể tạo đơn hàng. Vui lòng thử lại sau.");
        console.error("Invalid payment response:", response);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.message || "Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại sau.");
      console.error("Payment error:", error);
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
              <div className="flex items-center justify-between bg-[#171727] p-4 mx-2 mb-4 rounded-lg">
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
                  className="bg-[#09D1C7] hover:bg-[#09D1C7]/90 whitespace-nowrap"
                  onClick={() => {
                    const element = document.getElementById('available-packages');
                    if (element) element.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Xem các gói
                </Button>
              </div>
            ) : (
              <div className="mx-2 mb-4">
                <div className={`rounded-lg overflow-hidden`}>
                  {/* Phần header của gói */}
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
                  
                  {/* Phần thông tin chi tiết */}
                  <div className="bg-[#171727] p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-[#09D1C7] mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-400">Ngày bắt đầu:</p>
                          <p className="font-medium text-white">{formatDate(userSubscription.startDate)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-[#09D1C7] mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-400">Ngày kết thúc:</p>
                          <p className="font-medium text-white">{formatDate(userSubscription.endDate)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-[#09D1C7] mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-400">Thời gian còn lại:</p>
                          <p className="font-medium text-white">{getTimeRemaining(userSubscription.endDate)}</p>
                        </div>
                      </div>
                    </div>
                    
                    {userSubscription.features && userSubscription.features.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-gray-400 mb-2">Tính năng được sử dụng:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {userSubscription.features.map((feature, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-xs text-gray-300">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {userSubscription.status === "Expired" && (
                      <div className="mt-4">
                        <Button 
                          className="bg-[#09D1C7] hover:bg-[#09D1C7]/90 w-full"
                          onClick={() => {
                            const element = document.getElementById('available-packages');
                            if (element) element.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          Gia hạn gói
                        </Button>
                      </div>
                    )}
                  </div>
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
                    <div className="flex-grow flex flex-col lg:flex-row bg-[#171727] rounded-lg mt-0.5 lg:mt-0 lg:ml-0.5">
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