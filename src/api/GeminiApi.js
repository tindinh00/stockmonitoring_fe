import axios from 'axios';
import Cookies from 'js-cookie';

// Create a specific instance for Gemini API
const geminiAxiosInstance = axios.create({
  baseURL: 'https://stockmonitoring-api-gateway.onrender.com', // Using direct gateway URL
  headers: {
    'Content-Type': 'application/json',
    'Accept': '*/*'
  }
});

// Add request interceptor for authentication
geminiAxiosInstance.interceptors.request.use(
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

export const geminiService = {
  // Gửi text để phân tích
  analyzeText: async (text) => {
    try {
      const response = await geminiAxiosInstance.post(
        '/api/gemini/analyze/text',
        { text }
      );
      console.log("Analyze text response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Analyze text error:", error);
      throw error;
    }
  },

  // Upload file để phân tích
  analyzeFile: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await geminiAxiosInstance.post(
        '/api/gemini/analyze/file',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      console.log("Analyze file response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Analyze file error:", error);
      throw error;
    }
  }
}; 