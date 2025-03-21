import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import { apiService } from "../api/Api";
import logo from "../assets/logo.png";

const OtpPage = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Kiểm tra xem đây là quên mật khẩu hay đăng ký
    const resetPasswordEmail = localStorage.getItem("resetPasswordEmail");
    const registerEmail = localStorage.getItem("registerEmail");
    
    if (resetPasswordEmail) {
      setEmail(resetPasswordEmail);
      setIsPasswordReset(true);
    } else if (registerEmail) {
      setEmail(registerEmail);
      setIsPasswordReset(false);
    } else {
      // Nếu không có email nào, chuyển hướng về trang đăng ký
      navigate("/register");
      return;
    }
  }, [navigate]);

  // Add countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value !== "" && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      toast.error("Vui lòng nhập đầy đủ mã OTP 6 số!", {
        position: "top-right",
        duration: 5000,
      });
      return;
    }

    setLoading(true);
    try {
      console.log("Submitting OTP:", otpValue, "for email:", email);
      
      // Xử lý khác nhau cho đăng ký và quên mật khẩu
      if (isPasswordReset) {
        // Xử lý OTP cho quên mật khẩu
        const response = await apiService.verifyOtp(email, otpValue);
        console.log("OTP verification response (reset password):", response);
        
        if (response.success || response.status === 200 || response.statusCode === 200) {
          localStorage.removeItem("resetPasswordEmail");
          localStorage.setItem("otpVerified", "true");
          localStorage.setItem("verifiedEmail", email);
          
          toast.success("Xác thực OTP thành công!", {
            position: "top-right",
            duration: 2000,
          });
          
          setTimeout(() => {
            navigate("/reset-password");
          }, 2000);
        } else {
          toast.error(response.message || "Mã OTP không chính xác!", {
            position: "top-right",
            duration: 5000,
          });
        }
      } else {
        // Xử lý OTP cho đăng ký
        const response = await apiService.verifyOtp(email, otpValue);
        console.log("OTP verification response (register):", response);
        
        if (response.success || response.status === 200 || response.statusCode === 200) {
          localStorage.removeItem("registerEmail");
          toast.success("Xác thực email thành công!", {
            position: "top-right",
            duration: 2000,
          });
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        } else {
          toast.error(response.message || "Mã OTP không chính xác!", {
            position: "top-right",
            duration: 5000,
          });
        }
      }
    } catch (error) {
      console.error("OTP verification failed:", error);
      const errorMessage = error.message || "Xác thực OTP thất bại!";
      toast.error(errorMessage, {
        position: "top-right",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) {
      toast.error(`Vui lòng đợi ${countdown} giây trước khi gửi lại mã OTP`);
      return;
    }

    setLoading(true);
    try {
      console.log("Resending OTP to:", email);
      
      const result = await apiService.resendOtp(email);
      console.log("Resend OTP result:", result);
      
      if (result.success) {
        setCountdown(30); // Start 30s countdown
        toast.success("Mã OTP đã được gửi lại!", {
          position: "top-right",
          duration: 5000,
        });
      } else {
        toast.error(result.message || "Không thể gửi lại mã OTP. Vui lòng thử lại sau.", {
          position: "top-right",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast.error("Không thể gửi lại mã OTP. Vui lòng thử lại sau.", {
        position: "top-right",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-900 via-teal-900 to-gray-800"
      style={{
        backgroundImage: `url("https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundBlendMode: "overlay",
      }}
    >
      {/* Animated Chart Lines */}
      <div className="absolute inset-0 z-0 opacity-20">
        <svg className="w-full h-full">
          <polyline
            points="0,120 300,80 600,130 900,70 1200,110"
            fill="none"
            stroke="#4ade80"
            strokeWidth="3"
            className="animate-[chartMove_5s_infinite_ease-in-out]"
          />
          <polyline
            points="0,140 350,100 650,150 950,90 1300,130"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2"
            className="animate-[chartMove_7s_infinite_ease-in-out]"
          />
        </svg>
      </div>

      {/* Particle Effect */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-teal-400/40 rounded-full animate-[float_5s_infinite_ease-in-out]"
            style={{
              width: `${Math.random() * 8 + 4}px`,
              height: `${Math.random() * 8 + 4}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gray-900/70 z-10 backdrop-blur-sm"></div>

      {/* Form Container */}
      <Card className="w-full max-w-md mx-4 p-8 bg-gray-800/90 text-white z-20 border border-teal-500/50 shadow-2xl rounded-2xl backdrop-blur-md transform transition-all hover:shadow-teal-500/20 ">
        <CardHeader className="flex flex-col items-center space-y-3">
          <div className="flex items-center">
            <img
              src={logo}
              alt="StockFlow"
              className="h-14 w-auto transition-transform duration-300 hover:scale-110"
            />
            <CardTitle className="text-3xl font-extrabold text-teal-400 tracking-tight">
              StockFlow
            </CardTitle>
          </div>
          <CardTitle className="text-xl font-semibold text-teal-300">
            Xác thực OTP
          </CardTitle>
          <CardDescription className="text-teal-400/90 text-center text-sm">
            {isPasswordReset ? "Nhập mã OTP để đặt lại mật khẩu:" : "Nhập mã OTP để xác thực tài khoản:"} <br />
            <span className="font-medium text-teal-200">{email}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center space-y-8">
          <div className="flex gap-3 justify-center">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-14 h-14 text-center text-white bg-gray-700/70 border-teal-500/60 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-xl font-semibold rounded-xl transition-all duration-300 hover:bg-gray-600/80 hover:scale-105 hover:shadow-teal-500/30"
              />
            ))}
          </div>

          <div className="flex flex-col w-full gap-4">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-xl shadow-lg transition-all duration-300 hover:shadow-teal-500/40 hover:-translate-y-1"
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
                "Xác nhận"
              )}
            </Button>
            
            <div className="flex gap-4">
              <Button
                onClick={handleResendOtp}
                disabled={loading || countdown > 0}
                variant="outline"
                className="flex-1 border-teal-500/50 text-teal-400 hover:bg-teal-500/10 font-semibold py-3 rounded-xl transition-all duration-300"
              >
                {countdown > 0 ? `Gửi lại (${countdown}s)` : "Gửi lại mã OTP"}
              </Button>
              
              <Button
                onClick={() => navigate(isPasswordReset ? "/forgot-password" : "/register")}
                disabled={loading}
                variant="outline"
                className="flex-1 border-gray-500/50 text-gray-400 hover:bg-gray-500/10 font-semibold py-3 rounded-xl transition-all duration-300"
              >
                Quay lại
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OtpPage;