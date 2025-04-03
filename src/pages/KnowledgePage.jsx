import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  CalendarDays, 
  BookOpen, 
  ChartBar, 
  Settings, 
  Info, 
  HelpCircle, 
  Newspaper,
  Clock,
  Menu,
  X,
  ChevronRight,
  Home,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiService } from "../api/Api";
import { toast } from "react-hot-toast";

const NavItem = ({ icon: Icon, text, active, onClick }) => (
  <div 
    onClick={onClick}
    className={cn(
      "group relative flex items-center py-3 cursor-pointer transition-all duration-200",
      active 
        ? 'bg-white/10 text-white' 
        : 'text-white/70 hover:text-white hover:bg-white/5',
      "rounded-md mx-3"
    )}
  >
    <div className="flex items-center w-full px-3">
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className={cn(
        "ml-3 text-sm font-medium transition-all duration-200 opacity-0 w-0 overflow-hidden",
        "group-hover:opacity-100 group-hover:w-auto group-hover:ml-3",
        active && "opacity-100 w-auto ml-3"
      )}>
        {text}
      </span>
    </div>
    {active && (
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-300 rounded-full"></div>
    )}
  </div>
);

const ArticleCard = ({ article, featured = false, onClick }) => {
  // Hàm loại bỏ thẻ HTML từ chuỗi sử dụng regex (tương thích với SSR)
  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  };
  
  // Xử lý nội dung để hiển thị không có HTML tags
  const displayContent = article.content ? stripHtml(article.content) : '';

  return (
    <div 
      onClick={onClick}
      className={cn(
        "group cursor-pointer rounded-xl overflow-hidden",
        featured 
          ? 'h-[450px] md:h-[400px] relative' 
          : 'flex flex-col md:flex-row h-auto md:h-[140px] bg-white hover:bg-gray-50',
        "shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
      )}
    >
      <div className={cn(
        "relative",
        featured 
          ? 'h-full w-full' 
          : 'h-[180px] md:h-full md:w-[160px] shrink-0'
      )}>
        <img
          src={article.imageUrl || "https://picsum.photos/800/400"}
          alt={article.title}
          className="h-full w-full object-cover"
        />
        {featured && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
        )}
      </div>
      
      <div className={cn(
        featured ? 'absolute bottom-0 left-0 right-0 p-5' : 'flex-1 p-4 flex flex-col justify-between'
      )}>
        <div>
          <div className={cn(
            "flex items-center gap-2 text-xs mb-2",
            featured ? 'text-teal-300' : 'text-teal-600'
          )}>
            <div className="flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>{format(new Date(article.createdAt || new Date()), 'dd/MM/yyyy')}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{Math.ceil(displayContent.length / 1000) || 5} phút</span>
            </div>
          </div>
          
          <h3 className={cn(
            "font-semibold tracking-tight line-clamp-2 transition-colors",
            featured 
              ? 'text-2xl md:text-3xl text-white group-hover:text-teal-300' 
              : 'text-base text-gray-800 group-hover:text-teal-600'
          )}>
            {article.title}
          </h3>

          {featured && (
            <p className="line-clamp-2 text-sm text-gray-300 mt-2 max-w-2xl">
              {displayContent}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const KnowledgePage = () => {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedArticleDetail, setSelectedArticleDetail] = useState(null);
  const [page, setPage] = useState(1);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const itemsPerPage = 8; // 3 in left column and 5 in right
  const [totalPages, setTotalPages] = useState(1);
  
  // Fetch knowledge articles
  useEffect(() => {
    const fetchKnowledge = async () => {
      try {
        setLoading(true);
        const response = await apiService.getKnowledge();
        console.log("Knowledge response:", response);
        
        let knowledgeData = [];
        if (response.value && response.value.data) {
          knowledgeData = response.value.data;
        } else if (response.data) {
          knowledgeData = response.data;
        }
        
        setArticles(knowledgeData);
        setTotalPages(Math.ceil(knowledgeData.length / itemsPerPage));
        setLoading(false);
      } catch (err) {
        console.error("Error fetching knowledge:", err);
        setError("Không thể tải danh sách bài viết. Vui lòng thử lại sau.");
        toast.error("Không thể tải danh sách bài viết");
        setLoading(false);
      }
    };
    
    fetchKnowledge();
  }, []);

  // Fetch article detail when an article is selected
  useEffect(() => {
    const fetchArticleDetail = async () => {
      if (selectedArticle && selectedArticle.id) {
        try {
          const response = await apiService.getKnowledgeById(selectedArticle.id);
          console.log("Knowledge detail response:", response);
          
          let detailData;
          if (response.value && response.value.data) {
            detailData = response.value.data;
          } else if (response.data) {
            detailData = response.data;
          } else {
            detailData = response;
          }
          
          setSelectedArticleDetail(detailData);
        } catch (err) {
          console.error("Error fetching article detail:", err);
          toast.error("Không thể tải chi tiết bài viết");
        }
      }
    };
    
    fetchArticleDetail();
  }, [selectedArticle]);

  const currentArticles = articles.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handlePageChange = (value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-teal-600 text-white rounded-lg shadow-lg"
      >
        {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center h-[50vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-[50vh]">
              <div className="text-red-500 text-center">
                <p className="text-xl font-semibold">{error}</p>
                <Button 
                  className="mt-4 bg-teal-600 hover:bg-teal-700"
                  onClick={() => window.location.reload()}
                >
                  Thử lại
                </Button>
              </div>
            </div>
          ) : articles.length === 0 ? (
            <div className="flex justify-center items-center h-[50vh]">
              <div className="text-gray-500 text-center">
                <p className="text-xl font-semibold">Không có bài viết nào</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col lg:flex-row gap-5 lg:gap-6">
                {/* Left Column - 3 articles (1 featured + 2 regular) */}
                <div className="flex-[2] space-y-5">
                  {/* Main Featured Article */}
                  {currentArticles[0] && (
                    <ArticleCard 
                      article={currentArticles[0]} 
                      featured={true}
                      onClick={() => setSelectedArticle(currentArticles[0])}
                    />
                  )}

                  {/* 2 Secondary Articles */}
                  <div className="space-y-4">
                    {currentArticles.slice(1, 3).map(article => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        onClick={() => setSelectedArticle(article)}
                      />
                    ))}
                  </div>
                </div>

                {/* Right Column - 5 articles */}
                <div className="flex-1 space-y-4">
                  {currentArticles.slice(3, 8).map(article => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      onClick={() => setSelectedArticle(article)}
                    />
                  ))}
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-10">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(Math.max(1, page - 1))}
                          className="cursor-pointer hover:bg-teal-50"
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => handlePageChange(pageNum)}
                            isActive={page === pageNum}
                            className={cn(
                              "cursor-pointer transition-all duration-200",
                              page === pageNum 
                                ? "bg-teal-600 text-white hover:bg-teal-700"
                                : "hover:bg-teal-50"
                            )}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                          className="cursor-pointer hover:bg-teal-50"
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Article Modal */}
      <Dialog 
        open={Boolean(selectedArticle)} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedArticle(null);
            setSelectedArticleDetail(null);
          }
        }}
      >
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-6 md:p-8">
          {selectedArticle && (
            <>
              {!selectedArticleDetail ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600"></div>
                </div>
              ) : (
                <>
                  <DialogHeader className="space-y-3">
                    <DialogTitle className="sr-only">{selectedArticleDetail.title}</DialogTitle>
                    <DialogDescription className="sr-only">Article details and content</DialogDescription>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-teal-600">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        <span>{format(new Date(selectedArticleDetail.createdAt || new Date()), 'dd/MM/yyyy')}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{Math.ceil(selectedArticleDetail.content?.length / 1000) || 5} phút đọc</span>
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">
                      {selectedArticleDetail.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Bài viết từ StockSmart Knowledge
                    </p>
                  </DialogHeader>
                  
                  {selectedArticleDetail.imageUrl && (
                    <div className="relative my-6 flex justify-center">
                      <img
                        src={selectedArticleDetail.imageUrl}
                        alt={selectedArticleDetail.title}
                        className="max-h-[600px] object-contain w-auto rounded-lg shadow-md"
                      />
                    </div>
                  )}
                  
                  <div 
                    className="text-white leading-relaxed text-base prose prose-headings:font-semibold prose-p:my-3 prose-strong:font-bold max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedArticleDetail.content }}
                  />
                  
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KnowledgePage; 