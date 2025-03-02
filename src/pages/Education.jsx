import React from "react";
import { motion, useInView } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

const AnimatedSection = ({ children, delay = 0, direction = null }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const getAnimationProps = () => {
    switch (direction) {
      case "left":
        return {
          initial: { opacity: 0, x: -100 },
          animate: isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -100 },
        };
      case "right":
        return {
          initial: { opacity: 0, x: 100 },
          animate: isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 100 },
        };
      default:
        return {
          initial: { opacity: 0, y: 50 },
          animate: isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 },
        };
    }
  };

  const animationProps = getAnimationProps();

  return (
    <motion.div
      ref={ref}
      initial={animationProps.initial}
      animate={animationProps.animate}
      transition={{ duration: 0.8, delay }}
    >
      {children}
    </motion.div>
  );
};

const Education = () => {
  return (
    <div className="min-h-screen text-white">
      {/* Section 1: About Us */}
      <section
        className="py-16"
        style={{ backgroundColor: "#0C6478" }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-[#46DFB1] mb-4">
                Về Chúng Tôi
              </h2>
              <p className="text-lg text-[#CFCFCF] max-w-3xl mx-auto leading-relaxed">
                StockFlow là nền tảng Fintech được phát triển bởi PDTK, thành lập và cấp phép ngày 28/11/2024. PDTK quy tụ các chuyên gia giàu kinh nghiệm trong lĩnh vực Tài chính và Công nghệ, cùng tầm nhìn xây dựng một nền tảng Fintech toàn diện hỗ trợ nhà đầu tư trên thị trường chứng khoán Việt Nam.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Section 2: Vision */}
      <section
        className="py-16"
        style={{ backgroundColor: "#15919B" }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <AnimatedSection delay={0.2} direction="left">
              <div className="relative">
                <div
                  className="absolute w-full h-[80%] top-[30%] left-[15%] z-10"
                  style={{ backgroundColor: "#46DFB1" }}
                >
                  <span
                    className="absolute right-[-15%] top-[45%] rotate-[-90deg] bg-[#46DFB1] text-white text-3xl font-bold px-4 py-1 rounded opacity-80"
                    style={{ transformOrigin: "center" }}
                  >
                    Giá trị bền vững
                  </span>
                </div>
                <img
                  src="https://fstock.vn/assets/img/900x600/img6.jpg?fbclid=IwY2xjawHo6F5leHRuA2FlbQIxMAABHVMCpjliyJ_9wQIiUztNYtbqgjW7dhl2sImZRZTRvpwY1ACpRqTSolW4Eg_aem_6T_vW5dwtbXbFYkb5E4xAQ"
                  alt="Vision"
                  className="relative w-full h-[400px] object-cover z-20 rounded-lg shadow-xl"
                />
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.4} direction="right">
              <div className="space-y-4 ml-[20%]">
                <h3 className="text-4xl md:text-5xl font-bold text-[#213A58] opacity-50">
                  Mang đến giá trị bền vững cho nhà đầu tư
                </h3>
                <p
                  className="text-7xl md:text-7xl font-extrabold text-[#213A58] "
                >
                  TẦM NHÌN
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Section 3: Mission Details */}
      <section
        className="py-16 bg-cover bg-center relative"
        style={{
          backgroundImage: "url(https://fstock.vn/assets/img/900x600/img7.jpg?fbclid=IwY2xjawHo-ihleHRuA2FlbQIxMAABHS2KMcpEZZBMh2TXmBkZIgBzZt5eNFJk8qIZjo2_UwpGBfYHPMxeDZMESg_aem_hhtNtTUZ4VcW49-NLtmq8w)",
          backgroundSize: "170%",
        }}
      >
        <div
          className="absolute inset-0 bg-[#213A58] opacity-80 z-0"
        />
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            <Card className="bg-transparent border-none">
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <AnimatedSection delay={0.2} direction="left">
                  <p className="text-lg text-[#CFCFCF] leading-relaxed">
                    Với thế mạnh về công nghệ và khả năng phân tích chuyên sâu, StockFlow hướng đến một nền tảng Fintech toàn diện ứng dụng trí tuệ nhân tạo (AI) để phân tích dữ liệu, tổng hợp thông tin, nâng cao khả năng ra quyết định của nhà đầu tư. StockFlow định hình là trợ lý A.I đắc lực giúp người dùng đạt hiệu quả cao trong giao dịch ngắn hạn và đầu tư trung dài hạn trên TTCK.
                  </p>
                </AnimatedSection>
                <AnimatedSection delay={0.4} direction="right">
                  <img
                    src="https://fstock.vn/assets/img/900x600/img4.jpg?fbclid=IwY2xjawHpA4RleHRuA2FlbQIxMAABHTF1qAfZY4PgcoVu_UFiks3lbT8hMKLaHb8h7tJoQBSJs563Z9GNs7eXgA_aem_NOIwKgdxDEQ-hrSqERCirQ"
                    alt="AI Trading"
                    className="w-full h-auto rounded-lg shadow-2xl shadow-[20px_20px_10px_rgba(0,0,0,0.4)] transition-shadow duration-300"
                  />
                </AnimatedSection>
              </CardContent>
            </Card>

            <Card className="bg-transparent border-none">
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <AnimatedSection delay={0.2} direction="left">
                  <img
                    src="https://fstock.vn/assets/img/900x600/img2.jpg?fbclid=IwY2xjawHqq6pleHRuA2FlbQIxMAABHTJqSSsVYZEY6S74u8PvTAqaI5MjPgTA5yNEM2GabzOBLtc1R9X0DGCT8A_aem_oFwGnR-HD6DWPZF7BWsSlQ"
                    alt="Market Insights"
                    className="w-full h-auto rounded-lg shadow-2xl shadow-[-20px_20px_10px_rgba(0,0,0,0.4)] transition-shadow duration-300"
                  />
                </AnimatedSection>
                <AnimatedSection delay={0.4} direction="right">
                  <p className="text-lg text-[#CFCFCF] leading-relaxed">
                    Thị trường chứng khoán Việt Nam còn non trẻ với hơn 20 năm phát triển, cơ cấu nhà đầu tư chủ yếu là cá nhân với nhiều hạn chế về am hiểu thị trường, khả năng tiếp cận dữ liệu, trình độ phân tích, kinh nghiệm, và tâm lý đầu tư.
                  </p>
                </AnimatedSection>
              </CardContent>
            </Card>

            <Card className="bg-transparent border-none">
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <AnimatedSection delay={0.2} direction="left">
                  <p className="text-lg text-[#CFCFCF] leading-relaxed">
                    StockFlow ra đời nhằm nâng cao năng lực cộng đồng nhà đầu tư, khắc phục hạn chế của nhà đầu tư cá nhân, giúp họ đầu tư hiệu quả trên TTCKVN, rút ngắn mục tiêu tự do tài chính và hướng tới phát triển TTCKVN bền vững, thịnh vượng.
                  </p>
                </AnimatedSection>
                <AnimatedSection delay={0.4} direction="right">
                  <img
                    src="https://fstock.vn/assets/img/900x600/img3.jpg?fbclid=IwY2xjawHqrRJleHRuA2FlbQIxMAABHXGulschgVYypWSxFAzOSwij-2FkvNLJFYAxzj4IOTodAxViRMqVaTYdQg_aem_oFx7vI6vJjC6mPrIS-ug5w"
                    alt="Investor Growth"
                    className="w-full h-auto rounded-lg shadow-2xl shadow-[20px_20px_10px_rgba(0,0,0,0.4)] transition-shadow duration-300"
                  />
                </AnimatedSection>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 4: Mission */}
      <section
        className="py-28 relative"
        style={{ backgroundColor: "#213A58" }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center">
              <h3 className="text-xl text-[#CFCFCF] mb-2 font-medium">
                Sứ mệnh
              </h3>
              <h2 className="text-3xl md:text-4xl font-bold text-[#09D1C7]">
                Trợ lý đầu tư hiệu quả cho nhà đầu tư
              </h2>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
};

export default Education;