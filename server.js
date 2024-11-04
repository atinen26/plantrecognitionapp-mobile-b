const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const axios = require('axios');
const helmet = require('helmet');
const cors = require('cors');

require('dotenv').config();
const uri = process.env.MONGODB_URI;
const app = express();

if (!uri) { 
    throw new Error('MongoDB connection string is not defined!');
}

app.use(helmet());
app.use(cors({ origin: 'https://atinen26.github.io' }));
app.use(bodyParser.json({ limit: '10mb' }));

// MongoDB client setup
const client = new MongoClient(uri);
let plantLocationsCollection;

// MongoDB connection function
async function connectToMongoDB() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db('plantspecies');
        plantLocationsCollection = db.collection('plant');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);  // Exit if connection fails
    }
}

// Connect to MongoDB and start server
connectToMongoDB().then(() => {
    const PORT = 3000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});

// API endpoint to fetch all plant locations
app.get('/plant-locations', async (req, res) => { 
    try {
        const className = req.query.className;
        const query = className && className !== 'All' ? { className } : {};

        const locations = await plantLocationsCollection.find(query).toArray();
        res.json(locations);  // Send the plant locations as JSON
    } catch (error) {
        console.error('Error fetching plant locations:', error);
        res.status(500).json({ error: 'Failed to fetch locations.' });
    }
});

// API endpoint to save plant scan data
app.post('/save-scan', async (req, res) => {
    const { className, timestamp, latitude, longitude, image } = req.body;

    try {
        const scanData = { className, timestamp, latitude, longitude, image };
        const result = await plantLocationsCollection.insertOne(scanData);  // Insert scan data
        res.status(200).json(result);  // Send success response
    } catch (error) {
        console.error('Error saving scan data:', error);
        res.status(500).json({ error: 'Failed to save scan data.' });
    }
});
