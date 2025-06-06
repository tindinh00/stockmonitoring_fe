import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Pencil, Trash2, Plus, Eye, Search, X, ChevronRight } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import { apiService } from "@/api/Api";
import Cookies from "js-cookie";

const ManagerKnowledge = () => {
  const [articles, setArticles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [articleToDelete, setArticleToDelete] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  useEffect(() => {
    fetchArticles();
  }, [currentPage]);

  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getKnowledge();
      console.log("API Response:", response); // Debug log
      
      // Kiểm tra và xử lý các cấu trúc response khác nhau
      let articlesData = [];
      
      if (response?.value?.data) {
        // Trường hợp 1: Data nằm trong response.value.data
        articlesData = response.value.data;
      } else if (response?.value) {
        // Trường hợp 2: Data nằm trực tiếp trong response.value
        articlesData = response.value;
      } else if (response?.data) {
        // Trường hợp 3: Data nằm trực tiếp trong response.data
        articlesData = response.data;
      } else {
        // Trường hợp 4: Data là response trực tiếp
        articlesData = response;
      }

      // Chuyển đổi dữ liệu thành format mong muốn
      const formattedArticles = Array.isArray(articlesData) ? articlesData.map(article => ({
        id: article.id,
        title: article.title,
        content: article.content,
        image: article.imageUrl || article.image,
        date: article.createdTime || article.date || new Date().toISOString()
      })) : [];

      setArticles(formattedArticles);
      setTotalPages(Math.ceil(formattedArticles.length / 10));
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast.error("Không thể tải danh sách bài viết: " + (error.message || "Lỗi không xác định"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let imageUrl = selectedArticle?.image;
      
      // Upload image if there's a new one
      if (formData.image) {
        try {
          const uploadResponse = await apiService.uploadImage(formData.image);
          if (uploadResponse) {
            imageUrl = uploadResponse.data;
          } else {
            throw new Error("Không thể tải lên hình ảnh");
          }
        } catch (error) {
          console.error("Error uploading image:", error);
          throw new Error("Không thể tải lên hình ảnh: " + error.message);
        }
      }

      if (selectedArticle) {
        // Update existing article
        await apiService.updateKnowledge(selectedArticle.id, {
          id: selectedArticle.id,
          title: formData.title,
          content: formData.content,
          imageUrl: imageUrl || ""
        });
        toast.success("Cập nhật bài viết thành công");
      } else {
        // Create new article
        await apiService.createKnowledge({
          title: formData.title,
          content: formData.content,
          imageUrl: imageUrl || ""
        });
        toast.success("Tạo bài viết thành công");
      }

      setIsDialogOpen(false);
      fetchArticles();
      resetForm();
    } catch (error) {
      console.error("Error saving article:", error);
      toast.error(error.message || "Không thể lưu bài viết");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (article) => {
    setArticleToDelete(article);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!articleToDelete) return;
    
    setIsLoading(true);
    try {
      await apiService.deleteKnowledge(articleToDelete.id);
      toast.success("Xóa bài viết thành công");
      fetchArticles();
    } catch (error) {
      console.error("Error deleting article:", error);
      toast.error(error.message || "Không thể xóa bài viết");
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
      setArticleToDelete(null);
    }
  };

  const handleEdit = (article) => {
    setSelectedArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      image: null,
    });
    setPreviewImage(article.image);
    setIsDialogOpen(true);
  };

  const handlePreview = (article) => {
    setSelectedArticle(article);
    setIsPreviewOpen(true);
  };

  const resetForm = () => {
    setSelectedArticle(null);
    setFormData({
      title: "",
      content: "",
      image: null
    });
    setPreviewImage(null);
  };

  const handleImageClick = (e, imageUrl) => {
    e.preventDefault();
    e.stopPropagation();
    setPreviewImageUrl(imageUrl);
    setIsImageDialogOpen(true);
  };

  const filteredArticles = articles.filter(article => 
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const articlesPerPage = 5;
  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = filteredArticles.slice(indexOfFirstArticle, indexOfLastArticle);
  const totalFilteredPages = Math.ceil(filteredArticles.length / articlesPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Quản lý bài viết</CardTitle>
              <CardDescription className="text-base mt-2">
                Xem và quản lý các bài viết kiến thức
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm bài viết..."
                  className="pl-8 h-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                onClick={() => {
                  resetForm();
                  setIsDialogOpen(true);
                }}
                className="flex items-center gap-2"
                disabled={isLoading}
              >
                <Plus className="w-4 h-4" />
                Thêm bài viết mới
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium w-[50px]">STT</TableHead>
                  <TableHead className="font-medium text-left">Hình ảnh</TableHead>
                  <TableHead className="font-medium text-left">Tiêu đề</TableHead>
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
                ) : filteredArticles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                      Không có bài viết nào
                    </TableCell>
                  </TableRow>
                ) : (
                  currentArticles.map((article, index) => (
                    <TableRow key={article.id} className="hover:bg-muted/50">
                      <TableCell className="text-left">
                        {(currentPage - 1) * 10 + index + 1}
                      </TableCell>
                      <TableCell>
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-16 h-16 object-cover rounded-md cursor-pointer hover:opacity-80"
                          onClick={(e) => handleImageClick(e, article.image)}
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-[300px] truncate text-left">
                        {article.title}
                      </TableCell>
                      <TableCell className="text-left">
                        {format(new Date(article.date), "dd/MM/yyyy HH:mm", { locale: vi })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePreview(article)}
                            title="Xem trước"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(article)}
                            title="Chỉnh sửa"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDelete(article)}
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {filteredArticles.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Hiển thị {indexOfFirstArticle + 1} - {Math.min(indexOfLastArticle, filteredArticles.length)} / {filteredArticles.length} bài viết
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                  <ChevronRight className="h-4 w-4 -ml-2 rotate-180" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                </Button>
                <div className="flex items-center">
                  {Array.from({ length: Math.min(5, totalFilteredPages) }, (_, i) => {
                    let pageToShow;
                    if (totalFilteredPages <= 5) {
                      pageToShow = i + 1;
                    } else if (currentPage <= 3) {
                      pageToShow = i + 1;
                    } else if (currentPage >= totalFilteredPages - 2) {
                      pageToShow = totalFilteredPages - 4 + i;
                    } else {
                      pageToShow = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageToShow}
                        variant={currentPage === pageToShow ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageToShow)}
                        className={`h-8 w-8 p-0 mx-0.5 ${
                          currentPage === pageToShow 
                            ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                            : ""
                        }`}
                      >
                        {pageToShow}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalFilteredPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalFilteredPages)}
                  disabled={currentPage === totalFilteredPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                  <ChevronRight className="h-4 w-4 -ml-2" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsDialogOpen(false);
            if (!selectedArticle) {
              resetForm();
            }
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedArticle ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-8rem)]">
            <form onSubmit={handleSubmit} className="space-y-4 pr-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  placeholder="Nhập tiêu đề bài viết"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Nội dung</Label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(html) => setFormData({ ...formData, content: html })}
                  placeholder="Nhập nội dung bài viết hoặc nhấn / để xem các tùy chọn định dạng"
                  className="[&_div.tiptap]:bg-background [&_div.tiptap_.ProseMirror-menubar]:!bg-muted/80 [&_div.tiptap_.ProseMirror-menubar]:border-b [&_div.tiptap_.ProseMirror-menubar]:border-border [&_div.tiptap]:rounded-md [&_div.tiptap]:border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Hình ảnh</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
                {previewImage && (
                  <div className="mt-2">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="max-h-[200px] object-contain rounded-lg"
                    />
                  </div>
                )}
              </div>
            </form>
          </ScrollArea>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
              >
                Hủy
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={isLoading}
              onClick={handleSubmit}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-0 border-r-0 border-white rounded-full"></div>
                  {selectedArticle ? "Đang cập nhật..." : "Đang tạo..."}
                </>
              ) : (
                selectedArticle ? "Cập nhật" : "Tạo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog 
        open={isPreviewOpen} 
        onOpenChange={setIsPreviewOpen}
      >
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Xem trước bài viết</DialogTitle>
          </DialogHeader>
          {selectedArticle && (
            <ScrollArea className="max-h-[calc(90vh-8rem)]">
              <div className="space-y-6 p-1 pr-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Tiêu đề</h4>
                  <p className="text-base bg-muted/50 p-3 rounded-lg">{selectedArticle.title}</p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Ngày tạo</h4>
                  <p className="text-base bg-muted/50 p-3 rounded-lg">
                    {format(new Date(selectedArticle.date), "dd/MM/yyyy HH:mm", { locale: vi })}
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-2">Nội dung</h4>
                  <div 
                    className="prose max-w-none bg-muted/50 p-3 rounded-lg"
                    dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                  />
                </div>

                {selectedArticle.image && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-2">Hình ảnh</h4>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <img 
                          src={selectedArticle.image} 
                          alt={selectedArticle.title}
                          className="w-full max-h-[300px] object-contain rounded-lg"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          )}
          <DialogFooter className="mt-4">
            <Button
              type="button"
              onClick={() => setIsPreviewOpen(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={isDeleteDialogOpen} 
        onOpenChange={setIsDeleteDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Bạn có chắc chắn muốn xóa bài viết{" "}
              <span className="font-medium text-foreground">
                "{articleToDelete?.title}"
              </span>
              ? Hành động này không thể hoàn tác.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setArticleToDelete(null);
              }}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-0 border-r-0 border-white rounded-full"></div>
                  Đang xóa...
                </>
              ) : (
                "Xóa"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog 
        open={isImageDialogOpen} 
        onOpenChange={setIsImageDialogOpen}
      >
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-transparent border-none shadow-none">
          <div className="relative w-full bg-black/80 rounded-lg overflow-hidden">
            <Button 
              variant="ghost" 
              className="absolute top-2 right-2 text-white bg-black/50 hover:bg-black/70 p-2 rounded-full"
              onClick={() => setIsImageDialogOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            {previewImageUrl && (
              <img 
                src={previewImageUrl} 
                alt="Preview" 
                className="w-full max-h-[80vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerKnowledge; 