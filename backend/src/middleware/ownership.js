import { pool } from '../db/pool.js';

/**
 * Resolve the owning college of a candidate, looked up by any known identifier
 * (candidate_profiles id/user_id, or users id). Returns null when unknown.
 */
const collegeOfCandidate = async (targetId) => {
  if (!targetId) return null;
  try {
    const r = await pool.query(
      `SELECT college_id FROM candidate_profiles WHERE id = $1 OR user_id = $1
       UNION ALL
       SELECT college_id FROM users WHERE id = $1
       LIMIT 1`,
      [targetId]
    );
    return r.rows[0]?.college_id || null;
  } catch (err) {
    console.error('collegeOfCandidate scope check failed:', err.message);
    return null;
  }
};

/**
 * Read access to a candidate resource: the owner, a platform admin, or a
 * college admin whose college owns the candidate. Returns { ok, code }.
 */
export const canReadCandidate = async (req, targetId) => {
  if (!req.user) return { ok: false, code: 401 };

  if (req.user.role === 'admin') return { ok: true };

  if (req.user.id && targetId && String(req.user.id).trim() === String(targetId).trim()) {
    return { ok: true };
  }

  if (req.user.role === 'college_admin' && req.user.college_id) {
    const collegeId = await collegeOfCandidate(targetId);
    if (collegeId && collegeId === req.user.college_id) return { ok: true };
  }

  return { ok: false, code: 403 };
};

/**
 * Object-Level Authorization Middleware (IDOR / BOLA Prevention)
 * Ensures that only the resource owner or an authorized administrator can modify candidate data.
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

/**
 * Factory: read-only access to a candidate resource addressed by a route param.
 * Owner, platform admin, or a college admin whose college owns the candidate.
 * Writes must keep using `requireSelfOrAdmin` (college admins are read-only).
 */
export const candidateReadAccess = (paramName = 'id') => async (req, res, next) => {
  const { ok, code } = await canReadCandidate(req, req.params[paramName]);
  if (ok) return next();
  return res.status(code).json({
    success: false,
    error: code === 401
      ? 'Access token required.'
      : 'Access denied: You are only permitted to access candidates from your college.'
  });
};

// Default binding for routes addressing the candidate as `:id`
export const requireCandidateReadAccess = candidateReadAccess('id');
