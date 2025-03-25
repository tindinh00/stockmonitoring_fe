import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/Authentication/AuthContext';
import { collection, query, where, addDoc, onSnapshot,getDocs, orderBy, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db } from '@/components/firebase';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from "sonner";

const ChatPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const userId = 2; // Your userId
  const userName = "Customer1"; // Your userName
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

  // Get the room for current user
  useEffect(() => {
    const userId = 2; // Same as in handleSendMessage
    
    const fetchUserRoom = async () => {
      const roomsRef = collection(db, "room");
      const q = query(roomsRef, where("userId", "==", userId));
      const roomSnapshot = await getDocs(q);
      
      if (!roomSnapshot.empty) {
        setCurrentRoomId(roomSnapshot.docs[0].id);
      }
    };

    fetchUserRoom();
  }, []);

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

  const uploadImage = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('https://stockmonitoring.onrender.com/api/Images/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      if (data.value) {
        return data.value;
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || isSending) return;

    try {
      setIsSending(true);

      let imageUrl = null;
      if (selectedImage) {
        try {
          imageUrl = await uploadImage(selectedImage);
          if (!imageUrl) {
            toast.error('Không thể tải ảnh lên. Vui lòng thử lại');
            return;
          }
        } catch (error) {
          toast.error('Lỗi khi tải ảnh lên. Vui lòng thử lại');
          return;
        }
      }
      
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
        });
        roomId = roomDoc.id;
      } else {
        roomId = roomSnapshot.docs[0].id;
        // Update existing room's last message
        const roomRef = doc(db, "room", roomId);
        await updateDoc(roomRef, {
          lastMessage: selectedImage ? "Đã gửi một hình ảnh" : userName +": "+ newMessage,
          lastMessageTime: serverTimestamp()
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
        imageUrl: imageUrl // Use the uploaded image URL
      };
  
      await addDoc(collection(db, `message`), newMsg);
      setNewMessage(""); // Clear input after sending
      setSelectedImage(null); // Clear selected image
      setImagePreview(null); // Clear image preview
      setUploadedImageUrl(null); // Clear uploaded image URL
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error('Không thể gửi tin nhắn. Vui lòng thử lại');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-132px)] bg-[#0a0a14]">
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
              <p className="text-xs text-[#26A65B]">Đang hoạt động</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.userName === userName ? 'flex-row-reverse' : ''
              }`}
            >
              <Avatar className="h-8 w-8 shrink-0 text-primary">
                <AvatarImage src={message.avatar} />
                <AvatarFallback>{message.userName[0]}</AvatarFallback>
              </Avatar>
              
              <div className={`flex flex-col ${
                message.userName === userName ? 'items-end' : ''
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
                  message.userName === userName
                    ? 'bg-[#26A65B] text-white'
                    : 'bg-[#1C1C28] text-white'
                }`}>
                  {message.type === 'image' ? (
                    <div className="relative group">
                      <img 
                        src={message.imageUrl} 
                        alt="Shared" 
                        className="max-w-full rounded-lg cursor-pointer"
                        onClick={() => window.open(message.imageUrl, '_blank')}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                          Click để xem
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
          
          {imagePreview && (
            <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 bg-[#1C1C28] p-4 rounded-lg shadow-lg border border-[#333] w-[90%] max-w-[500px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white text-sm">Ảnh đã chọn</span>
                    <span className="text-[#808191] text-xs">Click vào nút gửi để chia sẻ ảnh</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-[#2A2A3C]"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                >
                  Xóa
                </Button>
              </div>
            </div>
          )}
          
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
    </div>
  );
};

export default ChatPage; 