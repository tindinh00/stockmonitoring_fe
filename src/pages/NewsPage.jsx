import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, TrendingUp, Newspaper, Share2, Bookmark, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import signalRService from '@/api/signalRService';
import { apiService } from '@/api/Api';

// Placeholder image nội bộ để tránh gọi liên tục đến placeholder.com
const DEFAULT_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNDUwIiBmaWxsPSIjMWExYTFhIiAvPgogICAgPHRleHQgeD0iNDAwIiB5PSIyMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzdhN2E3YSI+S2jDtG5nIGPDsyDhuqNuaDwvdGV4dD4KPC9zdmc+';

const NewsPage = () => {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [bookmarkedArticles, setBookmarkedArticles] = useState([]);
  // Thêm state để theo dõi các ảnh bị lỗi
  const [failedImages, setFailedImages] = useState({});
  const itemsPerPage = 9;

  // Categories
  const categories = [
    { id: 'all', name: 'Tất cả', icon: Newspaper },
    { id: 'trending', name: 'Xu hướng', icon: TrendingUp },
    { id: 'market', name: 'Thị trường', icon: Eye },
    { id: 'stock', name: 'Chứng khoán', icon: TrendingUp },
    { id: 'crypto', name: 'Tiền số', icon: TrendingUp },
  ];

  // Mock data cho tin tức
  const mockNews = [
    {
      id: 1,
      title: 'Putin tái đắc cử tổng thống Nga với tỷ lệ phiếu bầu kỷ lục',
      source: 'Tuổi Trẻ',
      timeAgo: '2 giờ trước',
      imageUrl: 'https://images.unsplash.com/photo-1541726260-e6b6a6a08b27?w=800&auto=format&fit=crop',
      content: `<p>Ông Vladimir Putin đã giành chiến thắng trong cuộc bầu cử tổng thống Nga với tỷ lệ phiếu bầu cao kỷ lục.</p>`
    },
    {
      id: 2, 
      title: 'Lãi suất ngân hàng tiếp tục giảm, có nơi còn 2%/năm',
      source: 'VnExpress',
      timeAgo: '3 giờ trước',
      imageUrl: 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=800&auto=format&fit=crop',
      content: `<p>Nhiều ngân hàng đã điều chỉnh giảm lãi suất huy động xuống mức thấp kỷ lục.</p>`
    },
    {
      id: 3,
      title: 'Chứng khoán tăng điểm mạnh, VN-Index vượt 1.280 điểm',
      source: 'Báo Đầu Tư',
      timeAgo: '4 giờ trước', 
      imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop',
      content: `<p>Thị trường chứng khoán Việt Nam ghi nhận phiên tăng điểm ấn tượng.</p>`
    },
    {
      id: 4,
      title: 'Giá vàng SJC vẫn trên 80 triệu đồng/lượng',
      source: 'Người Lao Động',
      timeAgo: '5 giờ trước',
      imageUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&auto=format&fit=crop',
      content: `<p>Giá vàng SJC vẫn duy trì ở mức cao trên 80 triệu đồng/lượng.</p>`
    },
    {
      id: 5,
      title: 'Bất động sản công nghiệp tiếp tục thu hút vốn FDI',
      source: 'CafeF',
      timeAgo: '6 giờ trước',
      imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop',
      content: `<p>Các khu công nghiệp tiếp tục là điểm sáng thu hút vốn đầu tư nước ngoài.</p>`
    },
    {
      id: 6,
      title: 'Fed dự kiến giữ nguyên lãi suất trong cuộc họp tháng 3',
      source: 'Bloomberg',
      timeAgo: '7 giờ trước',
      imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop',
      content: `<p>Cục Dự trữ Liên bang Mỹ (Fed) có thể giữ nguyên lãi suất trong cuộc họp sắp tới.</p>`
    },
    {
      id: 7,
      title: 'Dệt may xuất khẩu khởi sắc trong quý đầu năm',
      source: 'Báo Công Thương',
      timeAgo: '8 giờ trước',
      imageUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&auto=format&fit=crop',
      content: `<p>Ngành dệt may ghi nhận tín hiệu tích cực về xuất khẩu trong quý I/2024.</p>`
    },
    {
      id: 8,
      title: 'Thị trường ô tô tiếp tục giảm giá mạnh',
      source: 'Zing News',
      timeAgo: '9 giờ trước',
      imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop',
      content: `<p>Nhiều hãng xe tiếp tục công bố chương trình giảm giá lớn trong tháng 3.</p>`
    },
    {
      id: 9,
      title: 'Nikkei 225 lập đỉnh mới sau 34 năm',
      source: 'Nikkei Asia',
      timeAgo: '10 giờ trước',
      imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop',
      content: `<p>Chỉ số Nikkei 225 của Nhật Bản đạt mức cao nhất trong 34 năm.</p>`
    },
    {
      id: 10,
      title: 'Xuất khẩu nông sản sang Trung Quốc đạt kỷ lục',
      source: 'VTV News',
      timeAgo: '11 giờ trước',
      imageUrl: 'https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?w=800&auto=format&fit=crop',
      content: `<p>Kim ngạch xuất khẩu nông sản sang thị trường Trung Quốc đạt mức cao kỷ lục.</p>`
    },
    {
      id: 11,
      title: 'Giá dầu thế giới tăng mạnh do căng thẳng địa chính trị',
      source: 'Reuters',
      timeAgo: '12 giờ trước',
      imageUrl: 'https://images.unsplash.com/photo-1582486225644-6e86ded677e8?w=800&auto=format&fit=crop',
      content: `<p>Giá dầu thô tăng do lo ngại về tình hình căng thẳng tại Trung Đông.</p>`
    },
    {
      id: 12,
      title: 'Bitcoin vượt mốc 70.000 USD, lập kỷ lục mới',
      source: 'CoinDesk',
      timeAgo: '13 giờ trước',
      imageUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&auto=format&fit=crop',
      content: `<p>Giá Bitcoin tiếp tục tăng mạnh và thiết lập mức cao kỷ lục mới.</p>`
    },
    {
      id: 13,
      title: 'Thị trường việc làm công nghệ thông tin sôi động',
      source: 'Tech News',
      timeAgo: '14 giờ trước',
      imageUrl: 'https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?w=800&auto=format&fit=crop',
      content: `<p>Nhu cầu tuyển dụng nhân sự IT tăng mạnh trong quý I/2024.</p>`
    },
    {
      id: 14,
      title: 'Xuất khẩu điện thoại và linh kiện tăng trưởng ấn tượng',
      source: 'ICTNews',
      timeAgo: '15 giờ trước',
      imageUrl: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&auto=format&fit=crop',
      content: `<p>Kim ngạch xuất khẩu điện thoại và linh kiện đạt mức tăng trưởng cao.</p>`
    },
    {
      id: 15,
      title: 'Ngành logistics Việt Nam thu hút đầu tư nước ngoài',
      source: 'Logistics Times',
      timeAgo: '16 giờ trước',
      imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop',
      content: `<p>Các nhà đầu tư nước ngoài đang quan tâm đến thị trường logistics Việt Nam.</p>`
    },
  ];

  // Helper function to convert timeAgo string to minutes
  const timeAgoToMinutes = (timeAgo) => {
    if (!timeAgo || typeof timeAgo !== 'string') return Number.MAX_SAFE_INTEGER;
    
    const match = timeAgo.match(/(\d+)\s*(giờ|phút|giây|ngày|tháng|năm)\s*trước/i);
    if (!match) return Number.MAX_SAFE_INTEGER;
    
    const amount = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    switch (unit) {
      case 'giây': return amount / 60;
      case 'phút': return amount;
      case 'giờ': return amount * 60;
      case 'ngày': return amount * 60 * 24;
      case 'tháng': return amount * 60 * 24 * 30;
      case 'năm': return amount * 60 * 24 * 365;
      default: return Number.MAX_SAFE_INTEGER;
    }
  };

  // Define fetchNewsData as a useCallback function so we can reference it in the SignalR event handler
  const fetchNewsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const newsData = await apiService.getNews('cafef');
      console.log('Received news data:', newsData);
      
      if (newsData && newsData.length > 0) {
        // Xử lý các item từ API mới
        const processedNews = newsData.map(item => ({
          id: item.id || Math.random().toString(36).substr(2, 9),
          title: item.title || 'No title',
          source: 'CafeF',
          timeAgo: item.time || item.timeAgo || 'Gần đây',
          imageUrl: (item.image || item.imageUrl) && !(item.image || item.imageUrl).includes('placeholder.com') 
            ? (item.image || item.imageUrl) 
            : DEFAULT_IMAGE,
          content: item.content || (item.description ? `<p>${item.description}</p>` : '<p>Không có nội dung</p>')
        }));
        
        // Sắp xếp tin tức theo thời gian mới nhất
        const sortedNews = processedNews.sort((a, b) => {
          return timeAgoToMinutes(a.timeAgo) - timeAgoToMinutes(b.timeAgo);
        });
        
        setNews(sortedNews);
        console.log(`Successfully loaded ${newsData.length} news items`);
      } else {
        // Fallback to mock data if API returns empty array
        const processedMockNews = mockNews.map(item => ({
          ...item,
          // Đảm bảo ảnh mặc định cho mock data
          imageUrl: item.imageUrl && !item.imageUrl.includes('placeholder.com')
            ? item.imageUrl
            : DEFAULT_IMAGE
        }));
        
        // Sắp xếp mock data theo thời gian mới nhất
        const sortedMockNews = processedMockNews.sort((a, b) => {
          return timeAgoToMinutes(a.timeAgo) - timeAgoToMinutes(b.timeAgo);
        });
        
        console.log('Using mock data due to empty API response');
        setNews(sortedMockNews);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      
      // Fallback to mock data on error
      const processedMockNews = mockNews.map(item => ({
        ...item,
        // Đảm bảo ảnh mặc định cho mock data
        imageUrl: item.imageUrl && !item.imageUrl.includes('placeholder.com')
          ? item.imageUrl
          : DEFAULT_IMAGE
      }));
      
      // Sắp xếp mock data theo thời gian mới nhất
      const sortedMockNews = processedMockNews.sort((a, b) => {
        return timeAgoToMinutes(a.timeAgo) - timeAgoToMinutes(b.timeAgo);
      });
      
      console.log('Using mock data due to API error');
      setNews(sortedMockNews);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Define the callback for news updates here, before it's used
  const handleNewsUpdate = useCallback((message) => {
    console.log('News update received:', message);
    try {
      toast.info(`${message.message || 'Có tin tức mới!'}`, {
        position: "top-right",
        duration: 3000,
      });
      // Refresh news data when update is received
      fetchNewsData();
    } catch (err) {
      console.error('Error handling news update:', err);
    }
  }, [fetchNewsData]);

  useEffect(() => {
    // Fetch initial news data
    fetchNewsData();
    
    // Start SignalR connection and subscribe to events
    const setupSignalR = async () => {
      let usePolling = false;
      let cleanupFunction = () => {}; // Khởi tạo hàm cleanup mặc định
      
      try {
        // Verificar status atual da conexão SignalR
        const connectionStatus = signalRService.isConnected();
        
        // Verificar se a conexão SignalR falhou ou não está disponível
        if (connectionStatus.connectionFailed || !connectionStatus.appHub) {
          console.log('SignalR connection unavailable, using polling fallback for news');
          usePolling = true;
        } else {
          // Tentar configurar o listener
          try {
            signalRService.on('ReceiveCafefNewsUpdate', handleNewsUpdate);
            console.log('Successfully set up SignalR event listener for news');
            
            // Lưu hàm cleanup cho kết nối SignalR
            cleanupFunction = () => {
              try {
                signalRService.off('ReceiveCafefNewsUpdate', handleNewsUpdate);
                console.log('Cleaned up SignalR event listener for news');
              } catch (err) {
                console.error('Error cleaning up SignalR:', err);
              }
            };
          } catch (error) {
            console.error('Error setting up SignalR listener:', error);
            usePolling = true;
          }
        }
      } catch (error) {
        console.error('Error checking SignalR status:', error);
        usePolling = true;
      }
      
      // Configurar polling como fallback
      if (usePolling) {
        console.log('Setting up polling fallback for news');
        const pollingInterval = setInterval(fetchNewsData, 60000); // Polling a cada 60 segundos
        
        // Cập nhật hàm cleanup cho polling
        cleanupFunction = () => {
          console.log('Cleaning up polling interval');
          clearInterval(pollingInterval);
        };
      }
      
      // Luôn trả về một hàm cleanup hợp lệ
      return cleanupFunction;
    };
    
    // Executar setup e guardar função de limpeza
    let cleanup;
    setupSignalR().then(cleanupFn => {
      cleanup = cleanupFn;
    }).catch(error => {
      console.error('Error in setupSignalR:', error);
      cleanup = () => {};
    });
    
    // Clean up event subscription on component unmount
    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      } else {
        console.warn('Cleanup is not available or not a function');
      }
    };
  }, [fetchNewsData, handleNewsUpdate]);

  const openArticleDetail = (article) => {
    setSelectedArticle(article);
  };

  const toggleBookmark = (articleId) => {
    setBookmarkedArticles(prev => 
      prev.includes(articleId) 
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  const shareArticle = (article) => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.title,
        url: window.location.href,
      });
    }
  };

  // Tính toán số trang
  const totalPages = Math.ceil((news.length || mockNews.length) / itemsPerPage);
  
  const getCurrentPageItems = () => {
    const dataSource = news.length ? news : mockNews;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return dataSource.slice(startIndex, startIndex + itemsPerPage);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentItems = getCurrentPageItems();

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-3 gap-6 pl-4 pr-4">
      {/* Featured Article Skeleton */}
      <div className="animate-pulse">
        <div className="aspect-[16/9] bg-gray-700 rounded-lg mb-4"></div>
        <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </div>

      {/* Middle Column Skeleton */}
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

      {/* Right Column Skeleton */}
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

  // Handler for image errors
  const handleImageError = (id) => {
    // Nếu ảnh này chưa được đánh dấu là lỗi
    if (!failedImages[id]) {
      setFailedImages(prev => ({
        ...prev,
        [id]: true
      }));
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      <div className="max-w-[1600px] mx-auto">
        {/* Header with Categories */}
        <div className="sticky top-0 z-10 bg-[#0a0a14]/95 backdrop-blur-sm border-b border-[#333] mb-6">
          <div className="px-4 py-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">
                  <span className="text-[#09D1C7]">Stock</span>
                  <span className="text-white">News</span>
                </h1>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#09D1C7]/10 text-[#09D1C7] hover:bg-[#09D1C7]/20 transition-all duration-300">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Mới nhất</span>
                  </button>
                  <div className="h-4 w-px bg-[#333]"></div>
                  <button className="p-2 rounded-full hover:bg-[#1a1a1a] transition-colors">
                    <Bookmark className="w-4 h-4 text-gray-400 hover:text-[#09D1C7]" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                        selectedCategory === category.id
                          ? 'bg-gradient-to-r from-[#09D1C7] to-[#0a8f88] text-white shadow-lg shadow-[#09D1C7]/20'
                          : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#252525] hover:text-[#09D1C7]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${
                        selectedCategory === category.id
                          ? 'animate-pulse'
                          : ''
                      }`} />
                      <span className="text-sm font-medium whitespace-nowrap">{category.name}</span>
                    </button>
                  );
                })}
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
                <div 
                  className="group relative hover:bg-[#1a1a1a] transition-all duration-300 cursor-pointer rounded-lg overflow-hidden"
                  onClick={() => openArticleDetail(currentItems[0])}
                >
                  {/* Featured Image with Overlay */}
                  <div className="aspect-[16/9] overflow-hidden rounded-lg">
                    <img
                      src={failedImages[currentItems[0]?.id] ? DEFAULT_IMAGE : currentItems[0]?.imageUrl}
                      alt={currentItems[0]?.title}
                      className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                      onError={() => handleImageError(currentItems[0]?.id)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  {/* Featured Content */}
                  <div className="p-4">
                    <h2 className="text-xl text-left font-semibold mb-3 group-hover:text-[#09D1C7] transition-colors duration-300">
                      {currentItems[0]?.title}
                    </h2>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{currentItems[0]?.timeAgo}</span>
                        <span>•</span>
                        <span>{currentItems[0]?.source}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(currentItems[0]?.id);
                          }}
                          className="p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                        >
                          <Bookmark 
                            className={`w-4 h-4 ${
                              bookmarkedArticles.includes(currentItems[0]?.id)
                                ? 'fill-[#09D1C7] text-[#09D1C7]'
                                : 'text-gray-400'
                            }`}
                          />
                        </button>
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
              </div>

              {/* Middle Column - Articles with Images */}
              <div className="space-y-4">
                {currentItems.slice(1, 4).map((item) => (
                  <div
                    key={item.id}
                    className="group flex gap-4 p-3 hover:bg-[#1a1a1a] transition-all duration-300 cursor-pointer rounded-lg"
                    onClick={() => openArticleDetail(item)}
                  >
                    {/* News Image */}
                    <div className="flex-shrink-0 w-32 h-24 overflow-hidden rounded-lg">
                      <img
                        src={failedImages[item.id] ? DEFAULT_IMAGE : item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                        onError={() => handleImageError(item.id)}
                      />
                    </div>

                    {/* News Content */}
                    <div className="flex-1 flex flex-col justify-between">
                      <h3 className="text-sm text-left font-medium group-hover:text-[#09D1C7] transition-colors duration-300 line-clamp-2">
                        {item.title}
                      </h3>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>{item.timeAgo}</span>
                          <span>•</span>
                          <span>{item.source}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(item.id);
                            }}
                            className="p-1.5 rounded-full hover:bg-gray-700/50 transition-colors"
                          >
                            <Bookmark 
                              className={`w-3 h-3 ${
                                bookmarkedArticles.includes(item.id)
                                  ? 'fill-[#09D1C7] text-[#09D1C7]'
                                  : 'text-gray-400'
                              }`}
                            />
                          </button>
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
                        <span>{item.source}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(item.id);
                          }}
                          className="p-1.5 rounded-full hover:bg-gray-700/50 transition-colors"
                        >
                          <Bookmark 
                            className={`w-3 h-3 ${
                              bookmarkedArticles.includes(item.id)
                                ? 'fill-[#09D1C7] text-[#09D1C7]'
                                : 'text-gray-400'
                            }`}
                          />
                        </button>
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
          <DialogContent className="bg-[#1a1a1a] text-white border-[#333] max-w-4xl">
            {selectedArticle && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold hover:text-[#09D1C7] transition-colors duration-300">
                    {selectedArticle.title}
                  </h2>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{selectedArticle.timeAgo}</span>
                      <span>•</span>
                      <span>{selectedArticle.source}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleBookmark(selectedArticle.id)}
                        className="p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                      >
                        <Bookmark 
                          className={`w-4 h-4 ${
                            bookmarkedArticles.includes(selectedArticle.id)
                              ? 'fill-[#09D1C7] text-[#09D1C7]'
                              : 'text-gray-400'
                          }`}
                        />
                      </button>
                      <button 
                        onClick={() => shareArticle(selectedArticle)}
                        className="p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                      >
                        <Share2 className="w-4 h-4 text-gray-400 hover:text-[#09D1C7]" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="aspect-video overflow-hidden rounded-lg">
                  <img
                    src={failedImages[selectedArticle.id] ? DEFAULT_IMAGE : selectedArticle.imageUrl}
                    alt={selectedArticle.title}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(selectedArticle.id)}
                  />
                </div>

                <div 
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default NewsPage;