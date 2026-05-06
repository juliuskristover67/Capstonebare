const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const CSV_PATH = path.join(__dirname, 'df_final.csv');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function seed() {
  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = parseCSVLine(lines[0]);

  console.log(`📄 Membaca ${lines.length - 1} baris data...`);

  let inserted = 0;
  let errors = 0;

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = values[idx]?.trim() || null;
    });

    try {
      await pool.query(
        `INSERT INTO students 
          (id_student, code_module, code_presentation, avg_clicks, total_clicks,
           active_weeks, days_diff, score, is_submitted, is_late, is_high_activity,
           risk_label, final_result, highest_education, disability, gender, age_band, region)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
        [
          row.id_student ? parseInt(row.id_student) : null,
          row.code_module,
          row.code_presentation,
          row.avg_clicks ? parseFloat(row.avg_clicks) : null,
          row.total_clicks ? parseFloat(row.total_clicks) : null,
          row.active_weeks ? parseInt(row.active_weeks) : null,
          row.days_diff ? parseFloat(row.days_diff) : null,
          row.score ? parseFloat(row.score) : null,
          row.is_submitted ? parseInt(row.is_submitted) : 0,
          row.is_late ? parseInt(row.is_late) : 0,
          row.is_high_activity ? parseInt(row.is_high_activity) : 0,
          row.risk_label ? parseInt(row.risk_label) : 0,
          row.final_result,
          row.highest_education,
          row.disability,
          row.gender,
          row.age_band,
          row.region,
        ]
      );
      inserted++;
      if (inserted % 1000 === 0) console.log(`⏳ ${inserted} data diimport...`);
    } catch (err) {
      errors++;
      if (errors <= 3) console.error(`❌ Error baris ${i}:`, err.message);
    }
  }

  console.log(`✅ Selesai! ${inserted} data berhasil diimport. ${errors} error.`);
  pool.end();
}

seed();