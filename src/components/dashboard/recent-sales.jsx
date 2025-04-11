import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { apiService } from "@/api/Api"

export function RecentSales({ className }) {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await apiService.getPackagesByRevenue()
        setPackages(response.data)
      } catch (error) {
        console.error('Error fetching package data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <Card className={cn("col-span-3 overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-8">
        <div className="space-y-1">
          <CardTitle className="text-base font-medium text-gray-200">Top Packages</CardTitle>
          <CardDescription className="text-sm text-gray-400">
            Packages ranked by revenue
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" className="hover:bg-white/5">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-sm text-gray-400">Loading package data...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {packages.map((pkg, index) => (
              <div 
                key={pkg.packageId}
                className="flex items-center gap-4 group hover:bg-white/5 -mx-2 p-2 rounded-lg transition-all duration-300 cursor-pointer"
              >
                <Avatar className="h-9 w-9 border border-blue-500/20 shadow-lg shadow-blue-500/10">
                  <AvatarFallback className="bg-blue-500/10 text-blue-400 font-medium">
                    {pkg.packageName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none truncate text-gray-200">
                    {pkg.packageName}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {pkg.purchaseCount} purchases
                  </p>
                </div>
                <div className="text-sm font-medium text-emerald-500">
                  ${pkg.totalRevenue.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 