import React, { useEffect, useRef, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Định nghĩa các công cụ cho thanh bên trái
const leftToolbarItems = [
  { id: 'cursor', icon: '⊕', tooltip: 'Con trỏ' },
  { id: 'line', icon: '—', tooltip: 'Đường thẳng' },
  { id: 'horizontal', icon: '―', tooltip: 'Đường ngang' },
  { id: 'vertical', icon: '|', tooltip: 'Đường dọc' },
  { id: 'arrow', icon: '↗', tooltip: 'Mũi tên' },
  { id: 'text', icon: 'T', tooltip: 'Chữ' },
  { id: 'eraser', icon: '⌫', tooltip: 'Xóa' }
];

const TradingViewChart = ({ data: externalData, symbol }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [chartData, setChartData] = useState([]);
  const [chartOptions, setChartOptions] = useState({});
  const [selectedTool, setSelectedTool] = useState('cursor');
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [drawings, setDrawings] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [currentPos, setCurrentPos] = useState(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [textInputPosition, setTextInputPosition] = useState({ x: 0, y: 0 });
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });
  const [chartYAxis, setChartYAxis] = useState({ min: 0, max: 0 });
  const [chartXAxis, setChartXAxis] = useState({ min: 0, max: 0 });

  // Màu sắc
  const colors = ['#ffffff', '#00ff00', '#ff0000', '#0000ff', '#ffff00'];

  useEffect(() => {
    if (!externalData || externalData.length === 0) {
      console.log('No data available for chart');
      return;
    }

    console.log('Chart data:', externalData);

    // Format data for ApexCharts
    const formattedData = externalData.map(item => ({
      x: new Date(item.time * 1000),
      y: [item.open, item.high, item.low, item.close]
    }));

    const volumeData = externalData.map(item => ({
      x: new Date(item.time * 1000),
      y: item.volume
    }));

    setChartData([
      {
        name: 'Giá',
        type: 'candlestick',
        data: formattedData
      },
      {
        name: 'Khối lượng',
        type: 'bar',
        data: volumeData
      }
    ]);

    setChartOptions({
      chart: {
        type: 'candlestick',
        height: 600,
        background: '#131722',
        foreColor: '#a9a9a9',
        animations: { enabled: false },
        toolbar: {
          show: true,
          tools: {
            download: false,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          }
        },
        zoom: {
          enabled: true,
          type: 'xy'
        },
        events: {
          mounted: function() {
            console.log('Chart mounted');
            setTimeout(initCanvas, 100);
          },
          updated: function() {
            console.log('Chart updated');
            setTimeout(initCanvas, 100);
          }
        }
      },
      title: {
        text: symbol,
        align: 'left',
        style: {
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#e4e4e4'
        }
      },
      xaxis: {
        type: 'datetime',
        labels: {
          style: {
            colors: '#a9a9a9',
            fontSize: '11px'
          },
          datetimeFormatter: {
            year: 'yyyy',
            month: 'MM/yyyy',
            day: 'dd/MM',
            hour: 'HH:mm'
          }
        },
        axisBorder: {
          color: '#2a2e39'
        },
        axisTicks: {
          color: '#2a2e39'
        }
      },
      yaxis: [
        {
          title: {
            text: 'Giá',
            style: {
              color: '#a9a9a9'
            }
          },
          labels: {
            style: {
              colors: '#a9a9a9',
              fontSize: '11px'
            },
            formatter: (value) => value.toFixed(2)
          },
          axisBorder: {
            color: '#2a2e39'
          },
          axisTicks: {
            color: '#2a2e39'
          }
        },
        {
          opposite: true,
          title: {
            text: 'Khối lượng',
            style: {
              color: '#a9a9a9'
            }
          },
          labels: {
            style: {
              colors: '#a9a9a9',
              fontSize: '11px'
            },
            formatter: (value) => {
              if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
              if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
              return value;
            }
          }
        }
      ],
      grid: {
        borderColor: '#2a2e39',
        strokeDashArray: 0
      },
      plotOptions: {
        candlestick: {
          colors: {
            upward: '#26a69a',
            downward: '#ef5350'
          },
          wick: {
            useFillColor: true
          }
        },
        bar: {
          colors: {
            ranges: [{
              from: -1000000,
              to: 0,
              color: '#ef5350'
            }, {
              from: 0,
              to: 1000000,
              color: '#26a69a'
            }]
          }
        }
      }
    });
  }, [externalData, symbol]);

  // Khởi tạo canvas
  const initCanvas = () => {
    if (!containerRef.current) return;
    
    const chartArea = containerRef.current.querySelector('.apexcharts-inner');
    if (!chartArea) {
      console.log('Chart area not found, retrying in 100ms');
      setTimeout(initCanvas, 100);
      return;
    }
    
    // Remove old canvas if exists
    const oldCanvas = canvasRef.current;
    if (oldCanvas) {
      oldCanvas.remove();
    }
    
    // Create new canvas
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '2';
    canvas.style.pointerEvents = selectedTool === 'cursor' ? 'none' : 'auto';
    
    const rect = chartArea.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    chartArea.appendChild(canvas);
    canvasRef.current = canvas;
    
    // Add event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    
    setChartDimensions({ width: rect.width, height: rect.height });
    console.log('Canvas initialized with dimensions:', rect.width, 'x', rect.height);
    
    // Initial redraw
    redrawCanvas();
  };

  // Vẽ lại canvas
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Vẽ các đối tượng đã lưu
    drawings.forEach(obj => {
      drawObject(ctx, obj);
    });
    
    // Vẽ đối tượng đang được vẽ
    if (isDrawing && startPos && currentPos) {
      const tempObj = {
        type: selectedTool,
        startX: startPos.x,
        startY: startPos.y,
        endX: currentPos.x,
        endY: currentPos.y,
        color: selectedColor
      };
      drawObject(ctx, tempObj);
    }
  };

  // Vẽ một đối tượng
  const drawObject = (ctx, obj) => {
    ctx.strokeStyle = obj.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    switch (obj.type) {
      case 'line':
        ctx.moveTo(obj.startX, obj.startY);
        ctx.lineTo(obj.endX, obj.endY);
        ctx.stroke();
        break;
        
      case 'horizontal':
        ctx.moveTo(0, obj.startY);
        ctx.lineTo(ctx.canvas.width, obj.startY);
        ctx.stroke();
        break;
        
      case 'vertical':
        ctx.moveTo(obj.startX, 0);
        ctx.lineTo(obj.startX, ctx.canvas.height);
        ctx.stroke();
        break;
        
      case 'arrow':
        drawArrow(ctx, obj.startX, obj.startY, obj.endX, obj.endY);
        break;
        
      case 'text':
        ctx.font = '14px Arial';
        ctx.fillStyle = obj.color;
        ctx.fillText(obj.text || '', obj.startX, obj.startY);
        break;
    }
  };

  // Vẽ mũi tên
  const drawArrow = (ctx, fromX, fromY, toX, toY) => {
    const headLength = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.fillStyle = selectedColor;
    ctx.fill();
  };

  // Xử lý sự kiện chuột
  const handleMouseDown = (e) => {
    if (selectedTool === 'cursor') return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentPos({ x, y });
    
    console.log('Mouse down at:', x, y);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentPos({ x, y });
    redrawCanvas();
    
    console.log('Mouse move to:', x, y);
  };

  const handleMouseUp = (e) => {
    if (!isDrawing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectedTool === 'text') {
      setTextInputPosition({ x, y });
      setShowTextInput(true);
    } else {
      const newDrawing = {
        type: selectedTool,
        startX: startPos.x,
        startY: startPos.y,
        endX: x,
        endY: y,
        color: selectedColor
      };
      setDrawings(prev => [...prev, newDrawing]);
      console.log('Added new drawing:', newDrawing);
    }

    setIsDrawing(false);
    setStartPos(null);
    setCurrentPos(null);
  };

  // Xử lý công cụ
  const handleToolClick = (toolId) => {
    console.log('Selected tool:', toolId);
    setSelectedTool(toolId);

    if (toolId === 'eraser') {
      setDrawings([]);
    }

    if (canvasRef.current) {
      canvasRef.current.style.pointerEvents = toolId === 'cursor' ? 'none' : 'auto';
    }
  };

  // Xử lý text input
  const handleTextInputChange = (e) => {
    setTextInputValue(e.target.value);
  };

  const handleTextInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      addTextObject();
    } else if (e.key === 'Escape') {
      setShowTextInput(false);
      setTextInputValue('');
    }
  };

  const addTextObject = () => {
    if (textInputValue.trim()) {
      const newDrawing = {
        type: 'text',
        startX: textInputPosition.x,
        startY: textInputPosition.y,
        text: textInputValue,
        color: selectedColor
      };
      setDrawings(prev => [...prev, newDrawing]);
      setShowTextInput(false);
      setTextInputValue('');
    }
  };

  // Redraw khi drawings thay đổi
  useEffect(() => {
    redrawCanvas();
  }, [drawings]);

  // Xử lý resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setTimeout(initCanvas, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-[600px] bg-[#131722]">
      {/* Toolbar */}
      <div className="w-10 bg-[#1e222d] border-r border-[#2a2e39] flex flex-col p-2 gap-1">
        {leftToolbarItems.map(item => (
          <button
            key={item.id}
            className={`w-8 h-8 flex items-center justify-center rounded
              ${selectedTool === item.id ? 'bg-[#2a2e39] text-[#00c9ff]' : 'text-[#758696]'}
              hover:bg-[#2a2e39] hover:text-[#d1d4dc]`}
            onClick={() => handleToolClick(item.id)}
            title={item.tooltip}
          >
            {item.icon}
          </button>
        ))}

        <div className="mt-4 pt-4 border-t border-[#2a2e39]">
          {colors.map(color => (
            <div
              key={color}
              className={`w-5 h-5 mx-auto mb-1 rounded-full cursor-pointer
                ${selectedColor === color ? 'ring-2 ring-[#00c9ff]' : 'ring-1 ring-[#2a2e39]'}`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
            />
          ))}
        </div>
      </div>

      {/* Chart */}
      <div 
        ref={containerRef}
        className="flex-1 relative"
      >
        {chartData.length > 0 ? (
          <ReactApexChart
            options={chartOptions}
            series={chartData}
            type="candlestick"
            height="100%"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-[#a9a9a9]">
            Đang tải biểu đồ...
          </div>
        )}

        {/* Text Input */}
        {showTextInput && (
          <div
            style={{
              position: 'absolute',
              left: `${textInputPosition.x}px`,
              top: `${textInputPosition.y - 30}px`,
              zIndex: 20
            }}
          >
            <div className="flex bg-[#1e222d] border border-[#2a2e39] rounded p-1">
              <input
                type="text"
                value={textInputValue}
                onChange={handleTextInputChange}
                onKeyDown={handleTextInputKeyDown}
                placeholder="Nhập văn bản..."
                className="bg-[#131722] text-white border-none p-1 outline-none rounded w-[200px]"
                autoFocus
              />
              <button
                onClick={addTextObject}
                className="bg-[#00C9FF] text-white border-none rounded px-2 ml-1 cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingViewChart;