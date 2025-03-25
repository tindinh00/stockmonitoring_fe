import axios from "axios";
import Cookies from "js-cookie"; // Import js-cookie
import { HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr';

// Base URL cho API
const BASE_URL = "https://stockmonitoring.onrender.com";

// Tạo Basic Auth token cho Swagger
const username = "admin";
const password = "password@123";
const basicAuthToken = btoa(`${username}:${password}`);

// Tạo axios instance với cấu hình chung
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": `Basic ${basicAuthToken}`,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
  },
});

// Kiểm tra khả năng lưu trữ cookie
export const checkCookieCompatibility = () => {
  try {
    // Thử set một cookie test
    const testValue = 'test_' + Date.now();
    Cookies.set('cookie_test', testValue, { path: '/' });
    
    // Kiểm tra xem cookie có được set thành công không
    const retrievedValue = Cookies.get('cookie_test');
    
    // Xóa cookie test
    Cookies.remove('cookie_test', { path: '/' });
    
    const compatible = retrievedValue === testValue;
    console.log("Cookie compatibility check:", compatible ? "Compatible" : "Not compatible");
    return compatible;
  } catch (error) {
    console.error("Cookie compatibility check error:", error);
    return false;
  }
};

// Hàm để lưu user ID vào cả cookie và localStorage
export const saveUserId = (userId) => {
  try {
    // Luôn cố gắng lưu vào cookie
    Cookies.set("user_id", userId, { path: '/' });
    
    // Lưu vào localStorage như một phương án dự phòng
    localStorage.setItem('user_id_backup', userId);
    
    console.log("User ID saved to both cookie and localStorage:", userId);
    return true;
  } catch (error) {
    console.error("Error saving user ID:", error);
    return false;
  }
};

// Hàm để lấy user ID từ cookie hoặc localStorage
export const getUserId = () => {
  try {
    // Cố gắng lấy từ cookie trước
    const userIdFromCookie = Cookies.get("user_id");
    
    if (userIdFromCookie) {
      return userIdFromCookie;
    }
    
    // Nếu không có trong cookie, thử lấy từ localStorage
    const userIdFromStorage = localStorage.getItem('user_id_backup');
    
    if (userIdFromStorage) {
      console.log("Using user ID from localStorage fallback");
      // Thử set lại cookie
      Cookies.set("user_id", userIdFromStorage, { path: '/' });
    }
    
    return userIdFromStorage;
  } catch (error) {
    console.error("Error getting user ID:", error);
    return null;
  }
};

