import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/Authentication/AuthContext';
import { collection, query, where, addDoc, onSnapshot, getDocs, orderBy, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db } from '@/components/firebase';
import { Loader2, Image as ImageIcon, X, XCircle } from 'lucide-react';
import { toast } from "sonner";

// Interval to update user activity status (in milliseconds)
const ACTIVITY_UPDATE_INTERVAL = 60 * 1000; // 1 minute

const ChatPage = () => {
  const { 
    user, 
    getUserIdFromCookie, 
    getUserNameFromCookie 
  } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [viewImage, setViewImage] = useState(null);
  // Get the userId from cookie or from user object or default to 2
  const userId = getUserIdFromCookie() || user?.id || 2;
  const userName = getUserNameFromCookie() || user?.name;
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
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

  // Get the room for current user and update user info if needed
  useEffect(() => {
    // Use the userId from the authenticated user
    const fetchUserRoom = async () => {
      const roomsRef = collection(db, "room");
      const q = query(roomsRef, where("userId", "==", userId));
      const roomSnapshot = await getDocs(q);
      
      if (!roomSnapshot.empty) {
        const roomId = roomSnapshot.docs[0].id;
        const roomData = roomSnapshot.docs[0].data();
        setCurrentRoomId(roomId);
        
        // Update room with current user name if it's different
        if (roomData.userName !== userName && userName) {
          console.log(`Updating room user name from ${roomData.userName} to ${userName}`);
          const roomRef = doc(db, "room", roomId);
          await updateDoc(roomRef, { 
            userName: userName 
          });
        }
        
        // Update lastActivity timestamp to show user is online
        const roomRef = doc(db, "room", roomId);
        await updateDoc(roomRef, {
          lastActivity: serverTimestamp()
        });
      }
    };

    fetchUserRoom();
  }, [userId, userName]);

  // Add this useEffect to load messages for the current room
  useEffect(() => {
    if (!currentRoomId) return;

    const q = query(
      collection(db, "message"),
      where("roomId", "==", currentRoomId),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messageData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(messageData);
    });

    return () => unsubscribe();
  }, [currentRoomId]);

  // Periodically update user's activity status
  useEffect(() => {
    if (!currentRoomId) return;
    
    // Update once immediately when component mounts
    const updateActivity = async () => {
      try {
        const roomRef = doc(db, "room", currentRoomId);
        await updateDoc(roomRef, {
          lastActivity: serverTimestamp()
        });
      } catch (error) {
        console.error("Error updating activity status:", error);
      }
    };
    
    // Call immediately
    updateActivity();
    
    // Set up interval to update periodically
    const intervalId = setInterval(updateActivity, ACTIVITY_UPDATE_INTERVAL);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [currentRoomId]);
  
  // Update activity on user interaction
  const updateUserActivity = async () => {
    if (!currentRoomId) return;
    
    try {
      const roomRef = doc(db, "room", currentRoomId);
      await updateDoc(roomRef, {
        lastActivity: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating activity status:", error);
    }
  };
  
  // Track user activity on various events
  useEffect(() => {
    // Events to track
    const activityEvents = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    
    // Debounce function to avoid too many updates
    let timeout = null;
    
    const handleActivity = () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      
      timeout = setTimeout(() => {
        updateUserActivity();
        timeout = null;
      }, 1000); // 1 second debounce
    };
    
    // Add event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });
    
    // Clean up
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [currentRoomId]);

  // Update activity on page unload
  useEffect(() => {
    // Function to update lastActivity to null when user leaves
    const handleBeforeUnload = async () => {
      try {
        if (currentRoomId) {
          // Make a synchronous request to update lastActivity
          navigator.sendBeacon(
            `/api/update-activity?roomId=${currentRoomId}&status=offline`,
            JSON.stringify({ userId, status: 'offline' })
          );
          console.log("Set user offline status on page unload");
        }
      } catch (error) {
        console.error("Failed to update offline status:", error);
      }
    };

    // Add event listener for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Clean up
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Also try to update status when component unmounts
      if (currentRoomId) {
        const roomRef = doc(db, "room", currentRoomId);
        updateDoc(roomRef, { 
          lastActivity: null 
        }).catch(err => console.error("Error setting offline status:", err));
      }
    };
  }, [currentRoomId, userId]);

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || isSending) return;

    try {
      setIsSending(true);
      console.log("Sending message as:", { userId, userName });

      // Check if room exists for this user
      const roomsRef = collection(db, "room");
      const q = query(roomsRef, where("userId", "==", userId));
      const roomSnapshot = await getDocs(q);
  
      let roomId;
      
      if (roomSnapshot.empty) {
        // Create new room if it doesn't exist
        const roomDoc = await addDoc(collection(db, "room"), {
          userId: userId,
          userName: userName,
          createdAt: serverTimestamp(),
          lastMessage: selectedImage ? "Đã gửi một hình ảnh" : newMessage,
          lastMessageTime: serverTimestamp(),
          lastActivity: serverTimestamp() // Set initial activity
        });
        roomId = roomDoc.id;
        setCurrentRoomId(roomId);
      } else {
        roomId = roomSnapshot.docs[0].id;
        // Update existing room's last message
        const roomRef = doc(db, "room", roomId);
        await updateDoc(roomRef, {
          lastMessage: selectedImage ? "Đã gửi một hình ảnh" : userName + ": " + newMessage,
          lastMessageTime: serverTimestamp(),
          lastActivity: serverTimestamp() // Update activity when sending message
        });
      }
  
      // Create new message
      const newMsg = {
        userId: userId,
        userName: userName,
        content: newMessage,
        timestamp: serverTimestamp(),
        type: selectedImage ? "image" : "text",
        roomId: roomId,
        imageUrl: imagePreview // Use the image preview directly
      };
  
      await addDoc(collection(db, `message`), newMsg);
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

  return (
    <div className="flex h-[calc(100vh-132px)] bg-[#0a0a14] relative">
      {/* Sidebar */}
      <div className="w-80 border-r border-[#1C1C28] bg-[#0E0E15] p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white mb-2">Hỗ trợ trực tuyến</h2>
          <p className="text-sm text-[#808191]">Thời gian hỗ trợ: 8:00 - 17:00</p>
        </div>
        
        <div className="space-y-2">
          <div className="bg-[#1C1C28] rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#26A65B] rounded-full"></div>
              <span className="text-sm text-white">Đang hoạt động</span>
            </div>
          </div>
          
          <div className="bg-[#1C1C28] rounded-lg p-3">
            <h3 className="text-sm font-medium text-white mb-1">Thông tin hỗ trợ</h3>
            <p className="text-xs text-[#808191]">Email: support@example.com</p>
            <p className="text-xs text-[#808191]">Hotline: 1900 xxxx</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="h-16 border-b border-[#1C1C28] px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 text-primary">
              <AvatarImage src="/avatars/support.png" />
              <AvatarFallback>HT</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-sm text-left font-medium text-white">Hỗ trợ viên</h3>
              <div className="flex items-center gap-2">
                <p className="text-xs text-[#26A65B]">Đang hoạt động</p>
                <span className="text-xs text-[#808191]">·</span>
                <p className="text-xs text-[#808191]">ID của bạn: {userId}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.userId === userId ? 'flex-row-reverse' : ''
              }`}
            >
              <Avatar className="h-8 w-8 shrink-0 text-primary">
                <AvatarImage src={message.avatar} />
                <AvatarFallback>{message.userName?.[0] || "U"}</AvatarFallback>
              </Avatar>
              
              <div className={`flex flex-col ${
                message.userId === userId ? 'items-end' : ''
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white">
                    {message.userName}
                  </span>
                  <span className="text-xs text-[#808191]">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
                
                <div className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.userId === userId
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
                    <p className="text-sm text-left">{message.content}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-[#808191]">
              <div className="animate-bounce">●</div>
              <div className="animate-bounce delay-100">●</div>
              <div className="animate-bounce delay-200">●</div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
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
        <form 
          onSubmit={handleSendMessage}
          className="h-20 border-t border-[#1C1C28] p-4 flex items-center gap-4"
        >
          <div className="flex-1 flex items-center gap-2">
            <Input
              type="text"
              placeholder="Nhập tin nhắn..."
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                // Update activity when user is typing
                if (e.target.value.trim() !== newMessage.trim()) {
                  updateUserActivity();
                }
              }}
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
};

export default ChatPage; 