import bcrypt from "bcryptjs";
import { pool } from "../src/db/pool.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeEmail = (value) => typeof value === "string" ? value.trim().toLowerCase() : "";
const readArg = (name) => {
  const inline = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  if (inline) return inline.slice(name.length + 3);
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const email = normalizeEmail(readArg("email"));
const newEmail = normalizeEmail(readArg("new-email"));
const password = readArg("password");
const userId = readArg("id");

if (!email && !userId) {
  console.error("Usage: npm run reset:candidate -- --email <current-email> [--new-email <new-email>] [--password <new-password>]");
  process.exit(1);
}
if (newEmail && !EMAIL_REGEX.test(newEmail)) {
  console.error("The new email is not valid.");
  process.exit(1);
}
if (password && (!/\d/.test(password) || !/[!@#$%^&*]/.test(password) || password.length < 8)) {
  console.error("Password must be at least 8 characters and contain a number and a special character.");
  process.exit(1);
}

const client = await pool.connect();
try {
  await client.query("BEGIN");
  const lookup = userId
    ? await client.query("SELECT id, email, password_hash FROM users WHERE id=$1 AND role='candidate' FOR UPDATE", [userId])
    : await client.query("SELECT id, email, password_hash FROM users WHERE LOWER(email)=LOWER($1) AND role='candidate' FOR UPDATE", [email]);
  if (lookup.rows.length === 0) throw new Error("Candidate account was not found.");

  const user = lookup.rows[0];
  const targetEmail = newEmail || user.email;
  if (targetEmail !== user.email) {
    const conflict = await client.query("SELECT id FROM users WHERE LOWER(email)=LOWER($1) AND id<>$2", [targetEmail, user.id]);
    if (conflict.rows.length > 0) throw new Error("The requested email is already used by another account.");
  }

  const passwordHash = password
    ? await bcrypt.hash(password, Number.parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10))
    : user.password_hash;
  await client.query("UPDATE users SET email=$1, password_hash=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$3", [targetEmail, passwordHash, user.id]);
  await client.query("UPDATE candidate_profiles SET email=$1, updated_at=CURRENT_TIMESTAMP WHERE user_id=$2 OR id=$2", [targetEmail, user.id]);
  await client.query("COMMIT");
  console.log(`Candidate account updated: ${user.email} -> ${targetEmail}`);
  if (password) console.log("Password was reset successfully.");
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  console.error(`Reset failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
