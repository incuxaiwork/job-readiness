import { pool } from './pool.js';
import bcrypt from 'bcryptjs';

const schemaSQL = `
    -- 1. users: Stores authentication and user roles
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(32) NOT NULL,
      name VARCHAR(255) NOT NULL,
      status VARCHAR(32) DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. candidate_profiles: Stores candidate profile information
    CREATE TABLE IF NOT EXISTS candidate_profiles (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE,
      mobile VARCHAR(32),
      college VARCHAR(255),
      degree VARCHAR(128),
      branch VARCHAR(128),
      specialization VARCHAR(128),
      country VARCHAR(128) DEFAULT 'India',
      state VARCHAR(128),
      city VARCHAR(128),
      graduation_year INT,
      experience_level VARCHAR(64),
      tenth_school VARCHAR(255),
      tenth_marks NUMERIC(5,2),
      twelfth_college VARCHAR(255),
      twelfth_diploma_marks NUMERIC(5,2),
      graduation_percentage NUMERIC(5,2),
      cgpa NUMERIC(4,2),
      backlogs INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. candidates: Candidate readiness metrics & assessment performance
    CREATE TABLE IF NOT EXISTS candidates (
      id VARCHAR(64) PRIMARY KEY,
      experience_level VARCHAR(64) DEFAULT 'Fresher',
      readiness_status VARCHAR(64) DEFAULT 'In Progress',
      job_readiness_score INT DEFAULT 0,
      aptitude_score INT DEFAULT 0,
      reasoning_score INT DEFAULT 0,
      technical_score INT DEFAULT 0,
      verbal_score INT DEFAULT 0,
      coding_score INT DEFAULT 0,
      assessments_completed INT DEFAULT 0,
      tenth_marks NUMERIC(5,2),
      twelfth_diploma_marks NUMERIC(5,2),
      graduation_percentage NUMERIC(5,2),
      backlogs INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. assessments: Assessment definitions created by administrators
    CREATE TABLE IF NOT EXISTS assessments (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(64) NOT NULL,
      difficulty VARCHAR(32) DEFAULT 'Medium',
      duration_minutes INT NOT NULL,
      total_questions INT NOT NULL,
      total_marks INT NOT NULL DEFAULT 100,
      passing_score INT NOT NULL DEFAULT 65,
      status VARCHAR(32) DEFAULT 'Available',
      created_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- 5. questions: Main Question Bank with JSONB options & answer keys
    CREATE TABLE IF NOT EXISTS questions (
      id VARCHAR(64) PRIMARY KEY,
      topic_id VARCHAR(64),
      topic VARCHAR(255) DEFAULT 'General',
      category VARCHAR(64) NOT NULL,
      difficulty VARCHAR(32) NOT NULL,
      type VARCHAR(64) NOT NULL,
      question TEXT NOT NULL,
      code_snippet TEXT,
      language VARCHAR(32),
      explanation TEXT,
      marks INT DEFAULT 1,
      time_limit_sec INT DEFAULT 60,
      status VARCHAR(32) DEFAULT 'Active',
      source VARCHAR(32) DEFAULT 'Manual',
      options JSONB,
      correct_answer VARCHAR(16),
      tags TEXT[],
      created_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- 6. submissions: Legacy submissions compatibility table
    CREATE TABLE IF NOT EXISTS submissions (
      id VARCHAR(64) PRIMARY KEY,
      candidate_id VARCHAR(64),
      assessment_id VARCHAR(64),
      score INT NOT NULL,
      accuracy INT NOT NULL,
      correct_count INT NOT NULL DEFAULT 0,
      incorrect_count INT NOT NULL DEFAULT 0,
      unanswered_count INT NOT NULL DEFAULT 0,
      time_taken VARCHAR(64),
      category_scores JSONB,
      topic_breakdown JSONB,
      answers JSONB,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- 7. assessment_submissions: Official submitted assessment attempts & candidate scores
    CREATE TABLE IF NOT EXISTS assessment_submissions (
      id VARCHAR(64) PRIMARY KEY,
      candidate_id VARCHAR(64),
      candidate_name VARCHAR(255),
      candidate_email VARCHAR(255),
      assessment_id VARCHAR(64),
      assessment_title VARCHAR(255),
      score INT NOT NULL,
      accuracy INT NOT NULL,
      correct_count INT NOT NULL DEFAULT 0,
      incorrect_count INT NOT NULL DEFAULT 0,
      unanswered_count INT NOT NULL DEFAULT 0,
      time_taken VARCHAR(64),
      category_scores JSONB,
      topic_breakdown JSONB,
      answers JSONB,
      status VARCHAR(32) DEFAULT 'Completed',
      obtained_marks INT DEFAULT 0,
      total_marks INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- 8. assessment_questions: Questions associated with an assessment with full question details
    CREATE TABLE IF NOT EXISTS assessment_questions (
      id VARCHAR(64) PRIMARY KEY,
      assessment_id VARCHAR(64) NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
      question_id VARCHAR(64) NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      category VARCHAR(64),
      topic VARCHAR(255),
      question TEXT,
      difficulty VARCHAR(32),
      options JSONB,
      correct_answer VARCHAR(16),
      marks INT DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_assessment_question UNIQUE (assessment_id, question_id)
    );

    -- 8b. assessment_sections: Sections inside an assessment (multi-section tests)
    CREATE TABLE IF NOT EXISTS assessment_sections (
      id VARCHAR(64) PRIMARY KEY,
      assessment_id VARCHAR(64) NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
      name VARCHAR(128) NOT NULL,
      description TEXT,
      question_count INT DEFAULT 0,
      marks_per_question INT DEFAULT 1,
      duration_minutes INT DEFAULT 30,
      display_order INT DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE assessment_questions ADD COLUMN IF NOT EXISTS section_id VARCHAR(64) REFERENCES assessment_sections(id) ON DELETE SET NULL;

    -- 9. company_eligibility_criteria: Standardized company eligibility criteria and cutoffs
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

    -- 10. proctoring_events: Stores face-presence, gaze orientation & proctoring violation logs
    CREATE TABLE IF NOT EXISTS proctoring_events (
      id VARCHAR(64) PRIMARY KEY,
      attempt_id VARCHAR(128) NOT NULL,
      candidate_id VARCHAR(64),
      assessment_id VARCHAR(64),
      type VARCHAR(64) NOT NULL,
      timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      details JSONB
    );

    -- 11. test_attempts: Stores every candidate's attempt of an assessment
    CREATE TABLE IF NOT EXISTS test_attempts (
      id VARCHAR(64) PRIMARY KEY,
      candidate_id VARCHAR(64) NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
      assessment_id VARCHAR(64) NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
      attempt_number INT DEFAULT 1,
      status VARCHAR(32) DEFAULT 'InProgress',
      started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      submitted_at TIMESTAMPTZ,
      time_taken_seconds INT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- 12. candidate_answers: Individual saved answers for an attempt (save-as-you-go)
    CREATE TABLE IF NOT EXISTS candidate_answers (
      id VARCHAR(64) PRIMARY KEY,
      attempt_id VARCHAR(64) NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
      question_id VARCHAR(64) NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      selected_option VARCHAR(8),
      is_correct BOOLEAN,
      marks_obtained NUMERIC DEFAULT 0,
      time_taken_seconds INT,
      answered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS uq_candidate_answer ON candidate_answers(attempt_id, question_id);

    -- 13. performance_analysis: Overall analysis per attempt
    CREATE TABLE IF NOT EXISTS performance_analysis (
      id VARCHAR(64) PRIMARY KEY,
      attempt_id VARCHAR(64) NOT NULL UNIQUE REFERENCES test_attempts(id) ON DELETE CASCADE,
      overall_score NUMERIC DEFAULT 0,
      accuracy NUMERIC DEFAULT 0,
      speed_score NUMERIC DEFAULT 0,
      aptitude_score NUMERIC,
      reasoning_score NUMERIC,
      technical_score NUMERIC,
      strengths JSONB,
      weaknesses JSONB,
      ai_summary TEXT,
      recommendations JSONB,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- 14. section_attempts: Tracks per-section progress & strict timer for a test attempt
    --      section_id is NULL for a single implicit section (assessments with no admin-defined sections)
    CREATE TABLE IF NOT EXISTS section_attempts (
      id VARCHAR(64) PRIMARY KEY,
      attempt_id VARCHAR(64) NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
      section_id VARCHAR(64) REFERENCES assessment_sections(id) ON DELETE CASCADE,
      status VARCHAR(32) DEFAULT 'Pending',
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      time_limit_seconds INT DEFAULT 1800,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_attempt_section UNIQUE (attempt_id, section_id)
    );
`;

