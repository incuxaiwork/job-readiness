import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import { pool } from '../src/db/pool.js';
import crypto from 'crypto';

const criteriaData = [
  { company: 'TCS', role: 'Ninja', tenth: 60, twelfth: 60, grad: 60, backlogs: 0, aptitude: 60, reasoning: 60, verbal: 60, technical: 55, coding: 50, overall: 60 },
  { company: 'TCS', role: 'Digital', tenth: 60, twelfth: 60, grad: 60, backlogs: 0, aptitude: 70, reasoning: 70, verbal: 65, technical: 70, coding: 70, overall: 70 },
  { company: 'TCS', role: 'Prime', tenth: 60, twelfth: 60, grad: 60, backlogs: 0, aptitude: 75, reasoning: 75, verbal: 70, technical: 80, coding: 80, overall: 75 },
  { company: 'Infosys', role: 'SE', tenth: 60, twelfth: 60, grad: 60, backlogs: 0, aptitude: 60, reasoning: 60, verbal: 60, technical: 60, coding: 60, overall: 60 },
  { company: 'Infosys', role: 'DSE', tenth: 60, twelfth: 60, grad: 60, backlogs: 0, aptitude: 65, reasoning: 65, verbal: 60, technical: 70, coding: 70, overall: 68 },
  { company: 'Infosys', role: 'Specialist Programmer', tenth: 60, twelfth: 60, grad: 60, backlogs: 0, aptitude: 70, reasoning: 70, verbal: 60, technical: 75, coding: 80, overall: 75 },
  { company: 'Capgemini', role: 'Analyst', tenth: 60, twelfth: 60, grad: 60, backlogs: 0, aptitude: 60, reasoning: 60, verbal: 60, technical: 60, coding: 55, overall: 60 },
  { company: 'Capgemini', role: 'Software Engineer', tenth: 60, twelfth: 60, grad: 60, backlogs: 0, aptitude: 65, reasoning: 65, verbal: 60, technical: 65, coding: 65, overall: 65 },
  { company: 'Accenture', role: 'ASE', tenth: 60, twelfth: 60, grad: 60, backlogs: 0, aptitude: 60, reasoning: 60, verbal: 60, technical: 65, coding: 60, overall: 65 },
  { company: 'Accenture', role: 'Advanced ASE', tenth: 60, twelfth: 60, grad: 60, backlogs: 0, aptitude: 65, reasoning: 65, verbal: 60, technical: 70, coding: 70, overall: 68 },
  { company: 'Wipro', role: 'Project Engineer', tenth: 60, twelfth: 60, grad: 60, backlogs: 0, aptitude: 60, reasoning: 60, verbal: 60, technical: 60, coding: 55, overall: 60 },
  { company: 'Wipro', role: 'Turbo', tenth: 60, twelfth: 60, grad: 60, backlogs: 0, aptitude: 65, reasoning: 65, verbal: 60, technical: 70, coding: 70, overall: 68 },
  { company: 'Cognizant', role: 'GenC', tenth: 60, twelfth: 60, grad: 60, backlogs: 0, aptitude: 60, reasoning: 60, verbal: 60, technical: 60, coding: 60, overall: 60 },
  { company: 'Cognizant', role: 'GenC Pro', tenth: 60, twelfth: 60, grad: 60, backlogs: 0, aptitude: 65, reasoning: 65, verbal: 60, technical: 70, coding: 70, overall: 68 },
  { company: 'Cognizant', role: 'GenC Next', tenth: 60, twelfth: 60, grad: 60, backlogs: 0, aptitude: 70, reasoning: 70, verbal: 65, technical: 75, coding: 75, overall: 72 },
  { company: 'HCLTech', role: 'Graduate Engineer', tenth: 60, twelfth: 60, grad: 60, backlogs: 0, aptitude: 60, reasoning: 60, verbal: 60, technical: 65, coding: 60, overall: 62 },
  { company: 'Tech Mahindra', role: 'Entry Level', tenth: 60, twelfth: 60, grad: 60, backlogs: 0, aptitude: 60, reasoning: 60, verbal: 60, technical: 60, coding: 55, overall: 60 },
  { company: 'LTIMindtree', role: 'Entry Level', tenth: 60, twelfth: 60, grad: 60, backlogs: 0, aptitude: 60, reasoning: 60, verbal: 60, technical: 65, coding: 60, overall: 62 },
  { company: 'IBM', role: 'Associate Developer', tenth: 65, twelfth: 65, grad: 65, backlogs: 0, aptitude: 65, reasoning: 65, verbal: 65, technical: 70, coding: 65, overall: 68 },
  { company: 'Deloitte', role: 'Analyst', tenth: 60, twelfth: 60, grad: 60, backlogs: 0, aptitude: 65, reasoning: 65, verbal: 65, technical: 65, coding: 60, overall: 65 }
];

