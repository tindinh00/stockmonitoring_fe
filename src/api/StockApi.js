import axios from "axios";
import Cookies from "js-cookie";
import { apiService } from './Api';
import moment from 'moment';

// Base URL cho Stock API
// When running locally with vite dev server, use the proxy configuration
const API_URL = "https://stockmonitoring-api-stock-service.onrender.com";

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

// Mock data cho bảng phân tích
export const mockAnalyticStocks = [
  {
    code: 'VNM',
    name: 'Công ty Cổ phần Sữa Việt Nam',
    currentPrice: 78.4,
    change: 2.1,
    volume: 1250000,
    pe: 16.2,
    pb: 3.5,
    eps: 4500,
    roe: 18.5,
    roa: 14.2,
    dividend: 5.6,
    rsi: 65.2,
    macd: 0.89,
    signal: 0.65,
    ma20: 77.5,
    ma50: 76.2,
    ma200: 72.8,
    beta: 0.85,
    volatility: 15.3,
    sharpe: 2.1,
    targetPrice: 85.0,
    stopLoss: 68.5,
    risk: 'Trung bình',
    recommendation: 'Mua'
  },
  {
    code: 'FPT',
    name: 'Công ty Cổ phần FPT',
    currentPrice: 120.5,
    change: 1.5,
    volume: 856000,
    pe: 22.4,
    pb: 4.2,
    eps: 5200,
    roe: 21.6,
    roa: 10.8,
    dividend: 2.8,
    rsi: 58.3,
    macd: 0.56,
    signal: 0.42,
    ma20: 119.2,
    ma50: 115.5,
    ma200: 105.8,
    beta: 1.15,
    volatility: 18.6,
    sharpe: 1.75,
    targetPrice: 134.0,
    stopLoss: 108.0,
    risk: 'Trung bình',
    recommendation: 'Mua'
  },
  {
    code: 'VIC',
    name: 'Tập đoàn Vingroup',
    currentPrice: 64.8,
    change: -0.8,
    volume: 1580000,
    pe: 28.6,
    pb: 2.9,
    eps: 2300,
    roe: 9.5,
    roa: 4.2,
    dividend: 1.2,
    rsi: 42.6,
    macd: -0.25,
    signal: -0.15,
    ma20: 65.3,
    ma50: 66.5,
    ma200: 68.2,
    beta: 1.42,
    volatility: 24.8,
    sharpe: 0.95,
    targetPrice: 72.5,
    stopLoss: 58.0,
    risk: 'Cao',
    recommendation: 'Nắm giữ'
  },
  {
    code: 'HPG',
    name: 'Công ty Cổ phần Tập đoàn Hòa Phát',
    currentPrice: 28.5,
    change: -1.2,
    volume: 2450000,
    pe: 8.6,
    pb: 1.8,
    eps: 3300,
    roe: 12.5,
    roa: 7.8,
    dividend: 3.5,
    rsi: 38.4,
    macd: -0.42,
    signal: -0.35,
    ma20: 29.2,
    ma50: 30.5,
    ma200: 31.8,
    beta: 1.65,
    volatility: 28.6,
    sharpe: 0.82,
    targetPrice: 32.5,
    stopLoss: 25.0,
    risk: 'Cao',
    recommendation: 'Nắm giữ'
  },
  {
    code: 'MSN',
    name: 'Tập đoàn Masan',
    currentPrice: 82.6,
    change: 0.5,
    volume: 965000,
    pe: 15.2,
    pb: 2.6,
    eps: 5400,
    roe: 16.8,
    roa: 8.5,
    dividend: 2.2,
    rsi: 52.5,
    macd: 0.12,
    signal: 0.08,
    ma20: 82.1,
    ma50: 80.8,
    ma200: 79.5,
    beta: 1.05,
    volatility: 20.3,
    sharpe: 1.45,
    targetPrice: 88.0,
    stopLoss: 76.0,
    risk: 'Trung bình',
    recommendation: 'Nắm giữ'
  },
  {
    code: 'VCB',
    name: 'Ngân hàng TMCP Ngoại thương Việt Nam',
    currentPrice: 97.8,
    change: 2.4,
    volume: 1120000,
    pe: 18.5,
    pb: 3.2,
    eps: 5280,
    roe: 24.6,
    roa: 2.1,
    dividend: 4.0,
    rsi: 72.5,
    macd: 1.24,
    signal: 0.86,
    ma20: 95.1,
    ma50: 92.8,
    ma200: 88.5,
    beta: 0.92,
    volatility: 16.5,
    sharpe: 2.35,
    targetPrice: 105.0,
    stopLoss: 88.0,
    risk: 'Thấp',
    recommendation: 'Mua'
  },
  {
    code: 'MWG',
    name: 'CTCP Đầu tư Thế giới Di động',
    currentPrice: 48.2,
    change: -2.1,
    volume: 1680000,
    pe: 10.6,
    pb: 2.1,
    eps: 4540,
    roe: 14.5,
    roa: 8.2,
    dividend: 1.8,
    rsi: 34.6,
    macd: -0.56,
    signal: -0.38,
    ma20: 49.5,
    ma50: 51.2,
    ma200: 54.8,
    beta: 1.35,
    volatility: 25.2,
    sharpe: 0.78,
    targetPrice: 54.0,
    stopLoss: 42.5,
    risk: 'Cao',
    recommendation: 'Bán'
  },
  {
    code: 'TCB',
    name: 'Ngân hàng TMCP Kỹ thương Việt Nam',
    currentPrice: 42.5,
    change: 1.2,
    volume: 2250000,
    pe: 7.8,
    pb: 1.5,
    eps: 5450,
    roe: 22.5,
    roa: 3.2,
    dividend: 0.0,
    rsi: 56.2,
    macd: 0.35,
    signal: 0.28,
    ma20: 41.8,
    ma50: 40.5,
    ma200: 38.6,
    beta: 1.25,
    volatility: 22.8,
    sharpe: 1.65,
    targetPrice: 48.0,
    stopLoss: 36.0,
    risk: 'Trung bình',
    recommendation: 'Mua'
  },
  {
    code: 'VRE',
    name: 'CTCP Vincom Retail',
    currentPrice: 25.6,
    change: -0.4,
    volume: 1450000,
    pe: 22.5,
    pb: 2.4,
    eps: 1140,
    roe: 10.6,
    roa: 8.5,
    dividend: 1.5,
    rsi: 48.5,
    macd: -0.08,
    signal: -0.05,
    ma20: 25.8,
    ma50: 26.2,
    ma200: 26.5,
    beta: 0.95,
    volatility: 18.5,
    sharpe: 1.15,
    targetPrice: 28.0,
    stopLoss: 22.5,
    risk: 'Trung bình',
    recommendation: 'Nắm giữ'
  },
  {
    code: 'CTG',
    name: 'Ngân hàng TMCP Công thương Việt Nam',
    currentPrice: 36.5,
    change: 0.8,
    volume: 2650000,
    pe: 8.5,
    pb: 1.6,
    eps: 4280,
    roe: 18.5,
    roa: 1.5,
    dividend: 2.8,
    rsi: 54.2,
    macd: 0.15,
    signal: 0.12,
    ma20: 36.2,
    ma50: 35.8,
    ma200: 34.2,
    beta: 1.15,
    volatility: 21.5,
    sharpe: 1.35,
    targetPrice: 40.0,
    stopLoss: 32.0,
    risk: 'Trung bình',
    recommendation: 'Mua'
  },
];

