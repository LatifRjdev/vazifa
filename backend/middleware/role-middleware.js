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
const requireAdmin = requireRole(['super_admin', 'admin', 'chief_manager', 'manager']);
const requireMember = requireRole(['super_admin', 'admin', 'chief_manager', 'manager', 'member']);

// Role hierarchy check
const hasPermission = (userRole, requiredRole) => {
  const roleHierarchy = {
    'super_admin': 4,
    'admin': 3,
    'chief_manager': 3,
    'manager': 2,
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
