import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Search, Send, Image as ImageIcon, Loader2, XCircle, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { collection, query, where, addDoc, onSnapshot, getDocs, orderBy, serverTimestamp, doc, updateDoc, Timestamp, limit } from "firebase/firestore";
import { useAuth } from '@/Authentication/AuthContext';
import { db } from '@/components/firebase';
import { toast } from "sonner";

// Constants for activity tracking
const ACTIVITY_TIMEOUT = 2 * 60 * 1000; // 2 minutes in milliseconds (giảm từ 5 phút)

export default function StaffChatPage() {
  const [rooms, setRooms] = useState(null);
  const [filteredRooms, setFilteredRooms] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null); 
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [viewImage, setViewImage] = useState(null);
  const fileInputRef = useRef(null);
  const { 
    user,
    getUserIdFromCookie, 
    getUserNameFromCookie,
    getUserRoleFromCookie
  } = useAuth();
  const messagesEndRef = useRef(null);
  
  // Get authenticated user information from cookies
  const staffId = getUserIdFromCookie() || user?.id;
  const staffName = "Staff"; // Always use "Staff" as the name
  const staffRole = getUserRoleFromCookie() || user?.role || "staff";

  // Thêm state cho tin nhắn mới
  const [newMessageNotifications, setNewMessageNotifications] = useState({});
  const [showNotification, setShowNotification] = useState(false);
  const [latestNotification, setLatestNotification] = useState(null);
  const notificationTimeoutRef = useRef(null);
  const soundRef = useRef(new Audio("/sounds/notification.mp3"));

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  };

  // Add effect to scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
    // Thêm timeout để đảm bảo cuộn xuống tin nhắn mới nhất
    const timeout = setTimeout(scrollToBottom, 300);
    return () => clearTimeout(timeout);
  }, [messages]);

  // Helper function to format Firebase Timestamp to readable time
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    // Check if it's a Firebase Timestamp
    if (timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return timestamp;
  };

  // Helper function to format date
  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return '';
    
    const date = new Date(timestamp.seconds * 1000);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    }
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Helper function to format timestamp for chat list
  const formatLastMessageTime = (timestamp) => {
    if (!timestamp?.seconds) return '';
    
    const messageDate = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      // If less than 24 hours, show time
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      // If yesterday
      return 'Hôm qua';
    } else {
      // If older, show date
      return messageDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    }
  };

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
      if (!message.timestamp) return;
      const date = new Date(message.timestamp.seconds * 1000).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };
  
  //Real time chat rooms
  useEffect(() => {
    let unsubscribe = null;
    try {
      const q = query(collection(db, "room"));
      unsubscribe = onSnapshot(q, (querySnapshot) => {
        // Map room data and update state
        const roomData = querySnapshot.docs.map((doc) => ({
          id: doc.id, // Store Firestore 
          ...doc.data(), // Spread all room data
        }));
        
        // Check for user activity status
        const enhancedRoomData = roomData.map(room => {
          // Check if room has lastActivity data
          let lastActivity = null;
          try {
            lastActivity = room.lastActivity?.toDate ? new Date(room.lastActivity.toDate()) : null;
          } catch (error) {
            console.error(`Error converting lastActivity for room ${room.id}:`, error);
          }
          
          const now = new Date();
          
          // Format last activity time for better debugging
          const formattedLastActivity = lastActivity 
            ? `${lastActivity.toLocaleDateString()} ${lastActivity.toLocaleTimeString()}`
            : 'không có';
          
          // Calculate time difference in milliseconds
          const timeDiff = lastActivity ? (now.getTime() - lastActivity.getTime()) : Infinity;
          
          // Consider user online if they were active in the last timeout period
          const isOnline = !!lastActivity && (timeDiff < ACTIVITY_TIMEOUT);
          
          // Log for debugging
          console.log(`Room ${room.id} - User ${room.userId || 'không xác định'} - Hoạt động gần nhất: ${formattedLastActivity} - Thời gian: ${Math.floor(timeDiff / 1000)}s - Trạng thái: ${isOnline ? 'online' : 'offline'}`);
          
          return {
            ...room,
            online: isOnline
          };
        });
        
        setRooms(enhancedRoomData);
      });
    } catch (error) {
      console.error("Error setting up room listener:", error);
    }
    
    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.error("Error cleaning up room listener:", error);
        }
      }
    }
  }, []);
  
  //Load message for selected room
  useEffect(() => {
    let unsubscribe = null;
    
    if (!selectedRoom) return;
    
    try {
      // Query messages for specific room, ordered by timestamp
      const q = query(
        collection(db, "message"), 
        where("roomId", "==", selectedRoom.id),
        orderBy("timestamp", "asc")
      );
      //Update messages state when new messages are added
      unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messageData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(messageData);
      });
    } catch (error) {
      console.error("Error setting up message listener:", error);
    }
    
    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.error("Error cleaning up message listener:", error);
        }
      }
    }
  }, [selectedRoom]);
  

  //Get Rooms from firebase 
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get list of rooms
        const roomSnapshot = await getDocs(collection(db, "room"));
        const roomData = roomSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRooms([...roomData]);

        // Get messages after get rooms
        const messageSnapshot = await getDocs(collection(db, "message"));
        const messageData = messageSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(messageData);
        console.log("Messages:", messageData);
      } catch (error) {
        console.error("Lỗi khi fetch dữ liệu:", error);
      }
    };

    fetchData();
  }, []);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    fileInputRef.current.value = '';
  };

  //Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || !selectedRoom || isSending) return;

    try {
      setIsSending(true);

      // Create new message
      const newMsg = {
        userId: staffId,
        userName: staffName,
        content: newMessage,
        timestamp: serverTimestamp(),
        type: selectedImage ? "image" : "text",
        roomId: selectedRoom.id,
        imageUrl: imagePreview // Use the image preview directly
      };
  
      // Add message to Firestore collection 'message'
      await addDoc(collection(db, "message"), newMsg);
      
      // Update room's lastMessage and lastMessageTime
      const roomRef = doc(db, "room", selectedRoom.id);
      await updateDoc(roomRef, {
        lastMessage: selectedImage ? "Đã gửi một hình ảnh" : "Staff: " + newMessage,
        lastMessageTime: serverTimestamp()
      });

      setNewMessage(""); // Clear input after sending
      setSelectedImage(null); // Clear selected image
      setImagePreview(null); // Clear image preview
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Scroll to the bottom after sending a message
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error('Không thể gửi tin nhắn. Vui lòng thử lại');
    } finally {
      setIsSending(false);
    }
  };

  // Add useEffect to handle search filtering
  useEffect(() => {
    if (!rooms) return;
    
    if (!searchTerm.trim()) {
      setFilteredRooms(rooms);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase().trim();
    const filtered = rooms.filter(room => {
      // Filter by userId (convert to string first to handle numeric userId)
      if (room.userId && room.userId.toString().includes(searchTermLower)) {
        return true;
      }
      // Also allow filtering by userName as fallback
      if (room.userName && room.userName.toLowerCase().includes(searchTermLower)) {
        return true;
      }
      return false;
    });
    setFilteredRooms(filtered);
  }, [searchTerm, rooms]);

  // Add debounced search handler
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const handleViewImage = (imageUrl) => {
    if (imageUrl) {
      setViewImage(imageUrl);
      document.body.style.overflow = 'hidden'; // Prevent scrolling when dialog is open
    }
  };

  const closeImageView = (e) => {
    if (e) e.stopPropagation();
    setViewImage(null);
    document.body.style.overflow = 'auto'; // Restore scrolling when dialog is closed
  };

  // Thêm hàm xử lý tin nhắn mới
  const handleNewMessage = (roomId, message, roomInfo) => {
    // Chỉ hiển thị thông báo khi tin nhắn từ người dùng và không phải phòng chat đang chọn
    if (message.userId !== staffId && (!selectedRoom || selectedRoom.id !== roomId)) {
      // Cập nhật state notifications
      setNewMessageNotifications(prev => ({
        ...prev,
        [roomId]: (prev[roomId] || 0) + 1
      }));
      
      // Hiển thị thông báo mới nhất
      setLatestNotification({
        roomId,
        userName: roomInfo.userName || "Người dùng",
        content: message.type === 'image' ? 'Đã gửi một hình ảnh' : message.content,
        timestamp: new Date()
      });
      
      setShowNotification(true);
      
      // Phát âm thanh thông báo
      try {
        soundRef.current.play().catch(err => console.log('Không thể phát âm thanh:', err));
      } catch (error) {
        console.log('Lỗi khi phát âm thanh:', error);
      }
      
      // Tự động ẩn sau 5 giây
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
      
      notificationTimeoutRef.current = setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }
  };

  // Cập nhật effect cho tin nhắn
  useEffect(() => {
    if (!rooms) return;
    
    // Lắng nghe tin nhắn mới cho tất cả phòng chat
    const messageListeners = [];
    
    try {
      rooms.forEach(room => {
        const q = query(
          collection(db, "message"),
          where("roomId", "==", room.id),
          orderBy("timestamp", "desc"),
          // Chỉ lấy 1 tin nhắn mới nhất
          limit(1)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const message = { id: change.doc.id, ...change.doc.data() };
              // Kiểm tra timestamp để đảm bảo là tin nhắn mới
              if (message.timestamp && Date.now() - message.timestamp.toDate().getTime() < 10000) {
                handleNewMessage(room.id, message, room);
              }
            }
          });
        });
        
        messageListeners.push(unsubscribe);
      });
    } catch (error) {
      console.error("Error setting up notification listeners:", error);
    }
    
    // Cleanup listeners khi component bị unmount
    return () => {
      messageListeners.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.error("Error cleaning up notification listener:", error);
        }
      });
      
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, [rooms, selectedRoom]);

  // Reset thông báo khi chọn phòng chat
  useEffect(() => {
    if (selectedRoom) {
      // Xóa thông báo của phòng chat đã chọn
      setNewMessageNotifications(prev => {
        const updated = { ...prev };
        delete updated[selectedRoom.id];
        return updated;
      });
      
      // Ẩn thông báo nếu nó đang hiển thị cho phòng chat đã chọn
      if (latestNotification && latestNotification.roomId === selectedRoom.id) {
        setShowNotification(false);
      }
    }
  }, [selectedRoom]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col h-[calc(90vh-4rem)]">
        <div className="grid grid-cols-12 gap-6 bg-[#0a0a14] rounded-lg border border-[#1C1C28] h-full">
          {/* Chat List */}
          <div className="col-span-4 border-r border-[#1C1C28] flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-[#1C1C28] shrink-0">
              <div className="flex items-center gap-3">
                <h4 className="text-xl font-semibold text-white">Chat với khách hàng</h4>
                <MessageSquare className="h-5 w-5 text-[#808191]" />
              </div>
              <div className="relative mt-4">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-[#808191]" />
                <Input
                  placeholder="Tìm kiếm theo ID hoặc tên..."
                  className="pl-8 bg-[#1C1C28] border-[#333] text-white placeholder:text-[#808191]"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-2 p-4">
                {filteredRooms && filteredRooms.length > 0 ? (
                  filteredRooms.map((room) => (
                    <div
                      key={room.roomId}
                      className={`flex items-center text-white gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedRoom?.id === room.id ? 'bg-[#26A65B] hover:bg-[#219150]' : 'hover:bg-[#1C1C28]'
                      }`}
                      onClick={() => setSelectedRoom(room)}
                    >
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={room.avatar} />
                          <AvatarFallback className="bg-[#1C1C28]">{room.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {room.online && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-[#0a0a14]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{room.userName}</p>
                          <span className="text-xs text-[#808191]">
                            {formatLastMessageTime(room.lastMessageTime) || '12:00'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-1">
                            
                            <p className="text-sm text-[#808191] truncate max-w-[200px] overflow-hidden text-ellipsis">
                              {room.lastMessage || 'Chưa có tin nhắn'}
                            </p>
                          </div>
                          {newMessageNotifications[room.id] > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#26A65B] text-xs text-white">
                              {newMessageNotifications[room.id]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-[#808191]">
                      {searchTerm ? 'Không tìm thấy người dùng nào' : 'Không có cuộc trò chuyện nào'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat Box */}
          <div className="col-span-8 flex flex-col h-full overflow-hidden">
            {selectedRoom ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-[#1C1C28] flex items-center justify-between bg-[#0a0a14] shrink-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedRoom.avatar} />
                      <AvatarFallback className="bg-[#1C1C28] text-white">{selectedRoom.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-left text-white">{selectedRoom.userName}</h3>
                      <div className="flex items-center gap-1.5">
                        {selectedRoom.online && (
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                        )}
                        <p className="text-xs text-[#808191]">
                          {selectedRoom.online ? 'Đang hoạt động' : 'Không hoạt động'} · ID: {selectedRoom.userId}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    {Object.entries(groupMessagesByDate(messages)).map(([date, dateMessages]) => (
                      <div key={date} className="space-y-4">
                        <div className="flex items-center justify-center">
                          <div className="bg-[#1C1C28] text-[#808191] px-3 py-1 rounded-full text-sm">
                            {formatDate(dateMessages[0].timestamp)}
                          </div>
                        </div>
                        {dateMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex items-start gap-3 ${
                              message.userId === staffId ? 'flex-row-reverse' : ''
                            }`}
                          >
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage src={message.avatar} />
                              <AvatarFallback className="bg-[#1C1C28] text-white">{message.userName?.[0] || "U"}</AvatarFallback>
                            </Avatar>
                            
                            <div className={`flex flex-col ${
                              message.userId === staffId ? 'items-end' : ''
                            }`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-[#808191]">
                                  {message.userId === staffId ? "Staff" : message.userName}
                                </span>
                                <span className="text-xs text-[#808191]">
                                  {formatTimestamp(message.timestamp)}
                                </span>
                              </div>
                              
                              <div className={`rounded-lg px-4 py-2 max-w-[80%] ${
                                message.userId === staffId
                                  ? 'bg-[#26A65B] text-white'
                                  : 'bg-[#1C1C28] text-white'
                              }`}>
                                {message.type === 'image' ? (
                                  <div 
                                    className="relative group cursor-pointer"
                                    onClick={() => handleViewImage(message.imageUrl)}
                                  >
                                    <img 
                                      src={message.imageUrl} 
                                      alt="Shared" 
                                      className="max-w-full max-h-[300px] rounded-lg object-contain"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                                      <span className="text-white opacity-0 group-hover:opacity-100 transition-all duration-200 text-sm font-medium">
                                        Xem ảnh đầy đủ
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-left break-words">{message.content}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Selected Image Preview */}
                {imagePreview && (
                  <div className="px-4 pt-2">
                    <div className="bg-[#1C1C28] rounded-lg p-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="relative w-14 h-14 overflow-hidden rounded-md">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-sm text-white">Ảnh đã chọn</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-[#2A2A3C] rounded-full p-1"
                        onClick={removeSelectedImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <div className="p-4 border-t border-[#1C1C28] bg-[#0a0a14] shrink-0">
                  <form 
                    onSubmit={handleSendMessage}
                    className="flex items-center gap-4"
                  >
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        type="text"
                        placeholder="Nhập tin nhắn..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 bg-[#1C1C28] border-[#333] text-white placeholder:text-[#808191]"
                        disabled={isSending}
                      />
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-[#808191] hover:text-white hover:bg-[#1C1C28]"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSending}
                      >
                        <ImageIcon className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    <Button 
                      type="submit"
                      className="bg-[#26A65B] hover:bg-[#219150] text-white px-6 min-w-[100px]"
                      disabled={isSending || (!newMessage.trim() && !selectedImage)}
                    >
                      {isSending ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Đang gửi...</span>
                        </div>
                      ) : (
                        'Gửi'
                      )}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center bg-[#0a0a14]">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-[#808191]" />
                  <h3 className="mt-4 text-lg font-medium text-white">Chưa có cuộc trò chuyện nào được chọn</h3>
                  <p className="mt-1 text-sm text-[#808191]">
                    Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image View Dialog */}
      {viewImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
          onClick={closeImageView} // Close when clicking outside the image
          onKeyDown={(e) => e.key === 'Escape' && closeImageView(e)}
          tabIndex={0}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image
          >
            <img 
              src={viewImage} 
              alt="Full view" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <button
              type="button"
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white hover:bg-opacity-70 rounded-full p-2 transition-all"
              onClick={closeImageView}
              aria-label="Close image view"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 
