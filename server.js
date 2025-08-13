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
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');

const hostname = '0.0.0.0';
const port = 3000;
const app = express();

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


// Serve static files (like index.html) adding some extra protection by only showing public html files
app.use(express.static(path.join(__dirname)));

// Session middleware: enables persistent login sessions and secures session data with a secret key
app.use(session({
  secret: 'dev-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Initialize Passport for authentication and persistent login sessions
app.use(passport.initialize());
app.use(passport.session());
// MongoDB connection
const uri = "mongodb+srv://group7db:lSSiu4rXTW0Sh2u4@cluster0.ve13uvk.mongodb.net/raise_tracker_db?retryWrites=true&w=majority&appName=Cluster0"; 
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	}
});

mongoose.connect(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
	username: String,
	password: String,
	employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
	settings: { theme: String, font_size: String },
	googleId: String,
	displayName: String,
	email: {type: String, required: true, unique: true }
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

// Employee schema for lookup during user login
const employeeSchema = new mongoose.Schema({
	employee_name: String,
	hire_date: Date,
	job_title: String,
	active: Boolean,
	type: String,
	trained: String,
	qualification: String
}, { collection: 'employees'});

const Employee = mongoose.model('Employee', employeeSchema);

// Configure Passport to use Google OAuth 2.0 strategy
passport.use(new GoogleStrategy({
  clientID: '203344436857-4ms4tj7vn67r7na77d1u8q8k9maejkjk.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: 'https://one-tahr-huge.ngrok-free.app/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
  try {
	// Attempt employee lookup by name when adding user
	const employee = await Employee.findOne({ employee_name: profile.displayName });
    let user = await User.findOne({ googleId: profile.id });

    if (!user) {
      user = await User.create({
		username: profile.emails[0].value,
		password: '', // Password is not used for Google users
		employee_id: employee ? employee._id : null, // Link to employee if found
		settings: { theme: 'light', font_size: '16px' }, // Default settings
        googleId: profile.id,
        displayName: profile.displayName,
        email: profile.emails[0].value
      });
	}
	return done(null, user);
	} catch (err) {
	  return done(err, null);
	}
}));

// function(accessToken, refreshToken, profile, done) {
//   // This function runs after successful authentication
//   // You can save or look up the user in your database here
//   return done(null, profile);
// }

// ));

// Serialize user info into the session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user info from the session
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Set CORS options
const corsOptions = {
	origin: `http://${hostname}:${port}`,
	methods: ['GET', 'POST', 'PUT', 'DELETE'],
	credentials: true,
};

app.use(cors(corsOptions));

// Google OAuth authentication routes
// Route to start Google OAuth login
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Route to handle callback from Google after authentication
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login.html' }),
  function(req, res) {
    // Successful authentication, redirect to home or dashboard
    res.redirect('/');
  }
);

// Adding a route to get the authenticated user's profile
app.get('/profile', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user); // This will contain the Google profile info
  } else {
    res.redirect('/login.html');
  }
});



app.use(express.json());	// Allows for parsing JSON bodies
app.use(express.urlencoded({ extended: true }));

// API endpoints
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

