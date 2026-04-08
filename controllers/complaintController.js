const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const User = require('../models/User'); 
const cloudinary = require('cloudinary').v2; 

// ==========================================
// PHASE 14: HELPER MATH (Haversine Formula)
// ==========================================
// Calculates distance between two coordinates (lat1, lon1) and (lat2, lon2) in Kilometers
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
};

const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
};

// --- 1. CREATE COMPLAINT (POST) --- [FIXED: ADDED IMAGE UPLOAD]
const createComplaint = async (req, res) => {
    try {
        const { ticketId, applicantName, category, location, description, priority, recommendation, lat, lng } = req.body;
        
        let imageUrl = '';

        // FIX: Handle Image Upload (Before Image)
        if (req.file) {
            try {
                const b64 = Buffer.from(req.file.buffer).toString("base64");
                const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

                // Upload to Cloudinary
                const result = await cloudinary.uploader.upload(dataURI, {
                    folder: 'civic_complaints', // Separate folder for original complaints
                    public_id: `ticket_${ticketId || Date.now()}`,
                    resource_type: 'auto' 
                });

                imageUrl = result.secure_url;
                console.log(`✅ Complaint Image Uploaded: ${imageUrl}`);
            } catch (uploadError) {
                console.error("❌ Cloudinary Upload Error:", uploadError);
                return res.status(500).json({ message: "Failed to upload complaint image." });
            }
        }

        if (!applicantName || !category || !description) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        const newComplaint = new Complaint({
            ticketId: ticketId || 'T-' + Math.floor(Math.random() * 10000),
            applicantName,
            category,
            location,
            description,
            priority: priority || 'Medium',
            recommendation: recommendation || 'Standard Review',
            status: 'Pending',
            imageUrl: imageUrl, // This now holds the actual URL
            lat: parseFloat(lat) || 0,
            lng: parseFloat(lng) || 0
        });

        const savedComplaint = await newComplaint.save();
        console.log(`✅ New Complaint: ${savedComplaint.ticketId}`);
        res.status(201).json({ message: "Complaint submitted successfully!", data: savedComplaint });

    } catch (error) {
        console.error("❌ Error saving complaint:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// --- 2. GET ALL COMPLAINTS (GET) ---
const getAllComplaints = async (req, res) => {
    try {
        const { role, department, _id } = req.user;
        let filter = {};

        if (role === 'admin') {
            filter = {};
        } else if (role === 'staff') {
            if (department) {
                filter.category = department;
            } else {
                return res.status(403).json({ message: "Access Denied: No department assigned to your profile." });
            }
        } else {
            filter.applicantName = req.user.name; 
        }

        const complaints = await Complaint.find(filter)
            .populate('assignedTo', 'name department isAvailable')
            .sort({ createdAt: -1 }); 

        res.status(200).json(complaints);
    } catch (error) {
        console.error("Error fetching complaints:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// --- 3. UPDATE TICKET STATUS (PUT) --- [PHASE 16: SEPARATE AFTER IMAGE]
const updateComplaintStatus = async (req, res) => {
    try {
        // Find ticket by Ticket ID
        const ticket = await Complaint.findOne({ ticketId: req.params.id });

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        const bodyStatus = req.body.status; // Gets 'Accepted' or 'Resolved'

        if (ticket.status === bodyStatus) {
            return res.status(400).json({ message: `Ticket already ${bodyStatus}.` });
        }

        if (bodyStatus === 'Accepted') {
            ticket.assignedTo = req.user._id;
            ticket.assignedAt = new Date();
            ticket.status = 'Accepted';
        } else if (bodyStatus === 'Resolved') {
            if (req.file) {
                try {
                    const b64 = Buffer.from(req.file.buffer).toString("base64");
                    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

                    // Upload to Cloudinary
                    const result = await cloudinary.uploader.upload(dataURI, {
                        folder: 'civic_resolved_proof',
                        public_id: `proof_${ticket.ticketId}_${Date.now()}`,
                        resource_type: 'auto' 
                    });

                    // PHASE 16 UPDATE: Save to 'afterImageUrl' to preserve the original 'imageUrl'
                    ticket.afterImageUrl = result.secure_url;
                    console.log(`✅ Proof Image uploaded to Cloudinary: ${result.secure_url}`);
                } catch (uploadError) {
                    console.error("❌ Cloudinary Upload Error:", uploadError);
                    return res.status(500).json({ message: "Failed to upload proof image." });
                }
            }
            ticket.status = 'Resolved';
            ticket.resolutionNotes = req.body.resolutionNote || 'No notes provided.';
        }

        const updatedTicket = await ticket.save();
        console.log(`✅ Ticket Updated: ${ticket.ticketId} -> ${ticket.status}`); 
        
        // --- PHASE 15: EMIT REAL-TIME EVENT ---
        
        // 1. Notify Admin Dashboard if job accepted
        if (updatedTicket.status === 'Accepted') {
            global.io.emit('dashboard-update', {
                type: 'job-accepted',
                message: `Ticket ${updatedTicket.ticketId} was accepted by ${req.user.name}`,
                data: updatedTicket
            });
        }

        // 2. Notify Dashboard (Admin/Citizen) if job done (Resolved)
        if (updatedTicket.status === 'Resolved') {
            global.io.emit('dashboard-update', {
                type: 'job-resolved',
                message: `Ticket ${updatedTicket.ticketId} has been resolved!`,
                data: updatedTicket
            });
        }

        res.status(200).json({ message: "Ticket Updated", data: updatedTicket });
    } catch (error) {
        console.error("❌ Error updating ticket:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// --- 4. AUTO ASSIGN TICKET (POST) --- [PHASE 14 & 15: SMART DISPATCH + REAL-TIME]
const autoAssignComplaint = async (req, res) => {
    try {
        const ticketId = req.params.id;

        // 1. Find the Ticket
        const ticket = await Complaint.findOne({ ticketId: ticketId });
        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }
        if (ticket.status !== 'Pending') {
            return res.status(400).json({ message: "Ticket is already assigned or resolved." });
        }

        // 2. Find Eligible Staff (Same Department, Available)
        const eligibleStaff = await User.find({ 
            role: 'staff', 
            isAvailable: true, 
            department: ticket.category 
        });

        if (eligibleStaff.length === 0) {
            return res.status(404).json({ message: "No available staff found in this department." });
        }

        // 3. Calculate Distance and Rank
        const staffWithDistance = eligibleStaff.map(staff => {
            const staffLat = staff.location?.lat || 0;
            const staffLng = staff.location?.lng || 0; 
            const staffAddr = staff.email; 

            // Using the correct function name and variables
            const distance = getDistanceFromLatLonInKm(ticket.lat, ticket.lng, staffLat, staffLng);
            
            return { ...staff.toObject(), distance, staffAddr };
        });

        // Sort by distance (Ascending: Nearest first)
        staffWithDistance.sort((a, b) => a.distance - b.distance);

        // 4. Assign to the Nearest Staff
        const bestStaff = staffWithDistance[0];
        
        ticket.assignedTo = bestStaff._id;
        ticket.assignedAt = new Date();
        ticket.status = 'Accepted';

        await ticket.save();

        console.log(`🚀 AUTO-ASSIGN: Ticket ${ticketId} -> ${bestStaff.name} (${bestStaff.distance.toFixed(2)} km away)`);

        // --- PHASE 15: REAL-TIME EMIT ---
        // 1. Notify the specific Staff Member directly
        global.io.to(bestStaff.staffAddr).emit('new-job', {
            ticketId: ticket.ticketId,
            location: ticket.location,
            priority: ticket.priority
        });

        // 2. Notify the Admin Dashboard (General Broadcast)
        global.io.emit('dashboard-update', {
            type: 'auto-assigned',
            message: `Auto-assign triggered by Admin for Ticket ${ticketId}`,
            data: ticket
        });

        res.status(200).json({ 
            message: `Auto-assigned to ${bestStaff.name}`, 
            data: ticket 
        });

    } catch (error) {
        console.error("❌ Auto-Assign Error:", error);
        res.status(500).json({ message: "Server error during auto-assignment." });
    }
};

const updatePriority = async (req, res) => {
    try {
        const { priority } = req.body;
        const validPriorities = ['Low', 'Medium', 'High', 'Emergency'];
        if (!validPriorities.includes(priority)) {
            return res.status(400).json({ message: 'Invalid priority value' });
        }
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { priority },
            { new: true }
        );
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }
        // Emit real-time update
        if (global.io) {
            global.io.emit('priority-updated', {
                complaintId: complaint._id,
                priority: complaint.priority
            });
        }
        res.json({ message: 'Priority updated', complaint });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Export the functions
module.exports = {
    createComplaint,
    getAllComplaints,
    updateComplaintStatus,
    autoAssignComplaint,
    updatePriority
};