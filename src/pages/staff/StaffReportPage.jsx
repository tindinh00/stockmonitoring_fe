import React, { useState } from 'react';
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FileText, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

// Validation schema for the report form
const reportSchema = z.object({
  title: z.string().min(5, "Tiêu đề phải có ít nhất 5 ký tự"),
  type: z.string(),
  description: z.string().min(20, "Mô tả phải có ít nhất 20 ký tự"),
  severity: z.string(),
  attachment: z.any().optional(),
});

// Mock data for reports
const mockReports = [
  {
    id: 1,
    title: "Lỗi không thể đặt lệnh mua",
    type: "Lỗi hệ thống",
    severity: "high",
    status: "pending",
    createdAt: new Date(),
    description: "Người dùng không thể đặt lệnh mua cổ phiếu do lỗi kết nối",
  },
  {
    id: 2,
    title: "Giao diện không hiển thị đúng",
    type: "Giao diện",
    severity: "medium",
    status: "resolved",
    createdAt: new Date(Date.now() - 86400000),
    description: "Biểu đồ giá không hiển thị chính xác trên mobile",
  },
];

export default function StaffReportPage() {
  const [reports, setReports] = useState(mockReports);
  const form = useForm({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: "",
      type: "",
      description: "",
      severity: "",
    },
  });

  const onSubmit = (data) => {
    const newReport = {
      id: reports.length + 1,
      ...data,
      status: "pending",
      createdAt: new Date(),
    };
    setReports([newReport, ...reports]);
    form.reset();
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-green-500";
      default:
        return "";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "urgent":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Create Report Form */}
        <Card className="h-fit">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Tạo báo cáo mới</CardTitle>
            <CardDescription className="text-base">
              Tạo báo cáo về các vấn đề được phản ánh từ người dùng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Tiêu đề</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nhập tiêu đề báo cáo" 
                          className="h-10"
                          {...field} 
                        />
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
                        <FormLabel className="text-base">Loại khiếu nại</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Chọn loại khiếu nại" />
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
                    name="severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Mức độ nghiêm trọng</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10">
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Mô tả chi tiết</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Mô tả chi tiết về vấn đề..."
                          className="min-h-[120px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="attachment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">File đính kèm</FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          className="h-10"
                          {...field} 
                          value={field.value?.fileName} 
                        />
                      </FormControl>
                      <FormDescription className="text-sm">
                        Đính kèm ảnh chụp màn hình hoặc file liên quan (nếu có)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full h-10 text-base">
                  Tạo báo cáo
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Reports List */}
        <Card className="h-fit">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Danh sách báo cáo</CardTitle>
            <CardDescription className="text-base">
              Xem tất cả các báo cáo đã tạo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium">Tiêu đề</TableHead>
                    <TableHead className="font-medium">Loại</TableHead>
                    <TableHead className="font-medium">Mức độ</TableHead>
                    <TableHead className="font-medium">Trạng thái</TableHead>
                    <TableHead className="font-medium">Ngày tạo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {report.title}
                      </TableCell>
                      <TableCell>{report.type}</TableCell>
                      <TableCell>
                        <span className={`font-medium ${getSeverityColor(report.severity)}`}>
                          {report.severity === "high" && "Cao"}
                          {report.severity === "medium" && "Trung bình"}
                          {report.severity === "low" && "Thấp"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(report.status)}
                          <span>
                            {report.status === "pending" && "Đang xử lý"}
                            {report.status === "resolved" && "Đã xử lý"}
                            {report.status === "urgent" && "Khẩn cấp"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {format(report.createdAt, "dd/MM/yyyy HH:mm", { locale: vi })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 