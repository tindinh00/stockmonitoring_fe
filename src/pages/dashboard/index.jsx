import { DollarSign, Users, CreditCard, Activity } from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { OverviewChart } from "@/components/dashboard/overview-chart"
import { RecentSales } from "@/components/dashboard/recent-sales"
import { useEffect, useState } from "react"
import { apiService } from "@/api/Api"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { format } from "date-fns"

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const currentYear = new Date().getFullYear()
  const [loadingToday, setLoadingToday] = useState(true)
  const [todayRevenue, setTodayRevenue] = useState(0)
  const [todayPurchases, setTodayPurchases] = useState(0)
  const [todayDetails, setTodayDetails] = useState(null)
  const [showTodayDetails, setShowTodayDetails] = useState(false)

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
          setTodayDetails(response.value.data); // Lưu toàn bộ dữ liệu chi tiết
        } else if (response?.data) {
          // Fallback cho trường hợp API đã được xử lý trước đó
          setTodayRevenue(response.data.totalRevenue || 0);
          setTodayPurchases(response.data.totalPurchases || 0);
          setTodayDetails(response.data); // Lưu toàn bộ dữ liệu chi tiết
        } else {
          console.error('Unexpected API response structure:', response);
          setTodayRevenue(0);
          setTodayPurchases(0);
          setTodayDetails(null);
        }
      } catch (error) {
        console.error('Error fetching today\'s revenue:', error);
        setTodayRevenue(0);
        setTodayPurchases(0);
        setTodayDetails(null);
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

  // Hàm định dạng ngày tháng
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      // Trừ đi 7 giờ
      date.setHours(date.getHours() - 7);
      return date.toLocaleDateString('vi-VN', { 
        day: 'numeric', 
        month: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateStr;
    }
  }

  // Lấy ngày hiện tại để hiển thị
  const today = new Date().toLocaleDateString('vi-VN', { 
    day: 'numeric', 
    month: 'numeric', 
    year: 'numeric'
  });

  // Xử lý khi click vào thẻ doanh thu trong ngày
  const handleDailyRevenueClick = () => {
    setShowTodayDetails(true);
  };

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
          <div onClick={handleDailyRevenueClick} className="cursor-pointer transform transition-transform hover:scale-105">
            <StatsCard
              title="Tổng doanh thu trong ngày"
              value={loadingToday ? 'Đang tải...' : formatVND(todayRevenue)}
              icon={<DollarSign className="h-4 w-4" />}
              helperText={`${todayPurchases} giao dịch (${today})`}
              trend="up"
              className="bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent border-0 shadow-xl shadow-cyan-500/5"
              iconClassName="bg-cyan-500/10 text-cyan-500"
            />
          </div>
          <StatsCard
            title="Tổng doanh thu trong tháng"
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
      
      {/* Chi tiết doanh thu trong ngày */}
      <Dialog open={showTodayDetails} onOpenChange={setShowTodayDetails}>
        <DialogContent className="sm:max-w-[700px] w-[95vw] max-h-[90vh] bg-gradient-to-b from-[#151929] to-[#0f172a] text-white border-0 shadow-2xl rounded-xl overflow-hidden flex flex-col p-0 md:p-6">
          <DialogHeader className="pb-4 md:pb-6 border-b border-indigo-500/20 flex-shrink-0 p-4 md:p-0">
            <DialogTitle className="text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-2">
              <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-cyan-500" />
              Chi tiết doanh thu ngày {today}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 md:py-6 overflow-y-auto custom-scrollbar px-4 md:px-0">
            {todayDetails ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                  <div className="bg-indigo-500/10 rounded-xl p-4 md:p-5 border border-indigo-500/20 shadow-md shadow-indigo-500/5 transition-all duration-300 hover:shadow-indigo-500/10 hover:border-indigo-500/30">
                    <div className="text-indigo-300 text-xs md:text-sm font-medium mb-2">Tổng lượt mua</div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 md:h-5 md:w-5 mr-2 text-indigo-400" />
                      <span className="text-xl md:text-2xl font-bold text-white">{todayDetails.totalPurchases}</span>
                    </div>
                    <div className="text-indigo-200/60 text-xs mt-2">giao dịch trong ngày</div>
                  </div>
                  
                  <div className="bg-cyan-500/10 rounded-xl p-4 md:p-5 border border-cyan-500/20 shadow-md shadow-cyan-500/5 transition-all duration-300 hover:shadow-cyan-500/10 hover:border-cyan-500/30">
                    <div className="text-cyan-300 text-xs md:text-sm font-medium mb-2">Tổng doanh thu</div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 md:h-5 md:w-5 mr-2 text-cyan-400" />
                      <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        {formatVND(todayDetails.totalRevenue)}
                      </span>
                    </div>
                    <div className="text-cyan-200/60 text-xs mt-2">đã ghi nhận trong 24h qua</div>
                  </div>
                </div>
                
                <div className="bg-[#121828] rounded-xl border border-gray-800/50 overflow-hidden mb-6">
                  <div className="bg-gradient-to-r from-[#1a2234] to-[#121828] p-3 md:p-4 border-b border-gray-800/50 sticky top-0 z-10">
                    <h3 className="text-base md:text-lg font-semibold text-white">Chi tiết theo gói</h3>
                  </div>
                  
                  {todayDetails.packageStats && todayDetails.packageStats.length > 0 ? (
                    <>
                      {/* Desktop view - hiển thị bảng đầy đủ */}
                      <div className="hidden md:block">
                        <div className="grid grid-cols-10 px-4 py-3 text-sm text-gray-400 border-b border-gray-800/50 bg-[#121828]/80 sticky top-[57px] z-10">
                          <div className="col-span-4">Tên gói</div>
                          <div className="col-span-3 text-center">Lượt mua</div>
                          <div className="col-span-3 text-right">Doanh thu</div>
                        </div>
                        <div className="divide-y divide-gray-800/50 max-h-[300px] overflow-y-auto custom-scrollbar">
                          {todayDetails.packageStats.map((pkg, index) => (
                            <div 
                              key={pkg.packageId} 
                              className="grid grid-cols-10 px-4 py-4 hover:bg-gray-800/10 transition-colors duration-150"
                            >
                              <div className="col-span-4 flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                                  index === 0 ? 'bg-gradient-to-br from-cyan-500 to-blue-600' : 
                                  index === 1 ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 
                                  'bg-gradient-to-br from-gray-600 to-gray-700'
                                }`}>
                                  <CreditCard className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <div className="font-medium text-white">{pkg.packageName}</div>
                                </div>
                              </div>
                              <div className="col-span-3 flex items-center justify-center">
                                <div className="bg-indigo-500/10 rounded-full px-3 py-1 text-sm font-medium text-indigo-300 border border-indigo-500/20">
                                  {pkg.purchaseCount} lượt
                                </div>
                              </div>
                              <div className="col-span-3 flex items-center justify-end font-medium">
                                <span className={`${
                                  index === 0 ? 'text-cyan-400' : 
                                  index === 1 ? 'text-indigo-400' : 
                                  'text-gray-300'
                                }`}>
                                  {formatVND(pkg.totalRevenue)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Mobile view - hiển thị dạng card */}
                      <div className="md:hidden divide-y divide-gray-800/50 max-h-[350px] overflow-y-auto custom-scrollbar">
                        {todayDetails.packageStats.map((pkg, index) => (
                          <div key={pkg.packageId} className="p-4 hover:bg-gray-800/10 transition-colors duration-150">
                            <div className="flex items-center mb-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                                index === 0 ? 'bg-gradient-to-br from-cyan-500 to-blue-600' : 
                                index === 1 ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 
                                'bg-gradient-to-br from-gray-600 to-gray-700'
                              }`}>
                                <CreditCard className="h-4 w-4 text-white" />
                              </div>
                              <div className="font-medium text-white">{pkg.packageName}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div className="bg-gray-800/30 rounded-lg p-2">
                                <div className="text-xs text-gray-400 mb-1">Lượt mua</div>
                                <div className="font-medium text-indigo-300">{pkg.purchaseCount} lượt</div>
                              </div>
                              <div className="bg-gray-800/30 rounded-lg p-2">
                                <div className="text-xs text-gray-400 mb-1">Doanh thu</div>
                                <div className={`font-medium ${
                                  index === 0 ? 'text-cyan-400' : 
                                  index === 1 ? 'text-indigo-400' : 
                                  'text-gray-300'
                                }`}>
                                  {formatVND(pkg.totalRevenue)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="py-8 md:py-12 text-center text-gray-400 flex flex-col items-center">
                      <Activity className="h-10 w-10 md:h-12 md:w-12 text-gray-600 mb-3 opacity-50" />
                      <p>Không có lượt mua nào trong ngày hôm nay</p>
                    </div>
                  )}
                </div>
                
                
              </>
            ) : (
              <div className="py-10 md:py-16 text-center text-gray-400 flex flex-col items-center">
                <div className="rounded-full bg-gray-800/50 p-4 md:p-6 mb-4">
                  <Activity className="h-10 w-10 md:h-12 md:w-12 text-gray-600" />
                </div>
                <p className="text-lg md:text-xl font-medium text-gray-500">Không có dữ liệu chi tiết để hiển thị</p>
                <p className="text-gray-600 mt-2 text-sm">Vui lòng thử lại sau</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* CSS cho custom scrollbar */}
      <style jsx="true" global="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }
      `}</style>
    </div>
  )
} 