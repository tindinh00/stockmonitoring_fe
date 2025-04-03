import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Save, X, Percent, Package, ArrowUpDown, Search, AlertCircle, RefreshCw, AlertTriangle, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiService } from "@/api/Api";

export default function PackageManagementPage() {
  const [packages, setPackages] = useState([]);
  const [allPackages, setAllPackages] = useState([]); // Tất cả gói dịch vụ cho client-side pagination
  const [editingPackage, setEditingPackage] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(3);
  const [newPackage, setNewPackage] = useState({
    name: "",
    description: "",
    price: "",
    discountedPrice: "",
    features: []
  });
  const [errors, setErrors] = useState({});
  const [features, setFeatures] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [useServerPagination, setUseServerPagination] = useState(true); // Mặc định dùng phân trang server-side

  // Fetch packages from API
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        setError(null);

        // Luôn lấy tất cả dữ liệu (API không hỗ trợ phân trang đúng)
        const response = await apiService.getPackages(1, 100);
        console.log("API response:", response);
          
        // Xác định dữ liệu packages từ response
        let allData = [];
        if (response && response.value && response.value.data) {
          // Cấu trúc { value: { data: [...] } }
          allData = response.value.data;
        } else if (response && Array.isArray(response)) {
          // API trả về mảng trực tiếp
          allData = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          // Cấu trúc { data: [...] }
          allData = response.data;
        } else {
          console.error("Unexpected API response format:", response);
          setError("Định dạng dữ liệu không hợp lệ");
          setLoading(false);
          return;
        }
          
        console.log(`Received ${allData.length} packages in total`);
        
        // Lưu tất cả packages để dùng cho phân trang
        setAllPackages(allData);
        
        // Tính toán tổng số trang và tổng số items
        const calculatedTotalItems = allData.length;
        const calculatedTotalPages = Math.ceil(calculatedTotalItems / pageSize);
        console.log(`Total items: ${calculatedTotalItems}, Total pages: ${calculatedTotalPages} with pageSize ${pageSize}`);
        
        setTotalItems(calculatedTotalItems);
        setTotalPages(Math.max(calculatedTotalPages, 1)); // Đảm bảo ít nhất 1 trang
        
        // Tính toán các packages để hiển thị cho trang hiện tại
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        console.log(`Current page: ${currentPage}, Showing items from ${startIndex} to ${endIndex-1}`);
        
        // Cắt dữ liệu cho trang hiện tại
        const currentPageData = allData.slice(startIndex, endIndex);
        setPackages(currentPageData);
        console.log(`Displaying ${currentPageData.length} items on current page`);
      } catch (err) {
        console.error("Failed to fetch packages:", err);
        setError(err.message || "Không thể tải danh sách gói dịch vụ");
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [currentPage, pageSize]);

  // Fetch features when component mounts
  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const data = await apiService.getFeatures();
        setFeatures(data);
      } catch (error) {
        console.error("Failed to fetch features:", error);
        toast.error("Không thể tải danh sách tính năng");
      }
    };

    fetchFeatures();
  }, []);

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
  };

  const handleSave = (pkg) => {
    const validationErrors = validatePackage(pkg);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }
    
    setPackages(packages.map(p => p.id === pkg.id ? pkg : p));
    setEditingPackage(null);
    setErrors({});
    toast.success("Cập nhật gói thành công!");
  };

  const handleDelete = async (id) => {
    try {
      setIsDeleting(true);
      // Gọi API xóa gói
      await apiService.deletePackage(id);
      
      // Cập nhật state sau khi xóa thành công
      setPackages(packages.filter(p => p.id !== id));
      setShowDeleteDialog(false);
      toast.success("Xóa gói thành công!");
    } catch (error) {
      console.error("Failed to delete package:", error);
      toast.error(error.message || "Không thể xóa gói. Vui lòng thử lại!");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddFeature = (pkg) => {
    setEditingPackage({
      ...pkg,
      features: [...pkg.features, ""]
    });
  };

  const handleRemoveFeature = (pkg, index) => {
    setEditingPackage({
      ...pkg,
      features: pkg.features.filter((_, i) => i !== index)
    });
  };

  const handleFeatureChange = (pkg, index, value) => {
    const newFeatures = [...pkg.features];
    newFeatures[index] = value;
    setEditingPackage({
      ...pkg,
      features: newFeatures
    });
  };

  const handleAddNew = () => {
    setNewPackage({
      name: "",
      description: "",
      price: "",
      discountedPrice: "",
      features: []
    });
    setErrors({});
    setIsAddingNew(true);
  };

  const validatePackage = (pkg) => {
    const newErrors = {};
    
    if (!pkg.name?.trim()) {
      newErrors.name = "Tên gói không được để trống";
    }
    
    if (!pkg.description?.trim()) {
      newErrors.description = "Mô tả không được để trống";
    }
    
    if (!pkg.price || pkg.price <= 0) {
      newErrors.price = "Giá bán phải lớn hơn 0";
    }

    if (!pkg.discountedPrice || pkg.discountedPrice <= 0) {
      newErrors.discountedPrice = "Giá khuyến mãi phải lớn hơn 0";
    }
    
    if (parseFloat(pkg.discountedPrice) > parseFloat(pkg.price)) {
      newErrors.discountedPrice = "Giá khuyến mãi không thể cao hơn giá gốc";
    }
    
    if (!pkg.features?.length) {
      newErrors.features = "Vui lòng chọn ít nhất một tính năng";
    }
    
    return newErrors;
  };

  const handleSaveNew = async () => {
    const validationErrors = validatePackage(newPackage);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    try {
      setIsCreating(true);
      // Tạo ID mới cho package
      const packageId = `pkg_${Math.random().toString(36).substr(2, 9)}`;
      
      // Tạo body request đúng format
      const requestBody = {
        id: packageId,
        name: newPackage.name,
        description: newPackage.description,
        price: parseFloat(newPackage.price),
        discountedPrice: parseFloat(newPackage.discountedPrice),
        duration: 2147483647,
        isActive: true,
        isDiscounted: parseFloat(newPackage.price) > parseFloat(newPackage.discountedPrice),
        featureIds: newPackage.features
      };

      await apiService.createPackage(requestBody);
      
      // Refresh danh sách gói
      const updatedPackages = await apiService.getPackages();
      setPackages(updatedPackages);
      
      setIsAddingNew(false);
      setNewPackage({
        name: "",
        description: "",
        price: "",
        discountedPrice: "",
        features: []
      });
      setErrors({});
      toast.success("Thêm gói mới thành công!");
    } catch (error) {
      console.error("Failed to create package:", error);
      toast.error(error.message || "Không thể tạo gói mới. Vui lòng thử lại!");
    } finally {
      setIsCreating(false);
    }
  };

  // Tính phần trăm giảm giá
  const calculateDiscountPercentage = (originalPrice, salePrice) => {
    if (!originalPrice || !salePrice || originalPrice <= salePrice) return 0;
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  };

  // Lọc và sắp xếp gói
  const filteredPackages = (packages || [])
    .filter(pkg => {
      // Lọc theo tab
      if (activeTab === "onSale" && !pkg.isDiscounted) return false;
      
      // Lọc theo tìm kiếm
      if (searchTerm && !pkg.name?.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !pkg.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sắp xếp
      if (sortBy === "name") {
        return sortOrder === "asc" 
          ? (a.name || '').localeCompare(b.name || '') 
          : (b.name || '').localeCompare(a.name || '');
      } else if (sortBy === "price") {
        return sortOrder === "asc" 
          ? (a.price || 0) - (b.price || 0) 
          : (b.price || 0) - (a.price || 0);
      }
      return 0;
    });

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const renderInput = (label, value, onChange, error, type = "text", placeholder = "") => (
    <div>
      <Label className="flex items-center gap-2">
        {label}
        {error && (
          <span className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </span>
        )}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`mt-1.5 ${error ? 'border-destructive' : ''}`}
      />
    </div>
  );

  const renderFeatureInput = (feature, index, features, onChange, onRemove, error) => (
    <div key={index} className="flex gap-2">
      <div className="flex-1">
        <Input
          value={feature}
          onChange={(e) => onChange(e.target.value, index)}
          placeholder="Nhập tính năng"
          className={error ? 'border-destructive' : ''}
        />
        {index === features.length - 1 && error && (
          <p className="text-xs text-destructive mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
      </div>
      <Button
        variant="destructive"
        size="icon"
        onClick={() => onRemove(index)}
        disabled={features.length === 1}
        className="flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );

  const renderStatsInput = (label, value, onChange, error, placeholder = "") => (
    <div>
      <Label className="flex items-center gap-2">
        {label}
        {error && (
          <span className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </span>
        )}
      </Label>
      <Input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`mt-1.5 ${error ? 'border-destructive' : ''}`}
      />
    </div>
  );

  // Xử lý mở dialog chỉnh sửa
  const handleOpenEditDialog = (pkg) => {
    console.log("Opening edit dialog for package:", pkg); // Debug log
    
    // Map featuresName sang featureIds
    const getFeatureIdsByNames = (featureNames) => {
      if (!featureNames || !Array.isArray(featureNames)) return [];
      
      const selectedFeatureIds = [];
      featureNames.forEach(name => {
        const feature = features.find(f => f.name === name);
        if (feature) {
          selectedFeatureIds.push(feature.id);
        }
      });
      
      return selectedFeatureIds;
    };

    // Lấy danh sách featureIds từ featuresName
    const currentFeatureIds = getFeatureIdsByNames(pkg.featuresName);
    console.log("Current feature IDs:", currentFeatureIds); // Debug feature IDs
    
    setEditingPackage({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      price: pkg.price,
      discountedPrice: pkg.discountedPrice || pkg.price,
      features: currentFeatureIds
    });
    setShowEditDialog(true);
  };

  // Xử lý lưu chỉnh sửa
  const handleSaveEdit = async () => {
    console.log("Saving package with data:", editingPackage); // Debug save data
    
    const validationErrors = validatePackage(editingPackage);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    try {
      setIsUpdating(true);
      // Đảm bảo features là mảng và loại bỏ null
      const selectedFeatureIds = Array.isArray(editingPackage.features) 
        ? editingPackage.features.filter(id => id !== null)
        : [];
      
      console.log("Selected feature IDs before update:", selectedFeatureIds); // Debug log
      
      // Tạo body request đúng format
      const requestBody = {
        id: editingPackage.id,
        name: editingPackage.name,
        description: editingPackage.description,
        price: parseFloat(editingPackage.price),
        discountedPrice: parseFloat(editingPackage.discountedPrice),
        duration: 2147483647,
        isActive: true,
        isDiscounted: parseFloat(editingPackage.price) > parseFloat(editingPackage.discountedPrice),
        featureIds: selectedFeatureIds
      };

      console.log("Sending update request with body:", requestBody); // Debug request body
      
      // Gọi API update package
      const response = await apiService.updatePackage(editingPackage.id, requestBody);
      console.log("Update response:", response); // Debug response

      // Refresh danh sách gói
      const updatedPackages = await apiService.getPackages();
      setPackages(updatedPackages);

      setShowEditDialog(false);
      setEditingPackage(null);
      setErrors({});
      toast.success("Cập nhật gói thành công!");
    } catch (error) {
      console.error("Failed to update package:", error);
      toast.error(error.message || "Không thể cập nhật gói. Vui lòng thử lại!");
    } finally {
      setIsUpdating(false);
    }
  };

  // Toggle pagination mode
  const togglePaginationMode = () => {
    setUseServerPagination(!useServerPagination);
    setCurrentPage(1); // Reset trang khi chuyển chế độ
  };

  // Handle page changes
  const handlePageChange = (page) => {
    console.log(`Changing to page ${page} (Total pages: ${totalPages})`);
    
    // Validate page number
    if (page < 1 || page > totalPages) {
      console.log(`Page ${page} is out of bounds (1-${totalPages})`);
      return;
    }
    
    // Update current page
    setCurrentPage(page);
    
    // Không cần gọi lại API vì chúng ta đã có tất cả dữ liệu
    // Chỉ cần cắt lại dữ liệu cho trang mới
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const newPageData = allPackages.slice(startIndex, endIndex);
    
    console.log(`Setting new page data: ${newPageData.length} items (from index ${startIndex} to ${endIndex-1})`);
    setPackages(newPageData);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý gói dịch vụ</h1>
        <Button onClick={handleAddNew} className="text-black bg-white hover:bg-black hover:text-white border border-black">
          <Plus className="w-4 h-4 mr-2" /> 
          Thêm gói mới
        </Button>
      </div>

      <div className="space-y-6">
        {/* Search and Sort */}
        <div className="flex justify-between items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Tìm kiếm gói..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white text-black"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => toggleSort("name")}
              className="flex items-center gap-1 text-white"
            >
              Tên
              <ArrowUpDown className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              onClick={() => toggleSort("price")}
              className="flex items-center gap-1 text-white"
            >
              Giá
              <ArrowUpDown className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Tất cả gói</TabsTrigger>
            <TabsTrigger value="onSale">Đang giảm giá</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Packages Grid */}
        {loading ? (
          <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Đang tải dữ liệu...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
            <h3 className="mt-4 text-lg font-medium text-destructive">Có lỗi xảy ra</h3>
            <p className="mt-1 text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tải lại trang
            </Button>
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">Không tìm thấy gói dịch vụ</h3>
            <p className="mt-1 text-muted-foreground">Thử tìm kiếm với từ khóa khác hoặc tạo gói mới</p>
            <Button onClick={handleAddNew} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Thêm gói mới
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPackages.map((pkg) => (
              <Card 
                key={pkg.id} 
                className="group relative border border-gray-800/60 bg-[#0D1117] shadow-sm transition-all duration-300"
              >
                <div className="p-5 flex flex-col h-full">
                  {/* Top section - Price and package name */}
                  <div className="text-center mb-4">
                    {pkg.isDiscounted && (
                      <Badge className="absolute top-2 right-2 bg-[#09D1C7] text-black text-xs px-2 py-0.5">
                        Phổ biến
                      </Badge>
                    )}
                    
                    <h3 className="text-lg font-semibold text-white mb-1">{pkg.name}</h3>
                    
                    <div className="text-2xl font-bold text-white mb-1">
                      {pkg.discountedPrice ? pkg.discountedPrice.toLocaleString() : pkg.price.toLocaleString()}đ
                      <span className="text-xs font-normal text-gray-400"> / gói</span>
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      {pkg.duration === 2147483647 ? "Vĩnh viễn" : `${pkg.duration} ngày`}
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div className="mb-4 text-center">
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {pkg.description}
                    </p>
                  </div>
                  
                  {/* Services section */}
                  <div className="border-t border-b border-gray-800/60 py-4 mb-4">
                    <div className="text-xs font-medium text-gray-400 uppercase mb-3">
                      Dịch vụ bao gồm:
                    </div>
                    
                    <ul className="space-y-2">
                      {pkg.featuresName && pkg.featuresName.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-xs">
                          <Check className="w-3.5 h-3.5 text-[#09D1C7] flex-shrink-0 mt-0.5" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Savings section */}
                  {pkg.price > 0 && (
                    <div className="text-center mb-4">
                      <span className="text-[#09D1C7] text-xs">
                        {pkg.isDiscounted && pkg.price > pkg.discountedPrice
                          ? `Tiết kiệm ${((pkg.price - pkg.discountedPrice) / 1000).toFixed(0)}K`
                          : `Tiết kiệm ${((pkg.price * 0.1) / 1000).toFixed(0)}K khi đăng ký gói năm`}
                      </span>
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <Button 
                      size="sm"
                      className="bg-[#09D1C7] hover:bg-[#09D1C7]/90 text-white text-xs font-medium"
                      onClick={() => handleOpenEditDialog(pkg)}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Sửa
                    </Button>
                    
                    <Button 
                      size="sm"
                      variant="outline" 
                      className="border-gray-700 hover:border-red-500/50 hover:bg-red-500/10 text-gray-300 hover:text-red-400 text-xs"
                      onClick={() => {
                        setSelectedPackage(pkg);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Xóa
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Add this after the packages grid div */}
        {!loading && !error && filteredPackages.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-800/60">
            <div className="text-sm text-gray-400">
              Hiển thị <span className="font-medium text-white">{filteredPackages.length}</span> gói
              {totalItems > 0 && (
                <> trên tổng số <span className="font-medium text-white">{totalItems}</span></>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="h-8 w-8 p-0 border-gray-800"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Trang trước</span>
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  // Show 5 pages centered around current page
                  let pageNumber = currentPage - 2 + i;
                  
                  // Adjust if we're at the beginning
                  if (currentPage < 3) {
                    pageNumber = i + 1;
                  }
                  
                  // Adjust if we're at the end
                  if (currentPage > totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                    if (pageNumber <= 0) return null;
                  }
                  
                  // Don't render if out of bounds
                  if (pageNumber <= 0 || pageNumber > totalPages) return null;
                  
                  return (
                    <Button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      className={`h-8 w-8 p-0 ${
                        currentPage === pageNumber
                          ? "bg-[#09D1C7] text-black hover:bg-[#09D1C7]/90"
                          : "border-gray-800 text-gray-300"
                      }`}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="h-8 w-8 p-0 border-gray-800"
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Trang sau</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Package Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa gói dịch vụ</DialogTitle>
            <DialogDescription>
              Chỉnh sửa thông tin chi tiết về gói dịch vụ
            </DialogDescription>
          </DialogHeader>
          
          {editingPackage && (
            <div className="grid gap-6 py-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="edit-name" className="text-sm font-medium">
                    Tên gói
                    {errors.name && (
                      <span className="text-xs text-destructive ml-2">
                        {errors.name}
                      </span>
                    )}
                  </Label>
                  <Input
                    id="edit-name"
                    placeholder="Nhập tên gói dịch vụ"
                    value={editingPackage.name}
                    onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                    className={errors.name ? "border-destructive" : ""}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-description" className="text-sm font-medium">
                    Mô tả
                    {errors.description && (
                      <span className="text-xs text-destructive ml-2">
                        {errors.description}
                      </span>
                    )}
                  </Label>
                  <Input
                    id="edit-description"
                    placeholder="Nhập mô tả về gói dịch vụ"
                    value={editingPackage.description}
                    onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })}
                    className={errors.description ? "border-destructive" : ""}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-price" className="text-sm font-medium">
                      Giá gốc
                      {errors.price && (
                        <span className="text-xs text-destructive ml-2">
                          {errors.price}
                        </span>
                      )}
                    </Label>
                    <Input
                      id="edit-price"
                      type="number"
                      placeholder="Nhập giá gốc"
                      value={editingPackage.price}
                      onChange={(e) => setEditingPackage({ ...editingPackage, price: e.target.value })}
                      className={errors.price ? "border-destructive" : ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-discountedPrice" className="text-sm font-medium">
                      Giá khuyến mãi
                      {errors.discountedPrice && (
                        <span className="text-xs text-destructive ml-2">
                          {errors.discountedPrice}
                        </span>
                      )}
                    </Label>
                    <Input
                      id="edit-discountedPrice"
                      type="number"
                      placeholder="Nhập giá khuyến mãi"
                      value={editingPackage.discountedPrice}
                      onChange={(e) => setEditingPackage({ ...editingPackage, discountedPrice: e.target.value })}
                      className={errors.discountedPrice ? "border-destructive" : ""}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Tính năng
                  {errors.features && (
                    <span className="text-xs text-destructive ml-2">
                      {errors.features}
                    </span>
                  )}
                </Label>
                <div className="mt-2 grid grid-cols-2 gap-4 max-h-[200px] overflow-y-auto border rounded-lg p-4">
                  {features.map((feature) => {
                    // Kiểm tra xem feature có trong danh sách features của gói không
                    const isSelected = editingPackage.features.includes(feature.id);
                    console.log(`Feature ${feature.id} (${feature.name}) selected:`, isSelected); // Debug

                    return (
                      <div key={feature.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`edit-feature-${feature.id}`}
                          checked={isSelected}
                          onChange={(e) => {
                            let newFeatures;
                            if (e.target.checked) {
                              // Thêm feature mới
                              newFeatures = [...editingPackage.features, feature.id];
                            } else {
                              // Xóa feature
                              newFeatures = editingPackage.features.filter(
                                id => id !== feature.id
                              );
                            }
                            
                            console.log("Updating features to:", newFeatures); // Debug
                            setEditingPackage({
                              ...editingPackage,
                              features: newFeatures
                            });
                          }}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label 
                          htmlFor={`edit-feature-${feature.id}`}
                          className={`text-sm cursor-pointer ${
                            isSelected 
                              ? 'text-primary font-medium' 
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {feature.name}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setEditingPackage(null);
                setErrors({});
              }}
              disabled={isUpdating}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleSaveEdit}
              disabled={!editingPackage?.name || !editingPackage?.description || !editingPackage?.price || !editingPackage?.features.length || isUpdating}
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Package Dialog */}
      <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Thêm gói dịch vụ mới</DialogTitle>
            <DialogDescription>
              Điền thông tin chi tiết về gói dịch vụ mới
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">
                  Tên gói
                  {errors.name && (
                    <span className="text-xs text-destructive ml-2">
                      {errors.name}
                    </span>
                  )}
                </Label>
                <Input
                  id="name"
                  placeholder="Nhập tên gói dịch vụ"
                  value={newPackage.name}
                  onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                  className={errors.name ? "border-destructive" : ""}
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Mô tả
                  {errors.description && (
                    <span className="text-xs text-destructive ml-2">
                      {errors.description}
                    </span>
                  )}
                </Label>
                <Input
                  id="description"
                  placeholder="Nhập mô tả về gói dịch vụ"
                  value={newPackage.description}
                  onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                  className={errors.description ? "border-destructive" : ""}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price" className="text-sm font-medium">
                    Giá gốc
                    {errors.price && (
                      <span className="text-xs text-destructive ml-2">
                        {errors.price}
                      </span>
                    )}
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="Nhập giá gốc"
                    value={newPackage.price}
                    onChange={(e) => setNewPackage({ ...newPackage, price: e.target.value })}
                    className={errors.price ? "border-destructive" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="discountedPrice" className="text-sm font-medium">
                    Giá khuyến mãi
                    {errors.discountedPrice && (
                      <span className="text-xs text-destructive ml-2">
                        {errors.discountedPrice}
                      </span>
                    )}
                  </Label>
                  <Input
                    id="discountedPrice"
                    type="number"
                    placeholder="Nhập giá khuyến mãi"
                    value={newPackage.discountedPrice}
                    onChange={(e) => setNewPackage({ ...newPackage, discountedPrice: e.target.value })}
                    className={errors.discountedPrice ? "border-destructive" : ""}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">
                Tính năng
                {errors.features && (
                  <span className="text-xs text-destructive ml-2">
                    {errors.features}
                  </span>
                )}
              </Label>
              <div className="mt-2 grid grid-cols-2 gap-4 max-h-[200px] overflow-y-auto border rounded-lg p-4">
                {features.map((feature) => (
                  <div key={feature.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`feature-${feature.id}`}
                      checked={newPackage.features.includes(feature.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewPackage({
                            ...newPackage,
                            features: [...newPackage.features, feature.id]
                          });
                        } else {
                          setNewPackage({
                            ...newPackage,
                            features: newPackage.features.filter(id => id !== feature.id)
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label 
                      htmlFor={`feature-${feature.id}`}
                      className="text-sm text-gray-600 cursor-pointer hover:text-gray-900"
                    >
                      {feature.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingNew(false);
                setErrors({});
                setNewPackage({
                  name: "",
                  description: "",
                  price: "",
                  discountedPrice: "",
                  features: []
                });
              }}
              disabled={isCreating}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleSaveNew}
              disabled={!newPackage.name || !newPackage.description || !newPackage.price || !newPackage.features.length || isCreating}
            >
              {isCreating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Lưu
                </>
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
              Xác nhận xóa gói
            </DialogTitle>
            <DialogDescription>
              Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa gói này?
            </DialogDescription>
          </DialogHeader>
          {selectedPackage && (
            <div className="py-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tên gói:</span>
                  <span className="font-medium">{selectedPackage.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Giá gốc:</span>
                  <span className="font-medium">{selectedPackage.price.toLocaleString()}đ</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Giá khuyến mãi:</span>
                  <span className="font-medium">{selectedPackage.discountedPrice.toLocaleString()}đ</span>
                </div>
                {selectedPackage.featuresName && selectedPackage.featuresName.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Tính năng:</span>
                    <ul className="mt-2 space-y-1">
                      {selectedPackage.featuresName.map((feature, index) => (
                        <li key={index} className="text-sm flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              Hủy
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleDelete(selectedPackage.id)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa gói
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 