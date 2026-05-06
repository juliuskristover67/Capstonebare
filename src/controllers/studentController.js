const pool = require('../config/db');

// GET /api/students
const getAllStudents = async (req, res) => {
  try {
    const { page = 1, limit = 20, risk_label, final_result } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM students WHERE 1=1';
    const params = [];

    if (risk_label !== undefined) {
      params.push(risk_label);
      query += ` AND risk_label = $${params.length}`;
    }

    if (final_result) {
      params.push(final_result);
      query += ` AND final_result = $${params.length}`;
    }

    params.push(limit, offset);
    query += ` ORDER BY id LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);

    // Total count
    let countQuery = 'SELECT COUNT(*) FROM students WHERE 1=1';
    const countParams = [];
    if (risk_label !== undefined) {
      countParams.push(risk_label);
      countQuery += ` AND risk_label = $${countParams.length}`;
    }
    if (final_result) {
      countParams.push(final_result);
      countQuery += ` AND final_result = $${countParams.length}`;
    }
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/students/:id
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM students WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllStudents, getStudentById };
