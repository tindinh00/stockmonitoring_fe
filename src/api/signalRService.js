import { HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr';
import Cookies from 'js-cookie';
import axios from 'axios';

const BASE_URL = "https://stockmonitoring-api-gateway.onrender.com";
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
});

class SignalRService {
  constructor() {
    this.state = {
      connection: null,
      connectionPromise: null,
      eventHandlers: new Map(),
      attempts: 0,
      maxAttempts: 3,
      isConnecting: false,
      failed: false,
      lastError: null,
      retryDelay: 5000,
      reconnectTimer: null
    };
  }

  async startStockConnection() {
    if (this.state.isConnecting) return this.state.connectionPromise;
    if (this.state.connection?.state === 'Connected') return this.state.connection;
    
    this.state.isConnecting = true;
    this.state.attempts++;
    
    if (this.state.attempts > this.state.maxAttempts) {
      this.state.failed = true;
      this.state.isConnecting = false;
      throw new Error('Max connection attempts exceeded');
    }

    console.log(`[SignalR-Stock] Connection attempt ${this.state.attempts}/${this.state.maxAttempts}`);

    try {
      const token = Cookies.get('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const connectionConfig = {
        transport: HttpTransportType.WebSockets,
        skipNegotiation: false,
        withCredentials: false,
        accessTokenFactory: () => token
      };

      this.state.connection = new HubConnectionBuilder()
        .withUrl(`${BASE_URL}/stockDataHub`, connectionConfig)
        .configureLogging(LogLevel.Information)
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: retryContext => {
            if (retryContext.previousRetryCount === 0) {
              return 0;
            } else if (retryContext.previousRetryCount < 3) {
              return 2000;
            } else {
              return 5000;
            }
          }
        })
        .build();

      this.setupConnectionHandlers();
      await this.state.connection.start();
      
      console.log('[SignalR-Stock] Connected successfully');
      this.state.isConnecting = false;
      this.state.failed = false;
      this.state.attempts = 0;
      
