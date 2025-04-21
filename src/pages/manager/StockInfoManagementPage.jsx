import React, { useState, useEffect, useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Search, Filter, Edit, Check, X, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = "https://stockmonitoring-api-gateway.onrender.com";

export default function StockInfoManagementPage() {
  // State for stock data
  const [stocks, setStocks] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [exchanges] = useState([
    { id: "1", name: "HOSE" },
    { id: "2", name: "HNX" },
  ]);
  
  // State for pagination
  const [pagination, setPagination] = useState({
    pageIndex: 1,
    pageSize: 5,
    totalPages: 1,
    totalCount: 0
  });
  
  // State for filters
  const [filters, setFilters] = useState({
    search: "",
    exchangeName: "",
    onlyUndefinedCompany: false,
    onlyUndefinedSector: false
  });
  
  // State for loading
  const [loading, setLoading] = useState(false);
  const [loadingSectors, setLoadingSectors] = useState(false);
  
  // State for edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [editForm, setEditForm] = useState({
    stockId: "",
    newSectorId: "",
    newCompanyName: ""
  });
  const [updating, setUpdating] = useState(false);
  
  // Fetch stock data
  const fetchStocks = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/stock/information`, {
        params: {
          search: filters.search || undefined,
          exchangeName: filters.exchangeName || undefined,
          onlyUndefinedCompany: filters.onlyUndefinedCompany || undefined,
          onlyUndefinedSector: filters.onlyUndefinedSector || undefined,
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize
        }
      });
      
      if (response.data.value && response.data.value.data) {
        // Set stocks from API response
        setStocks(response.data.value.data);
        
        // Cập nhật thông tin phân trang
        // Nếu API không trả về totalCount, tính toán từ dữ liệu
        const totalCount = 
          response.data.value.totalCount !== undefined 
            ? response.data.value.totalCount 
            : pagination.pageIndex * pagination.pageSize + (
                response.data.value.data.length < pagination.pageSize 
                  ? 0 
                  : response.data.value.data.length
              );
              
        // Tính tổng số trang dựa trên totalCount
        const totalPages = 
          response.data.value.totalPages !== undefined
            ? response.data.value.totalPages
            : Math.ceil(totalCount / pagination.pageSize);
            
        setPagination(prev => ({
          ...prev,
          totalCount,
          totalPages
        }));
      }
    } catch (error) {
      console.error("Error fetching stocks:", error);
      toast.error("Không thể tải danh sách cổ phiếu");
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch sectors
  const fetchSectors = async () => {
    setLoadingSectors(true);
    try {
      const response = await axios.get(`${API_URL}/api/watchlist-sector`, {
        headers: {
          'Authorization': `Bearer ${Cookies.get('auth_token')}`,
          'accept': '*/*'
        }
      });
      if (response.data.value && response.data.value.data) {
        setSectors(response.data.value.data);
      }
    } catch (error) {
      console.error("Error fetching sectors:", error);
      toast.error("Không thể tải danh sách ngành");
    } finally {
      setLoadingSectors(false);
    }
  };
  
  // Update stock info
  const updateStockInfo = async () => {
    if (!editForm.stockId || !editForm.newSectorId || !editForm.newCompanyName) {
      toast.error("Thông tin thiếu. Vui lòng điền đầy đủ thông tin");
      return;
    }
    
    setUpdating(true);
    try {
      await axios.put(`${API_URL}/api/stock/information`, null, {
        params: {
          stockId: editForm.stockId,
          newSectorId: editForm.newSectorId,
          newCompanyName: editForm.newCompanyName
        }
      });
      
      toast.success("Đã cập nhật thông tin cổ phiếu");
      
      // Update local data
      setStocks(prev => 
        prev.map(stock => 
          stock.id === editForm.stockId 
            ? {
                ...stock,
                sectorId: editForm.newSectorId,
                sectorName: sectors.find(s => s.id === editForm.newSectorId)?.name || stock.sectorName,
                companyName: editForm.newCompanyName
              }
            : stock
        )
      );
      
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("Không thể cập nhật thông tin cổ phiếu");
    } finally {
      setUpdating(false);
    }
  };
  
  // Handle edit button click
  const handleEditClick = (stock) => {
    setSelectedStock(stock);
    setEditForm({
      stockId: stock.id,
      newSectorId: stock.sectorId || "",
      newCompanyName: stock.companyName || ""
    });
    setEditDialogOpen(true);
  };
  
  // Load data on mount and when filters change
  useEffect(() => {
    fetchStocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.pageIndex, pagination.pageSize]);
  
  // Load sectors on mount
  useEffect(() => {
    fetchSectors();
  }, []);
  
  // Handle filter change
  const handleFilterChange = (key, value) => {
    // Nếu là ô tìm kiếm, kiểm tra xem có phải mã cổ phiếu không
    if (key === "search" && value) {
      const trimmedValue = value.trim();
      
      // Kiểm tra xem giá trị nhập vào có phải là mã cổ phiếu không
      // Mã cổ phiếu thường là 3-5 ký tự và chỉ chứa chữ cái và số
      const isTickerSymbol = /^[A-Za-z0-9]{1,5}$/.test(trimmedValue) && trimmedValue.length <= 5;
      
      if (isTickerSymbol) {
        // Nếu là mã cổ phiếu, chuyển thành chữ hoa
        setFilters(prev => ({ ...prev, search: trimmedValue.toUpperCase() }));
        setPagination(prev => ({ ...prev, pageIndex: 1 }));
        return;
      }
    }
    
    // If exchange filter is set to "all", treat it as empty string
    if (key === "exchangeName" && value === "all") {
      value = "";
    }
    
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, pageIndex: 1 })); // Reset to first page when filter changes
  };
  
  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, pageIndex: newPage }));
  };
  
  const displayedStocks = useMemo(() => {
    return stocks;
  }, [stocks]);
  
  return (
    <div className="w-full h-full p-2 sm:p-4 md:p-6 bg-gradient-to-b from-background/80 via-background to-background/90">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold mb-2 text-foreground/90 flex items-center gap-2">
            <Filter className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            Quản lý thông tin cổ phiếu
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Xem và cập nhật thông tin cổ phiếu, bao gồm tên công ty và ngành</p>
          <div className="w-20 h-1 bg-primary/70 rounded-full mt-2"></div>
        </div>

        <Card className="border-border/40 shadow-xl rounded-md overflow-hidden transition-all duration-300 hover:shadow-2xl">
          <CardContent className="p-4 sm:p-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center col-span-1 md:col-span-2 lg:col-span-1">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm mã CP, tên công ty..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    className="pl-9 w-full"
                  />
                </div>
                <Button 
                  variant="outline" 
                  className="ml-2 border-primary/30 hover:border-primary" 
                  onClick={() => fetchStocks()}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center">
                <Select
                  value={filters.exchangeName || "all"}
                  onValueChange={(value) => handleFilterChange("exchangeName", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sàn giao dịch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả sàn</SelectItem>
                    {exchanges.map(exchange => (
                      <SelectItem key={exchange.id} value={exchange.name}>
                        {exchange.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.onlyUndefinedCompany}
                    onChange={(e) => handleFilterChange("onlyUndefinedCompany", e.target.checked)}
                    className="rounded border-gray-300 h-4 w-4 accent-primary cursor-pointer"
                  />
                  <span className="text-sm">Chưa có công ty</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.onlyUndefinedSector}
                    onChange={(e) => handleFilterChange("onlyUndefinedSector", e.target.checked)}
                    className="rounded border-gray-300 h-4 w-4 accent-primary cursor-pointer"
                  />
                  <span className="text-sm">Chưa có ngành</span>
                </label>
              </div>
            </div>
            
            {/* Table */}
            <div className="rounded-md border overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[100px] font-semibold text-xs sm:text-sm">Mã CP</TableHead>
                    <TableHead className="font-semibold text-xs sm:text-sm text-left">Tên công ty</TableHead>
                    <TableHead className="w-[100px] text-center font-semibold text-xs sm:text-sm">Sàn</TableHead>
                    <TableHead className="w-[200px] font-semibold text-xs sm:text-sm text-left">Ngành</TableHead>
                    <TableHead className="w-[80px] text-right font-semibold text-xs sm:text-sm">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" />
                          <span>Đang tải dữ liệu...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : displayedStocks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                            <Filter className="h-8 w-8 opacity-20" />
                          </div>
                          <span className="text-base">Không có dữ liệu</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedStocks.map(stock => (
                      <TableRow key={stock.id} className="transition-all duration-200 hover:bg-muted/30 group hover:shadow-sm">
                        <TableCell className="font-medium w-[100px]">
                          <div className="flex items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/70 mr-2"></div>
                            {stock.ticketSymbol}
                          </div>
                        </TableCell>
                        <TableCell className="text-left">
                          {stock.companyName || (
                            <span className="text-amber-500 text-sm italic">Chưa có thông tin</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center w-[100px]">
                          <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${
                            stock.exchangeName === "HOSE" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : 
                            "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          }`}>
                            {stock.exchangeName}
                          </span>
                        </TableCell>
                        <TableCell className="w-[200px] text-left">
                          {stock.sectorName || (
                            <span className="text-amber-500 text-sm italic">Chưa phân loại</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right w-[80px]">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="hover:bg-primary/10 hover:text-primary rounded-md h-7 sm:h-8 w-7 sm:w-8 p-0 opacity-70 group-hover:opacity-100 transition-all duration-200 hover:scale-105"
                            onClick={() => handleEditClick(stock)}
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
            
            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
              
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max(1, pagination.pageIndex - 1))}
                      disabled={pagination.pageIndex === 1 || loading}
                      className={pagination.pageIndex === 1 ? "opacity-50 cursor-not-allowed" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    // Logic hiển thị trang
                    let pageToShow;
                    
                    if (pagination.totalPages <= 5) {
                      // Nếu tổng số trang <= 5, hiển thị tất cả các trang
                      pageToShow = i + 1;
                    } else if (pagination.pageIndex <= 3) {
                      // Nếu đang ở gần đầu, hiển thị 1-2-3-4-5
                      pageToShow = i + 1;
                    } else if (pagination.pageIndex >= pagination.totalPages - 2) {
                      // Nếu đang ở gần cuối, hiển thị các trang cuối
                      pageToShow = pagination.totalPages - 4 + i;
                    } else {
                      // Nếu đang ở giữa, hiển thị trang hiện tại ở giữa
                      pageToShow = pagination.pageIndex - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={pageToShow}>
                        <PaginationLink
                          isActive={pageToShow === pagination.pageIndex}
                          onClick={() => handlePageChange(pageToShow)}
                          disabled={loading}
                          className={pageToShow === pagination.pageIndex ? "bg-primary text-white" : ""}
                        >
                          {pageToShow}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  {pagination.totalPages > 5 && pagination.pageIndex < pagination.totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  
                  {pagination.totalPages > 5 && pagination.pageIndex < pagination.totalPages - 2 && (
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => handlePageChange(pagination.totalPages)}
                        disabled={loading}
                      >
                        {pagination.totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.pageIndex + 1))}
                      disabled={pagination.pageIndex === pagination.totalPages || loading}
                      className={pagination.pageIndex === pagination.totalPages ? "opacity-50 cursor-not-allowed" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen} modal={true}>
        <DialogContent className="sm:max-w-[500px] p-0">
          <DialogHeader className="p-6 pb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Edit className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">Cập nhật thông tin cổ phiếu</DialogTitle>
            <DialogDescription>
              {selectedStock && (
                <div className="mt-2 flex items-center">
                  <span>Mã cổ phiếu: </span>
                  <span className="ml-2 font-medium text-base bg-primary/10 px-2 py-0.5 rounded text-primary">
                    {selectedStock.ticketSymbol}
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 pt-0 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="companyName" className="text-sm font-medium">
                  Tên công ty
                </label>
                <Input
                  id="companyName"
                  value={editForm.newCompanyName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, newCompanyName: e.target.value }))}
                  placeholder="Nhập tên công ty..."
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="sector" className="text-sm font-medium">
                  Ngành
                </label>
                <Select
                  value={editForm.newSectorId}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, newSectorId: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn ngành" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingSectors ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>Đang tải...</span>
                      </div>
                    ) : (
                      sectors.map(sector => (
                        <SelectItem key={sector.id} value={sector.id || `sector-${sector.name}`}>
                          {sector.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter className="p-6 pt-2 flex gap-2 justify-end border-t">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button 
              onClick={updateStockInfo} 
              disabled={updating}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  <span>Cập nhật</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 