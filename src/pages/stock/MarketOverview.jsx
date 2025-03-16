import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

// Mock data for VN-Index chart
const vnIndexData = Array.from({ length: 360 }, (_, i) => ({
  time: new Date(2024, 0, 1, 9, i).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  value: 1200 + Math.sin(i / 30) * 50 + Math.random() * 20,
  volume: Math.random() * 1000000
}));

// Mock data for market liquidity
const liquidityData = Array.from({ length: 360 }, (_, i) => ({
  time: new Date(2024, 0, 1, 9, i).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  value: Math.random() * 24000,
  previousDay: Math.random() * 24000,
  yesterday: Math.random() * 24000
}));

// Mock data for market distribution
const distributionData = [
  { range: "-7%", count: 24 },
  { range: "-5%", count: 15 },
  { range: "-3%", count: 35 },
  { range: "-2%", count: 30 },
  { range: "-1%", count: 66 },
  { range: "-0.1%", count: 111 },
  { range: "0%", count: 531 },
  { range: "+0.1%", count: 56 },
  { range: "+2%", count: 38 },
  { range: "+3%", count: 14 },
  { range: "+5%", count: 8 },
  { range: "+7%", count: 20 },
];

export default function MarketOverview() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* VN-Index Chart */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">VN-Index</CardTitle>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-2xl font-bold">1,326.15</span>
                <span className="text-red-500">-0.12 (-0.01%)</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              KLGD: 1,023M CP
              <br />
              GTGD: 23,043 tỷ
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vnIndexData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time"
                  interval={59}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  domain={['dataMin - 10', 'dataMax + 10']}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Market Liquidity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Thanh khoản thị trường (Tỷ VNĐ)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={liquidityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time"
                  interval={59}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.1}
                />
                <Area 
                  type="monotone" 
                  dataKey="previousDay" 
                  stroke="#6b7280" 
                  fill="#6b7280" 
                  fillOpacity={0.1}
                />
                <Area 
                  type="monotone" 
                  dataKey="yesterday" 
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Market Distribution Chart */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">Biến động cổ phiếu</CardTitle>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-red-500">Giảm: 283</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">Tăng: 170</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="range"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Bar 
                  dataKey="count" 
                  fill={(data) => {
                    if (data.range.includes('-')) return '#ef4444';
                    if (data.range === '0%') return '#6b7280';
                    return '#10b981';
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 