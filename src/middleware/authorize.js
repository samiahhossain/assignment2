/**
 * src/middleware/authorize.js
 *
 * Factory that returns an Express middleware enforcing role-based access.
 * Usage in routes:  router.get('/...', authenticate, authorize('clinician','admin_assistant'), handler)
 *
 * The ...allowedRoles spread accepts one or more role strings.
 * If the authenticated user's role is not in the list, responds 403.
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      // authenticate middleware should always run first, but guard anyway
      return res.status(401).json({
        status: 'error',
        code: 'MISSING_TOKEN',
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        code: 'INSUFFICIENT_ROLE',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}.`,
      });
    }

    next();
  };
}

module.exports = authorize;
