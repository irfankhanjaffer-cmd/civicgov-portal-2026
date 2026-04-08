const Complaint = require('../models/Complaint');

// --- GET ANALYTICS STATS (GET) ---
const getAnalyticsStats = async (req, res) => {
    try {
        // 1. Total Tickets
        const total = await Complaint.countDocuments();

        // 2. Count by Category
        const byCategory = await Complaint.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } }
        ]);

        // 3. Count by Priority
        const byPriority = await Complaint.aggregate([
            { $group: { _id: "$priority", count: { $sum: 1 } } }
        ]);

        // 4. Count by Status
        const byStatus = await Complaint.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        res.json({
            total,
            byCategory,
            byPriority,
            byStatus
        });

    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ message: "Error fetching analytics" });
    }
};

module.exports = {
    getAnalyticsStats
};