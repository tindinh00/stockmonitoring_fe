import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Label } from "@/components/ui/label";
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
import { Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import logo from "../assets/logo.png";
import { apiService } from "../api/Api";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify"; // Import ToastContainer
import "react-toastify/dist/ReactToastify.css"; // Import CSS cho toast

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const validationSchema = Yup.object().shape({
    email: Yup.string().email("Email không hợp lệ").required("Email là bắt buộc"),
    name: Yup.string()
      .min(2, "Tên phải có ít nhất 2 ký tự")
      .max(50, "Tên không được vượt quá 50 ký tự")
      .required("Họ và tên là bắt buộc")
      .matches(/^[a-zA-ZÀ-ỹ\s]+$/, "Tên chỉ được chứa chữ cái và khoảng trắng"),
    phone: Yup.string()
      .matches(/^[0-9]+$/, "Số điện thoại chỉ được chứa số")
      .min(10, "Số điện thoại phải có ít nhất 10 số")
      .max(11, "Số điện thoại không được vượt quá 11 số")
      .required("Số điện thoại là bắt buộc"),
    password: Yup.string()
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt"
      )
      .required("Mật khẩu là bắt buộc"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], "Mật khẩu xác nhận không khớp")
      .required("Xác nhận mật khẩu là bắt buộc"),
    agreeToTerms: Yup.boolean().oneOf([true], "Bạn phải đồng ý với điều khoản sử dụng"),
  });

  const formik = useFormik({
    initialValues: {
      email: "",
      name: "",
      phone: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const response = await apiService.register({
          name: values.name,
          email: values.email,
          password: values.password,
          phone: values.phone,
        });

        if (response.status === 200) {
          localStorage.setItem("registerEmail", values.email);
          toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác thực.", {
            position: "top-right",
            autoClose: 2000,
            theme: "dark",
          });
          setTimeout(() => {
            navigate("/otp");
          }, 2000); // Chờ 2s để người dùng thấy toast
        }
      } catch (error) {
        toast.error(error.message || "Đăng ký thất bại", {
          position: "top-right",
          autoClose: 5000,
          theme: "dark",
        });
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center relative"
      style={{
        backgroundImage: `url("https://asset.chase.com/content/services/structured-image/image.desktopLarge.jpg/articles/thumbnail-image-large/how-does-the-stock-market-work-2560x1440.jpg")`,
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 z-10"></div>

      {/* Toast Container */}
      <ToastContainer />

      {/* Form Container */}
      <Card className="w-full max-w-md mx-4 p-6 bg-gray-900/95 text-teal-400 z-20 border border-teal-500/40 shadow-lg rounded-xl">
        <CardHeader className="flex flex-col items-center mb-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="StockSmart" className="h-16 w-auto" />
            <CardTitle className="text-3xl font-bold text-teal-400">StockSmart</CardTitle>
          </div>
          <CardDescription className="text-teal-400/80 mt-2 text-lg font-semibold text-left">
            Đăng ký
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={formik.handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-teal-400" />
                <Input
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={loading}
                  className="pl-10 bg-gray-800 border-teal-500/40 text-teal-400 placeholder-teal-400/60 focus:ring-2 focus:ring-teal-500 transition-all"
                />
              </div>
              {formik.touched.email && formik.errors.email && (
                <p className="text-red-400 text-sm text-left">{formik.errors.email}</p>
              )}
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-teal-400" />
                <Input
                  name="name"
                  type="text"
                  placeholder="Họ và tên"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={loading}
                  className="pl-10 bg-gray-800 border-teal-500/40 text-teal-400 placeholder-teal-400/60 focus:ring-2 focus:ring-teal-500 transition-all"
                />
              </div>
              {formik.touched.name && formik.errors.name && (
                <p className="text-red-400 text-sm text-left">{formik.errors.name}</p>
              )}
            </div>

            {/* Phone Input */}
            <div className="space-y-2">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-teal-400" />
                <Input
                  name="phone"
                  type="text"
                  placeholder="Số điện thoại"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={loading}
                  className="pl-10 bg-gray-800 border-teal-500/40 text-teal-400 placeholder-teal-400/60 focus:ring-2 focus:ring-teal-500 transition-all"
                />
              </div>
              {formik.touched.phone && formik.errors.phone && (
                <p className="text-red-400 text-sm text-left">{formik.errors.phone}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-teal-400" />
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mật khẩu"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={loading}
                  className="pl-10 pr-10 bg-gray-800 border-teal-500/40 text-teal-400 placeholder-teal-400/60 focus:ring-2 focus:ring-teal-500 transition-all"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-teal-400 hover:text-teal-300 p-1"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
              {formik.touched.password && formik.errors.password && (
                <p className="text-red-400 text-sm text-left">{formik.errors.password}</p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-teal-400" />
                <Input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Xác nhận mật khẩu"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={loading}
                  className="pl-10 pr-10 bg-gray-800 border-teal-500/40 text-teal-400 placeholder-teal-400/60 focus:ring-2 focus:ring-teal-500 transition-all"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-teal-400 hover:text-teal-300 p-1"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
              {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                <p className="text-red-400 text-sm text-left">{formik.errors.confirmPassword}</p>
              )}
            </div>

            {/* Agree to Terms Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="agreeToTerms"
                name="agreeToTerms"
                checked={formik.values.agreeToTerms}
                onCheckedChange={(checked) => formik.setFieldValue("agreeToTerms", checked)}
                disabled={loading}
                className="border-teal-500 data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500"
              />
              <Label htmlFor="agreeToTerms" className="text-sm text-teal-400">
                Tôi đồng ý với điều khoản sử dụng
              </Label>
            </div>
            {formik.touched.agreeToTerms && formik.errors.agreeToTerms && (
              <p className="text-red-400 text-sm text-left">{formik.errors.agreeToTerms}</p>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !formik.isValid}
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
                "Đăng ký"
              )}
            </Button>

            {/* Divider */}
            <div className="flex items-center justify-center my-4">
              <div className="flex-grow border-t border-teal-500/50"></div>
              <span className="px-3 text-sm text-teal-400/80">Hoặc đăng ký với</span>
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

            {/* Login Link */}
            <p className="text-sm text-teal-400 text-center">
              Đã có tài khoản?{" "}
              <a href="/LoginPages" className="font-medium hover:underline">
                Đăng nhập
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;