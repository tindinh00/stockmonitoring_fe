import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiService } from "../api/Api";
import logo from "../assets/logo.png";

const OtpPage = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    const registerEmail = localStorage.getItem("registerEmail");
    if (!registerEmail) {
      navigate("/RegisterPages");
      return;
    }
    setEmail(registerEmail);
  }, [navigate]);

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
        autoClose: 5000,
        theme: "dark",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.verifyOtp(email, otpValue);

      if (response.success) {
        localStorage.removeItem("registerEmail");
        toast.success("Xác thực email thành công!", {
          position: "top-right",
          autoClose: 2000,
          theme: "dark",
        });
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        toast.error(response.message || "Mã OTP không chính xác!", {
          position: "top-right",
          autoClose: 5000,
          theme: "dark",
        });
      }
    } catch (error) {
      console.error("OTP verification failed:", error);
      const errorMessage =
        error.message || error.response?.data?.message || "Xác thực OTP thất bại!";
      toast.error(errorMessage, {
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

      {/* Toast Container */}
      <ToastContainer />

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
            Nhập mã OTP 6 số từ email: <br />
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

          <div className="flex gap-4 w-full max-w-sm">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-xl shadow-lg transition-all duration-300 hover:shadow-teal-500/40 hover:-translate-y-1"
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
            <Button
              onClick={() => navigate("/register")}
              disabled={loading}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all duration-300 hover:shadow-gray-500/40 hover:-translate-y-1"
            >
              Hủy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OtpPage;