import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const validateToken = async (token) => {
    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const userData = await response.json();
        return { valid: true, user: userData };
      } else {
        return { valid: false };
      }
    } catch (error) {
      console.error("Token validation error:", error);
      return { valid: false };
    }
  };

  useEffect(() => {
    // Check if user is logged in on app start
    const checkAuth = async () => {
    const token = localStorage.getItem("logiledger_token");
    const userData = localStorage.getItem("logiledger_user");

    if (token && userData) {
      try {
          // Validate token with backend
          const validation = await validateToken(token);
          if (validation.valid) {
            setUser(validation.user);
          } else {
            // Token is invalid, clear storage
            console.log("Token validation failed, clearing auth data");
            localStorage.removeItem("logiledger_token");
            localStorage.removeItem("logiledger_user");
            setUser(null);
          }
      } catch (error) {
          console.error("Error validating token:", error);
        localStorage.removeItem("logiledger_token");
        localStorage.removeItem("logiledger_user");
          setUser(null);
      }
    }
    setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok && data.token && data.user) {
        localStorage.setItem("logiledger_token", data.token);
        localStorage.setItem("logiledger_user", JSON.stringify(data.user));
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.message || "Login failed" };
      }
    } catch (error) {
      return { success: false, error: "Login failed. Please try again." };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      if (response.ok && data.token && data.user) {
        localStorage.setItem("logiledger_token", data.token);
        localStorage.setItem("logiledger_user", JSON.stringify(data.user));
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.message || "Registration failed" };
      }
    } catch (error) {
      return { success: false, error: "Registration failed. Please try again." };
    }
  };

  const logout = () => {
    localStorage.removeItem("logiledger_token");
    localStorage.removeItem("logiledger_user");
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    validateToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
