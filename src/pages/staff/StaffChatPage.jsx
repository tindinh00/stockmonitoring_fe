import React, { useState } from 'react';
import { MessageSquare, Search, Send, Phone, Video, MoreVertical, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { collection, query, where, addDoc, onSnapshot,getDocs, orderBy, serverTimestamp } from "firebase/firestore";
import { useEffect } from 'react'; 
import { db } from '@/components/firebase';
import { useAuth } from '@/Authentication/AuthContext';
export default function StaffChatPage() {
  const [rooms, setRooms] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null); 
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const { user } = useAuth();

  // Helper function to format Firebase Timestamp to readable time
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    // Check if it's a Firebase Timestamp
    if (timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // If it's already a string, return as is
    return timestamp;
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
      roomId: selectedRoom.id,  // Assign ID of customer
    };
  
    try {
      // Add message to Firestore collection 'message'
      await addDoc(collection(db, "message"), newMsg);
      setNewMessage(""); // Clear input after sending
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-8">
        <div className="grid -mt-5 grid-cols-12 gap-6 bg-card rounded-lg border h-[calc(108vh-12rem)]">
          {/* Chat List */}
          <div className="col-span-4 border-r">
            <div className="p-4">
            <div className="flex items-center gap-3">
          <h4 className="text-3xl font-bold text-black mb-4">Chat với khách hàng</h4>
          <MessageSquare className="h-5 w-5 text-black mb-2" />
        </div>
              <div className="relative">
                
                <Search className=" absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm cuộc trò chuyện..."
                  className="pl-8 text-black"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="space-y-2 p-4 pt-0">
                {rooms && rooms.map((room) => (
                  <div
                    key={room.roomId}
                    className={`flex items-center text-black gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent ${
                      rooms?.id === room.roomId ? 'bg-accent' : ''
                    }`}
                    onClick={() => setSelectedRoom(room)}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={room.avatar} />
                        <AvatarFallback>{room.userName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {room.online && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{room.userName}</p>
                        <span className="text-xs text-muted-foreground">{room.timestamp}</span>
                      </div>
                      {/* <p className="text-sm text-muted-foreground truncate text-left">{chat.lastMessage}</p> */}
                    </div>
                    {room.unread > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        {room.unread}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Box */}
          <div className="col-span-8">
            {selectedRoom ? (
              <div className="h-full flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedRoom.avatar} />
                      <AvatarFallback className='text-black'>{selectedRoom.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-black text-left">{selectedRoom.userName}</h3>
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

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.messageId}
                        className={`flex items-start gap-2 text-black ${
                          message.userName === 'staff' ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {message.userName === 'staff' ? 'S' : selectedRoom.userName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`rounded-lg p-3 max-w-[70%] ${
                            message.userName === 'staff'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p>{message.content}</p>
                          <span className="text-xs opacity-70 mt-1 block">
                            {formatTimestamp(message.timestamp)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Nhập tin nhắn..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 text-black"
                    />
                    <Button type="submit" size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Chưa có cuộc trò chuyện nào được chọn</h3>
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