// Tạo service cho các yêu cầu API liên quan đến stock
export const stockService = {
  // Lấy dữ liệu chi tiết của các mã chứng khoán trong phiên
  getStockInSession: async (exchange = 'hsx', timestamp = null) => {
    console.log(`=== Getting stock session data (exchange: ${exchange}, timestamp: ${timestamp || 'null'}) ===`);
    
    const currentTimestamp = timestamp || moment().format('YYYYMMDDHHmmss');
    console.log("Using timestamp:", currentTimestamp);
    
    try {
      // Đảm bảo exchange được cung cấp và đúng định dạng (viết hoa)
      const formattedExchange = exchange ? exchange.toUpperCase() : 'HSX';
      
      // Tạo danh sách các endpoint có thể thử
      const endpoints = [
        // Endpoint chính với đầy đủ tham số
        `/api/stock?exchange=${formattedExchange}&timestamp=${currentTimestamp}`,
        
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
            
            // Định dạng dữ liệu theo cấu trúc chuẩn mà frontend cần
            let formattedData = {
              value: {
                data: []
              }
            };
            
            if (response.data && response.data.value && response.data.value.data) {
              // Nếu đã đúng định dạng, sử dụng luôn
              formattedData = response.data;
            } 
            else if (response.data && Array.isArray(response.data)) {
              // Nếu là array, đóng gói vào định dạng chuẩn
              formattedData.value.data = response.data;
            }
            else if (response.data && typeof response.data === 'object') {
              // Nếu là object, kiểm tra xem có stocks hay items không
              if (response.data.stocks && Array.isArray(response.data.stocks)) {
                formattedData.value.data = response.data.stocks;
              } 
              else if (response.data.items && Array.isArray(response.data.items)) {
                formattedData.value.data = response.data.items;
              }
              else if (response.data.data && Array.isArray(response.data.data)) {
                formattedData.value.data = response.data.data;
              }
            }
            
            console.log(`Formatted ${formattedData.value.data.length} stock items`);
            return formattedData;
          }
        } catch (endpointError) {
          console.error(`Error with endpoint ${endpoint}:`, endpointError.message);
          console.error("Full error:", endpointError);
          // Tiếp tục thử endpoint tiếp theo
        }
      }
      
      // Nếu tất cả endpoint đều thất bại, tạo dữ liệu mẫu
      console.log("All endpoints failed, returning sample data");
      return createSampleStockData(formattedExchange);
    } catch (error) {
      console.error("Error fetching stock session data:", error);
      return createSampleStockData(exchange);
    }
  },

  // Lấy danh sách mã chứng khoán trong watchlist của user
  getWatchlistByUser: async (userId) => {
    try {
      console.log("Trying to get watchlist for user ID:", userId);
      
      // Sử dụng đúng endpoint với userId
      try {
        const response = await axiosInstance.get(`/api/watchlist-stock/${userId}`, {
          timeout: 15000
        });
        
        console.log("Get watchlist response:", response.data);
        
        // Kiểm tra cấu trúc dữ liệu trả về đúng định dạng
        // Cấu trúc API: { value: { message, status, data: { stocks: [] } } }
        if (response.data && response.data.value) {
          // Dữ liệu có thể nằm trong value.data.stocks
          if (response.data.value.data && Array.isArray(response.data.value.data.stocks)) {
            console.log("Found stocks in value.data.stocks structure");
            
            // Chuyển đổi từ ticketSymbol sang tickerSymbol
            const convertedStocks = response.data.value.data.stocks.map(stock => ({
              id: stock.id || Math.random().toString(36).substr(2, 9),
              tickerSymbol: stock.ticketSymbol // Chú ý: API trả về là ticketSymbol không phải tickerSymbol
            }));
            
            console.log("Converted stocks:", convertedStocks);
            return {
              code: 200,
              message: "Danh sách theo dõi",
              value: {
                data: {
                  stocks: convertedStocks
                }
              }
            };
          }
          
          // Cấu trúc cũ, data trực tiếp trong value
          if (response.data.value.data && !Array.isArray(response.data.value.data.stocks)) {
            console.log("Found non-array data structure, trying to extract");
            const dataObj = response.data.value.data;
            
            if (dataObj.stocks) {
              // Trường hợp đặc biệt: chỉ có 1 cổ phiếu
              console.log("Found stocks object in value.data");
              const convertedStocks = Array.isArray(dataObj.stocks) 
                ? dataObj.stocks.map(stock => ({
                    id: stock.id || Math.random().toString(36).substr(2, 9),
                    tickerSymbol: stock.ticketSymbol // Chú ý: API trả về là ticketSymbol
                  }))
                : []; // Mảng rỗng nếu không phải là array
                
              return {
                code: 200,
                message: "Danh sách theo dõi",
                value: {
                  data: {
                    stocks: convertedStocks
                  }
                }
              };
            }
          }
        }
        
        // Không tìm thấy cấu trúc phù hợp, kiểm tra nếu có mảng trực tiếp
        if (Array.isArray(response.data)) {
          console.log("Found array response structure");
          const convertedStocks = response.data.map(stock => ({
            id: stock.id || Math.random().toString(36).substr(2, 9),
            tickerSymbol: stock.ticketSymbol || stock.tickerSymbol || stock.code || stock.stockCode
          }));
          
          return {
            code: 200,
            message: "Danh sách theo dõi",
            value: {
              data: {
                stocks: convertedStocks
              }
            }
          };
        }
        
        // Trường hợp không tìm thấy cấu trúc phù hợp, trả về mảng rỗng
        console.log("Could not determine appropriate data structure, returning empty array");
        return {
          code: 200,
          message: "Không có dữ liệu theo dõi",
          value: {
            data: {
              stocks: []
            }
          }
        };
      } catch (error) {
        console.error("Get watchlist API error:", error.message);
        // Trả về dữ liệu mẫu để tránh lỗi
        return {
          code: 200,
          message: "Lỗi khi lấy dữ liệu watchlist",
          value: {
            data: {
              stocks: [
                {id: "1", tickerSymbol: "VNM"},
                {id: "2", tickerSymbol: "VIC"},
                {id: "3", tickerSymbol: "FPT"},
                {id: "4", tickerSymbol: "HPG"},
                {id: "5", tickerSymbol: "MWG"}
              ]
            }
          }
        };
      }
    } catch (error) {
      console.error("Get watchlist error:", error);
      // Trả về dữ liệu mẫu để tránh lỗi
      return {
        code: 200,
        message: "Lỗi chung khi lấy dữ liệu watchlist",
        value: {
          data: {
            stocks: [
              {id: "1", tickerSymbol: "VNM"},
              {id: "2", tickerSymbol: "VIC"},
              {id: "3", tickerSymbol: "FPT"}
            ]
          }
        }
      };
    }
  },

  // Lấy danh sách ngành
  getWatchListSectors: async (pageIndex = 0, pageSize = 100) => {
    try {
      // Gọi API để lấy danh sách các ngành
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
      // Gọi API để lấy lịch sử giá của cổ phiếu
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
      // Gọi API để lấy thông tin chi tiết của cổ phiếu
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
      
      // Gọi API để thêm ngành vào danh sách theo dõi - cấu trúc endpoint khác
      const response = await axiosInstance.post(`/api/watchlist-sector/${userId}`, sectorIdArray, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Add sectors to watchlist response:", response.data);
      
      return {
        code: 200,
        message: "Thêm ngành vào danh sách theo dõi thành công",
        value: true
      };
    } catch (error) {
      console.error("Add sectors to watchlist error:", error);
      // Log chi tiết error response để debug
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
      }
      throw error;
    }
  },

  // Lấy danh sách ngành theo dõi của một user
  getUserSectors: async (userId) => {
    try {
      console.log(`Getting user sectors for userId: ${userId}`);
      
      // Sử dụng đúng endpoint với userId được truyền vào đường dẫn
      const response = await axiosInstance.get(`/api/watchlist-sector/${userId}`, {
        timeout: 15000 // Thêm timeout để tránh chờ quá lâu
      });
      console.log("User sectors response:", response.data);
      
      // Đảm bảo response có cấu trúc đúng
      if (response.data) {
        if (response.data.value) {
          return response.data; // Cấu trúc đã đúng
        } else if (Array.isArray(response.data)) {
          // Biến đổi response thành cấu trúc chuẩn
          return {
            code: 200,
            message: "Danh sách ngành theo dõi",
            value: {
              data: response.data
            }
          };
        }
      }
      
      // Trả về response gốc nếu không xác định được cấu trúc
      return response.data;
    } catch (error) {
      console.error('Error fetching user sectors:', error);
      // Log chi tiết error response để debug
      if (error.response) {
        console.error("Error response status:", error.response.status);
        console.error("Error response data:", error.response.data);
      }
      
      // Trả về dữ liệu mẫu để tránh lỗi UI
      return {
        code: 200,
        message: "Dữ liệu mẫu khi không thể lấy danh sách ngành theo dõi",
        value: {
          data: [
            {
              id: "sample-1",
              name: "Ngân hàng",
              stocks: ["VCB", "TCB", "BID", "CTG"],
              smg: 85,
              percentD: 1.2,
              percentW: 3.5,
              percentM: 5.8
            },
            {
              id: "sample-2",
              name: "Công nghệ",
              stocks: ["FPT", "CMG", "VNG"],
              smg: 78,
              percentD: 0.8,
              percentW: 2.7,
              percentM: 4.2
            }
          ]
        }
      };
    }
  },

  // Xóa sector khỏi watchlist
  deleteSectorFromWatchlist: async (userId, sectorId) => {
    try {
      console.log(`Deleting sector ${sectorId} for user ${userId}`);
      
      // Sử dụng đúng cấu trúc endpoint
      const response = await axiosInstance.delete(`/api/watchlist-sector/${userId}/${sectorId}`);
      
      console.log("Delete sector from watchlist response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Delete sector from watchlist error:", error);
      // Log chi tiết error response để debug
      if (error.response) {
        console.error("Error response status:", error.response.status);
        console.error("Error response data:", error.response.data);
      }
      throw error;
    }
  },

  // Xóa sector khỏi watchlist sử dụng query parameter
  deleteSectorWithQuery: async (userId, sectorId) => {
    try {
      console.log(`Deleting sector ${sectorId} for user ${userId} using query parameters`);
      
      // Sử dụng endpoint với tham số query
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
      // Log chi tiết error response để debug
      if (error.response) {
        console.error("Error response status:", error.response.status);
        console.error("Error response data:", error.response.data);
      }
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
      
      return {
        code: 200,
        message: "Thêm cổ phiếu vào danh sách theo dõi thành công",
        value: true
      };
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
      // Gọi API để tìm kiếm cổ phiếu
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
  }
};

