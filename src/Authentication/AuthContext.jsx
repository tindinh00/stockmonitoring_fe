import { createContext, useContext, useState } from "react";
import Cookies from "js-cookie";
import { apiService } from "../api/Api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Kiểm tra token và user ngay khi khởi tạo
  const token = Cookies.get("userToken");
  const savedUser = localStorage.getItem("user");
  const initialLoggedIn = !!token;
  const initialUser = savedUser ? JSON.parse(savedUser) : null;

  const [isLoggedIn, setIsLoggedIn] = useState(initialLoggedIn);
  const [user, setUser] = useState(initialUser);

  const login = async (credentials) => {
    try {
      const response = await apiService.login(credentials);
      const userData = response.data;
      setUser({
        name: userData.name,
        avatar: userData.avatar || "",
      });
      setIsLoggedIn(true);
      localStorage.setItem("user", JSON.stringify({
        name: userData.name,
        avatar: userData.avatar || "",
      }));
      return response;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
      setIsLoggedIn(false);
      setUser(null);
      localStorage.removeItem("user");
      console.log("Logged out");
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);