const express = require('express');
const { MongoClient } = require('mongodb');

// Initialize Express app
const app = express();
const port = 3001;

// MongoDB connection string (replace with your actual connection string)
const uri = 'mongodb+srv://surajdhariya:Suraj@18@customcraft-cluster.xoakt.mongodb.net/?retryWrites=true&w=majority&appName=customcraft-cluster';

// Connect to MongoDB
async function connectToDB() {
    try {
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        console.log("Connected to MongoDB!");

        // Access the database and collection here if needed
        const db = client.db("customcraftDB");  // Database name
        const collection = db.collection("devices");  // Example collection

        // You can perform operations like insert, find, etc. on the collection
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

// Run the function to connect to MongoDB
connectToDB();

// Simple route to test the server
app.get('/', (req, res) => {
    res.send('Hello from server.js!');
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
