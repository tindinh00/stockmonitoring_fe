import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { ThemeProvider } from '@/components/theme-provider'
import signalRService from './api/signalRService'

// Inicialização do SignalR com retry e fallback
const initSignalR = async () => {
  try {
    // Tentativa de inicializar AppDataHub
    try {
      await signalRService.start();
      console.log('AppDataHub connection initialized');
    } catch (error) {
      console.warn('AppDataHub connection failed, will use polling fallback:', error.message);
    }
    
    // Tentativa de inicializar StockDataHub
    try {
      await signalRService.startStockConnection();
      console.log('StockDataHub connection initialized');
    } catch (error) {
      console.warn('StockDataHub connection failed, will use polling fallback:', error.message);
    }
    
    // Verificar status final das conexões
    const connectionStatus = signalRService.isConnected();
    if (!connectionStatus.appHub && !connectionStatus.stockHub) {
      console.info('Using polling fallback for all data updates');
    } else if (!connectionStatus.appHub) {
      console.info('Using polling fallback for app data updates');
    } else if (!connectionStatus.stockHub) {
      console.info('Using polling fallback for stock data updates');
    }
  } catch (error) {
    console.error('SignalR initialization error:', error);
  }
};

// Inicializar após um pequeno atraso para garantir que o restante do app carregue primeiro
setTimeout(() => {
  initSignalR();
}, 1000);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
)
