import React, { useState } from "react";
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

const ArticleCard = ({ article, featured = false, onClick }) => (
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
        src={article.image}
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
            <span>{format(new Date(article.date), 'dd/MM/yyyy')}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{article.readTime} phút</span>
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
            {article.content}
          </p>
        )}
      </div>
    </div>
  </div>
);

const KnowledgePage = () => {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [page, setPage] = useState(1);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const itemsPerPage = 8; // 3 in left column and 5 in right

  // Fake data
  const articles = Array(21).fill(null).map((_, index) => ({
    id: index + 1,
    title: `Bậc thầy đầu tư ${index + 1}: ${index % 2 === 0 ? 'Warren Buffett' : 'Charlie Munger'} và bí quyết đầu tư thành công`,
    image: `https://picsum.photos/800/400?random=${index}`,
    date: '2025-01-08',
    content: "Là một nhà đầu tư huyền thoại, ông đã xây dựng những chiến lược đầu tư độc đáo và hiệu quả. Với tầm nhìn dài hạn và phương pháp đầu tư giá trị, ông đã tạo nên những thành công vang dội trên thị trường chứng khoán. Những bài học từ triết lý đầu tư của ông vẫn còn nguyên giá trị cho đến ngày nay...",
    readTime: Math.floor(Math.random() * 10) + 5,
  }));
  
  const totalPages = Math.ceil(articles.length / itemsPerPage);
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
        </div>
      </div>

      {/* Article Modal */}
      <Dialog 
        open={Boolean(selectedArticle)} 
        onOpenChange={() => setSelectedArticle(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedArticle && (
            <>
              <DialogHeader className="space-y-3">
                <DialogTitle className="sr-only">{selectedArticle.title}</DialogTitle>
                <DialogDescription className="sr-only">Article details and content</DialogDescription>
                <div className="flex flex-wrap items-center gap-2 text-xs text-teal-600">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>{format(new Date(selectedArticle.date), 'dd/MM/yyyy')}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{selectedArticle.readTime} phút đọc</span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {selectedArticle.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Bài viết từ StockSmart Knowledge
                </p>
              </DialogHeader>
              
              <div className="relative h-[250px] sm:h-[350px] rounded-lg overflow-hidden my-5">
                <img
                  src={selectedArticle.image}
                  alt={selectedArticle.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="text-gray-700 leading-relaxed text-base space-y-4">
                {selectedArticle.content}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KnowledgePage; 