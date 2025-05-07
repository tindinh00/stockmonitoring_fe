// Web worker for price color and animation calculations with maxUpdatesPerFrame

const colorCache = new Map();
const animCache = new Map();
let latestBatchTimestamp = 0;

const MAX_UPDATES_PER_FRAME = 100;
let updateQueue = [];
let animationFrameScheduled = false;

function enqueueUpdate(message) {
  updateQueue.push(message);
  if (!animationFrameScheduled) {
    animationFrameScheduled = true;
    requestAnimationFrame(flushUpdateQueue);
  }
}

function flushUpdateQueue() {
  let count = 0;
  while (updateQueue.length > 0 && count < MAX_UPDATES_PER_FRAME) {
    self.postMessage(updateQueue.shift());
    count++;
  }

  if (updateQueue.length > 0) {
    requestAnimationFrame(flushUpdateQueue);
  } else {
    animationFrameScheduled = false;
  }
}

self.onmessage = function(e) {
  const { action, data } = e.data;

  switch (action) {
    case 'getPriceColor': {
      const { price, refPrice, ceilPrice, floorPrice, isDarkMode, cacheKey } = data;
      const color = getPriceColor(price, refPrice, ceilPrice, floorPrice, isDarkMode);
      colorCache.set(cacheKey, color);
      enqueueUpdate({ action: 'updateCache', cacheType: 'color', key: cacheKey, value: color });
      break;
    }

    case 'getChangeAnimation': {
      const { currentValue, previousValue, type, cacheKey } = data;
      const animation = getChangeAnimation(currentValue, previousValue, type);
      animCache.set(cacheKey, animation);
      enqueueUpdate({ action: 'updateCache', cacheType: 'animation', key: cacheKey, value: animation });
      break;
    }

    case 'batchProcess': {
      const { stocks, previousValues, isDarkMode, chunkSize = 50, priority = 'normal', batchTimestamp } = data;
      if (batchTimestamp < latestBatchTimestamp) return;
      latestBatchTimestamp = batchTimestamp;

      const startTime = performance.now();
      const chunks = chunkArray(stocks, chunkSize);

      const processChunks = async (start = 0) => {
        for (let i = start; i < chunks.length; i++) {
          if (batchTimestamp < latestBatchTimestamp) return;

          const chunk = chunks[i];
          const results = {};

          chunk.forEach((stock) => {
            if (!stock || !stock.code) return;

            const prevStock = previousValues?.[stock.code];
            const priceFields = ['matchPrice', 'buyPrice1', 'buyPrice2', 'buyPrice3', 'sellPrice1', 'sellPrice2', 'sellPrice3'];
            const volumeFields = ['buyVolume1', 'buyVolume2', 'buyVolume3', 'sellVolume1', 'sellVolume2', 'sellVolume3', 'matchVolume', 'totalVolume', 'foreignBuy', 'foreignSell'];

            const priceColors = {};
            const animations = {};

            priceFields.forEach((field) => {
              const val = stock[field];
              if (val) {
                const colorKey = `${stock.code}-${field}`;
                const color = getPriceColor(val, stock.ref, stock.ceiling, stock.floor, isDarkMode);
                priceColors[field] = color;
                enqueueUpdate({ action: 'updateCache', cacheType: 'color', key: colorKey, value: color });
              }

              if (prevStock?.[field] && val !== prevStock[field]) {
                const animKey = `${stock.code}-${field}`;
                const animation = getChangeAnimation(val, prevStock[field], 'price');
                animations[field] = animation;
                enqueueUpdate({ action: 'updateCache', cacheType: 'animation', key: animKey, value: animation });
              }
            });

            volumeFields.forEach((field) => {
              const val = stock[field];
              if (prevStock?.[field] && val !== prevStock[field]) {
                const animKey = `${stock.code}-${field}`;
                const animation = getChangeAnimation(val, prevStock[field], 'volume');
                animations[field] = animation;
                enqueueUpdate({ action: 'updateCache', cacheType: 'animation', key: animKey, value: animation });
              }
            });

            results[stock.code] = { priceColors, animations };
          });

          enqueueUpdate({
            action: 'chunkResults',
            chunkIndex: i,
            totalChunks: chunks.length,
            batchTimestamp,
            results
          });

          if (priority === 'low' && i < chunks.length - 1) {
            await new Promise(res => setTimeout(res, 50));
          }
        }

        if (batchTimestamp >= latestBatchTimestamp) {
          const endTime = performance.now();
          enqueueUpdate({
            action: 'batchResults',
            batchTimestamp,
            priority,
            stats: {
              stockCount: stocks.length,
              processingTime: (endTime - startTime).toFixed(2),
              chunkCount: chunks.length,
              chunkDelay: priority === 'low' ? 50 : 0
            }
          });
        }
      };

      processChunks();
      break;
    }

    case 'clearCache': {
      colorCache.clear();
      animCache.clear();
      latestBatchTimestamp = 0;
      break;
    }
  }
};

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function getPriceColor(price, refPrice, ceilPrice, floorPrice, isDarkMode = false) {
  if (
    price === '--' || refPrice === '--' || ceilPrice === '--' || floorPrice === '--' ||
    price == null || refPrice == null || ceilPrice == null || floorPrice == null
  ) return isDarkMode ? 'text-white' : 'text-gray-900';

  const num = (v) => parseFloat(String(v).replace(/,/g, ''));
  const [p, r, c, f] = [num(price), num(refPrice), num(ceilPrice), num(floorPrice)];
  if ([p, r, c, f].some(isNaN)) return isDarkMode ? 'text-white' : 'text-gray-900';

  const epsilon = 0.0001;
  if (Math.abs(p - c) < epsilon) return 'text-[#B388FF]';
  if (Math.abs(p - f) < epsilon) return 'text-[#00BCD4]';
  if (Math.abs(p - r) < epsilon) return 'text-[#F4BE37]';
  if (p > r) return isDarkMode ? 'text-[#00FF00]' : 'text-[#22c55e]';
  if (p < r) return 'text-[#FF4A4A]';
  return isDarkMode ? 'text-white' : 'text-gray-900';
}

function getChangeAnimation(currentValue, previousValue, type = 'price') {
  if (!currentValue || !previousValue) return '';
  const current = parseFloat(String(currentValue).replace(/,/g, ''));
  const previous = parseFloat(String(previousValue).replace(/,/g, ''));
  if (isNaN(current) || isNaN(previous)) return '';

  const priceThres = 0.001, volumeThres = 0.01;
  const delta = Math.abs(current - previous) / (Math.abs(previous) || 1);

  if (type === 'price') {
    if (delta > priceThres) return current > previous ? 'price-up' : 'price-down';
    if (previous === 0 && current !== 0) return current > 0 ? 'price-up' : 'price-down';
  }

  if (type === 'volume') {
    if (delta > volumeThres) return current > previous ? 'volume-up' : 'volume-down';
    if (previous === 0 && current > 0) return 'volume-up';
  }

  return '';
}
