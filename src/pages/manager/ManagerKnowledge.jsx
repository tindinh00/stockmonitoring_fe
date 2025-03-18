import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Pencil, Trash2, Plus, Eye } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";

const ManagerKnowledge = () => {
  const [articles, setArticles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image: null,
    readTime: "",
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch articles
  useEffect(() => {
    fetchArticles();
  }, [currentPage]);

  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/knowledge?page=${currentPage}&limit=10`);
      const data = await response.json();
      setArticles(data.articles || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      toast.error("Failed to fetch articles");
      console.error("Error fetching articles:", error);
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
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'image' && formData[key] === null && selectedArticle?.image) {
          // Skip if we're editing and no new image was selected
          return;
        }
        formDataToSend.append(key, formData[key]);
      });

      const url = selectedArticle 
        ? `/api/knowledge/${selectedArticle.id}`
        : '/api/knowledge';
      
      const method = selectedArticle ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      if (response.ok) {
        toast.success(selectedArticle ? "Article updated successfully" : "Article created successfully");
        setIsDialogOpen(false);
        fetchArticles();
        resetForm();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to save article");
      }
    } catch (error) {
      toast.error("Failed to save article");
      console.error("Error saving article:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this article?")) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/knowledge/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success("Article deleted successfully");
          fetchArticles();
        } else {
          const errorData = await response.json();
          toast.error(errorData.message || "Failed to delete article");
        }
      } catch (error) {
        toast.error("Failed to delete article");
        console.error("Error deleting article:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEdit = (article) => {
    setSelectedArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      readTime: article.readTime,
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
      image: null,
      readTime: "",
    });
    setPreviewImage(null);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý bài viết</h1>
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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hình ảnh</TableHead>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Thời gian đọc</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                  Không có bài viết nào
                </TableCell>
              </TableRow>
            ) : (
              articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{article.title}</TableCell>
                  <TableCell>
                    {format(new Date(article.date), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>{article.readTime} phút</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
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
                        onClick={() => handleDelete(article.id)}
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

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className={`cursor-pointer ${currentPage === 1 ? 'opacity-50 pointer-events-none' : ''}`}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  className={`cursor-pointer ${currentPage === totalPages ? 'opacity-50 pointer-events-none' : ''}`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

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
        modal={true}
      >
        <DialogContent 
          className="max-w-3xl max-h-[90vh] overflow-y-auto dialog-content" 
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>
              {selectedArticle ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4" onClick={(e) => e.stopPropagation()}>
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
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Nội dung</Label>
              <div onClick={(e) => e.stopPropagation()}>
                <RichTextEditor
                  value={formData.content}
                  onChange={(html) => setFormData({ ...formData, content: html })}
                  placeholder="Nhập nội dung bài viết hoặc nhấn / để xem các tùy chọn định dạng"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="readTime">Thời gian đọc (phút)</Label>
              <Input
                id="readTime"
                type="number"
                value={formData.readTime}
                onChange={(e) =>
                  setFormData({ ...formData, readTime: e.target.value })
                }
                required
                min="1"
                placeholder="Ví dụ: 5"
                onClick={(e) => e.stopPropagation()}
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
                onClick={(e) => e.stopPropagation()}
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
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  onClick={(e) => e.stopPropagation()}
                >
                  Hủy
                </Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={isLoading}
                onClick={(e) => e.stopPropagation()}
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
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog 
        open={isPreviewOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsPreviewOpen(false);
          }
        }}
        modal={true}
      >
        <DialogContent 
          className="max-w-3xl max-h-[90vh] overflow-y-auto dialog-content" 
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>Xem trước bài viết</DialogTitle>
          </DialogHeader>
          {selectedArticle && (
            <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="text-2xl font-bold">{selectedArticle.title}</div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{format(new Date(selectedArticle.date), "dd/MM/yyyy")}</span>
                <span>•</span>
                <span>{selectedArticle.readTime} phút đọc</span>
              </div>
              {selectedArticle.image && (
                <div className="mt-4">
                  <img
                    src={selectedArticle.image}
                    alt={selectedArticle.title}
                    className="w-full max-h-[300px] object-cover rounded-lg"
                  />
                </div>
              )}
              <div 
                className="prose max-w-none mt-4"
                dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
              />
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                onClick={(e) => e.stopPropagation()}
              >
                Đóng
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerKnowledge; 