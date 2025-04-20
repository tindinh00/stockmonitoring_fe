import React, { useState, useEffect } from "react";
import { Users, Search, Filter, ChevronLeft, ChevronRight, AlertTriangle, Trash2, UserCog } from "lucide-react";
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
import { apiService } from "@/api/Api";

// Định nghĩa các role và quyền chuyển đổi
const roles = ["customer", "staff", "manager"]; // Danh sách các role có thể chọn

// Định nghĩa quyền chuyển đổi role
const roleUpgrades = {
  customer: ["staff", "manager"],
  staff: ["manager"],
  manager: []
};

const roleColors = {
  admin: "bg-purple-500",
  manager: "bg-blue-500",
  staff: "bg-green-500",
  customer: "bg-gray-500"
};

const ITEMS_PER_PAGE = 5; // Số lượng item trên mỗi trang

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Tải danh sách người dùng từ API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getUsers();
        
        // Chuyển đổi dữ liệu người dùng từ API sang định dạng cần thiết
        const formattedUsers = data.map(user => ({
          id: user.id || user._id || user.email, // Sử dụng email làm ID nếu không có ID
          email: user.email,
          name: user.name || user.fullName || user.username || "N/A",
          role: user.roleName?.toLowerCase() || user.role || "customer",
          isBanned: user.isActive === false,
          tier: user.tier || "Free",
          phone: user.phone || "N/A",
          isDeleted: user.isDeleted || false
        }));
        
        setUsers(formattedUsers);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        
        // Xử lý lỗi cụ thể
        if (err.message && (
            err.message.includes("Admin") || 
            err.message.includes("quyền truy cập") ||
            err.message.includes("Unauthorized") ||
            err.message.includes("Forbidden")
          )) {
          setError("Bạn không có quyền Admin để xem danh sách người dùng.");
          toast.error("Không có quyền Admin");
        } else {
          setError("Không thể tải danh sách người dùng. Vui lòng thử lại sau.");
          toast.error("Không thể tải danh sách người dùng");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Lọc users theo search term và filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter.toLowerCase();

    return matchesSearch && matchesRole;
  });

  // Tính toán phân trang
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset về trang 1 khi filter thay đổi
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  // Xử lý mở dialog thay đổi role
  const handleOpenRoleDialog = (user) => {
    setSelectedUser(user);
    setSelectedRole(null); // Reset selected role
    setShowRoleDialog(true);
  };

  // Lấy danh sách role có thể chuyển đổi dựa trên role hiện tại
  const getAvailableRoles = (currentRole) => {
    // Mapping từ chữ sang số
    const roleValues = {
      'customer': 1,
      'staff': 2,
      'manager': 3,
      'admin': 4
    };
    
    // Mảng tất cả các role theo thứ tự 
    const allRoles = ['customer', 'staff', 'manager'];
    
    // Nếu là admin thì không cho phép thay đổi
    if (currentRole === 'admin') return [];
    
    // Nếu là customer thì cho phép nâng lên staff hoặc manager
    if (currentRole === 'customer') {
      return ['staff', 'manager'];
    }
    
    // Nếu là staff hoặc manager thì chỉ cho phép thay đổi giữa staff và manager
    if (currentRole === 'staff' || currentRole === 'manager') {
      return allRoles.filter(role => 
        (role === 'staff' || role === 'manager') && role !== currentRole
      );
    }
    
    return [];
  };

  // Xử lý thay đổi role
  const handleRoleChange = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      setIsUpdatingRole(true);
      // Gọi API để thay đổi role của người dùng (API mới đã được cập nhật trong apiService)
      await apiService.updateUserRole(selectedUser.id, selectedRole);

      // Cập nhật state local
      setUsers(prevUsers =>
        prevUsers.map((user) =>
          user.id === selectedUser.id
            ? {
                ...user,
                role: selectedRole,
              }
            : user
        )
      );
      
      setShowRoleDialog(false);
      toast.success(`Đã thay đổi role của người dùng ${selectedUser.email} thành ${selectedRole}!`);
    } catch (error) {
      console.error("Failed to update user role:", error);
      toast.error(error.message || "Không thể cập nhật role. Vui lòng thử lại!");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // Xử lý mở dialog xóa user
  const handleOpenDeleteDialog = (user) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  // Xử lý xóa user
  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      setIsDeleting(true);
      // Gọi API để xóa người dùng
      await apiService.deleteUser(selectedUser.id);

      // Cập nhật state local
      setUsers(users.filter(user => user.id !== selectedUser.id));
      setShowDeleteDialog(false);
      toast.success("Xóa người dùng thành công!");
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error(error.message || "Không thể xóa người dùng. Vui lòng thử lại!");
    } finally {
      setIsDeleting(false);
    }
  };

  // Hiển thị thông báo loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
        <p className="ml-4 text-lg font-medium">Đang tải dữ liệu...</p>
      </div>
    );
  }

  // Hiển thị thông báo lỗi
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertTriangle size={48} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Đã xảy ra lỗi</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Thử lại</Button>
      </div>
    );
  }

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
            </div>

            <Separator />

            {/* Users Table */}
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-14 text-center font-medium">STT</TableHead>
                    <TableHead className="w-[250px] font-medium text-left">Email</TableHead>
                    <TableHead className="w-[180px] font-medium text-left">Họ và tên</TableHead>
                    <TableHead className="w-[120px] font-medium text-left">Số điện thoại</TableHead>
                    <TableHead className="w-[100px] font-medium text-left">Role</TableHead>
                    <TableHead className="w-[80px] font-medium text-center">Gói</TableHead>
                    <TableHead className="w-[240px] text-center font-medium">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map((user, index) => (
                      <TableRow key={user.id}>
                        <TableCell className="text-center font-medium">
                          {startIndex + index + 1}
                        </TableCell>
                        <TableCell className="font-medium text-primary text-left">
                          <div className="truncate max-w-[230px]" title={user.email}>
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-left">
                          <div className="truncate max-w-[180px]" title={user.name}>
                            {user.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-left">
                          <div className="truncate max-w-[120px]" title={user.phone}>
                            {user.phone}
                          </div>
                        </TableCell>
                        <TableCell className="text-left">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${roleColors[user.role]}`} />
                            <span>{user.role}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                            {user.tier}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenRoleDialog(user)}
                              disabled={user.role === "admin"}
                              className={`
                                ${user.role === "admin" ? "opacity-50" : ""}
                              `}
                            >
                              <UserCog className="w-4 h-4 mr-1" />
                              Role
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleOpenDeleteDialog(user)}
                              disabled={user.role === "admin"}
                              className={`
                                ${user.role === "admin" ? "opacity-50" : ""}
                              `}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Xóa
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Không tìm thấy người dùng nào phù hợp.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {paginatedUsers.length > 0 && (
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
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Change Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thay đổi role người dùng</DialogTitle>
            <DialogDescription>
              {selectedUser?.role === 'customer' 
                ? "Chọn role mới cho người dùng này" 
                : selectedUser?.role === 'staff'
                ? "Bạn có thể nâng cấp lên Manager"
                : "Bạn có thể chuyển về Staff"}
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
                  <span className="text-sm text-muted-foreground">Số điện thoại:</span>
                  <span className="font-medium">{selectedUser.phone}</span>
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
                  <Select 
                    value={selectedRole} 
                    onValueChange={setSelectedRole}
                    disabled={isUpdatingRole}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Chọn role mới" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableRoles(selectedUser.role).map((role) => (
                        <SelectItem key={role} value={role}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${roleColors[role]}`} />
                            <span>{role}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRoleDialog(false)}
              disabled={isUpdatingRole}
            >
              Hủy
            </Button>
            <Button
              onClick={handleRoleChange}
              disabled={!selectedRole || selectedRole === selectedUser?.role || isUpdatingRole}
            >
              {isUpdatingRole ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Đang cập nhật...
                </>
              ) : (
                "Xác nhận"
              )}
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
                  <span className="text-sm text-muted-foreground">Số điện thoại:</span>
                  <span className="font-medium">{selectedUser.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Role:</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${roleColors[selectedUser.role]}`} />
                    <span className="font-medium">{selectedUser.role}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Gói:</span>
                  <span className="font-medium">{selectedUser.tier}</span>
                </div>
              </div>
            </div>
          )}
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
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa người dùng
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
