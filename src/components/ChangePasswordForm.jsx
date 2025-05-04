import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/Authentication/AuthContext";
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react";

// Schema validation với Zod
const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường, một số và một ký tự đặc biệt"
      )
      .nonempty("Mật khẩu hiện tại là bắt buộc"),
    newPassword: z
      .string()
      .min(8, "Mật khẩu mới phải có ít nhất 8 ký tự")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường, một số và một ký tự đặc biệt"
      ),
    confirmPassword: z.string().nonempty("Xác nhận mật khẩu là bắt buộc"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

const ChangePasswordForm = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [changeSuccess, setChangeSuccess] = useState(false);
  const { user, changePassword } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const toggleShowCurrentPassword = () => setShowCurrentPassword(!showCurrentPassword);
  const toggleShowNewPassword = () => setShowNewPassword(!showNewPassword);
  const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  const onSubmit = async (data) => {
    if (!user || !user.id) {
      toast.error("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.", {
        position: "top-right",
        duration: 5000,
      });
      return;
    }

    setLoading(true);
    try {
      // Trong thực tế, bạn cần xác thực mật khẩu hiện tại trước khi đổi mật khẩu
      // Đây là một ví dụ đơn giản, bạn có thể cần thêm API để xác thực mật khẩu hiện tại
      
      const result = await changePassword(user.id, data.currentPassword, data.newPassword);
      
      if (result.success) {
        setChangeSuccess(true);
        reset();
        
        // Đảm bảo message hiển thị bằng tiếng Việt
        let successMessage = result.message || "Đổi mật khẩu thành công!";
        if (successMessage === "Change password sucessfully" || 
            successMessage === "Change password successfully") {
          successMessage = "Đổi mật khẩu thành công!";
        }
        
        toast.success(successMessage, {
          position: "top-right",
          duration: 3000,
        });
        
        // Reset form sau khi đổi mật khẩu thành công
        setTimeout(() => {
          setChangeSuccess(false);
        }, 3000);
      } else {
        toast.error(result.message || "Không thể đổi mật khẩu. Vui lòng thử lại sau.", {
          position: "top-right",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Change password error:", error);
      const errorMsg = error.message || "Không thể đổi mật khẩu. Vui lòng thử lại sau.";
      toast.error(errorMsg, {
        position: "top-right",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full bg-gray-900/95 text-teal-400 border border-teal-500/40 shadow-lg rounded-xl">
      <CardHeader className="mb-2">
        <CardTitle className="text-2xl font-bold text-teal-400">
          Đổi mật khẩu
        </CardTitle>
        <CardDescription className="text-teal-400/80 text-base">
          Cập nhật mật khẩu của bạn để bảo mật tài khoản
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!changeSuccess ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Current Password Input */}
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-teal-400" />
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu hiện tại"
                  {...register("currentPassword")}
                  disabled={loading}
                  className={`pl-10 pr-10 bg-gray-800 border-teal-500/40 text-teal-400 placeholder-teal-400/60 focus:ring-2 focus:ring-teal-500 transition-all ${errors.currentPassword ? "border-red-500" : ""}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={toggleShowCurrentPassword}
                  disabled={loading}
                  tabIndex="-1"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-teal-400 hover:text-teal-300 p-1"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </Button>
              </div>
              {errors.currentPassword && (
                <p className="text-red-400 text-sm mt-1 pl-2">
                  {errors.currentPassword.message}
                </p>
              )}
            </div>

            {/* New Password Input */}
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-teal-400" />
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu mới"
                  {...register("newPassword")}
                  disabled={loading}
                  className={`pl-10 pr-10 bg-gray-800 border-teal-500/40 text-teal-400 placeholder-teal-400/60 focus:ring-2 focus:ring-teal-500 transition-all ${errors.newPassword ? "border-red-500" : ""}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={toggleShowNewPassword}
                  disabled={loading}
                  tabIndex="-1"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-teal-400 hover:text-teal-300 p-1"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </Button>
              </div>
              {errors.newPassword && (
                <p className="text-red-400 text-sm mt-1 pl-2">
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-teal-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Xác nhận mật khẩu mới"
                  {...register("confirmPassword")}
                  disabled={loading}
                  className={`pl-10 pr-10 bg-gray-800 border-teal-500/40 text-teal-400 placeholder-teal-400/60 focus:ring-2 focus:ring-teal-500 transition-all ${errors.confirmPassword ? "border-red-500" : ""}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={toggleShowConfirmPassword}
                  disabled={loading}
                  tabIndex="-1"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-teal-400 hover:text-teal-300 p-1"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1 pl-2">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2.5 rounded-lg shadow-md transition-all"
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
                "Đổi mật khẩu"
              )}
            </Button>
          </form>
        ) : (
          <div className="flex flex-col items-center space-y-4 py-4">
            <div className="bg-teal-500/20 p-4 rounded-full">
              <CheckCircle className="h-8 w-8 text-teal-400" />
            </div>
            <p className="text-center text-teal-400/90">
              Mật khẩu của bạn đã được cập nhật thành công!
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-center pt-4 text-sm text-teal-400/70">
        <p>
          Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
        </p>
      </CardFooter>
    </Card>
  );
};

export default ChangePasswordForm; 