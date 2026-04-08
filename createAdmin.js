const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("========================================");
console.log("🚀 CIVIC PORTAL: SEEDING DATABASE");
console.log("========================================");
console.log("Creating 1 Admin and 5 Staff members...");
console.log("");

// 1. Get a universal password for all staff
rl.question('Enter a password for all new accounts (e.g. Staff123): ', (globalPassword) => {

    const users = [
        // === 1. ADMIN ===
        {
            name: "Super Admin",
            email: "admin@civic.com",
            password: globalPassword,
            role: "admin",
            department: null, // Admins see everything
            isAvailable: false,
            location: { lat: 0, lng: 0 }
        },
        // === 2. ROADS STAFF ===
        {
            name: "Mike Roads",
            email: "mike@roads.com",
            password: globalPassword,
            role: "staff",
            department: "Roads", // Matches Dropdown Value "Roads"
            isAvailable: true,
            location: { lat: 28.6139, lng: 77.2090 }
        },
        // === 3. WATER STAFF ===
        {
            name: "Sarah Water",
            email: "sarah@water.com",
            password: globalPassword,
            role: "staff",
            department: "Water", // Matches Dropdown Value "Water"
            isAvailable: true,
            location: { lat: 28.6139, lng: 77.2090 }
        },
        // === 4. ELECTRICITY STAFF ===
        {
            name: "Alex Power",
            email: "alex@electricity.com",
            password: globalPassword,
            role: "staff",
            department: "Electricity", // Matches Dropdown Value "Electricity"
            isAvailable: true,
            location: { lat: 28.6139, lng: 77.2090 }
        },
        // === 5. SANITATION STAFF ===
        {
            name: "John Sanitation",
            email: "john@sanitation.com",
            password: globalPassword,
            role: "staff",
            department: "Sanitation", // Matches Dropdown Value "Sanitation"
            isAvailable: true,
            location: { lat: 28.6139, lng: 77.2090 }
        },
        // === 6. OTHER STAFF ===
        {
            name: "Support Agent",
            email: "support@other.com",
            password: globalPassword,
            role: "staff",
            department: "Other", // Matches Dropdown Value "Other"
            isAvailable: true,
            location: { lat: 28.6139, lng: 77.2090 }
        }
    ];

    // 2. Hash passwords and prepare data
    const hashAndPrepare = async () => {
        const hashedUsers = await Promise.all(users.map(async (user) => {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            return { ...user, password: hashedPassword }; // Replace plain text with hash
        }));

        // 3. Print the JSON to Copy
        console.log("✅ SUCCESS! Copy the JSON below into MongoDB Compass:");
        console.log("========================================");
        console.log(JSON.stringify(hashedUsers, null, 2));
        console.log("========================================");
        console.log("💡 NOTE: Department names are set to match the Dropdown Values exactly.");
        console.log("   (This ensures Phase 14 Auto-Assign works correctly)");
        
        rl.close();
        process.exit(0);
    };

    hashAndPrepare();
});