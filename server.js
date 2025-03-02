const express = require('express');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config(); // Load environment variables

const app = express();
const port = 3000;

// MongoDB connection string
const uri = 'mongodb+srv://surajdhariya:suraj@customcraft-cluster.xoakt.mongodb.net/customcraftDB?retryWrites=true&w=majority&tls=true';
let client;

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key"; // Change this in production

// Function to connect to MongoDB
async function connectToDB() {
    try {
        client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000, tls: true });
        await client.connect();
        console.log("✅ Connected to MongoDB!");
        return client;
    } catch (error) {
        console.error("❌ Error connecting to MongoDB:", error);
        setTimeout(connectToDB, 5000); // Retry connection
    }
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Step 2.2: User Signup (Register)
app.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const db = client.db("customcraftDB");
        const users = db.collection("users");

        // Check if user already exists
        const existingUser = await users.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "❌ User already exists" });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save user in MongoDB
        const result = await users.insertOne({ name, email, password: hashedPassword });
        res.json({ message: "✅ User registered successfully!", userId: result.insertedId });
    } catch (error) {
        console.error("❌ Error signing up:", error);
        res.status(500).json({ message: "❌ Signup failed" });
    }
});

// ✅ Step 2.3: User Login (Generate JWT)
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = client.db("customcraftDB");
        const users = db.collection("users");

        // Find user in DB
        const user = await users.findOne({ email });
        if (!user) return res.status(400).json({ message: "❌ User not found" });

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "❌ Incorrect password" });

        // Generate JWT
        const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });

        res.json({ message: "✅ Login successful!", token });
    } catch (error) {
        console.error("❌ Error logging in:", error);
        res.status(500).json({ message: "❌ Login failed" });
    }
});

// ✅ Step 2.4: Middleware to Protect Routes
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // Extract token from "Bearer <token>"
    if (!token) return res.status(401).json({ message: "❌ Access denied. No token provided." });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "❌ Invalid token" });
        req.user = user;
        next();
    });
};

// ✅ Step 2.5: Protected Route Example
app.get('/profile', authenticateToken, (req, res) => {
    res.json({ message: "✅ Profile data accessed", user: req.user });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log("\n🔴 Closing MongoDB connection...");
    if (client) await client.close();
    process.exit(0);
});

// Start server
app.listen(port, async () => {
    await connectToDB();
    console.log(`🚀 Server running on http://localhost:${port}`);
});
