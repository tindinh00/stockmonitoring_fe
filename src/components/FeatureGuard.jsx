import React, { useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import useFeatureStore from '../store/featureStore';
import { FREE_FEATURES } from '../store/featureStore';
import UnauthorizedFeatureMessage from './UnauthorizedFeatureMessage';

/**
 * FeatureGuard component - Bảo vệ routes dựa trên quyền truy cập tính năng
 * 
 * @param {Object} props
 * @param {String} props.requiredFeature - Tên tính năng cần thiết để truy cập route
 * @param {String} props.fallbackPath - Đường dẫn chuyển hướng nếu user không có quyền (mặc định: '/')
 * @param {React.ReactNode} props.children - Các component con được render nếu có quyền truy cập
 * @param {React.ReactNode} props.fallbackComponent - Component hiển thị thay vì chuyển hướng (tùy chọn)
 * @param {Boolean} props.alwaysRenderChildren - Luôn hiển thị children, không redirect ngay cả khi không có quyền
 * @returns {React.ReactNode}
 */
const FeatureGuard = ({ 
  requiredFeature, 
  fallbackPath = '/', 
  children, 
  fallbackComponent,
  alwaysRenderChildren = false
}) => {
  const location = useLocation();
  const [showUnauthorizedMessage, setShowUnauthorizedMessage] = useState(true);
  const { hasFeature } = useFeatureStore();

  // Debug log cho FeatureGuard
  console.log(`FeatureGuard check: requiredFeature=${requiredFeature}`);

  // Nếu không yêu cầu tính năng cụ thể, cho phép truy cập
  if (!requiredFeature) {
    console.log('No required feature specified, granting access');
    return <>{children}</>;
  }

  // Nếu là tính năng miễn phí trong FREE_FEATURES, cho phép truy cập 
  if (FREE_FEATURES.includes(requiredFeature)) {
    console.log(`"${requiredFeature}" is a free feature, granting access`);
    return <>{children}</>;
  }

  // Kiểm tra người dùng có tính năng cần thiết không
  const hasAccess = hasFeature(requiredFeature);
  console.log(`Access check for "${requiredFeature}": ${hasAccess}`);

  // Nếu người dùng có quyền truy cập, hiển thị children
  if (hasAccess) {
    return <>{children}</>;
  }

  // Nếu luôn hiển thị children, bỏ qua việc redirect hoặc hiển thị thông báo
  if (alwaysRenderChildren) {
    return <>{children}</>;
  }

  // Nếu có fallback component, hiển thị nó thay vì chuyển hướng
  if (fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  // Show unauthorized message if showUnauthorizedMessage is true
  if (showUnauthorizedMessage) {
    return (
      <UnauthorizedFeatureMessage 
        featureName={requiredFeature}
        returnPath={fallbackPath || '/'}
        onClose={() => setShowUnauthorizedMessage(false)}
        showUpgradeOption={true}
      />
    );
  }

  // Nếu không, chuyển hướng đến fallback path
  return <Navigate to={fallbackPath || '/'} state={{ from: location }} replace />;
};

export default FeatureGuard; 