const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Connect to the Local Database
        const conn = await mongoose.connect('mongodb://127.0.0.1:27017/CivicDB');
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1); // Exit if connection fails
    }
};

module.exports = connectDB;