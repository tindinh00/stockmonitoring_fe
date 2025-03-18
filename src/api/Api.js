import axios from "axios";
import Cookies from "js-cookie"; // Import js-cookie

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
  updateUserRole: async (userId, newRole, userEmail) => {
    try {
      // Lấy token từ cookie
      const token = Cookies.get("auth_token");
      
      if (!token) {
        console.error("No authentication token found. Admin access required.");
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập với tài khoản Admin.");
      }
      
      // Đảm bảo chúng ta có email
      if (!userEmail) {
        console.error("Email is required for role update");
        throw new Error("Email người dùng là bắt buộc để thay đổi role");
      }

      // Xác định endpoint dựa trên role mới
      let endpoint;
      if (newRole === "manager") {
        endpoint = `/api/users/make-manager?email=${encodeURIComponent(userEmail)}`;
      } else if (newRole === "staff") {
        endpoint = `/api/users/make-staff?email=${encodeURIComponent(userEmail)}`;
      } else {
        throw new Error("Role không hợp lệ. Chỉ hỗ trợ manager hoặc staff.");
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
      
      // Gửi request PUT với query parameter
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
          Cookies.set("auth_token", userData.token, { expires: 7 }); // Lưu token vào cookie, hết hạn sau 7 ngày
          api.defaults.headers.common["Authorization"] = `Bearer ${userData.token}`;
          console.log("Token saved to cookie:", userData.token);
        }
        return response.data.value; // Trả về toàn bộ value
      }
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
      Cookies.remove("auth_token"); // Xóa token khỏi cookie
      delete api.defaults.headers.common["Authorization"];
      console.log("Token removed from cookie");
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  },

  getUserInfo: async () => {
    try {
      const response = await api.get("/api/users/me");
      console.log("GetUserInfo response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Get User Info error:", error);
      throw error.response?.data || error.message;
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
};

export default api;