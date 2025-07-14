const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const connectToDatabase = require('../db/db.js');

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

router.post('/AddUsers', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('users');
        
        // Validate request body
        if (!req.body.username || !req.body.password || !req.body.employee_id) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Create new user object
        const newUser = {
            username: req.body.username.trim(),
            password: req.body.password.trim(),
            employee_id: new ObjectId(req.body.employee_id)
        };

        // Insert new user into the collection
        const result = await collection.insertOne(newUser);
        res.status(201).json({ message: 'User added successfully', userId: result.insertedId });
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
});