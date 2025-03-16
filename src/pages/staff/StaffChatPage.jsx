import React, { useState } from 'react';
import { MessageSquare, Search, Send, Phone, Video, MoreVertical, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

// Mock data for chat list
const mockChats = [
  {
    id: 1,
    name: "Nguyễn Văn A",
    avatar: null,
    lastMessage: "Tôi cần tư vấn về gói Basic",
    timestamp: "12:30",
    unread: 2,
    online: true
  },
  {
    id: 2,
    name: "Trần Thị B",
    avatar: null,
    lastMessage: "Cảm ơn bạn đã hỗ trợ",
    timestamp: "11:45",
    unread: 0,
    online: false
  },
  // Add more mock chats as needed
];

// Mock messages for chat
const mockMessages = [
  {
    id: 1,
    senderId: 1,
    content: "Xin chào, tôi cần tư vấn về gói Basic",
    timestamp: "12:30",
    type: "text"
  },
  {
    id: 2,
    senderId: "staff",
    content: "Chào anh/chị, tôi có thể giúp gì cho anh/chị ạ?",
    timestamp: "12:31",
    type: "text"
  },
  // Add more mock messages as needed
];

export default function StaffChatPage() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState(mockMessages);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const newMsg = {
      id: messages.length + 1,
      senderId: "staff",
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: "text"
    };

    setMessages([...messages, newMsg]);
    setNewMessage("");
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
                {mockChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`flex items-center text-black gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent ${
                      selectedChat?.id === chat.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => setSelectedChat(chat)}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={chat.avatar} />
                        <AvatarFallback>{chat.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {chat.online && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{chat.name}</p>
                        <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate text-left">{chat.lastMessage}</p>
                    </div>
                    {chat.unread > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Box */}
          <div className="col-span-8">
            {selectedChat ? (
              <div className="h-full flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedChat.avatar} />
                      <AvatarFallback className='text-black'>{selectedChat.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-black text-left">{selectedChat.name}</h3>
                      <div className="flex items-center gap-1.5">
                        {selectedChat.online && (
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                        )}
                        <p className="text-xs text-muted-foreground">
                          {selectedChat.online ? 'Đang hoạt động' : 'Không hoạt động'}
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
                        key={message.id}
                        className={`flex items-start gap-2 text-black ${
                          message.senderId === 'staff' ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {message.senderId === 'staff' ? 'S' : selectedChat.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`rounded-lg p-3 max-w-[70%] ${
                            message.senderId === 'staff'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p>{message.content}</p>
                          <span className="text-xs opacity-70 mt-1 block">
                            {message.timestamp}
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