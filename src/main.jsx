import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { ThemeProvider } from '@/components/theme-provider'
import signalRService from './api/signalRService'

// Khởi tạo kết nối SignalR
const initSignalR = async () => {
  try {
    console.log("Initializing SignalR connections");
    
    // Khởi tạo kết nối với StockDataHub
    try {
      await signalRService.startStockConnection();
      console.log("StockDataHub connection initialized");
      
      // Thiết lập các listener cho stock updates
      await signalRService.setupStockListeners();
      console.log("Stock update listeners registered");
    } catch (stockError) {
      console.error("StockDataHub connection failed:", stockError.message);
    }
  } catch (error) {
    console.error("Error initializing SignalR:", error);
  }
};

// Khởi tạo SignalR sau khi các thành phần khác đã tải
setTimeout(() => {
  initSignalR().catch(error => {
    console.error("Error in SignalR initialization:", error);
  });
}, 1000); // Delay 1 giây trước khi khởi tạo

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
)
