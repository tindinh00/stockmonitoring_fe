// components/Header.jsx
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export default function StockHeader() {
  return (
    <header className="w-full bg-[#0a0a14] text-white p-4 border-b border-gray-700 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex space-x-4">
          <span className="text-lg font-bold">iSTOCK</span>
          <div className="flex space-x-2 text-sm">
            <span>VNINDEX 1,305.36 ▼ -2.44 (-0.19%)</span>
            <span>HNX 239.19 ▼ -2.0 (-0.08%)</span>
            <span>UPCOM 99.58 ▼ -0.24 (-0.24%)</span>
            <span>VN30 1,356.43 ▼ -7.</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button className="bg-[#F44336] hover:bg-[#D32F2F] text-white">Mua dịch vụ</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-white hover:bg-gray-700">
                <span className="flex items-center">
                  Tiếng Việt <span className="ml-2">▼</span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#1A202C] text-white border-gray-700">
              <DropdownMenuItem className="hover:bg-gray-700">English</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-white hover:bg-gray-700">
                <span className="flex items-center">
                  Đoàn Đình ... <span className="ml-2">▼</span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#1A202C] text-white border-gray-700">
              <DropdownMenuItem className="hover:bg-gray-700">Đăng xuất</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}