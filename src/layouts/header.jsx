import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Menu, X, LogOut, User, Crown } from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuth } from "../Authentication/AuthContext";
import { toast } from "sonner"; // Import toast từ sonner
import { motion } from "framer-motion";

const Header = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Đăng xuất thành công!", {
        position: "top-right",
        duration: 3000,
      });
    } catch (error) {
      toast.error("Đăng xuất thất bại: " + (error.message || "Lỗi không xác định"), {
        position: "top-right",
        duration: 3000,
      });
    }
  };

  const handleNavigateToProfile = () => {
    navigate('/profile');
  };

  // Xác định màu sắc và nội dung của badge dựa trên role và tier
  const getBadgeForRole = () => {
    if (!user) return null;
    
    // Ưu tiên hiển thị theo tier nếu có
    if (user.tier && user.tier.toLowerCase() === "premium") {
      return {
        color: "bg-amber-500 hover:bg-amber-600",
        icon: <Crown className="h-3 w-3 mr-1" />,
        text: "Premium"
      };
    }
    
    // Nếu không có tier Premium, kiểm tra role
    if (user.role) {
      if (user.role.toLowerCase() === "admin") {
        return {
          color: "bg-red-500 hover:bg-red-600",
          icon: <Crown className="h-3 w-3 mr-1" />,
          text: "Admin"
        };
      } else if (user.role.toLowerCase() === "manager") {
        return {
          color: "bg-blue-500 hover:bg-blue-600",
          icon: <Crown className="h-3 w-3 mr-1" />,
          text: "Manager"
        };
      }
    }
    
    // Mặc định là Free
    return {
      color: "bg-slate-500 hover:bg-slate-600",
      icon: null,
      text: "Free"
    };
  };

  const roleBadge = getBadgeForRole();

  console.log("Header render - isAuthenticated:", isAuthenticated, "user:", user); // Debug

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 w-full shadow-lg border-b border-[#15919B]"
      style={{ backgroundColor: "#213A51" }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center" style={{ height: '100%' }}>
            <div className="flex items-center justify-center ml-6">
              <img 
                src={logo} 
                className="h-14 w-14 object-contain" 
                alt="StockFlow Logo" 
                style={{ 
                  display: 'block',
                  transform: 'translateY(2px)' /* Fine-tune vertical alignment */
                }}
              />
            </div>
            <a
              href="/"
              className="text-2xl font-extrabold flex items-center -ml-2"
              style={{
                background: "linear-gradient(to right, #80EE98, #0ABDB4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              StockFlow
            </a>
          </div>

          {/* Navigation (Desktop) */}
          <nav className="hidden md:flex space-x-10">
            <div className="relative group">
              <a
                href="/"
                className="text-[#CFCFCF] hover:text-[#46DFB1] transition-colors duration-300 font-semibold text-sm uppercase tracking-wide"
              >
                Trang Chủ
              </a>
              <span className="absolute bottom-[-4px] left-0 w-0 h-[2px] bg-[#46DFB1] group-hover:w-full transition-all duration-300 ease-in-out"></span>
            </div>
            <div className="relative group">
              <a
                href="/education"
                className="text-[#CFCFCF] hover:text-[#46DFB1] transition-colors duration-300 font-semibold text-sm uppercase tracking-wide"
              >
                Về Chúng Tôi
              </a>
              <span className="absolute bottom-[-4px] left-0 w-0 h-[2px] bg-[#46DFB1] group-hover:w-full transition-all duration-300 ease-in-out"></span>
            </div>
            <div className="relative group">
              <a
                href="/header-news"
                className="text-[#CFCFCF] hover:text-[#46DFB1] transition-colors duration-300 font-semibold text-sm uppercase tracking-wide"
              >
                Tin Tức
              </a>
              <span className="absolute bottom-[-4px] left-0 w-0 h-[2px] bg-[#46DFB1] group-hover:w-full transition-all duration-300 ease-in-out"></span>
            </div>
            <div className="relative group">
              <a
                href="/contact"
                className="text-[#CFCFCF] hover:text-[#46DFB1] transition-colors duration-300 font-semibold text-sm uppercase tracking-wide"
              >
                Liên Hệ
              </a>
              <span className="absolute bottom-[-4px] left-0 w-0 h-[2px] bg-[#46DFB1] group-hover:w-full transition-all duration-300 ease-in-out"></span>
            </div>
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Desktop: Buy Button */}
            <div className="hidden md:flex space-x-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <a href="/upgrade-package">
                  <Button
                    className="rounded-lg relative overflow-hidden
                      bg-gradient-to-r from-[#46DFB1] to-[#09D1C7]
                      hover:from-[#09D1C7] hover:to-[#46DFB1]
                      text-white font-bold
                      px-8 py-2
                      transition-all duration-300 
                      shadow-[0_0_20px_rgba(70,223,177,0.3)]
                      hover:shadow-[0_0_25px_rgba(70,223,177,0.5)]"
                  >
                    Mua Ngay
                    {/* Pulse effect */}
                    <motion.div
                      className="absolute -inset-1 bg-gradient-to-r from-[#46DFB1] to-[#09D1C7] opacity-30 rounded-lg blur-lg"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </Button>
                </a>
              </motion.div>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="hover:bg-[#15919B] transition-colors duration-200"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6 text-[#CFCFCF]" />
                ) : (
                  <Menu className="h-6 w-6 text-[#CFCFCF]" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Colored Bar */}
        <div
          className="w-full h-[2px] absolute bottom-0 left-0"
          style={{
            background: "linear-gradient(to right, #80EE98, #46DFB1, #09D1C7, #0ABDB4, #15919B)",
            backgroundSize: "200% 100%",
            animation: "colorSlide 5s linear infinite",
          }}
        ></div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            className="md:hidden py-6 w-full absolute left-0 border-t border-[#15919B]"
            style={{ backgroundColor: "#0C6478" }}
          >
            <div className="px-6 space-y-6">
              <nav className="flex flex-col space-y-4">
                <div className="relative group">
                  <a
                    href="/market"
                    className="text-[#CFCFCF] hover:text-[#46DFB1] transition-colors duration-200 font-semibold"
                  >
                    Trang Chủ
                  </a>
                  <span className="absolute bottom-[-4px] left-0 w-0 h-[2px] bg-[#46DFB1] group-hover:w-full transition-all duration-300 ease-in-out"></span>
                </div>
                <div className="relative group">
                  <a
                    href="/portfolio"
                    className="text-[#CFCFCF] hover:text-[#46DFB1] transition-colors duration-200 font-semibold"
                  >
                    Về Chúng Tôi
                  </a>
                  <span className="absolute bottom-[-4px] left-0 w-0 h-[2px] bg-[#46DFB1] group-hover:w-full transition-all duration-300 ease-in-out"></span>
                </div>
                <div className="relative group">
                  <a
                    href="/news"
                    className="text-[#CFCFCF] hover:text-[#46DFB1] transition-colors duration-200 font-semibold"
                  >
                    Tin Tức
                  </a>
                  <span className="absolute bottom-[-4px] left-0 w-0 h-[2px] bg-[#46DFB1] group-hover:w-full transition-all duration-300 ease-in-out"></span>
                </div>
                <div className="relative group">
                  <a
                    href="/contact"
                    className="text-[#CFCFCF] hover:text-[#46DFB1] transition-colors duration-200 font-semibold"
                  >
                    Liên Hệ
                  </a>
                  <span className="absolute bottom-[-4px] left-0 w-0 h-[2px] bg-[#46DFB1] group-hover:w-full transition-all duration-300 ease-in-out"></span>
                </div>
              </nav>

              {/* Mobile: Buy Button */}
              <div className="flex flex-col space-y-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <a href="/upgrade-package">
                    <Button
                      className="w-full rounded-lg relative overflow-hidden
                        bg-gradient-to-r from-[#46DFB1] to-[#09D1C7]
                        hover:from-[#09D1C7] hover:to-[#46DFB1]
                        text-white font-bold
                        py-2
                        transition-all duration-300 
                        shadow-[0_0_20px_rgba(70,223,177,0.3)]
                        hover:shadow-[0_0_25px_rgba(70,223,177,0.5)]"
                    >
                      Mua Ngay
                      {/* Pulse effect */}
                      <motion.div
                        className="absolute -inset-1 bg-gradient-to-r from-[#46DFB1] to-[#09D1C7] opacity-30 rounded-lg blur-lg"
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    </Button>
                  </a>
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes colorSlide {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 200% 0%;
          }
        }

        @keyframes shine {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }

        .shine-effect::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            120deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          animation: shine 2s infinite linear;
        }
      `}</style>
    </header>
  );
};

export default Header;