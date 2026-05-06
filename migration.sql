-- Jalankan file ini di PostgreSQL untuk membuat tabel

CREATE TABLE IF NOT EXISTS students (
  id              SERIAL PRIMARY KEY,
  id_student      INTEGER,
  code_module     VARCHAR(10),
  code_presentation VARCHAR(10),
  avg_clicks      FLOAT,
  total_clicks    FLOAT,
  active_weeks    INTEGER,
  days_diff       FLOAT,
  score           FLOAT,
  is_submitted    INTEGER,
  is_late         INTEGER,
  is_high_activity INTEGER,
  risk_label      INTEGER,
  final_result    VARCHAR(20),
  highest_education VARCHAR(50),
  disability      VARCHAR(5),
  gender          VARCHAR(5),
  age_band        VARCHAR(20),
  region          VARCHAR(50),
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS predictions (
  id               SERIAL PRIMARY KEY,
  id_student       INTEGER,
  avg_clicks       FLOAT,
  total_clicks     FLOAT,
  active_weeks     INTEGER,
  is_late          INTEGER,
  is_submitted     INTEGER,
  highest_education VARCHAR(50),
  disability       VARCHAR(5),
  risk_probability FLOAT,
  risk_label       INTEGER,
  risk_level       VARCHAR(20),
  message          TEXT,
  created_at       TIMESTAMP DEFAULT NOW()
);
