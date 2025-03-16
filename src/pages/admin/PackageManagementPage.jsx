import React, { useState } from "react";
import { Plus, Pencil, Trash2, Save, X, Percent, Package, ArrowUpDown, Search, AlertCircle } from "lucide-react";
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

// Mock data - replace with API calls later
const initialPackages = [
  {
    id: 1,
    name: "Basic Trader",
    price: 199000,
    originalPrice: 299000,
    onSale: true,
    description: "Khởi đầu hành trình đầu tư của bạn",
    features: [
      "AI Signals cơ bản",
      "5 chiến lược giao dịch",
      "Phân tích thị trường hàng ngày",
      "Cộng đồng Basic Trader",
      "Hỗ trợ qua email",
    ],
    stats: {
      accuracy: "85%",
      signals: "20/ngày",
      support: "12/5"
    }
  },
  {
    id: 2,
    name: "Elite Trader",
    price: 499000,
    originalPrice: 699000,
    onSale: true,
    description: "Tối ưu lợi nhuận với công nghệ AI",
    features: [
      "Tất cả tính năng Basic",
      "AI Signals nâng cao",
      "15 chiến lược độc quyền",
      "Phân tích realtime",
      "Cảnh báo thị trường 24/7",
      "Tư vấn 1-1 với chuyên gia",
    ],
    stats: {
      accuracy: "92%",
      signals: "50/ngày",
      support: "24/7"
    }
  },
  {
    id: 3,
    name: "Institutional",
    price: 1499000,
    originalPrice: 1499000,
    onSale: false,
    description: "Giải pháp toàn diện cho tổ chức",
    features: [
      "Tất cả tính năng Elite",
      "API tích hợp độc quyền",
      "AI Model tùy chỉnh",
      "Quản lý rủi ro chuyên sâu",
      "Báo cáo phân tích tùy chỉnh",
      "Đội ngũ hỗ trợ riêng",
      "Đào tạo trực tiếp",
    ],
    stats: {
      accuracy: "95%",
      signals: "100+/ngày",
      support: "24/7 VIP"
    }
  }
];

