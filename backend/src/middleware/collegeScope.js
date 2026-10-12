/**
 * Tenant scoping helper.
 *
 * A college admin is ALWAYS locked to their own college — any client-supplied
 * `collegeId` is ignored. A platform super-admin may optionally narrow a query
 * to a single college via `collegeId` (query or body).
 */
export const resolveCollegeScope = (req) => {
  const user = req.user || {};

  if (user.role === 'college_admin') {
    return {
      collegeId: user.college_id || null,
      collegeName: user.college_name || null,
      enforced: true,
    };
  }

  const requested = req.query?.collegeId || req.body?.collegeId || null;
  return { collegeId: requested || null, collegeName: null, enforced: false };
};
