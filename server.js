const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path'); // Import path module to serve static files

const app = express();
const port = 3002;

// MongoDB connection string
const uri = 'mongodb+srv://surajdhariya:Suraj@18@customcraft-cluster.xoakt.mongodb.net/?retryWrites=true&w=majority&appName=customcraft-cluster';

// MongoDB connection function
async function connectToDB() {
    try {
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        console.log("Connected to MongoDB!");
        return client;
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

// Middleware to parse incoming JSON requests
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Save configuration route
app.post('/saveConfiguration', async (req, res) => {
    const configuration = req.body; // Get the configuration from the request body
    const client = await connectToDB();
    const db = client.db("customcraftDB");  // Select the database
    const collection = db.collection("devices");  // Select the collection

    try {
        const result = await collection.insertOne(configuration);  // Insert the configuration document
        res.json({ message: 'Configuration saved successfully!', id: result.insertedId });
    } catch (error) {
        console.error("Error saving configuration:", error);
        res.status(500).json({ message: 'Failed to save configuration' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});






app.post('/saveConfiguration', async (req, res) => {
    const configuration = req.body; // Get the configuration from the request body
    const db = client.db("customcraftDB");  // Select the database
    const collection = db.collection("configurations");  // Select the collection

    try {
        const result = await collection.insertOne(configuration);  // Insert the configuration document
        res.json({ message: 'Configuration saved successfully!', id: result.insertedId });
    } catch (error) {
        console.error("Error saving configuration:", error);
        res.status(500).json({ message: 'Failed to save configuration' });
    }
});