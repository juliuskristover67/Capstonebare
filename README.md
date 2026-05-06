# LearnGuard Backend API

Backend Express.js untuk Capstone Project - Prediksi Risiko Siswa E-Learning.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Setup .env
Edit file `.env` sesuai konfigurasi PostgreSQL kamu:
```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=learnguard
AI_API_URL=http://localhost:8000
```

### 3. Buat database di PostgreSQL
```bash
psql -U postgres -c "CREATE DATABASE learnguard;"
```

### 4. Jalankan migration (buat tabel)
```bash
psql -U postgres -d learnguard -f migration.sql
```

### 5. Import data siswa
Taruh file `df_final.csv` di folder ini, lalu jalankan:
```bash
node seed.js
```

### 6. Jalankan server
```bash
npm run dev
```

Server jalan di: `http://localhost:3000`

---

## Endpoints

| Method | URL | Keterangan |
|--------|-----|------------|
| GET | `/` | Health check |
| GET | `/api/students` | Daftar semua siswa (support filter & pagination) |
| GET | `/api/students/:id` | Detail 1 siswa |
| GET | `/api/dashboard` | Data summary untuk chart |
| POST | `/api/predict` | Prediksi risiko siswa |
| GET | `/api/predictions` | Riwayat prediksi |

---

## Contoh Request POST /api/predict

```json
{
  "id_student": 12345,
  "avg_clicks": 77.5,
  "total_clicks": 310,
  "active_weeks": 4,
  "is_late": 0,
  "is_submitted": 1,
  "highest_education": "HE Qualification",
  "disability": "N"
}
```

## Contoh Response

```json
{
  "success": true,
  "data": {
    "risk_probability": 0.2341,
    "risk_label": 0,
    "risk_level": "LOW",
    "message": "Risiko rendah, kondisi pembelajaran stabil."
  }
}
```

---

## Filter Students

```
GET /api/students?page=1&limit=20&risk_label=1
GET /api/students?final_result=Withdrawn
```
