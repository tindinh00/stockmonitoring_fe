import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Database, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  RefreshCcw,
  Settings,
  XCircle,
  Link as LinkIcon,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format, parseISO } from 'date-fns';
import { vi } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export default function ScraperManagementPage() {
  const navigate = useNavigate();
  const [allScrapers, setAllScrapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedScraper, setSelectedScraper] = useState(null);
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("0");
  const [seconds, setSeconds] = useState("0");

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Sort states
  const [sortBy, setSortBy] = useState("Date");
  const [isDescending, setIsDescending] = useState(false);
  
  // Pagination states
  const [pageIndex, setPageIndex] = useState(1);
  const pageSize = 5;

  // Xử lý filter và sort dữ liệu
  const filteredData = useMemo(() => {
    let result = [...allScrapers];

    // Áp dụng các bộ lọc
    if (searchQuery) {
      result = result.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (nameFilter) {
      result = result.filter(item => 
        item.name.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter).setHours(0, 0, 0, 0);
      result = result.filter(item => {
        const itemDate = new Date(item.time).setHours(0, 0, 0, 0);
        return itemDate === filterDate;
      });
    }

    if (statusFilter !== 'all') {
      result = result.filter(item => 
        item.status === (statusFilter === 'true')
      );
    }

    // Áp dụng sắp xếp
    result.sort((a, b) => {
      let compareResult = 0;
      switch (sortBy) {
        case 'Date':
          compareResult = new Date(b.time) - new Date(a.time);
          break;
        case 'Name':
          compareResult = a.name.localeCompare(b.name);
          break;
        case 'Source':
          compareResult = a.source.localeCompare(b.source);
          break;
        case 'Status':
          compareResult = b.status - a.status;
          break;
        default:
          compareResult = 0;
      }
      return isDescending ? -compareResult : compareResult;
    });

    return result;
  }, [allScrapers, searchQuery, nameFilter, dateFilter, statusFilter, sortBy, isDescending]);

  // Tính toán dữ liệu cho trang hiện tại
  const currentPageData = useMemo(() => {
    const startIndex = (pageIndex - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, pageIndex, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));

  const fetchScrapers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        sortBy: 'Date',
        isDescending: 'false'
      });

      const API_URL = 'https://stockmonitoring-api-stock-service.onrender.com/api/scrapper-information';
      
      const response = await axios.get(`${API_URL}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${Cookies.get('auth_token')}`
        }
      });

      if (response.data.value.status === 200) {
        setAllScrapers(response.data.value.data);
      } else {
        throw new Error(response.data.value.message || 'Lỗi không xác định từ server');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn');
        Cookies.remove('auth_token');
        navigate('/login');
      } else if (error.response) {
        toast.error(`Lỗi server: ${error.response.data?.message || 'Không thể tải dữ liệu'}`);
      } else if (error.request) {
        toast.error('Không thể kết nối tới server, vui lòng kiểm tra kết nối mạng');
      } else {
        toast.error(`Lỗi: ${error.message || 'Đã có lỗi xảy ra'}`);
      }
      setAllScrapers([]);
    } finally {
      setLoading(false);
    }
  };

  // Reset page khi filter/sort thay đổi
  useEffect(() => {
    setPageIndex(1);
  }, [searchQuery, nameFilter, dateFilter, statusFilter, sortBy, isDescending]);

  useEffect(() => {
    fetchScrapers();
  }, []);

  const getStatusColor = (status) => {
    return status 
      ? "bg-green-500/10 text-green-500"
      : "bg-red-500/10 text-red-500";
  };

  const getStatusIcon = (status) => {
    return status 
      ? <CheckCircle className="h-4 w-4" />
      : <XCircle className="h-4 w-4" />;
  };

  const handleStatusChange = (scraperId, newStatus) => {
    setAllScrapers(allScrapers.map(scraper => 
      scraper.id === scraperId ? { 
        ...scraper, 
        status: newStatus,
        nextRun: newStatus === "running" ? new Date(Date.now() + 3600000) : null
      } : scraper
    ));
    
    toast.success(`Đã ${newStatus === "running" ? "bắt đầu" : "dừng"} scraper`, {
      position: "top-right",
      duration: 3000,
    });
  };

  const parseInterval = (intervalString) => {
    const hours = intervalString.match(/(\d+)\s*giờ/);
    const minutes = intervalString.match(/(\d+)\s*phút/);
    const seconds = intervalString.match(/(\d+)\s*giây/);
    
    return {
      hours: hours ? hours[1] : "0",
      minutes: minutes ? minutes[1] : "0",
      seconds: seconds ? seconds[1] : "0"
    };
  };

  const handleIntervalChange = () => {
    const interval = [];
    if (hours !== "0") interval.push(`${hours} giờ`);
    if (minutes !== "0") interval.push(`${minutes} phút`);
    if (seconds !== "0") interval.push(`${seconds} giây`);
    
    const newInterval = interval.join(" ");
    if (!newInterval) return;

    setAllScrapers(allScrapers.map(scraper => 
      scraper.id === selectedScraper.id ? { ...scraper, interval: newInterval } : scraper
    ));
    setIsSettingsOpen(false);
    
    toast.success("Đã cập nhật thời gian chạy scraper", {
      position: "top-right",
      duration: 3000,
    });
  };

  const openSettings = (scraper) => {
    setSelectedScraper(scraper);
    const { hours: h, minutes: m, seconds: s } = parseInterval(scraper.interval);
    setHours(h);
    setMinutes(m);
    setSeconds(s);
    setIsSettingsOpen(true);
  };

  // Generate options for select boxes
  const hoursOptions = Array.from({ length: 24 }, (_, i) => i.toString());
  const minutesOptions = Array.from({ length: 60 }, (_, i) => i.toString());
  const secondsOptions = Array.from({ length: 60 }, (_, i) => i.toString());

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Quản lý Scraper</CardTitle>
              <CardDescription className="text-base mt-2">
                Quản lý và giám sát các tiến trình cào dữ liệu
              </CardDescription>
            </div>
            <Button variant="outline" onClick={fetchScrapers} disabled={loading}>
              <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="mb-6 space-y-4">
            {/* Search bar */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => {
                  setPageIndex(1);
                  fetchScrapers();
                }}>
                  <Search className="h-4 w-4 mr-2" />
                  Tìm kiếm
                </Button>
                <Button variant="outline" onClick={() => {
                  setSearchQuery("");
                  setNameFilter("");
                  setDateFilter("");
                  setStatusFilter("all");
                  setSortBy("Date");
                  setIsDescending(false);
                  setPageIndex(1);
                  fetchScrapers();
                }}>
                  Đặt lại
                </Button>
              </div>
            </div>
            
            {/* Filters - Responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
              <div className="w-full">
                <Input
                  placeholder="Lọc theo tên"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                />
              </div>
              <div className="w-full">
                <Input
                  type="datetime-local"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="w-full">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="true">Thành công</SelectItem>
                    <SelectItem value="false">Thất bại</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sắp xếp theo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Date">Thời gian</SelectItem>
                    <SelectItem value="Name">Tên</SelectItem>
                    <SelectItem value="Source">Nguồn</SelectItem>
                    <SelectItem value="Status">Trạng thái</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full">
                <Select 
                  value={isDescending.toString()} 
                  onValueChange={(value) => setIsDescending(value === "true")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Thứ tự" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Tăng dần</SelectItem>
                    <SelectItem value="true">Giảm dần</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <TableHead className="min-w-[200px] lg:w-[300px] font-medium">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Tên Scraper
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[100px] lg:w-[120px] font-medium text-center">Nguồn</TableHead>
                    <TableHead className="text-center min-w-[120px] lg:w-[120px] font-medium">Trạng thái</TableHead>
                    <TableHead className="text-center min-w-[160px] lg:w-[180px] font-medium">Thời gian</TableHead>
                    <TableHead className="min-w-[60px] lg:w-[80px] text-center font-medium">Link</TableHead>
                    <TableHead className="min-w-[200px] lg:min-w-[300px] font-medium">Thông báo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <RefreshCcw className="h-6 w-6 animate-spin mr-2" />
                          <span>Đang tải dữ liệu...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : currentPageData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="text-muted-foreground">
                          Không có dữ liệu
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentPageData.map((scraper) => (
                      <TableRow key={scraper.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <TableCell className="min-w-[200px] lg:w-[300px]">
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 shrink-0" />
                            <span className="font-medium truncate">{scraper.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[100px] lg:w-[120px] text-center">{scraper.source}</TableCell>
                        <TableCell className="min-w-[120px] lg:w-[120px]">
                          <Badge 
                            variant="outline" 
                            className={`${getStatusColor(scraper.status)} text-center inline-flex items-center justify-center gap-1 px-2 py-1 whitespace-nowrap`}
                          >
                            {getStatusIcon(scraper.status)}
                            <span>
                              {scraper.status ? "Thành công" : "Thất bại"}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="min-w-[160px] lg:w-[180px] whitespace-nowrap">
                          <div className="text-center">
                            {format(parseISO(scraper.time), "dd/MM/yyyy HH:mm:ss")}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[60px] lg:w-[80px] text-center">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 hover:text-primary"
                            onClick={() => window.open(scraper.link, '_blank')}
                          >
                            <LinkIcon className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell className="min-w-[200px] lg:min-w-[300px]">
                          <div className="text-left break-words">{scraper.message}</div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="mt-4 flex items-center justify-end">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex(1)}
                disabled={pageIndex === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Đầu
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex(prev => Math.max(1, prev - 1))}
                disabled={pageIndex === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[50px] text-center">
                {pageIndex}/{totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex(prev => Math.min(totalPages, prev + 1))}
                disabled={pageIndex === totalPages || loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex(totalPages)}
                disabled={pageIndex === totalPages || loading}
              >
                Cuối
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 