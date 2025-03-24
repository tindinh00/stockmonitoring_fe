import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Search, Send, Phone, Video, MoreVertical, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { collection, query, where, addDoc, onSnapshot,getDocs, orderBy, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { useAuth } from '@/Authentication/AuthContext';
import { db } from '@/components/firebase';

export default function StaffChatPage() {
  const [rooms, setRooms] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null); 
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Add effect to scroll to bottom when messages change
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
    const q = query(collection(db, "room"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      // Map room data and update state
      const roomData = querySnapshot.docs.map((doc) => ({
        id: doc.id, // Store Firestore 
        ...doc.data(), // Spread all room data
      }));
      setRooms(roomData);
    });
    return () => unsubscribe();// Cleanup 
  }, []);
  
  //Load message for selected room
  useEffect(() => {
    if (!selectedRoom) return;
    // Query messages for specific room, ordered by timestamp
    const q = query(
      collection(db, "message"), 
      where("roomId", "==", selectedRoom.id),
      orderBy("timestamp", "asc")
    );
    //Update messages state when new messages are added
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messageData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(messageData);
    });
    return () => unsubscribe();
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
  
  //Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !rooms) return;
  
    //Create Message to add to Firestore
    const newMsg = {
      userId: 2,
      userName: "staff",
      content: newMessage,
      timestamp: serverTimestamp(),
      type: "text",
      roomId: selectedRoom.id,  // Assign ID of room  
    };
  
    try {
      // Add message to Firestore collection 'message'
      await addDoc(collection(db, "message"), newMsg);
      // Update room's lastMessage and lastMessageTime
      const roomRef = doc(db, "room", selectedRoom.id);
      await updateDoc(roomRef, {
        lastMessage: newMessage,
        lastMessageTime: serverTimestamp()
      });
      setNewMessage(""); // Clear input after sending
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col">
        <div className="grid grid-cols-12 gap-6 bg-[#0a0a14] rounded-lg border border-[#ffffff] h-[calc(100vh-8rem)]">
          {/* Chat List */}
          <div className="col-span-4 border-r border-[#ffffff] flex flex-col">
            <div className="p-4 border-b border-[#ffffff]">
              <div className="flex items-center gap-3">
                <h4 className="text-2xl font-bold text-white">Chat với khách hàng</h4>
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div className="relative mt-4">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm cuộc trò chuyện..."
                  className="pl-8 bg-[#1C1C28] border-0 text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="space-y-2 p-4">
                {rooms && rooms.map((room) => (
                  <div
                    key={room.roomId}
                    className={`flex items-center text-white gap-3 p-3 rounded-lg cursor-pointer hover:bg-[#1C1C28] ${
                      selectedRoom?.id === room.id ? 'bg-[#1C1C28]' : ''
                    }`}
                    onClick={() => setSelectedRoom(room)}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={room.avatar} />
                        <AvatarFallback>{room.userName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {room.online && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-[#0a0a14]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{room.userName}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatLastMessageTime(room.lastMessageTime) || '12:00'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-muted-foreground truncate">
                          {room.lastMessage || 'Chưa có tin nhắn'}
                        </p>
                        {room.unread > 0 && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground ml-2">
                            {room.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Box */}
          <div className="col-span-8 flex flex-col h-full bg-[#0a0a14]">
            {selectedRoom ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-[#1C1C28] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedRoom.avatar} />
                      <AvatarFallback className='text-white'>{selectedRoom.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-white text-left">{selectedRoom.userName}</h3>
                      <div className="flex items-center gap-1.5">
                        {selectedRoom.online && (
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                        )}
                        <p className="text-xs text-muted-foreground">
                          {selectedRoom.online ? 'Đang hoạt động' : 'Không hoạt động'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col flex-1 bg-[#0a0a14]">
                  {/* Messages Container with White Background */}
                  <div className="flex-1 mx-4 my-4 bg-white rounded-lg overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 16rem)' }}>
                    {/* Messages Scroll Area */}
                    <ScrollArea className="flex-1 h-full overflow-y-auto pr-4" style={{ maxHeight: 'inherit' }}>
                      <div className="space-y-4 p-4">
                        {Object.entries(groupMessagesByDate(messages)).map(([date, dateMessages]) => (
                          <div key={date} className="space-y-4">
                            <div className="flex items-center justify-center">
                              <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                                {formatDate(dateMessages[0].timestamp)}
                              </div>
                            </div>
                            {dateMessages.map((message) => (
                              <div
                                key={message.messageId}
                                className={`flex items-start gap-2 ${
                                  message.userName === 'staff' ? 'flex-row-reverse' : ''
                                }`}
                              >
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                  <AvatarFallback className="bg-[#1C1C28] text-white">
                                    {message.userName === 'staff' ? 'S' : selectedRoom?.userName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div
                                  className={`rounded-lg p-3 max-w-[70%] ${
                                    message.userName === 'staff'
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-[#f0f0f0] text-black'
                                  }`}
                                >
                                  <p className="break-words">{message.content}</p>
                                  <span className="text-xs opacity-70 mt-1 block">
                                    {formatTimestamp(message.timestamp)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-[#ffffff] mt-auto">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Nhập tin nhắn..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 bg-[#1C1C28] border-0 text-white placeholder:text-muted-foreground"
                      />
                      <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium text-white">Chưa có cuộc trò chuyện nào được chọn</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
