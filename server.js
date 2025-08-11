const express = require('express');
const path = require('path');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const employeesRoute = require('./routes/employees');
const performanceRoute = require('./routes/performance');
const usersRoute = require('./routes/users'); // Import user routes
const trainingRoute = require('./routes/training'); // Import training routes
const connectToDatabase = require('./db/db.js');
const http = require('http');
const ngrok = require('@ngrok/ngrok');
require ('dotenv').config();

const hostname = '0.0.0.0';
const port = 3000;
const app = express();

//ngrok http --url=one-tahr-huge.ngrok-free.app 80
 (async function() {
	try {
		const listener = await ngrok.forward({
			addr: 3000, // Replace with the port your Node.js app is running on
			authtoken: process.env.NGROK_AUTHTOKEN,
			domain: "one-tahr-huge.ngrok-free.app"
		});
		console.log(`ngrok tunnel established at: ${listener.url()}`);
	} catch (error) {
		console.error('Error starting ngrok tunnel:', error);
	}
})();



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

app.use(express.json());	// Allows for parsing JSON bodies
app.use(express.urlencoded({ extended: true }));

// API endpoints
app.use('/api/employees', employeesRoute);		// Include employee API routes
app.use('/api/performance', performanceRoute);	// Include performance API routes
app.use('/api/users', usersRoute);				// Include user API routes
app.use('/api/training', trainingRoute);		// Include training API routes

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});


// Connect to DB then Start server
connectToDatabase().then(() => {
	app.listen(port, hostname, () => {
		console.log(`Server running at http://${hostname}:${port}/`);
	});
});
