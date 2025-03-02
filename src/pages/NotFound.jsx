import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom"; // Giả sử dùng React Router
import { motion } from "framer-motion";

const NotFound = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative overflow-hidden"
      style={{
        backgroundImage: `url(https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif)`,
      }}
    >
      {/* Overlay Gradient */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#213A58]/80 to-[#0C6478]/80 z-0"
      />

      {/* Animated Background Elements */}
      <motion.div
        className="absolute inset-0 opacity-20 z-0"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#46DFB1" strokeWidth="1" />
          <path
            d="M20,80 Q50,40 80,80"
            fill="none"
            stroke="#80EE98"
            strokeWidth="1"
          />
        </svg>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 text-center space-y-8 px-4 sm:px-6 lg:px-8">
        <motion.h1
          className="text-8xl md:text-9xl font-extrabold bg-gradient-to-r from-[#80EE98] to-[#0ABDB4] bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          404
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#CFCFCF]">
            Oops! Trang không tìm thấy
          </h2>
          <p className="text-lg md:text-xl text-[#CFCFCF] max-w-md mx-auto leading-relaxed mt-4">
            Có vẻ bạn đã lạc khỏi sàn giao dịch. Hãy quay lại để tiếp tục hành trình đầu tư!
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4, type: "spring", stiffness: 200 }}
        >
          <Button
            asChild
            className="rounded-lg bg-[#46DFB1] hover:bg-[#09D1C7] text-[#122132] px-8 py-3 font-semibold text-lg transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <Link to="/">Quay về Trang Chủ</Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;