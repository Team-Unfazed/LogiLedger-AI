import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

// In-memory database (replace with actual database in production)
const users = new Map();

const JWT_SECRET = process.env.JWT_SECRET || "logiledger-ai-secret-key";
const SALT_ROUNDS = 10;

export const handleRegister = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      userType,
      companyName,
      phoneNumber,
      gstNumber,
      location,
    } = req.body;

    // Validation
    if (!name || !email || !password || !userType) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, and user type are required",
      });
    }

    if (!["company", "msme"].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: "User type must be either 'company' or 'msme'",
      });
    }

    // Check if user already exists
    const existingUser = Array.from(users.values()).find(
      (user) => user.email === email,
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const userId = uuidv4();
    const user = {
      id: userId,
      name,
      email,
      password: hashedPassword,
      userType,
      companyName: companyName || "",
      phoneNumber: phoneNumber || "",
      gstNumber: gstNumber || "",
      location: location || "",
      createdAt: new Date().toISOString(),
    };

    users.set(userId, user);

    // Generate JWT token
    const token = jwt.sign({ userId, email, userType }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // Remove password from response
    const { password: _, ...userResponse } = user;

    res.status(201).json({
      success: true,
      token,
      user: userResponse,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = Array.from(users.values()).find((u) => u.email === email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, userType: user.userType },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    // Remove password from response
    const { password: _, ...userResponse } = user;

    res.json({
      success: true,
      token,
      user: userResponse,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const handleVerifyToken = (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.get(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // Remove password from response
    const { password: _, ...userResponse } = user;

    res.json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

// Middleware to authenticate requests
export const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.get(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

// Export users for other modules (temporary, use database in production)
export { users };
