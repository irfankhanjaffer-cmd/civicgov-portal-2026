const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// --- ROUTE DEFINITIONS ---

// 1. Create Complaint (Public)
// router.post('/', complaintController.createComplaint);

// 2. Get All Complaints (Staff)
// router.get('/', complaintController.getAllComplaints);

// 3. Resolve Ticket
// router.put('/:id/resolve', complaintController.resolveTicket);

// 4. Get Analytics Stats <-- ADDED
router.get('/stats', analyticsController.getAnalyticsStats);

module.exports = router;