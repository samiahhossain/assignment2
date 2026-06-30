
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
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
