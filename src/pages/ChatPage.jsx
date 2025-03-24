import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/Authentication/AuthContext';
import { collection, query, where, addDoc, onSnapshot,getDocs, orderBy, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db } from '@/components/firebase';
const ChatPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
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
          lastMessage: newMessage,
          lastMessageTime: serverTimestamp(),
        });
        roomId = roomDoc.id;
      } else {
        roomId = roomSnapshot.docs[0].id;
        // Update existing room's last message
        const roomRef = doc(db, "room", roomId);
        await updateDoc(roomRef, {
          lastMessage: userName +": "+ newMessage,
          lastMessageTime: serverTimestamp()
        });
      }
  
      // Create new message
      const newMsg = {
        userId: userId,
        userName: userName,
        content: newMessage,
        timestamp: serverTimestamp(),
        type: "text",
        roomId: roomId,
      };
  
      await addDoc(collection(db, `message`), newMsg);
      setNewMessage(""); // Clear input after sending
    } catch (error) {
      console.error("Error sending message: ", error);
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
              <h3 className="text-sm font-medium text-white">Hỗ trợ viên</h3>
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
                  <p className="text-sm">{message.content}</p>
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
          <Input
            type="text"
            placeholder="Nhập tin nhắn..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-[#1C1C28] border-[#333] text-white placeholder:text-[#808191]"
          />
          <Button 
            type="submit"
            className="bg-[#26A65B] hover:bg-[#219150] text-white px-6"
          >
            Gửi
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage; 