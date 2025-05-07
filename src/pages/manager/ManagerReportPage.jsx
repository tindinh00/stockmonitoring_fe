import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { FileText, AlertTriangle, CheckCircle, Clock, Search, Filter, Eye, MoreVertical } from "lucide-react";
import { format, subHours } from "date-fns";
import { vi } from "date-fns/locale";
import { apiService } from "@/api/Api";

export default function ManagerReportPage() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [pageIndex, setPageIndex] = useState(1);
  const pageSize = 10;
  const filteredReports = reports.filter((report) => {
    const matchesSearch = searchTerm
      ? (report.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         report.staffName?.toLowerCase().includes(searchTerm.toLowerCase()))
      : true;
    const matchesType = selectedType === "all" || !selectedType || report.type === selectedType;
    const matchesStatus = selectedStatus === "all" || !selectedStatus || report.status === selectedStatus;
    const matchesSeverity = selectedSeverity === "all" || !selectedSeverity || report.severity === selectedSeverity;
    return matchesSearch && matchesType && matchesStatus && matchesSeverity;
  });
  const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));
  const currentPageReports = filteredReports.slice((pageIndex - 1) * pageSize, pageIndex * pageSize);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getReports();
      console.log("Fetched reports:", data);
      setReports(data);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error(error.message || "Không thể tải danh sách báo cáo");
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (level) => {
    switch (level) {
      case "high":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
      case "low":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      default:
        return "";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Process":
        return "bg-yellow-500/10 text-yellow-500";
      case "Done":
        return "bg-green-500/10 text-green-500";
      case "Urgent":
        return "bg-red-500/10 text-red-500";
      default:
        return "";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Process":
        return <Clock className="h-4 w-4" />;
      case "Done":
        return <CheckCircle className="h-4 w-4" />;
      case "Urgent":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const translateType = (type) => {
    switch (type) {
      case 'system':
        return 'Lỗi hệ thống';
      case 'interface':
        return 'Giao diện';
      case 'performance':
        return 'Hiệu năng';
      case 'other':
        return 'Khác';
      default:
        return type || 'Khác';
    }
  };

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      await apiService.updateReportStatus(reportId, newStatus);
      
      const statusText = newStatus === "Done" ? "đã xử lý" : "khẩn cấp";
      toast.success(`Đã cập nhật trạng thái báo cáo thành ${statusText}`);
      
      // Refresh the reports list
      await fetchReports();
      
      if (isDetailOpen) {
        setIsDetailOpen(false);
      }
    } catch (error) {
      console.error("Error updating report status:", error);
      toast.error(error.message || "Không thể cập nhật trạng thái báo cáo");
    }
  };

  const viewReportDetail = async (report) => {
    try {
      const response = await apiService.getReportById(report.id);
      if (response) {
        setSelectedReport(response);
        setIsDetailOpen(true);
      } else {
        toast.error("Không tìm thấy thông tin báo cáo");
      }
    } catch (error) {
      console.error("Error fetching report details:", error);
      toast.error(error.message || "Không thể tải chi tiết báo cáo");
    }
  };

  const handleImagePreview = (imageUrl) => {
    setPreviewImage(imageUrl);
    setIsImagePreviewOpen(true);
  };

  useEffect(() => {
    setPageIndex(1);
  }, [searchTerm, selectedType, selectedStatus, selectedSeverity]);

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Quản lý báo cáo</CardTitle>
              <CardDescription className="text-base mt-2">
                Xem và quản lý các báo cáo từ nhân viên
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm báo cáo..."
                  className="pl-8 h-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[130px] h-10">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="Lỗi hệ thống">Lỗi hệ thống</SelectItem>
                    <SelectItem value="Giao diện">Giao diện</SelectItem>
                    <SelectItem value="Hiệu năng">Hiệu năng</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[130px] h-10">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="Process">Đang xử lý</SelectItem>
                    <SelectItem value="Done">Đã xử lý</SelectItem>
                    <SelectItem value="Urgent">Khẩn cấp</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger className="w-[130px] h-10">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Mức độ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="high">Cao</SelectItem>
                    <SelectItem value="medium">Trung bình</SelectItem>
                    <SelectItem value="low">Thấp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium">Tiêu đề</TableHead>
                  <TableHead className="font-medium">Nhân viên</TableHead>
                  <TableHead className="font-medium">Hình ảnh</TableHead>
                  <TableHead className="font-medium">Loại</TableHead>
                  <TableHead className="font-medium">Mức độ</TableHead>
                  <TableHead className="font-medium">Trạng thái</TableHead>
                  <TableHead className="font-medium">Ngày tạo</TableHead>
                  <TableHead className="font-medium">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24">
                      <div className="flex items-center justify-center">
                        <svg
                          className="animate-spin h-6 w-6 text-primary"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                      Không có báo cáo nào
                    </TableCell>
                  </TableRow>
                ) : (
                  currentPageReports.map((report) => (
                    <TableRow key={report.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium max-w-[300px] truncate text-left">
                        {report.title}
                      </TableCell>
                      <TableCell className='text-left'>
                        <span>{report.staffName || 'N/A'}</span>
                      </TableCell>
                      <TableCell>
                        {report.image ? (
                          <img 
                            src={report.image} 
                            alt="Report" 
                            className="w-10 h-10 object-cover rounded-md cursor-pointer hover:opacity-80"
                            onClick={() => handleImagePreview(report.image)}
                          />
                        ) : (
                          <span className="text-muted-foreground text-sm">Không có ảnh</span>
                        )}
                      </TableCell>
                      <TableCell className='text-left'>{translateType(report.type)}</TableCell>
                      <TableCell className='text-left'>
                        <Badge variant="outline" className={getSeverityColor(report.level)}>
                          {report.level === "high" && "Cao"}
                          {report.level === "medium" && "Trung bình"}
                          {report.level === "low" && "Thấp"}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-left'>
                        <Badge variant="outline" className={getStatusColor(report.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(report.status)}
                            <span>
                              {report.status === "Process" && "Đang xử lý"}
                              {report.status === "Done" && "Đã xử lý"}
                              {report.status === "Urgent" && "Khẩn cấp"}
                            </span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className='text-left'>
                        {format(subHours(new Date(report.createdAt), 7), "dd/MM/yyyy HH:mm", { locale: vi })}
                      </TableCell>
                      <TableCell className='text-left'>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => viewReportDetail(report)}
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Select
                            value={report.status}
                            onValueChange={(value) => handleStatusChange(report.id, value)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue>
                                <div className="flex items-center gap-2">
                                  {report.status === "Process" && <Clock className="h-4 w-4 text-yellow-500" />}
                                  {report.status === "Done" && <CheckCircle className="h-4 w-4 text-green-500" />}
                                  {report.status === "Urgent" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                  <span>
                                    {report.status === "Process" && "Đang xử lý"}
                                    {report.status === "Done" && "Đã xử lý"}
                                    {report.status === "Urgent" && "Khẩn cấp"}
                                  </span>
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Process">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-yellow-500" />
                                  <span>Đang xử lý</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="Done">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>Đã xử lý</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="Urgent">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                  <span>Khẩn cấp</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination Controls */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Hiển thị {filteredReports.length === 0 ? 0 : ((pageIndex - 1) * pageSize) + 1} - {Math.min(pageIndex * pageSize, filteredReports.length)} / {filteredReports.length} báo cáo
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                onClick={() => setPageIndex(1)}
                disabled={pageIndex === 1}
              >
                Đầu
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                onClick={() => setPageIndex(prev => Math.max(1, prev - 1))}
                disabled={pageIndex === 1}
              >
                Trước
              </Button>
              <span className="min-w-[40px] text-center text-sm">
                {pageIndex}/{totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                onClick={() => setPageIndex(prev => Math.min(totalPages, prev + 1))}
                disabled={pageIndex === totalPages}
              >
                Sau
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                onClick={() => setPageIndex(totalPages)}
                disabled={pageIndex === totalPages}
              >
                Cuối
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Chi tiết báo cáo</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về báo cáo từ nhân viên
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <ScrollArea className="max-h-[80vh] overflow-auto">
              <div className="space-y-6 p-1">
                <div>
                  <h4 className="text-sm font-medium mb-2">Tiêu đề</h4>
                  <p className="text-base bg-muted/50 p-3 rounded-lg">{selectedReport.title}</p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Nhân viên báo cáo</h4>
                    <div className="flex items-center gap-2 bg-muted/50 p-3 rounded-lg">
                      <span className="text-base">{selectedReport.staffName || 'N/A'}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Ngày tạo</h4>
                    <p className="text-base bg-muted/50 p-3 rounded-lg">
                      {format(subHours(new Date(selectedReport.createdAt), 7), "dd/MM/yyyy HH:mm", { locale: vi })}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Loại</h4>
                    <p className="text-base bg-muted/50 p-3 rounded-lg">{translateType(selectedReport.type)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Mức độ</h4>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <Badge variant="outline" className={getSeverityColor(selectedReport.level)}>
                        {selectedReport.level === "high" && "Cao"}
                        {selectedReport.level === "medium" && "Trung bình"}
                        {selectedReport.level === "low" && "Thấp"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Trạng thái</h4>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <Badge variant="outline" className={getStatusColor(selectedReport.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(selectedReport.status)}
                          <span>
                            {selectedReport.status === "Process" && "Đang xử lý"}
                            {selectedReport.status === "Done" && "Đã xử lý"}
                            {selectedReport.status === "Urgent" && "Khẩn cấp"}
                          </span>
                        </div>
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-2">Nội dung chi tiết</h4>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-base whitespace-pre-wrap">{selectedReport.content}</p>
                  </div>
                </div>

                {selectedReport.image && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-2">Hình ảnh đính kèm</h4>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <img 
                          src={selectedReport.image} 
                          alt="Report" 
                          className="w-full max-h-[300px] object-contain cursor-pointer hover:opacity-80"
                          onClick={() => handleImagePreview(selectedReport.image)}
                        />
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Đóng</Button>
                  </DialogClose>
                </DialogFooter>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={isImagePreviewOpen} onOpenChange={setIsImagePreviewOpen}>
        <DialogContent className="max-w-4xl p-0 gap-0">
          <div className="relative w-full h-[700px] bg-black/5">
            {previewImage && (
              <img
                src={previewImage}
                alt="Preview"
                className="absolute inset-0 w-full h-full object-contain p-4"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 