import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

/**
 * Extract token from Authorization header
 * Supports: "Bearer <token>" or just "<token>"
 */
const extractToken = (authHeader) => {
  if (!authHeader) return null;
  
  // Remove "Bearer " prefix if present (case insensitive)
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.substring(7).trim();
  }
  
  // Otherwise treat entire header as token
  return authHeader.trim();
};

/**
 * Verify JWT token and attach user to req.user
 */
export const verifyToken = (req, res, next) => {
  try {
    // 1. Get authorization header
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access token missing. Please provide a valid token."
      });
    }

    // 2. Extract the token
    const token = extractToken(authHeader);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token not found in authorization header."
      });
    }

    // 3. Validate JWT_SECRET exists
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("❌ JWT_SECRET environment variable is not set");
      return res.status(500).json({
        success: false,
        message: "Server configuration error: JWT secret missing"
      });
    }

    // 4. Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtError) {
      console.error("❌ JWT verification error:", jwtError.message);
      
      // Specific error messages based on error type
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token has expired. Please login again."
        });
      }
      
      if (jwtError.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid token format or signature. Please login again."
        });
      }
      
      return res.status(401).json({
        success: false,
        message: "Token verification failed: " + jwtError.message
      });
    }

    // 5. Extract user ID from decoded token
    const userId = decoded.id || decoded.userId || decoded._id || decoded.sub;
    
    if (!userId) {
      console.error("❌ Token payload missing user identifier:", Object.keys(decoded));
      return res.status(401).json({
        success: false,
        message: "Invalid token payload: user identifier not found"
      });
    }

    // 6. Attach user object (all fields as strings for consistency)
    req.user = {
      id: String(userId),
      email: decoded.email || "",
      role: decoded.role || "user",
      // Also keep original decoded data if needed
      ...decoded
    };

    // Optional: Log in development only
    if (process.env.NODE_ENV !== "production") {
      console.log(`✅ [Auth] User ${req.user.id} (${req.user.role}) authenticated successfully`);
    }

    next();
  } catch (error) {
    console.error("❌ Unexpected error in verifyToken middleware:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication"
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {string|string[]} roles - Allowed role(s)
 */
export const checkRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required before checking roles"
      });
    }
    
    if (!req.user.role) {
      return res.status(403).json({
        success: false,
        message: "User role not assigned. Contact administrator."
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(", ")}. Your role: ${req.user.role}`
      });
    }
    
    next();
  };
};

// Optional: Middleware to optionally verify token (doesn't fail if missing)
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) {
    req.user = null;
    return next();
  }
  
  try {
    const token = extractToken(authHeader);
    if (!token) {
      req.user = null;
      return next();
    }
    
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      req.user = null;
      return next();
    }
    
    const decoded = jwt.verify(token, secret);
    const userId = decoded.id || decoded.userId || decoded._id || decoded.sub;
    if (userId) {
      req.user = {
        id: String(userId),
        email: decoded.email || "",
        role: decoded.role || "user"
      };
    } else {
      req.user = null;
    }
  } catch (err) {
    req.user = null;
  }
  
  next();
};