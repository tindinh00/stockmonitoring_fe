import { HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr';
const BASE_URL = "https://stockmonitoring.onrender.com";

class SignalRService {
  constructor() {
    this.connection = null;
    this.connectionPromise = null;
    this.eventHandlers = {};
    this.stockConnection = null;
    this.stockConnectionPromise = null;
    this.stockEventHandlers = {};
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 2;
    this.isConnecting = false;
    this.connectionFailed = false;
  }

  async start() {
    // Se estiver tentando conectar ou já excedeu o número máximo de tentativas, evita tentativas múltiplas
    if (this.isConnecting || this.connectionAttempts >= this.maxConnectionAttempts) {
      if (this.connectionFailed) {
        return Promise.reject(new Error("Connection attempts exhausted"));
      }
      return this.connectionPromise;
    }

    // Se já estiver conectado, retorna a conexão atual
    if (this.connection && this.connection.state === 'Connected') {
      return this.connection;
    }

    // Contador de tentativas de conexão
    this.connectionAttempts++;
    this.isConnecting = true;

    // Se não tiver Promise de conexão, cria uma nova
    if (!this.connectionPromise) {
      this.connectionPromise = new Promise(async (resolve, reject) => {
        try {
          // Timeout para evitar problemas de conexão pendente
          const timeout = setTimeout(() => {
            this.isConnecting = false;
            this.connectionFailed = true;
            reject(new Error("Connection timeout"));
          }, 10000);

          // Configuração da conexão
          this.connection = new HubConnectionBuilder()
            .withUrl(`${BASE_URL}/appDataHub`, {
              skipNegotiation: true,
              transport: HttpTransportType.WebSockets,
              withCredentials: false
            })
            .configureLogging(LogLevel.Information)
            .withAutomaticReconnect([0, 2000, 5000])
            .build();

          // Setup de eventos
          this.connection.onclose((error) => {
            console.log('SignalR Connection Closed', error);
            this.connection = null;
            this.connectionPromise = null;
          });

          this.connection.onreconnected((connectionId) => {
            console.log('SignalR Reconnected', connectionId);
          });

          this.connection.onreconnecting((error) => {
            console.log('SignalR Reconnecting', error);
          });

          // Inicia a conexão com timeout
          await this.connection.start();
          clearTimeout(timeout);
          
          console.log('SignalR Connected');
          this.isConnecting = false;
          resolve(this.connection);
        } catch (error) {
          console.error('Error starting SignalR connection:', error);
          this.isConnecting = false;
          
          if (this.connectionAttempts >= this.maxConnectionAttempts) {
            this.connectionFailed = true;
          }
          
          this.connectionPromise = null;
          reject(error);
        }
      });
    }

    return this.connectionPromise;
  }

  // Método para iniciar conexão com StockDataHub
  async startStockConnection() {
    // Evita tentativas múltiplas ou depois de falhas excessivas
    if (this.isConnecting || this.connectionAttempts >= this.maxConnectionAttempts) {
      if (this.connectionFailed) {
        return Promise.reject(new Error("Connection attempts exhausted"));
      }
      return this.stockConnectionPromise;
    }

    // Se já estiver conectado, retorna a conexão atual
    if (this.stockConnection && this.stockConnection.state === 'Connected') {
      return this.stockConnection;
    }

    // Contador de tentativas
    this.connectionAttempts++;
    this.isConnecting = true;

    // Se não tiver Promise de conexão, cria uma nova
    if (!this.stockConnectionPromise) {
      this.stockConnectionPromise = new Promise(async (resolve, reject) => {
        try {
          // Timeout para evitar problemas de conexão pendente
          const timeout = setTimeout(() => {
            this.isConnecting = false;
            this.connectionFailed = true;
            reject(new Error("Stock connection timeout"));
          }, 10000);

          // Configuração da conexão
          this.stockConnection = new HubConnectionBuilder()
            .withUrl(`${BASE_URL}/stockDataHub`, {
              skipNegotiation: true,
              transport: HttpTransportType.WebSockets,
              withCredentials: false
            })
            .configureLogging(LogLevel.Information)
            .withAutomaticReconnect([0, 2000, 5000])
            .build();

          // Setup de eventos
          this.stockConnection.onclose((error) => {
            console.log('Stock SignalR Connection Closed', error);
            this.stockConnection = null;
            this.stockConnectionPromise = null;
          });

          this.stockConnection.onreconnected((connectionId) => {
            console.log('Stock SignalR Reconnected', connectionId);
          });

          this.stockConnection.onreconnecting((error) => {
            console.log('Stock SignalR Reconnecting', error);
          });

          // Inicia a conexão com timeout
          await this.stockConnection.start();
          clearTimeout(timeout);
          
          console.log('Stock SignalR Connected');
          this.isConnecting = false;
          resolve(this.stockConnection);
        } catch (error) {
          console.error('Error starting Stock SignalR connection:', error);
          this.isConnecting = false;
          
          if (this.connectionAttempts >= this.maxConnectionAttempts) {
            this.connectionFailed = true;
          }
          
          this.stockConnectionPromise = null;
          reject(error);
        }
      });
    }

    return this.stockConnectionPromise;
  }

  // Método para verificar status da conexão
  isConnected() {
    return {
      appHub: this.connection && this.connection.state === 'Connected',
      stockHub: this.stockConnection && this.stockConnection.state === 'Connected',
      connectionFailed: this.connectionFailed
    };
  }

  // Phương thức để đăng ký lắng nghe sự kiện từ AppDataHub
  on(eventName, callback) {
    if (!this.connection) {
      console.warn(`Cannot register event ${eventName} without an active connection`);
      return;
    }

    // Lưu trữ callback cho sự kiện này
    if (!this.eventHandlers[eventName]) {
      this.eventHandlers[eventName] = [];
    }
    this.eventHandlers[eventName].push(callback);

    // Đăng ký lắng nghe sự kiện với SignalR
    this.connection.on(eventName, (data) => {
      console.log(`Received ${eventName} event:`, data);
      
      // Gọi tất cả callbacks đã đăng ký cho sự kiện này
      if (this.eventHandlers[eventName]) {
        this.eventHandlers[eventName].forEach(cb => cb(data));
      }
    });
  }

  // Phương thức để hủy đăng ký lắng nghe sự kiện từ AppDataHub
  off(eventName, callback) {
    if (!this.connection) {
      console.warn(`Cannot unregister event ${eventName} without an active connection`);
      return;
    }

    // Nếu có callback cụ thể, chỉ xóa callback đó
    if (callback && this.eventHandlers[eventName]) {
      this.eventHandlers[eventName] = this.eventHandlers[eventName].filter(cb => cb !== callback);
    } else {
      // Nếu không có callback cụ thể, xóa tất cả callbacks cho sự kiện này
      delete this.eventHandlers[eventName];
    }

    // Hủy đăng ký sự kiện với SignalR
    this.connection.off(eventName);
  }

  // Phương thức để đăng ký lắng nghe sự kiện từ StockDataHub
  onStock(eventName, callback) {
    if (!this.stockConnection) {
      console.warn(`Cannot register stock event ${eventName} without an active connection`);
      return;
    }

    // Lưu trữ callback cho sự kiện này
    if (!this.stockEventHandlers[eventName]) {
      this.stockEventHandlers[eventName] = [];
    }
    this.stockEventHandlers[eventName].push(callback);

    // Đăng ký lắng nghe sự kiện với SignalR
    this.stockConnection.on(eventName, (data) => {
      console.log(`Received stock ${eventName} event:`, data);
      
      // Gọi tất cả callbacks đã đăng ký cho sự kiện này
      if (this.stockEventHandlers[eventName]) {
        this.stockEventHandlers[eventName].forEach(cb => cb(data));
      }
    });
  }

  // Phương thức để hủy đăng ký lắng nghe sự kiện từ StockDataHub
  offStock(eventName, callback) {
    if (!this.stockConnection) {
      console.warn(`Cannot unregister stock event ${eventName} without an active connection`);
      return;
    }

    // Nếu có callback cụ thể, chỉ xóa callback đó
    if (callback && this.stockEventHandlers[eventName]) {
      this.stockEventHandlers[eventName] = this.stockEventHandlers[eventName].filter(cb => cb !== callback);
    } else {
      // Nếu không có callback cụ thể, xóa tất cả callbacks cho sự kiện này
      delete this.stockEventHandlers[eventName];
    }

    // Hủy đăng ký sự kiện với SignalR
    this.stockConnection.off(eventName);
  }

  // Phương thức để dừng tất cả các kết nối
  async stop() {
    try {
      if (this.connection) {
        await this.connection.stop();
        console.log('AppData SignalR connection stopped');
      }
      
      if (this.stockConnection) {
        await this.stockConnection.stop();
        console.log('Stock SignalR connection stopped');
      }
      
      this.connection = null;
      this.connectionPromise = null;
      this.eventHandlers = {};
      
      this.stockConnection = null;
      this.stockConnectionPromise = null;
      this.stockEventHandlers = {};
    } catch (error) {
      console.error('Error stopping SignalR connections:', error);
    }
  }

  // Thêm các phương thức invoke để gửi yêu cầu đến server
  async invoke(methodName, ...args) {
    try {
      if (!this.connection) {
        await this.start();
      }
      return await this.connection.invoke(methodName, ...args);
    } catch (error) {
      console.error(`Error invoking method ${methodName}:`, error);
      throw error;
    }
  }

  async invokeStock(methodName, ...args) {
    try {
      if (!this.stockConnection) {
        await this.startStockConnection();
      }
      return await this.stockConnection.invoke(methodName, ...args);
    } catch (error) {
      console.error(`Error invoking stock method ${methodName}:`, error);
      throw error;
    }
  }
}

const signalRService = new SignalRService();
export default signalRService;