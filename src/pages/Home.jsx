import React from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "../Authentication/AuthContext";

const AnimatedSection = ({ children, delay = 0, direction = null }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });

  const getAnimationProps = () => {
    switch (direction) {
      case "left":
        return {
          initial: { opacity: 0, x: -80, rotate: -5 },
          animate: isInView ? { opacity: 1, x: 0, rotate: 0 } : { opacity: 0, x: -80, rotate: -5 },
        };
      case "right":
        return {
          initial: { opacity: 0, x: 80, rotate: 5 },
          animate: isInView ? { opacity: 1, x: 0, rotate: 0 } : { opacity: 0, x: 80, rotate: 5 },
        };
      default:
        return {
          initial: { opacity: 0, y: 50, scale: 0.95 },
          animate: isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.95 },
        };
    }
  };

  const animationProps = getAnimationProps();

  return (
    <motion.div
      ref={ref}
      initial={animationProps.initial}
      animate={animationProps.animate}
      transition={{ duration: 0.8, ease: "easeOut", delay, type: "spring", stiffness: 100 }}
    >
      {children}
    </motion.div>
  );
};

function Home() {
  const { isAuthenticated } = useAuth();

  const handlePlatformClick = () => {
    if (isAuthenticated) {
      window.location.href = '/stock';
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <div
      className="min-h-screen text-white overflow-hidden relative"
      style={{
        background: "linear-gradient(135deg, #213A58 0%, #0C6478 40%, #15919B 60%, #46DFB1 80%, #80EE98 100%)",
      }}
    >
      <section className="hero-section container mx-auto px-6 py-20 md:py-28 relative z-10">
        {/* Stock Market Background */}
        <motion.div
          className="absolute inset-0 opacity-20 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ duration: 2 }}
        >
          <svg className="w-full h-full" viewBox="0 0 1000 600" preserveAspectRatio="none">
            {/* Line Chart 1 */}
            <motion.path
              d="M0,500 Q200,400 400,450 T800,350 T1000,400"
              fill="none"
              stroke="#0ABDB4"
              strokeWidth="3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
            />
            {/* Line Chart 2 */}
            <motion.path
              d="M0,550 Q250,300 500,350 T750,250 T1000,300"
              fill="none"
              stroke="#46DFB1"
              strokeWidth="3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 4, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", delay: 1 }}
            />
            {/* Bar Chart Elements */}
            <motion.rect
              x="150" y="500" width="40" height="0"
              fill="#09D1C7"
              initial={{ height: 0 }}
              animate={{ height: 120 }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", delay: 0.5 }}
            />
            <motion.rect
              x="250" y="500" width="40" height="0"
              fill="#80EE98"
              initial={{ height: 0 }}
              animate={{ height: 180 }}
              transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse", delay: 1 }}
            />
            <motion.rect
              x="350" y="500" width="40" height="0"
              fill="#0ABDB4"
              initial={{ height: 0 }}
              animate={{ height: 100 }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", delay: 1.5 }}
            />
            {/* Decorative Dots */}
            <motion.circle cx="500" cy="400" r="5" fill="#CFCFCF" animate={{ y: [-10, 10] }} transition={{ duration: 1.5, repeat: Infinity }} />
            <motion.circle cx="800" cy="350" r="5" fill="#46DFB1" animate={{ y: [10, -10] }} transition={{ duration: 2, repeat: Infinity }} />
          </svg>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Hero Content */}
          <div className="space-y-10">
            <AnimatedSection direction="left" delay={0.2}>
              <h1
                className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.2] text-center"
                style={{ 
                  background: "linear-gradient(to right, #80EE98, #0ABDB4)", 
                  WebkitBackgroundClip: "text", 
                  color: "transparent",
                  padding: "0.6rem 0"
                }}
              >
                Đầu Tư Chứng<br className="hidden md:inline" /> Khoán Thông Minh
              </h1>
            </AnimatedSection>
            <AnimatedSection direction="right" delay={0.4}>
              <p className="text-xl text-[#CFCFCF] max-w-lg mx-auto text-center">
                Tăng trưởng tài sản với phân tích chuyên sâu, chiến lược đầu tư sáng tạo và quản lý rủi ro tối ưu.
              </p>
            </AnimatedSection>

            {/* Features */}
            <AnimatedSection delay={0.6}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <motion.div whileHover={{ y: -12, rotate: 3 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card className="bg-[#15919B]/80 backdrop-blur-md border border-[#46DFB1]/30 shadow-xl h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex flex-col items-center space-y-2 text-lg font-semibold text-[#80EE98]">
                        <i className="fas fa-chart-line" style={{ color: "#0ABDB4" }}></i>
                        <span>Phân Tích Thị Trường</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-sm text-[#CFCFCF]">Dữ liệu real-time, xu hướng rõ ràng</p>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div whileHover={{ y: -12, rotate: -3 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card className="bg-[#15919B]/80 backdrop-blur-md border border-[#46DFB1]/30 shadow-xl h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex flex-col items-center space-y-2 text-lg font-semibold text-[#80EE98]">
                        <i className="fas fa-briefcase" style={{ color: "#0ABDB4" }}></i>
                        <span>Chiến Lược Đầu Tư</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-sm text-[#CFCFCF]">Đề xuất từ AI và chuyên gia</p>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div whileHover={{ y: -12, rotate: 3 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card className="bg-[#15919B]/80 backdrop-blur-md border border-[#46DFB1]/30 shadow-xl h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex flex-col items-center space-y-2 text-lg font-semibold text-[#80EE98]">
                        <i className="fas fa-shield-alt" style={{ color: "#0ABDB4" }}></i>
                        <span>Quản Lý Rủi Ro</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-sm text-[#CFCFCF]">Bảo vệ vốn với công nghệ tiên tiến</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </AnimatedSection>

            {/* Call to Action */}
            <AnimatedSection delay={0.8}>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 justify-center">
                <motion.div whileHover={{ scale: 1.1, rotate: 3 }} transition={{ type: "spring", stiffness: 400 }}>
                  <Button
                    onClick={handlePlatformClick}
                    variant="default"
                    size="lg"
                    style={{
                      background: "linear-gradient(to right, #46DFB1, #09D1C7)",
                      color: "white",
                    }}
                    className="hover:bg-[#46DFB1] font-semibold shadow-lg w-full sm:w-auto"
                  >
                    Trải nghiệm Web Platform ngay
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.1, rotate: -3 }} transition={{ type: "spring", stiffness: 400 }}>
                  <Button
                    asChild
                    size="lg"
                    className="bg-transparent border-2 border-[#46DFB1] text-[#46DFB1] hover:bg-[#46DFB1]/10 hover:text-white hover:border-[#46DFB1] font-semibold w-full sm:w-auto transition-all duration-300"
                  >
                    <Link to="/tools">Nhận Tư Vấn</Link>
                  </Button>
                </motion.div>
              </div>
            </AnimatedSection>
            
            {/* WhatsApp Image - Centered and Responsive */}
            <AnimatedSection delay={1.0}>
              <div className="flex justify-center -mt-5">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="relative w-full max-w-[150px] sm:max-w-[180px] md:max-w-[200px] px-2"
                >
                  <img
                    src="https://static.whatsapp.net/rsrc.php/v3/yY/r/Q5OhYIrTxr_.png"
                    alt="WhatsApp QR Code"
                    className="w-full h-auto rounded-x mx-auto"
                  />
                  <motion.div
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full opacity-30"
                    style={{ backgroundColor: "#46DFB1" }}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
              </div>
            </AnimatedSection>
          </div>

          {/* Hero Image */}
          <AnimatedSection direction="right" delay={1}>
            <motion.div
              className="relative mx-auto max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl"
              whileHover={{ scale: 1.05, rotate: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <img
                src="https://fstock.vn/assets/img/fstock/combine.png"
                alt="Đầu Tư Chứng Khoán"
                className="w-full h-auto rounded-xl shadow-2xl"
              />
              <motion.div
                className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-30"
                style={{ backgroundColor: "#46DFB1" }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}

export default Home;