// ==========================================
// LOAD ENVIRONMENT VARIABLES FIRST
// ==========================================
require('dotenv').config();

// 1. Import the tools we installed
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Complaint = require('./models/Complaint');
const User = require('./models/User');
const connectDB = require('./config/db');

// PHASE 15: REAL-TIME TOOLS
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

// PHASE 4: Security Tools
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'civic-secret-key-2026';

// PHASE 6: File Upload Tools
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// ==========================================
// CLOUDINARY CONFIGURATION (NOW FROM .env)
// ==========================================
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY,     
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer Configuration (Store file in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 2. Initialize the application
const app = express();
const PORT = process.env.PORT || 5000;

// 3. Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ==========================================
// PHASE 11: MIDDLEWARE: THE BOUNCER
// ==========================================
const verifyToken = require('./middleware/authMiddleware');

// ==========================================
// PHASE 15: REAL-TIME SERVER SETUP
// ==========================================
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", 
    }
});

// Make io globally accessible for Controllers
global.io = io;

// Listen for incoming Socket connections
io.on('connection', (socket) => {
    console.log(`🔌 New Socket Connected: ${socket.id}`);
    
    socket.on('join-room', (email) => {
        socket.join(email);
        console.log(`📨 User ${email} joined their room.`);
    });
    
    socket.on('disconnect', () => {
        console.log(`❌ Socket Disconnected: ${socket.id}`);
    });
});

// ==========================================
// PHASE 11: ROUTES
// ==========================================
const complaintRoutes = require('./routes/complaintRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'success', message: 'Server is up and running!' });
});

// --- PHASE 4: REGISTER (UPDATED: FIX FOR 400/403 ERRORS) ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role, department } = req.body;
        
        // 1. Check if user exists
        let user = await User.findOne({ email });
        let isNewUser = false;

        if (user) {
            // USER EXISTS: Log them in
            console.log(`🔄 User ${email} already exists. Logging in.`);
        } else {
            // USER NEW: Register them
            isNewUser = true;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            user = new User({ 
                name, 
                email, 
                password: hashedPassword, 
                role: role || 'citizen',
                department: department || null 
            });
            
            await user.save();
            console.log(`✅ New User Created: ${email}`);
        }

        // 2. Generate Token (For both Login and Register)
        const token = jwt.sign(
            { 
                id: user._id, 
                name: user.name, 
                role: user.role, 
                department: user.department 
            }, 
            JWT_SECRET, 
            { expiresIn: '1h' }
        );

        // 3. Return Token and User Data
        // FIXED: Using isNewUser flag instead of user.isNew (which is always false after save)
        res.status(200).json({ 
            message: isNewUser ? "User registered successfully!" : "Welcome back!",
            token: token,
            user: { 
                name: user.name, 
                email: user.email, 
                role: user.role, 
                department: user.department 
            } 
        });
    } catch (error) {
        console.error("❌ Error in auth:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// --- PHASE 4: LOGIN ---
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign(
            { 
                id: user._id, 
                name: user.name, 
                role: user.role, 
                department: user.department 
            }, 
            JWT_SECRET, 
            { expiresIn: '1h' }
        );

        res.json({ 
            message: "Login successful", 
            token: token, 
            user: { 
                name: user.name, 
                email: user.email, 
                role: user.role, 
                department: user.department, 
                isAvailable: user.isAvailable 
            } 
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// --- PHASE 13: TOGGLE STAFF STATUS ---
app.put('/api/user/status', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.isAvailable = !user.isAvailable;
        await user.save();

        console.log(`✅ ${user.name} is now ${user.isAvailable ? 'ON DUTY' : 'OFF DUTY'}`);

        res.json({ 
            message: `Status updated to ${user.isAvailable ? 'Available' : 'Unavailable'}`, 
            isAvailable: user.isAvailable 
        });
    } catch (error) {
        console.error("❌ Error updating status:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// --- PHASE 11: USE ROUTES ---
app.use('/api/complaints', complaintRoutes);
app.use('/api/analytics', analyticsRoutes);

// ==========================================
// START SERVER
// ==========================================
connectDB();
server.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});