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

const API_URL = "https://stockmonitoring-api-gateway.onrender.com";

export default function StockInfoManagementPage() {
  // State for stock data
  const [stocks, setStocks] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [exchanges] = useState([
    { id: "1", name: "HOSE" },
    { id: "2", name: "HNX" },
    { id: "3", name: "UPCOM" }
  ]);
  
  // State for pagination
  const [pagination, setPagination] = useState({
    pageIndex: 1,
    pageSize: 10,
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
        setStocks(response.data.value.data);
        setPagination(prev => ({
          ...prev,
          totalCount: response.data.value.data.length,
          totalPages: Math.ceil(response.data.value.data.length / prev.pageSize)
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
      const response = await axios.get(`${API_URL}/api/watchlist-sector`);
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
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Quản lý thông tin cổ phiếu</CardTitle>
          <CardDescription>
            Xem và cập nhật thông tin cổ phiếu, bao gồm tên công ty và ngành
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center w-full md:w-auto">
              <Input
                placeholder="Tìm kiếm mã CP, tên công ty..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="max-w-sm"
              />
              <Button 
                variant="ghost" 
                className="ml-2" 
                onClick={() => fetchStocks()}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Select
                value={filters.exchangeName}
                onValueChange={(value) => handleFilterChange("exchangeName", value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sàn giao dịch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {exchanges.map(exchange => (
                    <SelectItem key={exchange.id} value={exchange.name}>
                      {exchange.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="onlyUndefinedCompany"
                  checked={filters.onlyUndefinedCompany}
                  onChange={(e) => handleFilterChange("onlyUndefinedCompany", e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="onlyUndefinedCompany">Chưa có công ty</label>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="onlyUndefinedSector"
                  checked={filters.onlyUndefinedSector}
                  onChange={(e) => handleFilterChange("onlyUndefinedSector", e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="onlyUndefinedSector">Chưa có ngành</label>
              </div>
            </div>
          </div>
          
          {/* Table */}
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Mã CP</TableHead>
                  <TableHead>Tên công ty</TableHead>
                  <TableHead className="w-[150px]">Sàn</TableHead>
                  <TableHead className="w-[200px]">Ngành</TableHead>
                  <TableHead className="w-[100px] text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Đang tải...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : displayedStocks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedStocks.map(stock => (
                    <TableRow key={stock.id}>
                      <TableCell className="font-medium">{stock.ticketSymbol}</TableCell>
                      <TableCell>{stock.companyName || "Chưa có thông tin"}</TableCell>
                      <TableCell>{stock.exchangeName}</TableCell>
                      <TableCell>{stock.sectorName || "Chưa phân loại"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(stock)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          <div className="mt-4 flex items-center justify-end">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(Math.max(1, pagination.pageIndex - 1))}
                    disabled={pagination.pageIndex === 1 || loading}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = pagination.pageIndex <= 3
                    ? i + 1
                    : pagination.pageIndex + i - 2;
                    
                  if (page > pagination.totalPages) return null;
                  
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={page === pagination.pageIndex}
                        onClick={() => handlePageChange(page)}
                        disabled={loading}
                      >
                        {page}
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
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
      
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật thông tin cổ phiếu</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin cho mã {selectedStock?.ticketSymbol}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="companyName" className="text-right">
                Tên công ty
              </label>
              <Input
                id="companyName"
                value={editForm.newCompanyName}
                onChange={(e) => setEditForm(prev => ({ ...prev, newCompanyName: e.target.value }))}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="sector" className="text-right">
                Ngành
              </label>
              <Select
                value={editForm.newSectorId}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, newSectorId: value }))}
              >
                <SelectTrigger className="col-span-3">
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
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={updateStockInfo} disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Cập nhật
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 