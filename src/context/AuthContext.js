import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext(null);

// Décodage JWT manuel — remplace jwt-decode
function decodeJWT(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
    const decoded = JSON.parse(atob(padded));
    return decoded;
  } catch (e) {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const stored = await AsyncStorage.getItem("token");
        if (stored) {
          const decoded = decodeJWT(stored);
          if (decoded && decoded.exp * 1000 > Date.now()) {
            setToken(stored);
            setUser(decoded);
          } else {
            await AsyncStorage.removeItem("token");
          }
        }
      } catch (e) {
        console.error("Auth load error:", e);
      } finally {
        setLoading(false);
      }
    };
    loadToken();
  }, []);

  const login = async (newToken) => {
    await AsyncStorage.setItem("token", newToken);
    const decoded = decodeJWT(newToken);
    setToken(newToken);
    setUser(decoded);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);