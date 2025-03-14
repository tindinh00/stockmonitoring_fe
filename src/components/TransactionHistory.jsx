import React, { useState } from "react";
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search,
  ChevronLeft,
  ChevronRight,
  Download
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TransactionHistory = ({ transactions = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Dữ liệu mẫu nếu không có dữ liệu thực
  const demoTransactions = [
    {
      id: "TRX-001",
      date: "2023-03-15",
      amount: "999.000",
      type: "payment",
      description: "Thanh toán gói Premium",
      status: "completed",
    },
    {
      id: "TRX-002",
      date: "2023-02-28",
      amount: "499.000",
      type: "payment",
      description: "Thanh toán gói Cơ bản",
      status: "completed",
    },
    {
      id: "TRX-003",
      date: "2023-02-15",
      amount: "200.000",
      type: "refund",
      description: "Hoàn tiền gói dịch vụ",
      status: "completed",
    },
    {
      id: "TRX-004",
      date: "2023-01-10",
      amount: "1.999.000",
      type: "payment",
      description: "Thanh toán gói VIP",
      status: "pending",
    },
    {
      id: "TRX-005",
      date: "2022-12-25",
      amount: "999.000",
      type: "payment",
      description: "Thanh toán gói Premium",
      status: "failed",
    },
    {
      id: "TRX-006",
      date: "2022-11-15",
      amount: "499.000",
      type: "payment",
      description: "Thanh toán gói Cơ bản",
      status: "completed",
    },
    {
      id: "TRX-007",
      date: "2022-10-05",
      amount: "999.000",
      type: "payment",
      description: "Thanh toán gói Premium",
      status: "completed",
    },
  ];
  
  const displayTransactions = transactions.length > 0 ? transactions : demoTransactions;
  
  // Lọc giao dịch theo tìm kiếm và trạng thái
  const filteredTransactions = displayTransactions.filter(transaction => {
    const matchesSearch = 
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Phân trang
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  
  // Hàm định dạng ngày
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };
  
  // Hàm lấy thông tin trạng thái
  const getStatusInfo = (status) => {
    switch (status) {
      case "completed":
        return {
          color: "bg-green-100 text-green-800",
          icon: <CheckCircle2 className="h-4 w-4 mr-1" />,
          text: "Hoàn thành",
        };
      case "pending":
        return {
          color: "bg-yellow-100 text-yellow-800",
          icon: <Clock className="h-4 w-4 mr-1" />,
          text: "Đang xử lý",
        };
      case "failed":
        return {
          color: "bg-red-100 text-red-800",
          icon: <XCircle className="h-4 w-4 mr-1" />,
          text: "Thất bại",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          icon: null,
          text: status,
        };
    }
  };
  
  // Hàm lấy thông tin loại giao dịch
  const getTypeInfo = (type) => {
    switch (type) {
      case "payment":
        return {
          color: "text-red-500",
          icon: <ArrowUpCircle className="h-4 w-4 mr-1" />,
          prefix: "-",
        };
      case "refund":
        return {
          color: "text-green-500",
          icon: <ArrowDownCircle className="h-4 w-4 mr-1" />,
          prefix: "+",
        };
      default:
        return {
          color: "text-gray-500",
          icon: null,
          prefix: "",
        };
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch sử giao dịch</CardTitle>
        <CardDescription>Xem lịch sử các giao dịch của bạn</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm giao dịch..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="completed">Hoàn thành</SelectItem>
              <SelectItem value="pending">Đang xử lý</SelectItem>
              <SelectItem value="failed">Thất bại</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Không tìm thấy giao dịch nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã giao dịch</TableHead>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.map((transaction) => {
                  const { color, icon, text } = getStatusInfo(transaction.status);
                  const { color: typeColor, icon: typeIcon, prefix } = getTypeInfo(transaction.type);
                  
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.id}</TableCell>
                      <TableCell>{formatDate(transaction.date)}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className={typeColor}>
                        <span className="flex items-center">
                          {typeIcon}
                          {prefix}{transaction.amount} VNĐ
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={color}>
                          <span className="flex items-center">
                            {icon}
                            {text}
                          </span>
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center border-t pt-6">
        <div className="flex items-center mb-4 sm:mb-0">
          <p className="text-sm text-muted-foreground">
            Hiển thị {Math.min(filteredTransactions.length, startIndex + 1)}-{Math.min(filteredTransactions.length, startIndex + itemsPerPage)} trong số {filteredTransactions.length} giao dịch
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="ml-2">
            <Download className="h-4 w-4 mr-2" />
            Xuất PDF
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default TransactionHistory; 