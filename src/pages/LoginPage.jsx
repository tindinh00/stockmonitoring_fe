import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiService } from "../api/Api";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import logo from "../assets/logo.png";

// Schema validation với Zod
const loginSchema = z.object({
  email: z
    .string()
    .nonempty("Email là bắt buộc")
    .email("Email không hợp lệ")
    .max(50, "Email không được dài quá 50 ký tự") // Giới hạn độ dài
    .refine(
      (email) => {
        const allowedDomains = ["gmail.com", "yahoo.com", "hotmail.com"];
        const domain = email.split("@")[1];
        return allowedDomains.includes(domain);
      },
      {
        message: "Chỉ chấp nhận email từ Gmail, Yahoo hoặc Hotmail",
      }
    )
    .refine((email) => !/[!#$%^&*()+=[\]{};':"\\|,<>/?]/.test(email.split("@")[0]), {
      message: "Phần trước @ không được chứa ký tự đặc biệt ngoài dấu chấm",
    }),
  password: z
    .string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    .nonempty("Mật khẩu là bắt buộc"),
  rememberMe: z.boolean().optional(),
});

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const toggleShowPassword = () => setShowPassword(!showPassword);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await apiService.login({
        email: data.email,
        password: data.password,
      });

      if (response.data) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            name: response.data.name,
            email: response.data.email,
            avatar: response.data.avatar,
          })
        );
        toast.success("Đăng nhập thành công!", {
          position: "top-right",
          autoClose: 2000,
          theme: "dark",
        });
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
      }
    } catch (error) {
      const errorMsg = error.message || "Tài khoản hoặc mật khẩu không chính xác";
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 5000,
        theme: "dark",
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

      {/* Toast Container */}
      <ToastContainer />

      {/* Form Container */}
      <Card className="w-full max-w-md mx-4 p-6 bg-gray-900/95 text-teal-400 z-20 border border-teal-500/40 shadow-lg rounded-xl">
        <CardHeader className="flex flex-col items-center mb-2">
          <div className="flex items-center">
            <img src={logo} alt="StockSmart" className="h-16 w-auto" />
            <CardTitle className="text-3xl font-bold text-teal-400">
              StockSmart
            </CardTitle>
          </div>
          <CardDescription className="text-teal-400/80 mt-5 text-lg font-semibold text-left">
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
              <a href="#" className="text-sm text-teal-400 hover:underline">
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
              <span className="px-3 text-sm text-teal-400/80">
                Hoặc đăng nhập với
              </span>
              <div className="flex-grow border-t border-teal-500/50"></div>
            </div>

            {/* Google Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full bg-red-600 hover:bg-red-700 text-white border-none font-semibold py-2.5 rounded-lg shadow-md transition-all"
            >
              Google
            </Button>

            {/* Register Link */}
            <p className="text-sm text-teal-400 text-center">
              Chưa có tài khoản?{" "}
              <a href="/RegisterPages" className="font-medium hover:underline">
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