const express = require('express');
const path = require('path');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const employeesRoute = require('./routes/employees');
const performanceRoute = require('./routes/performance');
const usersRoute = require('./routes/users'); // Import user routes
const trainingRoute = require('./routes/training'); // Import training routes
const connectToDatabase = require('./db/db.js');


const hostname = '192.168.86.122';
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

// API endpoints
app.use(express.json());	// Allows for parsing JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use('/api/employees', employeesRoute);		// Include employee API routes
app.use('/api/performance', performanceRoute);	// Include performance API routes
app.use('/api/users', usersRoute);				// Include user API routes
app.use('/api/training', trainingRoute);		// Include training API routes

// Connect to DB then Start server
connectToDatabase().then(() => {
	app.listen(port, hostname, () => {
		console.log(`Server running at http://${hostname}:${port}/`);
	});
});
