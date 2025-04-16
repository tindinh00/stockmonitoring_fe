import { HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr';
import Cookies from 'js-cookie';

const BASE_URL = "https://stockmonitoring-api-gateway.onrender.com";
const STOCK_HUB_URL = `${BASE_URL}/stockDataHub`;

class SignalRService {
  constructor() {
    this.state = {
      connection: null,
      isConnecting: false,
      eventHandlers: new Map(),
      connectionPromise: null
    };

    // Initialize connection when service is created
    this.initializeConnection();
  }

  async initializeConnection() {
    if (this.state.connection || this.state.isConnecting) {
      return this.state.connectionPromise;
    }

    console.log("[SignalR-Stock] Initializing connection");
    this.state.isConnecting = true;

    try {
      const token = Cookies.get('auth_token');
      if (!token) {
        console.warn("[SignalR-Stock] No auth token found");
        this.state.isConnecting = false;
        return null;
      }

      this.state.connection = new HubConnectionBuilder()
        .withUrl(STOCK_HUB_URL, {
          accessTokenFactory: () => token,
          withCredentials: true,
          skipNegotiation: true,
          transport: HttpTransportType.WebSockets
        })
        .configureLogging(LogLevel.Information)
        .withAutomaticReconnect([0, 2000, 5000, 10000, 20000]) // Retry intervals in milliseconds
        .build();

      // Set up connection event handlers
      this.setupConnectionHandlers();

      // Create connection promise
      this.state.connectionPromise = this.startConnection();
      return await this.state.connectionPromise;
    } catch (error) {
      console.error("[SignalR-Stock] Failed to initialize connection:", error);
      this.state.isConnecting = false;
      this.state.connectionPromise = null;
      return null;
    }
  }

  setupConnectionHandlers() {
    if (!this.state.connection) return;

    this.state.connection.onreconnecting(error => {
      console.log("[SignalR-Stock] Connection lost. Attempting to reconnect...", error);
      window.dispatchEvent(new CustomEvent('signalrConnectionStatus', { 
        detail: { status: 'reconnecting', error } 
      }));
    });

    this.state.connection.onreconnected(connectionId => {
      console.log("[SignalR-Stock] Connection reestablished. ID:", connectionId);
      window.dispatchEvent(new CustomEvent('signalrConnectionStatus', { 
        detail: { status: 'connected', connectionId } 
      }));
      // Re-setup listeners after reconnection
      this.setupStockListeners();
    });

    this.state.connection.onclose(error => {
      console.log("[SignalR-Stock] Connection closed", error);
      this.state.isConnecting = false;
      window.dispatchEvent(new CustomEvent('signalrConnectionStatus', { 
        detail: { status: 'disconnected', error } 
      }));
    });
  }

  async startConnection() {
    if (!this.state.connection) {
      return null;
    }

    try {
      await this.state.connection.start();
      console.log("[SignalR-Stock] Connection started successfully");
      this.state.isConnecting = false;
      window.dispatchEvent(new CustomEvent('signalrConnectionStatus', { 
        detail: { 
          status: 'connected', 
          connectionId: this.state.connection.connectionId 
        } 
      }));
      return this.state.connection;
    } catch (error) {
      console.error("[SignalR-Stock] Connection start failed:", error);
      this.state.isConnecting = false;
      window.dispatchEvent(new CustomEvent('signalrConnectionStatus', { 
        detail: { status: 'error', error } 
      }));

      // If the connection fails, try to reconnect after a delay
      setTimeout(() => {
        console.log("[SignalR-Stock] Attempting to reconnect...");
        this.state.connection = null;
        this.state.connectionPromise = null;
        this.initializeConnection();
      }, 5000);

      return null;
    }
  }

  async getConnection() {
    if (this.state.connection?.state === 'Connected') {
      return this.state.connection;
    }

    if (this.state.connectionPromise) {
      return await this.state.connectionPromise;
    }

    return await this.initializeConnection();
  }

  async setupStockListeners() {
    console.log("[SignalR-Stock] Setting up stock update listeners");
    
    try {
      const connection = await this.getConnection();
      if (!connection) {
        console.error("[SignalR-Stock] No active connection available");
        return { success: false, message: "No connection available" };
      }

      // Clear existing listeners
      connection.off("ReceiveHSXStockUpdate");
      connection.off("ReceiveHNXStockUpdate");

      let hsxRegistered = false;
      let hnxRegistered = false;

      try {
        this.onStock("ReceiveHSXStockUpdate", (data) => {
          hsxRegistered = true;
          console.log("[SignalR-Stock] HSX update received:", data);
          try {
            let stockData = typeof data === 'string' ? JSON.parse(data) : data;
            const timestamp = stockData.Timestamp || stockData.timestamp;
            if (timestamp) {
              window.dispatchEvent(new CustomEvent('stockUpdate', {
                detail: {
                  exchange: 'hsx',
                  timestamp: timestamp,
                  data: stockData
                }
              }));
            }
          } catch (error) {
            console.error("[SignalR-Stock] Error processing HSX update:", error);
          }
        });
      } catch (error) {
        console.error("[SignalR-Stock] Failed to register HSX listener:", error);
      }

      try {
        this.onStock("ReceiveHNXStockUpdate", (data) => {
          hnxRegistered = true;
          console.log("[SignalR-Stock] HNX update received:", data);
          try {
            let stockData = typeof data === 'string' ? JSON.parse(data) : data;
            const timestamp = stockData.Timestamp || stockData.timestamp;
            if (timestamp) {
              window.dispatchEvent(new CustomEvent('stockUpdate', {
                detail: {
                  exchange: 'hnx',
                  timestamp: timestamp,
                  data: stockData
                }
              }));
            }
          } catch (error) {
            console.error("[SignalR-Stock] Error processing HNX update:", error);
          }
        });
      } catch (error) {
        console.error("[SignalR-Stock] Failed to register HNX listener:", error);
      }

      console.log("[SignalR-Stock] Listener registration status:", {
        hsx: hsxRegistered,
        hnx: hnxRegistered
      });

      return { 
        success: true, 
        message: "Stock update listeners registered successfully",
        status: {
          connectionId: connection.connectionId,
          hsx: hsxRegistered,
          hnx: hnxRegistered
        }
      };
    } catch (error) {
      console.error("[SignalR-Stock] Error in setupStockListeners:", error);
      return { success: false, message: error.message };
    }
  }

  onStock(eventName, callback) {
    if (!this.state.connection) {
      console.warn(`[SignalR-Stock] Cannot register event ${eventName} - no active connection`);
      return;
    }

    const handlers = this.state.eventHandlers.get(eventName) || [];
    handlers.push(callback);
    this.state.eventHandlers.set(eventName, handlers);

    this.state.connection.on(eventName, (data) => {
      console.log(`[SignalR-Stock] Received ${eventName} event:`, data);
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[SignalR-Stock] Error in handler for ${eventName}:`, error);
        }
      });
    });
  }

  offStock(eventName) {
    if (!this.state.connection) {
      console.warn(`[SignalR-Stock] Cannot unregister - no active connection`);
      return;
    }
    
    this.state.eventHandlers.delete(eventName);
    this.state.connection.off(eventName);
  }

  async stop() {
    try {
      if (this.state.connection) {
        // Unregister all event handlers
        this.state.eventHandlers.clear();
        await this.state.connection.stop();
        console.log('[SignalR-Stock] Connection stopped');
      }
      this.state.connection = null;
      this.state.connectionPromise = null;
      this.state.isConnecting = false;
    } catch (error) {
      console.error('[SignalR-Stock] Error stopping connection:', error);
    }
  }
}

// Create a singleton instance
const signalRService = new SignalRService();

// Initialize connection when the service is imported
signalRService.getConnection().then(() => {
  signalRService.setupStockListeners();
}).catch(error => {
  console.error("[SignalR-Stock] Initial connection setup failed:", error);
});

export default signalRService;