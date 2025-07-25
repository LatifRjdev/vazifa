// Role-based access control middleware

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userRole = req.user.role || 'member';

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: "Access denied. Insufficient permissions.",
        requiredRoles: allowedRoles,
        userRole: userRole
      });
    }

    next();
  };
};

// Specific role middlewares
const requireSuperAdmin = requireRole(['super_admin']);
const requireAdmin = requireRole(['super_admin', 'admin']);
const requireMember = requireRole(['super_admin', 'admin', 'member']);

// Role hierarchy check
const hasPermission = (userRole, requiredRole) => {
  const roleHierarchy = {
    'super_admin': 3,
    'admin': 2,
    'member': 1
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

export {
  requireRole,
  requireSuperAdmin,
  requireAdmin,
  requireMember,
  hasPermission
};
