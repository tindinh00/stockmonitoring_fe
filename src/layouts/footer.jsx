import { Button } from "@/components/ui/button";
import { Facebook, Twitter, Instagram, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white w-full">
      <div className="w-full py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo & Description */}
            <div className="space-y-4">
              <a
                href="/"
                className="text-2xl font-extrabold bg-gradient-to-r from-green-500 to-blue-600 text-transparent bg-clip-text"
              >
                StockFlow
              </a>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                Cập nhật thông tin chứng khoán nhanh chóng, chính xác và đáng tin cậy.
              </p>
            </div>

            {/* Navigation Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Điều hướng</h3>
              <ul className="space-y-3">
                <li>
                  <a className="text-gray-400 hover:text-green-400 transition-colors text-sm">
                    Thị trường
                  </a>
                </li>
                <li>
                  <a className="text-gray-400 hover:text-green-400 transition-colors text-sm">
                    Danh mục
                  </a>
                </li>
                <li>
                  <a className="text-gray-400 hover:text-green-400 transition-colors text-sm">
                    Tin tức
                  </a>
                </li>
                <li>
                  <a className="text-gray-400 hover:text-green-400 transition-colors text-sm">
                    Phân tích
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white text-center md:text-left">Liên hệ</h3>
              <ul className="space-y-3 flex flex-col items-center md:items-start">
                <li className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-400 text-sm">stockmonitoring@gmail.com</span>
                </li>
                <li className="text-gray-400 text-sm">Hotline: 084-533-3577</li>
                <li className="text-gray-400 text-sm leading-relaxed text-center md:text-left">
                  Địa chỉ: 123 Đường Chứng Khoán, TP.HCM
                </li>
              </ul>
            </div>

            {/* Social Media & Newsletter */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white text-center md:text-left">Theo dõi chúng tôi</h3>
              <div className="flex space-x-4 justify-center md:justify-start">
                <a href="#" className="text-gray-400 hover:text-green-400 transition-colors">
                  <Facebook className="h-6 w-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-green-400 transition-colors">
                  <Twitter className="h-6 w-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-green-400 transition-colors">
                  <Instagram className="h-6 w-6" />
                </a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
            © {new Date().getFullYear()} StockHub. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;