// Hàm tạo dữ liệu mẫu khi API thất bại
const createSampleStockData = (exchange) => {
  const sampleStocks = [
    { stockCode: "VIC", exchange: exchange, currentPrice: 45.6, changePercent: 2.5 },
    { stockCode: "VNM", exchange: exchange, currentPrice: 67.8, changePercent: -1.2 },
    { stockCode: "HPG", exchange: exchange, currentPrice: 23.4, changePercent: 0.5 },
    { stockCode: "VRE", exchange: exchange, currentPrice: 34.2, changePercent: -0.8 },
    { stockCode: "MSN", exchange: exchange, currentPrice: 89.3, changePercent: 3.1 },
    { stockCode: "BID", exchange: exchange, currentPrice: 43.5, changePercent: 1.2 }
  ];
  
  // Thêm một số trường thông tin khác cần thiết cho mỗi mã cổ phiếu
  const enhancedStocks = sampleStocks.map(stock => {
    const basePrice = parseFloat(stock.currentPrice);
    const changePercent = parseFloat(stock.changePercent);
    const changeValue = basePrice * (changePercent / 100);
    
    return {
      ...stock,
      tickerSymbol: stock.stockCode,
      changeValue: changeValue.toFixed(2),
      totalVolume: Math.floor(Math.random() * 1000000),
      referencePrice: (basePrice - changeValue).toFixed(2),
      openPrice: (basePrice - (changeValue / 2)).toFixed(2),
      highestPrice: changePercent > 0 ? (basePrice + (changeValue / 2)).toFixed(2) : basePrice.toFixed(2),
      lowestPrice: changePercent > 0 ? basePrice.toFixed(2) : (basePrice - changeValue - (changeValue / 2)).toFixed(2),
      lastUpdated: new Date().toISOString()
    };
  });
  
  return {
    value: {
      data: enhancedStocks
    }
  };
};

export default axiosInstance;