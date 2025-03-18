import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/Authentication/AuthContext';
import { toast } from 'sonner';

const OAuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginWithGoogle, registerWithGoogle } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState(null);
  const hasHandledCallback = useRef(false);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      if (hasHandledCallback.current) return; // Prevent multiple executions
      hasHandledCallback.current = true; // Mark as executed

      try {
        // Log the complete URL for debugging
        console.log("Full callback URL:", window.location.href);
        
        // Lấy tất cả các tham số từ URL
        const searchParams = new URLSearchParams(location.search);
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const scope = searchParams.get('scope');
        const authuser = searchParams.get('authuser');
        const prompt = searchParams.get('prompt');
        
        // Log all parameters for debugging
        console.log("OAuth parameters:", { code, state, scope, authuser, prompt });
        
        if (!code) {
          const errorMsg = "Không tìm thấy mã xác thực Google";
          console.error(errorMsg);
          if (!error) {
            setError(errorMsg);
            toast.error(errorMsg, {
              position: "top-right",
              duration: 5000,
            });
          }
          return;
        }
        
        // Xác định xem đây là đăng nhập hay đăng ký dựa trên localStorage
        const oauthFlow = localStorage.getItem('oauth_flow');
        const isRegistration = oauthFlow === 'register';
        
        console.log("OAuth flow from localStorage:", oauthFlow);
        console.log("Is registration flow:", isRegistration);
        
        // Xóa thông tin flow sau khi sử dụng để tránh xung đột
        localStorage.removeItem('oauth_flow');
        
        let result;
        if (isRegistration) {
          console.log("Processing as registration flow");
          try {
            result = await registerWithGoogle(code, state);
            console.log("Registration result:", result);
          } catch (apiError) {
            console.error("Registration API error:", apiError);
            throw apiError;
          }
          
          if (result.success) {
            toast.success("Đăng ký Google thành công!", {
              position: "top-right",
              duration: 2000,
            });
            // Chuyển hướng đến trang chính sau khi đăng ký thành công
            setTimeout(() => navigate('/stock'), 1500);
          } else {
            const errorMsg = result.message || "Đăng ký Google thất bại";
            console.warn("Registration error message:", errorMsg);
            if (!error) {
              setError(errorMsg);
              toast.error("Đăng ký Google thất bại", {
                position: "top-right",
                duration: 5000,
              });
            }
            
            // Cung cấp nút để người dùng có thể thử lại hoặc chuyển hướng thủ công
          }
        } else {
          console.log("Processing as login flow");
          try {
            result = await loginWithGoogle(code, state);
            console.log("Login result:", result);
          } catch (apiError) {
            console.error("Login API error:", apiError);
            throw apiError;
          }
          
          if (result.success) {
            toast.success("Đăng nhập Google thành công!", {
              position: "top-right",
              duration: 2000,
            });
            // Chuyển hướng đến trang chính sau khi đăng nhập thành công
            setTimeout(() => navigate('/stock'), 1500);
          } else {
            const errorMsg = result.message || "Đăng nhập Google thất bại";
            console.warn("Login error message:", errorMsg);
            if (!error) {
              setError(errorMsg);
              toast.error("Đăng nhập Google thất bại", {
                position: "top-right",
                duration: 5000,
              });
            }
            
            // Cung cấp nút để người dùng có thể thử lại hoặc chuyển hướng thủ công
          }
        }
        
        // Xóa code từ URL để tránh xử lý lại khi refresh
        window.history.replaceState({}, document.title, location.pathname);
      } catch (error) {
        console.error("OAuth callback error:", error);
        const errorMsg = "Xác thực Google thất bại. Vui lòng thử lại.";
        if (!error) {
          setError(errorMsg);
          toast.error(errorMsg, {
            position: "top-right",
            duration: 5000,
          });
        }
        // setTimeout(() => navigate('/login'), 2000);
      } finally {
        setIsProcessing(false);
      }
    };

    if (isProcessing) {
      handleOAuthCallback();
    }
  }, [location, loginWithGoogle, registerWithGoogle, navigate, isProcessing]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center max-w-md mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-teal-500 mb-2">Xác thực không thành công</h2>
          <p className="text-teal-400/80 mb-6">{error}</p>
          <div className="flex space-x-4 justify-center">
            <button 
              onClick={() => navigate('/login')} 
              className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors"
            >
              Đăng nhập
            </button>
            <button 
              onClick={() => navigate('/register')} 
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Đăng ký
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-teal-500 mb-2">Đang xử lý xác thực Google...</h2>
        <p className="text-teal-400/80">Vui lòng đợi trong giây lát.</p>
      </div>
    </div>
  );
};

export default OAuthCallback; 