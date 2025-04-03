import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/", // Đảm bảo đường dẫn đúng khi deploy
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist", //  Đảm bảo Vite xuất file vào thư mục dist
  },
  server: {
    historyApiFallback: true, //  Cần thiết nếu dùng React Router
    proxy: {
      // Proxy configuration to bypass CORS issues
      '/api': {
        target: 'https://stockmonitoring-api-stock-service.onrender.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },

  // contributed 
});
