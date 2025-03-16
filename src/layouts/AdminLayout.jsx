import { NavLink, Outlet } from "react-router-dom";
import { Package, Users } from "lucide-react";

export default function AdminLayout() {
  const menuItems = [
    {
      title: "Quản lý gói dịch vụ",
      icon: Package,
      path: "/admin/packages",
    },
    {
      title: "Quản lý người dùng",
      icon: Users,
      path: "/admin/users",
    },
  ];

  return (
    <div className="flex h-screen">
      

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
} 