import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

// Component ProtectedRoute để kiểm tra quyền truy cập
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // In ra logs để kiểm tra
  console.log('Protected Route Check:');
  console.log('Path:', location.pathname);
  console.log('Is Authenticated:', isAuthenticated);
  console.log('User:', user?.role);
  console.log('Allowed Roles:', allowedRoles);

  // Nếu đang loading, hiện loading thay vì redirect
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a14] text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#09D1C7] mx-auto"></div>
          <p className="mt-4">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Kiểm tra xem người dùng đã đăng nhập chưa
  if (!isAuthenticated) {
    // Lưu URL hiện tại để sau khi đăng nhập sẽ chuyển hướng lại
    toast.error('Vui lòng đăng nhập để tiếp tục');
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Nếu không yêu cầu role cụ thể hoặc array rỗng, cho phép truy cập
  if (!allowedRoles || allowedRoles.length === 0) {
    return children;
  }

  // Kiểm tra xem người dùng có quyền truy cập không
  const userRole = user?.role?.toLowerCase() || 'user';
  
  if (!allowedRoles.map(role => role.toLowerCase()).includes(userRole)) {
    toast.error('Bạn không có quyền truy cập trang này');
    console.error(`Access denied: User role (${userRole}) not in allowed roles:`, allowedRoles);
    
    // Chuyển hướng dựa vào role
    const roleRedirectMap = {
      'admin': '/admin/dashboard',
      'manager': '/manager/knowledge',
      'staff': '/staff/chat',
      'user': '/'
    };
    
    const redirectPath = roleRedirectMap[userRole] || '/';
    return <Navigate to={redirectPath} replace />;
  }

  // Người dùng đã đăng nhập và có quyền, hiển thị children
  return children;
};

export default ProtectedRoute; 