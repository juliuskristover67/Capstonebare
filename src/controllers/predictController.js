const axios = require('axios');
const pool = require('../config/db');
require('dotenv').config();

const AI_API_URL = process.env.AI_API_URL || 'http://localhost:8000';

// POST /api/predict
const predictStudent = async (req, res) => {
  try {
    const {
      id_student,
      avg_clicks,
      total_clicks,
      active_weeks,
      is_late,
      is_submitted,
      highest_education,
      disability,
    } = req.body;

    // Build payload untuk FastAPI AI Engineer
    const payload = {
      avg_clicks: parseFloat(avg_clicks),
      total_clicks: parseFloat(total_clicks),
      active_weeks: parseFloat(active_weeks),
      is_late: parseFloat(is_late),
      is_submitted: parseFloat(is_submitted),
      highest_education_HE_Qualification:            highest_education === 'HE Qualification' ? 1.0 : 0.0,
      highest_education_Lower_Than_A_Level:          highest_education === 'Lower Than A Level' ? 1.0 : 0.0,
      highest_education_No_Formal_quals:             highest_education === 'No Formal quals' ? 1.0 : 0.0,
      highest_education_Post_Graduate_Qualification: highest_education === 'Post Graduate Qualification' ? 1.0 : 0.0,
      disability_Y: disability === 'Y' ? 1.0 : 0.0,
    };

    // Forward ke FastAPI AI Engineer
    const aiResponse = await axios.post(`${AI_API_URL}/predict`, payload);
    const result = aiResponse.data;

    // Simpan hasil prediksi ke database
    await pool.query(
      `INSERT INTO predictions 
        (id_student, avg_clicks, total_clicks, active_weeks, is_late, is_submitted,
         highest_education, disability, risk_probability, risk_label, risk_level, message)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        id_student || null,
        avg_clicks, total_clicks, active_weeks, is_late, is_submitted,
        highest_education, disability,
        result.risk_probability, result.risk_label, result.risk_level, result.message,
      ]
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    if (err.response) {
      return res.status(502).json({ success: false, message: 'AI API error: ' + err.response.data.detail });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/predictions
const getPredictions = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM predictions ORDER BY created_at DESC LIMIT 50'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { predictStudent, getPredictions };
