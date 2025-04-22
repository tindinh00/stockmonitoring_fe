import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function SearchInput() {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
      <Input
        type="search"
        placeholder="Tìm kiếm..."
        className="w-full bg-[#213A51] border-[#15919B]/30 pl-8 text-gray-300 placeholder:text-gray-400 focus:border-[#46DFB1] focus:ring-1 focus:ring-[#46DFB1]"
      />
    </div>
  );
}