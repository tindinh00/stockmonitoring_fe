// Web worker for price color and animation calculations
// This offloads color-related calculations from the main thread

// Message handler for the worker
self.onmessage = function(e) {
  const { action, data } = e.data;

  if (action === 'getPriceColor') {
    const { price, refPrice, ceilPrice, floorPrice, isDarkMode, cacheKey } = data;
    const colorClass = getPriceColor(price, refPrice, ceilPrice, floorPrice, isDarkMode);
    self.postMessage({ 
      action: 'priceColorResult', 
      result: {
        colorClass: colorClass,
        cacheKey: cacheKey || `${price}-${refPrice}-${ceilPrice}-${floorPrice}-${isDarkMode}`
      }
    });
  } 
  else if (action === 'getChangeAnimation') {
    const { currentValue, previousValue, type, cacheKey } = data;
    const animClass = getChangeAnimation(currentValue, previousValue, type);
    self.postMessage({ 
      action: 'animationResult', 
      result: {
        animClass: animClass,
        cacheKey: cacheKey || `${currentValue}-${previousValue}-${type}`
      }
    });
  }
  else if (action === 'batchProcess') {
    // Process multiple stocks at once to reduce message passing overhead
    const startTime = performance.now();
    const { stocks, isDarkMode, previousValues } = data;
    
    const results = {};
    
    stocks.forEach(stock => {
      // Skip invalid stocks
      if (!stock || !stock.code) return;
      
      // Store results for this stock
      results[stock.code] = {
        priceColors: {},
        animations: {}
      };
      
      // Calculate colors for all price fields
      const priceFields = [
        'matchPrice', 'buyPrice1', 'buyPrice2', 'buyPrice3', 
        'sellPrice1', 'sellPrice2', 'sellPrice3'
      ];
      
      priceFields.forEach(field => {
        if (stock[field]) {
          results[stock.code].priceColors[field] = getPriceColor(
            stock[field], 
            stock.ref, 
            stock.ceiling, 
            stock.floor,
            isDarkMode
          );
        }
      });
      
      // Calculate animations if previousValues are provided
      if (previousValues && previousValues[stock.code]) {
        const prevStock = previousValues[stock.code];
        
        // Check price fields for animations
        priceFields.forEach(field => {
          if (stock[field] && prevStock[field] && stock[field] !== prevStock[field]) {
            results[stock.code].animations[field] = getChangeAnimation(
              stock[field],
              prevStock[field],
              'price'
            );
          }
        });
        
        // Check volume fields for animations
        const volumeFields = [
          'buyVolume1', 'buyVolume2', 'buyVolume3',
          'sellVolume1', 'sellVolume2', 'sellVolume3',
          'matchVolume', 'totalVolume', 'foreignBuy', 'foreignSell'
        ];
        
        volumeFields.forEach(field => {
          if (stock[field] && prevStock[field] && stock[field] !== prevStock[field]) {
            results[stock.code].animations[field] = getChangeAnimation(
              stock[field],
              prevStock[field],
              'volume'
            );
          }
        });
      }
    });
    
    // Calculate processing time
    const endTime = performance.now();
    const processingTime = (endTime - startTime).toFixed(2);
    
    // Send results back to main thread
    self.postMessage({ 
      action: 'batchResults',
      results: results,
      stats: {
        stockCount: Object.keys(results).length,
        processingTime: processingTime
      }
    });
  }
};

/**
 * Determines the appropriate color class for a price value based on its relationship to reference prices
 * Rules:
 * 1. Price = ceiling → purple (#B388FF)
 * 2. Price = floor → cyan (#00BCD4)
 * 3. Price = reference → yellow (#F4BE37)
 * 4. Price > reference → green (#22c55e light mode, #00FF00 dark mode)
 * 5. Price < reference → red (#FF4A4A)
 */
function getPriceColor(price, refPrice, ceilPrice, floorPrice, isDarkMode = false) {
  // Ignore invalid values
  if (price === '--' || refPrice === '--' || ceilPrice === '--' || floorPrice === '--' ||
      price === null || refPrice === null || ceilPrice === null || floorPrice === null) {
    return isDarkMode ? 'text-white' : 'text-gray-900'; // Default color for empty values
  }
  
  // Convert string values with commas to numbers
  const numPrice = parseFloat(String(price).replace(/,/g, ''));
  const numRefPrice = parseFloat(String(refPrice).replace(/,/g, ''));
  const numCeilPrice = parseFloat(String(ceilPrice).replace(/,/g, ''));
  const numFloorPrice = parseFloat(String(floorPrice).replace(/,/g, ''));

  // Check for invalid number values
  if (isNaN(numPrice) || isNaN(numRefPrice) || isNaN(numCeilPrice) || isNaN(numFloorPrice)) {
    return isDarkMode ? 'text-white' : 'text-gray-900'; // Default color for invalid values
  }

  // Small epsilon for floating point comparisons
  const epsilon = 0.0001;
  
  // Priority-based checks
  // 1. Check ceiling price (purple)
  if (Math.abs(numPrice - numCeilPrice) < epsilon) {
    return 'text-[#B388FF]'; // Purple for ceiling price
  }
  
  // 2. Check floor price (cyan)
  if (Math.abs(numPrice - numFloorPrice) < epsilon) {
    return 'text-[#00BCD4]'; // Cyan for floor price
  }
  
  // 3. Check reference price (yellow)
  if (Math.abs(numPrice - numRefPrice) < epsilon) {
    return 'text-[#F4BE37]'; // Yellow for reference price
  }
  
  // 4. Check price increase (green)
  if (numPrice > numRefPrice) {
    return isDarkMode ? 'text-[#00FF00]' : 'text-[#22c55e]'; // Green for price increase
  }
  
  // 5. Check price decrease (red)
  if (numPrice < numRefPrice) {
    return 'text-[#FF4A4A]'; // Red for price decrease
  }
  
  // Default case (rare)
  return isDarkMode ? 'text-white' : 'text-gray-900';
}

/**
 * Determines the appropriate animation class for value changes
 * Uses thresholds to prevent animations for tiny changes
 * Returns different classes for price vs. volume changes
 */
function getChangeAnimation(currentValue, previousValue, type = 'price') {
  if (!currentValue || !previousValue) return '';
  
  // Convert values to numbers, handling comma-formatted strings
  const current = parseFloat(String(currentValue).replace(/,/g, ''));
  const previous = parseFloat(String(previousValue).replace(/,/g, ''));
  
  if (isNaN(current) || isNaN(previous)) return '';
  
  // Thresholds to prevent animations for tiny changes
  const priceChangeThreshold = 0.001; // 0.1% threshold for prices
  const volumeChangeThreshold = 0.01; // 1% threshold for volumes
  
  if (type === 'price') {
    // Only animate significant price changes
    if (previous !== 0 && Math.abs(current - previous) / Math.abs(previous) > priceChangeThreshold) {
      if (current > previous) return 'price-up';
      if (current < previous) return 'price-down';
    } else if (previous === 0 && current !== 0) {
      // Special case when previous price was 0
      if (current > 0) return 'price-up';
      if (current < 0) return 'price-down';
    }
    return '';
  }
  
  if (type === 'volume') {
    // Only animate significant volume changes
    if (previous !== 0 && Math.abs(current - previous) / Math.abs(previous) > volumeChangeThreshold) {
      if (current > previous) return 'volume-up';
      if (current < previous) return 'volume-down';
    } else if (previous === 0 && current > 0) {
      // Special case when previous volume was 0
      return 'volume-up';
    }
    return '';
  }
  
  return '';
} 