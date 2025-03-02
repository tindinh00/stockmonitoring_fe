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
    const token = Cookies.get("userToken"); // Lấy token từ cookie
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("Interceptor - Using Bearer token:", token); // Debug
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
          Cookies.set("userToken", userData.token, { expires: 7 }); // Lưu token vào cookie, hết hạn sau 7 ngày
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
      Cookies.remove("userToken"); // Xóa token khỏi cookie
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
      const response = await api.post("/api/otp/verify-otp-register", {
        email: email,
        code: code.toString(),
      });
      return response.data;
    } catch (error) {
      console.error("Verify OTP error:", error);
      if (error.response?.status === 404) {
        throw new Error("Không tìm thấy API verify OTP. Vui lòng kiểm tra lại đường dẫn API.");
      }
      throw error.response?.data || error;
    }
  },
};

export default api;