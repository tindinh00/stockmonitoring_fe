import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Image as ImageIcon, X, Bot, Search, Sparkles } from 'lucide-react';
import { toast } from "sonner";
import { geminiService } from '@/api/GeminiApi';
import ReactMarkdown from 'react-markdown';

const LoadingDots = () => (
  <div className="flex items-center gap-1">
    <div className="w-2 h-2 rounded-full bg-[#09D1C7] animate-bounce" style={{ animationDelay: '0ms' }}></div>
    <div className="w-2 h-2 rounded-full bg-[#09D1C7] animate-bounce" style={{ animationDelay: '150ms' }}></div>
    <div className="w-2 h-2 rounded-full bg-[#09D1C7] animate-bounce" style={{ animationDelay: '300ms' }}></div>
  </div>
);

const AnimatedBotIcon = () => (
  <div className="relative w-full h-full">
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Ears - simple lines */}
      <line x1="3" y1="10" x2="3" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="21" y1="10" x2="21" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Square Head */}
      <rect x="5" y="6" width="14" height="12" rx="2" className="stroke-current" strokeWidth="1.5" />
      
      {/* Single Antenna */}
      <path d="M12 6V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="10" y="2" width="2" height="2" rx="0.5" fill="currentColor" />
      
      {/* Animated eyes */}
      <g className="animate-blink">
        <rect x="8" y="10" width="2" height="3" rx="0.5" fill="currentColor" />
        <rect x="14" y="10" width="2" height="3" rx="0.5" fill="currentColor" />
      </g>
      
      {/* Smile */}
      <path d="M9 14.5c1.5 0.8 4.5 0.8 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>

    {/* Glowing dot */}
    <div className="absolute top-0 right-0 w-1.5 h-1.5">
      <div className="absolute inset-0 bg-[#09D1C7] rounded-full animate-ping opacity-40"></div>
      <div className="absolute inset-0 bg-[#09D1C7] rounded-full"></div>
    </div>
    
    {/* Energy ring on hover */}
    <div className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
      <div className="absolute inset-0 border-2 border-[#09D1C7]/20 rounded-full animate-[spin_3s_linear_infinite]"></div>
    </div>
  </div>
);

const AIChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const fileInputRef = useRef(null);
  const fileInputDialogRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || isSending) return;

    if (!hasInteracted) {
      setHasInteracted(true);
    }

    try {
      setIsSending(true);
      
      // Add user message to chat
      const userMessage = {
        id: Date.now(),
        role: 'user',
        content: newMessage,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, userMessage]);
      setNewMessage('');

      // Add temporary loading message
      const loadingId = Date.now() + 1;
      setMessages(prev => [...prev, {
        id: loadingId,
        role: 'assistant',
        content: '...',
        isLoading: true,
        timestamp: new Date().toLocaleTimeString()
      }]);

      let response;
      if (selectedFile) {
        response = await geminiService.analyzeFile(selectedFile);
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        response = await geminiService.analyzeText(newMessage);
      }

      // Remove loading message and add AI response
      if (response?.value?.data) {
        setMessages(prev => prev.filter(msg => msg.id !== loadingId));
        const aiMessage = {
          id: Date.now() + 2,
          role: 'assistant',
          content: response.value.data,
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Không thể gửi tin nhắn. Vui lòng thử lại sau.');
      // Remove loading message on error
      setMessages(prev => prev.filter(msg => !msg.isLoading));
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Kích thước file không được vượt quá 5MB');
        return;
      }
      setSelectedFile(file);
      
      // Preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Function to focus input
  const focusInput = () => {
    inputRef.current?.focus();
  };

  // Function to open file upload dialog
  const openFileDialog = (ref) => {
    if (ref && ref.current) {
      ref.current.click();
    }
  };

  return (
    <div className="flex flex-col h-[calc(107vh-12rem)] bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#333] overflow-hidden relative">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#09D1C7]/5 to-transparent pointer-events-none" />
      
      {/* Messages Container */}
      <div className={`flex-1 overflow-y-auto transition-all duration-300 ${!hasInteracted ? 'flex items-center justify-center' : 'p-4 space-y-4'}`}>
        {!hasInteracted ? (
          <div className="text-center w-full max-w-3xl mx-auto px-8 relative">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#09D1C7]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-[#09D1C7]/5 rounded-full blur-3xl pointer-events-none" />
            
            {/* Main Content */}
            <div className="relative z-10 space-y-8">
              <div className="flex items-center justify-center mb-6">
                <div className="relative group">
                  {/* Glowing background */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-[#09D1C7]/10 to-[#0a8f88]/10 rounded-full blur-xl group-hover:from-[#09D1C7]/20 group-hover:to-[#0a8f88]/20 transition-all duration-500"></div>
                  
                  {/* Avatar with animated bot */}
                  <Avatar className="h-24 w-24 ring-4 ring-[#09D1C7]/20 relative z-10 group">
                    <AvatarImage src="/ai-avatar.png" />
                    <AvatarFallback className="bg-gradient-to-r from-[#09D1C7] to-[#0a8f88] text-white">
                      <AnimatedBotIcon />
                    </AvatarFallback>
                  </Avatar>

                  {/* Subtle pulse ring */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#09D1C7] to-[#0a8f88] rounded-full opacity-30 group-hover:opacity-50 blur-sm animate-pulse"></div>
                </div>
              </div>

              <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
                Tôi có thể giúp gì cho bạn?
              </h1>
              
              <div className="relative max-w-2xl mx-auto group" onClick={focusInput}>
                <div className="absolute -inset-1 bg-gradient-to-r from-[#09D1C7] to-[#0a8f88] rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                <div className="relative flex items-center bg-white dark:bg-[#333] rounded-2xl shadow-2xl">
                  <Search className="absolute left-4 text-gray-400 dark:text-[#666] h-6 w-6" />
                  <Input
                    ref={inputRef}
                    placeholder="Hỏi bất kỳ điều gì..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full h-16 pl-14 pr-4 bg-transparent border-0 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#666] text-lg focus:ring-0 focus:outline-none rounded-2xl"
                  />
                  <input
                    type="file"
                    ref={fileInputDialogRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      openFileDialog(fileInputDialogRef);
                    }}
                    className="absolute right-16 bg-transparent border-0 text-[#09D1C7] hover:text-[#09D1C7] hover:bg-transparent transition-colors opacity-50 group-hover:opacity-100"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                  <Sparkles className="absolute right-4 text-[#09D1C7] h-5 w-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              <div className="mt-12 bg-white/50 dark:bg-[#333]/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-200 dark:border-[#444] shadow-xl max-w-2xl mx-auto transform hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-start gap-6">
                  <div className="p-4 bg-gradient-to-br from-[#09D1C7]/20 to-[#0a8f88]/20 rounded-xl">
                    <Bot className="h-8 w-8 text-[#09D1C7]" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      Trợ lý thông minh
                      <span className="text-sm font-normal text-[#09D1C7]">AI Assistant</span>
                    </h3>
                    <p className="text-gray-600 dark:text-[#888] text-base leading-relaxed">
                      Tôi có thể giúp bạn phân tích dữ liệu, trả lời câu hỏi, và hỗ trợ bạn trong nhiều tác vụ khác nhau. 
                      Hãy đặt câu hỏi hoặc chia sẻ vấn đề của bạn, tôi sẽ cố gắng hết sức để giúp đỡ.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-3 justify-start animate-fadeIn">
              <Avatar className="h-8 w-8 ring-2 ring-[#09D1C7]/20 group">
                <AvatarImage src="/ai-avatar.png" />
                <AvatarFallback className="bg-gradient-to-r from-[#09D1C7] to-[#0a8f88] text-white">
                  <AnimatedBotIcon />
                </AvatarFallback>
              </Avatar>
              <div className="bg-gray-100 dark:bg-[#333] text-gray-900 dark:text-white rounded-lg p-3 max-w-[80%]">
                <div className="prose dark:prose-invert max-w-none">
                  Xin chào! Tôi là trợ lý AI. Tôi có thể giúp gì cho bạn?
                </div>
                <div className="text-xs opacity-50 mt-1">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 ring-2 ring-[#09D1C7]/20">
                    <AvatarImage src="/ai-avatar.png" />
                    <AvatarFallback className="bg-gradient-to-r from-[#09D1C7] to-[#0a8f88] text-white">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-[#09D1C7] text-white'
                      : 'bg-gray-100 dark:bg-[#333] text-gray-900 dark:text-white'
                  }`}
                >
                  {message.isLoading ? (
                    <LoadingDots />
                  ) : (
                    <div className="prose dark:prose-invert max-w-none text-left">
                      <ReactMarkdown 
                        components={{
                          p: ({node, ...props}) => <div className="mb-2 last:mb-0" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                          li: ({node, ...props}) => <li className="mb-1" {...props} />,
                          pre: ({node, ...props}) => <pre className="bg-gray-200 dark:bg-[#1a1a1a] p-4 rounded-lg mb-4 overflow-x-auto" {...props} />,
                          code: ({node, inline, className, children, ...props}) => {
                            const match = /language-(\w+)/.exec(className || '');
                            return inline ? (
                              <code className="bg-gray-200 dark:bg-[#2d2d2d] px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                {children}
                              </code>
                            ) : (
                              <code
                                className={`${match ? `language-${match[1]}` : ''} block text-sm font-mono`}
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          }
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  <div className="text-xs opacity-50 mt-1 text-left">
                    {message.timestamp}
                  </div>
                </div>
                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 ring-2 ring-[#09D1C7]/20">
                    <AvatarImage src="/user-avatar.png" />
                    <AvatarFallback className="bg-gradient-to-r from-[#09D1C7] to-[#0a8f88] text-white">Me</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File Preview */}
      {filePreview && (
        <div className="p-2 border-t border-gray-200 dark:border-[#333]">
          <div className="relative inline-block">
            <img
              src={filePreview}
              alt="Preview"
              className="max-h-32 rounded"
            />
            <button
              onClick={removeSelectedFile}
              className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className={`p-4 border-t border-gray-200 dark:border-[#333] bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur transition-all duration-300 ${!hasInteracted ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex gap-2 max-w-4xl mx-auto">
          <Input
            placeholder="Nhập tin nhắn..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-gray-100 dark:bg-[#333] border-gray-200 dark:border-[#444] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-[#666] focus:ring-[#09D1C7]"
            disabled={isSending}
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => openFileDialog(fileInputRef)}
            className="bg-gray-100 dark:bg-[#333] border-gray-200 dark:border-[#444] text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-[#444] hover:text-[#09D1C7] transition-colors"
            disabled={isSending}
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Button
            onClick={handleSendMessage}
            className="bg-[#09D1C7] hover:bg-[#0a8f88] text-white transition-colors min-w-[80px]"
            disabled={(!newMessage.trim() && !selectedFile) || isSending}
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Gửi'
            )}
          </Button>
        </div>
      </div>

      <style jsx="true" global="true">{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes blink {
          0%, 85%, 100% { 
            opacity: 1;
            transform: scaleY(1);
          }
          90% { 
            opacity: 0;
            transform: scaleY(0.1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-blink {
          animation: blink 4s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
      `}</style>
    </div>
  );
};

export default AIChatPage; 