      return this.state.connection;
    } catch (error) {
      console.error('[SignalR-Stock] Connection error:', error);
      this.state.lastError = error;
      this.state.isConnecting = false;
      
      if (this.state.attempts < this.state.maxAttempts) {
        console.log(`[SignalR-Stock] Retrying in ${this.state.retryDelay}ms`);
        await new Promise(resolve => setTimeout(resolve, this.state.retryDelay));
        return this.startStockConnection();
      }
      
      this.state.failed = true;
      throw error;
    }
  }

  setupConnectionHandlers() {
    if (!this.state.connection) return;

    this.state.connection.onclose(error => {
      console.error('[SignalR-Stock] Connection closed:', error);
      this.state.lastError = error;
      
      if (error) {
        this.resetConnection();
        if (!this.state.reconnectTimer) {
          this.state.reconnectTimer = setTimeout(() => {
            this.state.reconnectTimer = null;
            this.startStockConnection();
          }, this.state.retryDelay);
        }
      }
    });

    this.state.connection.onreconnecting(error => {
      console.log('[SignalR-Stock] Attempting to reconnect:', error);
      this.state.isConnecting = true;
    });

    this.state.connection.onreconnected(connectionId => {
      console.log('[SignalR-Stock] Reconnected. ConnectionId:', connectionId);
      this.state.isConnecting = false;
      this.state.failed = false;
      this.resubscribeToEvents();
    });
  }

  async resubscribeToEvents() {
    const handlers = Array.from(this.state.eventHandlers.entries());
    for (const [eventName, callbacks] of handlers) {
      for (const callback of callbacks) {
        await this.onStock(eventName, callback);
      }
    }
  }

  resetConnection() {
    if (this.state.reconnectTimer) {
      clearTimeout(this.state.reconnectTimer);
      this.state.reconnectTimer = null;
    }
    this.state.connection = null;
    this.state.connectionPromise = null;
  }

  isConnected() {
    const status = {
      stockHub: this.state.connection?.state === 'Connected',
      connectionFailed: this.state.failed,
      connectionAttempts: this.state.attempts,
      maxConnectionAttempts: this.state.maxAttempts
    };
    console.log("[SignalR-Stock] Connection Status:", status);
    return status;
  }

  normalizeData(data, eventName) {
    if (typeof data === 'object' && data !== null) {
      return {
        Message: data.Message || data.message || '',
        Timestamp: data.Timestamp || data.timestamp || new Date().toISOString(),
        Exchange: eventName.includes('HSX') ? 'HSX' : 'HNX',
      };
    }

    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return this.normalizeData(parsed, eventName);
      } catch (error) {
        const isHNX = eventName.includes("HNX") || data.includes("HNX");
        const stockCountMatch = data.match(/(\d+)\s+stocks/);
        const stockCount = stockCountMatch ? parseInt(stockCountMatch[1]) : 0;
        
        return {
          Message: data,
          Exchange: isHNX ? "HNX" : "HSX",
          Timestamp: new Date().toISOString(),
          StockCount: stockCount
        };
      }
    }
    return { 
      Message: String(data), 
      Timestamp: new Date().toISOString(), 
      Exchange: 'Unknown' 
    };
  }

  onStock(eventName, callback) {
    console.log(`[SignalR-Stock] Registering for event: ${eventName}`);
    if (!this.state.connection) {
      console.warn(`[SignalR-Stock] Cannot register event ${eventName} - no active connection`);
      return;
    }

    const handlers = this.state.eventHandlers.get(eventName) || [];
    handlers.push(callback);
    this.state.eventHandlers.set(eventName, handlers);

    // Sửa cách xử lý callback để đảm bảo không có Promise nào bị treo
    this.state.connection.on(eventName, (data) => {
      // Xử lý dữ liệu ngay lập tức để tránh bất đồng bộ trong quá trình chuẩn hóa
      const messageData = this.normalizeData(data, eventName);
      console.log(`[SignalR-Stock] Received ${eventName} event:`, data);
      console.log(`[SignalR-Stock] Processed ${eventName} data:`, messageData);
      
      // Bọc tất cả callback bằng try-catch và đảm bảo chúng không trả về Promise/true
      for (const handler of handlers) {
        // Tạo IIFE để có thể bắt và xử lý lỗi cho mỗi handler
        (async () => {
          try {
            // Nếu handler trả về Promise, await nó nhưng KHÔNG trả về bất kỳ giá trị nào
            // Điều này đảm bảo SignalR không chờ Promise hoàn thành
            await handler(messageData);
          } catch (error) {
            console.error(`[SignalR-Stock] Error in handler for ${eventName}:`, error);
          }
        })();
      }
    });
    
    console.log(`[SignalR-Stock] Successfully registered for ${eventName}`);
  }

  offStock(eventName, callback) {
    console.log(`[SignalR-Stock] Unregistering from event: ${eventName}`);
    if (!this.state.connection) {
      console.warn(`[SignalR-Stock] Cannot unregister - no active connection`);
      return;
    }
    
    const handlers = this.state.eventHandlers.get(eventName);
    if (!handlers) return;

    if (callback) {
      this.state.eventHandlers.set(eventName, handlers.filter(cb => cb !== callback));
    } else {
      this.state.eventHandlers.delete(eventName);
    }
    
    this.state.connection.off(eventName);
    console.log(`[SignalR-Stock] Unregistered from ${eventName}`);
  }

  async stop() {
    try {
      if (this.state.connection) {
        // Unregister all event handlers before stopping the connection
        for (const eventName of this.state.eventHandlers.keys()) {
          this.state.connection.off(eventName);
        }
        
        await this.state.connection.stop();
        console.log('[SignalR-Stock] Connection stopped');
      }
      this.resetConnection();
      this.state.eventHandlers.clear();
    } catch (error) {
      console.error('[SignalR-Stock] Error stopping connection:', error);
    }
  }

  async setupStockListeners() {
    console.log("[SignalR-Stock] Setting up stock update listeners");
    
    try {
      // Lấy userId từ cookies hoặc localStorage
      const userId = Cookies.get("user_id");
      if (!userId) {
        console.warn("[SignalR-Stock] No user ID found");
        return { success: false, message: "No user ID found" };
      }

      // Fetch watchlist data first
      console.log("[SignalR-Stock] Fetching initial watchlist data");
      const response = await axiosInstance.get(`/api/watchlist-stock/${userId}`);
      
      if (response?.data?.value) {
        // Emit event với dữ liệu watchlist ban đầu
        const event = new CustomEvent('watchlistUpdate', {
          detail: {
            data: response.data.value,
            isInitial: true
          }
        });
        window.dispatchEvent(event);
      }

      // Sau đó mới thiết lập SignalR connection
      if (!this.state.connection) {
        console.warn("[SignalR-Stock] No active connection, connecting first");
        await this.startStockConnection();
      }
      
      if (this.state.connection?.state === 'Connected') {
        console.log("[SignalR-Stock] Registering for HSX & HNX stock updates");
        
        // Ensure we don't register duplicate listeners
        this.offStock("ReceiveHSXStockUpdate");
        this.offStock("ReceiveHNXStockUpdate");
        
        // Register new listeners that won't return any value (to prevent SignalR from waiting)
        this.onStock("ReceiveHSXStockUpdate", (data) => {
          console.log("[SignalR-Stock] Received HSX stock update:", data);
          try {
            // Parse data if it's a string
            let stockData = data;
            if (typeof data === 'string') {
              try {
                stockData = JSON.parse(data);
              } catch (error) {
                console.warn("Failed to parse HSX update as JSON:", error);
              }
            }

            // Get timestamp from message
            const timestamp = stockData.Timestamp || stockData.timestamp;
            if (timestamp) {
              // Emit event for components to handle
              const event = new CustomEvent('stockUpdate', {
                detail: {
                  exchange: 'hsx',
                  timestamp: timestamp,
                  data: stockData
                }
              });
              window.dispatchEvent(event);
            }
          } catch (error) {
            console.error("Error processing HSX update:", error);
          }
        });
        
        this.onStock("ReceiveHNXStockUpdate", (data) => {
          console.log("[SignalR-Stock] Received HNX stock update:", data);
          try {
            // Parse data if it's a string
            let stockData = data;
            if (typeof data === 'string') {
              try {
                stockData = JSON.parse(data);
              } catch (error) {
                console.warn("Failed to parse HNX update as JSON:", error);
              }
            }

            // Get timestamp from message
            const timestamp = stockData.Timestamp || stockData.timestamp;
            if (timestamp) {
              // Emit event for components to handle
              const event = new CustomEvent('stockUpdate', {
                detail: {
                  exchange: 'hnx',
                  timestamp: timestamp,
                  data: stockData
                }
              });
              window.dispatchEvent(event);
            }
          } catch (error) {
            console.error("Error processing HNX update:", error);
          }
        });
        
        console.log("[SignalR-Stock] Stock update listeners setup complete");
        return { success: true, message: "Stock update listeners registered successfully" };
      } else {
        console.error("[SignalR-Stock] Connection not in Connected state");
        return { success: false, message: "Connection not available" };
      }
    } catch (error) {
      console.error("[SignalR-Stock] Error in setupStockListeners:", error);
      return { success: false, message: error.message };
    }
  }

  async invokeStock(methodName, ...args) {
    try {
      console.log(`[SignalR-Stock] Attempting to invoke method '${methodName}'`);
      if (methodName === "SubscribeToExchange" || methodName === "SubscribeToStock") {
        console.log("[SignalR-Stock] Using setupStockListeners instead");
        return await this.setupStockListeners();
      }
      
      if (!this.state.connection || this.state.connection.state !== 'Connected') {
        await this.startStockConnection();
      }
      
      if (methodName !== "GetConnectionId") {
        console.warn(`[SignalR-Stock] Method '${methodName}' may not exist, using GetConnectionId`);
        methodName = "GetConnectionId";
      }
      
      const result = await this.state.connection.invoke(methodName, ...args);
      console.log(`[SignalR-Stock] Method '${methodName}' executed successfully:`, result);
      return result;
    } catch (error) {
      console.error(`[SignalR-Stock] Error invoking '${methodName}':`, error);
      if (methodName === "GetConnectionId") {
        return { success: true, message: "Connection exists but method failed" };
      }
      return { success: false, error: error.message };
    }
  }

  getStockConnection() {
    return this.state.connection;
  }

  async setupNotificationListener(userId) {
    console.log("[SignalR-Notification] Setting up notification listener for user:", userId);
    
    try {
      if (!this.state.connection) {
        console.warn("[SignalR-Notification] No active connection, connecting first");
        await this.startStockConnection();
      }
      
      if (this.state.connection?.state === 'Connected') {
        // Đăng ký vào nhóm thông báo theo userId
        console.log("[SignalR-Notification] Attempting to join notification group for user:", userId);
        await this.state.connection.invoke("JoinNotificationGroup", userId);
        console.log("[SignalR-Notification] Successfully joined notification group");
        
        // Đăng ký lắng nghe sự kiện StockNotification
        console.log("[SignalR-Notification] Setting up StockNotification event handler");
        this.state.connection.off("StockNotification"); // Remove any existing handlers
        this.state.connection.on("StockNotification", (data) => {
          console.log("[SignalR-Notification] Received notification data:", data);
          
          // Emit event cho components xử lý
          const event = new CustomEvent('stockNotification', {
            detail: {
              message: data.message,
              time: data.time,
              userId: data.userId,
              exchange: data.exchange
            }
          });
          console.log("[SignalR-Notification] Dispatching stockNotification event");
          window.dispatchEvent(event);
        });
        
        return { success: true, message: "Notification listener setup complete" };
      } else {
        console.error("[SignalR-Notification] Connection not in Connected state:", this.state.connection?.state);
        return { success: false, message: "Connection not available" };
      }
    } catch (error) {
      console.error("[SignalR-Notification] Error setting up notification listener:", error);
      return { success: false, message: error.message };
    }
  }

  async leaveNotificationGroup(userId) {
    try {
      if (this.state.connection?.state === 'Connected') {
        await this.state.connection.invoke("LeaveNotificationGroup", userId);
        this.state.connection.off("StockNotification");
        console.log("[SignalR] Left notification group for user:", userId);
        return true;
      }
    } catch (error) {
      console.error("[SignalR] Error leaving notification group:", error);
    }
    return false;
  }
}

const signalRService = new SignalRService();
signalRService.startStockConnection().then(() => {
  signalRService.setupStockListeners();
}).catch(error => {
  console.error("[SignalR-Stock] Initial connection failed:", error);
});
export default signalRService;
export const stockConnection = signalRService.getStockConnection();