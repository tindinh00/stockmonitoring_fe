import axios from "axios";
import Cookies from "js-cookie";
import { apiService } from './Api';
import moment from 'moment';

// Base URL cho Stock API
// When running locally with vite dev server, use the proxy configuration
const API_URL = "https://stockmonitoring-api-gateway.onrender.com";

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': '*/*'
  },
  withCredentials: false
});

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
      originalRequest._retry = true;

      try {
        // Reuse refresh token logic from apiService
        const result = await apiService.refreshToken(Cookies.get("refresh_token"));
        
        if (result && result.token) {
          // Update Authorization header
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${result.token}`;
          originalRequest.headers['Authorization'] = `Bearer ${result.token}`;
          
          // Retry the original request
          return axiosInstance(originalRequest);
        }
        
        throw new Error("Failed to refresh token");
      } catch (refreshError) {
        // If refresh token fails, clear token and redirect to login
        Cookies.remove("auth_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Tạo service cho các yêu cầu API liên quan đến stock
export const stockService = {
  // Lấy dữ liệu chi tiết của các mã chứng khoán trong phiên
  getStockInSession: async (exchange = 'hsx', timestamp = null) => {
    console.log(`=== Getting stock session data (exchange: ${exchange}, timestamp: ${timestamp || 'null'}) ===`);
    
    const currentTimestamp = timestamp || moment().format('YYYYMMDDHHmmss');
    console.log("Using timestamp:", currentTimestamp);
    
    try {
      // Đảm bảo exchange được cung cấp và đúng định dạng
      const formattedExchange = exchange ? exchange.toLowerCase() : 'hsx';
      
      // Tạo danh sách các endpoint có thể thử
      const endpoints = [
        // Endpoint chính với đầy đủ tham số
        `/api/stock/session?exchange=${formattedExchange}&timestamp=${currentTimestamp}`,
        
        // Thêm endpoint cụ thể theo sàn
        `/api/stock/${formattedExchange.toLowerCase()}?timestamp=${currentTimestamp}`,
        
        // Thêm fallback với endpoint khác
        `/api/stock/stock-session?timestamp=${currentTimestamp}&exchange=${formattedExchange}`
      ];
      
      // Thử từng endpoint cho đến khi một endpoint trả về dữ liệu
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying API endpoint: ${endpoint}`);
          const response = await axiosInstance.get(`${API_URL}${endpoint}`);
          
          if (response && response.status === 200) {
            console.log(`Endpoint ${endpoint} succeeded:`, response.status);
            return response.data;
          }
        } catch (endpointError) {
          console.error(`Error with endpoint ${endpoint}:`, endpointError.message);
          console.error("Full error:", endpointError);
          // Tiếp tục thử endpoint tiếp theo
        }
      }
      
      throw new Error('All endpoints failed');
    } catch (error) {
      console.error("Error fetching stock session data:", error);
      throw error;
    }
  },

  // Get latest stock data
  getLatestStockData: async (exchange = 'hsx') => {
    try {
      console.log(`=== Getting latest stock data for ${exchange} ===`);
      
      const response = await axiosInstance.get(
        `https://stockmonitoring-api-stock-service.onrender.com/api/stock/latest`,
        {
          params: { exchange },
          timeout: 15000
        }
      );

      if (response?.data) {
        console.log(`Successfully fetched latest stock data`);
        return response.data;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching latest stock data:', error);
      throw error;
    }
  },

  // Lấy danh sách mã chứng khoán trong watchlist của user
  getWatchlistByUser: async (userId) => {
    try {
      console.log("Trying to get watchlist for user ID:", userId);
      
      const response = await axiosInstance.get(`/api/watchlist-stock/${userId}`, {
        timeout: 15000
      });
      
      console.log("Get watchlist response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Get watchlist error:", error);
      throw error;
    }
  },

  // Lấy danh sách ngành
  getWatchListSectors: async (pageIndex = 0, pageSize = 100) => {
    try {
      const response = await axiosInstance.get('/api/watchlist-sector', {
        params: {
          pageIndex,
          pageSize
        }
      });
      
      console.log("Get sectors response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Get sectors error:", error);
      throw error;
    }
  },

  // Lấy lịch sử giá của một mã chứng khoán
  getStockHistory: async (stockCode, startDate, endDate) => {
    try {
      const response = await axiosInstance.get(`/api/stock/history/${stockCode}`, {
        params: {
          startDate,
          endDate
        }
      });
      
      console.log("Get stock history response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Get stock history error:", error);
      throw error;
    }
  },

  // Lấy thông tin chi tiết của một mã chứng khoán
  getStockDetail: async (stockCode) => {
    try {
      const response = await axiosInstance.get(`/api/stock/detail/${stockCode}`);
      
      console.log("Get stock detail response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Get stock detail error:", error);
      throw error;
    }
  },

  // Add stock to watchlist
  addToWatchlist: async (userId, tickerSymbol) => {
    try {
      const response = await axiosInstance.post(
        `/api/WatchListStock`,
        {
          userId: userId,
          tickerSymbol: tickerSymbol
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  },

  // Remove stock from watchlist
  removeFromWatchlist: async (userId, stockId) => {
    try {
      const response = await axiosInstance.delete(
        `/api/WatchListStock`,
        {
          params: {
            userId: userId,
            stockId: stockId
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  },

  // Thêm sectors vào watchlist
  addSectorsToWatchlist: async (userId, sectorIds) => {
    try {
      console.log("Adding sectors to watchlist:", { userId, sectorIds });
      
      // Đảm bảo sectorIds là mảng
      const sectorIdArray = Array.isArray(sectorIds) ? sectorIds : [sectorIds];
      
      const response = await axiosInstance.post(`/api/watchlist-sector/${userId}`, sectorIdArray, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Add sectors to watchlist response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Add sectors to watchlist error:", error);
      throw error;
    }
  },

  // Lấy danh sách ngành theo dõi của một user
  getUserSectors: async (userId) => {
    try {
      console.log(`Getting user sectors for userId: ${userId}`);
      
      const response = await axiosInstance.get(`/api/watchlist-sector/${userId}`, {
        timeout: 15000
      });
      
      console.log("User sectors response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching user sectors:', error);
      throw error;
    }
  },

  // Xóa sector khỏi watchlist
  deleteSectorFromWatchlist: async (userId, sectorId) => {
    try {
      console.log(`Deleting sector ${sectorId} for user ${userId}`);
      
      const response = await axiosInstance.delete(`/api/watchlist-sector/${userId}/${sectorId}`);
      
      console.log("Delete sector from watchlist response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Delete sector from watchlist error:", error);
      throw error;
    }
  },

  // Xóa sector khỏi watchlist sử dụng query parameter
  deleteSectorWithQuery: async (userId, sectorId) => {
    try {
      console.log(`Deleting sector ${sectorId} for user ${userId} using query parameters`);
      
      const response = await axiosInstance.delete('/api/watchlist-sector', {
        params: {
          userId: userId,
          sectorId: sectorId
        }
      });
      
      console.log("Delete sector with query params response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Delete sector with query params error:", error);
      throw error;
    }
  },

  // Add stocks to watchlist (multiple)
  addStocksToWatchlist: async (userId, stockCodes) => {
    try {
      const requests = stockCodes.map(code => 
        stockService.addToWatchlist(userId, code)
      );
      
      const responses = await Promise.all(requests);
      console.log("Add stocks to watchlist responses:", responses);
      return responses;
    } catch (error) {
      console.error("Add stocks to watchlist error:", error);
      throw error;
    }
  },
  
  // Lấy dữ liệu stocks tổng hợp
  getStocks: async () => {
    try {
      const response = await axiosInstance.get('/api/stock/stocks');
      console.log("Get stocks response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Get stocks error:", error);
      throw error;
    }
  },
  
  // Tìm kiếm cổ phiếu
  searchStocks: async (query) => {
    try {
      const response = await axiosInstance.get('/api/stock/search', {
        params: { query }
      });
      console.log("Search stocks response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Search stocks error:", error);
      throw error;
    }
  },
  
  // Xóa một mã chứng khoán khỏi watchlist
  deleteStockFromWatchlist: async (userId, tickerSymbol) => {
    try {
      const response = await axiosInstance.delete('/api/WatchListStock', {
        params: {
          userId: userId,
          tickerSymbol: tickerSymbol
        }
      });
      console.log("Delete stock from watchlist response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Delete stock from watchlist error:", error);
      throw error;
    }
  },

  // Get heatmap data
  getHeatmapData: async (exchange = 'hsx', timestamp = null) => {
    try {
      console.log(`=== Getting heatmap data for ${exchange} ===`);
      
      const response = await axiosInstance.get(
        'https://stockmonitoring-api-stock-service.onrender.com/api/heatmap',
        {
          params: { 
            exchange: exchange === 'hsx' ? 'hsx' : 'hnx',  // Convert exchange to numeric format (1 for HSX, 2 for HNX)
            timestamp: timestamp || '1'  // Default to '1' if no timestamp provided
          },
          headers: {
            'accept': 'text/plain'
          },
          timeout: 15000
        }
      );

      if (response?.data) {
        console.log('Successfully fetched heatmap data');
        return response.data;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
      throw error;
    }
  }
};

export const mockAnalyticStocks = [
  {
    code: 'VNM',
    name: 'CTCP Sữa Việt Nam',
    currentPrice: 85000,
    change: 2.5,
    volume: 1500000,
    pe: 15.2,
    pb: 3.8,
    eps: 5600,
    roe: 18.5,
    roa: 12.3,
    dividend: 5.2,
    rsi: 65.4,
    macd: 0.8,
    signal: 0.6,
    beta: 0.85,
    volatility: 22.5,
    sharpe: 1.2,
    risk: 'Thấp',
    recommendation: 'Mua'
  },
  {
    code: 'VCB',
    name: 'Ngân hàng TMCP Ngoại thương Việt Nam',
    currentPrice: 92000,
    change: -1.2,
    volume: 2100000,
    pe: 18.5,
    pb: 4.2,
    eps: 4800,
    roe: 21.3,
    roa: 15.7,
    dividend: 3.8,
    rsi: 42.6,
    macd: -0.3,
    signal: -0.1,
    beta: 1.15,
    volatility: 28.4,
    sharpe: 0.9,
    risk: 'Trung bình',
    recommendation: 'Nắm giữ'
  },
  {
    code: 'HPG',
    name: 'CTCP Tập đoàn Hòa Phát',
    currentPrice: 28500,
    change: 3.8,
    volume: 3500000,
    pe: 8.4,
    pb: 1.8,
    eps: 3200,
    roe: 15.8,
    roa: 9.4,
    dividend: 2.5,
    rsi: 72.3,
    macd: 1.2,
    signal: 0.8,
    beta: 1.45,
    volatility: 35.6,
    sharpe: 0.7,
    risk: 'Cao',
    recommendation: 'Mua'
  },
  {
    code: 'FPT',
    name: 'CTCP FPT',
    currentPrice: 95500,
    change: 1.5,
    volume: 980000,
    pe: 16.8,
    pb: 3.5,
    eps: 5200,
    roe: 19.8,
    roa: 13.5,
    dividend: 4.2,
    rsi: 58.7,
    macd: 0.5,
    signal: 0.4,
    beta: 0.95,
    volatility: 25.3,
    sharpe: 1.1,
    risk: 'Thấp',
    recommendation: 'Nắm giữ'
  },
  {
    code: 'MWG',
    name: 'CTCP Đầu tư Thế giới Di động',
    currentPrice: 45200,
    change: -2.8,
    volume: 1850000,
    pe: 12.5,
    pb: 2.8,
    eps: 3800,
    roe: 16.5,
    roa: 10.8,
    dividend: 3.5,
    rsi: 38.4,
    macd: -0.6,
    signal: -0.4,
    beta: 1.25,
    volatility: 32.1,
    sharpe: 0.8,
    risk: 'Trung bình',
    recommendation: 'Bán'
  }
];

export default axiosInstance;