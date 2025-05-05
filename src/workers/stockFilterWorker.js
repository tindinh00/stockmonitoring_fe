// Web worker for filtering and sorting stock data
// This offloads potentially expensive operations from the main thread

// Message handler for the worker
self.onmessage = function(e) {
  const { 
    action, 
    data, 
    searchQuery, 
    filters, 
    sortConfig,
    showWatchlist 
  } = e.data;

  if (action === 'filter') {
    const startTime = performance.now();
    
    // Perform filtering and sorting
    const filteredData = getFilteredData(data, searchQuery, filters, sortConfig);
    
    // Calculate processing time
    const endTime = performance.now();
    const processingTime = (endTime - startTime).toFixed(2);
    
    // Send results back to main thread
    self.postMessage({ 
      filteredData: filteredData,
      showWatchlist: showWatchlist,
      stats: {
        itemsIn: data.length,
        itemsOut: filteredData.length,
        processingTime: processingTime
      }
    });
    
    // Log performance info in worker
    console.log(`[Worker] Filtered ${data.length} items to ${filteredData.length} in ${processingTime}ms`);
  }
};

// The filtering and sorting function moved from the main component
function getFilteredData(data, searchQuery, filters, sortConfig) {
  if (!data || !Array.isArray(data)) {
    return [];
  }
  
  // Start time for filtering
  const filterStartTime = performance.now();
  
  let filteredData = data.filter(stock => {
    // Search filter - mở rộng tìm kiếm cả mã và tên
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      const stockCode = (stock.code || '').toLowerCase();
      const stockName = (stock.stockName || stock.companyName || '').toLowerCase();
      
      if (!stockCode.includes(query) && !stockName.includes(query)) {
        return false;
      }
    }

    // Price change filter
    if (filters.priceChange !== 'all') {
      const isUp = parseFloat(stock.matchChange) > 0;
      if (filters.priceChange === 'up' && !isUp) return false;
      if (filters.priceChange === 'down' && isUp) return false;
    }

    // Volume filter
    if (filters.volume !== 'all') {
      const volume = parseFloat(stock.totalVolume?.toString().replace(/,/g, ''));
      const avgVolume = 1000000;
      if (filters.volume === 'high' && volume < avgVolume) return false;
      if (filters.volume === 'low' && volume >= avgVolume) return false;
    }

    // Percent change filter
    if (filters.percentChange !== 'all') {
      const change = parseFloat(stock.matchChange);
      if (filters.percentChange === 'positive' && change <= 0) return false;
      if (filters.percentChange === 'negative' && change >= 0) return false;
    }

    // Market cap filter
    if (filters.marketCap !== 'all') {
      const price = parseFloat(stock.matchPrice);
      const volume = parseFloat(stock.totalVolume?.toString().replace(/,/g, ''));
      const marketCap = price * volume;
      
      if (filters.marketCap === 'large' && marketCap < 1000000000) return false;
      if (filters.marketCap === 'medium' && (marketCap < 100000000 || marketCap >= 1000000000)) return false;
      if (filters.marketCap === 'small' && marketCap >= 100000000) return false;
    }

    return true;
  });
  
  // End time for filtering
  const filterEndTime = performance.now();
  const filterTime = (filterEndTime - filterStartTime).toFixed(2);
  
  // Start time for sorting
  const sortStartTime = performance.now();
  
  // Apply sorting
  if (sortConfig.key) {
    filteredData.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle special cases
      if (sortConfig.key === 'matchChange') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      } else if (sortConfig.key === 'totalVolume') {
        aValue = parseFloat(aValue?.toString().replace(/,/g, ''));
        bValue = parseFloat(bValue?.toString().replace(/,/g, ''));
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }
  
  // End time for sorting
  const sortEndTime = performance.now();
  const sortTime = (sortEndTime - sortStartTime).toFixed(2);
  
  // Log performance details
  console.log(`[Worker] Filter: ${filterTime}ms, Sort: ${sortTime}ms, Total items: ${filteredData.length}`);
  
  return filteredData;
} 