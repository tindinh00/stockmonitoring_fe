import axios from 'axios';

// Create a specific instance for Gemini API
const geminiAxiosInstance = axios.create({
  baseURL: '/ai-api', // Using Vite proxy
  headers: {
    'Content-Type': 'application/json',
    'Accept': '*/*'
  }
});

export const geminiService = {
  // Gửi text để phân tích
  analyzeText: async (text) => {
    try {
      const response = await geminiAxiosInstance.post(
        '/gemini/analyze/text',
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
        '/gemini/analyze/file',
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