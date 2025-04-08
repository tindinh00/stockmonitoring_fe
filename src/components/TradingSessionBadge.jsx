import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

const TradingSessionBadge = () => {
  const [sessionStatus, setSessionStatus] = useState({
    isInSession: false,
    message: 'Hết giờ',
    color: 'bg-gray-100 text-gray-600'
  });

  useEffect(() => {
    const checkTradingSession = () => {
      const now = new Date();
      const currentTime = now.getHours() * 100 + now.getMinutes();
      
      // Check if it's a weekday (1-5)
      const isWeekday = now.getDay() !== 0 && now.getDay() !== 6;
      
      // Morning session: 9:00 - 11:30
      const isMorningSession = currentTime >= 900 && currentTime <= 1130;
      
      // Afternoon session: 13:00 - 15:00
      const isAfternoonSession = currentTime >= 1300 && currentTime <= 1500;
      
      if (isWeekday && (isMorningSession || isAfternoonSession)) {
        setSessionStatus({
          isInSession: true,
          message: 'Đang giao dịch',
          color: 'bg-green-100 text-green-700 border border-green-200'
        });
      } else {
        setSessionStatus({
          isInSession: false,
          message: 'Hết giờ',
          color: 'bg-red-100 text-red-700 border border-red-200'
        });
      }
    };

    // Check immediately
    checkTradingSession();

    // Check every minute
    const interval = setInterval(checkTradingSession, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center">
      {/* Mobile version - just icon */}
      <div className="sm:hidden">
        <Badge 
          className={`flex items-center justify-center w-8 h-8 rounded-full ${sessionStatus.color}`}
          title={sessionStatus.message}
        >
          <Clock className="w-4 h-4" />
        </Badge>
      </div>

      {/* Tablet version - icon + short text */}
      <div className="hidden sm:flex md:hidden">
        <Badge 
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${sessionStatus.color}`}
        >
          <Clock className="w-3.5 h-3.5" />
          {sessionStatus.isInSession ? 'Đang giao dịch' : 'Hết giờ'}
        </Badge>
      </div>

      {/* Desktop version - full text */}
      <div className="hidden md:flex">
        <Badge 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${sessionStatus.color}`}
        >
          <Clock className="w-3.5 h-3.5" />
          {sessionStatus.message}
        </Badge>
      </div>
    </div>
  );
};

export default TradingSessionBadge; 