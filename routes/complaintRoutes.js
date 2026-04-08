const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const multer = require('multer');
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
	fileFilter: (req, file, cb) => {
		const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
		if (allowedTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error('Only JPEG, PNG, and WEBP images are allowed'));
		}
	}
});
const verifyToken = require('../middleware/authMiddleware');

// --- ROUTE DEFINITIONS ---

// 1. Create Complaint (Public)
// We apply upload.single('image') HERE to parse the form
router.post('/', verifyToken, upload.single('image'), complaintController.createComplaint);

// 2. Get All Complaints (Staff/Admin)
router.get('/', verifyToken, complaintController.getAllComplaints);

// 3. Resolve Ticket (Staff/Admin) - UPDATED FOR IMAGE UPLOAD
// PHASE 13 UPDATE: Added upload.single('image') middleware here
router.put('/:id/resolve', verifyToken, upload.single('image'), complaintController.updateComplaintStatus);

// --- PHASE 14: AUTO ASSIGN ROUTE ---
// 4. Auto Assign Ticket (Admin/Smart Dispatch)
router.post('/:id/assign-auto', verifyToken, complaintController.autoAssignComplaint);

module.exports = router;