import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/", // 🔥 Đảm bảo đường dẫn đúng khi deploy
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist", // 🏗️ Đảm bảo Vite xuất file vào thư mục dist
  },
  server: {
    historyApiFallback: true, // 📌 Cần thiết nếu dùng React Router
  },
});
