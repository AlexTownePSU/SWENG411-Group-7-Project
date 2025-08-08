const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const connectToDatabase = require('../db/db.js');
const bcrypt = require('bcrypt');

router.get('/GetUsers', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('users');

    // Build dynamic query object
    const query = {};
    
    // Check for _id parameter
    if (req.query._id) {
      try {
        query._id = new ObjectId(req.query._id);
      } catch (err) {
        return res.status(400).json({message: 'Invalid ObjectId format'});
      }
    }

    // Check for username parameter
    if (req.query.username) {
      const username = req.query.username?.trim(); // Sanitize the username input
      console.log('Searching for:', req.query.username);
      query.username = { $regex: username, $options: 'i' };
    }

    // Check for password parameter
    if (req.query.password) {
      const password = req.query.password?.trim();
      console.log('Searching for password:', req.query.password);
      query.password = { $regex: password, $options: 'i' };
    }

    // Check for employee_id parameter
    if (req.query.employee_id) {
      try {
        query.employee_id = new ObjectId(req.query.employee_id);
      } catch (err) {
        return res.status(400).json({message: 'Invalid ObjectId format for employee_id'});
      }
    }

    const users = await collection.find(query).toArray();
    console.log("User(s) found:", users);
    res.json(users);  // Return JSON string of users found in query
} catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/RegisterUser', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('users');

        // Validate request body
        const { username, password, employee_id } = req.body;
        if (!username || !password || !employee_id) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Validate employee_id format
        if (!ObjectId.isValid(employee_id)) {
            return res.status(400).json({ message: 'Invalid employee_id format' });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password.trim(), saltRounds);

        // Create new user object
        const newUser = {
            username: username.trim(),
            password: hashedPassword,
            employee_id: new ObjectId(employee_id),
            settings: {
              font_size: 16,        // Default font size for new users
              theme: "light"        // Default color theme for new users
            }
        };

        // Insert new user
        const result = await collection.insertOne(newUser);
        res.status(201).json({ message: 'User added successfully', userId: result.insertedId });
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
});

router.post('/LoginUser', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('users');

        // Validate request body
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Missing username or password' });
        }

        // Find user by username
        const user = await collection.findOne({ username: username.trim() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password.trim(), user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Successful login
        res.status(200).json({ message: 'Login successful', userId: user._id });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
});

router.put('/UpdateUser/:id', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('users');

    const userId = req.params.id;
    const { username, password, employee_id, settings } = req.body;

    const updatedUser = {
      username,
      password,
      employee_id: new ObjectId(employee_id),
      settings: {
        theme: settings.theme,
        font_size: settings.font_size
      }
    };
    const result = await collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updatedUser }
    );

    res.status(200).json({ modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Update error:', error.stack);
    res.status(500).json({ error: 'Failed to update user', details: error.message });
  }
});

router.delete('/DeleteUsers/:id', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('users');
    const userId = req.params.id;
    const result = await collection.deleteOne({ _id: new ObjectId(userId) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

module.exports = router;