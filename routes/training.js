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

// Update training status route
router.put('/UpdateTrainingStatus/:id', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('training');
        
        const { id } = req.params;
        const updateData = req.body;

        // Validate ObjectId
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid ObjectId format' });
        }

        // Update training status
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: 'Training status not found or no changes made' });
        }

        res.status(200).json({ message: 'Training status updated successfully' });
    } catch (error) {
        console.error('Error updating training status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// New training status route
router.post('/AddTrainingStatus', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('training');

        const newTrainingStatus = req.body;

        // Validate required fields
        if (!newTrainingStatus.name || !newTrainingStatus.type || !newTrainingStatus.duration || !newTrainingStatus.duration_type || !newTrainingStatus.start_date || !newTrainingStatus.required) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Insert new training status
        const result = await collection.insertOne(newTrainingStatus);
        res.status(201).json({ insertedId: result.insertedId });
    } catch (error) {
        console.error('Error adding training status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete training status route
router.delete('/DeleteTrainingStatus/:id', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('training');

        const { id } = req.params;

        // Validate ObjectId
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid ObjectId format' });
        }

        // Delete training status
        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Training status not found' });
        }

        res.status(200).json({ message: 'Training status deleted successfully' });
    } catch (error) {
        console.error('Error deleting training status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;