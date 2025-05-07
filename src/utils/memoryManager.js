/**
 * Utility functions for memory management in the application
 */

// localStorage has a limit of ~5MB in most browsers
const LOCAL_STORAGE_WARNING_THRESHOLD = 4 * 1024 * 1024; // 4MB
const LOCAL_STORAGE_CRITICAL_THRESHOLD = 4.5 * 1024 * 1024; // 4.5MB

/**
 * Calculates the approximate size of localStorage in bytes
 * @returns {number} Size in bytes
 */
export function calculateLocalStorageSize() {
  let totalSize = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    
    // Each character in JS is 2 bytes (UTF-16)
    totalSize += (key.length + value.length) * 2;
  }
  
  return totalSize;
}

/**
 * Formats size in bytes to a human-readable string
 * @param {number} bytes Size in bytes
 * @returns {string} Formatted size string (e.g., "2.5 MB")
 */
export function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Checks the current localStorage size and clears old data if approaching limits
 * @returns {Object} Storage info including size and usage percentage
 */
export function checkLocalStorageSize() {
  try {
    const totalSize = calculateLocalStorageSize();
    const percentUsed = (totalSize / 5242880) * 100; // 5MB in bytes
    
    console.log(`[Memory Manager] localStorage size: ${formatSize(totalSize)} (${percentUsed.toFixed(2)}% of limit)`);
    
    // If approaching warning threshold, clear older caches
    if (totalSize > LOCAL_STORAGE_WARNING_THRESHOLD) {
      console.warn(`[Memory Manager] localStorage usage high (${formatSize(totalSize)}), clearing old caches`);
      clearOldCacheData(['stock_data_', 'watchlist_'], 3 * 24 * 60 * 60 * 1000); // Clear data older than 3 days
    }
    
    // If approaching critical threshold, take more aggressive action
    if (totalSize > LOCAL_STORAGE_CRITICAL_THRESHOLD) {
      console.error(`[Memory Manager] localStorage usage critical (${formatSize(totalSize)}), clearing all caches`);
      clearAllCacheData(['stock_data_', 'watchlist_']); // Clear all cache data
    }
    
    return {
      size: totalSize,
      formatted: formatSize(totalSize),
      percentUsed: percentUsed
    };
  } catch (error) {
    console.error('[Memory Manager] Error checking localStorage size:', error);
    return { size: 0, formatted: '0 B', percentUsed: 0 };
  }
}

/**
 * Clears cache data older than the specified age
 * @param {string[]} prefixes Array of key prefixes to target (e.g., ['stock_data_', 'watchlist_'])
 * @param {number} maxAge Maximum age in milliseconds
 * @returns {number} Number of items cleared
 */
export function clearOldCacheData(prefixes, maxAge) {
  try {
    const now = Date.now();
    let clearedCount = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      // Check if key matches any of the target prefixes
      if (prefixes.some(prefix => key.startsWith(prefix))) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          
          // Check if data has a timestamp and it's older than maxAge
          if (data && data.timestamp && (now - data.timestamp > maxAge)) {
            localStorage.removeItem(key);
            clearedCount++;
            
            // Adjust index since we removed an item
            i--;
          }
        } catch (e) {
          // If can't parse as JSON, just skip
          console.warn(`[Memory Manager] Could not parse cache item ${key}`, e);
        }
      }
    }
    
    if (clearedCount > 0) {
      console.log(`[Memory Manager] Cleared ${clearedCount} old cache items`);
    }
    
    return clearedCount;
  } catch (error) {
    console.error('[Memory Manager] Error clearing old cache data:', error);
    return 0;
  }
}

/**
 * Clears all cache data with the specified prefixes
 * @param {string[]} prefixes Array of key prefixes to target
 * @returns {number} Number of items cleared
 */
export function clearAllCacheData(prefixes) {
  try {
    let clearedCount = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      // Check if key matches any of the target prefixes
      if (prefixes.some(prefix => key.startsWith(prefix))) {
        localStorage.removeItem(key);
        clearedCount++;
        
        // Adjust index since we removed an item
        i--;
      }
    }
    
    console.log(`[Memory Manager] Cleared ${clearedCount} cache items`);
    return clearedCount;
  } catch (error) {
    console.error('[Memory Manager] Error clearing all cache data:', error);
    return 0;
  }
}

/**
 * Checks for performance issues that may indicate memory leaks
 * @returns {Object} Performance metrics
 */
export function checkPerformanceMetrics() {
  try {
    const metrics = {
      jsHeapSizeLimit: 0,
      totalJSHeapSize: 0,
      usedJSHeapSize: 0,
      percentUsed: 0
    };
    
    // Check if performance API is available
    if (window.performance && window.performance.memory) {
      const memory = window.performance.memory;
      
      metrics.jsHeapSizeLimit = memory.jsHeapSizeLimit;
      metrics.totalJSHeapSize = memory.totalJSHeapSize;
      metrics.usedJSHeapSize = memory.usedJSHeapSize;
      metrics.percentUsed = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      
      console.log(`[Memory Manager] Memory usage: ${formatSize(memory.usedJSHeapSize)} / ${formatSize(memory.jsHeapSizeLimit)} (${metrics.percentUsed.toFixed(2)}%)`);
    }
    
    return metrics;
  } catch (error) {
    console.error('[Memory Manager] Error checking performance metrics:', error);
    return {
      jsHeapSizeLimit: 0,
      totalJSHeapSize: 0,
      usedJSHeapSize: 0,
      percentUsed: 0
    };
  }
} 