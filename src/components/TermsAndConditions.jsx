import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const TermsAndConditions = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px] h-[80vh] bg-gray-900 text-teal-400 border border-teal-500/40">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-teal-400  text-center">
            Điều khoản và Điều kiện Sử dụng
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(80vh-180px)] pr-4">
          <div className="space-y-6 text-teal-400/90">
            <section>
              <h3 className="text-lg font-semibold mb-2">1. Giới thiệu</h3>
              <p className="text-[#CFCFCF]">
                Chào mừng bạn đến với StockFlow - nền tảng theo dõi và phân tích chứng khoán. 
                Bằng việc truy cập và sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ và 
                chịu ràng buộc bởi các điều khoản và điều kiện này.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">2. Điều kiện sử dụng</h3>
              <ul className="list-disc pl-6 space-y-2 text-[#CFCFCF]">
                <li>
                  Bạn phải đủ 18 tuổi hoặc được sự giám hộ của người lớn để sử dụng dịch vụ.
                </li>
                <li>
                  Thông tin tài khoản phải chính xác, đầy đủ và cập nhật.
                </li>
                <li>
                  Bạn chịu trách nhiệm bảo mật thông tin tài khoản của mình.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">3. Dịch vụ của chúng tôi</h3>
              <p className="text-[#CFCFCF]">
                StockFlow cung cấp các công cụ và thông tin để theo dõi, phân tích thị trường 
                chứng khoán. Tuy nhiên, chúng tôi không đưa ra bất kỳ lời khuyên đầu tư cụ thể 
                nào và không chịu trách nhiệm về các quyết định đầu tư của người dùng.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">4. Trách nhiệm người dùng</h3>
              <ul className="list-disc pl-6 space-y-2 text-[#CFCFCF]">
                <li>
                  Không sử dụng dịch vụ cho mục đích bất hợp pháp hoặc trái phép.
                </li>
                <li>
                  Không chia sẻ thông tin đăng nhập với người khác.
                </li>
                <li>
                  Không thực hiện các hành vi có thể gây hại đến hệ thống.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">5. Quyền sở hữu trí tuệ</h3>
              <p className="text-[#CFCFCF]">
                Tất cả nội dung, thiết kế, và tài liệu trên StockFlow đều thuộc quyền sở hữu 
                của chúng tôi. Nghiêm cấm sao chép, phân phối hoặc sử dụng trái phép các 
                tài liệu này.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">6. Bảo mật thông tin</h3>
              <p className="text-[#CFCFCF]">
                Chúng tôi cam kết bảo vệ thông tin cá nhân của người dùng theo chính sách 
                bảo mật. Thông tin của bạn sẽ không được chia sẻ với bên thứ ba mà không có 
                sự đồng ý.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">7. Giới hạn trách nhiệm</h3>
              <p className="text-[#CFCFCF]">
                StockFlow không chịu trách nhiệm về bất kỳ tổn thất nào phát sinh từ việc 
                sử dụng dịch vụ, bao gồm cả các quyết định đầu tư dựa trên thông tin từ 
                nền tảng.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">8. Thay đổi điều khoản</h3>
              <p className="text-[#CFCFCF]">
                Chúng tôi có quyền thay đổi điều khoản này vào bất kỳ lúc nào. Những thay 
                đổi sẽ có hiệu lực ngay khi được đăng tải. Việc tiếp tục sử dụng dịch vụ 
                đồng nghĩa với việc bạn chấp nhận các thay đổi này.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">9. Chấm dứt dịch vụ</h3>
              <p className="text-[#CFCFCF]">
                Chúng tôi có quyền chấm dứt hoặc đình chỉ tài khoản của bạn nếu vi phạm 
                các điều khoản sử dụng hoặc có hành vi gây hại đến hệ thống.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">10. Liên hệ</h3>
              <p className="text-[#CFCFCF]">
                Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ email: <span className="text-teal-400/90">stockmonitoring@gmail.com</span>
              </p>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            onClick={onClose}
            className="bg-teal-500 hover:bg-teal-600 text-white"
          >
            Đã hiểu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TermsAndConditions; 