export async function seedCompanyEligibility() {
  const client = await pool.connect();
  try {
    console.log('Ensuring company_eligibility_criteria table exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS company_eligibility_criteria (
        id VARCHAR(64) PRIMARY KEY,
        company VARCHAR(128) NOT NULL,
        role VARCHAR(128) NOT NULL,
        tenth_percentage NUMERIC(5,2) DEFAULT 60.00,
        twelfth_diploma_percentage NUMERIC(5,2) DEFAULT 60.00,
        graduation_percentage NUMERIC(5,2) DEFAULT 60.00,
        max_backlogs INT DEFAULT 0,
        aptitude_cutoff INT DEFAULT 60,
        reasoning_cutoff INT DEFAULT 60,
        verbal_cutoff INT DEFAULT 60,
        technical_cutoff INT DEFAULT 60,
        coding_cutoff INT DEFAULT 50,
        overall_readiness_cutoff INT DEFAULT 60,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_company_role UNIQUE (company, role)
      );
    `);

    console.log(`Inserting/Updating ${criteriaData.length} company eligibility records...`);

    for (const item of criteriaData) {
      const id = `cec_${crypto.createHash('md5').update(`${item.company}_${item.role}`).digest('hex').slice(0, 16)}`;
      await client.query(`
        INSERT INTO company_eligibility_criteria (
          id, company, role, tenth_percentage, twelfth_diploma_percentage, graduation_percentage,
          max_backlogs, aptitude_cutoff, reasoning_cutoff, verbal_cutoff, technical_cutoff,
          coding_cutoff, overall_readiness_cutoff, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
        ON CONFLICT (company, role) DO UPDATE SET
          tenth_percentage = EXCLUDED.tenth_percentage,
          twelfth_diploma_percentage = EXCLUDED.twelfth_diploma_percentage,
          graduation_percentage = EXCLUDED.graduation_percentage,
          max_backlogs = EXCLUDED.max_backlogs,
          aptitude_cutoff = EXCLUDED.aptitude_cutoff,
          reasoning_cutoff = EXCLUDED.reasoning_cutoff,
          verbal_cutoff = EXCLUDED.verbal_cutoff,
          technical_cutoff = EXCLUDED.technical_cutoff,
          coding_cutoff = EXCLUDED.coding_cutoff,
          overall_readiness_cutoff = EXCLUDED.overall_readiness_cutoff,
          updated_at = CURRENT_TIMESTAMP;
      `, [
        id,
        item.company,
        item.role,
        item.tenth,
        item.twelfth,
        item.grad,
        item.backlogs,
        item.aptitude,
        item.reasoning,
        item.verbal,
        item.technical,
        item.coding,
        item.overall
      ]);
    }

    const { rows } = await client.query('SELECT COUNT(*) as count FROM company_eligibility_criteria;');
    console.log(`✅ Successfully seeded company_eligibility_criteria! Total rows in table: ${rows[0].count}`);

    const sample = await client.query('SELECT company, role, tenth_percentage, graduation_percentage, technical_cutoff, coding_cutoff, overall_readiness_cutoff FROM company_eligibility_criteria ORDER BY company, role LIMIT 5;');
    console.log('Sample rows:', sample.rows);
  } catch (err) {
    console.error('❌ Error seeding company eligibility:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (process.argv[1].endsWith('seed_company_eligibility.js')) {
  seedCompanyEligibility()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
