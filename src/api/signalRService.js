import { HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr';

const BASE_URL = "https://stockmonitoring-api-stock-service.onrender.com";

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
    };
  }

  async startStockConnection() {
    const { connection, isConnecting, attempts, maxAttempts, retryDelay } = this.state;

    if (isConnecting) return this.state.connectionPromise;
    if (connection?.state === 'Connected') return connection;
    if (attempts >= maxAttempts) {
      this.state.failed = true;
      throw new Error('Max connection attempts exceeded');
    }

    this.state.attempts++;
    this.state.isConnecting = true;
    console.log(`[SignalR-Stock] Attempt ${this.state.attempts}/${maxAttempts}`);

    this.state.connectionPromise = this.state.connectionPromise || new Promise((resolve, reject) => {
      // Lưu reject để có thể sử dụng trong timeout
      let timeoutId;
      
      const connectToHub = async () => {
        try {
          // Thiết lập timeout để reject nếu kết nối quá lâu
          timeoutId = setTimeout(() => {
            this.state.isConnecting = false;
            this.state.failed = true;
            // Reject promise thay vì throw error
            reject(new Error('Connection timeout'));
          }, 15000);

          console.log("[SignalR-Stock] Connecting to hub URL:", `${BASE_URL}/stockDataHub`);
          const connectionConfig = {
            transport: HttpTransportType.WebSockets,
            skipNegotiation: false,
            withCredentials: false,
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
          };

          this.state.connection = new HubConnectionBuilder()
            .withUrl(`${BASE_URL}/stockDataHub`, connectionConfig)
            .configureLogging(LogLevel.Debug)
            .withAutomaticReconnect([0, 2000, 5000, 10000])
            .build();

          this.state.connection.onclose((error) => {
            console.error('[SignalR-Stock] Connection Closed:', error);
            this.state.lastError = error;
            this.resetConnection();
            if (error && !error.isClean) {
              setTimeout(() => this.startStockConnection(), retryDelay);
            }
          });

          this.state.connection.onreconnected((id) => {
            console.log('[SignalR-Stock] Reconnected:', id);
          });
          
          this.state.connection.onreconnecting((err) => {
            console.log('[SignalR-Stock] Reconnecting:', err);
          });

          await this.state.connection.start();
          console.log('[SignalR-Stock] Connected Successfully');
          clearTimeout(timeoutId);
          this.state.isConnecting = false;
          this.state.failed = false;
          this.state.attempts = 0;
          resolve(this.state.connection);
        } catch (error) {
          clearTimeout(timeoutId);
          console.error('[SignalR-Stock] Error starting connection:', error);
          this.state.lastError = error;
          this.state.isConnecting = false;
          this.state.connectionPromise = null;
          if (this.state.attempts < maxAttempts) {
            console.log(`[SignalR-Stock] Will retry in ${retryDelay}ms`);
            setTimeout(() => this.startStockConnection(), retryDelay);
            // Không reject ở đây vì sẽ có retry
          } else {
            this.state.failed = true;
            reject(error);
          }
        }
      };

      // Bắt đầu kết nối
      connectToHub();
    });

    return this.state.connectionPromise;
  }

  resetConnection() {
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
        // Don't return anything
      });
      
      this.onStock("ReceiveHNXStockUpdate", (data) => {
        console.log("[SignalR-Stock] Received HNX stock update:", data);
        // Don't return anything
      });
      
      console.log("[SignalR-Stock] Stock update listeners setup complete");
      return { success: true, message: "Stock update listeners registered successfully" };
    } else {
      console.error("[SignalR-Stock] Connection not in Connected state");
      return { success: false, message: "Connection not available" };
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
}

const signalRService = new SignalRService();
signalRService.startStockConnection().then(() => {
  signalRService.setupStockListeners();
}).catch(error => {
  console.error("[SignalR-Stock] Initial connection failed:", error);
});
export default signalRService;
export const stockConnection = signalRService.getStockConnection();