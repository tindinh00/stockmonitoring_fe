import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Trash2, Terminal, Settings, Save, RefreshCw, Clock, ToggleLeft, ToggleRight, X, Edit, CheckCircle2, AlertCircle, ChevronRight, RotateCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import signalRService from '../../api/signalRService';
import axios from 'axios';
import Cookies from 'js-cookie';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const API_URL = "https://stockmonitoring-api-gateway.onrender.com";

// Create axios instance with auth header
const createAuthHeader = () => {
  const token = Cookies.get('auth_token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

export default function DataManagementPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const scrollAreaRef = useRef(null);
  const contentRef = useRef(null);
  
  // Scraper config states
  const [scraperConfigs, setScraperConfigs] = useState([]);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [updatingConfig, setUpdatingConfig] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [editedValues, setEditedValues] = useState({});
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Sử dụng DOM trực tiếp để cuộn xuống dưới
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      try {
        // Tìm phần tử cuộn thực tế trong ScrollArea
        const scrollableElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollableElement) {
          // Sử dụng timeout để đảm bảo cuộn sau khi DOM đã cập nhật
          setTimeout(() => {
            scrollableElement.scrollTop = scrollableElement.scrollHeight;
          }, 0);
        } else if (contentRef.current) {
          // Phương pháp dự phòng
          contentRef.current.scrollIntoView({ behavior: 'auto' });
        }
      } catch (error) {
        console.error("Error scrolling to bottom:", error);
      }
    }
  };

  const fetchScraperConfigs = async () => {
    setLoadingConfigs(true);
    try {
      const response = await axios.get(`${API_URL}/api/scrapper-config`, createAuthHeader());
      if (response.data.value && response.data.value.data) {
        setScraperConfigs(response.data.value.data);
      }
    } catch (error) {
      console.error("Error fetching scraper configs:", error);
      toast.error("Không thể tải cấu hình scraper");
    } finally {
      setLoadingConfigs(false);
    }
  };

  const updateScraperConfig = async () => {
    if (!editingConfig || !editedValues) return;
    
    setUpdatingConfig(true);
    try {
      const currentConfig = scraperConfigs.find(config => config.id === editingConfig.id);
      const updatedData = {
        name: currentConfig.name,
        isActive: editedValues.isActive !== undefined 
          ? editedValues.isActive 
          : currentConfig.isActive,
        isPeriodicScraping: editedValues.isPeriodicScraping !== undefined 
          ? editedValues.isPeriodicScraping 
          : currentConfig.isPeriodicScraping,
        isContinuousScraping: editedValues.isContinuousScraping !== undefined 
          ? editedValues.isContinuousScraping 
          : currentConfig.isContinuousScraping,
        periodicIntervalMinutes: editedValues.isPeriodicScraping ? editedValues.periodicIntervalMinutes : currentConfig.periodicIntervalMinutes,
        continuousIntervalMinutes: editedValues.isContinuousScraping ? editedValues.continuousIntervalMinutes : currentConfig.continuousIntervalMinutes
      };
      
      // Validate rules
      if (updatedData.isPeriodicScraping === updatedData.isContinuousScraping) {
        toast.error("Chỉ có thể bật một trong hai chế độ thu thập định kỳ hoặc liên tục");
        return;
      }
      
      if (updatedData.isPeriodicScraping && 
          updatedData.periodicIntervalMinutes < currentConfig.minPeriodicInterval) {
        toast.error(`Khoảng thời gian thu thập định kỳ phải lớn hơn hoặc bằng ${currentConfig.minPeriodicInterval} phút`);
        return;
      }
      
      if (updatedData.isContinuousScraping && 
          updatedData.continuousIntervalMinutes < currentConfig.minContinuousInterval) {
        toast.error(`Khoảng thời gian thu thập liên tục phải lớn hơn hoặc bằng ${currentConfig.minContinuousInterval} phút`);
        return;
      }
      
      await axios.put(`${API_URL}/api/scrapper-config`, updatedData, createAuthHeader());
      
      // Update local state
      setScraperConfigs(prev => 
        prev.map(config => 
          config.id === currentConfig.id 
            ? { ...config, ...updatedData }
            : config
        )
      );
      
      toast.success("Cập nhật cấu hình thành công");
      setConfigDialogOpen(false);
      setEditingConfig(null);
      setEditedValues({});
    } catch (error) {
      console.error("Error updating scraper config:", error);
      toast.error("Không thể cập nhật cấu hình scraper");
    } finally {
      setUpdatingConfig(false);
    }
  };

  const handleEditConfig = (config) => {
    // Tách số phút thành phút và giây
    const periodicMinutes = Math.floor(config.periodicIntervalMinutes);
    const periodicSeconds = Math.round((config.periodicIntervalMinutes - periodicMinutes) * 60);
    
    const continuousMinutes = Math.floor(config.continuousIntervalMinutes);
    const continuousSeconds = Math.round((config.continuousIntervalMinutes - continuousMinutes) * 60);
    
    setEditingConfig(config);
    setEditedValues({
      isActive: config.isActive,
      isPeriodicScraping: config.isPeriodicScraping,
      isContinuousScraping: config.isContinuousScraping,
      periodicIntervalMinutes: config.periodicIntervalMinutes,
      continuousIntervalMinutes: config.continuousIntervalMinutes,
      // Thêm các giá trị mới cho phút và giây
      periodicMinutes,
      periodicSeconds,
      continuousMinutes,
      continuousSeconds
    });
    setConfigDialogOpen(true);
  };

  // Thêm hàm định dạng hiển thị phút và giây
  const formatTimeDisplay = (minutes) => {
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    
    if (mins === 0) {
      return `${secs} giây`;
    } else if (secs === 0) {
      return `${mins} phút`;
    } else {
      return `${mins} phút ${secs} giây`;
    }
  };

  // Hàm chuyển đổi phút và giây thành số phút (có phần thập phân)
  const convertToMinutes = (minutes, seconds) => {
    return parseFloat(minutes) + (parseFloat(seconds) / 60);
  };

  const handleValueChange = (field, value) => {
    setEditedValues(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Nếu cập nhật phút hoặc giây, tính lại số phút tổng
    if (field === 'periodicMinutes' || field === 'periodicSeconds') {
      const minutes = field === 'periodicMinutes' ? value : prev.periodicMinutes || 0;
      const seconds = field === 'periodicSeconds' ? value : prev.periodicSeconds || 0;
      setEditedValues(prev => ({
        ...prev,
        periodicIntervalMinutes: convertToMinutes(minutes, seconds)
      }));
    } else if (field === 'continuousMinutes' || field === 'continuousSeconds') {
      const minutes = field === 'continuousMinutes' ? value : prev.continuousMinutes || 0;
      const seconds = field === 'continuousSeconds' ? value : prev.continuousSeconds || 0;
      setEditedValues(prev => ({
        ...prev,
        continuousIntervalMinutes: convertToMinutes(minutes, seconds)
      }));
    }
    
    // If toggling scraping mode, make sure they're mutually exclusive
    if (field === 'isPeriodicScraping' && value === true) {
      setEditedValues(prev => ({
        ...prev,
        isContinuousScraping: false
      }));
    } else if (field === 'isContinuousScraping' && value === true) {
      setEditedValues(prev => ({
        ...prev,
        isPeriodicScraping: false
      }));
    }
  };

  const setupScraperLogListener = async () => {
    try {
      setLoading(true);
      
      const connection = await signalRService.getConnection();
      if (!connection) {
        console.error("No active SignalR connection available");
        setConnectionStatus('disconnected');
        return false;
      }

      setConnectionStatus('connected');
      console.log("[DataManagementPage] Setting up scrapper log listener");
      
      return true;
    } catch (error) {
      console.error("[DataManagementPage] Error in setupScraperLogListener:", error);
      setConnectionStatus('disconnected');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleScrapperLog = (e) => {
    console.log("[DataManagementPage] Scrapper log event received:", e.detail);
    try {
      let messageData = typeof e.detail === 'string' ? JSON.parse(e.detail) : e.detail;
      
      // Đảm bảo dữ liệu có định dạng đúng
      const logEntry = {
        // Nếu messageData có thuộc tính message, sử dụng nó
        // Nếu không, kiểm tra Message hoặc dữ liệu nguyên bản
        message: messageData.message || messageData.Message || 
                 (typeof messageData === 'string' ? messageData : JSON.stringify(messageData))
      };
      
      setLogs(prevLogs => {
        // Keep only the last 1000 logs to prevent memory issues
        const newLogs = [...prevLogs, logEntry];
        if (newLogs.length > 1000) {
          return newLogs.slice(-1000);
        }
        return newLogs;
      });
      
      // Khi nhận được tin nhắn mới, đánh dấu đã kết nối
      if (connectionStatus !== 'connected') {
        setConnectionStatus('connected');
      }
    } catch (error) {
      console.error("[DataManagementPage] Error processing scrapper log:", error);
    }
  };

  const handleConnectionStatusChange = (e) => {
    const status = e.detail.status;
    setConnectionStatus(status);
    
    if (status === 'connected') {
      setupScraperLogListener();
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  // Kiểm tra kết nối định kỳ
  useEffect(() => {
    const checkConnection = async () => {
      const connection = await signalRService.getConnection();
      if (connection) {
        setConnectionStatus('connected');
      } else if (connectionStatus !== 'connecting') {
        setConnectionStatus('disconnected');
      }
    };
    
    // Kiểm tra kết nối ban đầu
    checkConnection();
    
    // Kiểm tra kết nối mỗi 30 giây
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, [connectionStatus]);

  useEffect(() => {
    // Register connection status listener
    window.addEventListener('signalrConnectionStatus', handleConnectionStatusChange);
    
    // Register scrapper log listener
    window.addEventListener('scrapperLog', handleScrapperLog);
    
    // Setup log listener
    setupScraperLogListener();
    
    // Fetch scraper configs
    fetchScraperConfigs();
    
    return () => {
      window.removeEventListener('signalrConnectionStatus', handleConnectionStatusChange);
      window.removeEventListener('scrapperLog', handleScrapperLog);
    };
  }, []);

  // Sử dụng useLayoutEffect để đảm bảo cuộn xuống sau khi DOM đã được cập nhật
  useLayoutEffect(() => {
    if (logs.length > 0) {
      scrollToBottom();
    }
  }, [logs]);

  const getConnectionInfo = () => {
    // Nếu có logs nhưng trạng thái là disconnected, coi như vẫn connected
    if (logs.length > 0 && connectionStatus === 'disconnected') {
      return { status: 'connected', text: 'Đã kết nối' };
    }
    
    switch(connectionStatus) {
      case 'connected':
        return { status: 'connected', text: 'Đã kết nối' };
      case 'connecting':
        return { status: 'connecting', text: 'Đang kết nối...' };
      case 'reconnecting':
        return { status: 'reconnecting', text: 'Đang kết nối lại...' };
      default:
        return { status: 'disconnected', text: 'Chưa kết nối' };
    }
  };

  const connectionInfo = getConnectionInfo();
  
  const formatInterval = (minutes) => {
    // If less than 1 minute, show in seconds
    if (minutes < 1) {
      return `${Math.round(minutes * 60)} giây`;
    }
    // If less than 60 minutes, show in minutes
    if (minutes < 60) {
      return `${minutes} phút`;
    }
    // Otherwise show in hours and minutes
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 
      ? `${hours} giờ ${remainingMinutes} phút` 
      : `${hours} giờ`;
  };

  const handleResetSystem = async () => {
    try {
      setIsResetting(true);
      const token = Cookies.get('auth_token');
      const response = await axios.get(`${API_URL}/api/remote/reset-background-service/linux`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.value && response.data.value.status === 200) {
        toast.success("Đã khởi động lại hệ thống cào dữ liệu thành công");
        setResetDialogOpen(false);
      } else {
        toast.error("Không thể khởi động lại hệ thống cào dữ liệu");
      }
    } catch (error) {
      console.error("Error resetting scraping system:", error);
      toast.error("Đã xảy ra lỗi khi khởi động lại hệ thống cào dữ liệu");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="w-full h-full p-2 sm:p-4 md:p-6 bg-gradient-to-b from-background/80 via-background to-background/90">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold mb-2 text-foreground/90 flex items-center gap-2">
            <Settings className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            Quản lý hệ thống
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Quản lý nhật ký và cấu hình hệ thống thu thập dữ liệu</p>
          <div className="w-20 h-1 bg-primary/70 rounded-full mt-2"></div>
        </div>

        <Tabs defaultValue="logs" className="w-full space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 rounded-md p-1 md:p-1.5 overflow-hidden border border-border/50 shadow-md bg-background/90 backdrop-blur-sm">
            <TabsTrigger value="logs" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-300 py-1.5 md:py-2.5 text-xs sm:text-sm gap-1 md:gap-2">
              <Terminal className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden xs:inline">Nhật ký</span>
              <span className="inline xs:hidden">Logs</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-300 py-1.5 md:py-2.5 text-xs sm:text-sm gap-1 md:gap-2">
              <Settings className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden xs:inline">Cấu hình Scraper</span>
              <span className="inline xs:hidden">Cấu hình</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="logs" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
            <Card className="bg-[#0a0a14] border-gray-800 shadow-lg h-full rounded-md overflow-hidden transition-all duration-300 hover:shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between py-2 sm:py-3 px-3 sm:px-4 border-b border-gray-800 bg-gradient-to-r from-[#0e0e1a] to-[#141428]">
                <div className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                  <Terminal className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span className="hidden sm:inline">Nhật ký hệ thống</span>
                  <span className="inline sm:hidden">Nhật ký</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Badge className={`${
                    connectionInfo.status === 'connected' ? 'bg-blue-600 hover:bg-blue-700' : 
                    connectionInfo.status === 'connecting' || connectionInfo.status === 'reconnecting' ? 'bg-yellow-600 hover:bg-yellow-700' : 
                    'bg-red-600 hover:bg-red-700'
                  } transition-all duration-300 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium rounded-md h-7 sm:h-8 min-w-[80px] sm:min-w-[120px] flex items-center justify-center`}>
                    <div className={`h-2 w-2 rounded-full mr-1 sm:mr-2 ${
                      connectionInfo.status === 'connected' ? 'bg-green-300' : 
                      connectionInfo.status === 'connecting' || connectionInfo.status === 'reconnecting' ? 'bg-yellow-300' : 
                      'bg-red-300'
                    } animate-pulse`}></div>
                    <span className="hidden xs:inline">{connectionInfo.text}</span>
                    <span className="inline xs:hidden text-white">
                      {connectionInfo.status === 'connected' ? 'Kết nối' : 
                       connectionInfo.status === 'connecting' ? 'Đang kết nối' : 
                       connectionInfo.status === 'reconnecting' ? 'Kết nối lại' : 
                       'Mất kết nối'}
                    </span>
                  </Badge>
                  <Button 
                    variant="destructive"
                    size="sm"
                    className="bg-red-800 hover:bg-red-700 text-white h-7 sm:h-8 px-2 sm:px-3 min-w-[50px] sm:min-w-[120px] transition-colors duration-200 rounded-md"
                    onClick={clearLogs}
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Xóa nhật ký</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="w-full h-full">
                  <div className="bg-gradient-to-r from-[#11111f] to-[#16162d] border-b border-gray-800 px-4 py-2.5 flex items-center text-green-400">
                    <Terminal className="h-4 w-4 mr-2" />
                    <span className="text-sm font-semibold">Nhật ký Scrapper</span>
                    <span className="ml-auto text-xs text-gray-400 bg-[#1a1a2e] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md">
                      {logs.length} 
                      <span className="hidden xs:inline"> thông báo</span>
                    </span>
                  </div>
                  <div ref={scrollAreaRef} className="relative">
                    <ScrollArea 
                      className="h-[calc(100vh-400px)] sm:h-[calc(100vh-450px)] w-full"
                    >
                      <div className="p-4 bg-[#0a0a14] font-mono text-sm">
                        {logs.length === 0 ? (
                          <div className="text-gray-500 text-center py-16 flex flex-col items-center justify-center">
                            {loading ? (
                              <>
                                <div className="relative">
                                  <RefreshCw className="h-10 w-10 animate-spin mb-4 text-primary opacity-70" />
                                  <div className="absolute inset-0 h-10 w-10 rounded-full border-t-2 border-primary animate-ping opacity-20"></div>
                                </div>
                                <span className="text-base">Đang kết nối...</span>
                              </>
                            ) : (
                              <>
                                <div className="w-16 h-16 rounded-full bg-[#12121f] flex items-center justify-center mb-4">
                                  <Terminal className="h-8 w-8 text-gray-600" />
                                </div>
                                <span className="text-base">Chưa có nhật ký. Đang chờ dữ liệu từ hệ thống...</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <>
                            {logs.map((log, index) => (
                              <div key={index} className="mb-1.5 pl-2 border-l border-green-900/30 group hover:border-green-500/50 transition-colors duration-150">
                                <span className="text-green-400 whitespace-pre-wrap group-hover:text-green-300 transition-colors duration-150">{log.message}</span>
                              </div>
                            ))}
                            <div ref={contentRef} className="h-px" />
                          </>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="config" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
            <Card className="border-border/40 shadow-xl rounded-md overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/30">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-primary" />
                    <span>Cấu hình hệ thống thu thập dữ liệu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-primary/30 hover:border-primary transition-all duration-200 rounded-full px-4"
                      onClick={fetchScraperConfigs}
                      disabled={loadingConfigs}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 text-primary ${loadingConfigs ? 'animate-spin' : ''}`} />
                      Làm mới
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white transition-all duration-200 rounded-full px-4"
                      onClick={() => setResetDialogOpen(true)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Khởi động lại
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Quản lý cấu hình thu thập dữ liệu tự động của hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="rounded-xl overflow-hidden border border-border/50 shadow-md">
                  <ScrollArea className="max-h-[500px] w-full">
                    <div className="min-w-[650px]">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="w-[180px] font-semibold text-xs text-left sm:text-sm">Tên cấu hình</TableHead>
                            <TableHead className="w-[100px] text-center font-semibold text-xs sm:text-sm">Hoạt động</TableHead>
                            <TableHead className="w-[120px] text-center font-semibold text-xs sm:text-sm">Thu thập định kỳ</TableHead>
                            <TableHead className="w-[120px] font-semibold text-xs sm:text-sm">Thời gian định kỳ</TableHead>
                            <TableHead className="w-[120px] text-center font-semibold text-xs sm:text-sm">Thu thập liên tục</TableHead>
                            <TableHead className="w-[120px] font-semibold text-xs sm:text-sm">Thời gian liên tục</TableHead>
                            <TableHead className="w-[80px] text-right font-semibold text-xs sm:text-sm">Thao tác</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loadingConfigs ? (
                            <TableRow>
                              <TableCell colSpan={7} className="h-40 text-center">
                                <div className="flex flex-col justify-center items-center">
                                  <div className="relative mb-4">
                                    <RefreshCw className="h-8 w-8 animate-spin mb-3 text-primary" />
                                    <div className="absolute inset-0 h-8 w-8 rounded-full border-t-2 border-primary animate-ping opacity-20"></div>
                                  </div>
                                  <span className="text-base">Đang tải dữ liệu...</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : scraperConfigs.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="h-40 text-center">
                                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                    <Settings className="h-8 w-8 opacity-20" />
                                  </div>
                                  <span className="text-base">Không có dữ liệu cấu hình</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            scraperConfigs.map(config => (
                              <TableRow key={config.id} className="transition-all duration-200 hover:bg-muted/30 group hover:shadow-sm">
                                <TableCell className="font-medium">
                                  <div className="flex items-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/70 mr-2"></div>
                                    {config.name}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex justify-center">
                                    <Badge variant={config.isActive ? "default" : "secondary"} className={`font-normal px-2 sm:px-3 py-0.5 sm:py-1 rounded-md transition-all duration-200 text-xs ${config.isActive ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}>
                                      {config.isActive ? "Hoạt động" : "Tắt"}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex justify-center">
                                    {config.isPeriodicScraping ? (
                                      <Badge variant="default" className="bg-green-600 hover:bg-green-700 font-normal px-2 sm:px-3 py-0.5 sm:py-1 rounded-md transition-all duration-200 text-xs">
                                        <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 text-green-100" />
                                        <span className="hidden xs:inline text-white">Bật</span>
                                        <span className="inline xs:hidden text-white">ON</span>
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="font-normal text-muted-foreground px-2 sm:px-3 py-0.5 sm:py-1 rounded-md text-xs">
                                        <span className="hidden xs:inline">Tắt</span>
                                        <span className="inline xs:hidden">OFF</span>
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                                      <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                                    </div>
                                    <span className={config.isPeriodicScraping ? "" : "text-muted-foreground text-xs sm:text-sm"}>
                                      {formatInterval(config.periodicIntervalMinutes)}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex justify-center">
                                    {config.isContinuousScraping ? (
                                      <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 font-normal px-2 sm:px-3 py-0.5 sm:py-1 rounded-md transition-all duration-200 text-xs">
                                        <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 text-green-200" />
                                        <span className="hidden xs:inline">Bật</span>
                                        <span className="inline xs:hidden">ON</span>
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="font-normal text-muted-foreground px-2 sm:px-3 py-0.5 sm:py-1 rounded-md text-xs">
                                        <span className="hidden xs:inline">Tắt</span>
                                        <span className="inline xs:hidden">OFF</span>
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                                      <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                                    </div>
                                    <span className={config.isContinuousScraping ? "" : "text-muted-foreground text-xs sm:text-sm"}>
                                      {formatInterval(config.continuousIntervalMinutes)}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="hover:bg-primary/10 hover:text-primary rounded-md h-7 sm:h-8 w-7 sm:w-8 p-0 opacity-70 group-hover:opacity-100 transition-all duration-200 hover:scale-105"
                                    onClick={() => handleEditConfig(config)}
                                  >
                                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                </div>
                <div className="mt-8 text-sm rounded-md bg-gradient-to-r from-amber-50 to-amber-50/70 border border-amber-200 p-5 dark:bg-gradient-to-r dark:from-amber-950/20 dark:to-amber-950/10 dark:border-amber-900/50">
                  <p className="font-semibold flex items-center text-amber-800 dark:text-amber-400 mb-3">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Lưu ý quan trọng:
                  </p>
                  <ul className="list-disc text-left pl-7 space-y-2 text-amber-700 dark:text-amber-300/80">
                    <li className="pl-1">Chế độ thu thập định kỳ và liên tục không thể cùng hoạt động.</li>
                    <li className="pl-1">Thời gian thu thập định kỳ phải lớn hơn hoặc bằng giá trị tối thiểu cho phép của mỗi cấu hình.</li>
                    <li className="pl-1">Khoảng thời gian ngắn có thể ảnh hưởng đến hiệu suất hệ thống.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-w-[90vw] rounded-md border-border/50 shadow-xl backdrop-blur-sm animate-in fade-in-50 zoom-in-95 duration-300">
          <DialogHeader className="border-b pb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Settings className="h-4 w-4 text-primary" />
            </div>
            <DialogTitle className="flex items-center text-lg">
              Chỉnh sửa cấu hình scraper
            </DialogTitle>
            <DialogDescription>
              {editingConfig ? `Đang chỉnh sửa cấu hình: ${editingConfig.name}` : ''}
            </DialogDescription>
          </DialogHeader>

          {editingConfig && (
            <div className="grid gap-4 sm:gap-5 py-3 sm:py-5">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="isActive" className="text-left sm:text-right font-medium">
                  Hoạt động
                </Label>
                <div className="sm:col-span-3 flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={editedValues.isActive}
                    onCheckedChange={(value) => handleValueChange('isActive', value)}
                    className="data-[state=checked]:bg-green-600"
                  />
                  <span className={`text-sm ${editedValues.isActive ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}`}>
                    {editedValues.isActive ? 'Đang hoạt động' : 'Đã tắt'}
                  </span>
                </div>
              </div>

              <Separator className="my-1" />
              
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="isPeriodicScraping" className="text-left sm:text-right font-medium">
                  Thu thập định kỳ
                </Label>
                <div className="sm:col-span-3 flex items-center space-x-2">
                  <Switch
                    id="isPeriodicScraping"
                    checked={editedValues.isPeriodicScraping}
                    onCheckedChange={(value) => handleValueChange('isPeriodicScraping', value)}
                    className="data-[state=checked]:bg-green-600"
                  />
                  <span className={`text-sm ${editedValues.isPeriodicScraping ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}`}>
                    {editedValues.isPeriodicScraping ? 'Đang bật' : 'Đã tắt'}
                  </span>
                </div>
              </div>

              {editedValues.isPeriodicScraping && (
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4 ml-0 sm:ml-6 pl-3 sm:pl-6 border-l-0 sm:border-l-2 border-primary/20 animate-in fade-in-50 slide-in-from-left-2 duration-300">
                  <Label htmlFor="periodicIntervalMinutes" className="text-left sm:text-right font-medium">
                    Thời gian định kỳ
                  </Label>
                  <div className="sm:col-span-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        <Input
                          id="periodicMinutes"
                          type="number"
                          min="0"
                          step="1"
                          value={editedValues.periodicMinutes || 0}
                          onChange={(e) => handleValueChange('periodicMinutes', parseFloat(e.target.value) || 0)}
                          className="w-20 rounded-lg"
                        />
                        <span className="ml-2 mr-4">phút</span>
                      </div>
                      <div className="flex items-center">
                        <Input
                          id="periodicSeconds"
                          type="number"
                          min="0"
                          max="59"
                          step="1"
                          value={editedValues.periodicSeconds || 0}
                          onChange={(e) => handleValueChange('periodicSeconds', parseFloat(e.target.value) || 0)}
                          className="w-20 rounded-lg"
                        />
                        <span className="ml-2">giây</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 flex items-center bg-muted/50 p-2 rounded-md">
                      <AlertCircle className="h-3 w-3 mr-1.5 text-amber-500" />
                      Giá trị tối thiểu: {formatTimeDisplay(editingConfig.minPeriodicInterval)}
                      {editedValues.periodicIntervalMinutes < editingConfig.minPeriodicInterval && (
                        <span className="ml-2 text-red-500 font-medium">
                          (Thời gian đã chọn: {formatTimeDisplay(editedValues.periodicIntervalMinutes)})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Separator className="my-1" />

              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="isContinuousScraping" className="text-left sm:text-right font-medium">
                  Thu thập liên tục
                </Label>
                <div className="sm:col-span-3 flex items-center space-x-2">
                  <Switch
                    id="isContinuousScraping"
                    checked={editedValues.isContinuousScraping}
                    onCheckedChange={(value) => handleValueChange('isContinuousScraping', value)}
                    className="data-[state=checked]:bg-green-600"
                  />
                  <span className={`text-sm ${editedValues.isContinuousScraping ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}`}>
                    {editedValues.isContinuousScraping ? 'Đang bật' : 'Đã tắt'}
                  </span>
                </div>
              </div>

              {editedValues.isContinuousScraping && (
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4 ml-0 sm:ml-6 pl-3 sm:pl-6 border-l-0 sm:border-l-2 border-primary/20 animate-in fade-in-50 slide-in-from-left-2 duration-300">
                  <Label htmlFor="continuousIntervalMinutes" className="text-left sm:text-right font-medium">
                    Thời gian liên tục
                  </Label>
                  <div className="sm:col-span-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        <Input
                          id="continuousMinutes"
                          type="number"
                          min="0"
                          step="1"
                          value={editedValues.continuousMinutes || 0}
                          onChange={(e) => handleValueChange('continuousMinutes', parseFloat(e.target.value) || 0)}
                          className="w-20 rounded-lg"
                        />
                        <span className="ml-2 mr-4">phút</span>
                      </div>
                      <div className="flex items-center">
                        <Input
                          id="continuousSeconds"
                          type="number"
                          min="0"
                          max="59"
                          step="1"
                          value={editedValues.continuousSeconds || 0}
                          onChange={(e) => handleValueChange('continuousSeconds', parseFloat(e.target.value) || 0)}
                          className="w-20 rounded-lg"
                        />
                        <span className="ml-2">giây</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 flex items-center bg-muted/50 p-2 rounded-md">
                      <AlertCircle className="h-3 w-3 mr-1.5 text-amber-500" />
                      Giá trị tối thiểu: {formatTimeDisplay(editingConfig.minContinuousInterval)}
                      {editedValues.continuousIntervalMinutes < editingConfig.minContinuousInterval && (
                        <span className="ml-2 text-red-500 font-medium">
                          (Thời gian đã chọn: {formatTimeDisplay(editedValues.continuousIntervalMinutes)})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t pt-3 sm:pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="text-xs text-muted-foreground flex items-center bg-muted/40 p-2 rounded-md">
              <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
              Chỉ bật một trong hai chế độ
            </div>
            <div className="flex items-center space-x-2">
              <DialogClose asChild>
                <Button variant="outline" className="rounded-md h-9 min-w-[80px]">Hủy</Button>
              </DialogClose>
              <Button 
                onClick={updateScraperConfig} 
                disabled={updatingConfig}
                className="bg-green-600 hover:bg-green-700 rounded-md h-9 min-w-[120px] hover:shadow-md transition-all duration-200"
              >
                {updatingConfig ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset System Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-w-[90vw] rounded-md border-border/50 shadow-xl backdrop-blur-sm animate-in fade-in-50 zoom-in-95 duration-300">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-red-600/10 flex items-center justify-center">
                <RotateCcw className="h-4 w-4 text-red-600" />
              </div>
              <DialogTitle className="text-lg">
                Khởi động lại hệ thống cào dữ liệu
              </DialogTitle>
            </div>
            <DialogDescription>
              Hệ thống sẽ tạm dừng và khởi động lại quá trình thu thập dữ liệu. Hành động này có thể mất vài phút.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-start space-x-3 bg-amber-50 dark:bg-amber-950/30 p-4 rounded-md border border-amber-200 dark:border-amber-900/50">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-400 mb-1">Lưu ý quan trọng</p>
                <p className="text-sm text-amber-700 dark:text-amber-300/80">
                  Việc khởi động lại hệ thống sẽ tạm dừng quá trình thu thập dữ liệu. Dữ liệu có thể bị gián đoạn trong thời gian này. Bạn có chắc chắn muốn tiếp tục?
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-3 sm:pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="text-xs text-muted-foreground flex items-center bg-muted/40 p-2 rounded-md">
              <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              Quá trình này có thể mất vài phút
            </div>
            <div className="flex items-center space-x-2">
              <DialogClose asChild>
                <Button variant="outline" className="rounded-md h-9 min-w-[80px]">Hủy</Button>
              </DialogClose>
              <Button 
                onClick={handleResetSystem} 
                disabled={isResetting}
                className="bg-red-600 hover:bg-red-700 rounded-md h-9 min-w-[120px] hover:shadow-md transition-all duration-200 text-white"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    <span>Khởi động lại</span>
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 