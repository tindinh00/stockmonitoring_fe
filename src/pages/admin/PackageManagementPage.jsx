import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Save, X, Percent, Package, ArrowUpDown, Search, AlertCircle, RefreshCw, AlertTriangle } from "lucide-react";
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
  const [pageSize, setPageSize] = useState(10);
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

  // Fetch packages from API
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getPackages(currentPage, pageSize);
        console.log("Fetched packages:", data);
        setPackages(data || []);
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
      // Gọi API xóa gói
      await apiService.deletePackage(id);
      
      // Cập nhật state sau khi xóa thành công
      setPackages(packages.filter(p => p.id !== id));
      setShowDeleteDialog(false);
      toast.success("Xóa gói thành công!");
    } catch (error) {
      console.error("Failed to delete package:", error);
      toast.error(error.message || "Không thể xóa gói. Vui lòng thử lại!");
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
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý gói dịch vụ</h1>
        <Button onClick={handleAddNew} className="bg-white text-primary hover:bg-primary/100 hover:text-white">
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
              className="pl-9 bg-white text-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => toggleSort("name")}
              className="flex items-center gap-1 text-black"
            >
              Tên
              <ArrowUpDown className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              onClick={() => toggleSort("price")}
              className="flex items-center gap-1 text-black"
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
              <Card key={pkg.id} className={`overflow-hidden transition-all duration-200 hover:shadow-md ${pkg.isDiscounted ? 'border-red-500/30' : ''}`}>
                <CardHeader className={`pb-3 ${pkg.isDiscounted ? 'bg-red-500/5' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {pkg.name}
                        {pkg.isDiscounted && pkg.price > pkg.discountedPrice && (
                          <Badge variant="secondary" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                            <Percent className="w-3 h-3 mr-1" />
                            Giảm giá
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">{pkg.description}</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEditDialog(pkg)}
                        className="hover:bg-primary/5"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedPackage(pkg);
                          setShowDeleteDialog(true);
                        }}
                        className="hover:bg-destructive/90"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      {pkg.isDiscounted && pkg.price > pkg.discountedPrice ? (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-primary">{pkg.discountedPrice.toLocaleString()}đ</span>
                            <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                              Tiết kiệm {((pkg.price - pkg.discountedPrice) / 1000).toFixed(0)}K
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground line-through">{pkg.price.toLocaleString()}đ</span>
                        </div>
                      ) : (
                        <span className="text-2xl font-bold text-primary">{pkg.price.toLocaleString()}đ</span>
                      )}
                      <Badge variant="outline" className="bg-primary/5">
                        {pkg.duration === 2147483647 ? "Vĩnh viễn" : `${pkg.duration} ngày`}
                      </Badge>
                    </div>
                    {pkg.featuresName && pkg.featuresName.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Tính năng bao gồm:
                        </h4>
                        <ul className="space-y-1.5">
                          {pkg.featuresName.map((feature, index) => (
                            <li key={index} className="text-sm flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                              <span className="text-muted-foreground">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
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
            >
              Hủy
            </Button>
            <Button 
              onClick={handleSaveEdit}
              disabled={!editingPackage?.name || !editingPackage?.description || !editingPackage?.price || !editingPackage?.features.length}
            >
              <Save className="w-4 h-4 mr-2" />
              Lưu thay đổi
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
            >
              Hủy
            </Button>
            <Button 
              onClick={handleSaveNew}
              disabled={!newPackage.name || !newPackage.description || !newPackage.price || !newPackage.features.length}
            >
              <Save className="w-4 h-4 mr-2" />
              Lưu
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
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Hủy
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleDelete(selectedPackage.id)}
            >
              Xóa gói
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 