/**
 * Object-Level Authorization Middleware (IDOR / BOLA Prevention)
 * Ensures that only the resource owner or an authorized administrator can access or modify candidate data.
 */
export const requireSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }

  // Administrators have global access across all candidate resources
  if (req.user.role === 'admin') {
    return next();
  }

  const targetId = req.params.id;

  // Candidates may only access and manipulate their own record
  if (req.user.id && targetId && String(req.user.id).trim() === String(targetId).trim()) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Access denied: You are only permitted to access or modify your own candidate profile.'
  });
};
