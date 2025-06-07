const express = require('express');
const path = require('path');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');

const hostname = '192.168.86.158';
const port = 3000;
const app = express();

// Serve static files (like index.html)
app.use(express.static(path.join(__dirname)));

// Set CORS options
const corsOptions = {
	origin: `http://${hostname}:${port}`,
	methods: ['GET', 'POST', 'PUT', 'DELETE'],
	credentials: true,
};
app.use(cors(corsOptions));

// MongoDB connection
const uri = "mongodb+srv://group7db:lSSiu4rXTW0Sh2u4@cluster0.ve13uvk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; 
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	}
});

let db;		// shared DB reference

// Connect when server starts
async function connectToDB() {
	try {
		await client.connect();
		db = client.db('sample_mflix');
		console.log('Connected to MongoDB');
	} catch (err) {
		console.error('Failed to connected to MongoDB:', err);
	}
}

// API endpoints
app.use(express.json());	// Allows for parsing JSON bodies

// GET Handler Function
function createGetHandler(collectionName, limit = 10) {
	return async (req, res) => {
		try {
			const collection = db.collection(collectionName);
			const data = await collection.find().limit(limit).toArray();
			res.json(data);
		} catch (error) {
			console.error(error);
			res.status(500).send('Error fetching data');
		}
	};
}

// POST Handler Function
function createPostHandler(collectionName, requiredFields) {
	return async (req, res) => {
		const payload = {};

		// Validate and build the payload
		for (const field of requiredFields) {
			const value = req.body[field];
			if (typeof value !== 'string' || value.trim() === '') {
				return res.status(400).json({ error: `Missing or invalid field: ${field}` });
			}
			payload[field] = value.trim();
		}

		try {
			const collection = db.collection(collectionName);
			const result = await collection.insertOne(payload);
			res.status(201).json({ insertedId: result.insertedId });
		} catch (error) {
			console.error(error);
			res.status(500).send('Error inserting data');
		}
	};
}

app.get('/api/movies', createGetHandler('movies'));
app.post('/api/movies', createPostHandler('movies', ['title']));

// Connect to DB then Start server
connectToDB().then(() => {
	app.listen(port, hostname, () => {
		console.log(`Server running at http://${hostname}:${port}/`);
	});
});
