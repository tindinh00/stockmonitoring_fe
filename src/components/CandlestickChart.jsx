import React, { useState, useEffect, useRef } from 'react';
import ReactApexChart from 'react-apexcharts';

const CandlestickChart = ({ stockCode, data }) => {
  const [chartData, setChartData] = useState([]);
  const [chartOptions, setChartOptions] = useState({});
  const [activeTool, setActiveTool] = useState('cursor');
  const [drawingObjects, setDrawingObjects] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0, timestamp: 0, price: 0 });
  const [currentPoint, setCurrentPoint] = useState({ x: 0, y: 0, timestamp: 0, price: 0 });
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [textInputPosition, setTextInputPosition] = useState({ x: 0, y: 0 });
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });
  const [chartYAxis, setChartYAxis] = useState({ min: 0, max: 0 });
  const [chartXAxis, setChartXAxis] = useState({ min: 0, max: 0 });
  
  const canvasRef = useRef(null);
  const chartContainerRef = useRef(null);
  const textInputRef = useRef(null);

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

  useEffect(() => {
    if (!data || data.length === 0) {
      console.error('No data available for chart');
      return;
    }

    console.log('Preparing chart data for', stockCode, 'with', data.length, 'points');

    // Format data for ApexCharts
    const formattedData = data.map(item => ({
      x: new Date(item.time * 1000),
      y: [item.open, item.high, item.low, item.close]
    }));

    setChartData([{
      name: stockCode,
      data: formattedData
    }]);

    // Set chart options
    setChartOptions({
      chart: {
        type: 'candlestick',
        height: 500,
        background: '#131722',
        foreColor: '#a9a9a9',
        animations: {
          enabled: false
        },
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
          },
          autoSelected: 'zoom'
        },
        zoom: {
          enabled: true,
          type: 'xy',
          zoomedArea: {
            fill: {
              color: '#90CAF9',
              opacity: 0.4
            },
            stroke: {
              color: '#0D47A1',
              opacity: 0.4,
              width: 1
            }
          }
        },
        events: {
          mounted: (chart) => {
            console.log('Chart mounted');
            const yaxis = chart.w.globals.yAxisScale[0];
            const xaxis = chart.w.globals.xAxisScale;
            setChartYAxis({ min: yaxis.niceMin, max: yaxis.niceMax });
            setChartXAxis({ min: xaxis[0], max: xaxis[xaxis.length - 1] });
            setTimeout(initCanvas, 500);
          },
          updated: (chart) => {
            console.log('Chart updated');
            const yaxis = chart.w.globals.yAxisScale[0];
            const xaxis = chart.w.globals.xAxisScale;
            setChartYAxis({ min: yaxis.niceMin, max: yaxis.niceMax });
            setChartXAxis({ min: xaxis[0], max: xaxis[xaxis.length - 1] });
            setTimeout(initCanvas, 500);
          },
          zoomed: (chart, { xaxis, yaxis }) => {
            console.log('Chart zoomed', xaxis, yaxis);
            setChartYAxis({ min: yaxis.min, max: yaxis.max });
            setChartXAxis({ min: xaxis.min, max: xaxis.max });
            setTimeout(initCanvas, 100);
          },
          scrolled: (chart, { xaxis }) => {
            console.log('Chart scrolled', xaxis);
            setChartXAxis({ min: xaxis.min, max: xaxis.max });
            setTimeout(initCanvas, 100);
          }
        }
      },
      title: {
        text: stockCode,
        align: 'left',
        style: {
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#e4e4e4'
        }
      },
      subtitle: {
        text: 'Biểu đồ nến',
        align: 'left',
        style: {
          fontSize: '12px',
          color: '#a9a9a9'
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
            day: 'dd/MM',
            month: 'MM/yyyy'
          }
        },
        axisBorder: {
          color: '#2a2e39'
        },
        axisTicks: {
          color: '#2a2e39'
        },
        crosshairs: {
          stroke: {
            color: '#4e5b71',
            width: 1,
            dashArray: 2
          }
        }
      },
      yaxis: {
        tooltip: {
          enabled: true
        },
        labels: {
          style: {
            colors: '#a9a9a9',
            fontSize: '11px'
          },
          formatter: (value) => {
            return value.toFixed(2);
          }
        },
        crosshairs: {
          stroke: {
            color: '#4e5b71',
            width: 1,
            dashArray: 2
          }
        }
      },
      grid: {
        borderColor: '#2a2e39',
        strokeDashArray: 0,
        position: 'back',
        xaxis: {
          lines: {
            show: true
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        },
        padding: {
          top: 0,
          right: 10,
          bottom: 0,
          left: 10
        }
      },
      tooltip: {
        enabled: true,
        theme: 'dark',
        x: {
          format: 'dd MMM yyyy'
        },
        y: {
          formatter: (value) => {
            return value;
          }
        },
        style: {
          fontSize: '12px',
          fontFamily: 'Roboto, sans-serif'
        }
      },
      plotOptions: {
        candlestick: {
          colors: {
            upward: '#26a69a',
            downward: '#ef5350'
          },
          wick: {
            useFillColor: true
          },
          bar: {
            columnWidth: '60%'
          }
        }
      },
      responsive: [
        {
          breakpoint: 1000,
          options: {
            plotOptions: {
              candlestick: {
                bar: {
                  columnWidth: '70%'
                }
              }
            }
          }
        },
        {
          breakpoint: 600,
          options: {
            plotOptions: {
              candlestick: {
                bar: {
                  columnWidth: '80%'
                }
              }
            }
          }
        }
      ],
      states: {
        hover: {
          filter: {
            type: 'none'
          }
        },
        active: {
          filter: {
            type: 'none'
          }
        }
      }
    });
  }, [stockCode, data]);

  // Hàm để chuyển đổi tọa độ tuyệt đối thành tương đối (%)
  const convertToRelativeCoords = (x, y) => {
    const { width, height } = chartDimensions;
    if (width === 0 || height === 0) return { x: 0, y: 0 };
    return {
      x: x / width,
      y: y / height
    };
  };

  // Hàm để chuyển đổi tọa độ tương đối (%) thành tuyệt đối (px)
  const convertToAbsoluteCoords = (relX, relY) => {
    const { width, height } = chartDimensions;
    return {
      x: relX * width,
      y: relY * height
    };
  };

  // Khởi tạo canvas
  const initCanvas = () => {
    if (!chartContainerRef.current) {
      console.error('Chart container ref not available');
      return;
    }
    
    const chartArea = chartContainerRef.current.querySelector('.apexcharts-inner');
    if (!chartArea) {
      console.log('Chart area not found, retrying in 500ms');
      setTimeout(initCanvas, 500);
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas ref not available');
      return;
    }
    
    const rect = chartArea.getBoundingClientRect();
    console.log('Chart area dimensions:', rect.width, rect.height);
    
    canvas.width = rect.width;
    canvas.height = rect.height;
    canvas.style.left = `${chartArea.offsetLeft}px`;
    canvas.style.top = `${chartArea.offsetTop}px`;
    
    // Lưu kích thước hiện tại của chart
    setChartDimensions({ width: rect.width, height: rect.height });
    
    // Đảm bảo chartXAxis và chartYAxis được thiết lập
    if (!chartXAxis.min || !chartYAxis.min) {
      console.error('Chart axes not properly initialized, axes:', chartXAxis, chartYAxis);
    } else {
      console.log('Chart axes during init:', chartXAxis, chartYAxis);
    }
    
    // Redraw với timeout để đảm bảo state đã được cập nhật
    setTimeout(() => {
      console.log('Delayed redraw after init');
      redrawCanvas();
    }, 100);
  };

  // Vẽ lại canvas
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Vẽ các đối tượng đã lưu
    drawingObjects.forEach(obj => {
      drawObject(ctx, obj);
    });
    
    // Vẽ đối tượng đang được vẽ
    if (isDrawing) {
      const tempObj = {
        type: activeTool,
        startX: startPoint.x,
        startY: startPoint.y,
        endX: currentPoint.x,
        endY: currentPoint.y,
        color: selectedColor
      };
      drawObject(ctx, tempObj);
    }
  };

  // Chuyển đổi tọa độ canvas sang giá trị biểu đồ, đảm bảo phạm vi hợp lệ
  const canvasToChartCoords = (x, y) => {
    const canvas = canvasRef.current;
    if (!canvas) return { timestamp: 0, price: 0 };

    // Đảm bảo x, y nằm trong khoảng hợp lệ
    const xClamped = Math.max(0, Math.min(x, canvas.width));
    const yClamped = Math.max(0, Math.min(y, canvas.height));

    // Kiểm tra xem chartXAxis và chartYAxis có hợp lệ không
    if (!chartXAxis || !chartYAxis || 
        chartXAxis.min === undefined || chartXAxis.max === undefined ||
        chartYAxis.min === undefined || chartYAxis.max === undefined) {
      console.error('Invalid chart axes:', chartXAxis, chartYAxis);
      return { timestamp: 0, price: 0 };
    }

    const xRatio = (xClamped / canvas.width);
    const yRatio = (yClamped / canvas.height);
    
    const timestamp = chartXAxis.min + (chartXAxis.max - chartXAxis.min) * xRatio;
    const price = chartYAxis.max - (chartYAxis.max - chartYAxis.min) * yRatio;

    return { timestamp, price };
  };

  // Chuyển đổi giá trị biểu đồ sang tọa độ canvas, đảm bảo phạm vi hợp lệ
  const chartToCanvasCoords = (timestamp, price) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    // Kiểm tra xem chartXAxis và chartYAxis có hợp lệ không
    if (!chartXAxis || !chartYAxis || 
        chartXAxis.min === undefined || chartXAxis.max === undefined ||
        chartYAxis.min === undefined || chartYAxis.max === undefined) {
      console.error('Invalid chart axes:', chartXAxis, chartYAxis);
      return { x: 0, y: 0 };
    }

    // Đảm bảo timestamp và price nằm trong phạm vi biểu đồ
    const timestampClamped = Math.max(chartXAxis.min, Math.min(timestamp, chartXAxis.max));
    const priceClamped = Math.max(chartYAxis.min, Math.min(price, chartYAxis.max));

    const xRatio = (timestampClamped - chartXAxis.min) / (chartXAxis.max - chartXAxis.min);
    const yRatio = (chartYAxis.max - priceClamped) / (chartYAxis.max - chartYAxis.min);

    const x = canvas.width * xRatio;
    const y = canvas.height * yRatio;

    return { x, y };
  };

  // Vẽ một đối tượng
  const drawObject = (ctx, obj) => {
    ctx.strokeStyle = obj.color || '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    switch (obj.type) {
      case 'line':
        ctx.moveTo(obj.startX, obj.startY);
        ctx.lineTo(obj.endX, obj.endY);
        break;
      case 'arrow':
        drawArrow(ctx, obj.startX, obj.startY, obj.endX, obj.endY);
        return;
      case 'ray':
        ctx.moveTo(obj.startX, obj.startY);
        const angle = Math.atan2(obj.endY - obj.startY, obj.endX - obj.startX);
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        const rayEnd = {
          x: obj.startX + Math.cos(angle) * Math.max(canvasWidth, canvasHeight) * 2,
          y: obj.startY + Math.sin(angle) * Math.max(canvasWidth, canvasHeight) * 2
        };
        ctx.lineTo(rayEnd.x, rayEnd.y);
        break;
      case 'rectangle':
        ctx.rect(
          obj.startX,
          obj.startY,
          obj.endX - obj.startX,
          obj.endY - obj.startY
        );
        break;
      case 'ellipse':
        const centerX = (obj.startX + obj.endX) / 2;
        const centerY = (obj.startY + obj.endY) / 2;
        const radiusX = Math.abs(obj.endX - obj.startX) / 2;
        const radiusY = Math.abs(obj.endY - obj.startY) / 2;
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        break;
      case 'text':
        ctx.font = '14px Arial';
        ctx.fillStyle = obj.color || '#ffffff';
        ctx.fillText(obj.text || 'Văn bản', obj.startX, obj.startY);
        return;
      case 'fibonacci':
        drawFibonacci(ctx, obj.startX, obj.startY, obj.endX, obj.endY, obj.color);
        return;
      default:
        return;
    }
    
    ctx.stroke();
  };

  // Thêm hàm để kiểm tra xem đối tượng đã có đầy đủ thông tin timestamp và price chưa
  const ensureObjectHasChartCoords = (obj) => {
    if (!obj.startTimestamp || !obj.startPrice) {
      const coords = canvasToChartCoords(obj.startX, obj.startY);
      obj.startTimestamp = coords.timestamp;
      obj.startPrice = coords.price;
    }
    
    if (!obj.endTimestamp || !obj.endPrice) {
      if (obj.endX && obj.endY) {
        const coords = canvasToChartCoords(obj.endX, obj.endY);
        obj.endTimestamp = coords.timestamp;
        obj.endPrice = coords.price;
      } else {
        obj.endTimestamp = obj.startTimestamp;
        obj.endPrice = obj.startPrice;
      }
    }
    
    return obj;
  };

  // Vẽ mũi tên
  const drawArrow = (ctx, fromX, fromY, toX, toY) => {
    const headLength = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    
    // Vẽ đầu mũi tên
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
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  };

  // Vẽ Fibonacci
  const drawFibonacci = (ctx, startX, startY, endX, endY, color) => {
    const height = endY - startY;
    const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    
    // Vẽ đường chính
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // Vẽ các mức Fibonacci
    levels.forEach(level => {
      const y = startY + height * level;
      
      // Vẽ đường ngang
      ctx.beginPath();
      ctx.moveTo(startX - 50, y); // Kéo dài sang trái
      ctx.lineTo(endX + 50, y);   // Kéo dài sang phải
      ctx.stroke();
      
      // Hiển thị giá trị
      ctx.font = '12px Arial';
      ctx.fillStyle = color || '#ffffff';
      ctx.fillText(`${(level * 100).toFixed(1)}%`, startX - 70, y + 4);
    });
  };

  // Xử lý sự kiện chuột
  const handleMouseDown = (e) => {
    if (activeTool === 'cursor') return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentPoint({ x, y });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentPoint({ x, y });
    redrawCanvas();
  };

  const handleMouseUp = (e) => {
    if (!isDrawing) return;
    
    if (activeTool !== 'cursor' && activeTool !== 'delete') {
      if (activeTool === 'text') {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        setTextInputPosition({ x, y });
        setShowTextInput(true);
        setTimeout(() => {
          if (textInputRef.current) {
            textInputRef.current.focus();
          }
        }, 100);
      } else {
        const newObject = {
          type: activeTool,
          startX: startPoint.x,
          startY: startPoint.y,
          endX: currentPoint.x,
          endY: currentPoint.y,
          color: selectedColor
        };
        
        setDrawingObjects([...drawingObjects, newObject]);
      }
    }
    
    setIsDrawing(false);
  };

  // Xử lý khi nhập text
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
    if (textInputValue.trim() !== '') {
      const newTextObject = {
        type: 'text',
        startX: textInputPosition.x,
        startY: textInputPosition.y,
        text: textInputValue,
        color: selectedColor
      };
      
      setDrawingObjects([...drawingObjects, newTextObject]);
      setShowTextInput(false);
      setTextInputValue('');
    } else {
      setShowTextInput(false);
    }
  };

  // Xử lý khi click vào công cụ
  const handleToolClick = (toolId) => {
    if (toolId === 'delete') {
      // Xóa tất cả các đối tượng vẽ
      setDrawingObjects([]);
      redrawCanvas();
    } else {
      setActiveTool(toolId);
    }
  };

  // Cập nhật useEffect để vẽ lại khi các trạng thái zoom thay đổi
  useEffect(() => {
    redrawCanvas();
  }, [chartXAxis, chartYAxis]);

  // Lưu trữ các đối tượng vẽ vào localStorage
  const saveDrawings = () => {
    try {
      // Chuyển đổi tất cả các tọa độ thành tương đối trước khi lưu
      const relativeObjects = drawingObjects.map(obj => {
        const relObj = { ...obj };
        if (obj.type === 'text') {
          const { x, y } = convertToRelativeCoords(obj.startX, obj.startY);
          relObj.relStartX = x;
          relObj.relStartY = y;
        } else {
          const startRel = convertToRelativeCoords(obj.startX, obj.startY);
          const endRel = convertToRelativeCoords(obj.endX, obj.endY);
          relObj.relStartX = startRel.x;
          relObj.relStartY = startRel.y;
          relObj.relEndX = endRel.x;
          relObj.relEndY = endRel.y;
        }
        return relObj;
      });
      
      // Lưu theo mã cổ phiếu
      localStorage.setItem(`chart_drawings_${stockCode}`, JSON.stringify(relativeObjects));
      console.log(`Saved ${relativeObjects.length} drawing objects for ${stockCode}`);
    } catch (error) {
      console.error('Error saving drawings:', error);
    }
  };

  // Tải các đối tượng vẽ từ localStorage
  const loadDrawings = () => {
    try {
      const savedDrawings = localStorage.getItem(`chart_drawings_${stockCode}`);
      if (savedDrawings) {
        const parsedDrawings = JSON.parse(savedDrawings);
        
        // Chuyển đổi tọa độ tương đối thành tuyệt đối dựa trên kích thước hiện tại
        const absoluteObjects = parsedDrawings.map(obj => {
          const absObj = { ...obj };
          if (obj.type === 'text') {
            const { x, y } = convertToAbsoluteCoords(obj.relStartX, obj.relStartY);
            absObj.startX = x;
            absObj.startY = y;
          } else {
            const startAbs = convertToAbsoluteCoords(obj.relStartX, obj.relStartY);
            const endAbs = convertToAbsoluteCoords(obj.relEndX, obj.relEndY);
            absObj.startX = startAbs.x;
            absObj.startY = startAbs.y;
            absObj.endX = endAbs.x;
            absObj.endY = endAbs.y;
          }
          return absObj;
        });
        
        setDrawingObjects(absoluteObjects);
        console.log(`Loaded ${absoluteObjects.length} drawing objects for ${stockCode}`);
        return absoluteObjects;
      }
    } catch (error) {
      console.error('Error loading drawings:', error);
    }
    return [];
  };

  // Theo dõi thay đổi drawingObjects
  useEffect(() => {
    console.log('DrawingObjects changed, count:', drawingObjects.length);
    drawingObjects.forEach((obj, i) => {
      console.log(`Object ${i}: ${obj.type}, ${obj.startTimestamp}, ${obj.startPrice}`);
    });
    redrawCanvas();
    saveDrawings();
  }, [drawingObjects]);

  // Theo dõi thay đổi stockCode để tải drawings khi mã chứng khoán thay đổi
  useEffect(() => {
    if (stockCode && chartDimensions.width > 0) {
      loadDrawings();
    }
  }, [stockCode, chartDimensions.width]);

  // Danh sách các công cụ cho thanh bên trái
  const toolbarItems = [
    { id: 'cursor', icon: '⊕', tooltip: 'Con trỏ' },
    { id: 'crosshair', icon: '⌖', tooltip: 'Đường chữ thập' },
    { id: 'line', icon: '—', tooltip: 'Đường thẳng' },
    { id: 'arrow', icon: '↗', tooltip: 'Mũi tên' },
    { id: 'ray', icon: '→', tooltip: 'Tia' },
    { id: 'rectangle', icon: '□', tooltip: 'Hình chữ nhật' },
    { id: 'ellipse', icon: '○', tooltip: 'Hình elip' },
    { id: 'fibonacci', icon: 'Ⓕ', tooltip: 'Fibonacci' },
    { id: 'text', icon: 'T', tooltip: 'Văn bản' },
    { id: 'delete', icon: '🗑', tooltip: 'Xóa' },
    { id: 'settings', icon: '⚙', tooltip: 'Cài đặt' },
  ];

  // Xử lý khi chart được resize
  useEffect(() => {
    const handleResize = () => {
      if (chartContainerRef.current && canvasRef.current) {
        const chartArea = chartContainerRef.current.querySelector('.apexcharts-inner');
        if (chartArea) {
          const rect = chartArea.getBoundingClientRect();
          
          // Cập nhật kích thước canvas
          canvasRef.current.width = rect.width;
          canvasRef.current.height = rect.height;
          canvasRef.current.style.left = `${chartArea.offsetLeft}px`;
          canvasRef.current.style.top = `${chartArea.offsetTop}px`;
          
          // Cập nhật kích thước chart trong state
          setChartDimensions({ width: rect.width, height: rect.height });
          
          // Redraw canvas với kích thước mới
          setTimeout(() => redrawCanvas(), 100);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Khởi tạo canvas khi component đã load
  useEffect(() => {
    if (chartData.length > 0) {
      // Đợi một chút để chart được render hoàn chỉnh
      setTimeout(() => {
        initCanvas();
        console.log('Initial canvas setup after chart data loaded');
      }, 500);
    }
  }, [chartData]);

  // Cập nhật options của chart
  useEffect(() => {
    if (chartOptions.chart && chartOptions.chart.events) {
      // Đảm bảo các sự kiện chart được thiết lập đúng
      const updatedOptions = {
        ...chartOptions,
        chart: {
          ...chartOptions.chart,
          events: {
            ...chartOptions.chart.events,
            beforeZoom: (chart, { xaxis }) => {
              console.log('Before zoom event:', xaxis);
              return { xaxis };
            },
            beforeResetZoom: (chart) => {
              console.log('Before reset zoom event');
            }
          }
        }
      };
      setChartOptions(updatedOptions);
    }
  }, []);

  return (
    <div className="candlestick-chart-container" style={{ 
      position: 'relative', 
      display: 'flex',
      height: '500px',
      backgroundColor: '#131722'
    }}>
      {/* Thanh công cụ bên trái */}
      <div className="chart-toolbar-left" style={{
        width: '40px',
        backgroundColor: '#1e222d',
        borderRight: '1px solid #2a2e39',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 0'
      }}>
        {toolbarItems.map(tool => (
          <div 
            key={tool.id}
            className={`toolbar-item ${activeTool === tool.id ? 'active' : ''}`}
            title={tool.tooltip}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activeTool === tool.id ? '#00C9FF' : '#a9a9a9',
              fontSize: '16px',
              cursor: 'pointer',
              margin: '2px 0',
              borderRadius: '4px',
              backgroundColor: activeTool === tool.id ? '#2a2e39' : 'transparent',
              transition: 'background-color 0.2s, color 0.2s'
            }}
            onClick={() => handleToolClick(tool.id)}
            onMouseOver={(e) => {
              if (activeTool !== tool.id) {
                e.currentTarget.style.backgroundColor = '#2a2e39';
              }
            }}
            onMouseOut={(e) => {
              if (activeTool !== tool.id) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {tool.icon}
          </div>
        ))}

        {/* Bảng chọn màu */}
        <div style={{
          marginTop: '10px',
          width: '32px',
          borderTop: '1px solid #2a2e39',
          paddingTop: '10px'
        }}>
          {colorOptions.map(color => (
            <div
              key={color}
              title="Chọn màu"
              style={{
                width: '20px',
                height: '20px',
                backgroundColor: color,
                margin: '4px auto',
                borderRadius: '50%',
                cursor: 'pointer',
                border: selectedColor === color ? '2px solid #00C9FF' : '1px solid #2a2e39'
              }}
              onClick={() => setSelectedColor(color)}
            />
          ))}
        </div>
      </div>

      {/* Biểu đồ chính */}
      <div ref={chartContainerRef} style={{ flex: 1, position: 'relative' }}>
        {chartData.length > 0 ? (
          <ReactApexChart 
            options={chartOptions} 
            series={chartData} 
            type="candlestick" 
            height="100%" 
            width="100%"
          />
        ) : (
          <div style={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#a9a9a9',
            backgroundColor: '#131722',
            fontSize: '14px'
          }}>
            Đang tải biểu đồ...
          </div>
        )}
        
        {/* Canvas để vẽ */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: activeTool === 'cursor' ? 'none' : 'auto',
            cursor: activeTool === 'cursor' ? 'default' : 'crosshair',
            zIndex: 10
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* Input nhập text */}
        {showTextInput && (
          <div
            style={{
              position: 'absolute',
              left: `${textInputPosition.x}px`,
              top: `${textInputPosition.y - 30}px`,
              zIndex: 20
            }}
          >
            <div style={{
              display: 'flex',
              backgroundColor: '#1e222d',
              border: '1px solid #2a2e39',
              borderRadius: '4px',
              padding: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}>
              <input
                ref={textInputRef}
                type="text"
                value={textInputValue}
                onChange={handleTextInputChange}
                onKeyDown={handleTextInputKeyDown}
                placeholder="Nhập văn bản..."
                style={{
                  backgroundColor: '#131722',
                  color: selectedColor,
                  border: 'none',
                  padding: '4px 8px',
                  outline: 'none',
                  borderRadius: '2px',
                  width: '200px',
                  fontSize: '14px'
                }}
              />
              <button
                onClick={addTextObject}
                style={{
                  backgroundColor: '#00C9FF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '2px',
                  padding: '0 8px',
                  marginLeft: '4px',
                  cursor: 'pointer'
                }}
              >
                OK
              </button>
            </div>
          </div>
        )}
        
        <div style={{ 
          position: 'absolute', 
          bottom: '5px', 
          right: '5px', 
          fontSize: '10px', 
          color: '#a9a9a9',
          opacity: 0.7
        }}>
          FE Stock Monitoring
        </div>
      </div>
    </div>
  );
};

export default CandlestickChart; 