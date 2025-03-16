import { DollarSign, Users, CreditCard, Activity } from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { OverviewChart } from "@/components/dashboard/overview-chart"
import { RecentSales } from "@/components/dashboard/recent-sales"

export default function DashboardPage() {
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
            value="$45,231.89"
            icon={<DollarSign className="h-4 w-4" />}
            helperText="+20.1% from last month"
            trend="up"
            className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-0 shadow-xl shadow-blue-500/5"
            iconClassName="bg-blue-500/10 text-blue-500"
          />
          <StatsCard
            title="Subscriptions"
            value="+2350"
            icon={<Users className="h-4 w-4" />}
            helperText="+180.1% from last month"
            trend="up"
            className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-0 shadow-xl shadow-emerald-500/5"
            iconClassName="bg-emerald-500/10 text-emerald-500"
          />
          <StatsCard
            title="Sales"
            value="+12,234"
            icon={<CreditCard className="h-4 w-4" />}
            helperText="+19% from last month"
            trend="up"
            className="bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent border-0 shadow-xl shadow-violet-500/5"
            iconClassName="bg-violet-500/10 text-violet-500"
          />
          <StatsCard
            title="Active Now"
            value="+573"
            icon={<Activity className="h-4 w-4" />}
            helperText="+201 since last hour"
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