const express = require('express');
const cors = require('cors'); // Import cors
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');
const Razorpay = require("razorpay");



dotenv.config(); // Load environment variables

const app = express();
const port = 3005;
app.use(cors({
    origin: ['http://127.0.0.1:3005', 'http://localhost:3005'], // Add allowed origins
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    
}));
app.use(cors({ origin: "https://customcraft.onrender.com" }));

// MongoDB connection string
const uri = 'mongodb+srv://surajdhariya:suraj@customcraft-cluster.xoakt.mongodb.net/customcraftDB?retryWrites=true&w=majority&tls=true';
let client;

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "mySuperSecureRandomJWTKey12345!"; // Change this in production

// Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

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

// ✅ User Signup
app.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const db = client.db("customcraftDB");
        const users = db.collection("users");

        const existingUser  = await users.findOne({ email });
        if (existingUser ) return res.status(400).json({ message: "❌ User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await users.insertOne({ name, email, password: hashedPassword });
        res.json({ message: "✅ User registered successfully!", userId: result.insertedId });
    } catch (error) {
        console.error("❌ Error signing up:", error);
        res.status(500).json({ message: "❌ Signup failed" });
    }
});

// ✅ User Login
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = client.db("customcraftDB");
        const users = db.collection("users");

        const user = await users.findOne({ email });
        if (!user) return res.status(400).json({ message: "❌ User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "❌ Incorrect password" });

        const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });

        res.json({ message: "✅ Login successful!", token });
    } catch (error) {
        console.error("❌ Error logging in:", error);
        res.status(500).json({ message: "❌ Login failed" });
    }
});

// ✅ Middleware to Protect Routes
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; 
    if (!token) return res.status(401).json({ message: "❌ Access denied. No token provided." });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "❌ Invalid token" });
        req.user = user;
        next();
    });
};

// ✅ Create Razorpay Order
app.post("/create-order", authenticateToken, async (req, res) => {
    try {
        const { amount, address } = req.body; // Accept address from the request
        const options = {
            amount: amount * 100, // Convert ₹ to paise
            currency: "INR",
            receipt: `order_rcptid_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        // Store order in MongoDB
        const db = client.db("customcraftDB");
        const payments = db.collection("payments");
        await payments.insertOne({
            userId: req.user.userId,
            orderId: order.id,
            amount: amount,
            currency: "INR",
            status: "created",
            createdAt: new Date(),
            address: address // Store the address
        });

        res.json(order);
    } catch (error) {
        console.error("❌ Error creating order:", error);
        res.status(500).json({ message: "❌ Order creation failed" });
    }
});

// ✅ Fetch User Orders
app.get("/my-orders", authenticateToken, async (req, res) => {
    try {
        const db = client.db("customcraftDB");
        const payments = db.collection("payments");

        const userOrders = await payments.find({ userId: req.user.userId }).toArray();
        res.json({ orders: userOrders });
    } catch (error) {
        console.error("❌ Error fetching orders:", error);
        res.status(500).json({ message: "❌ Failed to fetch orders" });
    }
});

// ✅ Capture Payment (Optional)
app.post("/capture-payment", authenticateToken, async (req, res) => {
    try {
        const { paymentId, orderId } = req.body;

        // Update payment status in MongoDB
        const db = client.db("customcraftDB");
        const payments = db.collection("payments");
        await payments.updateOne({ orderId }, { $set: { status: "paid", paymentId, updatedAt: new Date() } });

        res.json({ message: "✅ Payment captured successfully!" });
    } catch (error) {
        console.error("❌ Error capturing payment:", error);
        res.status(500).json({ message: "❌ Payment capture failed" });
    }
});

// ✅ Fetch User Payments
app.get("/my-payments", authenticateToken, async (req, res) => {
    try {
        const db = client.db("customcraftDB");
        const payments = db.collection("payments");

        const userPayments = await payments.find({ userId: req.user.userId }).toArray();
        res.json({ payments: userPayments });
    } catch (error) {
        console.error("❌ Error fetching payments:", error);
        res.status(500).json({ message: "❌ Failed to fetch payments" });
    }
});


// ✅ Protected User Dashboard
app.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const db = client.db("customcraftDB");
        const users = db.collection("users");

        const user = await users.findOne({ email: req.user.email }, { projection: { password: 0 } });
        if (!user) return res.status(404).json({ message: "User  not found" });

        res.json({ user });
    } catch (error) {
        console.error("❌ Error fetching user data:", error);
        res.status(500).json({ message: "Internal server error" });
    }
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