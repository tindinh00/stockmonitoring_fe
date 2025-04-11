import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import { apiService } from "../api/Api";
import { Mail, ArrowLeft, Send } from "lucide-react";
import logo from "../assets/logo.png";
import { Link, useNavigate } from "react-router-dom";

// Schema validation với Zod
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .nonempty("Email là bắt buộc")
    .email("Email không hợp lệ")
    .max(50, "Email không được dài quá 50 ký tự")
});

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [timeoutSeconds, setTimeoutSeconds] = useState(0);
  const [timeoutActive, setTimeoutActive] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Countdown timer effect
  useEffect(() => {
    let interval;
    if (timeoutActive && timeoutSeconds > 0) {
      interval = setInterval(() => {
        setTimeoutSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timeoutSeconds === 0 && timeoutActive) {
      setTimeoutActive(false);
    }
    return () => clearInterval(interval);
  }, [timeoutActive, timeoutSeconds]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      console.log("Requesting password reset for:", data.email);
      
      const result = await apiService.forgotPassword(data.email);
      console.log("Password reset request result:", result);
      
      if (result.value?.status === 200 || result.status === 200) {
        setEmailSent(true);
        setTimeoutSeconds(60); // 1 phút chờ trước khi gửi lại
        setTimeoutActive(true);
        
        // Lưu email để sử dụng trong trang OTP
        localStorage.setItem("resetPasswordEmail", data.email);
        
        toast.success(result.value?.message || "Mã OTP đã được gửi đến email của bạn!", {
          position: "top-right",
          duration: 5000,
        });
        
        // Chuyển hướng đến trang OTP sau 2 giây
        setTimeout(() => {
          navigate("/otp");
        }, 2000);
      } else {
        toast.error(result.value?.message || "Không thể gửi mã OTP. Vui lòng thử lại sau.", {
          position: "top-right",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Password reset request error:", error);
      const errorMsg = error.response?.data?.message || error.message || "Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau.";
      toast.error(errorMsg, {
        position: "top-right",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (timeoutActive) return;
    
    setLoading(true);
    try {
      const email = getValues("email");
      console.log("Resending OTP to:", email);
      
      const result = await apiService.forgotPassword(email);
      console.log("Resend OTP result:", result);
      
      if (result.value?.status === 200 || result.status === 200) {
        setTimeoutSeconds(60); // 1 phút chờ trước khi gửi lại
        setTimeoutActive(true);
        toast.success(result.value?.message || "Mã OTP đã được gửi lại!", {
          position: "top-right",
          duration: 5000,
        });
      } else {
        toast.error(result.value?.message || "Không thể gửi lại mã OTP. Vui lòng thử lại sau.", {
          position: "top-right",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      const errorMsg = error.response?.data?.message || error.message || "Không thể gửi lại mã OTP. Vui lòng thử lại sau.";
      toast.error(errorMsg, {
        position: "top-right",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

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
          <div className="flex items-center">
            <img src={logo} alt="StockSmart" className="h-16 w-auto" />
            <CardTitle className="text-3xl font-bold text-teal-400">
              StockFlow
            </CardTitle>
          </div>
          <CardDescription className="text-teal-400/80 mt-5 text-lg font-semibold text-left">
            Quên mật khẩu
          </CardDescription>
          <p className="mt-2 text-teal-400/70 text-sm text-center">
            {!emailSent
              ? "Nhập địa chỉ email để nhận mã OTP đặt lại mật khẩu."
              : "Chúng tôi đã gửi mã OTP đến email của bạn."}
          </p>
        </CardHeader>

        <CardContent>
          {!emailSent ? (
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
                  <div className="flex items-center justify-center">
                    <Send className="h-4 w-4 mr-2" />
                    Gửi mã OTP
                  </div>
                )}
              </Button>
            </form>
          ) : (
            <div className="flex flex-col items-center space-y-4 py-4">
              <div className="bg-teal-500/20 p-4 rounded-full">
                <Mail className="h-8 w-8 text-teal-400" />
              </div>
              <p className="text-center text-teal-400/90">
                Kiểm tra hộp thư đến để nhận mã OTP đặt lại mật khẩu.
              </p>
              <Button
                type="button"
                className="mt-4 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2.5 rounded-lg shadow-md transition-all"
                disabled={timeoutActive}
                onClick={handleResendEmail}
              >
                {timeoutActive ? (
                  `Vui lòng đợi ${timeoutSeconds}s`
                ) : (
                  "Gửi lại mã OTP"
                )}
              </Button>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-center pt-4">
          <Link to="/login" className="flex items-center text-teal-400 hover:text-teal-300 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại trang đăng nhập
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPassword;