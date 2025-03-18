import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Database, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  RefreshCcw,
  Settings
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data for scrapers
const mockScrapers = [
  {
    id: 1,
    name: "TCBS Data Scraper",
    source: "TCBS",
    status: "running",
    lastRun: new Date(),
    nextRun: new Date(Date.now() + 3600000),
    interval: "1 giờ",
    description: "Cào dữ liệu cổ phiếu từ TCBS"
  },
  {
    id: 2,
    name: "VNDirect Market Data",
    source: "VNDirect",
    status: "stopped",
    lastRun: new Date(Date.now() - 7200000),
    nextRun: null,
    interval: "30 phút",
    description: "Cào dữ liệu thị trường từ VNDirect"
  },
  {
    id: 3,
    name: "SSI Financial Data",
    source: "SSI",
    status: "error",
    lastRun: new Date(Date.now() - 3600000),
    nextRun: new Date(Date.now() + 1800000),
    interval: "2 giờ",
    description: "Cào dữ liệu tài chính từ SSI"
  }
];

export default function ScraperManagementPage() {
  const [scrapers, setScrapers] = useState(mockScrapers);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedScraper, setSelectedScraper] = useState(null);
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("0");
  const [seconds, setSeconds] = useState("0");

  const getStatusColor = (status) => {
    switch (status) {
      case "running":
        return "bg-green-500/10 text-green-500";
      case "stopped":
        return "bg-yellow-500/10 text-yellow-500";
      case "error":
        return "bg-red-500/10 text-red-500";
      default:
        return "";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "running":
        return <Play className="h-4 w-4" />;
      case "stopped":
        return <Pause className="h-4 w-4" />;
      case "error":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleStatusChange = (scraperId, newStatus) => {
    setScrapers(scrapers.map(scraper => 
      scraper.id === scraperId ? { 
        ...scraper, 
        status: newStatus,
        nextRun: newStatus === "running" ? new Date(Date.now() + 3600000) : null
      } : scraper
    ));
    
    toast.success(`Đã ${newStatus === "running" ? "bắt đầu" : "dừng"} scraper`, {
      position: "top-right",
      duration: 3000,
    });
  };

  const parseInterval = (intervalString) => {
    const hours = intervalString.match(/(\d+)\s*giờ/);
    const minutes = intervalString.match(/(\d+)\s*phút/);
    const seconds = intervalString.match(/(\d+)\s*giây/);
    
    return {
      hours: hours ? hours[1] : "0",
      minutes: minutes ? minutes[1] : "0",
      seconds: seconds ? seconds[1] : "0"
    };
  };

  const handleIntervalChange = () => {
    const interval = [];
    if (hours !== "0") interval.push(`${hours} giờ`);
    if (minutes !== "0") interval.push(`${minutes} phút`);
    if (seconds !== "0") interval.push(`${seconds} giây`);
    
    const newInterval = interval.join(" ");
    if (!newInterval) return;

    setScrapers(scrapers.map(scraper => 
      scraper.id === selectedScraper.id ? { ...scraper, interval: newInterval } : scraper
    ));
    setIsSettingsOpen(false);
    
    toast.success("Đã cập nhật thời gian chạy scraper", {
      position: "top-right",
      duration: 3000,
    });
  };

  const openSettings = (scraper) => {
    setSelectedScraper(scraper);
    const { hours: h, minutes: m, seconds: s } = parseInterval(scraper.interval);
    setHours(h);
    setMinutes(m);
    setSeconds(s);
    setIsSettingsOpen(true);
  };

  // Generate options for select boxes
  const hoursOptions = Array.from({ length: 24 }, (_, i) => i.toString());
  const minutesOptions = Array.from({ length: 60 }, (_, i) => i.toString());
  const secondsOptions = Array.from({ length: 60 }, (_, i) => i.toString());

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Quản lý Scraper</CardTitle>
              <CardDescription className="text-base mt-2">
                Quản lý và giám sát các tiến trình cào dữ liệu
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium text-left">Tên Scraper</TableHead>
                  <TableHead className="font-medium text-left">Nguồn</TableHead>
                  <TableHead className="font-medium text-left">Trạng thái</TableHead>
                  <TableHead className="font-medium text-left">Lần chạy cuối</TableHead>
                  <TableHead className="font-medium text-left">Lần chạy tiếp theo</TableHead>
                  <TableHead className="font-medium text-left">Chu kỳ</TableHead>
                  <TableHead className="font-medium text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scrapers.map((scraper) => (
                  <TableRow key={scraper.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        {scraper.name}
                      </div>
                    </TableCell>
                    <TableCell className='text-left'>{scraper.source}</TableCell>
                    <TableCell className='text-left'>
                      <Badge variant="outline" className={getStatusColor(scraper.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(scraper.status)}
                          <span>
                            {scraper.status === "running" && "Đang chạy"}
                            {scraper.status === "stopped" && "Đã dừng"}
                            {scraper.status === "error" && "Lỗi"}
                          </span>
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell className='text-left'>
                      {format(scraper.lastRun, "dd/MM/yyyy HH:mm", { locale: vi })}
                    </TableCell>
                    <TableCell className='text-left'>
                      {scraper.nextRun 
                        ? format(scraper.nextRun, "dd/MM/yyyy HH:mm", { locale: vi })
                        : "---"
                      }
                    </TableCell>
                    <TableCell className='text-left'>{scraper.interval}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openSettings(scraper)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(
                            scraper.id, 
                            scraper.status === "running" ? "stopped" : "running"
                          )}
                          className={
                            scraper.status === "running" 
                              ? "bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500"
                              : "bg-green-500/10 hover:bg-green-500/20 text-green-500"
                          }
                        >
                          {scraper.status === "running" ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cài đặt Scraper</DialogTitle>
            <DialogDescription>
              Điều chỉnh thời gian chạy cho scraper
            </DialogDescription>
          </DialogHeader>
          {selectedScraper && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Tên Scraper</h4>
                <p className="text-sm text-muted-foreground">{selectedScraper.name}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Chu kỳ chạy</h4>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select value={hours} onValueChange={setHours}>
                      <SelectTrigger>
                        <SelectValue placeholder="Giờ" />
                      </SelectTrigger>
                      <SelectContent>
                        {hoursOptions.map((hour) => (
                          <SelectItem key={hour} value={hour}>
                            {hour} giờ
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Select value={minutes} onValueChange={setMinutes}>
                      <SelectTrigger>
                        <SelectValue placeholder="Phút" />
                      </SelectTrigger>
                      <SelectContent>
                        {minutesOptions.map((minute) => (
                          <SelectItem key={minute} value={minute}>
                            {minute} phút
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Select value={seconds} onValueChange={setSeconds}>
                      <SelectTrigger>
                        <SelectValue placeholder="Giây" />
                      </SelectTrigger>
                      <SelectContent>
                        {secondsOptions.map((second) => (
                          <SelectItem key={second} value={second}>
                            {second} giây
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsSettingsOpen(false)}
            >
              Đóng
            </Button>
            <Button
              type="button"
              onClick={handleIntervalChange}
            >
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 