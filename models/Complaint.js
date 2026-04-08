// 1. Import Mongoose
const mongoose = require('mongoose');

// 2. Define the Schema (The Blueprint)
// This tells the database exactly what a "Complaint" looks like.
const complaintSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        required: true,
        unique: true // No two tickets should have the same ID
    },
    applicantName: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    // --- PHASE 8: GEOLOCATION FIELDS ---
    lat: {
        type: Number,
        default: 0
    },
    lng: {
        type: Number,
        default: 0
    },
    // ----------------------------------
    description: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Emergency'], // Only allow these values
        default: 'Low'
    },
    // --- PHASE 12: STATUS UPDATE ---
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Resolved', 'Rejected'],
        default: 'Pending' // New workflow: Pending -> Accepted -> Resolved
    },
    // --- PHASE 6: IMAGE URL FIELD ---
    imageUrl: {
        type: String,
        default: '' // If no image is uploaded, this will be empty
    },
    // --- PHASE 16: RESOLUTION PROOF IMAGE ---
    afterImageUrl: {
        type: String,
        default: '' // Stores the "After" photo uploaded by staff upon resolution
    },
    resolutionNotes: {
        type: String,
        default: ''
    },
    // --- PHASE 12: ASSIGNMENT LOGIC ---
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Links to the Staff User who accepted the job
        default: null
    },
    assignedAt: {
        type: Date,
        default: null // Timestamp when the job was assigned to staff
    }
}, {
    timestamps: true // Automatically adds 'createdAt' and 'updatedAt' fields
});

// 3. Create the Model
// This gives us functions to save and find data in the database.
const Complaint = mongoose.model('Complaint', complaintSchema);

// 4. Export the Model
// We need this to use it in server.js
module.exports = Complaint;