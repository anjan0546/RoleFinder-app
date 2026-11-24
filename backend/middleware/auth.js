const jwt = require("jsonwebtoken");

/**
 * 🔒 JWT Auth Middleware
 * Protects routes by verifying Bearer token
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided."
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, iat, exp }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again."
      });
    }
    return res.status(401).json({
      success: false,
      message: "Invalid token."
    });
  }
};

module.exports = authMiddleware;
