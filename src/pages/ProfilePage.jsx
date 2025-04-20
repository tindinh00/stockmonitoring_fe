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
  LogOut
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
  
  // Lấy tab từ query params (nếu có)
  const queryParams = new URLSearchParams(location.search);
  const tabFromQuery = queryParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromQuery || "profile");
  
  // Thêm state cho thông tin gói dịch vụ
  const [subscription, setSubscription] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  
  // Cập nhật URL khi tab thay đổi
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/profile?tab=${tab}`, { replace: true });
  };
  
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
        tier: user?.tier || localUserInfo?.tier || localUserData?.tier || "Free"
      };
      
      console.log("Combined user data:", combinedData);
      
      // Set the user info with the combined data
      setUserInfo(combinedData);
      setInitialUserInfo(combinedData);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }, [user]);
  
  // Lấy thông tin gói dịch vụ
  useEffect(() => {
    const fetchUserSubscription = async () => {
      try {
        setLoadingSubscription(true);
        const response = await apiService.getUserSubscription();
        console.log("User Subscription API Response:", response);
        
        if (response.success && response.data) {
          setSubscription(response.data);
        } else {
          console.log("No active subscription found");
        }
      } catch (error) {
        console.error("Error fetching user subscription:", error);
      } finally {
        setLoadingSubscription(false);
      }
    };
    
    if (isAuthenticated) {
      fetchUserSubscription();
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
    if (!tier) return "bg-green-500"; // Default: Free
    
    const tierLower = tier.toLowerCase();
    if (tierLower.includes("premium") || tierLower.includes("vàng") || tierLower === "premium") {
      return "bg-yellow-500"; // Premium/Gold: yellow
    } else if (tierLower.includes("vip") || tierLower.includes("kim cương") || tierLower === "vip") {
      return "bg-blue-600"; // VIP/Diamond: blue
    } else if (tierLower.includes("platinum") || tierLower === "platinum") {
      return "bg-purple-600"; // Platinum: purple
    } else if (tierLower === "free") {
      return "bg-green-500"; // Free: green
    }
    
    return "bg-green-500"; // Default fallback
  };

  // Xác định màu sắc và nội dung của badge dựa trên role và tier
  const getBadgeForRole = (role) => {
    // Ưu tiên hiển thị theo subscription nếu có
    if (subscription) {
      const packageName = subscription.packageName?.toLowerCase() || "";
      
      if (packageName.includes("vip") || packageName.includes("kim cương")) {
        return <Badge className="absolute -top-1 -right-1 bg-blue-500">VIP</Badge>;
      } else if (packageName.includes("premium") || packageName.includes("vàng")) {
        return <Badge className="absolute -top-1 -right-1 bg-yellow-500">Premium</Badge>;
      }
    }
    
    // Nếu không có subscription, kiểm tra role
    if (role) {
      switch (role.toLowerCase()) {
        case "admin":
          return <Badge className="absolute -top-1 -right-1 bg-red-500">Admin</Badge>;
        case "manager":
          return <Badge className="absolute -top-1 -right-1 bg-blue-500">Manager</Badge>;
      }
    }
    
    // Mặc định là Free
    return <Badge className="absolute -top-1 -right-1 bg-green-500">Free</Badge>;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
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
    try {
      // Format date properly if it exists
      let formattedDate = userInfo.dateOfBirth;
      if (formattedDate && !formattedDate.includes('T')) {
        // If date is in YYYY-MM-DD format, convert to ISO string
        formattedDate = new Date(formattedDate + 'T00:00:00').toISOString();
      }

      // Gọi API cập nhật thông tin
      await apiService.updateProfile({
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
      toast.error(error.message || "Không thể cập nhật thông tin");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Kiểm tra mật khẩu mới và xác nhận mật khẩu
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Mật khẩu mới và xác nhận mật khẩu không khớp");
      return;
    }
    
    setIsLoading(true);
    try {
      // Sử dụng API changePassword từ AuthContext
      console.log("Changing password for user:", user.id);
      const result = await changePassword(user.id, passwordData.newPassword);
      
      if (result.success) {
        // Reset form
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        
        setIsPasswordDialogOpen(false);
        toast.success(result.message || "Đổi mật khẩu thành công");
      } else {
        toast.error(result.message || "Không thể đổi mật khẩu");
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
  
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-8 text-center text-white">Hồ sơ người dùng</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <Card>
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
              <div className="flex items-center justify-center mb-2">
                {getBadgeForRole(userInfo.role)}
              </div>
              <CardTitle>{userInfo.name}</CardTitle>
              <CardDescription>{userInfo.email}</CardDescription>
              {loadingSubscription ? (
                <div className="text-xs text-muted-foreground mt-2">Đang tải thông tin gói...</div>
              ) : subscription ? (
                <div className="mt-2">
                  <Badge className={getTierBadgeColor(subscription.packageName)}>
                    {subscription.packageName || "Gói Free"}
                  </Badge>
                  <div className="flex items-center justify-center mt-1 text-xs">
                    {subscription.status === "Active" ? (
                      <div className="flex items-center text-muted-foreground">
                        <div className="h-2 w-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></div>
                        Đang hoạt động
                      </div>
                    ) : subscription.status === "Expired" ? (
                      <div className="flex items-center text-muted-foreground">
                        <div className="h-2 w-2 rounded-full bg-red-500 mr-1.5"></div>
                        Đã hết hạn
                      </div>
                    ) : (
                      <div className="flex items-center text-muted-foreground">
                        <div className="h-2 w-2 rounded-full bg-yellow-500 mr-1.5"></div>
                        Chưa kích hoạt
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-2">
                  <Badge className={getTierBadgeColor(user?.tier)}>
                    {user?.tier || "Gói Free"}
                  </Badge>
                  <div className="flex items-center justify-center mt-1">
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></div>
                    <span className="text-xs text-muted-foreground">Đang hoạt động</span>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <nav className="space-y-2">
                <Button 
                  variant={activeTab === "profile" ? "default" : "ghost"} 
                  className="w-full justify-start" 
                  onClick={() => handleTabChange("profile")}
                >
                  <User className="h-4 w-4 mr-2" />
                  Thông tin cá nhân
                </Button>
                <Button 
                  variant={activeTab === "subscriptions" ? "default" : "ghost"} 
                  className="w-full justify-start" 
                  onClick={() => handleTabChange("subscriptions")}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Gói dịch vụ
                </Button>
                <Button 
                  variant={activeTab === "transactions" ? "default" : "ghost"} 
                  className="w-full justify-start" 
                  onClick={() => handleTabChange("transactions")}
                >
                  <History className="h-4 w-4 mr-2" />
                  Lịch sử giao dịch
                </Button>
              </nav>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setIsPasswordDialogOpen(true)}
              >
                <Lock className="h-4 w-4 mr-2" />
                Đổi mật khẩu
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="md:col-span-3">
          {/* Thông tin cá nhân */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Thông tin cá nhân</CardTitle>
                    <CardDescription>
                      {isEditing 
                        ? "Chỉnh sửa thông tin cá nhân của bạn" 
                        : "Xem thông tin cá nhân của bạn"}
                    </CardDescription>
                  </div>
                  <Button 
                    variant={isEditing ? "destructive" : "outline"} 
                    onClick={handleEditToggle}
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
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Họ và tên</Label>
                        <div className="flex">
                          <User className="h-4 w-4 mr-2 mt-3 text-muted-foreground" />
                          <Input
                            id="name"
                            name="name"
                            value={userInfo.name}
                            onChange={handleInputChange}
                            disabled={!isEditing || isLoading}
                            placeholder="Họ và tên"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="flex">
                          <Mail className="h-4 w-4 mr-2 mt-3 text-muted-foreground" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={userInfo.email}
                            onChange={handleInputChange}
                            disabled={!isEditing || isLoading}
                            placeholder="Email"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Số điện thoại</Label>
                        <div className="flex">
                          <Phone className="h-4 w-4 mr-2 mt-3 text-muted-foreground" />
                          <Input
                            id="phone"
                            name="phone"
                            value={userInfo.phone}
                            onChange={handleInputChange}
                            disabled={!isEditing || isLoading}
                            placeholder="Số điện thoại"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="role">Loại tài khoản</Label>
                        <div className="flex items-center">
                          <div className="flex gap-2 items-center">
                            {getBadgeForRole(userInfo.role)}
                            <span>{userInfo.role || "Customer"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                        <div className="flex">
                          <Calendar className="h-4 w-4 mr-2 mt-3 text-muted-foreground" />
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
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="address">Địa chỉ</Label>
                      <div className="flex">
                        <MapPin className="h-4 w-4 mr-2 mt-3 text-muted-foreground" />
                        <Input
                          id="address"
                          name="address"
                          value={userInfo.address}
                          onChange={handleInputChange}
                          disabled={!isEditing || isLoading}
                          placeholder="Địa chỉ"
                        />
                      </div>
                    </div>
                  </form>
                </CardContent>
                {isEditing && (
                  <CardFooter>
                    <Button 
                      className="ml-auto" 
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
              
              <Card>
                <CardHeader>
                  <CardTitle>Lịch sử hoạt động</CardTitle>
                  <CardDescription>
                    Các hoạt động gần đây của bạn
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Đăng nhập</p>
                        <p className="text-sm text-muted-foreground">Từ 192.168.1.1</p>
                      </div>
                      <p className="text-sm text-muted-foreground">Hôm nay, 10:30</p>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Cập nhật thông tin</p>
                        <p className="text-sm text-muted-foreground">Thay đổi số điện thoại</p>
                      </div>
                      <p className="text-sm text-muted-foreground">Hôm qua, 15:45</p>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Đăng nhập</p>
                        <p className="text-sm text-muted-foreground">Từ 192.168.1.1</p>
                      </div>
                      <p className="text-sm text-muted-foreground">Hôm qua, 09:15</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Gói dịch vụ */}
          {activeTab === "subscriptions" && (
            <UserSubscription />
          )}
          
          {/* Lịch sử giao dịch */}
          {activeTab === "transactions" && (
            <TransactionHistory />
          )}
          
          {/* Cài đặt */}
          {activeTab === "settings" && (
            <Card>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Đổi mật khẩu</DialogTitle>
            <DialogDescription>
              Nhập mật khẩu hiện tại và mật khẩu mới để thay đổi
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Hủy
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
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
  );
};

export default ProfilePage; 