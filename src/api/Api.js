import axios from "axios";
import Cookies from "js-cookie"; // Import js-cookie
import { HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr';

// Base URL cho API
export const APP_BASE_URL = "https://stockmonitoring-api-gateway.onrender.com";
export const STOCK_BASE_URL = "https://stockmonitoring-api-gateway.onrender.com";

// Tạo Basic Auth token cho Swagger
const username = "admin";
const password = "password@123";
const basicAuthToken = btoa(`${username}:${password}`);

// Kiểm tra khả năng tương thích của cookie
export const checkCookieCompatibility = () => {
  try {
    const testKey = "cookie_test";
    Cookies.set(testKey, "test");
    const result = Cookies.get(testKey) === "test";
    Cookies.remove(testKey);
    return result;
  } catch (e) {
    console.error("Cookie compatibility check failed:", e);
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
      // Thử set lại cookie
      Cookies.set("user_id", userIdFromStorage, { path: '/' });
    }
    
    return userIdFromStorage;
  } catch (error) {
    console.error("Error getting user ID:", error);
    return null;
  }
};

// Create axios instance with default config
export const axiosInstance = axios.create({
  baseURL: STOCK_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': '*/*'
  }
});

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
axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If token refresh is in progress, add request to queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = Cookies.get("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Try to refresh the token
        const response = await apiService.refreshToken(refreshToken);
        
        // Update the token in cookies and headers
        Cookies.set("auth_token", response.token);
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${response.token}`;
        
        processQueue(null, response.token);
        isRefreshing = false;

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // If refresh token fails, logout the user
        await apiService.logout();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Tạo một service cho các yêu cầu API
export const apiService = {
  // Lấy danh sách người dùng từ API (Yêu cầu quyền Admin)
  getUsers: async (pageIndex = 1, pageSize = 1000) => {
    try {
      const token = Cookies.get("auth_token");
      
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập với tài khoản Admin.");
      }
      
      const response = await axiosInstance.get(`/api/users?pageIndex=${pageIndex}&pageSize=${pageSize}`);
      console.log("Get users response:", response.data);
      
      if (response.data && response.data.value) {
        return response.data.value.data || [];
      }
      
      return response.data.data || [];
    } catch (error) {
      console.error("Get users error:", error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Chỉ Admin mới có thể xem danh sách người dùng.");
      }
      
      throw error.response?.data || error.message;
    }
  },

  // Lấy chi tiết tin tức từ API
  getNewsDetail: async (newsLink) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const encodedLink = encodeURIComponent(newsLink);
      const response = await axiosInstance.get(`/api/news/detail?link=${encodedLink}`);
      
      console.log("Get news detail response:", response.data);
      
      if (response.data && response.data.value) {
        return response.data.value.data || null;
      }
      
      return null;
    } catch (error) {
      console.error("Get news detail error:", error);
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật role của người dùng
  updateUserRole: async (userId, newRole) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập với tài khoản Admin.");
      }

      let roleValue;
      switch(newRole.toLowerCase()) {
        case "customer":
          roleValue = 1;
          break;
        case "staff":
          roleValue = 2;
          break;
        case "manager":
          roleValue = 3;
          break;
        case "admin":
          roleValue = 4;
          break;
        default:
          throw new Error("Role không hợp lệ.");
      }
      
      console.log(`Updating role for user ${userId} to ${newRole} (value: ${roleValue})`);
      
      const response = await axiosInstance.put(`/api/users/${userId}/role`, { role: roleValue });
      
      console.log("Update user role response:", response.data);
      
      if (response.data) {
        return response.data;
      }
      
      throw new Error("Không nhận được phản hồi hợp lệ từ server");
    } catch (error) {
      console.error("Update user role error:", error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Chỉ Admin mới có thể thay đổi role người dùng.");
      }
      
      throw error.response?.data || error.message;
    }
  },
  
  // Cập nhật trạng thái ban/unban của người dùng
  updateUserStatus: async (userId, isBanned) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập với tài khoản Admin.");
      }
      
      const action = isBanned ? "ban" : "unban";
      const response = await axiosInstance.put(`/api/users/${userId}/status`, {
        action: action
      });
      
      console.log(`${action} user response:`, response.data);
      
      if (response.data) {
        return response.data;
      }
      
      throw new Error("Không nhận được phản hồi hợp lệ từ server");
    } catch (error) {
      console.error("Update user status error:", error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Chỉ Admin mới có thể thay đổi trạng thái người dùng.");
      }
      
      throw error.response?.data || error.message;
    }
  },

  login: async (credentials) => {
    try {
      const response = await axiosInstance.post("/api/auth/login", {
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
          Cookies.set("refresh_token", userData.refreshToken, { ...cookieOptions, expires: 30 }); // Refresh token có thời hạn dài hơn
          
          // Lưu id thành user_id trong cả cookie và localStorage
          saveUserId(userData.id);
          
          // Đặt token cho các API request
          axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${userData.token}`;
          
          // Lưu thông tin user vào localStorage với cấu trúc rõ ràng
          const userInfo = {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role || userData.roleName
          };
          localStorage.setItem('user_info', JSON.stringify(userInfo));
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
      const response = await axiosInstance.post("/api/auth/register", userData);
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
      
      delete axiosInstance.defaults.headers.common["Authorization"];
      
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
      
      const response = await axiosInstance.post("/api/otp/verify-registration", {
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
      
      const response = await axiosInstance.post("/api/otp/resend", {
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
  
  resetPassword: async (email, password) => {
    try {
      const response = await axiosInstance.put('/api/auth/reset-password', {
        email,
        Password: password // Viết hoa chữ P theo yêu cầu của API
      });
      
      console.log("Reset password response:", response.data);
      
      if (response.data?.value?.status === 200) {
        return {
          success: true,
          message: response.data.value.message
        };
      }
      
      return {
        success: false,
        message: response.data?.value?.message || "Không thể đặt lại mật khẩu"
      };
    } catch (error) {
      console.error("Reset password error:", error);
      throw error.response?.data || error.message;
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await axiosInstance.post("/api/auth/forgot-password", {
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

  getPackages: async (pageIndex = 1, pageSize = 10) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }
      
      const response = await axiosInstance.get(`/api/package?pageIndex=${pageIndex}&pageSize=${pageSize}`);
      
      console.log("Get packages response:", response.data);
      
      if (response.data?.value?.data) {
        return response.data.value.data;
      }
      
      return [];
    } catch (error) {
      console.error("Get packages error:", error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      }
      
      throw error.response?.data || error.message;
    }
  },

  getFeatures: async () => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await axiosInstance.get("/api/feature");
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

  createPackage: async (packageData) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      // Tạo body request đúng format với duration là 30 ngày
      const requestBody = {
        id: packageData.id,
        name: packageData.name,
        description: packageData.description,
        price: parseFloat(packageData.price),
        discountedPrice: parseFloat(packageData.discountedPrice),
        duration: 30,
        isActive: true,
        isDiscounted: parseFloat(packageData.price) > parseFloat(packageData.discountedPrice),
        featureIds: packageData.featureIds
      };

      const response = await axiosInstance.post("/api/package", requestBody);

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

  updatePackage: async (id, packageData) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      // Tạo body request đúng format với duration là 30 ngày
      const requestBody = {
        id: packageData.id,
        name: packageData.name,
        description: packageData.description,
        price: parseFloat(packageData.price),
        discountedPrice: parseFloat(packageData.discountedPrice),
        duration: 30,
        isActive: true,
        isDiscounted: parseFloat(packageData.price) > parseFloat(packageData.discountedPrice),
        featureIds: packageData.featureIds
      };

      const response = await axiosInstance.put(`/api/package/${id}`, requestBody);

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

  deletePackage: async (id) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await axiosInstance.delete(`/api/package/${id}`);

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

  getReports: async () => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }
      
      const response = await axiosInstance.get("/api/staff-reports");
      
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

  createReport: async (reportData) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await axiosInstance.post("/api/staff-reports", reportData);

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

  updateReport: async (id, reportData) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await axiosInstance.put(`/api/staff-reports/${id}`, reportData);

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

  deleteReport: async (id) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await axiosInstance.delete(`/api/staff-reports/${id}`);

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

  getReportById: async (id) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await axiosInstance.get(`/api/staff-reports/${id}`);

      console.log("Get report details response:", response.data);
      
      if (response.data?.value?.data) {
        return response.data.value.data;
      } else if (response.data?.value) {
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

  getKnowledge: async () => {
    try {
      const response = await axiosInstance.get("/api/knowledges");
      console.log("Get knowledge response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error getting knowledge:", error);
      throw new Error(error.response?.data?.message || "Không thể tải danh sách bài viết");
    }
  },

  createKnowledge: async (data) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await axiosInstance.post("/api/knowledges", {
        title: data.title,
        content: data.content,
        imageUrl: data.imageUrl
      });

      return response.data;
    } catch (error) {
      console.error("Create knowledge error:", error);
      throw error.response?.data || error.message;
    }
  },

  getKnowledgeById: async (id) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await axiosInstance.get(`/api/knowledges/${id}`);
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

      const response = await axiosInstance.put(`/api/knowledges/${id}`, {
        id: id,
        title: data.title,
        content: data.content,
        imageUrl: data.imageUrl
      });

      return response.data;
    } catch (error) {
      console.error("Update knowledge error:", error);
      throw error.response?.data || error.message;
    }
  },

  deleteKnowledge: async (id) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await axiosInstance.delete(`/api/knowledges/${id}`);
      return response.data;
    } catch (error) {
      console.error("Delete knowledge error:", error);
      throw error.response?.data || error.message;
    }
  },

  uploadImage: async (file) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await axiosInstance.post("/api/images", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.value) {
        return response.data.value;
      }
      throw new Error("Không thể tải lên hình ảnh");
    } catch (error) {
      console.error("Upload image error:", error);
      throw error.response?.data || error.message;
    }
  },

  deleteImage: async (imageUrl) => {
    try {
      const token = Cookies.get("auth_token");
      
      if (!token) {
        console.error("No authentication token found");
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await axiosInstance.delete("/api/images", {
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

  createPayment: async (data) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }
      
      const { amount, packageId } = data;
      const response = await axiosInstance.post('/api/payments', {
        packageId: packageId,
        amount: amount
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*'
        }
      });
      
      console.log('Payment API response:', response);
      console.log('Payment data structure:', JSON.stringify(response.data, null, 2));
      
      if (response.data?.value?.data) {
        console.log('Payment QR code:', response.data.value.data.qrCode);
        console.log('Payment checkout URL:', response.data.value.data.checkoutUrl);
        return response.data;
      } else {
        console.error('Invalid payment response structure:', response.data);
        throw new Error('Cấu trúc dữ liệu thanh toán không hợp lệ');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      console.error('Error details:', error.response?.data || error.message);
      throw error;
    }
  },
  
  cancelPayment: async (orderCode) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }
      
      if (!orderCode) {
        throw new Error('Mã đơn hàng không được để trống');
      }
      
      console.log(`Cancelling payment order: ${orderCode}`);
      const response = await axiosInstance.post(`/api/payments/${orderCode}/cancel`);
      
      console.log('Cancel payment response:', response);
      
      if (response.status === 200) {
        return {
          success: true,
          message: 'Hủy đơn hàng thành công'
        };
      } else {
        throw new Error('Hủy đơn hàng không thành công');
      }
    } catch (error) {
      console.error('Error cancelling payment:', error);
      console.error('Error details:', error.response?.data || error.message);
      throw error;
    }
  },
  
  getPaymentStatus: async (orderCode) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }
      
      const userId = getUserId();
      if (!userId) {
        throw new Error("User ID không tồn tại");
      }
      const response = await axiosInstance.get(`/api/payments/${orderCode}`);
      
      return {
        success: true,
        data: response.data.value
      };
    } catch (error) {
      console.error("Get payment status error:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  },
  
  updatePaymentStatus: async (orderCode) => {
    try {
      if (!orderCode) {
        throw new Error("Mã đơn hàng không được để trống");
      }
      
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }
      
      console.log(`Updating payment status for order: ${orderCode}`);
      
      // Make API call with only orderCode in URL, userId will be extracted from token
      const response = await axiosInstance.put(`/api/payments/${orderCode}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': '*/*'
        }
      });
      
      console.log('Update payment status response:', response);
      
      if (response.status === 200) {
        return {
          success: true,
          message: response.data?.message || 'Cập nhật trạng thái thanh toán thành công',
          data: response.data?.value
        };
      } else {
        throw new Error(response.data?.message || 'Không thể cập nhật trạng thái thanh toán');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Không tìm thấy thông tin đơn hàng'
        };
      }
      
      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  },

  getUserPaymentHistory: async (search = '', statusFilter = '') => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }
      
      const userId = getUserId();
      if (!userId) {
        throw new Error("User ID không tồn tại");
      }
      
      console.log("Fetching payment history for user:", userId);
      
      // Create a base URL
      let url = '/api/payments/history';
      
      // Only add query parameters if they have values
      const queryParams = [];
      if (search && search.trim() !== '') {
        queryParams.push(`search=${encodeURIComponent(search.trim())}`);
      }
      
      if (statusFilter && statusFilter !== 'ALL') {
        queryParams.push(`statusFilter=${encodeURIComponent(statusFilter)}`);
      }
      
      // Append query string if we have parameters
      if (queryParams.length > 0) {
        url += '?' + queryParams.join('&');
      }
      
      console.log("Fetching payment history with URL:", url);
      
      const response = await axiosInstance.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': '*/*'
        }
      });
      
      console.log('Payment history response:', response.data);
      
      if (response.status === 200) {
        let transactions = [];
        
        // Check for different response structures
        if (response.data && response.data.value && Array.isArray(response.data.value)) {
          transactions = response.data.value;
        } else if (response.data && response.data.value && response.data.value.data && Array.isArray(response.data.value.data)) {
          transactions = response.data.value.data;
        } else if (response.data && Array.isArray(response.data)) {
          transactions = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          transactions = response.data.data;
        } else {
          console.warn('Unexpected response format:', response.data);
          transactions = [];
        }
        
        return {
          status: 'success',
          data: transactions
        };
      } else {
        throw new Error('Không thể lấy lịch sử thanh toán');
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        return {
          status: 'error',
          message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
        };
      }
      
      return {
        status: 'error',
        message: error.response?.data?.message || error.message || 'Không thể lấy lịch sử giao dịch'
      };
    }
  },

  getNews: async (source = "cafef") => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }
      
      const response = await axiosInstance.get(`/api/news?src=${source}`);
      
      console.log("Get news response:", response.data);
      
      if (response.data && response.data.value && response.data.value.data) {
        // Process and return news items with URLs
        const newsItems = response.data.value.data;
        return newsItems.map(item => ({
          ...item,
          url: item.link || null // Ensure URL is available for fetching details
        }));
      }
      
      // Handle alternative data structure
      if (response.data && response.data.data) {
        // Process and return news items with URLs
        const newsItems = response.data.data;
        return newsItems.map(item => ({
          ...item,
          url: item.link || null // Ensure URL is available for fetching details
        }));
      }
      
      return [];
    } catch (error) {
      console.error("Get news error:", error);
      throw error.response?.data || error.message;
    }
  },

  updateReportStatus: async (id, status) => {
    try {
      const token = Cookies.get("auth_token");
      
      if (!token) {
        console.error("No authentication token found");
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await axiosInstance.put(`/api/staff-reports/${id}/status`, JSON.stringify(status), {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log("Update report status response:", response.data);
      
      if (response.data?.value) {
        return response.data.value;
      }

      return response.data;
    } catch (error) {
      console.error("Update report status error:", error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      }
      
      throw error.response?.data || error.message;
    }
  },

  // Authentication APIs
  refreshToken: async (refreshToken) => {
    try {
      // Lấy token hiện tại từ cookie để gửi trong header
      const currentToken = Cookies.get("auth_token");
      
      const response = await axios.post(`${APP_BASE_URL}/api/auth/refresh-token`, 
        { token: refreshToken },
        {
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json',
            'accept': '*/*',
            'appname': 'STOCK_MONITORING'
          }
        }
      );

      console.log("Refresh token response:", response.data);
      
      // Kiểm tra và xử lý response
      if (response.data?.value) {
        const { token, refreshToken: newRefreshToken } = response.data.value;
        
        // Lưu tokens mới vào cookies
        Cookies.set("auth_token", token);
        if (newRefreshToken) {
          Cookies.set("refresh_token", newRefreshToken);
        }
        
        return {
          token,
          refreshToken: newRefreshToken
        };
      }

      throw new Error("Invalid refresh token response");
    } catch (error) {
      console.error("Refresh token error:", error);
      throw error.response?.data || error.message;
    }
  },

  // User Management APIs
  deleteUser: async (id) => {
    try {
      const token = Cookies.get("auth_token");
      
      if (!token) {
        console.error("No authentication token found");
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      // Gửi request DELETE với token
      const response = await axiosInstance.delete(`/api/users/${id}`);

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

  // Hàm cập nhật thông tin người dùng
  updateProfile: async (userData) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }
      
      // Format birthDate to ISO string if it exists
      let formattedBirthDate = userData.birthDate;
      if (formattedBirthDate) {
        // Check if birthDate is already a Date object
        if (!(formattedBirthDate instanceof Date)) {
          // Try to create a Date object from the provided string/value
          formattedBirthDate = new Date(formattedBirthDate);
        }
        // Ensure it's a valid date before formatting
        if (!isNaN(formattedBirthDate.getTime())) {
          formattedBirthDate = formattedBirthDate.toISOString();
        } else {
          console.warn("Invalid birthDate provided:", userData.birthDate);
          formattedBirthDate = null;
        }
      }
      
      // Gọi API update profile không cần userId trong URL
      const response = await axiosInstance.put(`/api/users`, {
        name: userData.name,
        phone: userData.phone,
        birthDate: formattedBirthDate,
        address: userData.address
      });

      console.log("Update profile response:", response.data);
      
      // After successful update, also update the user info in localStorage
      const currentUserInfo = JSON.parse(localStorage.getItem('user_info')) || {};
      const updatedUserInfo = {
        ...currentUserInfo,
        name: userData.name || currentUserInfo.name,
        email: userData.email || currentUserInfo.email,
        phone: userData.phone || currentUserInfo.phone,
        dateOfBirth: userData.birthDate || currentUserInfo.dateOfBirth,
        address: userData.address || currentUserInfo.address,
        tier: currentUserInfo.tier || userData.tier || "Free" // Preserve tier information
      };
      localStorage.setItem('user_info', JSON.stringify(updatedUserInfo));
      
      if (response.data?.value) {
        return response.data.value;
      }

      return response.data;
    } catch (error) {
      console.error("Update profile error:", error);
      
      // Xử lý lỗi validation trả về từ API và chuyển đổi sang tiếng Việt
      if (error.response && error.response.status === 400) {
        const apiErrors = error.response.data?.errors;
        
        // Nếu có lỗi validation, chuyển tiếp lỗi để xử lý ở component
        if (apiErrors) {
          // Chuyển đổi các thông báo lỗi tiếng Anh sang tiếng Việt
          if (apiErrors.Phone && apiErrors.Phone.length > 0) {
            if (apiErrors.Phone[0].includes("exactly 10 digits")) {
              apiErrors.Phone[0] = "Số điện thoại phải có đúng 10 chữ số.";
            }
          }
          
          // Chuyển tiếp lỗi để xử lý ở component
          throw error;
        }
      }
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      }
      
      throw new Error(error.response?.data?.message || "Không thể cập nhật thông tin.");
    }
  },

  // Get user's active subscription
  getUserSubscription: async () => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }
      
      // Instead of making an API call, get user data from localStorage
      const userData = localStorage.getItem("user_info");
      if (!userData) {
        console.log("No user info found in localStorage");
        return {
          success: true,
          data: null,
          message: "Không tìm thấy gói dịch vụ nào đang hoạt động"
        };
      }
      
      const user = JSON.parse(userData);
      console.log("Retrieved user data from localStorage:", user);
      
      // Extract subscription information from user data
      const subscription = {
        packageName: user.tier || "Free",
        status: "Active", // Assume active since user is logged in
        features: user.features || [],
        startDate: new Date().toISOString(), // Use current date as fallback
        endDate: null, // End date might not be available
        // Add other fields with default values to ensure consistency
        id: "default-subscription-id",
        userId: user.id || "unknown",
        packageId: "default-package-id",
        price: 0,
        discountedPrice: 0,
        isActive: true
      };
      
      // Update tier in localStorage from cookie if available
      const tierFromCookie = Cookies.get("user_tier");
      if (tierFromCookie && tierFromCookie !== user.tier) {
        user.tier = tierFromCookie;
        localStorage.setItem('user_info', JSON.stringify(user));
        console.log("Updated user tier in localStorage from cookie:", tierFromCookie);
      }
      
      console.log("Constructed subscription data:", subscription);
      
      return {
        success: true,
        data: subscription,
        message: "Lấy thông tin gói dịch vụ thành công"
      };
    } catch (error) {
      console.error("Get user subscription error:", error);
      return {
        success: false,
        data: null,
        message: error.message || "Không thể lấy thông tin gói dịch vụ"
      };
    }
  },

  // Thêm hàm mới để lấy danh sách báo cáo theo ID người dùng
  getStaffReports: async (staffId) => {
    try {
      const token = Cookies.get("auth_token");
      
      if (!token) {
        console.error("No authentication token found");
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }
      
      if (!staffId) {
        throw new Error("Staff ID không được để trống");
      }
      
      console.log(`Getting reports for staff ID: ${staffId}`);
      
      const response = await axiosInstance.get(`/api/staff-reports/${staffId}/list`);
      
      console.log("Get staff reports response:", response.data);
      
      if (response.data?.value?.data) {
        return response.data.value.data;
      }
      
      return response.data || [];
    } catch (error) {
      console.error("Get staff reports error:", error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      }
      
      throw error.response?.data || error.message;
    }
  },

  // Thêm hàm mới để tạo cảnh báo giá
  createPriceAlert: async (tickerSymbol, price, type) => {
    try {
      const token = Cookies.get("auth_token");
      
      if (!token) {
        console.error("No authentication token found");
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }
      
      const userId = getUserId();
      if (!userId) {
        throw new Error("Không tìm thấy thông tin người dùng");
      }
      
      // Convert tickerSymbol and type to lowercase
      const normalizedTickerSymbol = tickerSymbol.toLowerCase();
      const normalizedType = type.toLowerCase();
      
      console.log(`Creating price alert for ${normalizedTickerSymbol} at price ${price} (${normalizedType})`);
      
      // Validate alert type
      if (normalizedType !== 'increase' && normalizedType !== 'decrease') {
        throw new Error("Loại cảnh báo không hợp lệ. Chỉ chấp nhận 'increase' hoặc 'decrease'");
      }
      
      // Make API call to create price alert
      const response = await axios.post(
        `${STOCK_BASE_URL}/api/notifications`,
        {
          tickerSymbol: normalizedTickerSymbol.toUpperCase(),
          userId: userId,
          price: parseFloat(price),
          type: normalizedType
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': '*/*'
          }
        }
      );
      
      console.log("Create price alert response:", response.data);
      
      return {
        success: true,
        message: `Đã cài đặt thông báo khi giá ${normalizedTickerSymbol.toUpperCase()} ${normalizedType === 'increase' ? 'tăng lên' : 'giảm xuống'} ${price}`,
        data: response.data
      };
    } catch (error) {
      console.error("Create price alert error:", error);
      return {
        success: false,
        message: error.response?.data?.message || error.message
      };
    }
  },

  // Lấy danh sách thông báo giá của người dùng
  getPriceAlerts: async () => {
    try {
      const token = Cookies.get("auth_token");
      
      if (!token) {
        console.error("No authentication token found");
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }
      
      const userId = getUserId();
      if (!userId) {
        throw new Error("Không tìm thấy thông tin người dùng");
      }
      
      console.log(`Fetching price alerts for user: ${userId}`);
      
      // Make API call to get price alerts
      const response = await axios.get(
        `${STOCK_BASE_URL}/api/notification/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': '*/*'
          }
        }
      );
      
      console.log("Price alerts response:", response.data);
      
      // Format the response data
      let alerts = [];
      if (response.data && response.data.value && Array.isArray(response.data.value.data)) {
        alerts = response.data.value.data;
      } else if (Array.isArray(response.data)) {
        alerts = response.data;
      }
      
      return {
        success: true,
        data: alerts,
        message: `Đã lấy ${alerts.length} thông báo giá`
      };
    } catch (error) {
      console.error("Get price alerts error:", error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || error.message
      };
    }
  },

  // Revenue APIs
  getCurrentMonthRevenue: async () => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await axios.get(`${APP_BASE_URL}/api/revenue/current-month`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': '*/*'
        }
      });
      return response.data.value;
    } catch (error) {
      console.error("Get current month revenue error:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      }
      throw error.response?.data || error.message;
    }
  },

  getPackagesByPurchases: async () => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await axios.get(`${APP_BASE_URL}/api/revenue/packages/by-purchases`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': '*/*'
        }
      });
      return response.data.value;
    } catch (error) {
      console.error("Get packages by purchases error:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      }
      throw error.response?.data || error.message;
    }
  },

  getPackagesByRevenue: async () => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await axios.get(`${APP_BASE_URL}/api/revenue/packages/by-revenue`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': '*/*'
        }
      });
      return response.data.value;
    } catch (error) {
      console.error("Get packages by revenue error:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      }
      throw error.response?.data || error.message;
    }
  },

  getMonthlyRevenue: async (year) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await axios.get(`${APP_BASE_URL}/api/revenue/monthly-revenue/${year}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': '*/*'
        }
      });
      return response.data.value;
    } catch (error) {
      console.error("Get monthly revenue error:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      }
      throw error.response?.data || error.message;
    }
  },

  getDashboardData: async (year) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await axios.get(`${APP_BASE_URL}/api/revenue/dashboard/${year}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': '*/*'
        }
      });
      return response.data.value;
    } catch (error) {
      console.error("Get dashboard data error:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      }
      throw error.response?.data || error.message;
    }
  },

  // Thêm method getCurrentUser để đảm bảo tương thích với cũ
  getCurrentUser: async () => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }
      
      const response = await axiosInstance.get("/api/users/me");
      
      // Return data theo định dạng dự kiến của API
      if (response.data?.value?.data) {
        // Update user_info in localStorage with the complete user data
        const userData = response.data.value.data;
        if (userData) {
          const currentUserInfo = JSON.parse(localStorage.getItem('user_info')) || {};
          const updatedUserInfo = {
            ...currentUserInfo,
            name: userData.name || currentUserInfo.name,
            email: userData.email || currentUserInfo.email,
            phone: userData.phone || currentUserInfo.phone,
            dateOfBirth: userData.birthDate || currentUserInfo.dateOfBirth,
            address: userData.address || currentUserInfo.address
          };
          localStorage.setItem('user_info', JSON.stringify(updatedUserInfo));
        }
        return { data: response.data.value.data };
      }
      
      // Hỗ trợ cấu trúc phản hồi khác
      if (response.data) {
        // Update user_info in localStorage with the complete user data
        const userData = response.data;
        if (userData) {
          const currentUserInfo = JSON.parse(localStorage.getItem('user_info')) || {};
          const updatedUserInfo = {
            ...currentUserInfo,
            name: userData.name || currentUserInfo.name,
            email: userData.email || currentUserInfo.email,
            phone: userData.phone || currentUserInfo.phone,
            dateOfBirth: userData.birthDate || currentUserInfo.dateOfBirth,
            address: userData.address || currentUserInfo.address
          };
          localStorage.setItem('user_info', JSON.stringify(updatedUserInfo));
        }
        return { data: response.data };
      }
      
      return { data: null };
    } catch (error) {
      console.error("Get current user error:", error);
      throw error;
    }
  },

  // Xác thực OTP cho đăng ký
  verifyRegistrationOtp: async (email, otp) => {
    try {
      const response = await axiosInstance.post('/api/otp/verify-registration', {
        email,
        code: otp
      });
      return response.data;
    } catch (error) {
      console.error("Verify registration OTP error:", error);
      throw error.response?.data || error.message;
    }
  },

  // Xác thực OTP cho quên mật khẩu
  verifyResetPasswordOtp: async (email, otp) => {
    try {
      const response = await axiosInstance.post('/api/otp/verify-reset-password', {
        email,
        code: otp
      });
      return response.data;
    } catch (error) {
      console.error("Verify reset password OTP error:", error);
      throw error.response?.data || error.message;
    }
  },

  // Revenue APIs
  getTodayRevenue: async () => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }
      const response = await axios.get(`${APP_BASE_URL}/api/revenue/current-day`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': '*/*'
        }
      });
      return response.data;
    } catch (error) {
      console.error("Get today revenue error:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập lại.");
      }
      throw error.response?.data || error.message;
    }
  },
};

export default axiosInstance;