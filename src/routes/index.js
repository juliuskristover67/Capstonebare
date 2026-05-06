const express = require('express');
const router = express.Router();

const { getAllStudents, getStudentById } = require('../controllers/studentController');
const { getDashboardSummary } = require('../controllers/dashboardController');
const { predictStudent, getPredictions } = require('../controllers/predictController');

// Students
router.get('/students', getAllStudents);
router.get('/students/:id', getStudentById);

// Dashboard
router.get('/dashboard', getDashboardSummary);

// Predict
router.post('/predict', predictStudent);
router.get('/predictions', getPredictions);

module.exports = router;
