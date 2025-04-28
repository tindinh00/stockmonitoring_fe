import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { apiService } from "@/api/Api"

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-slate-900/90 backdrop-blur-sm p-3 shadow-xl">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-gray-400">
              Tháng
            </span>
            <span className="font-bold text-sm text-white">{label}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-gray-400">
              Doanh thu
            </span>
            <span className="font-bold text-sm text-white">
              {new Intl.NumberFormat('vi-VN', { 
                style: 'currency', 
                currency: 'VND',
                maximumFractionDigits: 0 
              }).format(payload[0].value)}
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export function OverviewChart({ className }) {
  const [data, setData] = useState([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [loading, setLoading] = useState(true)

  // Mảng chứa tên tháng bằng tiếng Việt
  const vietnameseMonths = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", 
                           "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
                           
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await apiService.getMonthlyRevenue(selectedYear)
        const formattedData = response.data.map(item => ({
          ...item,
          name: vietnameseMonths[item.month - 1]
        }))
        setData(formattedData)
      } catch (error) {
        console.error('Error fetching monthly revenue:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedYear])

  // Lấy các năm để hiển thị trong dropdown (từ năm hiện tại trở về 5 năm trước)
  const years = Array.from({ length: 6 }, (_, i) => (new Date().getFullYear() - i).toString())

  return (
    <Card className={cn("col-span-4 overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-8">
        <div className="space-y-1">
          <CardTitle className="text-base font-medium text-gray-200">Tổng quan doanh thu</CardTitle>
          <CardDescription className="text-sm text-gray-400">
            Phân tích doanh thu theo tháng
          </CardDescription>
        </div>
        <Select
          defaultValue={selectedYear}
          onValueChange={setSelectedYear}
        >
          <SelectTrigger className="w-[100px] focus:ring-0 focus:ring-offset-0 bg-slate-800 hover:bg-slate-700 focus:ring-slate-700 border-slate-700">
            <SelectValue placeholder={selectedYear} />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            {years.map((year) => (
              <SelectItem
                key={year}
                value={year}
                className="cursor-pointer focus:bg-slate-700 hover:bg-slate-700"
              >
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-0 pl-4">
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="flex items-center space-x-2 text-gray-400">
              <svg
                className="animate-spin h-5 w-5 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Đang tải dữ liệu...</span>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.2} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#888', fontSize: 12 }}
                axisLine={{ stroke: '#444' }}
                tickLine={{ stroke: '#444' }}
              />
              <YAxis
                tick={{ fill: '#888', fontSize: 12 }}
                axisLine={{ stroke: '#444' }}
                tickLine={{ stroke: '#444' }}
                tickFormatter={(value) => new Intl.NumberFormat('vi-VN', { 
                  style: 'decimal',
                  maximumFractionDigits: 0,
                  notation: 'compact',
                  compactDisplay: 'short'
                }).format(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="revenue"
                fill="url(#colorGradient)"
                radius={[4, 4, 0, 0]}
                barSize={30}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#1D4ED8" stopOpacity={1} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
} 