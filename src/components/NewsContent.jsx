import React from 'react';

const NewsContent = ({ content }) => {
  if (!content) return <p className="text-gray-400">Không có nội dung chi tiết</p>;

  const formattedContent = content.split('\n').map((paragraph, index) => {
    // Bỏ qua các dòng trống
    if (!paragraph.trim()) return null;
    
    // Xử lý các dòng đặc biệt
    if (paragraph.includes('TIN MỚI')) {
      return <h2 key={index} className="text-xl font-bold text-[#09D1C7] mb-4">{paragraph}</h2>;
    }
    
    // Xử lý các dòng có dấu hỏi (câu hỏi phỏng vấn)
    if (paragraph.includes('?')) {
      return <p key={index} className="text-[#09D1C7] font-medium mb-2">{paragraph}</p>;
    }
    
    // Xử lý các dòng có dấu - ở đầu (câu trả lời phỏng vấn)
    if (paragraph.startsWith('-')) {
      return (
        <p key={index} className="pl-4 border-l-2 border-[#333] mb-4">
          {paragraph.substring(1)}
        </p>
      );
    }
    
    // Xử lý các dòng có chữ "Ảnh:" (caption cho ảnh)
    if (paragraph.includes('Ảnh:')) {
      return (
        <p key={index} className="text-sm text-gray-400 text-center italic mt-2 mb-6">
          {paragraph}
        </p>
      );
    }
    
    // Xử lý các tiêu đề con
    if (paragraph.length < 100 && !paragraph.includes('.')) {
      return (
        <h3 key={index} className="text-lg font-semibold text-[#09D1C7] mt-6 mb-4">
          {paragraph}
        </h3>
      );
    }
    
    // Các đoạn văn bản thông thường
    return (
      <p key={index} className="mb-4 leading-relaxed">
        {paragraph}
      </p>
    );
  });

  return (
    <div className="prose prose-invert max-w-none">
      {formattedContent}
    </div>
  );
};

export default NewsContent; 