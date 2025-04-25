import React, { useEffect, useRef, useState } from 'react';
import { createChart, LineStyle } from 'lightweight-charts';

const CandlestickChart = ({ stockCode, data }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const canvasRef = useRef(null);
  const [activeTool, setActiveTool] = useState('cursor');
  const [selectedColor, setSelectedColor] = useState('#ffffff');
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

  // Danh sách màu sắc
  const colorOptions = [
    '#ffffff', // Trắng
    '#00C9FF', // Xanh dương
    '#26a69a', // Xanh lá
    '#ef5350', // Đỏ
    '#F4BE37', // Vàng
    '#FF9800', // Cam
    '#E040FB'  // Tím
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
        x: rect.right + 5, 
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

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: '#131722' },
        textColor: '#a9a9a9',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: '#2a2e39' },
        horzLines: { color: '#2a2e39' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: '#4e5b71',
          style: 2,
        },
        horzLine: {
          width: 1,
          color: '#4e5b71',
          style: 2,
        },
      },
      timeScale: {
        borderColor: '#2a2e39',
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
        borderColor: '#2a2e39',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
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

    // Thêm tooltip hiển thị giá
    chart.subscribeCrosshairMove((param) => {
      if (param.time && param.point && param.seriesData.size > 0) {
        const data = param.seriesData.get(candlestickSeries);
        if (data) {
          const price = data.close;
          const time = new Date(param.time * 1000).toLocaleString('vi-VN');
          // Có thể thêm tooltip ở đây nếu cần
        }
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
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

  return (
    <div className="relative flex h-full">
      {/* Toolbar */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#1e222d] border-r border-[#2a2e39] z-20 flex flex-col items-center py-2 shadow-lg overflow-y-auto">
        {/* Drawing Tools */}
        <div className="space-y-1 w-full px-1">
          {tools.map(tool => (
            <button
              key={tool.id}
              className={`w-10 h-10 flex items-center justify-center rounded transition-all duration-200 group relative ${
                (activeTool === tool.id || (tool.isGroup && lineTools.some(t => t.id === activeTool)))
                  ? 'bg-[#2962FF] text-white'
                  : 'text-[#888] hover:bg-[#2a2e39] hover:text-white'
              }`}
              onClick={(e) => handleToolClick(tool, e)}
            >
              <span className="text-lg">{tool.icon}</span>
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-[#1e222d] text-white text-xs whitespace-nowrap rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                {tool.tooltip}
              </div>
            </button>
          ))}
        </div>

        {/* Line Tools Dialog */}
        {showLineTools && (
          <div 
            className="line-tools-dialog fixed bg-[#1e222d] border border-[#2a2e39] rounded shadow-lg py-1"
            style={{ 
              left: `${lineToolsPosition.x}px`, 
              top: `${lineToolsPosition.y}px`,
              zIndex: 1000
            }}
          >
            {lineTools.map(tool => (
              <button
                key={tool.id}
                className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-[#2a2e39] transition-colors ${
                  activeTool === tool.id ? 'text-[#2962FF]' : 'text-white'
                }`}
                onClick={() => {
                  setActiveTool(tool.id);
                  setShowLineTools(false);
                }}
              >
                <span className="text-lg">{tool.icon}</span>
                <span className="text-sm whitespace-nowrap">{tool.tooltip}</span>
              </button>
            ))}
          </div>
        )}

        {/* Color Picker */}
        <div className="mt-4 pt-4 border-t border-[#2a2e39] w-full px-2">
          {colorOptions.map(color => (
            <div
              key={color}
              className={`w-8 h-8 mb-2 mx-auto rounded-full cursor-pointer transition-all duration-200 hover:scale-110 ${
                selectedColor === color ? 'ring-2 ring-[#2962FF] ring-offset-2 ring-offset-[#1e222d]' : ''
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
            />
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 ml-12 relative">
        {/* Drawing Canvas Layer */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full z-10"
          style={{
            pointerEvents: activeTool === 'cursor' || activeTool === 'crosshair' ? 'none' : 'all',
            opacity: activeTool === 'cursor' || activeTool === 'crosshair' ? 0 : 1,
            transition: 'opacity 0.2s ease',
            cursor: activeTool === 'cursor' ? 'default' : 
                   activeTool === 'crosshair' ? 'crosshair' : 
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
        
        {/* Text Input Dialog */}
        {showTextInput && (
          <div 
            className="absolute z-20 bg-[#1e222d] border border-[#2a2e39] rounded shadow-lg"
            style={{
              left: textInputPosition.x + 'px',
              top: textInputPosition.y + 'px',
            }}
          >
            <div className="flex items-center p-2">
              <input
                type="text"
                className="bg-[#131722] text-white border border-[#2a2e39] px-2 py-1 outline-none rounded mr-2 min-w-[200px]"
                value={textInputValue}
                onChange={(e) => setTextInputValue(e.target.value)}
                onKeyDown={handleTextInputKeyDown}
                placeholder="Nhập văn bản..."
                autoFocus
              />
              <button
                className="px-3 py-1 bg-[#2962FF] text-white rounded hover:bg-[#2451CC] transition-colors"
                onClick={handleTextSubmit}
              >
                OK
              </button>
            </div>
            <div className="text-[#666] text-xs px-2 pb-2">
              Enter để xác nhận • Esc để hủy
            </div>
          </div>
        )}
        
        <div 
          ref={chartContainerRef} 
          className="w-full h-full"
          style={{ 
            cursor: activeTool === 'cursor' ? 'default' : 
                   activeTool === 'crosshair' ? 'crosshair' : 'default',
            position: 'relative',
            zIndex: activeTool === 'cursor' || activeTool === 'crosshair' ? 10 : 1
          }}
        />
      </div>
    </div>
  );
};

export default CandlestickChart; 