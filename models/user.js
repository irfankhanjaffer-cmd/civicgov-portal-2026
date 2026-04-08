// 1. Import Mongoose
const mongoose = require('mongoose');

// 2. Define the Schema (The Blueprint)
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true, // Ensures no two users have the same email
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    // --- PHASE 12: ROLE UPDATE ---
    role: {
        type: String,
        enum: ['citizen', 'admin', 'staff'], // Updated to include admin and staff
        default: 'citizen'
    },
    
    // --- PHASE 13 UPDATE: DEPARTMENT ---
    // Staff members are assigned a department (e.g., "Sanitation", "Water").
    // The Controller uses this to filter what tickets they can see.
    department: {
        type: String, 
        default: null 
    },
    
    // --- PHASE 12: STAFF LOCATION (For Smart Dispatch) ---
    location: {
        type: { lat: Number, lng: Number },
        default: { lat: 0, lng: 0 } // For tracking staff GPS (Default 0,0)
    },
    
    // --- PHASE 12: STAFF STATUS (On Duty / Off Duty) ---
    isAvailable: {
        type: Boolean,
        default: false // Staff can toggle availability
    }
    // NOTE: 'assignedTo' and 'assignedAt' were removed because they belong in the Complaint Model.
}, {
    timestamps: true // Automatically adds 'createdAt' and 'updatedAt' fields
});

// 3. Create and Export the Model
const User = mongoose.model('User', userSchema);

module.exports = User;