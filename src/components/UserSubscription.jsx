import React from "react";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const UserSubscription = ({ subscriptions = [] }) => {
  // Nếu không có dữ liệu, hiển thị gói dịch vụ mẫu
  const demoSubscriptions = [
    {
      id: 1,
      name: "Gói Premium",
      status: "active",
      startDate: "2023-01-01",
      endDate: "2023-12-31",
      features: ["Truy cập không giới hạn", "Phân tích chuyên sâu", "Hỗ trợ 24/7"],
      price: "999.000",
      progress: 75,
    },
    {
      id: 2,
      name: "Gói VIP",
      status: "pending",
      startDate: "2023-12-31",
      endDate: "2024-12-31",
      features: ["Tất cả tính năng Premium", "Tư vấn 1-1", "Báo cáo độc quyền"],
      price: "1.999.000",
      progress: 0,
    },
    {
      id: 3,
      name: "Gói Cơ bản",
      status: "expired",
      startDate: "2022-01-01",
      endDate: "2022-12-31",
      features: ["Truy cập cơ bản", "Báo cáo hàng tháng"],
      price: "499.000",
      progress: 100,
    },
  ];

  const displaySubscriptions = subscriptions.length > 0 ? subscriptions : demoSubscriptions;

  // Hàm định dạng ngày
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  // Hàm lấy màu sắc và icon dựa trên trạng thái
  const getStatusInfo = (status) => {
    switch (status) {
      case "active":
        return {
          color: "bg-green-100 text-green-800",
          icon: <CheckCircle className="h-4 w-4 mr-1" />,
          text: "Đang hoạt động",
        };
      case "pending":
        return {
          color: "bg-yellow-100 text-yellow-800",
          icon: <Clock className="h-4 w-4 mr-1" />,
          text: "Chờ kích hoạt",
        };
      case "expired":
        return {
          color: "bg-red-100 text-red-800",
          icon: <AlertCircle className="h-4 w-4 mr-1" />,
          text: "Đã hết hạn",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          icon: null,
          text: status,
        };
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gói dịch vụ của bạn</h2>
      
      {displaySubscriptions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <p className="text-muted-foreground">Bạn chưa đăng ký gói dịch vụ nào</p>
              <Button className="mt-4">Khám phá các gói dịch vụ</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displaySubscriptions.map((subscription) => {
            const { color, icon, text } = getStatusInfo(subscription.status);
            
            return (
              <Card key={subscription.id} className="overflow-hidden">
                <div className={`h-2 ${subscription.status === 'active' ? 'bg-primary' : subscription.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{subscription.name}</CardTitle>
                      <CardDescription>
                        {formatDate(subscription.startDate)} - {formatDate(subscription.endDate)}
                      </CardDescription>
                    </div>
                    <Badge className={color}>
                      <span className="flex items-center">
                        {icon}
                        {text}
                      </span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Thời gian sử dụng</span>
                        <span>{subscription.progress}%</span>
                      </div>
                      <Progress value={subscription.progress} className="h-2" />
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Tính năng bao gồm:</p>
                      <ul className="space-y-1">
                        {subscription.features.map((feature, index) => (
                          <li key={index} className="text-sm flex items-center">
                            <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="pt-2">
                      <p className="text-sm text-muted-foreground">Giá gói:</p>
                      <p className="text-xl font-bold">{subscription.price} VNĐ</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-between">
                  {subscription.status === "active" && (
                    <Button variant="outline" size="sm">Nâng cấp</Button>
                  )}
                  {subscription.status === "pending" && (
                    <Button variant="outline" size="sm">Chi tiết</Button>
                  )}
                  {subscription.status === "expired" && (
                    <Button variant="outline" size="sm">Gia hạn</Button>
                  )}
                  <Button variant="ghost" size="sm">Xem chi tiết</Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserSubscription; 