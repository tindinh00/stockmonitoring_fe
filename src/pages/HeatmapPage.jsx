import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from "sonner";

const HeatmapPage = () => {
  const [activeTab, setActiveTab] = useState('market');
  const [activeSubTab, setActiveSubTab] = useState('price');

  const tabs = [
    { id: 'market', label: 'Toàn thị trường' },
    { id: 'hose', label: 'HOSE' },
    { id: 'hnx', label: 'HNX' }
  ];

  const subTabs = [
    { id: 'price', label: 'Giá trị' },
    { id: 'volume', label: 'Khối lượng' },
    { id: 'marketcap', label: 'Vốn hóa' },
    { id: 'foreignBuyValue', label: 'GTNN Mua' },
    { id: 'foreignSellValue', label: 'GTNN Bán' },
    { id: 'foreignBuyVolume', label: 'KLNN Mua' },
    { id: 'foreignSellVolume', label: 'KLNN Bán' }
  ];

  // Hàm tính màu dựa trên phần trăm thay đổi
  const getColorByChange = (change) => {
    const absChange = Math.abs(change);
    if (change === -6.91) return 'bg-[#00B4D8]'; // Special case for ORS
    
    if (change > 0) {
      if (absChange >= 5) return 'bg-[#1a9647]';
      if (absChange >= 3) return 'bg-[#20b454]';
      if (absChange >= 1) return 'bg-[#26A65B]';
      return 'bg-[#2dc76c]';
    }
    
    if (change < 0) {
      if (absChange >= 5) return 'bg-[#a60a28]';
      if (absChange >= 3) return 'bg-[#b60b2c]';
      if (absChange >= 1) return 'bg-[#C60C30]';
      return 'bg-[#d60e34]';
    }
    
    return 'bg-[#F0B90B]';
  };

  // Hàm tính kích thước ô dựa trên phần trăm thay đổi
  const getTileSize = (change, isVN30 = false) => {
    const absChange = Math.abs(change);
    let baseClasses = 'flex flex-col items-center justify-center p-1';
    
    if (isVN30) {
      baseClasses += ' col-span-2 row-span-2';
      if (absChange >= 5) return `${baseClasses} text-2xl`;
      if (absChange >= 3) return `${baseClasses} text-xl`;
      return `${baseClasses} text-lg`;
    }
    
    if (absChange >= 5) return `${baseClasses} text-xl`;
    if (absChange >= 3) return `${baseClasses} text-lg`;
    if (absChange >= 1) return `${baseClasses} text-base`;
    return `${baseClasses} text-sm`;
  };

  // Hàm format phần trăm thay đổi
  const formatChange = (change) => {
    if (change > 0) return `+${change.toFixed(2)}%`;
    return `${change.toFixed(2)}%`;
  };

  return (
    <div className="bg-[#0a0a14] h-[calc(100vh-132px)] flex flex-col">
      {/* Tab Menu */}
      <div className="border-b border-[#1C1C28] shrink-0">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`px-4 py-1.5 text-sm ${
                activeTab === tab.id 
                  ? 'text-white border-b-2 border-[#26A65B]' 
                  : 'text-[#808191] hover:text-white'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sub Menu */}
      <div className="border-b border-[#1C1C28] bg-[#0E0E15] px-2 shrink-0">
        <div className="flex items-center h-6">
          {subTabs.map(tab => (
            <button
              key={tab.id}
              className={`px-3 text-xs ${
                activeSubTab === tab.id
                  ? 'text-white bg-[#1C1C28] rounded'
                  : 'text-[#808191] hover:text-white'
              }`}
              onClick={() => setActiveSubTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap Content */}
      <div className="flex-1 min-h-0 p-1">
        <div className="h-full grid grid-cols-12 gap-[1px]">
          {/* Ngân hàng */}
          <div className="col-span-3 grid grid-rows-[auto_1fr] min-h-0">
            <div className="text-xs text-left text-white mb-[1px]">Ngân hàng</div>
            <div className="grid grid-cols-3 gap-[1px] min-h-0">
              <div className={`${getColorByChange(0)} ${getTileSize(0)}`}>
                <div className="font-medium">SHB</div>
                <div className="text-xs">0.00%</div>
              </div>
              <div className={`${getColorByChange(-2.30)} ${getTileSize(-2.30)}`}>
                <div className="text-white font-medium">TPB</div>
                <div className="text-white text-xs">-2.30%</div>
              </div>
              <div className={`${getColorByChange(0.21)} ${getTileSize(0.21)}`}>
                <div className="text-white font-medium">MBB</div>
                <div className="text-white text-xs">+0.21%</div>
              </div>
              <div className={`${getColorByChange(-0.96)} ${getTileSize(-0.96)}`}>
                <div className="text-white font-medium">CTG</div>
                <div className="text-white text-xs">-0.96%</div>
              </div>
              <div className={`${getColorByChange(-0.51)} ${getTileSize(-0.51)}`}>
                <div className="text-white font-medium">STB</div>
                <div className="text-white text-xs">-0.51%</div>
              </div>
              <div className={`${getColorByChange(-0.43)} ${getTileSize(-0.43)}`}>
                <div className="text-white font-medium">HDB</div>
                <div className="text-white text-xs">-0.43%</div>
              </div>
              <div className={`${getColorByChange(-0.51)} ${getTileSize(-0.51)}`}>
                <div className="text-white font-medium">VPB</div>
                <div className="text-white text-xs">-0.51%</div>
              </div>
              <div className={`${getColorByChange(0.18)} ${getTileSize(0.18)}`}>
                <div className="text-white font-medium">TCB</div>
                <div className="text-white text-xs">+0.18%</div>
              </div>
              <div className={`${getColorByChange(1.25)} ${getTileSize(1.25)}`}>
                <div className="text-white font-medium">EIB</div>
                <div className="text-white text-xs">+1.25%</div>
              </div>
              <div className={`${getColorByChange(1.15)} ${getTileSize(1.15)}`}>
                <div className="text-white font-medium">ACB</div>
                <div className="text-white text-xs">+1.15%</div>
              </div>
              <div className={`${getColorByChange(-0.35)} ${getTileSize(-0.35)}`}>
                <div className="text-white font-medium">BID</div>
                <div className="text-white text-xs">-0.35%</div>
              </div>
              <div className={`${getColorByChange(0.75)} ${getTileSize(0.75)}`}>
                <div className="text-white font-medium">VIB</div>
                <div className="text-white text-xs">+0.75%</div>
              </div>
            </div>
          </div>

          {/* Bất động sản */}
          <div className="col-span-3 grid grid-rows-[auto_1fr] min-h-0">
            <div className="text-xs text-left text-white mb-[1px]">Bất động sản</div>
            <div className="grid grid-cols-3 gap-[1px] min-h-0">
              <div className={`${getColorByChange(2.11)} ${getTileSize(2.11, true)}`}>
                <div className="font-medium">VHM</div>
                <div className="text-sm">+2.11%</div>
              </div>
              <div className={`${getColorByChange(1.40)} ${getTileSize(1.40)}`}>
                <div className="font-medium">VPI</div>
                <div className="text-sm">+1.40%</div>
              </div>
              <div className={`${getColorByChange(-0.49)} ${getTileSize(-0.49)}`}>
                <div className="font-medium">DIG</div>
                <div className="text-sm">-0.49%</div>
              </div>
              <div className={`${getColorByChange(1.17)} ${getTileSize(1.17, true)}`}>
                <div className="font-medium">VIC</div>
                <div className="text-sm">+1.17%</div>
              </div>
              <div className={`${getColorByChange(0)} ${getTileSize(0)}`}>
                <div className="font-medium">HDC</div>
                <div className="text-sm">0.00%</div>
              </div>
              <div className={`${getColorByChange(0.87)} ${getTileSize(0.87)}`}>
                <div className="font-medium">TCH</div>
                <div className="text-sm">+0.87%</div>
              </div>
              <div className={`${getColorByChange(0.60)} ${getTileSize(0.60)}`}>
                <div className="font-medium">DXG</div>
                <div className="text-sm">+0.60%</div>
              </div>
              <div className={`${getColorByChange(1.20)} ${getTileSize(1.20)}`}>
                <div className="font-medium">NLG</div>
                <div className="text-sm">+1.20%</div>
              </div>
              <div className={`${getColorByChange(-0.80)} ${getTileSize(-0.80)}`}>
                <div className="font-medium">KDH</div>
                <div className="text-sm">-0.80%</div>
              </div>
              <div className={`${getColorByChange(0.95)} ${getTileSize(0.95)}`}>
                <div className="font-medium">PDR</div>
                <div className="text-sm">+0.95%</div>
              </div>
              <div className={`${getColorByChange(-0.65)} ${getTileSize(-0.65)}`}>
                <div className="font-medium">NVL</div>
                <div className="text-sm">-0.65%</div>
              </div>
              <div className={`${getColorByChange(0.45)} ${getTileSize(0.45)}`}>
                <div className="font-medium">CRE</div>
                <div className="text-sm">+0.45%</div>
              </div>
            </div>
          </div>

          {/* Dịch vụ tài chính */}
          <div className="col-span-2 grid grid-rows-[auto_1fr] min-h-0">
            <div className="text-xs text-left text-white mb-[1px]">Dịch vụ tài chính</div>
            <div className="grid grid-cols-2 gap-[1px] min-h-0">
              <div className={`${getColorByChange(1.98)} ${getTileSize(1.98, true)}`}>
                <div className="font-medium">VND</div>
                <div className="text-sm">+1.98%</div>
              </div>
              <div className={`${getColorByChange(0.94)} ${getTileSize(0.94, true)}`}>
                <div className="font-medium">SSI</div>
                <div className="text-sm">+0.94%</div>
              </div>
              <div className={`${getColorByChange(0.64)} ${getTileSize(0.64)}`}>
                <div className="font-medium">VCI</div>
                <div className="text-sm">+0.64%</div>
              </div>
              <div className={`${getColorByChange(-6.91)} ${getTileSize(-6.91)}`}>
                <div className="font-medium">ORS</div>
                <div className="text-sm">-6.91%</div>
              </div>
              <div className={`${getColorByChange(-0.16)} ${getTileSize(-0.16)}`}>
                <div className="font-medium">HCM</div>
                <div className="text-sm">-0.16%</div>
              </div>
              <div className={`${getColorByChange(0.85)} ${getTileSize(0.85)}`}>
                <div className="font-medium">MBS</div>
                <div className="text-sm">+0.85%</div>
              </div>
              <div className={`${getColorByChange(-0.45)} ${getTileSize(-0.45)}`}>
                <div className="font-medium">SHS</div>
                <div className="text-sm">-0.45%</div>
              </div>
              <div className={`${getColorByChange(0.55)} ${getTileSize(0.55)}`}>
                <div className="font-medium">AGR</div>
                <div className="text-sm">+0.55%</div>
              </div>
            </div>
          </div>

          {/* Công nghệ */}
          <div className="col-span-2 grid grid-rows-[auto_1fr] min-h-0">
            <div className="text-xs text-left text-white mb-[1px]">Công nghệ</div>
            <div className="grid grid-cols-2 gap-[1px] min-h-0">
              <div className={`${getColorByChange(2.48)} ${getTileSize(2.48, true)}`}>
                <div className="font-medium">FPT</div>
                <div className="text-sm">+2.48%</div>
              </div>
              <div className={`${getColorByChange(1.25)} ${getTileSize(1.25)}`}>
                <div className="font-medium">CMG</div>
                <div className="text-sm">+1.25%</div>
              </div>
              <div className={`${getColorByChange(-0.35)} ${getTileSize(-0.35)}`}>
                <div className="font-medium">ELC</div>
                <div className="text-sm">-0.35%</div>
              </div>
              <div className={`${getColorByChange(0.85)} ${getTileSize(0.85)}`}>
                <div className="font-medium">SGT</div>
                <div className="text-sm">+0.85%</div>
              </div>
            </div>
          </div>

          {/* Thực phẩm & Đồ uống */}
          <div className="col-span-2 grid grid-rows-[auto_1fr] min-h-0">
            <div className="text-xs text-left text-white mb-[1px]">Thực phẩm & Đồ uống</div>
            <div className="grid grid-cols-2 gap-[1px] min-h-0">
              <div className={`${getColorByChange(-0.58)} ${getTileSize(-0.58, true)}`}>
                <div className="font-medium">MSN</div>
                <div className="text-sm">-0.58%</div>
              </div>
              <div className={`${getColorByChange(-0.49)} ${getTileSize(-0.49, true)}`}>
                <div className="font-medium">VNM</div>
                <div className="text-sm">-0.49%</div>
              </div>
              <div className={`${getColorByChange(-0.45)} ${getTileSize(-0.45)}`}>
                <div className="font-medium">SAB</div>
                <div className="text-sm">-0.45%</div>
              </div>
              <div className={`${getColorByChange(0.75)} ${getTileSize(0.75)}`}>
                <div className="font-medium">MCH</div>
                <div className="text-sm">+0.75%</div>
              </div>
              <div className={`${getColorByChange(-0.25)} ${getTileSize(-0.25)}`}>
                <div className="font-medium">KDC</div>
                <div className="text-sm">-0.25%</div>
              </div>
              <div className={`${getColorByChange(0.65)} ${getTileSize(0.65)}`}>
                <div className="font-medium">QNS</div>
                <div className="text-sm">+0.65%</div>
              </div>
            </div>
          </div>

          {/* Tài nguyên */}
          <div className="col-span-2 grid grid-rows-[auto_1fr] min-h-0">
            <div className="text-xs text-left text-white mb-[1px]">Tài nguyên</div>
            <div className="grid grid-cols-2 gap-[1px] min-h-0">
              <div className={`${getColorByChange(0.18)} ${getTileSize(0.18, true)}`}>
                <div className="font-medium">HPG</div>
                <div className="text-sm">+0.18%</div>
              </div>
              <div className={`${getColorByChange(1.15)} ${getTileSize(1.15)}`}>
                <div className="font-medium">PVD</div>
                <div className="text-sm">+1.15%</div>
              </div>
              <div className={`${getColorByChange(-0.45)} ${getTileSize(-0.45)}`}>
                <div className="font-medium">KSB</div>
                <div className="text-sm">-0.45%</div>
              </div>
              <div className={`${getColorByChange(0.85)} ${getTileSize(0.85)}`}>
                <div className="font-medium">DHC</div>
                <div className="text-sm">+0.85%</div>
              </div>
            </div>
          </div>

          {/* Xây dựng & Vật liệu */}
          <div className="col-span-2 grid grid-rows-[auto_1fr] min-h-0">
            <div className="text-xs text-left text-white mb-[1px]">Xây dựng & Vật liệu</div>
            <div className="grid grid-cols-2 gap-[1px] min-h-0">
              <div className={`${getColorByChange(0.48)} ${getTileSize(0.48)}`}>
                <div className="font-medium">VCG</div>
                <div className="text-sm">+0.48%</div>
              </div>
              <div className={`${getColorByChange(0.52)} ${getTileSize(0.52)}`}>
                <div className="font-medium">CTD</div>
                <div className="text-sm">+0.52%</div>
              </div>
              <div className={`${getColorByChange(-0.70)} ${getTileSize(-0.70)}`}>
                <div className="font-medium">HBC</div>
                <div className="text-sm">-0.70%</div>
              </div>
              <div className={`${getColorByChange(0.33)} ${getTileSize(0.33)}`}>
                <div className="font-medium">FCN</div>
                <div className="text-sm">+0.33%</div>
              </div>
              <div className={`${getColorByChange(0.95)} ${getTileSize(0.95)}`}>
                <div className="font-medium">VGC</div>
                <div className="text-sm">+0.95%</div>
              </div>
              <div className={`${getColorByChange(-0.45)} ${getTileSize(-0.45)}`}>
                <div className="font-medium">CII</div>
                <div className="text-sm">-0.45%</div>
              </div>
            </div>
          </div>

          {/* Dịch vụ tiện ích */}
          <div className="col-span-2 grid grid-rows-[auto_1fr] min-h-0">
            <div className="text-xs text-white mb-[1px] text-left">Dịch vụ tiện ích</div>
            <div className="grid grid-cols-2 gap-[1px] min-h-0">
              <div className={`${getColorByChange(-2.83)} ${getTileSize(-2.83, true)}`}>
                <div className="font-medium">POW</div>
                <div className="text-sm">-2.83%</div>
              </div>
              <div className={`${getColorByChange(-0.87)} ${getTileSize(-0.87, true)}`}>
                <div className="font-medium">GAS</div>
                <div className="text-sm">-0.87%</div>
              </div>
              <div className={`${getColorByChange(0.65)} ${getTileSize(0.65)}`}>
                <div className="font-medium">VSH</div>
                <div className="text-sm">+0.65%</div>
              </div>
              <div className={`${getColorByChange(-0.35)} ${getTileSize(-0.35)}`}>
                <div className="font-medium">NT2</div>
                <div className="text-sm">-0.35%</div>
              </div>
              <div className={`${getColorByChange(0.45)} ${getTileSize(0.45)}`}>
                <div className="font-medium">REE</div>
                <div className="text-sm">+0.45%</div>
              </div>
              <div className={`${getColorByChange(-0.25)} ${getTileSize(-0.25)}`}>
                <div className="font-medium">BWE</div>
                <div className="text-sm">-0.25%</div>
              </div>
            </div>
          </div>

          {/* Hàng hóa & Dịch vụ */}
          <div className="col-span-2 grid grid-rows-[auto_1fr] min-h-0">
            <div className="text-xs text-left text-white mb-[1px]">Hàng hóa & Dịch vụ</div>
            <div className="grid grid-cols-2 gap-[1px] min-h-0">
              <div className={`${getColorByChange(-0.84)} ${getTileSize(-0.84)}`}>
                <div className="font-medium">GEX</div>
                <div className="text-sm">-0.84%</div>
              </div>
              <div className={`${getColorByChange(1.60)} ${getTileSize(1.60)}`}>
                <div className="font-medium">HAH</div>
                <div className="text-sm">+1.60%</div>
              </div>
              <div className={`${getColorByChange(-1.13)} ${getTileSize(-1.13)}`}>
                <div className="font-medium">DGC</div>
                <div className="text-sm">-1.13%</div>
              </div>
              <div className={`${getColorByChange(0.75)} ${getTileSize(0.75)}`}>
                <div className="font-medium">GMD</div>
                <div className="text-sm">+0.75%</div>
              </div>
              <div className={`${getColorByChange(-0.45)} ${getTileSize(-0.45)}`}>
                <div className="font-medium">PVT</div>
                <div className="text-sm">-0.45%</div>
              </div>
              <div className={`${getColorByChange(0.65)} ${getTileSize(0.65)}`}>
                <div className="font-medium">VOS</div>
                <div className="text-sm">+0.65%</div>
              </div>
            </div>
          </div>

          {/* Hóa chất */}
          <div className="col-span-2 grid grid-rows-[auto_1fr] min-h-0">
            <div className="text-xs text-left text-white mb-[1px]">Hóa chất</div>
            <div className="grid grid-cols-2 gap-[1px] min-h-0">
              <div className={`${getColorByChange(0.87)} ${getTileSize(0.87)}`}>
                <div className="font-medium">GVR</div>
                <div className="text-sm">+0.87%</div>
              </div>
              <div className={`${getColorByChange(-0.28)} ${getTileSize(-0.28)}`}>
                <div className="font-medium">DPM</div>
                <div className="text-sm">-0.28%</div>
              </div>
              <div className={`${getColorByChange(0.15)} ${getTileSize(0.15)}`}>
                <div className="font-medium">CSV</div>
                <div className="text-sm">+0.15%</div>
              </div>
              <div className={`${getColorByChange(-0.97)} ${getTileSize(-0.97)}`}>
                <div className="font-medium">BFC</div>
                <div className="text-sm">-0.97%</div>
              </div>
              <div className={`${getColorByChange(0.55)} ${getTileSize(0.55)}`}>
                <div className="font-medium">DCM</div>
                <div className="text-sm">+0.55%</div>
              </div>
              <div className={`${getColorByChange(-0.35)} ${getTileSize(-0.35)}`}>
                <div className="font-medium">LAS</div>
                <div className="text-sm">-0.35%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapPage; 