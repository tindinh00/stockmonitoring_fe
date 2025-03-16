import React, { useState } from "react";
import { Users, Ban, CheckCircle, Search, Filter, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Mock data - thay thế bằng API call sau
const initialUsers = [
  {
    id: 1,
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
    isBanned: false
  },
  {
    id: 2,
    email: "manager@example.com",
    name: "Manager User",
    role: "manager",
    isBanned: false
  },
  {
    id: 3,
    email: "staff@example.com",
    name: "Staff User",
    role: "staff",
    isBanned: false
  },
  {
    id: 4,
    email: "customer@example.com",
    name: "Customer User",
    role: "customer",
    isBanned: true
  },
];

// Định nghĩa các role và quyền chuyển đổi
const roles = ["customer", "staff", "manager"]; // Danh sách các role có thể chọn

const roleColors = {
  admin: "bg-purple-500",
  manager: "bg-blue-500",
  staff: "bg-green-500",
  customer: "bg-gray-500"
};

const ITEMS_PER_PAGE = 5; // Số lượng item trên mỗi trang

export default function UserManagementPage() {
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);

  // Lọc users theo search term và filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && !user.isBanned) ||
      (statusFilter === "banned" && user.isBanned);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Tính toán phân trang
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset về trang 1 khi filter thay đổi
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  // Xử lý mở dialog thay đổi role
  const handleOpenRoleDialog = (user, newRole) => {
    setSelectedUser(user);
    setSelectedRole(newRole);
    setShowRoleDialog(true);
  };

  // Xử lý thay đổi role
  const handleRoleChange = () => {
    if (!selectedUser || !selectedRole) return;

    setUsers(
      users.map((user) =>
        user.id === selectedUser.id
          ? {
              ...user,
              role: selectedRole,
            }
          : user
      )
    );
    setShowRoleDialog(false);
    toast.success("Cập nhật role thành công!");
  };

  // Xử lý mở dialog xóa user
  const handleOpenDeleteDialog = (user) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  // Xử lý mở dialog ban/unban user
  const handleOpenBanDialog = (user) => {
    setSelectedUser(user);
    setShowBanDialog(true);
  };

  // Xử lý ban/unban user
  const handleToggleBan = () => {
    if (!selectedUser) return;

    setUsers(
      users.map((user) =>
        user.id === selectedUser.id
          ? {
              ...user,
              isBanned: !user.isBanned,
            }
          : user
      )
    );
    setShowBanDialog(false);
    toast.success(
      `${selectedUser.isBanned ? "Bỏ chặn" : "Chặn"} người dùng thành công!`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="relative overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-center">
                <CardTitle className="text-2xl font-bold">Quản lý người dùng</CardTitle>
                <CardDescription>
                  Quản lý quyền và trạng thái của người dùng trong hệ thống
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="px-3 py-1 text-white">
                Tổng số: {users.length}
              </Badge>
            </div>

          </div>
        </CardHeader>
      </div>

      {/* Filters Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6">
            {/* Search and Filters */}
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm theo email hoặc tên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Lọc theo role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="banned">Đã bị chặn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Users Table */}
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-14 text-center font-medium">STT</TableHead>
                    <TableHead className="w-[300px] font-medium text-left">Email</TableHead>
                    <TableHead className="w-[250px] font-medium text-left">Họ và tên</TableHead>
                    <TableHead className="w-[180px] font-medium text-left">Role</TableHead>
                    <TableHead className="w-[140px] text-center font-medium">Trạng thái</TableHead>
                    <TableHead className="w-[120px] text-center font-medium">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user, index) => (
                    <TableRow key={user.id}>
                      <TableCell className="text-center font-medium">
                        {startIndex + index + 1}
                      </TableCell>
                      <TableCell className="font-medium text-primary text-left">
                        <div className="truncate max-w-[280px]" title={user.email}>
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-left">
                        <div className="truncate max-w-[230px]" title={user.name}>
                          {user.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-left">
                        <Select
                          value={user.role}
                          onValueChange={(newRole) => handleOpenRoleDialog(user, newRole)}
                          disabled={user.role === "admin"}
                        >
                          <SelectTrigger 
                            className={`
                              ${user.role === "admin" ? "opacity-50" : ""}
                              border-none bg-muted/50
                            `}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${roleColors[user.role]}`} />
                              <SelectValue>{user.role}</SelectValue>
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {roles.filter(role => role !== user.role).map((role) => (
                              <SelectItem key={role} value={role}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${roleColors[role]}`} />
                                  {role}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          {user.isBanned ? (
                            <Badge variant="destructive" className="font-normal">
                              <Ban className="w-3 h-3 mr-1" />
                              Đã chặn
                            </Badge>
                          ) : (
                            <Badge variant="success" className="font-normal">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Hoạt động
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <Button
                            variant={user.isBanned ? "outline" : "destructive"}
                            size="sm"
                            onClick={() => handleOpenBanDialog(user)}
                            disabled={user.role === "admin"}
                            className={`
                              ${user.role === "admin" ? "opacity-50" : ""}
                              ${user.isBanned ? "hover:bg-green-500 hover:text-white" : ""}
                            `}
                          >
                            {user.isBanned ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Bỏ chặn
                              </>
                            ) : (
                              <>
                                <Ban className="w-4 h-4 mr-1" />
                                Chặn
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Hiển thị {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)} 
                  trong số {filteredUsers.length} kết quả
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Change Confirmation Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận thay đổi role</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn thay đổi role của người dùng này?
            </DialogDescription>
          </DialogHeader>
          {selectedUser && selectedRole && (
            <div className="py-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Người dùng:</span>
                  <span className="font-medium">{selectedUser.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="font-medium">{selectedUser.email}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Role hiện tại:</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${roleColors[selectedUser.role]}`} />
                    <span className="font-medium">{selectedUser.role}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Role mới:</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${roleColors[selectedRole]}`} />
                    <span className="font-medium">{selectedRole}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleRoleChange}>
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Xác nhận xóa người dùng
            </DialogTitle>
            <DialogDescription>
              Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa người dùng này?
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Người dùng:</span>
                  <span className="font-medium">{selectedUser.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="font-medium">{selectedUser.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Role:</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${roleColors[selectedUser.role]}`} />
                    <span className="font-medium">{selectedUser.role}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={() => {
              setUsers(users.filter(u => u.id !== selectedUser?.id));
              setShowDeleteDialog(false);
              toast.success("Xóa người dùng thành công!");
            }}>
              Xóa người dùng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban/Unban Confirmation Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedUser?.isBanned ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Xác nhận bỏ chặn người dùng
                </>
              ) : (
                <>
                  <Ban className="w-5 h-5 text-destructive" />
                  Xác nhận chặn người dùng
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.isBanned
                ? "Người dùng sẽ có thể truy cập lại hệ thống sau khi được bỏ chặn."
                : "Người dùng sẽ không thể truy cập hệ thống sau khi bị chặn."}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Người dùng:</span>
                  <span className="font-medium">{selectedUser.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="font-medium">{selectedUser.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Role:</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${roleColors[selectedUser.role]}`} />
                    <span className="font-medium">{selectedUser.role}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Trạng thái hiện tại:</span>
                  <Badge variant={selectedUser.isBanned ? "destructive" : "success"} className="font-normal">
                    {selectedUser.isBanned ? (
                      <>
                        <Ban className="w-3 h-3 mr-1" />
                        Đã chặn
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Đang hoạt động
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
              Hủy
            </Button>
            <Button
              variant={selectedUser?.isBanned ? "default" : "destructive"}
              onClick={handleToggleBan}
            >
              {selectedUser?.isBanned ? "Bỏ chặn người dùng" : "Chặn người dùng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
