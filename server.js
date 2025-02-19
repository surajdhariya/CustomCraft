const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const port = 3002;

// MongoDB connection string (ensure it's correct)
const uri = 'mongodb+srv://surajdhariya:<db_password>@customcraft-cluster.xoakt.mongodb.net/customcraftDB?retryWrites=true&w=majority&tls=true';
let client;

// Function to connect to MongoDB with error handling
async function connectToDB() {
    try {
        client = new MongoClient(uri, {
            serverSelectionTimeoutMS: 5000, // Avoid infinite waiting if MongoDB is unreachable
            tls: true,
            tlsAllowInvalidCertificates: false, // Ensures secure connection
        });

        await client.connect();
        console.log("✅ Connected to MongoDB!");

        // Handle connection errors
        client.on('error', (err) => {
            console.error("❌ MongoDB connection error:", err);
        });

        return client;
    } catch (error) {
        console.error("❌ Error connecting to MongoDB:", error);
        setTimeout(connectToDB, 5000); // Retry after 5 seconds
    }
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Save configuration route
app.post('/saveConfiguration', async (req, res) => {
    if (!client) return res.status(500).json({ message: "❌ Database not connected" });

    try {
        const db = client.db("customcraftDB");
        const collection = db.collection("devices");
        const result = await collection.insertOne(req.body);
        res.json({ message: '✅ Configuration saved successfully!', id: result.insertedId });
    } catch (error) {
        console.error("❌ Error saving configuration:", error);
        res.status(500).json({ message: '❌ Failed to save configuration' });
    }
});



// Graceful shutdown to close MongoDB connection
process.on('SIGINT', async () => {
    console.log("\n🔴 Closing MongoDB connection...");
    if (client) await client.close();
    process.exit(0);
});

// Start the server
app.listen(port, async () => {
    await connectToDB();
    console.log(`🚀 Server running on http://localhost:${port}`);
});


app.post('/getVendors', async (req, res) => {
    if (!client) return res.status(500).json({ message: "❌ Database not connected" });

    try {
        const db = client.db("customcraftDB");
        const vendorCollection = db.collection("vendors");

        const selectedSpecs = req.body; // Get selected device specs from frontend
        console.log("🔍 Fetching vendors for specs:", selectedSpecs);

        // Query vendors who match the selected specifications
        const vendors = await vendorCollection.find({
            deviceType: selectedSpecs.device,
            supportedSpecs: { $all: [selectedSpecs.processor, selectedSpecs.ram, selectedSpecs.storage] }
        }).toArray();

        console.log("✅ Vendors found:", vendors);
        res.json(vendors);
    } catch (error) {
        console.error("❌ Error fetching vendors:", error);
        res.status(500).json({ message: "❌ Failed to fetch vendors" });
    }
});