// Thêm biến để theo dõi trạng thái refresh token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("auth_token"); // Lấy token từ cookie
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log("Interceptor - Using Basic Auth"); // Debug
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi không phải 401 hoặc request đã được thử refresh
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Nếu đang refresh token, thêm request vào hàng đợi
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch(err => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    // Lấy refresh token từ cookie
    const refreshToken = Cookies.get("refresh_token");
    if (!refreshToken) {
      processQueue(new Error("No refresh token"));
      return Promise.reject(new Error("Không có refresh token"));
    }

    try {
      const response = await apiService.refreshToken(refreshToken);
      const { token } = response;

      // Lưu token mới
      Cookies.set("auth_token", token);
      Cookies.set("refresh_token", response.data.value.refreshToken, { expires: 30 }); // Refresh token có thời hạn dài hơn
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Xử lý hàng đợi với token mới
      processQueue(null, token);

      // Thực hiện lại request ban đầu với token mới
      originalRequest.headers['Authorization'] = `Bearer ${token}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Xóa cả access token và refresh token
      Cookies.remove("auth_token");
      Cookies.remove("refresh_token");
      delete api.defaults.headers.common["Authorization"];
      console.log("Tokens removed from cookies");
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// Tạo một service cho các yêu cầu API
export const apiService = {
  // Lấy danh sách người dùng từ API (Yêu cầu quyền Admin)
  getUsers: async () => {
    try {
      // Lấy token từ cookie
      const token = Cookies.get("auth_token");
      
      if (!token) {
        console.error("No authentication token found. Admin access required.");
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập với tài khoản Admin.");
      }
      
      // Gửi request - không cần thêm headers vì interceptor đã thêm token
      const response = await api.get("/api/users");
      console.log("Get users response:", response.data);
      
      // Kiểm tra cấu trúc dữ liệu phản hồi
      if (response.data && response.data.value) {
        return response.data.value.data || [];
      }
      
      return response.data.data || [];
    } catch (error) {
      console.error("Get users error:", error);
      
      // Kiểm tra lỗi 401 (Unauthorized) hoặc 403 (Forbidden)
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Chỉ Admin mới có thể xem danh sách người dùng.");
      }
      
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật role của người dùng
  updateUserRole: async (userId, newRole) => {
    try {
      // Lấy token từ cookie
      const token = Cookies.get("auth_token");
      
      if (!token) {
        console.error("No authentication token found. Admin access required.");
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập với tài khoản Admin.");
      }

      // Xác định endpoint dựa trên role mới
      let endpoint;
      if (newRole === "manager") {
        endpoint = `/api/users/make-manager?userId=${userId}`;
      } else if (newRole === "staff") {
        endpoint = `/api/users/make-staff?userId=${userId}`;
      } else if (newRole === "admin") {
        endpoint = `/api/users/make-admin?userId=${userId}`;
      } else {
        throw new Error("Role không hợp lệ. Chỉ hỗ trợ admin, manager hoặc staff.");
      }
      
      // Debug logs
      console.log("Making API call to:", endpoint);
      console.log("Using token:", token.substring(0, 10) + "...");
      
      // Tạo config với header Authorization
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': '*/*'
        }
      };
      
      // Gửi request PUT
      const response = await api.put(endpoint, null, config);
      
      console.log("Update user role response:", response.data);
      
      if (response.data) {
        return response.data;
      }
      
      throw new Error("Không nhận được phản hồi hợp lệ từ server");
    } catch (error) {
      console.error("Update user role error:", error);
      console.error("Error details:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      // Kiểm tra lỗi 401 (Unauthorized) hoặc 403 (Forbidden)
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Chỉ Admin mới có thể thay đổi role người dùng.");
      }
      
      throw error.response?.data || error.message;
    }
  },
  
  // Cập nhật trạng thái ban/unban của người dùng
  updateUserStatus: async (userId, isBanned) => {
    try {
      // Lấy token từ cookie
      const token = Cookies.get("auth_token");
      
      if (!token) {
        console.error("No authentication token found. Admin access required.");
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập với tài khoản Admin.");
      }
      
      // Gửi request cập nhật trạng thái
      const action = isBanned ? "ban" : "unban";
      const response = await api.put(`/api/users/${userId}/status`, {
        action: action
      });
      
      console.log(`${action} user response:`, response.data);
      
      if (response.data) {
        return response.data;
      }
      
      throw new Error("Không nhận được phản hồi hợp lệ từ server");
    } catch (error) {
      console.error("Update user status error:", error);
      
      // Kiểm tra lỗi 401 (Unauthorized) hoặc 403 (Forbidden)
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Chỉ Admin mới có thể thay đổi trạng thái người dùng.");
      }
      
      throw error.response?.data || error.message;
    }
  },

  login: async (credentials) => {
    try {
      const response = await api.post("/api/users/login", {
        email: credentials.email,
        password: credentials.password,
      });

      console.log("Login response:", response.data);

      if (response.data && response.data.value) {
        const userData = response.data.value.data;
        if (userData.token) {
          console.log("Setting cookies with user ID:", userData.id, "and token:", userData.token.substring(0, 15) + "...");
          
          // Kiểm tra khả năng tương thích của cookie
          const cookieCompatible = checkCookieCompatibility();
          console.log("Cookie compatibility:", cookieCompatible ? "Good" : "Limited");
          
          // Sử dụng cookie options mà không có domain restriction
          const cookieOptions = { 
            expires: 7, 
            path: '/'
          };
          
          // Lưu cả access token và refresh token
          Cookies.set("auth_token", userData.token, cookieOptions);
          console.log("auth_token set:", Cookies.get("auth_token") ? "success" : "failed");
          
          Cookies.set("refresh_token", userData.refreshToken, { ...cookieOptions, expires: 30 }); // Refresh token có thời hạn dài hơn
          console.log("refresh_token set:", Cookies.get("refresh_token") ? "success" : "failed");
          
          // Lưu id thành user_id trong cả cookie và localStorage
          saveUserId(userData.id);
          console.log("user_id saved with combined method");
          
          // Kiểm tra xem cookie đã được set chưa
          console.log("Immediate check - user_id:", getUserId());
          console.log("All cookies:", document.cookie);
          
          // Thêm kiểm tra sau một thời gian ngắn
          setTimeout(() => {
            const userId = getUserId();
            console.log("Delayed verification - user_id:", userId);
            console.log("Delayed - All cookies:", document.cookie);
            
            // Nếu vẫn không có userId, thử set lại
            if (!userId) {
              console.log("Retry saving user ID");
              saveUserId(userData.id);
            }
          }, 500);
          
          api.defaults.headers.common["Authorization"] = `Bearer ${userData.token}`;
          
          // Lưu thông tin user vào localStorage với cấu trúc rõ ràng
          const userInfo = {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role || userData.roleName
          };
          localStorage.setItem('user_info', JSON.stringify(userInfo));
          
          console.log("Tokens saved to cookies and user info saved to localStorage:", userInfo);
        } else {
          console.error("No token found in user data", userData);
        }
        return response.data.value;
      }
      console.error("Invalid response format", response.data);
      throw new Error("Invalid response format");
    } catch (error) {
      console.error("Login error:", error);
      throw error.response?.data || error.message;
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post("/api/users/register", userData);
      return response;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || "Đăng ký thất bại");
      }
      throw new Error("Không thể kết nối đến server");
    }
  },

  logout: async () => {
    try {
      console.log("Removing cookies and user info");
      // Tùy chọn cookie để đảm bảo nó được xóa đúng
      const cookieOptions = { 
        path: '/',
      };
      
      // Xóa cả access token, refresh token và user info
      Cookies.remove("auth_token", cookieOptions);
      Cookies.remove("refresh_token", cookieOptions);
      Cookies.remove("user_id", cookieOptions);
      
      // Xóa cả dữ liệu backup trong localStorage
      localStorage.removeItem('user_info');
      localStorage.removeItem('user_id_backup');
      
      delete api.defaults.headers.common["Authorization"];
      
      console.log("After logout - All cookies:", document.cookie);
      console.log("After logout - LocalStorage user_id_backup:", localStorage.getItem('user_id_backup'));
      console.log("Tokens and user info removed");
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  },

  verifyOtp: async (email, code) => {
    try {
      console.log(`Verifying OTP for email: ${email}, code: ${code}`);
      
      const response = await api.post("/api/otp/verify-otp-register", {
        email: email,
        code: code.toString(),
      });
      
      console.log("OTP verification response:", response);
      
      // Kiểm tra cấu trúc dữ liệu phản hồi
      const responseData = response.data;
      
      // Xử lý cấu trúc dữ liệu lồng nhau
      if (responseData.value) {
        console.log("Extracted data from value:", responseData.value);
        return responseData.value;
      }
      
      return {
        success: response.status === 200,
        message: responseData.message || "Xác thực OTP thành công"
      };
    } catch (error) {
      console.error("Verify OTP error:", error);
      console.error("Error details:", error.response?.data);
      
      if (error.response?.status === 404) {
        throw new Error("Không tìm thấy API verify OTP. Vui lòng kiểm tra lại đường dẫn API.");
      }
      
      // Trả về đối tượng lỗi có cấu trúc phù hợp
      return {
        success: false,
        message: error.response?.data?.message || "Xác thực OTP thất bại"
      };
    }
  },

  resendOtp: async (email) => {
    try {
      console.log(`Requesting OTP for email: ${email}`);
      
      const response = await api.post("/api/otp/resend-otp", {
        email: email
      });
      
      console.log("Resend OTP response:", response);
      
      // Kiểm tra cấu trúc dữ liệu phản hồi
      const responseData = response.data;
      
      // Xử lý cấu trúc dữ liệu lồng nhau
      if (responseData.value) {
        console.log("Extracted data from value:", responseData.value);
        return {
          success: true,
          message: "Mã OTP đã được gửi đến email của bạn",
          data: responseData.value
        };
      }
      
      return {
        success: response.status === 200,
        message: responseData.message || "Mã OTP đã được gửi đến email của bạn"
      };
    } catch (error) {
      console.error("Resend OTP error:", error);
      console.error("Error details:", error.response?.data);
      
      // Trả về đối tượng lỗi có cấu trúc phù hợp
      return {
        success: false,
        message: error.response?.data?.message || "Không thể gửi mã OTP"
      };
    }
  },
  
  resetPassword: async (email, newPassword) => {
    try {
      console.log(`Resetting password for email: ${email}`);
      
      const response = await api.post("/api/users/reset-password", {
        email: email,
        newPassword: newPassword
      });
      
      console.log("Reset password response:", response);
      
      // Kiểm tra cấu trúc dữ liệu phản hồi
      const responseData = response.data;
      
      // Xử lý cấu trúc dữ liệu lồng nhau
      if (responseData.value) {
        console.log("Extracted data from value:", responseData.value);
        return {
          success: true,
          message: "Mật khẩu đã được đặt lại thành công",
          data: responseData.value
        };
      }
      
      return {
        success: response.status === 200,
        message: responseData.message || "Mật khẩu đã được đặt lại thành công"
      };
    } catch (error) {
      console.error("Reset password error:", error);
      console.error("Error details:", error.response?.data);
      
      // Trả về đối tượng lỗi có cấu trúc phù hợp
      return {
        success: false,
        message: error.response?.data?.message || "Không thể đặt lại mật khẩu"
      };
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await api.post("/api/users/forgot-password", {
        email: email
      });
      return response.data;
    } catch (error) {
      console.error("Forgot password error:", error);
      if (error.response?.status === 404) {
        throw new Error("Không tìm thấy API quên mật khẩu. Vui lòng kiểm tra lại đường dẫn API.");
      }
      throw error.response?.data || error;
    }
  },
  
  resetPassword: async (email, code, newPassword) => {
    try {
      const response = await api.post("/api/users/reset-password", {
        email: email,
        code: code.toString(),
        newPassword: newPassword
      });
      return response.data;
    } catch (error) {
      console.error("Reset password error:", error);
      if (error.response?.status === 404) {
        throw new Error("Không tìm thấy API đặt lại mật khẩu. Vui lòng kiểm tra lại đường dẫn API.");
      }
      throw error.response?.data || error;
    }
  },

  getPackages: async (pageIndex = 1, pageSize = 10) => {
    try {
      // Lấy token từ cookie
      const token = Cookies.get("auth_token");
      
      if (!token) {
        console.error("No authentication token found");
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }
      
      // Gửi request GET với query parameters - không cần thêm config vì interceptor đã xử lý token
      const response = await api.get(`/api/package?pageIndex=${pageIndex}&pageSize=${pageSize}`);
      
      console.log("Get packages response:", response.data);
      
      // Xử lý cấu trúc response đúng
      if (response.data?.value?.data) {
        return response.data.value.data;
      }
      
      return [];
    } catch (error) {
      console.error("Get packages error:", error);
      
      // Kiểm tra lỗi 401 (Unauthorized) hoặc 403 (Forbidden)
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      }
      
      throw error.response?.data || error.message;
    }
  },

  // Thêm hàm lấy danh sách features
  getFeatures: async () => {
    try {
      const token = Cookies.get("auth_token");
      
      if (!token) {
        console.error("No authentication token found");
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await api.get("/api/feature");
      console.log("Get features response:", response.data);

      if (response.data?.value?.data) {
        return response.data.value.data;
      }

      return [];
    } catch (error) {
      console.error("Get features error:", error);
      throw error.response?.data || error.message;
    }
  },

  // Thêm hàm tạo gói mới
  createPackage: async (packageData) => {
    try {
      const token = Cookies.get("auth_token");
      
      if (!token) {
        console.error("No authentication token found");
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      // Gửi request với body đúng format
      const response = await api.post("/api/package", packageData);

      console.log("Create package response:", response.data);
      
      if (response.data?.value) {
        return response.data.value;
      }

      return response.data;
    } catch (error) {
      console.error("Create package error:", error);
      throw error.response?.data || error.message;
    }
  },

  // Thêm hàm cập nhật gói
  updatePackage: async (id, packageData) => {
    try {
      const token = Cookies.get("auth_token");
      
      if (!token) {
        console.error("No authentication token found");
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      // Gửi request với body đúng format
      const response = await api.put(`/api/package/${id}`, packageData);

      console.log("Update package response:", response.data);
      
      if (response.data?.value) {
        return response.data.value;
      }

      return response.data;
    } catch (error) {
      console.error("Update package error:", error);
      throw error.response?.data || error.message;
    }
  },

  // Thêm hàm xóa gói
  deletePackage: async (id) => {
    try {
      const token = Cookies.get("auth_token");
      
      if (!token) {
        console.error("No authentication token found");
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      // Gửi request DELETE với token
      const response = await api.delete(`/api/package/${id}`);

      console.log("Delete package response:", response.data);
      
      if (response.data?.value) {
        return response.data.value;
      }

      return response.data;
    } catch (error) {
      console.error("Delete package error:", error);
      throw error.response?.data || error.message;
    }
  },

  // Thêm hàm lấy danh sách báo cáo
  getReports: async () => {
    try {
      const token = Cookies.get("auth_token");
      
      if (!token) {
        console.error("No authentication token found");
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }
      
      const response = await api.get("/api/StaffReport");
      
      console.log("Get reports response:", response.data);
      
      if (response.data?.value?.data) {
        return response.data.value.data;
      }
      
      return response.data || [];
    } catch (error) {
      console.error("Get reports error:", error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      }
      
      throw error.response?.data || error.message;
    }
  },

  // Thêm hàm xóa người dùng
  deleteUser: async (id) => {
    try {
      const token = Cookies.get("auth_token");
      
      if (!token) {
        console.error("No authentication token found");
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      // Gửi request DELETE với token
      const response = await api.delete(`/api/users/${id}`);

      console.log("Delete user response:", response.data);
      
      if (response.data?.value) {
        return response.data.value;
      }

      return response.data;
    } catch (error) {
      console.error("Delete user error:", error);
      
      // Kiểm tra lỗi 401 (Unauthorized) hoặc 403 (Forbidden)
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      }
      
      throw error.response?.data || error.message;
    }
  },

  // Thêm hàm upload ảnh
  uploadImage: async (file) => {
    try {
      const token = Cookies.get("auth_token");
      
      if (!token) {
        console.error("No authentication token found");
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/api/Images/upload-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Upload image response:", response.data);
      
      if (response.data?.value) {
        return response.data.value;
      }

      return response.data;
    } catch (error) {
      console.error("Upload image error:", error);
      throw error.response?.data || error.message;
    }
  },

  // Thêm hàm xóa ảnh
  deleteImage: async (imageUrl) => {
    try {
      const token = Cookies.get("auth_token");
      
      if (!token) {
        console.error("No authentication token found");
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await api.delete("/api/Images/delete-image", {
        data: { imageUrl }
      });

      console.log("Delete image response:", response.data);
      
      if (response.data?.value) {
        return response.data.value;
      }

      return response.data;
    } catch (error) {
      console.error("Delete image error:", error);
      throw error.response?.data || error.message;
    }
  },

  // Thêm hàm tạo báo cáo
  createReport: async (reportData) => {
    try {
      const token = Cookies.get("auth_token");
      
      if (!token) {
        console.error("No authentication token found");
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await api.post("/api/StaffReport", reportData);

      console.log("Create report response:", response.data);
      
      if (response.data?.value) {
        return response.data.value;
      }

      return response.data;
    } catch (error) {
      console.error("Create report error:", error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      }
      
      throw error.response?.data || error.message;
    }
  },

  // Thêm hàm cập nhật báo cáo
  updateReport: async (id, reportData) => {
    try {
      const token = Cookies.get("auth_token");
      
      if (!token) {
        console.error("No authentication token found");
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await api.put(`/api/StaffReport/${id}`, reportData);

      console.log("Update report response:", response.data);
      
      if (response.data?.value) {
        return response.data.value;
      }

      return response.data;
    } catch (error) {
      console.error("Update report error:", error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      }
      
      throw error.response?.data || error.message;
    }
  },

  // Thêm hàm xóa báo cáo
  deleteReport: async (id) => {
    try {
      const token = Cookies.get("auth_token");
      
      if (!token) {
        console.error("No authentication token found");
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await api.delete(`/api/StaffReport/${id}`);

      console.log("Delete report response:", response.data);
      
      if (response.data?.value) {
        return response.data.value;
      }

      return response.data;
    } catch (error) {
      console.error("Delete report error:", error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      }
      
      throw error.response?.data || error.message;
    }
  },

  // Thêm hàm lấy chi tiết báo cáo
  getReportById: async (id) => {
    try {
      const token = Cookies.get("auth_token");
      
      if (!token) {
        console.error("No authentication token found");
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await api.get(`/api/StaffReport/${id}`);

      console.log("Get report details response:", response.data);
      
      if (response.data?.value) {
        return response.data.value;
      }

      return response.data;
    } catch (error) {
      console.error("Get report details error:", error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      }
      
      throw error.response?.data || error.message;
    }
  },

  // Thêm hàm lấy danh sách bài viết knowledge
  getKnowledge: async (pageIndex = 1, pageSize = 10) => {
    try {
      const token = Cookies.get("auth_token");
      
      if (!token) {
        console.error("No authentication token found");
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await api.get(`/api/Knowledge?pageIndex=${pageIndex}&pageSize=${pageSize}`);

      console.log("Get knowledge response:", response.data);
      
      if (response.data?.value) {
        return {
          articles: response.data.value.map(article => ({
            id: article.id,
            title: article.title,
            content: article.content,
            image: article.imageUrl,
            date: article.createdTime,
            readTime: "5" // Temporary hardcoded value since it's not in the response
          })),
          totalPages: Math.ceil(response.data.value.length / pageSize),
          totalItems: response.data.value.length
        };
      }

      return {
        articles: [],
        totalPages: 1,
        totalItems: 0
      };
    } catch (error) {
      console.error("Get knowledge error:", error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      }
      
      throw error.response?.data || error.message;
    }
  },

  // Thêm hàm tạo bài viết knowledge
  createKnowledge: async (data) => {
    try {
      const token = Cookies.get("auth_token");
      
      if (!token) {
        console.error("No authentication token found");
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      // Create knowledge article
      const response = await api.post("/api/Knowledge", {
        title: data.title,
        content: data.content,
        imageUrl: data.imageUrl // Chỉ sử dụng URL ảnh được truyền vào
      });

      console.log("Create knowledge response:", response.data);
      
      if (response.data?.value) {
        return response.data.value;
      }

      return response.data;
    } catch (error) {
      console.error("Create knowledge error:", error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      }
      
      throw error.response?.data || error.message;
    }
  },

  getKnowledgeById: async (id) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await api.get(`/api/Knowledge/${id}`);
      return response.data;
    } catch (error) {
      console.error("Get knowledge detail error:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      }
      throw error.response?.data || error.message;
    }
  },

  updateKnowledge: async (id, data) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await api.put(`/api/Knowledge/${id}`, {
        title: data.title,
        content: data.content,
        imageUrl: data.imageUrl
      });

      return response.data;
    } catch (error) {
      console.error("Update knowledge error:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      }
      throw error.response?.data || error.message;
    }
  },

  deleteKnowledge: async (id) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await api.delete(`/api/Knowledge/${id}`);
      return response.data;
    } catch (error) {
      console.error("Delete knowledge error:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      }
      throw error.response?.data || error.message;
    }
  },

  updateProfile: async (userData) => {
    try {
      const response = await api.put("/api/users", {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        birthDate: userData.birthDate,
        address: userData.address
      });

      console.log("Update profile response:", response.data);
      
      if (response.data?.value) {
        return response.data.value;
      }

      return response.data;
    } catch (error) {
      console.error("Update profile error:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      }
      throw error.response?.data || error.message;
    }
  },

  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post("/api/users/refresh-token", {
        token: refreshToken
      });

      console.log("Refresh token response:", response.data);
      
      if (response.data?.value) {
        const { token, refreshToken: newRefreshToken } = response.data.value;
        
        // Lưu tokens mới vào cookies
        Cookies.set("auth_token", token);
        Cookies.set("refresh_token", newRefreshToken);
        
        return response.data.value;
      }

      throw new Error("Invalid refresh token response");
    } catch (error) {
      console.error("Refresh token error:", error);
      throw error.response?.data || error.message;
    }
  },

  // Thêm hàm lấy tin tức
  getNews: async (source = 'cafef') => {
    try {
      const response = await api.get(`/api/News/get-news?src=${source}`);
      console.log("Get news response:", response.data);
      
      // Placeholder image nội bộ
      const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNDUwIiBmaWxsPSIjMWExYTFhIiAvPgogICAgPHRleHQgeD0iNDAwIiB5PSIyMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzdhN2E3YSI+S2jDtG5nIGPDsyDhuqNuaDwvdGV4dD4KPC9zdmc+';
      
      // Kiểm tra các cấu trúc dữ liệu khác nhau mà API có thể trả về
      
      // Trường hợp 1: Dữ liệu nằm trong response.data.data (cấu trúc mới)
      if (response.data && Array.isArray(response.data.data)) {
        console.log("Cấu trúc API mới: dữ liệu nằm trong response.data.data");
        return response.data.data.map(item => ({
          id: item.id || Math.random().toString(36).substr(2, 9),
          title: item.title || 'No title',
          source: item.source || source,
          timeAgo: item.time || 'Gần đây',
          imageUrl: item.image || defaultImage,
          content: item.description ? `<p>${item.description}</p>` : '<p>Không có nội dung</p>'
        }));
      }
      
      // Trường hợp 2: Dữ liệu nằm trong response.data.value.data
      if (response.data?.value?.data && Array.isArray(response.data.value.data)) {
        console.log("Dữ liệu nằm trong response.data.value.data");
        return response.data.value.data.map(item => ({
          id: item.id || Math.random().toString(36).substr(2, 9),
          title: item.title || 'No title',
          source: item.source || source,
          timeAgo: item.publishedTime ? `${new Date(item.publishedTime).toLocaleDateString('vi-VN')}` : (item.time || 'Gần đây'),
          imageUrl: item.imageUrl || item.image || defaultImage,
          content: item.content || (item.description ? `<p>${item.description}</p>` : '<p>Không có nội dung</p>')
        }));
      }
      
      // Trường hợp 3: Dữ liệu nằm trong một mảng response.data.value
      if (response.data?.value && Array.isArray(response.data.value)) {
        console.log("Dữ liệu nằm trong mảng response.data.value");
        return response.data.value.map(item => ({
          id: item.id || Math.random().toString(36).substr(2, 9),
          title: item.title || 'No title',
          source: item.source || source,
          timeAgo: item.publishedTime ? `${new Date(item.publishedTime).toLocaleDateString('vi-VN')}` : (item.time || 'Gần đây'),
          imageUrl: item.imageUrl || item.image || defaultImage,
          content: item.content || (item.description ? `<p>${item.description}</p>` : '<p>Không có nội dung</p>')
        }));
      }
      
      // Trường hợp 4: response.data.value là một đối tượng đơn lẻ (không phải mảng)
      if (response.data?.value && typeof response.data.value === 'object' && !Array.isArray(response.data.value)) {
        console.log("response.data.value là một đối tượng đơn lẻ");
        const item = response.data.value;
        return [{
          id: item.id || Math.random().toString(36).substr(2, 9),
          title: item.title || 'No title',
          source: item.source || source,
          timeAgo: item.publishedTime ? `${new Date(item.publishedTime).toLocaleDateString('vi-VN')}` : (item.time || 'Gần đây'),
          imageUrl: item.imageUrl || item.image || defaultImage,
          content: item.content || (item.description ? `<p>${item.description}</p>` : '<p>Không có nội dung</p>')
        }];
      }
      
      // Trường hợp 5: response.data là một mảng trực tiếp
      if (response.data && Array.isArray(response.data)) {
        console.log("response.data là một mảng trực tiếp");
        return response.data.map(item => ({
          id: item.id || Math.random().toString(36).substr(2, 9),
          title: item.title || 'No title',
          source: item.source || source,
          timeAgo: item.publishedTime ? `${new Date(item.publishedTime).toLocaleDateString('vi-VN')}` : (item.time || 'Gần đây'),
          imageUrl: item.imageUrl || item.image || defaultImage,
          content: item.content || (item.description ? `<p>${item.description}</p>` : '<p>Không có nội dung</p>')
        }));
      }
      
      console.log("Không tìm thấy cấu trúc dữ liệu hợp lệ trong response:", response.data);
      return [];
    } catch (error) {
      console.error("Get news error:", error);
      throw error.response?.data || error.message;
    }
  },
};

export default api;