export default function PackageManagementPage() {
  const [packages, setPackages] = useState(initialPackages);
  const [editingPackage, setEditingPackage] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name"); // name, price
  const [sortOrder, setSortOrder] = useState("asc"); // asc, desc
  const [activeTab, setActiveTab] = useState("all"); // all, onSale
  const [newPackage, setNewPackage] = useState({
    name: "",
    price: "",
    originalPrice: "",
    onSale: false,
    description: "",
    features: [""],
    stats: {
      accuracy: "",
      signals: "",
      support: ""
    }
  });
  const [errors, setErrors] = useState({});

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

  const handleDelete = (id) => {
    const pkg = packages.find(p => p.id === id);
    if (window.confirm(`Bạn có chắc chắn muốn xóa gói "${pkg.name}"?`)) {
      setPackages(packages.filter(p => p.id !== id));
      toast.success("Xóa gói thành công!");
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
      price: "",
      originalPrice: "",
      onSale: false,
      description: "",
      features: [""],
      stats: {
        accuracy: "",
        signals: "",
        support: ""
      }
    });
    setErrors({});
  };

  const validatePackage = (pkg) => {
    const newErrors = {};
    
    if (!pkg.name?.trim()) {
      newErrors.name = "Tên gói không được để trống";
    }
    
    if (!pkg.description?.trim()) {
      newErrors.description = "Mô tả không được để trống";
    }
    
    if (!pkg.originalPrice || pkg.originalPrice <= 0) {
      newErrors.originalPrice = "Giá gốc phải lớn hơn 0";
    }
    
    if (!pkg.price || pkg.price <= 0) {
      newErrors.price = "Giá bán phải lớn hơn 0";
    }
    
    if (pkg.price > pkg.originalPrice) {
      newErrors.price = "Giá bán không thể cao hơn giá gốc";
    }
    
    if (!pkg.features?.length || pkg.features.some(f => !f.trim())) {
      newErrors.features = "Cần ít nhất một tính năng và không được để trống";
    }
    
    if (!pkg.stats?.accuracy?.trim()) {
      newErrors.accuracy = "Độ chính xác không được để trống";
    }
    
    if (!pkg.stats?.signals?.trim()) {
      newErrors.signals = "Số tín hiệu không được để trống";
    }
    
    if (!pkg.stats?.support?.trim()) {
      newErrors.support = "Thông tin hỗ trợ không được để trống";
    }
    
    return newErrors;
  };

  const handleSaveNew = () => {
    const validationErrors = validatePackage(newPackage);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }
    
    const newId = Math.max(...packages.map(p => p.id)) + 1;
    setPackages([...packages, { ...newPackage, id: newId }]);
    setIsAddingNew(false);
    setNewPackage({
      name: "",
      price: "",
      originalPrice: "",
      onSale: false,
      description: "",
      features: [""],
      stats: {
        accuracy: "",
        signals: "",
        support: ""
      }
    });
    setErrors({});
    toast.success("Thêm gói mới thành công!");
  };

  // Tính phần trăm giảm giá
  const calculateDiscountPercentage = (originalPrice, salePrice) => {
    if (!originalPrice || !salePrice || originalPrice <= salePrice) return 0;
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  };

  // Lọc và sắp xếp gói
  const filteredPackages = packages
    .filter(pkg => {
      // Lọc theo tab
      if (activeTab === "onSale" && !pkg.onSale) return false;
      
      // Lọc theo tìm kiếm
      if (searchTerm && !pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !pkg.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sắp xếp
      if (sortBy === "name") {
        return sortOrder === "asc" 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      } else if (sortBy === "price") {
        return sortOrder === "asc" 
          ? a.price - b.price 
          : b.price - a.price;
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

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-8">
        {/* Header */}
        <div className="flex flex-col space-y-2">
          <div className="w-full grid grid-cols-3 items-center">
            <div></div> {/* Empty div for balance */}
            <div className="flex items-center gap-3 justify-center">
              <Package className="h-8 w-8 text-white" />
              <h1 className="text-3xl font-bold">Quản lý gói dịch vụ</h1>
            </div>
            <div className="flex justify-end">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 font-medium px-6 py-5 ring-2 ring-offset-2 ring-offset-[white] ring-white/30 hover:ring-white/80 hover:ring-4">
                    <Plus className="w-4 h-4" />
                    Thêm gói mới
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] bg-background border-border">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Thêm gói dịch vụ mới
                    </DialogTitle>
                    <DialogDescription>
                      Điền thông tin chi tiết cho gói dịch vụ mới của bạn
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium">Thông tin cơ bản</Label>
                        <div className="mt-3 space-y-4">
                          {renderInput(
                            "Tên gói",
                            newPackage.name,
                            (e) => setNewPackage({ ...newPackage, name: e.target.value }),
                            errors.name,
                            "text",
                            "VD: Basic Trader"
                          )}
                          {renderInput(
                            "Mô tả",
                            newPackage.description,
                            (e) => setNewPackage({ ...newPackage, description: e.target.value }),
                            errors.description,
                            "text",
                            "VD: Khởi đầu hành trình đầu tư của bạn"
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            {renderInput(
                              "Giá gốc (VNĐ)",
                              newPackage.originalPrice,
                              (e) => setNewPackage({ ...newPackage, originalPrice: parseInt(e.target.value) }),
                              errors.originalPrice,
                              "number",
                              "VD: 299000"
                            )}
                            {renderInput(
                              "Giá bán (VNĐ)",
                              newPackage.price,
                              (e) => setNewPackage({ ...newPackage, price: parseInt(e.target.value) }),
                              errors.price,
                              "number",
                              "VD: 199000"
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="newOnSale"
                              checked={newPackage.onSale}
                              onChange={(e) => setNewPackage({ ...newPackage, onSale: e.target.checked })}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="newOnSale" className="cursor-pointer">Đang giảm giá</Label>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <Label className="text-base font-medium">Thông số</Label>
                        <div className="grid grid-cols-1 gap-4">
                          {renderStatsInput(
                            "Độ chính xác",
                            newPackage.stats.accuracy,
                            (e) => setNewPackage({
                              ...newPackage,
                              stats: { ...newPackage.stats, accuracy: e.target.value }
                            }),
                            errors.accuracy,
                            "VD: 85%"
                          )}
                          {renderStatsInput(
                            "Tín hiệu/ngày",
                            newPackage.stats.signals,
                            (e) => setNewPackage({
                              ...newPackage,
                              stats: { ...newPackage.stats, signals: e.target.value }
                            }),
                            errors.signals,
                            "VD: 20/ngày"
                          )}
                          {renderStatsInput(
                            "Hỗ trợ",
                            newPackage.stats.support,
                            (e) => setNewPackage({
                              ...newPackage,
                              stats: { ...newPackage.stats, support: e.target.value }
                            }),
                            errors.support,
                            "VD: 24/7"
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-base font-medium">Tính năng</Label>
                      <div className="mt-3 space-y-2">
                        {newPackage.features.map((feature, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={feature}
                              onChange={(e) => {
                                const newFeatures = [...newPackage.features];
                                newFeatures[index] = e.target.value;
                                setNewPackage({ ...newPackage, features: newFeatures });
                              }}
                              placeholder="VD: AI Signals cơ bản"
                              className={errors.features ? 'border-destructive' : ''}
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => {
                                setNewPackage({
                                  ...newPackage,
                                  features: newPackage.features.filter((_, i) => i !== index)
                                });
                              }}
                              disabled={newPackage.features.length === 1}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        {errors.features && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.features}
                          </p>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => setNewPackage({
                            ...newPackage,
                            features: [...newPackage.features, ""]
                          })}
                          className="w-full mt-2"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Thêm tính năng
                        </Button>
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="gap-2">
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={handleAddNew}>
                        Hủy
                      </Button>
                    </DialogTrigger>
                    <Button onClick={handleSaveNew} className="bg-primary hover:bg-primary/90">
                      <Save className="w-4 h-4 mr-2" />
                      Lưu gói
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <p className="text-muted-foreground">Quản lý các gói dịch vụ, thiết lập giá và tính năng</p>
        </div>

        <Separator />

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm gói dịch vụ..."
              className="pl-8 bg-white text-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => toggleSort("name")}
              className="flex items-center gap-1 text-muted-foreground"
            >
              Tên
              <ArrowUpDown className="h-3 w-3" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => toggleSort("price")}
              className="flex items-center gap-1 text-muted-foreground"
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
        {filteredPackages.length === 0 ? (
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
              <Card key={pkg.id} className={`overflow-hidden transition-all duration-200 hover:shadow-md ${pkg.onSale && pkg.originalPrice > pkg.price ? 'border-red-500/30' : ''}`}>
                <CardHeader className={`pb-3 ${pkg.onSale ? 'bg-red-500/5' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {pkg.name}
                        {pkg.onSale && pkg.originalPrice > pkg.price && (
                          <Badge variant="secondary" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                            <Percent className="w-3 h-3 mr-1" />
                            Giảm giá
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">{pkg.description}</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      {editingPackage?.id === pkg.id ? (
                        <Button
                          size="sm"
                          onClick={() => handleSave(editingPackage)}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(pkg)}
                          className="hover:bg-primary/5"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(pkg.id)}
                        className="hover:bg-destructive/90"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {editingPackage?.id === pkg.id ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Tên gói</Label>
                        <Input
                          value={editingPackage.name}
                          onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Giá gốc (VNĐ)</Label>
                          <Input
                            type="number"
                            value={editingPackage.originalPrice}
                            onChange={(e) => setEditingPackage({ ...editingPackage, originalPrice: parseInt(e.target.value) })}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label>Giá bán (VNĐ)</Label>
                          <Input
                            type="number"
                            value={editingPackage.price}
                            onChange={(e) => setEditingPackage({ ...editingPackage, price: parseInt(e.target.value) })}
                            className="mt-1.5"
                          />
                        </div>
                        <div className="flex items-end">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`onSale-${editingPackage.id}`}
                              checked={editingPackage.onSale}
                              onChange={(e) => setEditingPackage({ ...editingPackage, onSale: e.target.checked })}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor={`onSale-${editingPackage.id}`} className="cursor-pointer">Đang giảm giá</Label>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label>Mô tả</Label>
                        <Input
                          value={editingPackage.description}
                          onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-2">
                          Tính năng
                          {errors.features && (
                            <span className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {errors.features}
                            </span>
                          )}
                        </Label>
                        <div className="mt-1.5 space-y-2">
                          {editingPackage.features.map((feature, index) => 
                            renderFeatureInput(
                              feature,
                              index,
                              editingPackage.features,
                              (value, idx) => handleFeatureChange(editingPackage, idx, value),
                              (idx) => handleRemoveFeature(editingPackage, idx),
                              errors.features
                            )
                          )}
                          <Button
                            variant="outline"
                            onClick={() => handleAddFeature(editingPackage)}
                            className="w-full hover:bg-primary/5"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Thêm tính năng
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {renderStatsInput(
                          "Độ chính xác",
                          editingPackage.stats.accuracy,
                          (e) => setEditingPackage({
                            ...editingPackage,
                            stats: { ...editingPackage.stats, accuracy: e.target.value }
                          }),
                          errors.accuracy
                        )}
                        {renderStatsInput(
                          "Tín hiệu/ngày",
                          editingPackage.stats.signals,
                          (e) => setEditingPackage({
                            ...editingPackage,
                            stats: { ...editingPackage.stats, signals: e.target.value }
                          }),
                          errors.signals
                        )}
                        {renderStatsInput(
                          "Hỗ trợ",
                          editingPackage.stats.support,
                          (e) => setEditingPackage({
                            ...editingPackage,
                            stats: { ...editingPackage.stats, support: e.target.value }
                          }),
                          errors.support
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        {pkg.onSale && pkg.originalPrice > pkg.price ? (
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-primary">{pkg.price.toLocaleString()}đ</span>
                              <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                                Tiết kiệm {((pkg.originalPrice - pkg.price) / 1000).toFixed(0)}K
                              </Badge>
                            </div>
                            <span className="text-sm text-muted-foreground line-through">{pkg.originalPrice.toLocaleString()}đ</span>
                          </div>
                        ) : (
                          <span className="text-2xl font-bold text-primary">{pkg.price.toLocaleString()}đ</span>
                        )}
                        <Badge variant="outline" className="bg-primary/5">Hàng tháng</Badge>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Tính năng bao gồm:
                        </h4>
                        <ul className="space-y-1.5">
                          {pkg.features.map((feature, index) => (
                            <li key={index} className="text-sm flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                              <span className="text-muted-foreground">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Separator className="my-4" />
                      <div className="grid grid-cols-3 gap-4 pt-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Độ chính xác</p>
                          <p className="font-medium text-primary">{pkg.stats.accuracy}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Tín hiệu/ngày</p>
                          <p className="font-medium text-primary">{pkg.stats.signals}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Hỗ trợ</p>
                          <p className="font-medium text-primary">{pkg.stats.support}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 