import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { CreditCard, Check } from 'lucide-react';

/**
 * Component to display when a user tries to access a feature they don't have permission for
 * 
 * @param {Object} props
 * @param {String} props.featureName - Name of the feature being accessed
 * @param {String} props.returnPath - Path to return to (default: '/')
 * @param {Boolean} props.showUpgradeOption - Whether to show the upgrade package option (default: true)
 * @param {Function} props.onClose - Optional callback function to close the message
 * @returns {React.ReactNode}
 */
const UnauthorizedFeatureMessage = ({ 
  featureName = "tính năng này",
  returnPath = "/",
  showUpgradeOption = true,
  onClose
}) => {
  const navigate = useNavigate();

  // Sửa lại logic xử lý sự kiện click nút Quay lại
  const handleReturn = (e) => {
    e.preventDefault(); // Ngăn chặn sự kiện mặc định
    
    if (onClose) {
      // Đóng modal
      onClose();
    }
  };

  // Path to workspace_premium.svg in public folder
  const premiumIconPath = "/icons/workspace_premium.svg";

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-gray-900/80">
      <div className="max-w-md w-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center">
            <div className="p-3 flex items-center justify-center mb-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center bg-gray-700/30 shadow-[0_0_25px_rgba(9,209,199,0.8)]">
                <img src={premiumIconPath} alt="Premium" className="w-12 h-12" />
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-white mb-3">
            Tính năng cao cấp
          </h2>
          
          <div className="bg-gray-700/20 rounded-lg p-4 mb-6">
            <p className="text-center text-gray-300">
              <span className="text-[#09D1C7] font-semibold">{featureName}</span> là tính năng của gói nâng cao
            </p>
            <p className="text-center text-gray-300 mt-2">
              Vui lòng nâng cấp gói để sử dụng dịch vụ này
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-300">
              <div className="w-5 h-5 rounded-full bg-[#09D1C7] flex items-center justify-center shadow-[0_0_10px_rgba(9,209,199,0.8)]">
                <Check size={12} className="text-white" strokeWidth={3} />
              </div>
              <span>Theo dõi thị trường theo thời gian thực</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <div className="w-5 h-5 rounded-full bg-[#09D1C7] flex items-center justify-center shadow-[0_0_10px_rgba(9,209,199,0.8)]">
                <Check size={12} className="text-white" strokeWidth={3} />
              </div>
              <span>Phân tích dữ liệu nâng cao</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <div className="w-5 h-5 rounded-full bg-[#09D1C7] flex items-center justify-center shadow-[0_0_10px_rgba(9,209,199,0.8)]">
                <Check size={12} className="text-white" strokeWidth={3} />
              </div>
              <span>Không giới hạn thông báo theo dõi</span>
            </div>
          </div>
          
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            {showUpgradeOption && (
              <Button
                asChild
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#09D1C7] to-[#0a8f88] hover:from-[#0bbfb6] hover:to-[#09a29b] text-white py-3 rounded-lg shadow-lg"
              >
                <Link to="/upgrade-package">
                  <CreditCard className="h-4 w-4" />
                  <span>Nâng cấp ngay</span>
                </Link>
              </Button>
            )}
            
            <Button
              onClick={handleReturn}
              variant="outline"
              className="flex-1 flex items-center justify-center gap-2 bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-700 py-3 rounded-lg"
            >
              <span>Quay lại</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedFeatureMessage; 