/**
 * src/middleware/authenticate.js
 *
 * Verifies the JWT in the Authorization: Bearer <token> header.
 * On success, attaches { userId, role, email } to req.user.
 * On failure, responds 401 before the route handler runs.
 */
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      code: 'MISSING_TOKEN',
      message: 'No authentication token was provided.',
    });
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId, role: decoded.role, email: decoded.email };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        code: 'TOKEN_EXPIRED',
        message: 'Your session has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      status: 'error',
      code: 'INVALID_TOKEN',
      message: 'The provided token is invalid.',
    });
  }
}

module.exports = authenticate;
