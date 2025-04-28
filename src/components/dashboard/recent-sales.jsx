import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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

  // Hàm định dạng tiền VNĐ
  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  }

  return (
    <Card className={cn("col-span-3 overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl", className)}>
      <CardHeader className="pb-8">
        <div className="space-y-1">
          <CardTitle className="text-base font-medium text-gray-200">Gói dịch vụ hàng đầu</CardTitle>
          <CardDescription className="text-sm text-gray-400">
            Xếp hạng theo doanh thu
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
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
              <span>Đang tải dữ liệu gói dịch vụ...</span>
            </div>
          </div>
        ) : packages && packages.length > 0 ? (
          <div className="space-y-8">
            {packages.slice(0, 5).map((pkg, index) => (
              <div className="flex items-center" key={pkg.id || index}>
                <Avatar className="h-9 w-9 border border-blue-500/20">
                  <AvatarFallback className="bg-blue-500/10 text-blue-500">
                    {pkg.packageName ? pkg.packageName.charAt(0).toUpperCase() : 'P'}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none text-gray-200">{pkg.packageName}</p>
                  <p className="text-xs text-gray-400">
                    {pkg.purchaseCount} người dùng
                  </p>
                </div>
                <div className="ml-auto font-medium">
                  {formatVND(pkg.totalRevenue)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-sm text-gray-400">Không có dữ liệu gói dịch vụ</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 