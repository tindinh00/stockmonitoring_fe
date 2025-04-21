import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, BookOpen, Share2, Bookmark, Eye, ArrowLeft, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { apiService } from '@/api/Api';

// Placeholder image
const DEFAULT_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNDUwIiBmaWxsPSIjMWExYTFhIiAvPgogICAgPHRleHQgeD0iNDAwIiB5PSIyMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzdhN2E3YSI+S2jDtG5nIGPDsyDhuqNuaDwvdGV4dD4KPC9zdmc+';

const KnowledgePage = () => {
  const [knowledge, setKnowledge] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [bookmarkedArticles, setBookmarkedArticles] = useState([]);
  const [failedImages, setFailedImages] = useState({});
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [articleDetail, setArticleDetail] = useState(null);
  const [selectedArticleUrl, setSelectedArticleUrl] = useState(null);
  const itemsPerPage = 9;

  // Fetch knowledge data
  const fetchKnowledgeData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getKnowledge();
      
      let knowledgeData = [];
      if (response?.value?.data && Array.isArray(response.value.data)) {
        knowledgeData = response.value.data;
      } else if (Array.isArray(response)) {
        knowledgeData = response;
      }
      
      if (knowledgeData.length > 0) {
        const processedKnowledge = knowledgeData.map(item => ({
          id: item.id || Math.random().toString(36).substr(2, 9),
          title: item.title || 'No title',
          category: item.category || 'Cơ bản',
          timeAgo: item.createdTime ? format(new Date(item.createdTime), 'dd/MM/yyyy', { locale: vi }) : 'Gần đây',
          imageUrl: item.imageUrl || DEFAULT_IMAGE,
          content: item.content || '<p>Không có nội dung</p>',
          description: item.description || '',
          url: item.url || null
        }));
        
        setKnowledge(processedKnowledge);
      } else {
        console.log('No knowledge data available');
        setKnowledge([]);
      }
    } catch (error) {
      console.error('Error fetching knowledge:', error);
      toast.error(error.message || "Không thể tải danh sách bài viết");
      setKnowledge([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKnowledgeData();
  }, [fetchKnowledgeData]);

  // Handle article detail
  const fetchArticleDetail = async (id) => {
    setLoadingDetail(true);
    setArticleDetail(null);
    
    try {
      const response = await apiService.getKnowledgeById(id);
      
      let detail = null;
      if (response?.value?.data) {
        detail = response.value.data;
      } else if (response?.value) {
        detail = response.value;
      } else {
        detail = response;
      }

      if (detail) {
        setArticleDetail({
          id: detail.id,
          title: detail.title,
          content: detail.content,
          imageUrl: detail.imageUrl,
          createdTime: detail.createdTime,
          description: detail.description || '',
          category: detail.category || 'Cơ bản'
        });
      } else {
        toast.error("Không thể tải chi tiết bài viết");
      }
    } catch (error) {
      console.error("Error fetching article detail:", error);
      toast.error(error.message || "Đã xảy ra lỗi khi tải chi tiết bài viết");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Open article detail
  const openArticleDetail = (article) => {
    setSelectedArticle(article);
    if (article.id) {
      fetchArticleDetail(article.id);
    }
  };

  // Share article
  const shareArticle = (article) => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.title,
        url: article.url || window.location.href,
      });
    }
  };

  // Pagination
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return knowledge.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = Math.ceil(knowledge.length / itemsPerPage);
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentItems = getCurrentPageItems();

  // Handle image error
  const handleImageError = (id) => {
    if (!failedImages[id]) {
      setFailedImages(prev => ({
        ...prev,
        [id]: true
      }));
    }
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-3 gap-6 pl-4 pr-4">
      <div className="animate-pulse">
        <div className="aspect-[16/9] bg-gray-700 rounded-lg mb-4"></div>
        <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-32 h-24 bg-gray-700 rounded"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0a0a14]/95 backdrop-blur-sm border-b border-[#333] mb-6">
          <div className="px-4 py-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">
                  <span className="text-[#09D1C7]">Kiến thức </span>
                  <span className="text-white">Đầu tư</span>
                </h1>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#09D1C7]/10 text-[#09D1C7] hover:bg-[#09D1C7]/20 transition-all duration-300">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Mới nhất</span>
                  </button>
                  
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-6 pl-4 pr-4">
              {/* Featured Article - Left Column */}
              <div>
                {currentItems[0] && (
                  <div 
                    className="group relative hover:bg-[#1a1a1a] transition-all duration-300 cursor-pointer rounded-lg overflow-hidden"
                    onClick={() => openArticleDetail(currentItems[0])}
                  >
                    <div className="aspect-[16/9] overflow-hidden rounded-lg">
                      <img
                        src={failedImages[currentItems[0].id] ? DEFAULT_IMAGE : currentItems[0].imageUrl}
                        alt={currentItems[0].title}
                        className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                        onError={() => handleImageError(currentItems[0].id)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    <div className="p-4">
                      <h2 className="text-xl text-left font-semibold mb-3 group-hover:text-[#09D1C7] transition-colors duration-300">
                        {currentItems[0].title}
                      </h2>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>{currentItems[0].timeAgo}</span>
                          <span>•</span>
                          <span>{currentItems[0].category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              shareArticle(currentItems[0]);
                            }}
                            className="p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                          >
                            <Share2 className="w-4 h-4 text-gray-400 hover:text-[#09D1C7]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Middle Column - Articles with Images */}
              <div className="space-y-4">
                {currentItems.slice(1, 4).map((item) => (
                  <div
                    key={item.id}
                    className="group flex gap-4 p-3 hover:bg-[#1a1a1a] transition-all duration-300 cursor-pointer rounded-lg"
                    onClick={() => openArticleDetail(item)}
                  >
                    <div className="flex-shrink-0 w-32 h-24 overflow-hidden rounded-lg">
                      <img
                        src={failedImages[item.id] ? DEFAULT_IMAGE : item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                        onError={() => handleImageError(item.id)}
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <h3 className="text-sm text-left font-medium group-hover:text-[#09D1C7] transition-colors duration-300 line-clamp-2">
                        {item.title}
                      </h3>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>{item.timeAgo}</span>
                          <span>•</span>
                          <span>{item.category}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              shareArticle(item);
                            }}
                            className="p-1.5 rounded-full hover:bg-gray-700/50 transition-colors"
                          >
                            <Share2 className="w-3 h-3 text-gray-400 hover:text-[#09D1C7]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column - Text Only Articles */}
              <div className="space-y-3">
                {currentItems.slice(4, 10).map((item) => (
                  <div
                    key={item.id}
                    className="group p-3 hover:bg-[#1a1a1a] transition-all duration-300 cursor-pointer rounded-lg"
                    onClick={() => openArticleDetail(item)}
                  >
                    <h3 className="text-sm text-left font-medium group-hover:text-[#09D1C7] transition-colors duration-300 line-clamp-2 mb-2">
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{item.timeAgo}</span>
                        <span>•</span>
                        <span>{item.category}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            shareArticle(item);
                          }}
                          className="p-1.5 rounded-full hover:bg-gray-700/50 transition-colors"
                        >
                          <Share2 className="w-3 h-3 text-gray-400 hover:text-[#09D1C7]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-2 mt-8 pb-8">
              <Button
                variant="outline"
                size="icon"
                className="w-8 h-8 bg-[#1a1a1a] border-[#333] text-white hover:bg-[#333] disabled:opacity-50 transition-colors"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="icon"
                  className={`w-8 h-8 transition-all duration-300 ${
                    currentPage === page
                      ? "bg-[#09D1C7] text-white hover:bg-[#09D1C7]/80"
                      : "bg-[#1a1a1a] border-[#333] text-white hover:bg-[#333]"
                  }`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ))}

              <Button
                variant="outline"
                size="icon"
                className="w-8 h-8 bg-[#1a1a1a] border-[#333] text-white hover:bg-[#333] disabled:opacity-50 transition-colors"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {/* Article Detail Dialog */}
        <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
          <DialogContent className="bg-[#1a1a1a] text-white border-[#333] max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogTitle className="sr-only">
              {selectedArticle?.title || 'Chi tiết bài viết'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Chi tiết nội dung bài viết
            </DialogDescription>
            {selectedArticle && (
              <div className="space-y-6">
                {loadingDetail ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#09D1C7] mb-4"></div>
                    <p className="text-lg text-gray-400">Đang tải chi tiết bài viết...</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start">
                      <div className="space-y-4 flex-1">
                        <h2 className="text-2xl font-semibold hover:text-[#09D1C7] transition-colors duration-300">
                          {articleDetail ? articleDetail.title : selectedArticle.title}
                        </h2>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span>
                              {articleDetail && articleDetail.createdTime
                                ? format(new Date(articleDetail.createdTime), 'dd/MM/yyyy', { locale: vi })
                                : selectedArticle.timeAgo}
                            </span>
                            <span>•</span>
                            <span>{selectedArticle.category}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => shareArticle(selectedArticle)}
                              className="p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                            >
                              <Share2 className="w-4 h-4 text-gray-400 hover:text-[#09D1C7]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {articleDetail && articleDetail.description && (
                      <div className="bg-gray-800/50 p-4 rounded-lg">
                        <p className="text-gray-300 italic text-sm">
                          {articleDetail.description}
                        </p>
                      </div>
                    )}

                    <div className="aspect-video overflow-hidden rounded-lg">
                      <img
                        src={
                          articleDetail && articleDetail.imageUrl 
                            ? articleDetail.imageUrl 
                            : (failedImages[selectedArticle.id] ? DEFAULT_IMAGE : selectedArticle.imageUrl)
                        }
                        alt={articleDetail ? articleDetail.title : selectedArticle.title}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(selectedArticle.id)}
                      />
                    </div>

                    <div 
                      className="prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: articleDetail && articleDetail.content 
                          ? articleDetail.content 
                          : (selectedArticle.content || '<p>Không có nội dung chi tiết</p>')
                      }}
                    />
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default KnowledgePage; 