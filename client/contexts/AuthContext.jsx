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

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem("logiledger_token");
    const userData = localStorage.getItem("logiledger_user");

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("logiledger_token");
        localStorage.removeItem("logiledger_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Mock login for demo purposes
      if (!email || !password) {
        return { success: false, error: "Email and password are required" };
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock successful login
      const mockUser = {
        id: `user_${Date.now()}`,
        name: "Demo User",
        email,
        userType: email.includes("company") ? "company" : "msme",
        companyName: email.includes("company")
          ? "Demo Company"
          : "Demo Transport",
        phoneNumber: "+91-9876543210",
        location: "Mumbai, Maharashtra",
        createdAt: new Date().toISOString(),
      };

      const mockToken = `mock_token_${Date.now()}`;

      localStorage.setItem("logiledger_token", mockToken);
      localStorage.setItem("logiledger_user", JSON.stringify(mockUser));
      setUser(mockUser);
      return { success: true, user: mockUser };
    } catch (error) {
      return { success: false, error: "Login failed. Please try again." };
    }
  };

  const register = async (userData) => {
    try {
      // Validation
      if (
        !userData.name ||
        !userData.email ||
        !userData.password ||
        !userData.userType
      ) {
        return { success: false, error: "All required fields must be filled" };
      }

      if (userData.password !== userData.confirmPassword) {
        return { success: false, error: "Passwords do not match" };
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock successful registration
      const mockUser = {
        id: `user_${Date.now()}`,
        name: userData.name,
        email: userData.email,
        userType: userData.userType,
        companyName: userData.companyName || "",
        phoneNumber: userData.phoneNumber || "",
        location: userData.location || "",
        gstNumber: userData.gstNumber || "",
        createdAt: new Date().toISOString(),
      };

      const mockToken = `mock_token_${Date.now()}`;

      localStorage.setItem("logiledger_token", mockToken);
      localStorage.setItem("logiledger_user", JSON.stringify(mockUser));
      setUser(mockUser);
      return { success: true, user: mockUser };
    } catch (error) {
      return {
        success: false,
        error: "Registration failed. Please try again.",
      };
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
