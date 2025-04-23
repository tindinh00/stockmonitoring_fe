import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from '@/components/RichTextEditor';
import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = "https://stockmonitoring-api-gateway.onrender.com";

export default function SendEmailPage() {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendEmail = async () => {
    if (!subject.trim()) {
      toast.error("Vui lòng nhập tiêu đề email");
      return;
    }

    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung email");
      return;
    }

    try {
      setIsSending(true);
      const token = Cookies.get('auth_token');
      
      const response = await axios.post(
        `${API_URL}/api/email/send-to-all`,
        {
          subject: subject,
          content: content
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.value && response.data.value.status === 200) {
        toast.success("Đã gửi email thành công cho tất cả khách hàng");
        setSubject('');
        setContent('');
      } else {
        toast.error("Không thể gửi email. Vui lòng thử lại sau");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Đã xảy ra lỗi khi gửi email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full h-full p-2 sm:p-4 md:p-6 bg-gradient-to-b from-background/80 via-background to-background/90">
      <div className="max-w-[1000px] mx-auto">
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold mb-2 text-foreground/90 flex items-center gap-2">
            <Mail className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            Gửi Email Thông Báo
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Gửi email thông báo đến tất cả khách hàng trong hệ thống</p>
          <div className="w-20 h-1 bg-primary/70 rounded-full mt-2"></div>
        </div>

        <Card className="border-border/40 shadow-xl">
          <CardHeader className="text-left">
            <CardTitle>Soạn Email</CardTitle>
            <CardDescription>
              Soạn email thông báo để gửi đến tất cả khách hàng
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2 text-left">
              <label htmlFor="subject" className="text-sm font-medium text-foreground">
                Tiêu đề email
              </label>
              <Input
                id="subject"
                placeholder="Nhập tiêu đề email..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-background text-foreground"
              />
            </div>

            <div className="space-y-2 text-left">
              <label className="text-sm font-medium text-foreground">
                Nội dung email
              </label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Nhập nội dung email..."
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSendEmail}
                disabled={isSending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[150px]"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Gửi email
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 