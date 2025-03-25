import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { getUserId, saveUserId } from '@/api/Api'; // Import getUserId

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
          const userInfo = JSON.parse(savedUser);
          setIsAuthenticated(true);
          setUser(userInfo);
          
          // Đảm bảo rằng user_id cookie cũng được set bằng cách dùng saveUserId
          if (userInfo.id) {
            const currentUserId = getUserId();
            if (!currentUserId || currentUserId !== userInfo.id) {
              console.log("Fixing user_id inconsistency, setting to:", userInfo.id);
              saveUserId(userInfo.id);
            }
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Xóa dữ liệu không hợp lệ
        Cookies.remove(TOKEN_KEY);
        Cookies.remove('user_id');
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem('user_id_backup');
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
        
        // Xử lý tùy theo mã lỗi HTTP
        if (error.response.status === 400 || error.response.status === 401) {
          errorMessage = "Tài khoản hoặc mật khẩu không chính xác";
        } else if (error.response.status === 403) {
          errorMessage = "Tài khoản của bạn đã bị khóa hoặc chưa được kích hoạt";
        } else {
          // Lấy thông báo lỗi từ phản hồi API nếu có
          errorMessage = error.response.data?.message || 
                         error.response.data?.error || 
                         `Lỗi: ${error.response.statusText}`;
        }
      } else if (error.request) {
        // Không nhận được phản hồi
        errorMessage = "Không thể kết nối đến máy chủ, vui lòng thử lại sau";
      }
      
      return { success: false, message: errorMessage };
    }
  };

  // Hàm xử lý đăng nhập bằng Google
  const loginWithGoogle = async (code, state) => {
    try {
      console.log("Attempting Google login with code:", code);
      console.log("State parameter:", state);
      
      // Gọi API với code và state từ Google OAuth
      const url = `${API_URL}/api/OAuth/google-login?code=${encodeURIComponent(code)}`;
      const finalUrl = state ? `${url}&state=${encodeURIComponent(state)}` : url;
      
      const response = await axios.get(finalUrl);
      
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
      
      // Kiểm tra nếu có thông báo lỗi
      if (data.message && data.status && data.status >= 400) {
        console.error("Error in response:", data.message);
        return { 
          success: false, 
          message: data.message 
        };
      }
      
      // Nếu status là 200 và có dữ liệu người dùng, xem như thành công
      if (data.status === 200 && data.data) {
        console.log("Login successful, user data:", data.data);
        
        // Kiểm tra nếu token nằm trong data.data
        let token = null;
        let userData = data.data;
        
        if (userData.token) {
          token = userData.token;
          console.log("Found token in data.data:", token);
        } else if (data.token) {
          token = data.token;
          console.log("Found token directly in data:", token);
        } else if (userData.accessToken) {
          token = userData.accessToken;
          console.log("Found accessToken in data.data:", token);
        } else if (data.accessToken) {
          token = data.accessToken;
          console.log("Found accessToken in data:", token);
        }
        
        // Nếu không tìm thấy token, tạo một token tạm từ ID
        if (!token && userData.id) {
          token = `temp_token_${userData.id}`;
          console.warn("No token found, using temporary token based on user ID:", token);
        }
        
        // Lưu token vào cookie nếu có
        if (token) {
          Cookies.set(TOKEN_KEY, token, { expires: 7 });
        } else {
          console.warn("No token available for cookie storage");
        }
        
        // Đảm bảo các trường cần thiết
        const userInfo = {
          id: userData.id || userData._id || "",
          name: userData.name || userData.fullName || userData.username || "",
          email: userData.email || "",
          role: userData.roleName || userData.role || "user",
          phone: userData.phone || userData.phoneNumber || "",
          isVerified: userData.isVerified !== false, // Mặc định là true nếu không có
          isActive: userData.isActive !== false, // Mặc định là true nếu không có
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
      }
      
      // Nếu không có dữ liệu người dùng hoặc status không phải 200, xem như thất bại
      console.error("Invalid or incomplete user data:", data);
      return { 
        success: false, 
        message: data.message || "Không nhận được dữ liệu người dùng" 
      };
    } catch (error) {
      console.error("Google login error:", error);
      
      // Xử lý lỗi từ API
      let errorMessage = "Đăng nhập Google thất bại";
      
      if (error.response) {
        // Lỗi từ server với status code
        console.log("Error response:", error.response);
        
        try {
          // Kiểm tra xem có cấu trúc value không
          if (error.response.data && error.response.data.value) {
            // Cấu trúc: { value: { message: "...", status: 400, data: null } }
            const errorData = error.response.data.value;
            if (errorData.message) {
              errorMessage = errorData.message;
              return { success: false, message: errorMessage };
            }
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }
        
        // Xử lý tùy theo mã lỗi HTTP
        if (error.response.status === 400) {
          errorMessage = "Tài khoản chưa tồn tại, vui lòng đăng ký";
        } else if (error.response.status === 404) {
          errorMessage = "Tài khoản Google chưa được đăng ký";
        } else if (error.response.status === 403) {
          errorMessage = "Tài khoản của bạn đã bị khóa hoặc chưa được kích hoạt";
        } else {
          // Lấy thông báo lỗi từ phản hồi API nếu có
          errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Lỗi: ${error.response.statusText}`;
        }
      } else if (error.request) {
        // Không nhận được phản hồi
        errorMessage = "Không thể kết nối đến máy chủ, vui lòng thử lại sau";
      }
      
      return { success: false, message: errorMessage };
    }
  };

  // Hàm xử lý đăng ký bằng Google
  const registerWithGoogle = async (code, state) => {
    try {
      console.log("Attempting Google registration with code:", code);
      console.log("State parameter:", state);
      
      // Gọi API với code và state từ Google OAuth
      const url = `${API_URL}/api/OAuth/google-register?code=${encodeURIComponent(code)}`;
      const finalUrl = state ? `${url}&state=${encodeURIComponent(state)}` : url;
      
      const response = await axios.get(finalUrl);
      
      console.log("Google register API Response:", response);
      
      // Kiểm tra dữ liệu phản hồi
      if (!response || !response.data) {
        console.error("Invalid API response:", response);
        return { success: false, message: "Lỗi kết nối đến máy chủ" };
      }
      
      const responseData = response.data;
      console.log("Google register data:", responseData);
      
      // Xử lý cấu trúc dữ liệu lồng nhau
      let data = responseData;
      
      // Kiểm tra nếu dữ liệu nằm trong trường value
      if (responseData.value) {
        data = responseData.value;
        console.log("Extracted data from value:", data);
      }
      
      // Kiểm tra nếu có thông báo lỗi
      if (data.message && data.status && data.status >= 400) {
        console.error("Error in response:", data.message);
        return { 
          success: false, 
          message: data.message 
        };
      }
      
      // Nếu status là 200 và có dữ liệu người dùng, xem như thành công
      if (data.status === 200 && data.data) {
        console.log("Registration successful, user data:", data.data);
        
        // Kiểm tra nếu token nằm trong data.data
        let token = null;
        let userData = data.data;
        
        if (userData.token) {
          token = userData.token;
          console.log("Found token in data.data:", token);
        } else if (data.token) {
          token = data.token;
          console.log("Found token directly in data:", token);
        } else if (userData.accessToken) {
          token = userData.accessToken;
          console.log("Found accessToken in data.data:", token);
        } else if (data.accessToken) {
          token = data.accessToken;
          console.log("Found accessToken in data:", token);
        }
        
        // Nếu không tìm thấy token, tạo một token tạm từ ID
        if (!token && userData.id) {
          token = `temp_token_${userData.id}`;
          console.warn("No token found, using temporary token based on user ID:", token);
        }
        
        // Lưu token vào cookie nếu có
        if (token) {
          Cookies.set(TOKEN_KEY, token, { expires: 7 });
        } else {
          console.warn("No token available for cookie storage");
        }
        
        // Đảm bảo các trường cần thiết
        const userInfo = {
          id: userData.id || userData._id || "",
          name: userData.name || userData.fullName || userData.username || "",
          email: userData.email || "",
          role: userData.roleName || userData.role || "user",
          phone: userData.phone || userData.phoneNumber || "",
          isVerified: userData.isVerified !== false, // Mặc định là true nếu không có
          isActive: userData.isActive !== false, // Mặc định là true nếu không có
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
      }
      
      // Nếu không có dữ liệu người dùng hoặc status không phải 200, xem như thất bại
      console.error("Invalid or incomplete user data:", data);
      return { 
        success: false, 
        message: data.message || "Không nhận được dữ liệu người dùng" 
      };
    } catch (error) {
      console.error("Google registration error:", error);
      
      // Xử lý lỗi từ API
      let errorMessage = "Đăng ký Google thất bại";
      
      if (error.response) {
        // Lỗi từ server với status code
        console.log("Error response:", error.response);
        
        try {
          // Kiểm tra xem có cấu trúc value không
          if (error.response.data && error.response.data.value) {
            // Cấu trúc: { value: { message: "...", status: 400, data: null } }
            const errorData = error.response.data.value;
            if (errorData.message) {
              errorMessage = errorData.message;
              return { success: false, message: errorMessage };
            }
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }
        
        // Xử lý tùy theo mã lỗi HTTP
        if (error.response.status === 400) {
          errorMessage = "Dữ liệu đăng ký không hợp lệ";
        } else if (error.response.status === 409) {
          errorMessage = "Email Google này đã được đăng ký trước đó";
        } else if (error.response.status === 403) {
          errorMessage = "Tài khoản của bạn đã bị khóa";
        } else {
          // Lấy thông báo lỗi từ phản hồi API nếu có
          errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Lỗi: ${error.response.statusText}`;
        }
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
      Cookies.remove('user_id');
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
      
      // Xử lý lỗi từ API
      let errorMessage = "Đăng ký thất bại";
      
      if (error.response) {
        // Lỗi từ server với status code
        console.log("Error response:", error.response);
        
        // Xử lý tùy theo mã lỗi HTTP
        if (error.response.status === 400) {
          errorMessage = error.response.data?.message || "Thông tin đăng ký không hợp lệ";
        } else if (error.response.status === 409) {
          errorMessage = "Email này đã được sử dụng";
        } else {
          // Lấy thông báo lỗi từ phản hồi API nếu có
          errorMessage = error.response.data?.message || 
                        error.response.data?.error || 
                        "Đăng ký thất bại, vui lòng thử lại sau";
        }
      } else if (error.request) {
        // Không nhận được phản hồi
        errorMessage = "Không thể kết nối đến máy chủ, vui lòng thử lại sau";
      }
      
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
        
        // Xử lý tùy theo mã lỗi HTTP
        if (error.response.status === 400) {
          errorMessage = "Mật khẩu mới không hợp lệ";
        } else if (error.response.status === 404) {
          errorMessage = "Không tìm thấy tài khoản người dùng";
        } else if (error.response.status === 403) {
          errorMessage = "Bạn không có quyền thực hiện thao tác này";
        } else {
          // Lấy thông báo lỗi từ phản hồi API nếu có
          errorMessage = error.response.data?.message || 
                        error.response.data?.error || 
                        "Đổi mật khẩu thất bại, vui lòng thử lại sau";
        }
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
        registerWithGoogle,
        changePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);