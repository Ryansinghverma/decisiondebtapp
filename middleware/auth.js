const jwt = require('jsonwebtoken');

// This middleware runs BEFORE protected routes
// It checks if the user is logged in by verifying their token
// Think of it like a bouncer at a door — checks your ID before letting you in

const authMiddleware = (req, res, next) => {
  // The token comes in the request header like: "Bearer eyJhbG..."
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided. Please log in.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify the token using our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach the user's ID to the request so routes can use it
    req.userId = decoded.userId;
    next(); // Move on to the actual route
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
  }
};

module.exports = authMiddleware;
