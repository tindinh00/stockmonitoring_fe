import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/Authentication/AuthContext";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import logo from "../assets/logo.png";
import axios from "axios";

// API URL
const API_URL = "https://stockmonitoring.onrender.com";

// Schema validation với Zod
const loginSchema = z.object({
  email: z
    .string()
    .nonempty("Email là bắt buộc")
    .email("Email không hợp lệ")
    .max(50, "Email không được dài quá 50 ký tự"), // Bỏ các ràng buộc không cần thiết
  password: z
    .string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    .nonempty("Mật khẩu là bắt buộc"),
  rememberMe: z.boolean().optional(),
});

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, loginWithGoogle, getHomePageForRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Xử lý code từ Google OAuth redirect
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get('code');
    
    if (code) {
      handleGoogleLoginCallback(code);
    }
  }, [location]);

  const handleGoogleLoginCallback = async (code) => {
    setGoogleLoading(true);
    try {
      console.log("Received Google auth code:", code);
      const result = await loginWithGoogle(code);
      
      if (result.success) {
        toast.success("Đăng nhập Google thành công!", {
          position: "top-right",
          duration: 2000,
        });
        
        // Xóa code từ URL để tránh đăng nhập lại khi refresh
        window.history.replaceState({}, document.title, "/login");
        
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        toast.error(result.message || "Đăng nhập Google thất bại", {
          position: "top-right",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Đăng nhập Google thất bại. Vui lòng thử lại.", {
        position: "top-right",
        duration: 5000,
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  // Xử lý đăng nhập bằng Google
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      // Lưu trạng thái oauth flow để trang callback biết đây là đăng nhập
      localStorage.setItem('oauth_flow', 'login');
      
      // Chuyển hướng trực tiếp đến API endpoint để bắt đầu quá trình đăng nhập Google
      // API sẽ tự tạo state và chuyển hướng đến Google OAuth
      window.location.href = `${API_URL}/api/oauth/google/login/authentication`;
    } catch (error) {
      console.error("Google login redirect error:", error);
      toast.error("Không thể kết nối đến dịch vụ đăng nhập Google. Vui lòng thử lại sau.", {
        position: "top-right",
        duration: 5000,
      });
      setGoogleLoading(false);
    }
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Thêm xử lý lỗi và timeout
      const loginPromise = login(data.email, data.password);
      
      // Đặt timeout để tránh treo quá lâu (giảm từ 15s xuống 10s)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Đăng nhập quá thời gian, vui lòng thử lại")), 10000);
      });
      
      // Chạy cả hai promise và lấy kết quả từ cái hoàn thành trước
      const result = await Promise.race([loginPromise, timeoutPromise]);

      if (result.success) {
        // Xử lý ghi nhớ đăng nhập
        if (data.rememberMe) {
          // Lưu email vào localStorage
          localStorage.setItem('rememberedEmail', data.email);
        } else {
          // Xóa email đã lưu nếu không chọn ghi nhớ
          localStorage.removeItem('rememberedEmail');
        }

        // Đảm bảo chuyển hướng an toàn
        try {
          // Kiểm tra xem có đơn hàng đang chờ cập nhật sau thanh toán không
          const pendingOrderCode = localStorage.getItem('pending_payment_order');
          const redirectFromPayment = location.state?.redirectAfterLogin === '/payment-successfully';
          const orderCodeFromState = location.state?.orderCode;
          
          toast.success("Đăng nhập thành công!", {
            position: "top-right",
            duration: 2000,
          });
          
          if (pendingOrderCode || (redirectFromPayment && orderCodeFromState)) {
            const orderCode = pendingOrderCode || orderCodeFromState;
            
            // Xóa orderCode khỏi localStorage nếu có
            if (pendingOrderCode) {
              localStorage.removeItem('pending_payment_order');
            }
            
            // Chuyển hướng đến trang cập nhật thanh toán
            setTimeout(() => {
              navigate('/payment-successfully', { 
                state: { orderCode: orderCode } 
              });
            }, 500);
          } else {
            // Lấy trang chủ tương ứng với role của người dùng
            const redirectPath = getHomePageForRole(result.user.role);
            
            setTimeout(() => {
              navigate(redirectPath);
            }, 500);
          }
        } catch (navError) {
          // Nếu có lỗi khi chuyển hướng, thử tải lại trang
          setTimeout(() => {
            window.location.href = "/";
          }, 1000);
        }
      } else {
        toast.error(result.message || "Tài khoản hoặc mật khẩu không chính xác", {
          position: "top-right",
          duration: 5000,
        });
      }
    } catch (error) {
      const errorMsg = error.message || "Tài khoản hoặc mật khẩu không chính xác";
      toast.error(errorMsg, {
        position: "top-right",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Thêm useEffect để kiểm tra và điền email đã lưu
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setValue('email', rememberedEmail);
      setValue('rememberMe', true);
    }
  }, [setValue]);

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center relative"
      style={{
        backgroundImage: `url("https://asset.chase.com/content/services/structured-image/image.desktopLarge.jpg/articles/thumbnail-image-large/how-does-the-stock-market-work-2560x1440.jpg")`,
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/80 z-10"></div>

      {/* Form Container */}
      <Card className="w-full max-w-md mx-4 p-6 bg-gray-900/95 text-teal-400 z-20 border border-teal-500/40 shadow-lg rounded-xl">
        <CardHeader className="flex flex-col items-center mb-2">
          <div className="flex items-center -ml-5">
            <img src={logo} alt="StockSmart" className="h-16 w-auto" style={{ transform: 'translateY(4px)' }} />
            <CardTitle className="text-3xl font-bold text-teal-400 -ml-3">
              StockFlow
            </CardTitle>
          </div>
          <CardDescription className="text-teal-400/80 mt-5 text-lg font-bold text-left">
            Đăng nhập
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-teal-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Nhập email của bạn"
                  {...register("email")}
                  disabled={loading}
                  className="pl-10 bg-gray-800 border-teal-500/40 text-teal-400 placeholder-teal-400/60 focus:ring-2 focus:ring-teal-500 transition-all"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm text-left">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-teal-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  {...register("password")}
                  disabled={loading}
                  className="pl-10 pr-10 bg-gray-800 border-teal-500/40 text-teal-400 placeholder-teal-400/60 focus:ring-2 focus:ring-teal-500 transition-all"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={toggleShowPassword}
                  disabled={loading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-teal-400 hover:text-teal-300 p-1"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm text-left">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  {...register("rememberMe")}
                  onCheckedChange={(checked) => setValue("rememberMe", checked)}
                  disabled={loading}
                  className="border-teal-500 data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500"
                />
                <Label htmlFor="rememberMe" className="text-sm text-teal-400">
                  Ghi nhớ đăng nhập
                </Label>
              </div>
              <a href="/forgot-password" className="text-sm text-teal-400 hover:underline">
                Quên mật khẩu?
              </a>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2.5 rounded-lg shadow-md transition-all"
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white mx-auto"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                "Đăng nhập"
              )}
            </Button>

            {/* Divider */}
            <div className="flex items-center justify-center my-4">
              <div className="flex-grow border-t border-teal-500/50"></div>
              <span className="px-3 text-sm text-teal-400/80">Hoặc đăng nhập với</span>
              <div className="flex-grow border-t border-teal-500/50"></div>
            </div>

            {/* Google Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full bg-red-700 hover:bg-red-800 text-white border-none font-semibold py-2.5 rounded-lg shadow-md transition-all flex items-center justify-center"
            >
              {googleLoading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white mx-auto"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                  </svg>
                  <span className="ml-2">Đăng nhập với Google</span>
                </>
              )}
            </Button>

            {/* Register Link */}
            <p className="text-sm text-teal-400 text-center">
              Chưa có tài khoản?{" "}
              <a href="/register" className="font-medium hover:underline">
                Đăng ký ngay
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;