const jwt = require("jsonwebtoken");

function requireAuth(request, response, next) {
  const token = request.headers.authorization?.replace("Bearer ", "");
  if (!token) return response.status(401).json({ error: "Authentication is required." });
  try {
    request.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    response.status(401).json({ error: "Your session has expired. Please sign in again." });
  }
}

function requireAdmin(request, response, next) {
  if (request.user?.role !== "admin") return response.status(403).json({ error: "Administrator access is required." });
  next();
}

module.exports = { requireAuth, requireAdmin };
