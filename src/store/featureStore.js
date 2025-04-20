import { create } from 'zustand';

// Danh sách tính năng miễn phí mặc định
export const FREE_FEATURES = [
  "Hiển thị dữ liệu thị trường chứng khoán",
  "Bản đồ nhiệt",
  "Xem tin tức thị trường",
  "Hộp thoại hỗ trợ người dùng (Chatbox)",
  "Tìm kiếm và bộ lọc cổ phiếu",
  "Cài đặt"
];

// Tính năng cao cấp
export const PREMIUM_FEATURES = [
  "Quản lý danh mục theo dõi cổ phiếu",
  "Quản lý danh mục theo dõi theo ngành",
  "Phân tích và gợi ý theo cá nhân hóa",
  "Quản lý thông báo theo nhu cầu",
  "Nhận thông báo theo đặt lệnh",
  "Trợ lý AI",
  "Dự đoán giá"
];

// Mapping từ tên feature trong API đến tên feature trong ứng dụng
export const FEATURE_MAPPING = {
  // Free features
  "Hiển thị dữ liệu thị trường chứng khoán": "Bảng giá",
  "Bản đồ nhiệt": "Bản đồ nhiệt",
  "Xem tin tức thị trường": "Tin tức",
  "Hộp thoại hỗ trợ người dùng (Chatbox)": "Chat với hỗ trợ",
  "Tìm kiếm và bộ lọc cổ phiếu": "Bảng giá",
  "Cài đặt": "Cài đặt",
  
  // Premium features
  "Quản lý danh mục theo dõi cổ phiếu": "Danh mục theo dõi",
  "Quản lý danh mục theo dõi theo ngành": "Danh mục theo dõi",
  "Phân tích và gợi ý theo cá nhân hóa": "Phân tích cá nhân",
  "Quản lý thông báo theo nhu cầu": "Thông báo",
  "Nhận thông báo theo đặt lệnh": "Thông báo",
  "Trợ lý AI": "Chat với AI",
  "Dự đoán giá": "Dự đoán giá"
};

// Key lưu trong localStorage
const FEATURES_STORAGE_KEY = 'user_features';

// Đọc tính năng từ localStorage khi khởi động
const getSavedFeatures = () => {
  try {
    const savedFeatures = localStorage.getItem(FEATURES_STORAGE_KEY);
    if (savedFeatures) {
      return JSON.parse(savedFeatures);
    }
  } catch (error) {
    console.error('Lỗi khi đọc tính năng từ localStorage:', error);
  }
  return [...FREE_FEATURES]; // Mặc định trả về tính năng miễn phí nếu không có dữ liệu
};

const useFeatureStore = create((set, get) => ({
  features: getSavedFeatures(), // Khởi tạo với tính năng đã lưu hoặc tính năng miễn phí
  
  setFeatures: (features) => {
    // Kết hợp tính năng miễn phí với tính năng từ API
    if (Array.isArray(features)) {
      // Tạo tập hợp tính năng kết hợp
      const combinedFeatures = [...FREE_FEATURES];
      
      // Kiểm tra nếu có feature "Các tính năng của gói miễn phí"
      const hasFreePackage = features.includes("Các tính năng của gói miễn phí");
      
      // Thêm các tính năng từ API mà chưa có trong danh sách miễn phí
      features.forEach(feature => {
        if (!combinedFeatures.includes(feature)) {
          combinedFeatures.push(feature);
        }
      });
      
      // Lưu vào state và localStorage
      set({ features: combinedFeatures });
      try {
        localStorage.setItem(FEATURES_STORAGE_KEY, JSON.stringify(combinedFeatures));
      } catch (error) {
        console.error('Lỗi khi lưu tính năng vào localStorage:', error);
      }
      
      console.log("Features after update:", combinedFeatures);
    }
  },
  
  hasFeature: (featureName) => {
    // Kiểm tra nếu là tính năng miễn phí
    if (FREE_FEATURES.includes(featureName)) {
      return true;
    }
    
    // Nếu không phải miễn phí, kiểm tra trong danh sách tính năng hiện tại
    const state = get();
    return state.features.includes(featureName);
  },
  
  // Kiểm tra nếu người dùng có quyền truy cập menu item dựa trên tên hiển thị
  hasMenuAccess: (menuTitle) => {
    // Tìm feature tương ứng với menu item
    const requiredFeature = Object.entries(FEATURE_MAPPING)
      .find(([apiFeature, mappedTitle]) => mappedTitle === menuTitle)?.[0];
    
    if (!requiredFeature) {
      return false; // Không tìm thấy mapping
    }
    
    // Kiểm tra nếu là tính năng miễn phí
    if (FREE_FEATURES.includes(requiredFeature)) {
      return true;
    }
    
    // Nếu không phải miễn phí, kiểm tra trong danh sách tính năng hiện tại
    const state = get();
    return state.features.includes(requiredFeature);
  },
  
  clearFeatures: () => {
    // Reset về tính năng miễn phí khi logout
    set({ features: [...FREE_FEATURES] });
    try {
      localStorage.setItem(FEATURES_STORAGE_KEY, JSON.stringify([...FREE_FEATURES]));
    } catch (error) {
      console.error('Lỗi khi xóa tính năng trong localStorage:', error);
    }
  },
  
  // Kiểm tra xem người dùng có tính năng cao cấp nào không
  hasPremiumFeatures: () => {
    const state = get();
    return PREMIUM_FEATURES.some(feature => state.features.includes(feature));
  }
}));

// Export functions to be used in AuthContext
export const saveUserFeatures = (features) => {
  if (features && Array.isArray(features)) {
    // Kiểm tra nếu có feature "Các tính năng của gói miễn phí", thêm tất cả FREE_FEATURES
    if (features.includes("Các tính năng của gói miễn phí")) {
      const enhancedFeatures = [...features, ...FREE_FEATURES];
      // Loại bỏ các phần tử trùng lặp
      const uniqueFeatures = [...new Set(enhancedFeatures)];
      useFeatureStore.getState().setFeatures(uniqueFeatures);
    } else {
      useFeatureStore.getState().setFeatures(features);
    }
  }
};

export const clearUserFeatures = () => {
  useFeatureStore.getState().clearFeatures();
};

export default useFeatureStore; 