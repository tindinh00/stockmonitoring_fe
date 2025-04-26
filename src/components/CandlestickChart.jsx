import React, { useEffect, useRef, useState } from 'react';
import { createChart, LineStyle } from 'lightweight-charts';

const CandlestickChart = ({ stockCode, data }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const canvasRef = useRef(null);
  const [activeTool, setActiveTool] = useState('cursor');
  const [selectedColor, setSelectedColor] = useState(document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000');
  const [drawings, setDrawings] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentPoint, setCurrentPoint] = useState(null);
  const [isChartInteractive, setIsChartInteractive] = useState(true);
  const [selectedDrawing, setSelectedDrawing] = useState(null);
  const [isErasing, setIsErasing] = useState(false);
  const [brushPath, setBrushPath] = useState([]);
  const [showLineTools, setShowLineTools] = useState(false);
  const [lineToolsPosition, setLineToolsPosition] = useState({ x: 0, y: 0 });

  // State to store notifications
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // Danh sách màu sắc
  const colorOptions = [
    document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000', // Trắng/Đen
    '#00C9FF', // Xanh dương
    '#26a69a', // Xanh lá
    '#ef5350', // Đỏ
    '#F4BE37', // Vàng
    '#FF9800', // Cam
  ];

  // Định nghĩa các nhóm công cụ
  const lineTools = [
    { id: 'line', icon: '—', tooltip: 'Đường xu hướng' },
    { id: 'horizontal', icon: '―', tooltip: 'Đường ngang' },
    { id: 'vertical', icon: '|', tooltip: 'Đường dọc' },
    { id: 'ray', icon: '→', tooltip: 'Đường tia' },
    { id: 'arrow', icon: '↗', tooltip: 'Mũi tên' },
    { id: 'parallel', icon: '=', tooltip: 'Kênh song song' },
  ];

  // Danh sách công cụ chính
  const tools = [
    { id: 'cursor', icon: '⊕', tooltip: 'Con trỏ' },
    { id: 'lines', icon: '—', tooltip: 'Công cụ vẽ đường', isGroup: true },
    { id: 'brush', icon: '✎', tooltip: 'Bút vẽ tự do' },
    { id: 'text', icon: 'T', tooltip: 'Thêm chữ' },
    { id: 'delete', icon: '🗑️', tooltip: 'Xóa tất cả' }
  ];

  // Thêm state cho công cụ text
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [textInputPosition, setTextInputPosition] = useState({ x: 0, y: 0 });
  const [annotations, setAnnotations] = useState([]);

  // Thêm state cho công cụ đo lường
  const [measurements, setMeasurements] = useState([]);

  // Thêm state cho Fibonacci
  const [fibLevels] = useState([0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]);

  // Format dữ liệu và sắp xếp theo thời gian
  const formatAndSortData = (rawData) => {
    if (!rawData || rawData.length === 0) return [];
    
    // Tạo Map để lưu trữ dữ liệu theo timestamp, tự động loại bỏ trùng lặp
    const dataMap = new Map();
    
    rawData.forEach(item => {
      // Nếu đã có dữ liệu cho timestamp này, chỉ cập nhật nếu dữ liệu mới hơn
      if (!dataMap.has(item.time) || item.time > dataMap.get(item.time).time) {
        dataMap.set(item.time, {
          time: item.time,
          open: parseFloat(item.open),
          high: parseFloat(item.high),
          low: parseFloat(item.low),
          close: parseFloat(item.close),
        });
      }
    });
    
    // Chuyển Map thành mảng và sắp xếp theo thời gian tăng dần
    return Array.from(dataMap.values())
      .sort((a, b) => a.time - b.time)
      .map(item => ({
        ...item,
        // Đảm bảo các giá trị là số
        open: Number(item.open),
        high: Number(item.high),
        low: Number(item.low),
        close: Number(item.close),
      }));
  };

  // Toggle chart interaction
  const toggleChartInteraction = (enable) => {
    if (!chartRef.current) return;
    
    chartRef.current.applyOptions({
      handleScroll: {
        mouseWheel: enable,
        pressedMouseMove: enable,
        horzTouchDrag: enable,
        vertTouchDrag: enable,
      },
      handleScale: {
        axisPressedMouseMove: {
          time: enable,
          price: enable,
        },
        mouseWheel: enable,
        pinch: enable,
      }
    });
    setIsChartInteractive(enable);
  };

  // Update when tool changes
  useEffect(() => {
    if (activeTool === 'cursor') {
      toggleChartInteraction(true);
    } else {
      toggleChartInteraction(false);
    }
  }, [activeTool]);

  // Initialize canvas
  const initCanvas = () => {
    if (!canvasRef.current || !chartContainerRef.current) return;
    
    const canvas = canvasRef.current;
    const container = chartContainerRef.current;
    
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = 2;
  };

  // Draw all saved drawings
  const redrawAllDrawings = () => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    drawings.forEach(drawing => {
      ctx.strokeStyle = drawing.color;
      ctx.beginPath();
      
      if (drawing.type === 'brush') {
        drawBrush(ctx, drawing.points);
      } else {
        switch (drawing.type) {
          case 'line':
            drawLine(ctx, drawing.start, drawing.end);
            break;
          case 'horizontal':
            drawHorizontalLine(ctx, drawing.start, drawing.end);
            break;
          case 'vertical':
            drawVerticalLine(ctx, drawing.start);
            break;
          case 'ray':
            drawRay(ctx, drawing.start, drawing.end);
            break;
          case 'arrow':
            drawLine(ctx, drawing.start, drawing.end);
            drawArrowhead(ctx, drawing.start, drawing.end);
            break;
        }
      }
      
      ctx.stroke();
    });
  };

  // Drawing functions
  const drawLine = (ctx, start, end) => {
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
  };

  const drawHorizontalLine = (ctx, start, end) => {
    ctx.moveTo(0, start.y);
    ctx.lineTo(canvasRef.current.width, start.y);
  };

  const drawVerticalLine = (ctx, start) => {
    ctx.moveTo(start.x, 0);
    ctx.lineTo(start.x, canvasRef.current.height);
  };

  const drawRay = (ctx, start, end) => {
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const length = Math.max(canvasRef.current.width, canvasRef.current.height) * 2;
    
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(
      start.x + length * Math.cos(angle),
      start.y + length * Math.sin(angle)
    );
  };

  const drawArrowhead = (ctx, start, end) => {
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const length = 15;
    
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - length * Math.cos(angle - Math.PI / 6),
      end.y - length * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - length * Math.cos(angle + Math.PI / 6),
      end.y - length * Math.sin(angle + Math.PI / 6)
    );
  };

  // Hàm vẽ góc
  const drawAngle = (ctx, start, end) => {
    const radius = 30;
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    
    ctx.beginPath();
    ctx.arc(start.x, start.y, radius, 0, angle, angle > 0);
    ctx.stroke();
    
    // Vẽ góc bằng độ
    const degrees = (angle * 180 / Math.PI).toFixed(1);
    ctx.fillStyle = selectedColor;
    ctx.fillText(`${degrees}°`, start.x + radius * Math.cos(angle/2), start.y + radius * Math.sin(angle/2));
  };

  // Hàm vẽ đường song song
  const drawParallelLines = (ctx, start, end) => {
    const distance = 20; // Khoảng cách giữa các đường
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const perpendicular = angle + Math.PI/2;
    
    // Vẽ đường thứ nhất
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    
    // Vẽ đường thứ hai
    ctx.beginPath();
    ctx.moveTo(start.x + distance * Math.cos(perpendicular), 
               start.y + distance * Math.sin(perpendicular));
    ctx.lineTo(end.x + distance * Math.cos(perpendicular),
               end.y + distance * Math.sin(perpendicular));
    ctx.stroke();
  };

  // Hàm vẽ Fibonacci
  const drawFibonacci = (ctx, start, end) => {
    const height = end.y - start.y;
    const width = end.x - start.x;
    
    fibLevels.forEach(level => {
      const y = start.y + height * level;
      
      ctx.beginPath();
      ctx.moveTo(start.x, y);
      ctx.lineTo(end.x, y);
      ctx.stroke();
      
      // Hiển thị level
      ctx.fillStyle = selectedColor;
      ctx.fillText(`${(level * 100).toFixed(1)}%`, start.x - 40, y);
    });
  };

  // Hàm vẽ đo lường
  const drawMeasurement = (ctx, start, end) => {
    const price1 = chartRef.current.priceScale('right').coordinateToPrice(start.y);
    const price2 = chartRef.current.priceScale('right').coordinateToPrice(end.y);
    const priceDiff = Math.abs(price2 - price1);
    const percentChange = ((price2 - price1) / price1 * 100).toFixed(2);
    
    // Vẽ đường đo
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    
    // Hiển thị thông tin đo lường
    ctx.fillStyle = selectedColor;
    ctx.fillText(`${priceDiff.toFixed(2)} (${percentChange}%)`, 
                 (start.x + end.x) / 2, 
                 (start.y + end.y) / 2);
  };

  // Hàm vẽ đường cọ
  const drawBrush = (ctx, points) => {
    if (points.length < 2) return;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    ctx.stroke();
  };

  // Hàm kiểm tra điểm có nằm gần đường vẽ không
  const isPointNearLine = (point, line) => {
    const { start, end } = line;
    
    // Tính khoảng cách từ điểm đến đoạn thẳng
    const A = point.x - start.x;
    const B = point.y - start.y;
    const C = end.x - start.x;
    const D = end.y - start.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, yy;
    
    if (param < 0) {
      xx = start.x;
      yy = start.y;
    } else if (param > 1) {
      xx = end.x;
      yy = end.y;
    } else {
      xx = start.x + param * C;
      yy = start.y + param * D;
    }
    
    const dx = point.x - xx;
    const dy = point.y - yy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < 5; // 5px threshold
  };

  // Mouse event handlers
  const handleMouseDown = (e) => {
    if (activeTool === 'cursor') return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const point = { x, y };

    if (activeTool === 'eraser') {
      setIsErasing(true);
      // Tìm và xóa drawing gần nhất với điểm click
      const index = drawings.findIndex(drawing => {
        if (drawing.type === 'brush') {
          return drawing.points.some((p, i) => {
            if (i === 0) return false;
            return isPointNearLine(point, {
              start: drawing.points[i - 1],
              end: p
            });
          });
        }
        return isPointNearLine(point, { start: drawing.start, end: drawing.end });
      });

      if (index !== -1) {
        const newDrawings = [...drawings];
        newDrawings.splice(index, 1);
        setDrawings(newDrawings);
        redrawAllDrawings();
      }
    } else if (activeTool === 'text') {
      setTextInputPosition(point);
      setShowTextInput(true);
      setTextInputValue('');
    } else if (activeTool === 'brush') {
      setIsDrawing(true);
      setBrushPath([point]);
    } else {
      setIsDrawing(true);
      setStartPoint(point);
      setCurrentPoint(point);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || activeTool === 'cursor') return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const point = { x, y };

    if (activeTool === 'brush') {
      setBrushPath(prev => [...prev, point]);
      
      const ctx = canvasRef.current.getContext('2d');
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = 2;
      
      // Vẽ đoạn mới nhất
      const lastPoint = brushPath[brushPath.length - 1];
      if (lastPoint) {
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      }
    } else {
      setCurrentPoint(point);
      
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      redrawAllDrawings();
      
      if (startPoint) {
        ctx.strokeStyle = selectedColor;
        ctx.beginPath();
        
        switch (activeTool) {
          case 'line':
            drawLine(ctx, startPoint, point);
            break;
          case 'parallel':
            drawParallelLines(ctx, startPoint, point);
            break;
          case 'horizontal':
            drawHorizontalLine(ctx, startPoint, point);
            break;
          case 'vertical':
            drawVerticalLine(ctx, startPoint);
            break;
          case 'angle':
            drawAngle(ctx, startPoint, point);
            break;
          case 'ray':
            drawRay(ctx, startPoint, point);
            break;
          case 'arrow':
            drawLine(ctx, startPoint, point);
            drawArrowhead(ctx, startPoint, point);
            break;
          case 'fibonacci':
            drawFibonacci(ctx, startPoint, point);
            break;
          case 'measure':
            drawMeasurement(ctx, startPoint, point);
            break;
        }
        
        ctx.stroke();
      }
    }
  };

  const handleMouseUp = (e) => {
    if (!isDrawing || activeTool === 'cursor') return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const point = { x, y };

    if (activeTool === 'brush') {
      setDrawings([
        ...drawings,
        {
          type: 'brush',
          points: [...brushPath, point],
          color: selectedColor
        }
      ]);
      setBrushPath([]);
    } else {
      setDrawings([
        ...drawings,
        {
          type: activeTool,
          start: startPoint,
          end: point,
          color: selectedColor
        }
      ]);
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  };

  // Thêm hàm xử lý submit text
  const handleTextSubmit = () => {
    if (!textInputValue.trim()) return;
    
    const ctx = canvasRef.current.getContext('2d');
    ctx.font = '14px Arial';
    ctx.fillStyle = selectedColor;
    ctx.fillText(textInputValue, textInputPosition.x, textInputPosition.y);
    
    setAnnotations([
      ...annotations,
      {
        text: textInputValue,
        position: textInputPosition,
        color: selectedColor
      }
    ]);
    
    setShowTextInput(false);
    setTextInputValue('');
  };

  // Cập nhật hàm xử lý phím
  const handleTextInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    } else if (e.key === 'Escape') {
      setShowTextInput(false);
      setTextInputValue('');
    }
  };

  // Xử lý click vào nút công cụ
  const handleToolClick = (tool, event) => {
    if (tool.isGroup) {
      // Lấy vị trí của button để hiển thị dialog
      const rect = event.currentTarget.getBoundingClientRect();
      setLineToolsPosition({ 
        x: rect.width + 2, 
        y: rect.top 
      });
      setShowLineTools(true);
    } else if (tool.id === 'delete') {
      setDrawings([]);
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    } else {
      setActiveTool(tool.id);
      setShowLineTools(false);
    }
  };

  // Xử lý click ra ngoài dialog
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showLineTools && !event.target.closest('.line-tools-dialog')) {
        setShowLineTools(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLineTools]);

  // Chart initialization
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDarkMode = document.documentElement.classList.contains('dark');

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { type: 'solid', color: isDarkMode ? '#131722' : '#ffffff' },
        textColor: isDarkMode ? '#a9a9a9' : '#333333',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: isDarkMode ? '#2a2e39' : '#e6e6e6' },
        horzLines: { color: isDarkMode ? '#2a2e39' : '#e6e6e6' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: isDarkMode ? '#4e5b71' : '#758696',
          style: 2,
        },
        horzLine: {
          width: 1,
          color: isDarkMode ? '#4e5b71' : '#758696',
          style: 2,
        },
      },
      timeScale: {
        borderColor: isDarkMode ? '#2a2e39' : '#e6e6e6',
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time) => {
          const date = new Date(time * 1000);
          return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        },
      },
      rightPriceScale: {
        borderColor: isDarkMode ? '#2a2e39' : '#e6e6e6',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
    });

    // Add event listener for theme changes
    const handleThemeChange = () => {
      const isDark = document.documentElement.classList.contains('dark');
      chart.applyOptions({
        layout: {
          background: { type: 'solid', color: isDark ? '#131722' : '#ffffff' },
          textColor: isDark ? '#a9a9a9' : '#333333',
        },
        grid: {
          vertLines: { color: isDark ? '#2a2e39' : '#e6e6e6' },
          horzLines: { color: isDark ? '#2a2e39' : '#e6e6e6' },
        },
        crosshair: {
          vertLine: { color: isDark ? '#4e5b71' : '#758696' },
          horzLine: { color: isDark ? '#4e5b71' : '#758696' },
        },
        timeScale: {
          borderColor: isDark ? '#2a2e39' : '#e6e6e6',
        },
        rightPriceScale: {
          borderColor: isDark ? '#2a2e39' : '#e6e6e6',
        },
      });
    };

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          handleThemeChange();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    if (data && data.length > 0) {
      const formattedData = formatAndSortData(data);
      try {
        candlestickSeries.setData(formattedData);
        chart.timeScale().fitContent();
      } catch (error) {
        console.error('Error setting chart data:', error);
      }
    }

    // Initialize canvas
    initCanvas();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && canvasRef.current) {
        const { width, height } = chartContainerRef.current.getBoundingClientRect();
        
        chart.applyOptions({
          width: width,
          height: height,
        });
        
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        
        // Redraw all drawings after resize
        redrawAllDrawings();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      chart.remove();
    };
  }, []);

  // Update data when it changes
  useEffect(() => {
    if (candlestickSeriesRef.current && data && data.length > 0) {
      const formattedData = formatAndSortData(data);
      try {
        candlestickSeriesRef.current.setData(formattedData);
        chartRef.current.timeScale().fitContent();
      } catch (error) {
        console.error('Error updating chart data:', error);
      }
    }
  }, [data]);

  // Update canvas color
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.strokeStyle = selectedColor;
    }
  }, [selectedColor]);

  // Theo dõi thay đổi theme để cập nhật màu vẽ
  useEffect(() => {
    const handleThemeChange = () => {
      const isDark = document.documentElement.classList.contains('dark');
      if (selectedColor === '#ffffff' || selectedColor === '#000000') {
        setSelectedColor(isDark ? '#ffffff' : '#000000');
      }
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          handleThemeChange();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, [selectedColor]);

  return (
    <div className="relative flex h-full">
      <div className="flex flex-col items-center w-8 bg-white dark:bg-[#131722] border-r border-gray-200 dark:border-gray-700">
        {tools.map((tool) => (
          <div key={tool.id} className="relative">
            <button
              onClick={(e) => handleToolClick(tool, e)}
              className={`w-8 h-8 flex items-center justify-center text-base hover:bg-gray-100 dark:hover:bg-gray-800 ${
                (activeTool === tool.id || (tool.isGroup && lineTools.some(t => t.id === activeTool)))
                  ? 'text-[#2962FF]' : 'text-black dark:text-white'
              }`}
              title={tool.tooltip}
            >
              {tool.icon}
            </button>
            {tool.isGroup && showLineTools && (
              <div
                className="line-tools-dialog absolute left-full top-0 z-50 bg-white dark:bg-[#131722] border border-gray-200 dark:border-gray-700 rounded shadow-lg"
                style={{ left: '100%', top: '0' }}
              >
                {lineTools.map((lineTool) => (
                  <button
                    key={lineTool.id}
                    onClick={() => {
                      setActiveTool(lineTool.id);
                      setShowLineTools(false);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-base hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white"
                    title={lineTool.tooltip}
                  >
                    {lineTool.icon}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div className="mt-2 flex flex-col items-center space-y-1">
          {colorOptions.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`w-6 h-6 rounded-full ring-1 ring-offset-1 ${
                selectedColor === color ? 'ring-[#2962FF]' : 'ring-gray-300 dark:ring-gray-600'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
      <div className="relative flex-1 ml-8">
        <div 
          ref={chartContainerRef} 
          className="w-full h-full"
          style={{ 
            position: 'relative',
            zIndex: activeTool === 'cursor' ? 2 : 1
          }}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
          style={{
            zIndex: activeTool === 'cursor' ? 1 : 2,
            pointerEvents: activeTool === 'cursor' ? 'none' : 'all',
            cursor: activeTool === 'cursor' ? 'default' : 
                   activeTool === 'text' ? 'text' : 'crosshair'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            if (isDrawing) {
              setIsDrawing(false);
              setStartPoint(null);
              setCurrentPoint(null);
              redrawAllDrawings();
            }
          }}
        />
        {showTextInput && (
          <input
            type="text"
            value={textInputValue}
            onChange={(e) => setTextInputValue(e.target.value)}
            onKeyDown={handleTextInputKeyDown}
            className="absolute bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm"
            style={{
              left: textInputPosition.x + 'px',
              top: textInputPosition.y + 'px',
            }}
            autoFocus
          />
        )}
      </div>
    </div>
  );
};

export default CandlestickChart;