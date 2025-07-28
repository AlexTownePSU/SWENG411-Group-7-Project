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
} catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/SubmitUsers', async (req, res) => {
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
            employee_id: new ObjectId(employee_id)
        };

        // Insert new user
        const result = await collection.insertOne(newUser);
        res.status(201).json({ message: 'User added successfully', userId: result.insertedId });
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
});

module.exports = router;