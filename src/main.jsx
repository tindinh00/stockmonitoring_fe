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
      // Sử dụng phương thức getConnection có sẵn trong service
      const connection = await signalRService.getConnection();
      
      if (connection) {
        console.log("SignalR connection established successfully");
        
        // Thiết lập các listener cho stock updates và notifications
        await signalRService.setupStockListeners();
        await signalRService.setupNotificationListeners();
        console.log("SignalR listeners registered successfully");
      } else {
        console.error("Failed to establish SignalR connection");
      }
    } catch (error) {
      console.error("SignalR connection failed:", error);
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
    <ThemeProvider defaultTheme="dark" storageKey="theme">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
)
