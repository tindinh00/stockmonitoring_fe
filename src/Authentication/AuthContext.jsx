import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";

const API_URL = "https://stockmonitoring.onrender.com";
const TOKEN_KEY = "auth_token";
const USER_KEY = "user_data";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Khởi tạo trạng thái từ localStorage hoặc cookies
  useEffect(() => {
    const initAuth = () => {
      try {
        const token = Cookies.get(TOKEN_KEY);
        const savedUser = localStorage.getItem(USER_KEY);
        
        if (token && savedUser) {
          setIsAuthenticated(true);
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Xóa dữ liệu không hợp lệ
        Cookies.remove(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      console.log(`Attempting login with email: ${email}`);
      
      const response = await axios.post(`${API_URL}/api/users/login`, {
        email,
        password,
      });
      
      console.log("API Response:", response);
      
      // Kiểm tra dữ liệu phản hồi
      if (!response || !response.data) {
        console.error("Invalid API response:", response);
        return { success: false, message: "Lỗi kết nối đến máy chủ" };
      }
      
      const responseData = response.data;
      console.log("Login data:", responseData);
      
      // Xử lý cấu trúc dữ liệu lồng nhau
      let data = responseData;
      
      // Kiểm tra nếu dữ liệu nằm trong trường value
      if (responseData.value) {
        data = responseData.value;
        console.log("Extracted data from value:", data);
      }
      
      // Kiểm tra nếu token nằm trong data.data
      let token = null;
      let userData = null;
      
      if (data.data && data.data.token) {
        token = data.data.token;
        userData = data.data;
        console.log("Found token in data.data:", token);
      } else if (data.token) {
        token = data.token;
        userData = data;
        console.log("Found token directly in data:", token);
      }
      
      // Kiểm tra token
      if (!token) {
        console.error("No token in response:", responseData);
        return { 
          success: false, 
          message: data.message || "Không nhận được token xác thực" 
        };
      }
      
      // Lưu token vào cookie
      Cookies.set(TOKEN_KEY, token, { expires: 7 });
      
      // Đảm bảo các trường cần thiết
      const userInfo = {
        id: userData.id || userData._id || "",
        name: userData.name || userData.fullName || userData.username || "",
        email: userData.email || email,
        role: userData.roleName || userData.role || "user",
        phone: userData.phone || userData.phoneNumber || "",
        isVerified: userData.isVerified || false,
        isActive: userData.isActive !== false, // Mặc định là true nếu không có
        isOAuth: userData.isOAuth || false,
        avatar: userData.avatar || userData.profilePicture || "",
        tier: userData.tier || "Free"
      };
      
      console.log("Processed user data:", userInfo);
      
      // Lưu thông tin người dùng
      localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
      setUser(userInfo);
      setIsAuthenticated(true);
      
      return { success: true, user: userInfo };
    } catch (error) {
      console.error("Login error:", error);
      
      // Xử lý lỗi từ API
      let errorMessage = "Đăng nhập thất bại";
      
      if (error.response) {
        // Lỗi từ server với status code
        console.log("Error response:", error.response);
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Lỗi ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        // Không nhận được phản hồi
        errorMessage = "Không thể kết nối đến máy chủ, vui lòng thử lại sau";
      }
      
      return { success: false, message: errorMessage };
    }
  };

  // Hàm xử lý đăng nhập bằng Google
  const loginWithGoogle = async (code) => {
    try {
      console.log("Attempting Google login with code:", code);
      
      const response = await axios.get(`${API_URL}/api/OAuth/google-login?code=${code}`);
      
      console.log("Google login API Response:", response);
      
      // Kiểm tra dữ liệu phản hồi
      if (!response || !response.data) {
        console.error("Invalid API response:", response);
        return { success: false, message: "Lỗi kết nối đến máy chủ" };
      }
      
      const responseData = response.data;
      console.log("Google login data:", responseData);
      
      // Xử lý cấu trúc dữ liệu lồng nhau
      let data = responseData;
      
      // Kiểm tra nếu dữ liệu nằm trong trường value
      if (responseData.value) {
        data = responseData.value;
        console.log("Extracted data from value:", data);
      }
      
      // Kiểm tra nếu token nằm trong data.data
      let token = null;
      let userData = null;
      
      if (data.data && data.data.token) {
        token = data.data.token;
        userData = data.data;
        console.log("Found token in data.data:", token);
      } else if (data.token) {
        token = data.token;
        userData = data;
        console.log("Found token directly in data:", token);
      }
      
      // Kiểm tra token
      if (!token) {
        console.error("No token in response:", responseData);
        return { 
          success: false, 
          message: data.message || "Không nhận được token xác thực" 
        };
      }
      
      // Lưu token vào cookie
      Cookies.set(TOKEN_KEY, token, { expires: 7 });
      
      // Đảm bảo các trường cần thiết
      const userInfo = {
        id: userData.id || userData._id || "",
        name: userData.name || userData.fullName || userData.username || "",
        email: userData.email || "",
        role: userData.roleName || userData.role || "user",
        phone: userData.phone || userData.phoneNumber || "",
        isVerified: true, // Người dùng Google đã được xác thực
        isActive: true,
        isOAuth: true, // Đánh dấu là đăng nhập bằng OAuth
        avatar: userData.avatar || userData.profilePicture || "",
        tier: userData.tier || "Free"
      };
      
      console.log("Processed Google user data:", userInfo);
      
      // Lưu thông tin người dùng
      localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
      setUser(userInfo);
      setIsAuthenticated(true);
      
      return { success: true, user: userInfo };
    } catch (error) {
      console.error("Google login error:", error);
      
      // Xử lý lỗi từ API
      let errorMessage = "Đăng nhập Google thất bại";
      
      if (error.response) {
        // Lỗi từ server với status code
        console.log("Error response:", error.response);
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Lỗi ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        // Không nhận được phản hồi
        errorMessage = "Không thể kết nối đến máy chủ, vui lòng thử lại sau";
      }
      
      return { success: false, message: errorMessage };
    }
  };

  const logout = async () => {
    try {
      // Gọi API logout nếu cần
      // await axios.post(`${API_URL}/auth/logout`);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Luôn xóa dữ liệu cục bộ
      Cookies.remove(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/api/users/register`, userData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = error.response?.data?.message || "Đăng ký thất bại";
      return { success: false, message: errorMessage };
    }
  };

  // Hàm đổi mật khẩu
  const changePassword = async (userId, newPassword) => {
    try {
      console.log(`Attempting to change password for user ID: ${userId}`);
      
      const response = await axios.post(`${API_URL}/api/users/change-password`, {
        id: userId,
        password: newPassword
      });
      
      console.log("Change password API Response:", response);
      
      // Kiểm tra dữ liệu phản hồi
      if (!response || !response.data) {
        console.error("Invalid API response:", response);
        return { success: false, message: "Lỗi kết nối đến máy chủ" };
      }
      
      const responseData = response.data;
      console.log("Change password data:", responseData);
      
      // Xử lý cấu trúc dữ liệu lồng nhau
      let data = responseData;
      
      // Kiểm tra nếu dữ liệu nằm trong trường value
      if (responseData.value) {
        data = responseData.value;
        console.log("Extracted data from value:", data);
      }
      
      // Kiểm tra thông báo thành công
      const successMessage = data.message || "Đổi mật khẩu thành công";
      
      return { success: true, message: successMessage };
    } catch (error) {
      console.error("Change password error:", error);
      
      // Xử lý lỗi từ API
      let errorMessage = "Đổi mật khẩu thất bại";
      
      if (error.response) {
        // Lỗi từ server với status code
        console.log("Error response:", error.response);
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Lỗi ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        // Không nhận được phản hồi
        errorMessage = "Không thể kết nối đến máy chủ, vui lòng thử lại sau";
      }
      
      return { success: false, message: errorMessage };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        login,
        loginWithGoogle,
        logout,
        register,
        changePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);