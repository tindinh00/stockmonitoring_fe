import { useState } from "react";
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
import { Bell, Search, Menu, X, LogOut, User } from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuth } from "../Authentication/AuthContext";
import { toast } from "sonner"; // Import toast từ sonner

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isLoggedIn, user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Đăng xuất thành công!", {
        position: "top-right",
        duration: 3000,
      });
    } catch (error) {
      toast.error("Đăng xuất thất bại: " + error.message, {
        position: "top-right",
        duration: 3000,
      });
    }
  };

  console.log("Header render - isLoggedIn:", isLoggedIn, "user:", user); // Debug

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 w-full shadow-lg border-b border-[#15919B]"
      style={{ backgroundColor: "#213A51" }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <div className="flex items-center h-12 w-12">
              <img src={logo} className="h-12 w-12 object-contain" alt="StockFlow Logo" />
            </div>
            <a
              href="/"
              className="text-2xl font-extrabold"
              style={{
                background: "linear-gradient(to right, #80EE98, #0ABDB4)",
                WebkitBackgroundClip: "text",
                color: "transparent",
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
                href="/news"
                className="text-[#CFCFCF] hover:text-[#46DFB1] transition-colors duration-300 font-semibold text-sm uppercase tracking-wide"
              >
                Tin Tức
              </a>
              <span className="absolute bottom-[-4px] left-0 w-0 h-[2px] bg-[#46DFB1] group-hover:w-full transition-all duration-300 ease-in-out"></span>
            </div>
            <div className="relative group">
              <a
                href="/analysis"
                className="text-[#CFCFCF] hover:text-[#46DFB1] transition-colors duration-300 font-semibold text-sm uppercase tracking-wide"
              >
                Liên Hệ
              </a>
              <span className="absolute bottom-[-4px] left-0 w-0 h-[2px] bg-[#46DFB1] group-hover:w-full transition-all duration-300 ease-in-out"></span>
            </div>
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-[#15919B] transition-colors duration-200"
            >
              <Bell className="h-5 w-5 text-[#CFCFCF]" />
            </Button>

            {/* Desktop: Login State */}
            <div className="hidden md:flex space-x-3">
              {isLoggedIn && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Hồ sơ</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Đăng xuất</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <a href="/login">
                    <Button
                      variant="outline"
                      className="rounded-lg bg-[#213A51] border-[#46DFB1] text-[#46DFB1] hover:bg-[#46DFB1]/20 hover:text-[#80EE98] px-6 py-2 font-semibold transition-all duration-300"
                    >
                      Đăng Nhập
                    </Button>
                  </a>
                  <a href="/register">
                    <Button
                      className="rounded-lg bg-[#46DFB1] hover:bg-[#09D1C7] text-[#122132] hover:text-[#CFCFCF] px-6 py-2 font-semibold transition-all duration-300 shadow-md"
                    >
                      Đăng Ký
                    </Button>
                  </a>
                </>
              )}
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
                    href="/analysis"
                    className="text-[#CFCFCF] hover:text-[#46DFB1] transition-colors duration-200 font-semibold"
                  >
                    Liên Hệ
                  </a>
                  <span className="absolute bottom-[-4px] left-0 w-0 h-[2px] bg-[#46DFB1] group-hover:w-full transition-all duration-300 ease-in-out"></span>
                </div>
              </nav>

              {/* Mobile: Login State */}
              <div className="flex flex-col space-y-3">
                {isLoggedIn && user ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <Avatar>
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-[#CFCFCF] font-semibold">{user.name}</span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full rounded-lg text-[#46DFB1] hover:bg-[#46DFB1]/20 hover:text-[#80EE98] font-semibold transition-all duration-300"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Đăng Xuất
                    </Button>
                  </>
                ) : (
                  <>
                    <a href="/login">
                      <Button
                        variant="outline"
                        className="w-full rounded-lg text-[#46DFB1] hover:bg-[#46DFB1]/20 hover:text-[#80EE98] font-semibold transition-all duration-300"
                      >
                        Đăng Nhập
                      </Button>
                    </a>
                    <a href="/register">
                      <Button
                        className="w-full rounded-lg bg-[#46DFB1] hover:bg-[#09D1C7] text-[#CFCFCF] font-semibold transition-all duration-300 shadow-md"
                      >
                        Đăng Ký
                      </Button>
                    </a>
                  </>
                )}
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
      `}</style>
    </header>
  );
};

export default Header;