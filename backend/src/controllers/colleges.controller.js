import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { pool } from '../db/pool.js';
import { serverError } from '../utils/httpError.js';

const slugify = (value) =>
  String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 28) || 'college';

const generateTempPassword = () => 'C@' + crypto.randomBytes(6).toString('hex');

// GET /api/admin/colleges  (super admin only)
export const listColleges = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*,
        (SELECT COUNT(*)::int FROM candidate_profiles cp WHERE cp.college_id = c.id) AS student_count,
        (SELECT COUNT(*)::int FROM assessment_submissions s WHERE s.college_id = c.id) AS submission_count,
        (SELECT COUNT(*)::int FROM users u WHERE u.college_id = c.id AND u.role = 'college_admin') AS admin_count
      FROM colleges c
      ORDER BY c.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('listColleges error:', err.message);
    serverError(res, err, 'colleges.controller');
  }
};

// POST /api/admin/colleges  (super admin only)
export const createCollege = async (req, res) => {
  const { name, code, domain, city, state, contact_name, contact_email, contact_phone } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ success: false, error: 'College name is required.' });
  }

  const cleanName = String(name).trim();
  const cleanCode = (code ? String(code).trim() : slugify(cleanName)).toLowerCase().replace(/\s+/g, '-');
  if (!/^[a-z0-9-]{2,32}$/.test(cleanCode)) {
    return res.status(400).json({ success: false, error: 'College code must be 2-32 chars (a-z, 0-9, hyphen).' });
  }

  try {
    const existing = await pool.query('SELECT id FROM colleges WHERE LOWER(code) = LOWER($1)', [cleanCode]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'A college with this code already exists.' });
    }

    const id = `col-${cleanCode}`;
    const result = await pool.query(
      `INSERT INTO colleges (id, name, code, domain, city, state, contact_name, contact_email, contact_phone, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'active',$10)
       RETURNING *`,
      [id, cleanName, cleanCode, domain || null, city || null, state || null,
       contact_name || null, contact_email || null, contact_phone || null, req.user?.id || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('createCollege error:', err.message);
    serverError(res, err, 'colleges.controller');
  }
};

// DELETE /api/admin/colleges/:id  (super admin only)
// Removes the college, its college_admin accounts, and unlinks any associated
// students/submissions (their college_id is set NULL via ON DELETE SET NULL).
export const deleteCollege = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const college = await client.query('SELECT id FROM colleges WHERE id = $1', [id]);
    if (college.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'College not found.' });
    }

    const admins = await client.query(
      'DELETE FROM users WHERE college_id = $1 AND role = $2 RETURNING id',
      [id, 'college_admin']
    );
    await client.query('DELETE FROM colleges WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ success: true, data: { id, deletedAdmins: admins.rowCount } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('deleteCollege error:', err.message);
    serverError(res, err, 'colleges.controller');
  } finally {
    client.release();
  }
};

// PATCH /api/admin/colleges/:id  (super admin only)
export const updateCollege = async (req, res) => {
  const { id } = req.params;
  const fields = ['name', 'code', 'domain', 'city', 'state', 'contact_name', 'contact_email', 'contact_phone', 'status'];
  const updates = [];
  const params = [];

  for (const f of fields) {
    if (req.body?.[f] !== undefined) {
      params.push(req.body[f]);
      updates.push(`${f} = $${params.length}`);
    }
  }
  if (updates.length === 0) {
    return res.status(400).json({ success: false, error: 'No fields to update.' });
  }

  try {
    if (req.body?.code !== undefined) {
      const cleanCode = String(req.body.code).trim().toLowerCase().replace(/\s+/g, '-');
      if (!/^[a-z0-9-]{2,32}$/.test(cleanCode)) {
        return res.status(400).json({ success: false, error: 'College code must be 2-32 chars (a-z, 0-9, hyphen).' });
      }
      const dup = await pool.query('SELECT id FROM colleges WHERE LOWER(code) = LOWER($1) AND id <> $2', [cleanCode, id]);
      if (dup.rows.length > 0) {
        return res.status(409).json({ success: false, error: 'A college with this code already exists.' });
      }
      // write normalized code
      const codeIdx = fields.indexOf('code');
      params[codeIdx] = cleanCode;
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE colleges SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'College not found.' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('updateCollege error:', err.message);
    serverError(res, err, 'colleges.controller');
  }
};

// GET /api/admin/colleges/:id/admins  (super admin only)
export const listCollegeAdmins = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, status, created_at
       FROM users WHERE college_id = $1 AND role = 'college_admin'
       ORDER BY created_at ASC`,
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('listCollegeAdmins error:', err.message);
    serverError(res, err, 'colleges.controller');
  }
};

// POST /api/admin/colleges/:id/admins  (super admin only)
export const createCollegeAdmin = async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ success: false, error: 'Admin name is required.' });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return res.status(400).json({ success: false, error: 'A valid email is required.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const tempPassword = password && password.length >= 8 ? password : generateTempPassword();

  try {
    const college = await pool.query('SELECT id, name, status FROM colleges WHERE id = $1', [req.params.id]);
    if (college.rows.length === 0) return res.status(404).json({ success: false, error: 'College not found.' });

    const dup = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
    if (dup.rows.length > 0) return res.status(409).json({ success: false, error: 'A user with this email already exists.' });

    const id = `adm-${crypto.randomBytes(6).toString('hex')}`;
    const hash = await bcrypt.hash(tempPassword, 10);
    const result = await pool.query(
      `INSERT INTO users (id, email, password_hash, role, name, status, college_id)
       VALUES ($1,$2,$3,'college_admin',$4,'active',$5)
       RETURNING id, name, email, role, status, college_id, created_at`,
      [id, cleanEmail, hash, String(name).trim(), req.params.id]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      temporaryPassword: tempPassword,
      note: 'Share this one-time password with the college admin. It will not be shown again.',
    });
  } catch (err) {
    console.error('createCollegeAdmin error:', err.message);
    serverError(res, err, 'colleges.controller');
  }
};

// PATCH /api/admin/colleges/:id/admins/:userId  (super admin only)
export const updateCollegeAdmin = async (req, res) => {
  const { id, userId } = req.params;
  const { password, status, name } = req.body || {};

  try {
    const target = await pool.query('SELECT id FROM users WHERE id = $1 AND college_id = $2 AND role = $3', [userId, id, 'college_admin']);
    if (target.rows.length === 0) return res.status(404).json({ success: false, error: 'College admin not found.' });

    const updates = [];
    const params = [];

    if (password) {
      if (String(password).length < 8) return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });
      params.push(await bcrypt.hash(String(password), 10));
      updates.push(`password_hash = $${params.length}`);
    }
    if (status && ['active', 'suspended'].includes(status)) {
      params.push(status);
      updates.push(`status = $${params.length}`);
    }
    if (name && String(name).trim()) {
      params.push(String(name).trim());
      updates.push(`name = $${params.length}`);
    }
    if (updates.length === 0) return res.status(400).json({ success: false, error: 'Nothing to update.' });

    params.push(userId);
    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${params.length}
       RETURNING id, name, email, role, status, college_id`,
      params
    );
    res.json({ success: true, data: result.rows[0], ...(password ? { temporaryPassword: String(password) } : {}) });
  } catch (err) {
    console.error('updateCollegeAdmin error:', err.message);
    serverError(res, err, 'colleges.controller');
  }
};
