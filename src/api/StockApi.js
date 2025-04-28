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
    // List of endpoints that don't require authentication
    const publicEndpoints = [
      '/api/stock/session',
      '/api/stock/latest',
      '/api/stock/history',
      '/api/stock/detail',
      '/api/stock/stocks',
      '/api/stock/search',
      '/api/heatmap'
    ];

    // Check if the current request URL matches any public endpoint
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      config.url.includes(endpoint)
    );

    // Only add token if it's not a public endpoint
    if (!isPublicEndpoint) {
      const token = Cookies.get("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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
      console.log(`Input exchange value: "${exchange}", Formatted exchange value: "${formattedExchange}"`);
      
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
            console.log(`Full request URL: ${API_URL}${endpoint}`);
            return response.data;
          }
        } catch (endpointError) {
          console.error(`Error with endpoint ${endpoint}:`, endpointError.message);
          console.error(`Full request URL that failed: ${API_URL}${endpoint}`);
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
        `/api/stock/latest`,
        {
          params: { exchange },
          timeout: 15000
        }
      );

      console.log('Latest stock data response:', response);

      // Check if response exists and has data
      if (!response || !response.data) {
        throw new Error('No response data received');
      }

      // Check if response has the expected structure
      if (response.data.value && response.data.value.status === 200) {
        console.log(`Successfully fetched latest stock data`);
        return response.data;
      } else if (response.data.value) {
        throw new Error(response.data.value.message || 'Invalid response format');
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error fetching latest stock data:', error);
      throw error;
    }
  },

  // Lấy danh sách mã chứng khoán trong watchlist của user
  getWatchlistByUser: async (userId, exchange = 'hsx', timestamp = null) => {
    try {
      console.log(`=== Getting watchlist for user ID: ${userId}, exchange: ${exchange} ===`);
      
      const params = new URLSearchParams();
      if (exchange) {
        const formattedExchange = exchange.toLowerCase();
        params.append('exchange', formattedExchange);
        console.log(`Input exchange value: "${exchange}", Formatted exchange value: "${formattedExchange}"`);
      }
      if (timestamp) {
        params.append('timestamps', timestamp.toString());
      }
      
      const fullUrl = `/api/watchlist-stock/${userId}?${params.toString()}`;
      console.log(`Making API call to: ${fullUrl}`);
      
      const response = await axiosInstance.get(fullUrl, {
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
          tickerSymbol: tickerSymbol.toLowerCase()
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
      
      const response = await axiosInstance.post('/api/watchlist-sector', {
        userId: userId,
        sectorIds: Array.isArray(sectorIds) ? sectorIds : [sectorIds]
      }, {
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
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${Cookies.get("auth_token")}`
        }
      });
      
      // Kiểm tra cấu trúc response
      if (response?.data?.value?.data) {
        const sectorsData = response.data.value.data;
        
        if (sectorsData === "Watch list is empty") {
          console.log("Watchlist is empty");
          return [];
        }
        
        if (sectorsData.sectors && Array.isArray(sectorsData.sectors)) {
          return sectorsData.sectors.map(sector => ({
            id: sector.id,
            name: sector.name,
            code: sector.code,
            stocks: sector.stocks.map(stock => ({
              id: stock.id,
              ticketSymbol: stock.ticketSymbol,
              percentD: stock.percentD,
              percentW: stock.percentW,
              percentM: stock.percentM,
              smg: stock.smg
            })),
            percentD: sector.percentD,
            percentW: sector.percentW,
            percentM: sector.percentM,
            smg: sector.smg
          }));
        }
      }
      
      console.warn("Invalid response format:", response);
      return [];
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
      const response = await axiosInstance.delete('/api/watchlist-stock', {
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
      console.log(`=== Getting heatmap data for ${exchange} with timestamp: ${timestamp || 'latest'} ===`);
      
      // Chuẩn bị tham số cho request
      const params = { 
        exchange: exchange.toLowerCase(), // Chuyển đổi thành chữ thường để đảm bảo tính nhất quán
      };
      
      // Chỉ thêm timestamp vào params nếu có giá trị
      if (timestamp) {
        params.timestamp = timestamp;
      }
      
      const response = await axiosInstance.get(
        '/api/heatmap',
        {
          params: params,
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
  },

  // Tạo thông báo mới
  createNotification: async (data) => {
    try {
      const response = await axiosInstance.post(
        '/api/notifications',
        {
          tickerSymbol: data.tickerSymbol,
          userId: data.userId,
          price: data.price,
          type: data.type
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  // Lấy danh sách thông báo của user
  getNotifications: async (userId) => {
    try {
      const response = await axiosInstance.get(
        `/api/notifications/${userId}`
      );
      console.log("Get notifications response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Get notifications error:", error);
      throw error;
    }
  },

  // Lấy danh sách cổ phiếu trong watchlist
  getWatchlistStocks: async () => {
    try {
      const response = await axiosInstance.get(
        '/api/watchlist-stock',
        {
          params: {
            pageSize: 10000
          }
        }
      );
      console.log("Get watchlist stocks response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Get watchlist stocks error:", error);
      throw error;
    }
  },

  updateNotificationPrice: async (notificationId, data) => {
    try {
      const response = await axiosInstance.put(
        '/api/notifications/price',
        {
          ...data,
          id: notificationId
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating notification price:', error);
      throw error;
    }
  },

  deleteNotification: async (data) => {
    try {
      const response = await axiosInstance.delete(
        '/api/notifications',
        {
          params: {
            tickerSymbol: data.tickerSymbol,
            userId: data.userId,
            type: data.type
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  // Lấy danh sách tin nhắn thông báo của user
  getNotificationMessages: async (userId) => {
    try {
      const response = await axiosInstance.get(
        `/api/notifications/${userId}/messages`
      );
      console.log("Get notification messages response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Get notification messages error:", error);
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