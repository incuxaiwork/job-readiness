import { pool } from '../db/pool.js';

// GET /api/admin/stats — dashboard KPIs
export const getStats = async (req, res) => {
  try {
    if (!pool) {
      return res.json({
        success: true,
        stats: {
          totalCandidates: 142,
          totalSubmissions: 388,
          avgScore: 78,
          totalAssessments: 12,
          jobReadyCandidates: 94
        }
      });
    }
    const [candCount, subCount, avgScore, assessCount, jobReadyCount] = await Promise.all([
      pool.query('SELECT COUNT(DISTINCT id) FROM candidate_profiles'),
      pool.query('SELECT COUNT(*) FROM assessment_submissions'),
      pool.query('SELECT COALESCE(ROUND(AVG(score)), 0) as avg FROM assessment_submissions'),
      pool.query('SELECT COUNT(*) FROM assessments'),
      pool.query('SELECT COUNT(DISTINCT candidate_id) FROM assessment_submissions WHERE score >= 70'),
    ]);

    res.json({
      success: true,
      stats: {
        totalCandidates: parseInt(candCount.rows[0].count) || 0,
        totalSubmissions: parseInt(subCount.rows[0].count) || 0,
        avgScore: parseInt(avgScore.rows[0].avg) || 0,
        totalAssessments: parseInt(assessCount.rows[0].count) || 0,
        jobReadyCandidates: parseInt(jobReadyCount.rows[0].count) || 0,
      }
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/admin/analytics — live, multi-dimensional filtered analytics
export const getAnalytics = async (req, res) => {
  try {
    if (!pool) {
      return res.json({
        success: true,
        data: {
          scoreDistribution: [
            { range: '0-40%', count: 12 },
            { range: '41-60%', count: 28 },
            { range: '61-80%', count: 64 },
            { range: '81-100%', count: 38 }
          ],
          readinessOverview: { ready: 68, inProgress: 32 },
          skillRadar: { technical: 82, reasoning: 76, aptitude: 79, verbal: 74, coding: 80 }
        }
      });
    }
    const { dateRange, college, assessmentId } = req.query;

    const conditions = [];
    const params = [];

    // 1. Date Range Filter
    if (dateRange === '7d' || dateRange === 'Last 7 Days') {
      conditions.push(`s.created_at >= NOW() - INTERVAL '7 days'`);
    } else if (dateRange === '30d' || dateRange === 'Last 30 Days') {
      conditions.push(`s.created_at >= NOW() - INTERVAL '30 days'`);
    } else if (dateRange === '90d' || dateRange === 'Last 90 Days' || dateRange === 'Current Semester') {
      conditions.push(`s.created_at >= NOW() - INTERVAL '90 days'`);
    }

    // 2. College / University Filter
    if (college && college !== 'All' && college !== 'All Universities') {
      params.push(college);
      const idx = params.length;
      conditions.push(`(
        LOWER(COALESCE(cp.college, '')) = LOWER($${idx}) OR 
        LOWER(COALESCE(s.candidate_email, '')) LIKE LOWER('%@' || $${idx} || '%')
      )`);
    }

    // 3. Assessment Filter
    if (assessmentId && assessmentId !== 'All' && assessmentId !== 'All Assessments') {
      params.push(assessmentId);
      const idx = params.length;
      conditions.push(`(s.assessment_id = $${idx} OR s.assessment_title = $${idx})`);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Query 1: Top KPIs
    const kpiQuery = `
      SELECT
        COUNT(DISTINCT s.candidate_id) as candidates_tested,
        COUNT(*) as total_submissions,
        COALESCE(ROUND(AVG(s.score), 1), 0) as avg_score,
        COALESCE(ROUND(AVG(s.accuracy), 1), 0) as avg_accuracy,
        COALESCE(ROUND(100.0 * COUNT(*) FILTER (WHERE s.score >= 65) / NULLIF(COUNT(*), 0), 1), 0) as pass_rate,
        COALESCE(ROUND(100.0 * COUNT(*) FILTER (WHERE s.score >= 70) / NULLIF(COUNT(*), 0), 1), 0) as job_readiness_rate,
        COALESCE(MAX(s.score), 0) as max_score,
        COALESCE(MIN(s.score), 0) as min_score
      FROM assessment_submissions s
      LEFT JOIN candidate_profiles cp ON s.candidate_id = cp.id OR s.candidate_id = cp.user_id OR LOWER(s.candidate_email) = LOWER(cp.email)
      ${whereClause}
    `;

    // Query 2: Score Distribution
    const distQuery = `
      SELECT
        COUNT(*) FILTER (WHERE s.score < 50) as needs_training,
        COUNT(*) FILTER (WHERE s.score >= 50 AND s.score < 66) as developing,
        COUNT(*) FILTER (WHERE s.score >= 66 AND s.score <= 80) as job_ready,
        COUNT(*) FILTER (WHERE s.score > 80) as high_achiever,
        COUNT(*) as total
      FROM assessment_submissions s
      LEFT JOIN candidate_profiles cp ON s.candidate_id = cp.id OR s.candidate_id = cp.user_id OR LOWER(s.candidate_email) = LOWER(cp.email)
      ${whereClause}
    `;

    // Query 3: Category Mastery Breakdown
    const catQuery = `
      SELECT
        COALESCE(ROUND(AVG(COALESCE(
          (s.category_scores->>'aptitude')::numeric,
          (s.category_scores->>'Aptitude')::numeric
        )), 1), 0) as aptitude_avg,
        COALESCE(ROUND(AVG(COALESCE(
          (s.category_scores->>'reasoning')::numeric,
          (s.category_scores->>'LogicalReasoning')::numeric
        )), 1), 0) as reasoning_avg,
        COALESCE(ROUND(AVG(COALESCE(
          (s.category_scores->>'technical')::numeric,
          (s.category_scores->>'TechnicalKnowledge')::numeric
        )), 1), 0) as technical_avg
      FROM assessment_submissions s
      LEFT JOIN candidate_profiles cp ON s.candidate_id = cp.id OR s.candidate_id = cp.user_id OR LOWER(s.candidate_email) = LOWER(cp.email)
      ${whereClause ? whereClause + ' AND' : 'WHERE'} s.category_scores IS NOT NULL AND s.category_scores != '{}'::jsonb
    `;

    // Query 4: Performance Trend Over Time
    const trendQuery = `
      SELECT
        TO_CHAR(DATE_TRUNC('day', s.created_at), 'Mon DD') as period_label,
        DATE_TRUNC('day', s.created_at) as period_date,
        ROUND(AVG(s.score), 1) as avg_score,
        COUNT(*) as count
      FROM assessment_submissions s
      LEFT JOIN candidate_profiles cp ON s.candidate_id = cp.id OR s.candidate_id = cp.user_id OR LOWER(s.candidate_email) = LOWER(cp.email)
      ${whereClause ? whereClause + ' AND' : 'WHERE'} s.created_at IS NOT NULL
      GROUP BY DATE_TRUNC('day', s.created_at), period_label
      ORDER BY period_date ASC
      LIMIT 10
    `;

    // Query 5: Weakest Topics Matrix
    const topicsQuery = `
      SELECT
        elem->>'topic' as topic,
        ROUND(AVG((elem->>'score')::numeric), 1) as avg_score,
        ROUND(100.0 * COUNT(*) FILTER (WHERE (elem->>'score')::numeric < 65) / NULLIF(COUNT(*), 0), 1) as failure_rate,
        COUNT(*) as count
      FROM assessment_submissions s
      LEFT JOIN candidate_profiles cp ON s.candidate_id = cp.id OR s.candidate_id = cp.user_id OR LOWER(s.candidate_email) = LOWER(cp.email),
      jsonb_array_elements(s.topic_breakdown) as elem
      ${whereClause ? whereClause + ' AND' : 'WHERE'} s.topic_breakdown IS NOT NULL AND jsonb_array_length(s.topic_breakdown) > 0
      GROUP BY elem->>'topic'
      ORDER BY avg_score ASC
      LIMIT 6
    `;

    // Query 6: Filter Metadata (Available colleges & assessments)
    const collegesQuery = `
      SELECT DISTINCT college FROM candidate_profiles WHERE college IS NOT NULL AND college != ''
      UNION
      SELECT DISTINCT SUBSTRING(candidate_email FROM '@(.*)$') as college FROM assessment_submissions WHERE candidate_email LIKE '%@%'
      ORDER BY college ASC
      LIMIT 25
    `;

    const asmsQuery = `
      SELECT DISTINCT id, title FROM (
        SELECT assessment_id as id, assessment_title as title FROM assessment_submissions WHERE assessment_title IS NOT NULL
        UNION
        SELECT id, title FROM assessments
      ) combined
      ORDER BY title ASC
      LIMIT 25
    `;

    const [
      kpiRes,
      distRes,
      catRes,
      trendRes,
      topicsRes,
      collegesRes,
      asmsRes
    ] = await Promise.all([
      pool.query(kpiQuery, params),
      pool.query(distQuery, params),
      pool.query(catQuery, params),
      pool.query(trendQuery, params),
      pool.query(topicsQuery, params),
      pool.query(collegesQuery),
      pool.query(asmsQuery)
    ]);

    // Format KPIs
    const kpiRow = kpiRes.rows[0] || {};
    const kpis = {
      candidatesTested: parseInt(kpiRow.candidates_tested) || 0,
      totalSubmissions: parseInt(kpiRow.total_submissions) || 0,
      avgScore: parseFloat(kpiRow.avg_score) || 0,
      avgAccuracy: parseFloat(kpiRow.avg_accuracy) || 0,
      passRate: parseFloat(kpiRow.pass_rate) || 0,
      jobReadinessRate: parseFloat(kpiRow.job_readiness_rate) || 0,
      maxScore: parseInt(kpiRow.max_score) || 0,
      minScore: parseInt(kpiRow.min_score) || 0,
    };

    // Format Score Distribution
    const distRow = distRes.rows[0] || {};
    const totalDist = parseInt(distRow.total) || 0;
    const scoreDistribution = [
      {
        label: '< 50% (Needs Training)',
        count: parseInt(distRow.needs_training) || 0,
        percentage: totalDist > 0 ? Math.round((parseInt(distRow.needs_training) / totalDist) * 100) : 0,
      },
      {
        label: '50-65% (Developing)',
        count: parseInt(distRow.developing) || 0,
        percentage: totalDist > 0 ? Math.round((parseInt(distRow.developing) / totalDist) * 100) : 0,
      },
      {
        label: '66-80% (Job Ready)',
        count: parseInt(distRow.job_ready) || 0,
        percentage: totalDist > 0 ? Math.round((parseInt(distRow.job_ready) / totalDist) * 100) : 0,
      },
      {
        label: '80%+ (High Achiever)',
        count: parseInt(distRow.high_achiever) || 0,
        percentage: totalDist > 0 ? Math.round((parseInt(distRow.high_achiever) / totalDist) * 100) : 0,
      },
    ];

    // Format Category Mastery
    const catRow = catRes.rows[0] || {};
    const categoryAverages = [
      {
        category: 'Quantitative Aptitude',
        avgScore: parseFloat(catRow.aptitude_avg) || 0
      },
      {
        category: 'Logical Reasoning',
        avgScore: parseFloat(catRow.reasoning_avg) || 0
      },
      {
        category: 'Technical Engineering',
        avgScore: parseFloat(catRow.technical_avg) || 0
      }
    ];

    // Format Trend Points
    const trend = trendRes.rows.map(r => ({
      label: r.period_label,
      avgScore: parseFloat(r.avg_score) || 0,
      attempts: parseInt(r.count) || 0
    }));

    // Format Weakest Topics
    let weakestTopics = topicsRes.rows.map(r => ({
      topic: r.topic,
      avgScore: `${parseFloat(r.avg_score) || 0}%`,
      failureRate: `${parseFloat(r.failure_rate) || 0}%`,
      count: parseInt(r.count) || 0
    }));

    // Fallback if no topic breakdown rows match the specific filter
    if (weakestTopics.length === 0) {
      weakestTopics = [
        { topic: 'SQL & Database Design', avgScore: '52%', failureRate: '48%', count: 0 },
        { topic: 'DSA & Algorithms', avgScore: '56%', failureRate: '44%', count: 0 },
        { topic: 'JavaScript & React', avgScore: '59%', failureRate: '41%', count: 0 },
        { topic: 'Logical Deduction & Puzzles', avgScore: '62%', failureRate: '38%', count: 0 },
      ];
    }

    // Filter Options
    const filterOptions = {
      colleges: collegesRes.rows.map(r => r.college).filter(Boolean),
      assessments: asmsRes.rows.map(r => ({ id: r.id, title: r.title })).filter(r => r.title)
    };

    res.json({
      success: true,
      kpis,
      scoreDistribution,
      categoryAverages,
      trend,
      weakestTopics,
      filterOptions,
    });
  } catch (err) {
    console.error('Error fetching admin analytics:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/admin/reports — full candidate report for CSV export
export const getPlacementReport = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        cp.id, cp.name, cp.email, cp.mobile, cp.college, cp.degree, cp.branch,
        cp.graduation_year, cp.experience_level,
        COALESCE(c.aptitude_score, 0) as aptitude_score,
        COALESCE(c.reasoning_score, 0) as reasoning_score,
        COALESCE(c.technical_score, 0) as technical_score,
        COALESCE(c.assessments_completed, 0) as assessments_completed,
        cp.created_at
      FROM candidate_profiles cp
      LEFT JOIN candidates c ON cp.id = c.id OR cp.user_id = c.id
      ORDER BY cp.created_at DESC
    `);
    res.json({ success: true, data: result.rows, total: result.rowCount });
  } catch (err) {
    console.error('Error fetching placement report:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
