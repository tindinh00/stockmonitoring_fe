import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

export function StatsCard({ title, value, icon, helperText, trend = "up", className, iconClassName }) {
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 ease-in-out",
      "hover:translate-y-[-2px] hover:shadow-2xl",
      "backdrop-blur-sm bg-opacity-20",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">
          {title}
        </CardTitle>
        <div className={cn(
          "size-8 rounded-lg flex items-center justify-center transition-colors duration-300",
          iconClassName
        )}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight text-white">{value}</div>
        <div className="flex items-center gap-2 mt-2">
          {trend === "up" ? (
            <TrendingUp className="size-3 text-emerald-500" />
          ) : (
            <TrendingDown className="size-3 text-red-500" />
          )}
          <p className={cn(
            "text-xs font-medium",
            trend === "up" ? "text-emerald-500" : "text-red-500"
          )}>
            {helperText}
          </p>
        </div>
      </CardContent>
      <div 
        className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
        style={{
          maskImage: 'linear-gradient(to right, transparent, black, transparent)'
        }}
      />
    </Card>
  )
} 