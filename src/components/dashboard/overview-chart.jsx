import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

const data = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 2000 },
  { name: 'Mar', value: 1000 },
  { name: 'Apr', value: 3000 },
  { name: 'May', value: 5000 },
  { name: 'Jun', value: 1000 },
  { name: 'Jul', value: 2000 },
  { name: 'Aug', value: 2000 },
  { name: 'Sep', value: 3000 },
  { name: 'Oct', value: 2000 },
  { name: 'Nov', value: 2000 },
  { name: 'Dec', value: 2000 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-slate-900/90 backdrop-blur-sm p-3 shadow-xl">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-gray-400">
              Month
            </span>
            <span className="font-bold text-sm text-white">{label}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-gray-400">
              Revenue
            </span>
            <span className="font-bold text-sm text-white">
              ${payload[0].value.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export function OverviewChart({ className }) {
  return (
    <Card className={cn("col-span-4 overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-8">
        <div className="space-y-1">
          <CardTitle className="text-base font-medium text-gray-200">Overview</CardTitle>
          <CardDescription className="text-sm text-gray-400">
            Monthly revenue overview & analysis
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="2024">
            <SelectTrigger className="w-[100px] bg-slate-900/50 border-0 focus:ring-1 focus:ring-gray-600">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[240px] md:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 15, left: 0, bottom: 0 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false} 
                horizontal={true}
                stroke="#333"
                opacity={0.5}
              />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                fontSize={12}
                tickMargin={8}
                stroke="#666"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                fontSize={12}
                tickMargin={8}
                stroke="#666"
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
              />
              <Bar 
                dataKey="value" 
                fill="url(#colorGradient)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity={1} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 