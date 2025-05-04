import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { X } from 'lucide-react';
import { db } from '@/components/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '@/Authentication/AuthContext';

// Đặt chế độ test thành false để bong bóng chỉ hiển thị khi có tin nhắn thực
const TestMode = false; 

export default function ChatNotification() {
  const { user, getUserIdFromCookie } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Lấy staffId từ cookie hoặc user object
  const staffId = getUserIdFromCookie() || user?.id;
  const [showNotification, setShowNotification] = useState(false);
  const [latestNotification, setLatestNotification] = useState(null);
  const notificationTimeoutRef = useRef(null);
  const soundRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // Kiểm tra nếu người dùng đang ở trang chat
  const isOnChatPage = location.pathname.includes('/staff/chat');
  
  // Khởi tạo audio riêng biệt khi cần
  useEffect(() => {
    soundRef.current = new Audio("/sounds/notification.mp3");
    return () => {
      if (soundRef.current) {
        soundRef.current.pause();
        soundRef.current = null;
      }
    };
  }, []);

  // Lắng nghe tin nhắn mới từ tất cả các phòng chat với cách tiếp cận đơn giản hơn
  useEffect(() => {
    if (!staffId || TestMode) return;
    
    try {
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        } catch (err) {
          console.error("Error when unsubscribing previous listener:", err);
        }
      }
      
      const messagesQuery = query(
        collection(db, "message"),
        orderBy("timestamp", "desc"),
        limit(3)
      );

      const unsubscribe = onSnapshot(
        messagesQuery, 
        { includeMetadataChanges: false },
        (snapshot) => {
          if (isOnChatPage) return; // Không xử lý nếu đang ở trang chat
          
          try {
            snapshot.docChanges().forEach((change) => {
              if (change.type === "added") {
                const message = change.doc.data();
                const now = Date.now();
                const messageTime = message.timestamp?.toDate?.() || new Date();
                
                // Chỉ xử lý tin nhắn trong 5 giây gần đây
                if ((now - messageTime.getTime()) < 5000 && message.userId !== staffId) {
                  handleNewMessage(
                    message.roomId,
                    message.userName || "Người dùng",
                    message.type === 'image' ? 'Đã gửi một hình ảnh' : message.content
                  );
                }
              }
            });
          } catch (error) {
            console.log("Error processing messages:", error);
          }
        },
        (error) => {
          console.error("Error in messages listener:", error);
        }
      );
      
      unsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error("Error setting up message listener:", error);
    }

    // Cleanup khi component unmount
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
        notificationTimeoutRef.current = null;
      }
      
      // Đảm bảo hủy listener một cách an toàn
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        } catch (err) {
          console.error("Error cleaning up listener:", err);
        }
      }
    };
  }, [staffId, isOnChatPage]);

  // Đơn giản hóa hàm xử lý tin nhắn mới
  const handleNewMessage = (roomId, userName, content) => {
    // Bỏ qua nếu đang ở trang chat
    if (isOnChatPage) return;
    
    // Tạo thông báo mới
    const notificationData = {
      roomId,
      userName: userName || "Người dùng",
      content: content || "Tin nhắn mới",
      timestamp: new Date()
    };
    
    setLatestNotification(notificationData);
    setShowNotification(true);
    
    // Phát âm thanh nếu có
    if (soundRef.current) {
      try {
        soundRef.current.play().catch(err => {
          // Bỏ qua lỗi phát âm thanh
        });
      } catch (error) {
        // Bỏ qua lỗi phát âm thanh
      }
    }
    
    // Tự động ẩn sau 5 giây
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    
    notificationTimeoutRef.current = setTimeout(() => {
      setShowNotification(false);
    }, 5000);
  };

  // Xử lý khi người dùng nhấp vào thông báo
  const handleNotificationClick = () => {
    if (latestNotification) {
      navigate('/staff/chat');
      setShowNotification(false);
    }
  };

  // Tắt nút X
  const handleCloseNotification = (e) => {
    if (e) e.stopPropagation();
    setShowNotification(false);
  };

  // Hiển thị thông báo dựa vào các điều kiện
  if (TestMode) {
    const testNotification = {
      roomId: "test-room",
      userName: "Người dùng Test",
      content: "Đây là tin nhắn test",
      timestamp: new Date()
    };
    return renderNotification(testNotification, handleNotificationClick, handleCloseNotification);
  } else if (isOnChatPage || !showNotification || !latestNotification) {
    return null;
  }
  
  return renderNotification(latestNotification, handleNotificationClick, handleCloseNotification);
}

// Tách hàm render ra để code gọn hơn
function renderNotification(notification, onClick, onClose) {
  return (
    <div className="fixed bottom-5 right-5 z-50 animate-slide-up">
      <div 
        className="bg-[#0a0a14] border border-[#26A65B] rounded-lg shadow-lg p-4 max-w-xs cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-start gap-3 mb-1">
          <div className="shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-[#1C1C28] text-white">
                {notification.userName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-white">{notification.userName}</h4>
              <button 
                className="text-[#808191] hover:text-white"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-[#B4B4C0] line-clamp-2">{notification.content}</p>
            <span className="text-xs text-[#808191] mt-1 block">
              {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 