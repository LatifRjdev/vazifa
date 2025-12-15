/**
 * Middleware for Tech Admin access control
 * 
 * Tech Admin Role: System/Technical operations only
 * - SMS logs and analytics
 * - System health monitoring
 * - Database statistics
 * - Queue management
 * - Server logs
 * - User/task deletion (technical cleanup)
 * 
 * Cannot: Change user roles, access business operations, billing
 */

/**
 * Middleware to restrict access to tech_admin role only
 * Use for: System monitoring, SMS logs, database stats, server operations
 */
export const requireTechAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: "Authentication required",
      code: "AUTH_REQUIRED"
    });
  }

  if (req.user.role !== 'tech_admin') {
    return res.status(403).json({ 
      message: "Technical administrator access required",
      code: "TECH_ADMIN_REQUIRED",
      requiredRole: "tech_admin",
      currentRole: req.user.role
    });
  }
  
  next();
};

/**
 * Middleware for operations that both tech_admin and super_admin can perform
 * Use for: User deletion, password resets, general administration
 */
export const requireAdminAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: "Authentication required",
      code: "AUTH_REQUIRED"
    });
  }

  if (!['tech_admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      message: "Administrator access required",
      code: "ADMIN_ACCESS_REQUIRED",
      allowedRoles: ["tech_admin", "super_admin"],
      currentRole: req.user.role
    });
  }
  
  next();
};

/**
 * Middleware for super_admin only (business operations)
 * Use for: Role changes, billing, business settings, workspace management
 */
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: "Authentication required",
      code: "AUTH_REQUIRED"
    });
  }

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ 
      message: "Super administrator access required",
      code: "SUPER_ADMIN_REQUIRED",
      requiredRole: "super_admin",
      currentRole: req.user.role
    });
  }
  
  next();
};

/**
 * Middleware for any admin level access (tech_admin, super_admin, or admin)
 * Use for: Viewing analytics, reports, general admin features
 */
export const requireAnyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: "Authentication required",
      code: "AUTH_REQUIRED"
    });
  }

  if (!['tech_admin', 'super_admin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      message: "Administrator access required",
      code: "ANY_ADMIN_REQUIRED",
      allowedRoles: ["tech_admin", "super_admin", "admin"],
      currentRole: req.user.role
    });
  }
  
  next();
};
