const pool = require('../config/db');

// GET /api/dashboard
const getDashboardSummary = async (req, res) => {
  try {
    const totalResult = await pool.query('SELECT COUNT(*) FROM students');
    const atRiskResult = await pool.query('SELECT COUNT(*) FROM students WHERE risk_label = 1');
    const safeResult = await pool.query('SELECT COUNT(*) FROM students WHERE risk_label = 0');

    // Distribusi final_result
    const finalResultDist = await pool.query(
      'SELECT final_result, COUNT(*) as count FROM students GROUP BY final_result'
    );

    // Rata-rata klik per group
    const avgClicks = await pool.query(`
      SELECT 
        CASE WHEN risk_label = 1 THEN 'Berisiko' ELSE 'Aman' END as group,
        ROUND(AVG(avg_clicks)::numeric, 2) as avg_clicks,
        ROUND(AVG(total_clicks)::numeric, 2) as total_clicks
      FROM students
      GROUP BY risk_label
    `);

    // Distribusi education
    const educationDist = await pool.query(
      'SELECT highest_education, COUNT(*) as count FROM students GROUP BY highest_education ORDER BY count DESC'
    );

    // Distribusi risk per module
    const riskPerModule = await pool.query(`
      SELECT code_module, 
        SUM(CASE WHEN risk_label = 1 THEN 1 ELSE 0 END) as at_risk,
        COUNT(*) as total
      FROM students
      GROUP BY code_module
      ORDER BY code_module
    `);

    const total = parseInt(totalResult.rows[0].count);
    const atRisk = parseInt(atRiskResult.rows[0].count);

    res.json({
      success: true,
      data: {
        summary: {
          total_students: total,
          at_risk: atRisk,
          safe: parseInt(safeResult.rows[0].count),
          risk_percentage: ((atRisk / total) * 100).toFixed(1),
        },
        final_result_distribution: finalResultDist.rows,
        avg_clicks_by_group: avgClicks.rows,
        education_distribution: educationDist.rows,
        risk_per_module: riskPerModule.rows,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboardSummary };
