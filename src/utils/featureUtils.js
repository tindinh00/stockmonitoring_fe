import Cookies from "js-cookie";

const USER_FEATURES_KEY = "user_features";

/**
 * Save user features to cookies
 * @param {Array} features - Array of feature names the user has access to
 * @param {Number} expiryDays - Number of days until the cookie expires (default: 7)
 */
export const saveUserFeatures = (features, expiryDays = 7) => {
  if (!features || !Array.isArray(features)) {
    console.warn("Invalid features array provided");
    return;
  }
  
  try {
    const featuresString = JSON.stringify(features);
    Cookies.set(USER_FEATURES_KEY, featuresString, { expires: expiryDays });
    console.log("User features saved to cookies:", features);
  } catch (error) {
    console.error("Error saving user features:", error);
  }
};

/**
 * Get user features from cookies
 * @returns {Array} Array of feature names the user has access to
 */
export const getUserFeatures = () => {
  try {
    const featuresString = Cookies.get(USER_FEATURES_KEY);
    if (!featuresString) return [];
    
    const features = JSON.parse(featuresString);
    return Array.isArray(features) ? features : [];
  } catch (error) {
    console.error("Error retrieving user features:", error);
    return [];
  }
};

/**
 * Check if user has access to a specific feature
 * @param {String} featureName - Name of the feature to check
 * @returns {Boolean} True if user has access to the feature
 */
export const hasFeature = (featureName) => {
  if (!featureName) return false;
  
  const features = getUserFeatures();
  const hasAccess = features.includes(featureName);
  
  console.log(`Feature access check: "${featureName}" - Access: ${hasAccess}`, 
              `Available features:`, features);
  
  return hasAccess;
};

/**
 * Clear user features from cookies
 */
export const clearUserFeatures = () => {
  Cookies.remove(USER_FEATURES_KEY);
};

/**
 * Add a new feature to user's existing features
 * @param {String} featureName - Feature to add
 */
export const addUserFeature = (featureName) => {
  if (!featureName) return;
  
  const features = getUserFeatures();
  if (!features.includes(featureName)) {
    features.push(featureName);
    saveUserFeatures(features);
  }
};

/**
 * Remove a feature from user's existing features
 * @param {String} featureName - Feature to remove
 */
export const removeUserFeature = (featureName) => {
  if (!featureName) return;
  
  const features = getUserFeatures();
  const updatedFeatures = features.filter(f => f !== featureName);
  
  if (updatedFeatures.length !== features.length) {
    saveUserFeatures(updatedFeatures);
  }
};

/**
 * Đảm bảo người dùng luôn có quyền truy cập vào các tính năng miễn phí
 * Được gọi khi khởi động ứng dụng để đảm bảo người dùng có thể truy cập các tính năng cơ bản
 */
export const ensureFreeFeatures = () => {
  const freeFeatures = [
    "Các tính năng của gói miễn phí",
    "Hiển thị dữ liệu thị trường chứng khoán",
    "Tìm kiếm và bộ lọc cổ phiếu",
    "Xem tin tức thị trường",
    "Bản đồ nhiệt",
    "Hộp thoại hỗ trợ người dùng (Chatbox)"
  ];
  
  const userFeatures = getUserFeatures();
  let needsUpdate = false;
  
  freeFeatures.forEach(feature => {
    if (!userFeatures.includes(feature)) {
      userFeatures.push(feature);
      needsUpdate = true;
    }
  });
  
  if (needsUpdate) {
    saveUserFeatures(userFeatures);
    console.log("Updated free features:", userFeatures);
  }
}; 