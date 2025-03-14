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
import { Eye, EyeOff, Lock, ArrowLeft, CheckCircle } from "lucide-react";
import logo from "../assets/logo.png";
import { Link, useNavigate } from "react-router-dom";

// Schema validation với Zod
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường, một số và một ký tự đặc biệt"
      ),
    confirmPassword: z.string().nonempty("Xác nhận mật khẩu là bắt buộc"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Kiểm tra xem người dùng đã xác thực OTP chưa
    const otpVerified = localStorage.getItem("otpVerified");
    const verifiedEmail = localStorage.getItem("verifiedEmail");
    
    if (!otpVerified || !verifiedEmail) {
      toast.error("Bạn cần xác thực OTP trước khi đặt lại mật khẩu", {
        position: "top-right",
        duration: 5000,
      });
      navigate("/forgot-password");
      return;
    }
    
    setEmail(verifiedEmail);
  }, [navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const toggleShowPassword = () => setShowPassword(!showPassword);
  const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  const onSubmit = async (data) => {
    if (!email) {
      toast.error("Email không hợp lệ. Vui lòng thử lại.", {
        position: "top-right",
        duration: 5000,
      });
      return;
    }

    setLoading(true);
    try {
      console.log("Resetting password for:", email);
      
      const result = await apiService.resetPassword(email, data.password);
      console.log("Reset password result:", result);
      
      if (result.success) {
        setResetSuccess(true);
        // Xóa dữ liệu xác thực OTP
        localStorage.removeItem("otpVerified");
        localStorage.removeItem("verifiedEmail");
        
        toast.success("Đặt lại mật khẩu thành công!", {
          position: "top-right",
          duration: 3000,
        });
        
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        toast.error(result.message || "Không thể đặt lại mật khẩu. Vui lòng thử lại sau.", {
          position: "top-right",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Reset password error:", error);
      const errorMsg = error.message || "Không thể đặt lại mật khẩu. Vui lòng thử lại sau.";
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
            Đặt lại mật khẩu
          </CardDescription>
          {email && (
            <p className="mt-2 text-teal-400/70 text-sm text-center">
              {!resetSuccess
                ? `Vui lòng nhập mật khẩu mới cho tài khoản ${email}.`
                : "Mật khẩu của bạn đã được đặt lại thành công!"}
            </p>
          )}
        </CardHeader>

        <CardContent>
          {!resetSuccess ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Password Input */}
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-teal-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu mới"
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

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-teal-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Xác nhận mật khẩu mới"
                    {...register("confirmPassword")}
                    disabled={loading}
                    className="pl-10 pr-10 bg-gray-800 border-teal-500/40 text-teal-400 placeholder-teal-400/60 focus:ring-2 focus:ring-teal-500 transition-all"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={toggleShowConfirmPassword}
                    disabled={loading}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-teal-400 hover:text-teal-300 p-1"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-400 text-sm text-left">
                    {errors.confirmPassword.message}
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
                  "Đặt lại mật khẩu"
                )}
              </Button>
            </form>
          ) : (
            <div className="flex flex-col items-center space-y-4 py-4">
              <div className="bg-teal-500/20 p-4 rounded-full">
                <CheckCircle className="h-8 w-8 text-teal-400" />
              </div>
              <p className="text-center text-teal-400/90">
                Mật khẩu của bạn đã được đặt lại thành công. Bạn có thể đăng nhập bằng mật khẩu mới.
              </p>
              <Button
                type="button"
                className="mt-4 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2.5 rounded-lg shadow-md transition-all"
                onClick={() => navigate("/login")}
              >
                Đến trang đăng nhập
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

export default ResetPassword;