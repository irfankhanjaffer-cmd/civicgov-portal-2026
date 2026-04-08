const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/stats', analyticsController.getAnalyticsStats);

module.exports = router;