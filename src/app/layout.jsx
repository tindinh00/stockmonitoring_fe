import { Routes, Route } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import PackageManagementPage from "@/pages/admin/PackageManagementPage";
import UserManagementPage from "@/pages/admin/UserManagementPage";
import { Toaster } from "sonner";
import "sonner/dist/styles.css";

export default function App() {
  return (
    <>
      <Routes>
        {/* Admin routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="packages" element={<PackageManagementPage />} />
          <Route path="users" element={<UserManagementPage />} />
        </Route>
      </Routes>
      <Toaster richColors position="top-right" />
    </>
  );
} 