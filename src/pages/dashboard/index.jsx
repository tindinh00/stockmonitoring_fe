import { DollarSign, Users, CreditCard, Activity } from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { OverviewChart } from "@/components/dashboard/overview-chart"
import { RecentSales } from "@/components/dashboard/recent-sales"
import { useEffect, useState } from "react"
import { apiService } from "@/api/Api"

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const currentYear = new Date().getFullYear()
  const [loadingToday, setLoadingToday] = useState(true)
  const [todayRevenue, setTodayRevenue] = useState(0)
  const [todayPurchases, setTodayPurchases] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await apiService.getDashboardData(currentYear)
        setDashboardData(response.data)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const fetchTodayRevenue = async () => {
      try {
        setLoadingToday(true)
        const response = await apiService.getTodayRevenue()
        // Cập nhật đường dẫn truy cập đúng với cấu trúc của response
        console.log('Today revenue response:', response); // Log để debug
        
        // Kiểm tra đường dẫn đúng để truy cập dữ liệu
        if (response?.value?.data) {
          setTodayRevenue(response.value.data.totalRevenue || 0);
          setTodayPurchases(response.value.data.totalPurchases || 0);
        } else if (response?.data) {
          // Fallback cho trường hợp API đã được xử lý trước đó
          setTodayRevenue(response.data.totalRevenue || 0);
          setTodayPurchases(response.data.totalPurchases || 0);
        } else {
          console.error('Unexpected API response structure:', response);
          setTodayRevenue(0);
          setTodayPurchases(0);
        }
      } catch (error) {
        console.error('Error fetching today\'s revenue:', error);
        setTodayRevenue(0);
        setTodayPurchases(0);
      } finally {
        setLoadingToday(false);
      }
    }

    fetchTodayRevenue()
  }, [])

  if (loading) {
    return (
      <div className="flex-1 p-4 md:p-8 pt-6 bg-[#0a0a14]">
        <div className="flex items-center justify-center h-full">
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
            <span>Đang tải dữ liệu bảng điều khiển...</span>
          </div>
        </div>
      </div>
    )
  }

  const currentMonthStats = dashboardData?.currentMonthStats || {
    totalPurchases: 0,
    totalRevenue: 0
  }

  // Calculate month-over-month change
  const currentMonthRevenue = dashboardData?.monthlyRevenue?.find(
    m => m.month === new Date().getMonth() + 1
  )?.revenue || 0
  const lastMonthRevenue = dashboardData?.monthlyRevenue?.find(
    m => m.month === new Date().getMonth()
  )?.revenue || 0
  const revenueChange = lastMonthRevenue ? 
    ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1) : 0

  // Hàm định dạng tiền VNĐ
  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Lấy ngày hiện tại để hiển thị
  const today = new Date().toLocaleDateString('vi-VN', { 
    day: 'numeric', 
    month: 'numeric', 
    year: 'numeric'
  });

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 bg-[#0a0a14]">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Bảng điều khiển</h2>
          <p className="text-sm text-gray-400">
            Phân tích và tổng quan kinh doanh của bạn.
          </p>
        </div>
      </div>
      <div className="space-y-8">
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            title="Tổng doanh thu trong ngày"
            value={loadingToday ? 'Đang tải...' : formatVND(todayRevenue)}
            icon={<DollarSign className="h-4 w-4" />}
            helperText={`${todayPurchases} giao dịch (${today})`}
            trend="up"
            className="bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent border-0 shadow-xl shadow-cyan-500/5"
            iconClassName="bg-cyan-500/10 text-cyan-500"
          />
          <StatsCard
            title="Tổng doanh thu"
            value={formatVND(currentMonthStats.totalRevenue)}
            icon={<DollarSign className="h-4 w-4" />}
            helperText={`${revenueChange > 0 ? '+' : ''}${revenueChange}% so với tháng trước`}
            trend={revenueChange >= 0 ? "up" : "down"}
            className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-0 shadow-xl shadow-blue-500/5"
            iconClassName="bg-blue-500/10 text-blue-500"
          />
          <StatsCard
            title="Tổng lượt mua"
            value={currentMonthStats.totalPurchases.toString()}
            icon={<Users className="h-4 w-4" />}
            helperText="Trong tháng này"
            trend="up"
            className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-0 shadow-xl shadow-emerald-500/5"
            iconClassName="bg-emerald-500/10 text-emerald-500"
          />
          <StatsCard
            title="Gói dịch vụ doanh thu cao nhất"
            value={formatVND(dashboardData?.packageStatsByRevenue[0]?.totalRevenue || 0)}
            icon={<CreditCard className="h-4 w-4" />}
            helperText={dashboardData?.packageStatsByRevenue[0]?.packageName || 'Không có dữ liệu'}
            trend="up"
            className="bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent border-0 shadow-xl shadow-violet-500/5"
            iconClassName="bg-violet-500/10 text-violet-500"
          />
          <StatsCard
            title="Gói được mua nhiều nhất"
            value={dashboardData?.packageStatsByPurchases[0]?.purchaseCount.toString() || '0'}
            icon={<Activity className="h-4 w-4" />}
            helperText={dashboardData?.packageStatsByPurchases[0]?.packageName || 'Không có dữ liệu'}
            trend="up"
            className="bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent border-0 shadow-xl shadow-orange-500/5"
            iconClassName="bg-orange-500/10 text-orange-500"
          />
        </div>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-1 md:col-span-1 lg:col-span-4">
            <OverviewChart className="border-0 shadow-xl shadow-blue-500/5 bg-gradient-to-br from-slate-900/50 to-slate-900" />
          </div>
          <div className="col-span-1 md:col-span-1 lg:col-span-3">
            <RecentSales className="border-0 shadow-xl shadow-blue-500/5 bg-gradient-to-br from-slate-900/50 to-slate-900" />
          </div>
        </div>
      </div>
    </div>
  )
} 