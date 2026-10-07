import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('⚠️ DATABASE_URL is not set. Running in local fallback mode without PostgreSQL.');
}

const isProduction = process.env.NODE_ENV === 'production';
const isLocalhost = Boolean(connectionString) && (connectionString.includes('localhost') || connectionString.includes('127.0.0.1'));

export const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || process.env.DB_CONNECTION_TIMEOUT || '2500', 10),
      idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT || process.env.DB_IDLE_TIMEOUT || '10000', 10),
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      min: 0,
      max: parseInt(process.env.DATABASE_POOL_MAX || process.env.DB_POOL_MAX || '20', 10),
    })
  : null;

if (pool) {
  pool.on('error', (err, client) => {
    console.error('PostgreSQL idle client error (handled):', err.message);
  });

  pool.on('connect', (client) => {
    client.on('error', (err) => {
      console.error('PostgreSQL client connection error (handled):', err.message);
    });
  });
} else {
  console.warn('⚠️ DATABASE_URL is not set in backend/.env. Database features will run in mock mode.');
}

let isConnected = false;
export const getDbStatus = () => isConnected;

export const testConnection = async (retries = 1, timeoutMs = 2500) => {
  if (!pool) {
    isConnected = false;
    return false;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = await Promise.race([
        pool.connect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), timeoutMs)),
      ]);
      const res = await client.query('SELECT NOW() as time, current_database() as db');
      client.release();
      console.log(`✅ PostgreSQL connected → database: "${res.rows[0].db}" at ${res.rows[0].time}`);
      isConnected = true;
      return true;
    } catch (err) {
      console.error(`⚠️ PostgreSQL connection attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  isConnected = false;
  return false;
};

export const closePool = async () => {
  try {
    if (pool) {
      await pool.end();
      console.log('✅ PostgreSQL connection pool closed gracefully.');
    }
  } catch (err) {
    console.error('⚠️ Error closing PostgreSQL pool:', err.message);
  }
};
