import pg from 'pg';
const { Client } = pg;

const client = new Client({
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'postgres'
});

async function main() {
  await client.connect();
  const check = await client.query("SELECT 1 FROM pg_database WHERE datname = 'jobrecipe'");
  if (check.rowCount === 0) {
    await client.query('CREATE DATABASE jobrecipe');
    console.log('Database jobrecipe created successfully.');
  } else {
    console.log('Database jobrecipe already exists.');
  }
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