export const initSchema = async () => {
  const LOCK_KEY = 74639201;
  let client;

  try {
    client = await pool.connect();
    // Acquire session-level advisory lock so only 1 replica runs migrations at a time
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);

    // 1. Core Schema initialization (no dropping of active tables)

    // 2. Synchronize Production Core Schema (including candidate_profiles)
    await client.query(schemaSQL);
    console.log('✅ Production Database Tables synchronized successfully.');

    // 3. Backfill candidate_profiles from users table if missing
    await client.query(`
      INSERT INTO candidate_profiles (
        id, user_id, name, email, created_at
      )
      SELECT 
        u.id,
        u.id,
        u.name,
        u.email,
        u.created_at
      FROM users u
      WHERE u.role = 'candidate'
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ candidate_profiles table verified.');

    // 4. Safe column migrations for active tables
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'active';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

      -- Section-based assessment: per-section strict timer
      ALTER TABLE assessment_sections ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 30;
      ALTER TABLE section_attempts ALTER COLUMN section_id DROP NOT NULL;

      ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS specialization VARCHAR(128);
      ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS country VARCHAR(128) DEFAULT 'India';
      ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS state VARCHAR(128);
      ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS city VARCHAR(128);
      ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS tenth_school VARCHAR(255);
      ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS tenth_marks NUMERIC(5,2);
      ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS twelfth_college VARCHAR(255);
      ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS twelfth_diploma_marks NUMERIC(5,2);
      ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS graduation_percentage NUMERIC(5,2);
      ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS cgpa NUMERIC(4,2);
      ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS backlogs INT DEFAULT 0;
      ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

      ALTER TABLE candidates ADD COLUMN IF NOT EXISTS job_readiness_score INT DEFAULT 0;
      ALTER TABLE candidates ADD COLUMN IF NOT EXISTS aptitude_score INT DEFAULT 0;
      ALTER TABLE candidates ADD COLUMN IF NOT EXISTS reasoning_score INT DEFAULT 0;
      ALTER TABLE candidates ADD COLUMN IF NOT EXISTS technical_score INT DEFAULT 0;
      ALTER TABLE candidates ADD COLUMN IF NOT EXISTS verbal_score INT DEFAULT 0;
      ALTER TABLE candidates ADD COLUMN IF NOT EXISTS coding_score INT DEFAULT 0;
      ALTER TABLE candidates ADD COLUMN IF NOT EXISTS tenth_marks NUMERIC(5,2);
      ALTER TABLE candidates ADD COLUMN IF NOT EXISTS twelfth_diploma_marks NUMERIC(5,2);
      ALTER TABLE candidates ADD COLUMN IF NOT EXISTS graduation_percentage NUMERIC(5,2);
      ALTER TABLE candidates ADD COLUMN IF NOT EXISTS backlogs INT DEFAULT 0;
      ALTER TABLE candidates DROP COLUMN IF EXISTS readiness_level;
      ALTER TABLE candidates DROP COLUMN IF EXISTS country;
      ALTER TABLE candidates DROP COLUMN IF EXISTS state;
      ALTER TABLE candidates DROP COLUMN IF EXISTS city;
      ALTER TABLE candidates DROP COLUMN IF EXISTS primary_skill;
      ALTER TABLE candidates DROP COLUMN IF EXISTS name;
      ALTER TABLE candidates DROP COLUMN IF EXISTS email;
      ALTER TABLE candidates DROP COLUMN IF EXISTS mobile;
      ALTER TABLE candidates DROP COLUMN IF EXISTS college;
      ALTER TABLE candidates DROP COLUMN IF EXISTS degree;
      ALTER TABLE candidates DROP COLUMN IF EXISTS branch;
      ALTER TABLE candidates DROP COLUMN IF EXISTS graduation_year;
      ALTER TABLE candidates DROP COLUMN IF EXISTS specialization;
      ALTER TABLE candidates DROP COLUMN IF EXISTS tenth_certificate;
      ALTER TABLE candidates DROP COLUMN IF EXISTS twelfth_certificate;
      ALTER TABLE candidates DROP COLUMN IF EXISTS resume_file;

      ALTER TABLE assessments ADD COLUMN IF NOT EXISTS total_marks INT DEFAULT 100;
      ALTER TABLE assessments ADD COLUMN IF NOT EXISTS passing_score INT DEFAULT 65;
      ALTER TABLE assessments ADD COLUMN IF NOT EXISTS created_by VARCHAR(64);
      ALTER TABLE assessments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
      UPDATE assessments SET status = 'Available' WHERE status = 'Draft' OR status IS NULL;

      ALTER TABLE questions ADD COLUMN IF NOT EXISTS topic_id VARCHAR(64);
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS topic VARCHAR(255) DEFAULT 'General';
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS category VARCHAR(64) DEFAULT 'Technical';
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS difficulty VARCHAR(32) DEFAULT 'Medium';
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS type VARCHAR(64) DEFAULT 'Single Choice';
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS question TEXT;
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS code_snippet TEXT;
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS language VARCHAR(32);
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS explanation TEXT;
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS options JSONB;
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS correct_answer VARCHAR(16) DEFAULT 'A';
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS marks INT DEFAULT 4;
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS time_limit_sec INT DEFAULT 60;
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS tags TEXT[];
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'Active';
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS source VARCHAR(32) DEFAULT 'Manual';
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS test_cases JSONB;
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS starter_templates JSONB;
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS constraints TEXT;
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS created_by VARCHAR(64);
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

      ALTER TABLE assessment_questions ADD COLUMN IF NOT EXISTS test_cases JSONB;
      ALTER TABLE assessment_questions ADD COLUMN IF NOT EXISTS starter_templates JSONB;
      ALTER TABLE assessment_questions ADD COLUMN IF NOT EXISTS constraints TEXT;

      ALTER TABLE assessment_questions ADD COLUMN IF NOT EXISTS category VARCHAR(64);
      ALTER TABLE assessment_questions ADD COLUMN IF NOT EXISTS topic VARCHAR(255);
      ALTER TABLE assessment_questions ADD COLUMN IF NOT EXISTS question TEXT;
      ALTER TABLE assessment_questions ADD COLUMN IF NOT EXISTS difficulty VARCHAR(32);
      ALTER TABLE assessment_questions ADD COLUMN IF NOT EXISTS options JSONB;
      ALTER TABLE assessment_questions ADD COLUMN IF NOT EXISTS correct_answer VARCHAR(16);
      ALTER TABLE assessment_questions ADD COLUMN IF NOT EXISTS marks INT DEFAULT 1;

      ALTER TABLE assessment_submissions ADD COLUMN IF NOT EXISTS proctoring_violations INT DEFAULT 0;
      ALTER TABLE assessment_submissions ADD COLUMN IF NOT EXISTS auto_submitted BOOLEAN DEFAULT FALSE;
      ALTER TABLE assessment_submissions ADD COLUMN IF NOT EXISTS auto_submit_reason VARCHAR(128);
      ALTER TABLE assessment_submissions ADD COLUMN IF NOT EXISTS obtained_marks INT DEFAULT 0;
      ALTER TABLE assessment_submissions ADD COLUMN IF NOT EXISTS total_marks INT DEFAULT 0;

      CREATE INDEX IF NOT EXISTS idx_proctoring_attempt ON proctoring_events(attempt_id);
      CREATE INDEX IF NOT EXISTS idx_proctoring_candidate ON proctoring_events(candidate_id);
      CREATE INDEX IF NOT EXISTS idx_proctoring_assessment ON proctoring_events(assessment_id);
    `);
    console.log('✅ Safe column alterations applied.');

    // 4b. Sync latest assessment scores to candidates table (job readiness, aptitude, reasoning, technical, verbal)
    await client.query(`
      UPDATE candidates c
      SET 
        job_readiness_score = COALESCE(sub.latest_score, c.job_readiness_score, 0),
        aptitude_score = COALESCE(
          NULLIF((sub.category_scores->>'aptitude'), '')::int,
          NULLIF((sub.category_scores->>'Aptitude'), '')::int,
          c.aptitude_score,
          0
        ),
        reasoning_score = COALESCE(
          NULLIF((sub.category_scores->>'reasoning'), '')::int,
          NULLIF((sub.category_scores->>'Reasoning'), '')::int,
          c.reasoning_score,
          0
        ),
        technical_score = COALESCE(
          NULLIF((sub.category_scores->>'technical'), '')::int,
          NULLIF((sub.category_scores->>'Technical'), '')::int,
          c.technical_score,
          0
        ),
        verbal_score = COALESCE(
          NULLIF((sub.category_scores->>'verbal'), '')::int,
          NULLIF((sub.category_scores->>'Verbal'), '')::int,
          NULLIF((sub.category_scores->>'english'), '')::int,
          0
        ),
        coding_score = COALESCE(
          NULLIF((sub.category_scores->>'coding'), '')::int,
          NULLIF((sub.category_scores->>'Coding'), '')::int,
          c.coding_score,
          0
        )
      FROM (
        SELECT DISTINCT ON (candidate_id) candidate_id, score AS latest_score, category_scores
        FROM assessment_submissions
        WHERE candidate_id IS NOT NULL AND category_scores IS NOT NULL AND category_scores::text != '{}'
        ORDER BY candidate_id, created_at DESC
      ) sub
      WHERE c.id = sub.candidate_id;
    `);

    // 5. Performance Indexes for Scalability & High-Concurrency Load
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_candidate_profiles_user_id ON candidate_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_candidate_profiles_email ON candidate_profiles(email);
      DROP INDEX IF EXISTS idx_candidates_email;
      CREATE INDEX IF NOT EXISTS idx_questions_category_diff ON questions(category, difficulty);
      CREATE INDEX IF NOT EXISTS idx_submissions_candidate_id ON assessment_submissions(candidate_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_cand_asm ON assessment_submissions(candidate_id, assessment_id);
      CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment_id ON assessment_questions(assessment_id);
      CREATE INDEX IF NOT EXISTS idx_assessment_questions_question_id ON assessment_questions(question_id);

      -- Deduplicate legacy rows in assessment_submissions if present before applying unique index
      DELETE FROM assessment_submissions a
      USING assessment_submissions b
      WHERE a.ctid < b.ctid
        AND a.candidate_id IS NOT NULL
        AND a.assessment_id IS NOT NULL
        AND a.candidate_id = b.candidate_id
        AND a.assessment_id = b.assessment_id;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_cand_asm_unique 
      ON assessment_submissions(candidate_id, assessment_id);
    `);
    console.log('✅ Performance indexes and duplicate submission prevention constraint applied.');

    // 6. Ensure permanent single admin account exists
    const adminHash = await bcrypt.hash('Admin@2026', 10);
    await client.query(`
      INSERT INTO users (id, email, password_hash, role, name, status)
      VALUES ('admin-1', 'admin@readysetjob.com', $1, 'admin', 'HR Administrator', 'active')
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin', status = 'active';
    `, [adminHash]);
    console.log('✅ Permanent single admin credential verified (admin@readysetjob.com).');

    // 7. Seed standard company eligibility criteria
    const criteria = [
      ['cec_1', 'TCS', 'Ninja', 60, 60, 60, 0, 60, 60, 60, 55, 50, 60],
      ['cec_2', 'TCS', 'Digital', 60, 60, 60, 0, 70, 70, 65, 70, 70, 70],
      ['cec_3', 'TCS', 'Prime', 60, 60, 60, 0, 75, 75, 70, 80, 80, 75],
      ['cec_4', 'Infosys', 'SE', 60, 60, 60, 0, 60, 60, 60, 60, 60, 60],
      ['cec_5', 'Infosys', 'DSE', 60, 60, 60, 0, 65, 65, 60, 70, 70, 68],
      ['cec_6', 'Infosys', 'Specialist Programmer', 60, 60, 60, 0, 70, 70, 60, 75, 80, 75],
      ['cec_7', 'Capgemini', 'Analyst', 60, 60, 60, 0, 60, 60, 60, 60, 55, 60],
      ['cec_8', 'Capgemini', 'Software Engineer', 60, 60, 60, 0, 65, 65, 60, 65, 65, 65],
      ['cec_9', 'Accenture', 'ASE', 60, 60, 60, 0, 60, 60, 60, 65, 60, 65],
      ['cec_10', 'Accenture', 'Advanced ASE', 60, 60, 60, 0, 65, 65, 60, 70, 70, 68],
      ['cec_11', 'Wipro', 'Project Engineer', 60, 60, 60, 0, 60, 60, 60, 60, 55, 60],
      ['cec_12', 'Wipro', 'Turbo', 60, 60, 60, 0, 65, 65, 60, 70, 70, 68],
      ['cec_13', 'Cognizant', 'GenC', 60, 60, 60, 0, 60, 60, 60, 60, 60, 60],
      ['cec_14', 'Cognizant', 'GenC Pro', 60, 60, 60, 0, 65, 65, 60, 70, 70, 68],
      ['cec_15', 'Cognizant', 'GenC Next', 60, 60, 60, 0, 70, 70, 65, 75, 75, 72],
      ['cec_16', 'HCLTech', 'Graduate Engineer', 60, 60, 60, 0, 60, 60, 60, 65, 60, 62],
      ['cec_17', 'Tech Mahindra', 'Entry Level', 60, 60, 60, 0, 60, 60, 60, 60, 55, 60],
      ['cec_18', 'LTIMindtree', 'Entry Level', 60, 60, 60, 0, 60, 60, 60, 65, 60, 62],
      ['cec_19', 'IBM', 'Associate Developer', 65, 65, 65, 0, 65, 65, 65, 70, 65, 68],
      ['cec_20', 'Deloitte', 'Analyst', 60, 60, 60, 0, 65, 65, 65, 65, 60, 65]
    ];

    for (const c of criteria) {
      await client.query(`
        INSERT INTO company_eligibility_criteria (
          id, company, role, tenth_percentage, twelfth_diploma_percentage, graduation_percentage,
          max_backlogs, aptitude_cutoff, reasoning_cutoff, verbal_cutoff, technical_cutoff,
          coding_cutoff, overall_readiness_cutoff
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
      `, c);
    }
    console.log('✅ Company eligibility criteria synchronized successfully.');
  } catch (err) {
    console.error('❌ Schema initialization error:', err.message);
    throw err;
  } finally {
    if (client) {
      try {
        await client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]);
      } catch (unlockErr) {
        console.error('⚠️ Advisory unlock warning:', unlockErr.message);
      }
      client.release();
    }
  }
};
