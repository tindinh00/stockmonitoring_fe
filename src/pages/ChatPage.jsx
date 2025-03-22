import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ChatPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'staff',
      name: 'Hỗ trợ viên',
      avatar: '/avatars/support.png',
      content: 'Xin chào! Tôi có thể giúp gì cho bạn?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      name: 'Bạn',
      avatar: '/avatars/user.png',
      content: newMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    // Simulate staff response
    setTimeout(() => {
      const staffMessage = {
        id: messages.length + 2,
        sender: 'staff',
        name: 'Hỗ trợ viên',
        avatar: '/avatars/support.png',
        content: 'Cảm ơn bạn đã liên hệ. Vui lòng đợi trong giây lát, tôi sẽ kiểm tra và phản hồi sớm nhất.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, staffMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
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
                message.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <Avatar className="h-8 w-8 shrink-0 text-primary">
                <AvatarImage src={message.avatar} />
                <AvatarFallback>{message.name[0]}</AvatarFallback>
              </Avatar>
              
              <div className={`flex flex-col ${
                message.sender === 'user' ? 'items-end' : ''
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white">
                    {message.name}
                  </span>
                  <span className="text-xs text-[#808191]">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                
                <div className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.sender === 'user'
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