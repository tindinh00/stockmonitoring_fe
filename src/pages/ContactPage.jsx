import React from 'react';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a14] to-[#1a1a2e] text-white pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section with Background Image */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl overflow-hidden mb-16 h-[300px] bg-[#1a1a2e] group"
        >
          <div className="absolute inset-0">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a14]/95 via-transparent to-[#0a0a14]/95 z-20 
              animate-gradient bg-[length:200%_100%]"></div>
            
            {/* Moving light effect */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 -left-1/2 w-1/2 h-full 
                bg-gradient-to-r from-transparent via-[#09D1C7]/10 to-transparent
                animate-slide-right"></div>
            </div>
            
            {/* Background image with zoom effect */}
            <div className="h-full w-full">
              <div className="h-full w-full bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80')] 
                bg-cover bg-center group-hover:scale-110 transition-transform duration-[2s] 
                filter brightness-75"></div>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-30 h-full flex flex-col justify-center items-center text-center px-8">
            <h1 className="text-5xl font-bold mb-4">
              <span className="text-[#09D1C7]">Liên Hệ </span>
              <span className="text-white">Với Chúng Tôi</span>
            </h1>
            <p className="text-gray-300 max-w-2xl text-lg">
              Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn 24/7
            </p>
          </div>
        </motion.div>

        {/* Add styles for animations */}
        <style jsx>{`
          @keyframes slide-right {
            0% {
              transform: translateX(0%);
            }
            100% {
              transform: translateX(400%);
            }
          }

          @keyframes gradient {
            0% {
              background-position: 100% 0%;
            }
            100% {
              background-position: -100% 0%;
            }
          }

          .animate-slide-right {
            animation: slide-right 3s ease-in-out infinite;
          }

          .animate-gradient {
            animation: gradient 8s linear infinite;
          }
        `}</style>

        {/* Quick Stats */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
        >
          {/* Stats items with individual animations */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="bg-[#1C1C35] p-8 rounded-2xl border border-[#333] text-center hover:border-[#09D1C7] transition-all duration-300"
          >
            <h4 className="text-4xl font-bold text-[#09D1C7] mb-3">24/7</h4>
            <p className="text-gray-400">Hỗ trợ khách hàng</p>
          </motion.div>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="bg-[#1C1C35] p-8 rounded-2xl border border-[#333] text-center hover:border-[#09D1C7] transition-all duration-300"
          >
            <h4 className="text-4xl font-bold text-[#09D1C7] mb-3">15+</h4>
            <p className="text-gray-400">Chuyên gia tư vấn</p>
          </motion.div>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="bg-[#1C1C35] p-8 rounded-2xl border border-[#333] text-center hover:border-[#09D1C7] transition-all duration-300"
          >
            <h4 className="text-4xl font-bold text-[#09D1C7] mb-3">1000+</h4>
            <p className="text-gray-400">Khách hàng tin tưởng</p>
          </motion.div>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.7 }}
            className="bg-[#1C1C35] p-8 rounded-2xl border border-[#333] text-center hover:border-[#09D1C7] transition-all duration-300"
          >
            <h4 className="text-4xl font-bold text-[#09D1C7] mb-3">98%</h4>
            <p className="text-gray-400">Đánh giá tích cực</p>
          </motion.div>
        </motion.div>

        {/* Contact Information Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
        >
          {/* Email Card */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="group relative bg-gradient-to-br from-[#1a1a2e] to-[#2a2a4e] p-8 rounded-2xl border border-[#333] hover:border-[#09D1C7] transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#09D1C7]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex flex-col items-center text-center gap-4 mb-6">
                <div className="p-4 bg-[#09D1C7]/10 rounded-xl">
                  <Mail className="h-8 w-8 text-[#09D1C7]" />
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-1">Email</h3>
                  <p className="text-gray-400">Liên hệ qua email</p>
                </div>
              </div>
              <div className="text-center">
                <a href="mailto:stockmonitoring@gmail.com" className="text-[#09D1C7] hover:text-[#46DFB1] transition-colors duration-300 text-lg font-medium">
                  stockmonitoring@gmail.com
                </a>
              </div>
            </div>
          </motion.div>

          {/* Phone Card */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="group relative bg-gradient-to-br from-[#1a1a2e] to-[#2a2a4e] p-8 rounded-2xl border border-[#333] hover:border-[#09D1C7] transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#09D1C7]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex flex-col items-center text-center gap-4 mb-6">
                <div className="p-4 bg-[#09D1C7]/10 rounded-xl">
                  <Phone className="h-8 w-8 text-[#09D1C7]" />
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-1">Điện Thoại</h3>
                  <p className="text-gray-400">Hỗ trợ trực tiếp</p>
                </div>
              </div>
              <div className="text-center">
                <a href="tel:0845333577" className="text-[#09D1C7] hover:text-[#46DFB1] transition-colors duration-300 text-lg font-medium">
                  0845333577
                </a>
              </div>
            </div>
          </motion.div>

          {/* Office Hours Card */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="group relative bg-gradient-to-br from-[#1a1a2e] to-[#2a2a4e] p-8 rounded-2xl border border-[#333] hover:border-[#09D1C7] transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#09D1C7]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex flex-col items-center text-center gap-4 mb-6">
                <div className="p-4 bg-[#09D1C7]/10 rounded-xl">
                  <Clock className="h-8 w-8 text-[#09D1C7]" />
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-1">Giờ Làm Việc</h3>
                  <p className="text-gray-400">Thời gian hỗ trợ</p>
                </div>
              </div>
              <div className="space-y-2 text-center">
                <p className="text-gray-300">Thứ 2 - Thứ 6: <span className="text-[#09D1C7]">8:00 - 17:00</span></p>
                <p className="text-gray-300">Thứ 7: <span className="text-[#09D1C7]">8:00 - 12:00</span></p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Map Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="bg-gradient-to-br from-[#1a1a2e] to-[#2a2a4e] rounded-2xl p-8 border border-[#333]"
        >
          <div className="flex flex-col items-center text-center gap-4 mb-6">
            <div className="p-4 bg-[#09D1C7]/10 rounded-xl">
              <MapPin className="h-8 w-8 text-[#09D1C7]" />
            </div>
            <div>
              <h3 className="font-bold text-xl mb-1">Địa Chỉ</h3>
              <p className="text-gray-400">Văn phòng chính</p>
            </div>
          </div>
          <p className="text-gray-300 text-lg mb-6 text-center">
            Lô E2a-7, Đường D1, Khu Công nghệ cao, P.Long Thạnh Mỹ, Tp.Thủ Đức, TP.HCM
          </p>
          <div className="rounded-xl overflow-hidden h-[400px] relative">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.609941531023!2d106.80730807460241!3d10.841132889300701!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752731176b07b1%3A0xb752b24b379bae5e!2sFPT%20University%20HCMC!5e0!3m2!1svi!2s!4v1690341683765!5m2!1svi!2s"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0"
            ></iframe>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ContactPage; 