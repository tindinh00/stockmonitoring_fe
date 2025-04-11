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

  if (loading) {
    return (
      <div className="flex-1 p-4 md:p-8 pt-6 bg-[#0a0a14]">
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-400">Loading dashboard data...</div>
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

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 bg-[#0a0a14]">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Dashboard</h2>
          <p className="text-sm text-gray-400">
            Your business analytics and overview.
          </p>
        </div>
      </div>
      <div className="space-y-8">
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Revenue"
            value={`$${currentMonthStats.totalRevenue.toLocaleString()}`}
            icon={<DollarSign className="h-4 w-4" />}
            helperText={`${revenueChange > 0 ? '+' : ''}${revenueChange}% from last month`}
            trend={revenueChange >= 0 ? "up" : "down"}
            className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-0 shadow-xl shadow-blue-500/5"
            iconClassName="bg-blue-500/10 text-blue-500"
          />
          <StatsCard
            title="Total Purchases"
            value={currentMonthStats.totalPurchases.toString()}
            icon={<Users className="h-4 w-4" />}
            helperText="This month"
            trend="up"
            className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-0 shadow-xl shadow-emerald-500/5"
            iconClassName="bg-emerald-500/10 text-emerald-500"
          />
          <StatsCard
            title="Top Package Revenue"
            value={`$${dashboardData?.packageStatsByRevenue[0]?.totalRevenue.toLocaleString() || '0'}`}
            icon={<CreditCard className="h-4 w-4" />}
            helperText={dashboardData?.packageStatsByRevenue[0]?.packageName || 'No data'}
            trend="up"
            className="bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent border-0 shadow-xl shadow-violet-500/5"
            iconClassName="bg-violet-500/10 text-violet-500"
          />
          <StatsCard
            title="Most Purchased"
            value={dashboardData?.packageStatsByPurchases[0]?.purchaseCount.toString() || '0'}
            icon={<Activity className="h-4 w-4" />}
            helperText={dashboardData?.packageStatsByPurchases[0]?.packageName || 'No data'}
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