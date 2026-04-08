const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const verifyToken = require('../middleware/authMiddleware');

// --- ROUTE DEFINITIONS ---

// 1. Create Complaint (Public)
// We apply upload.single('image') HERE to parse the form
router.post('/', upload.single('image'), complaintController.createComplaint);

// 2. Get All Complaints (Staff/Admin)
router.get('/', verifyToken, complaintController.getAllComplaints);

// 3. Resolve Ticket (Staff/Admin) - UPDATED FOR IMAGE UPLOAD
// PHASE 13 UPDATE: Added upload.single('image') middleware here
router.put('/:id/resolve', verifyToken, upload.single('image'), complaintController.updateComplaintStatus);

// --- PHASE 14: AUTO ASSIGN ROUTE ---
// 4. Auto Assign Ticket (Admin/Smart Dispatch)
router.post('/:id/assign-auto', verifyToken, complaintController.autoAssignComplaint);

module.exports = router;