import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

const recentSales = [
  {
    name: "Olivia Martin",
    email: "olivia.martin@email.com",
    amount: "+$1,999.00",
    avatar: "OM"
  },
  {
    name: "Jackson Lee",
    email: "jackson.lee@email.com",
    amount: "+$39.00",
    avatar: "JL"
  },
  {
    name: "Isabella Nguyen",
    email: "isabella.nguyen@email.com",
    amount: "+$299.00",
    avatar: "IN"
  },
  {
    name: "William Kim",
    email: "will@email.com",
    amount: "+$99.00",
    avatar: "WK"
  },
  {
    name: "Sofia Davis",
    email: "sofia.davis@email.com",
    amount: "+$39.00",
    avatar: "SD"
  }
]

export function RecentSales({ className }) {
  return (
    <Card className={cn("col-span-3 overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-8">
        <div className="space-y-1">
          <CardTitle className="text-base font-medium text-gray-200">Recent Sales</CardTitle>
          <CardDescription className="text-sm text-gray-400">
            You made 265 sales this month
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" className="hover:bg-white/5">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {recentSales.map((sale, index) => (
            <div 
              key={index}
              className="flex items-center gap-4 group hover:bg-white/5 -mx-2 p-2 rounded-lg transition-all duration-300 cursor-pointer"
            >
              <Avatar className="h-9 w-9 border border-blue-500/20 shadow-lg shadow-blue-500/10">
                <AvatarFallback className="bg-blue-500/10 text-blue-400 font-medium">
                  {sale.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-none truncate text-gray-200">
                  {sale.name}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {sale.email}
                </p>
              </div>
              <div className="text-sm font-medium text-emerald-500">
                {sale.amount}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 