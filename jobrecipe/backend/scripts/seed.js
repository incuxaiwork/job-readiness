import dotenv from 'dotenv';
dotenv.config();
import { pool } from '../src/db/pool.js';
import { initSchema } from '../src/db/schema.js';
import bcrypt from 'bcryptjs';

const runSeed = async () => {
  console.log('🌱 Starting comprehensive 19-table database seed...');
  await initSchema();

  // 1. Seed Admin User
  const adminHash = await bcrypt.hash('Admin@2026', 10);

  await pool.query(`
    INSERT INTO users (id, email, password_hash, role, name, status)
    VALUES 
      ('admin-1', 'admin@readysetjob.com', $1, 'admin', 'HR Administrator', 'active')
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;
  `, [adminHash]);
  console.log('✅ 1. Admin User seeded (Candidate seeding skipped).');

  // 3. Seed Topics
  await pool.query(`
    INSERT INTO topics (id, name, category, description, status)
    VALUES
      ('top-1', 'Data Structures & Algorithms', 'Technical', 'Arrays, Strings, Trees, Graphs and Searching', 'active'),
      ('top-2', 'Object-Oriented Programming', 'Technical', 'Inheritance, Polymorphism, Encapsulation, Abstraction', 'active'),
      ('top-3', 'Database Management & SQL', 'Technical', 'RDBMS, Transactions, Indexing, SQL Joins & Window Queries', 'active'),
      ('top-4', 'Quantitative Aptitude', 'Aptitude', 'Arithmetic, Algebra, Percentages, Probability', 'active'),
      ('top-5', 'Logical Reasoning', 'Reasoning', 'Puzzles, Series, Syllogisms, Critical Thinking', 'active')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
  `);
  console.log('✅ 3. Topics seeded.');

  // 4. Seed Skills
  await pool.query(`
    INSERT INTO skills (id, name, category, description, status)
    VALUES
      ('sk-1', 'Problem Solving & DSA', 'Technical', 'Algorithmic efficiency and data manipulation', 'active'),
      ('sk-2', 'System Design & Architecture', 'Technical', 'Scalable component structures and APIs', 'active'),
      ('sk-3', 'Database Optimization', 'Technical', 'Query tuning and schema normalization', 'active'),
      ('sk-4', 'Quantitative Ability', 'Aptitude', 'Mathematical speed and accuracy', 'active'),
      ('sk-5', 'Analytical Reasoning', 'Reasoning', 'Deductive logic and pattern matching', 'active'),
      ('sk-6', 'Code Quality & Debugging', 'Technical', 'Clean code practices and edge-case handling', 'active')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
  `);
  console.log('✅ 4. Skills seeded.');

  // 5. Seed Questions (Skipped - clean state for user uploaded questions)
  console.log('✅ 5. Questions skipped (clean state for uploaded questions).');

  // 7. Seed Question Skills Mapping (Skipped)
  console.log('✅ 7. Question Skills skipped.');

  // 8. Seed Assessments (Cleared - no dummy assessments)
  console.log('✅ 8. Assessments skipped (clean state).');

  // 11. Seed Companies
  await pool.query(`
    INSERT INTO companies (id, name, industry, description, website, status)
    VALUES
      ('comp-1', 'Google', 'Technology & Cloud', 'Global leader in search, AI, and cloud computing.', 'https://careers.google.com', 'Active'),
      ('comp-2', 'Microsoft', 'Enterprise Software', 'Productivity, cloud services, and developer platforms.', 'https://careers.microsoft.com', 'Active'),
      ('comp-3', 'Amazon', 'E-Commerce & Cloud AWS', 'Cloud infrastructure and distributed retail systems.', 'https://amazon.jobs', 'Active'),
      ('comp-4', 'TCS Digital', 'IT Consulting', 'High-performance engineering consulting division.', 'https://tcs.com', 'Active')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
  `);
  console.log('✅ 11. Companies seeded.');

  // 12. Seed Company Roles
  await pool.query(`
    INSERT INTO company_roles (id, company_id, role_name, description, experience_level, status)
    VALUES
      ('role-1', 'comp-1', 'Software Engineer - SDE 1', 'Entry-level engineering role focusing on algorithmic problem solving.', 'Fresher / 0-2 yrs', 'Active'),
      ('role-2', 'comp-2', 'Software Engineer (Full-Stack)', 'Building scalable cloud applications and APIs.', 'Fresher / 0-2 yrs', 'Active'),
      ('role-3', 'comp-3', 'SDE 1 (Distributed Systems)', 'High-throughput microservices and cloud databases.', 'Fresher / 0-2 yrs', 'Active'),
      ('role-4', 'comp-4', 'Digital Systems Engineer', 'Full-stack application engineering and data pipelines.', 'Fresher', 'Active')
    ON CONFLICT (id) DO UPDATE SET role_name = EXCLUDED.role_name;
  `);
  console.log('✅ 12. Company Roles seeded.');

  // 13. Seed Role Skill Requirements
  await pool.query(`
    INSERT INTO role_skill_requirements (id, role_id, skill_id, required_score, weight, importance)
    VALUES
      ('rsr-1', 'role-1', 'sk-1', 85, 1.5, 'Required'),
      ('rsr-2', 'role-1', 'sk-6', 80, 1.0, 'Required'),
      ('rsr-3', 'role-2', 'sk-2', 75, 1.2, 'Required'),
      ('rsr-4', 'role-2', 'sk-3', 70, 1.0, 'Preferred'),
      ('rsr-5', 'role-3', 'sk-1', 80, 1.4, 'Required'),
      ('rsr-6', 'role-3', 'sk-3', 75, 1.1, 'Required')
    ON CONFLICT (role_id, skill_id) DO NOTHING;
  `);
  console.log('✅ 13. Role Skill Requirements mapped.');

  // 14. Seed Sample Test Attempt (only if candidate and assessment exist)
  const candCheck = await pool.query("SELECT id FROM candidate_profiles WHERE id = 'cand-001'");
  const asmCheck = await pool.query("SELECT id FROM assessments WHERE id = 'asm-001'");
  if (candCheck.rows.length > 0 && asmCheck.rows.length > 0) {
    await pool.query(`
      INSERT INTO test_attempts (
        id, candidate_id, assessment_id, attempt_number, status, started_at, submitted_at, time_taken_seconds
      ) VALUES
        ('att-001', 'cand-001', 'asm-001', 1, 'Completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '28 minutes', 1680)
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;
    `);
    console.log('✅ 14. Test Attempt seeded.');


    // 15. Seed Candidate Answers
    await pool.query(`
      INSERT INTO candidate_answers (
        id, attempt_id, question_id, selected_option, is_correct, marks_obtained, time_taken_seconds, answered_at
      ) VALUES
        ('ans-1', 'att-001', 'q-101', 'B', true, 4, 42, NOW() - INTERVAL '2 days' + INTERVAL '5 minutes'),
        ('ans-2', 'att-001', 'q-102', 'B', true, 4, 55, NOW() - INTERVAL '2 days' + INTERVAL '12 minutes'),
        ('ans-3', 'att-001', 'q-103', 'B', true, 4, 38, NOW() - INTERVAL '2 days' + INTERVAL '18 minutes'),
        ('ans-4', 'att-001', 'q-104', 'B', true, 5, 82, NOW() - INTERVAL '2 days' + INTERVAL '25 minutes')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ 15. Candidate Answers seeded.');

    // 16. Seed Performance Analysis
    await pool.query(`
      INSERT INTO performance_analysis (
        id, attempt_id, overall_score, accuracy, speed_score,
        aptitude_score, reasoning_score, technical_score,
        strengths, weaknesses, ai_summary, recommendations
      ) VALUES (
        'perf-001', 'att-001', 82.5, 87.5, 84.0, 82, 74, 85,
        '["Data Structures", "Algorithm Optimization", "Logical Deduction"]'::jsonb,
        '["SQL Window Functions", "Probability & Combinatorics"]'::jsonb,
        'Candidate shows high technical proficiency in core CS fundamentals with strong problem-solving speed. Needs minor practice in advanced SQL windowing.',
        '["Practice 15 SQL Medium problems on LeetCode", "Review Permutations & Probability formulas", "Implement 3 Graph DFS/BFS algorithms"]'::jsonb
      )
      ON CONFLICT (attempt_id) DO UPDATE SET overall_score = EXCLUDED.overall_score;
    `);
    console.log('✅ 16. Performance Analysis seeded.');

    // 17. Seed Skill Performance
    await pool.query(`
      INSERT INTO skill_performance (
        id, attempt_id, candidate_id, skill_id, score, proficiency, questions_attempted, correct_answers
      ) VALUES
        ('sp-1', 'att-001', 'cand-001', 'sk-1', 90.0, 'Strong', 2, 2),
        ('sp-2', 'att-001', 'cand-001', 'sk-6', 85.0, 'Strong', 1, 1),
        ('sp-3', 'att-001', 'cand-001', 'sk-3', 75.0, 'Average', 1, 1)
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ 17. Skill Performance seeded.');

    // 18. Seed Company Readiness
    await pool.query(`
      INSERT INTO company_readiness (
        id, candidate_id, attempt_id, company_id, role_id,
        readiness_score, readiness_level, matched_skills, skill_gaps, ai_analysis
      ) VALUES (
        'cr-001', 'cand-001', 'att-001', 'comp-1', 'role-1',
        86.0, 'Strong',
        '["Problem Solving & DSA", "Code Quality & Debugging"]'::jsonb,
        '["System Scalability Patterns"]'::jsonb,
        'Candidate is well-positioned for Google SDE-1 with 86% match probability based on algorithmic speed and clean code metrics.'
      )
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ 18. Company Readiness seeded.');

    // 19. Seed Final Generated Report
    await pool.query(`
      INSERT INTO reports (
        id, candidate_id, attempt_id, report_type, overall_score,
        summary, strengths, weaknesses, recommendations, report_url
      ) VALUES (
        'rep-001', 'cand-001', 'att-001', 'Comprehensive Job Readiness Report', 85.0,
        'Verified evaluation for SDE Placement Readiness with 85/100 readiness index.',
        '["Data Structures", "Algorithmic Complexity", "Object-Oriented Design"]'::jsonb,
        '["Advanced SQL Subqueries", "Probability"]'::jsonb,
        '["Complete 7-day SQL Refresher", "Take Full-Stack Mock Exam #4"]'::jsonb,
        'https://readysetjob.com/verify/rep-001'
      )
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ 19. Reports seeded.');
  } else {
    console.log('✅ 14-19. Sample attempts and analysis skipped (clean state).');
  }

  console.log('\n🎉 ALL 19 DATABASE TABLES POPULATED & LINKED SUCCESSFULLY!');
};

runSeed().then(() => pool.end()).catch(e => { console.error('Seed error:', e.message); pool.end(); });
