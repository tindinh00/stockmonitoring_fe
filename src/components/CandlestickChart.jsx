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

  // Danh sách công cụ vẽ
  const tools = [
    { id: 'cursor', icon: '⊕', tooltip: 'Con trỏ' },
    { id: 'line', icon: '—', tooltip: 'Đường thẳng' },
    { id: 'horizontal', icon: '―', tooltip: 'Đường ngang' },
    { id: 'vertical', icon: '|', tooltip: 'Đường dọc' },
    { id: 'ray', icon: '→', tooltip: 'Tia' },
    { id: 'arrow', icon: '↗', tooltip: 'Mũi tên' },
    { id: 'delete', icon: '⌫', tooltip: 'Xóa' }
  ];

  // Format dữ liệu và sắp xếp theo thời gian
  const formatAndSortData = (rawData) => {
    if (!rawData || rawData.length === 0) return [];
    return rawData
      .map(item => ({
        time: item.time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }))
      .sort((a, b) => a.time - b.time);
  };

  // Khởi tạo canvas cho vẽ
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

  // Chuyển đổi tọa độ chuột sang tọa độ biểu đồ
  const getChartCoordinates = (e) => {
    if (!chartRef.current || !chartContainerRef.current) return null;

    const chart = chartRef.current;
    const rect = chartContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    try {
      const price = chart.priceScale('right').coordinateToPrice(y);
      const time = chart.timeScale().coordinateToTime(x);
      return { x, y, price, time };
    } catch (error) {
      return null;
    }
  };

  // Xử lý sự kiện chuột cho công cụ vẽ
  const handleMouseDown = (e) => {
    if (activeTool === 'cursor') return;

    const coords = getChartCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    setStartPoint(coords);

    // Bắt đầu vẽ trên canvas
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !startPoint || activeTool === 'cursor') return;

    const coords = getChartCoordinates(e);
    if (!coords) return;

    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    ctx.beginPath();
    switch (activeTool) {
      case 'line':
      case 'arrow':
        drawLine(ctx, startPoint, coords);
        if (activeTool === 'arrow') {
          drawArrowhead(ctx, startPoint, coords);
        }
        break;
      case 'horizontal':
        drawHorizontalLine(ctx, startPoint, coords);
        break;
      case 'vertical':
        drawVerticalLine(ctx, startPoint, coords);
        break;
      case 'ray':
        drawRay(ctx, startPoint, coords);
        break;
    }
  };

  const handleMouseUp = (e) => {
    if (!isDrawing || !startPoint || activeTool === 'cursor') return;

    const coords = getChartCoordinates(e);
    if (!coords) return;

    // Lưu đường vẽ vào biểu đồ
    addDrawing({
      type: activeTool,
      startPoint: {
        price: startPoint.price,
        time: startPoint.time
      },
      endPoint: {
        price: coords.price,
        time: coords.time
      },
      color: selectedColor
    });

    // Xóa canvas preview
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    setIsDrawing(false);
    setStartPoint(null);
  };

  // Các hàm vẽ
  const drawLine = (ctx, start, end) => {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  };

  const drawArrowhead = (ctx, start, end) => {
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const length = 15;
    
    ctx.beginPath();
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
    ctx.stroke();
  };

  const drawHorizontalLine = (ctx, start, end) => {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, start.y);
    ctx.stroke();
  };

  const drawVerticalLine = (ctx, start, end) => {
    ctx.beginPath();
    ctx.moveTo(start.x, 0);
    ctx.lineTo(start.x, canvasRef.current.height);
    ctx.stroke();
  };

  const drawRay = (ctx, start, end) => {
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const length = Math.max(canvasRef.current.width, canvasRef.current.height) * 2;
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(
      start.x + length * Math.cos(angle),
      start.y + length * Math.sin(angle)
    );
    ctx.stroke();
  };

  // Thêm đường vẽ mới
  const addDrawing = (drawing) => {
    const series = chartRef.current.addLineSeries({
      color: drawing.color,
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
    });

    let points = [];
    switch (drawing.type) {
      case 'line':
      case 'arrow':
        points = [
          { time: drawing.startPoint.time, value: drawing.startPoint.price },
          { time: drawing.endPoint.time, value: drawing.endPoint.price }
        ];
        break;
      case 'horizontal':
        points = [
          { time: drawing.startPoint.time, value: drawing.startPoint.price },
          { time: drawing.endPoint.time, value: drawing.startPoint.price }
        ];
        break;
      case 'vertical':
        const timeScale = chartRef.current.timeScale();
        const visibleRange = timeScale.getVisibleRange();
        points = [
          { time: drawing.startPoint.time, value: visibleRange.from },
          { time: drawing.startPoint.time, value: visibleRange.to }
        ];
        break;
      case 'ray':
        points = [
          { time: drawing.startPoint.time, value: drawing.startPoint.price },
          { time: drawing.endPoint.time, value: drawing.endPoint.price }
        ];
        // Extend the ray
        const slope = (drawing.endPoint.price - drawing.startPoint.price) / 
                     (drawing.endPoint.time - drawing.startPoint.time);
        const extendedTime = drawing.endPoint.time + (drawing.endPoint.time - drawing.startPoint.time);
        const extendedPrice = drawing.endPoint.price + slope * (extendedTime - drawing.endPoint.time);
        points.push({ time: extendedTime, value: extendedPrice });
        break;
    }

    series.setData(points);
    setDrawings([...drawings, { series, points, type: drawing.type }]);
  };

  // Xóa tất cả đường vẽ
  const clearDrawings = () => {
    drawings.forEach(drawing => {
      if (drawing.series) {
        drawing.series.remove();
      }
    });
    setDrawings([]);
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Khởi tạo biểu đồ
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
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: {
          time: true,
          price: true,
        },
        mouseWheel: true,
        pinch: true,
      },
    });

    // Thêm series nến
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Lưu reference
    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    // Cập nhật dữ liệu đã được sắp xếp
    if (data && data.length > 0) {
      const formattedData = formatAndSortData(data);
      try {
        candlestickSeries.setData(formattedData);
        // Tự động điều chỉnh tỷ lệ để hiển thị tất cả dữ liệu
        chart.timeScale().fitContent();
      } catch (error) {
        console.error('Error setting chart data:', error);
      }
    }

    // Khởi tạo canvas
    initCanvas();

    // Thêm xử lý sự kiện resize cho canvas
    const handleResize = () => {
      if (chartContainerRef.current && canvasRef.current) {
        // Cập nhật kích thước chart
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
          
          // Cập nhật kích thước canvas
        canvasRef.current.width = chartContainerRef.current.clientWidth;
        canvasRef.current.height = chartContainerRef.current.clientHeight;
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

    // Thêm xử lý sự kiện cho công cụ vẽ
    const container = chartContainerRef.current;
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', () => {
      setIsDrawing(false);
      setStartPoint(null);
    });

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseUp);
      chart.remove();
    };
  }, []);

  // Cập nhật dữ liệu khi data thay đổi
  useEffect(() => {
    if (candlestickSeriesRef.current && data && data.length > 0) {
      const formattedData = formatAndSortData(data);
      try {
        candlestickSeriesRef.current.setData(formattedData);
        // Tự động điều chỉnh tỷ lệ khi dữ liệu thay đổi
        if (chartRef.current) {
          chartRef.current.timeScale().fitContent();
        }
      } catch (error) {
        console.error('Error updating chart data:', error);
      }
    }
  }, [data]);

  // Cập nhật màu cho canvas khi thay đổi màu
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.strokeStyle = selectedColor;
    }
  }, [selectedColor]);

  return (
    <div className="relative flex h-full">
      {/* Toolbar */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#1e222d] border-r border-[#2a2e39] z-20 flex flex-col items-center py-2 shadow-lg">
        {tools.map(tool => (
          <button
            key={tool.id}
            className={`w-10 h-10 mb-1 flex items-center justify-center rounded-lg transition-all duration-200 ${
              activeTool === tool.id
                ? 'bg-[#00C9FF] bg-opacity-20 text-[#00C9FF] shadow-inner'
                : 'text-[#888] hover:bg-[#2a2e39] hover:text-white'
            }`}
            onClick={() => {
              if (tool.id === 'delete') {
                clearDrawings();
                const ctx = canvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
              } else {
                setActiveTool(tool.id);
              }
            }}
            title={tool.tooltip}
          >
            {tool.icon}
          </button>
        ))}

        <div className="mt-4 pt-4 border-t border-[#2a2e39] w-full px-2">
          {colorOptions.map(color => (
            <div
              key={color}
              className={`w-8 h-8 mb-2 mx-auto rounded-full cursor-pointer transition-all duration-200 hover:scale-110 ${
                selectedColor === color ? 'ring-2 ring-[#00C9FF] ring-offset-2 ring-offset-[#1e222d]' : ''
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
            />
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 ml-12 relative">
        <div 
          ref={chartContainerRef} 
          className="w-full h-full"
          style={{ 
            cursor: activeTool === 'cursor' ? 'default' : 'crosshair'
          }}
        />
        
        {/* Drawing Canvas Layer */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
          style={{
            pointerEvents: activeTool === 'cursor' ? 'none' : 'auto',
            opacity: activeTool === 'cursor' ? 0 : 1,
            transition: 'opacity 0.2s ease'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            if (isDrawing) {
              setIsDrawing(false);
              setStartPoint(null);
              const ctx = canvasRef.current.getContext('2d');
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
          }}
        />
      </div>
    </div>
  );
};

export default CandlestickChart; 