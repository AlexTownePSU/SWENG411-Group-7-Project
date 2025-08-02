const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const connectToDatabase = require('../db/db.js');

// Get training status route
router.get('/GetTrainingStatus', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('training');
    
        // Build dynamic query object
        const query = {};
        
        // Check for employee_id parameter
        if (req.query.employee_id) {
            try {
                query.employee_id = new ObjectId(req.query.employee_id);
            } catch (err) {
                return res.status(400).json({message: 'Invalid ObjectId format for employee_id'});
            }
        }

        if (req.query.name) {
            try {
                query.name = { $regex: req.query.name, $options: 'i' }; // Case-insensitive search  
            } catch (err) {
                return res.status(400).json({message: 'Invalid name format'});
            }
        }
    
        // Fetch training status
        const trainingStatus = await collection.find(query).toArray();
        
        res.status(200).json(trainingStatus);
    } catch (error) {
        console.error('Error fetching training status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;