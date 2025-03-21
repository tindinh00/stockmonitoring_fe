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
  SelectItem,
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FileText, AlertTriangle, CheckCircle, Clock, Plus, Pencil, MoreVertical, Trash, Eye, X } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { apiService } from "@/api/Api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import Cookies from "js-cookie";
import { useAuth } from "@/Authentication/AuthContext";

// Validation schema for the report form
const reportSchema = z.object({
  title: z.string().min(5, "Tiêu đề phải có ít nhất 5 ký tự"),
  content: z.string().min(20, "Nội dung phải có ít nhất 20 ký tự"),
  type: z.string().min(1, "Vui lòng chọn loại báo cáo"),
  level: z.string().min(1, "Vui lòng chọn mức độ"),
  image: z.any().optional(),
});

// Thêm styles cho ảnh preview
const imagePreviewStyle = {
  maxWidth: '100px',
  maxHeight: '60px',
  objectFit: 'cover',
  borderRadius: '4px'
};

export default function StaffReportPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const form = useForm({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: "",
      content: "",
      type: "",
      level: "",
      image: null,
    },
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getReports();
      setReports(data);
    } catch (error) {
      toast.error(error.message || "Không thể tải danh sách báo cáo");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      let imageUrl = null;

      if (!user?.id) {
        throw new Error("Không thể lấy thông tin người dùng. Vui lòng đăng nhập lại.");
      }

      if (values.image) {
        const uploadResponse = await apiService.uploadImage(values.image);
        imageUrl = uploadResponse.data;
      }

      const reportData = {
        staffId: user.id,
        title: values.title,
        content: values.content,
        type: values.type,
        level: values.level,
        image: imageUrl
      };

      console.log("Creating report with data:", reportData);

      if (selectedReport) {
        await apiService.updateReport(selectedReport.id, reportData);
        toast.success("Cập nhật báo cáo thành công");
      } else {
        await apiService.createReport(reportData);
        toast.success("Tạo báo cáo thành công");
      }
      
      setIsDialogOpen(false);
      form.reset();
      await fetchReports();
    } catch (error) {
      console.error("Error in onSubmit:", error);
      toast.error(error.message || "Không thể tạo báo cáo");
      
      
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (report) => {
    try {
      setIsDeleting(true);
      console.log("Deleting report with ID:", report.id);
      
      const response = await apiService.deleteReport(report.id);
      console.log("Delete response:", response);
      
      toast.success("Xóa báo cáo thành công");
      setShowDeleteDialog(false);
      await fetchReports(); // Refresh list after deleting
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.message || "Không thể xóa báo cáo. Vui lòng thử lại sau.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "text-yellow-500";
      case "resolved":
        return "text-green-500";
      case "urgent":
        return "text-red-500";
      default:
        return "";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4" />;
      case "urgent":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "Đang xử lý";
      case "resolved":
        return "Đã xử lý";
      case "urgent":
        return "Khẩn cấp";
      default:
        return status;
    }
  };

  const viewReportDetail = async (report) => {
    try {
      setIsLoadingDetail(true);
      const response = await apiService.getReportById(report.id);
      // Check if response has value property
      const detailData = response.value || response;
      setSelectedReport(detailData);
      setShowDetailDialog(true);
    } catch (error) {
      toast.error(error.message || "Không thể tải chi tiết báo cáo");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleImageChange = (e, field) => {
    const file = e.target.files?.[0];
    if (file) {
      field.onChange(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      field.onChange(null);
      setImagePreview(null);
    }
  };

  useEffect(() => {
    if (!isDialogOpen) {
      setImagePreview(null);
    }
  }, [isDialogOpen]);

  const handleEditClick = async (report) => {
    try {
      // Get report details first
      const response = await apiService.getReportById(report.id);
      const detailData = response.value || response;
      console.log("Report detail data:", detailData);

      setSelectedReport(detailData);
      setIsDialogOpen(true);
      // Set image preview from the report's image URL
      setImagePreview(detailData.imageUrl || detailData.image);
      
      form.reset({
        title: detailData.title,
        content: detailData.content,
        type: detailData.type,
        level: detailData.level,
        image: null // Reset image field but keep preview
      });
    } catch (error) {
      console.error("Error fetching report details:", error);
      toast.error("Không thể tải thông tin báo cáo");
    }
  };

  // Add function to handle new report
  const handleNewReport = () => {
    setSelectedReport(null);
    setImagePreview(null);
    form.reset({
      title: "",
      content: "",
      type: "",
      level: "",
      image: null
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Danh sách báo cáo</CardTitle>
              <CardDescription className="text-base mt-2">
                Xem và tạo các báo cáo về vấn đề gặp phải
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-10" onClick={handleNewReport}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo báo cáo mới
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>
                    {selectedReport ? "Chỉnh sửa báo cáo" : "Tạo báo cáo mới"}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedReport 
                      ? "Chỉnh sửa thông tin báo cáo" 
                      : "Điền thông tin báo cáo về vấn đề bạn gặp phải"}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tiêu đề</FormLabel>
                          <FormControl>
                            <Input placeholder="Nhập tiêu đề báo cáo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-6 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Loại báo cáo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn loại báo cáo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="system">Lỗi hệ thống</SelectItem>
                                <SelectItem value="interface">Giao diện</SelectItem>
                                <SelectItem value="performance">Hiệu năng</SelectItem>
                                <SelectItem value="other">Khác</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="level"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mức độ</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn mức độ" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="high">Cao</SelectItem>
                                <SelectItem value="medium">Trung bình</SelectItem>
                                <SelectItem value="low">Thấp</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nội dung chi tiết</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Mô tả chi tiết về vấn đề..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hình ảnh đính kèm</FormLabel>
                          <FormControl>
                            <div className="space-y-4">
                              <Input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => handleImageChange(e, field)}
                                className="cursor-pointer"
                              />
                              {(imagePreview || selectedReport?.imageUrl || selectedReport?.image) && (
                                <div className="relative w-full max-w-[200px] aspect-video rounded-lg overflow-hidden border border-border">
                                  <img 
                                    src={imagePreview || selectedReport?.imageUrl || selectedReport?.image}
                                    alt="Preview" 
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      field.onChange(null);
                                      setImagePreview(null);
                                    }}
                                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                                  >
                                    <X className="h-4 w-4 text-white" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormDescription>
                            Đính kèm ảnh chụp màn hình hoặc hình ảnh liên quan (nếu có)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                            {selectedReport ? "Đang cập nhật..." : "Đang tạo..."}
                          </>
                        ) : (
                          selectedReport ? "Cập nhật báo cáo" : "Tạo báo cáo"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium text-left">Tiêu đề</TableHead>
                  <TableHead className="font-medium text-left">Trạng thái</TableHead>
                  <TableHead className="font-medium text-left">Hình ảnh</TableHead>
                  <TableHead className="font-medium text-left">Ngày tạo</TableHead>
                  <TableHead className="font-medium text-left">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
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
                ) : reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                      Chưa có báo cáo nào
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
                    <TableRow key={report.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium max-w-[300px] truncate text-left">
                        {report.title}
                      </TableCell>
                      <TableCell className="text-left">
                        <div className="flex items-center gap-2">
                          <span className={getStatusColor(report.status)}>
                            {getStatusIcon(report.status)}
                          </span>
                          <span>{getStatusText(report.status)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-left">
                        {report.image ? (
                          <img 
                            src={report.image} 
                            alt={report.title}
                            style={imagePreviewStyle}
                            onClick={() => {
                              setSelectedImage(report.image);
                              setShowImageDialog(true);
                            }}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                          />
                        ) : (
                          <span className="text-gray-500">Không có hình ảnh</span>
                        )}
                      </TableCell>
                      <TableCell className="text-left">
                        {format(new Date(report.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                      </TableCell>
                      <TableCell className="text-left space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewReportDetail(report)}
                          disabled={isLoadingDetail}
                          className="hover:bg-primary hover:text-white"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(report)}
                          className="hover:bg-blue-500 hover:text-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setShowDeleteDialog(true);
                          }}
                          className="hover:bg-red-500 hover:text-white"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa báo cáo này không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDelete(selectedReport)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                  Đang xóa...
                </>
              ) : (
                "Xóa"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Chi tiết báo cáo</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về báo cáo
            </DialogDescription>
          </DialogHeader>
          {isLoadingDetail ? (
            <div className="flex items-center justify-center h-32">
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
          ) : selectedReport && (
            <ScrollArea className="max-h-[80vh] overflow-auto">
              <div className="space-y-6 p-1">
                <div>
                  <h4 className="text-sm font-medium mb-2">Tiêu đề</h4>
                  <p className="text-base bg-muted/50 p-3 rounded-lg">{selectedReport.title}</p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Mã nhân viên</h4>
                    <div className="flex items-center gap-2 bg-muted/50 p-3 rounded-lg">
                      <span className="text-base">{selectedReport.staffId}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Ngày tạo</h4>
                    <p className="text-base bg-muted/50 p-3 rounded-lg">
                      {format(new Date(selectedReport.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Loại báo cáo</h4>
                    <p className="text-base bg-muted/50 p-3 rounded-lg">{selectedReport.type}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Mức độ</h4>
                    <p className="text-base bg-muted/50 p-3 rounded-lg">{selectedReport.level}</p>
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
                          className="max-w-full h-auto rounded"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <div className="relative">
            <Button
              variant="ghost"
              className="absolute top-2 right-2 rounded-full w-8 h-8 p-0 bg-black/50 hover:bg-black/70"
              onClick={() => setShowImageDialog(false)}
            >
              <X className="h-4 w-4 text-white" />
            </Button>
            <img 
              src={selectedImage} 
              alt="Preview"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 