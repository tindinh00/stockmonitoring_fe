import axios from "axios";
import Cookies from "js-cookie";

// Base URL cho Stock API
const STOCK_BASE_URL = "https://stockmonitoring-api-stock-service.onrender.com";

// Tạo axios instance với cấu hình chung
const stockApi = axios.create({
  baseURL: STOCK_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// Add request interceptor
stockApi.interceptors.request.use(
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

// Tạo service cho các yêu cầu API liên quan đến stock
export const stockService = {
  // Lấy danh sách mã chứng khoán trong watchlist của user
  getWatchlistByUser: async (userId) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await stockApi.get(`/api/WatchListStock/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': '*/*'
        }
      });
      console.log("Get watchlist response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Get watchlist error:", error);
      throw error.response?.data || error.message;
    }
  },

  // Lấy dữ liệu chi tiết của các mã chứng khoán
  getStockInSession: async (exchange = 'hsx', timestamp = "20250316122322") => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await stockApi.get('/api/stock/get-stock-in-session', {
        params: {
          exchange,
          timestamp
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': '*/*'
        }
      });
      console.log("Get stock in session response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Get stock in session error:", error);
      throw error.response?.data || error.message;
    }
  },

  // Lấy danh sách ngành
  getWatchListSectors: async (pageIndex = 0, pageSize = 100) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await stockApi.get(`/api/WatchListSector`, {
        params: {
          pageIndex,
          pageSize
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': '*/*'
        }
      });
      console.log("Get sectors response:", response.data);
      
      // Xử lý dữ liệu trả về theo đúng cấu trúc
      return response.data;
    } catch (error) {
      console.error("Get sectors error:", error);
      throw error.response?.data || error.message;
    }
  },

  // Thêm mã chứng khoán vào watchlist
  addToWatchlist: async (userId, stockCode) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await stockApi.post('/api/WatchListStock/add', 
        {
          userId,
          stockCode
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'accept': '*/*'
          }
        }
      );
      console.log("Add to watchlist response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Add to watchlist error:", error);
      throw error.response?.data || error.message;
    }
  },

  // Xóa mã chứng khoán khỏi watchlist
  removeFromWatchlist: async (userId, stockCode) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await stockApi.delete(`/api/WatchListStock/remove/${userId}/${stockCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': '*/*'
        }
      });
      console.log("Remove from watchlist response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Remove from watchlist error:", error);
      throw error.response?.data || error.message;
    }
  },

  // Lấy lịch sử giá của một mã chứng khoán
  getStockHistory: async (stockCode, startDate, endDate) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await stockApi.get(`/api/stock/history/${stockCode}`, {
        params: {
          startDate,
          endDate
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': '*/*'
        }
      });
      console.log("Get stock history response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Get stock history error:", error);
      throw error.response?.data || error.message;
    }
  },

  // Lấy thông tin chi tiết của một mã chứng khoán
  getStockDetail: async (stockCode) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await stockApi.get(`/api/stock/detail/${stockCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': '*/*'
        }
      });
      console.log("Get stock detail response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Get stock detail error:", error);
      throw error.response?.data || error.message;
    }
  },

  // Thêm sectors vào watchlist
  addSectorsToWatchlist: async (userId, sectorIds) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await stockApi.post('/api/WatchListSector', 
        {
          userId: userId,
          sectorIds: sectorIds
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'accept': '*/*'
          }
        }
      );
      console.log("Add sectors to watchlist response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Add sectors to watchlist error:", error);
      throw error.response?.data || error.message;
    }
  },

  // Lấy danh sách ngành theo dõi của một user
  getUserSectors: async (userId) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await stockApi.get(`/api/WatchListSector/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': '*/*'
        }
      });
      console.log("Get user sectors response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Get user sectors error:", error);
      throw error.response?.data || error.message;
    }
  },

  // Xóa stock khỏi watchlist 
  deleteStockFromWatchlist: async (userId, stockId) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await stockApi.delete(`/api/WatchListStock`, {
        params: {
          userId: userId,
          stockId: stockId
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': '*/*'
        }
      });
      console.log("Delete stock from watchlist response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Delete stock from watchlist error:", error);
      throw error.response?.data || error.message;
    }
  },

  // Xóa sector khỏi watchlist
  deleteSectorFromWatchlist: async (userId, sectorId) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        throw new Error("Không có quyền truy cập. Vui lòng đăng nhập.");
      }

      const response = await stockApi.delete(`/api/WatchListSector`, {
        params: {
          userId: userId,
          sectorId: sectorId
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': '*/*'
        }
      });
      console.log("Delete sector from watchlist response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Delete sector from watchlist error:", error);
      throw error.response?.data || error.message;
    }
  }
};

export default stockApi;