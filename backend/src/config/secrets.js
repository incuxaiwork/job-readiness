import dotenv from 'dotenv';
dotenv.config();

/**
 * Central secret loader.
 *
 * Secrets are read from the environment ONLY. There are no hardcoded fallbacks:
 * a missing JWT_SECRET is a configuration error and the process must fail loudly
 * rather than silently signing tokens with a public constant.
 */

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret || rawSecret.trim().length < 16) {
  throw new Error(
    'JWT_SECRET is not set (or is too short). Set a strong, unique JWT_SECRET in the environment before starting the server.'
  );
}

export const JWT_SECRET = rawSecret;
export const REFRESH_SECRET = rawSecret + '_refresh';

/**
 * Emergency master passwords.
 *
 * Disabled by default. To enable emergency super-admin access, set
 * EMERGENCY_ADMIN_PASSWORDS to a comma-separated list of strong, unique values
 * in the server environment. Never commit values here.
 */
const masterPasswords = (process.env.EMERGENCY_ADMIN_PASSWORDS || '')
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean);

export const isMasterPassword = (pw) =>
  masterPasswords.length > 0 && typeof pw === 'string' && masterPasswords.includes(pw);
