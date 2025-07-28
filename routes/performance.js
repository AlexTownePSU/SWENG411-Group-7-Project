const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const connectToDatabase = require('../db/db.js');

router.get('/GetPerformanceRatings', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('performance_rating');
    
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

        // Check for employee_id parameter
        if (req.query.employee_id) {
            try {
                query.employee_id = new ObjectId(req.query.employee_id);
            } catch (err) {
                return res.status(400).json({message: 'Invalid ObjectId format for employee_id'});
            }
        }

        // Check for hire_date parameter
        if (req.query.review_date) {
            const date = new Date(req.query.review_date);
            console.log('Searching for date:', req.query.review_date);
            if(!isNaN(date)) {
                const nextDay = new Date(date);
                nextDay.setDate(date.getDate() + 1);

                query.hire_date = {
                    $gte: date,
                    $lt: nextDay
                };
            }
        }

        // Check for rating parameter
        if (req.query.rating) {
            try {
                const rating = parseInt(req.query.rating);
                if (isNaN(rating)) {
                    return res.status(400).json({message: 'Invalid rating format'});
                }
                query.rating = rating;
            } catch (err) {
                return res.status(400).json({message: 'Invalid rating format'});
            }
        }
        const performanceData = await collection.find(query).toArray();
        res.json(performanceData);
    } catch (error) {
        console.error('Error fetching performance:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/SubmitPerformance', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('performance_rating');

        // Validate request body
        const { employee_id, review_date, rating } = req.body;
        if (!employee_id || !review_date || rating === undefined) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Validate employee_id format
        if (!ObjectId.isValid(employee_id)) {
            return res.status(400).json({ message: 'Invalid employee_id format' });
        }

        // Validate rating
        if (isNaN(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
        }

        // Create new performance record
        const newPerformance = {
            employee_id: new ObjectId(employee_id),
            review_date: new Date(review_date),
            rating: parseInt(rating)
        };

        // Insert new performance record into the collection
        const result = await collection.insertOne(newPerformance);
        res.status(201).json({ message: 'Performance record created', id: result.insertedId });
    } catch (error) {
        console.error('Error submitting performance:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
});

router.put('/UpdatePerformance/:id', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('performance_rating');

        const performanceId = req.params.id;
        const { employee_id, review_date, rating } = req.body;

        // Validate request body
        if (!employee_id || !review_date || rating === undefined) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Validate employee_id format
        if (!ObjectId.isValid(employee_id)) {
            return res.status(400).json({ message: 'Invalid employee_id format' });
        }

        // Validate rating
        if (isNaN(rating) || rating < 1 || rating > 100) {
            return res.status(400).json({ message: 'Rating must be a number between 1 and 100' });
        }

        const updatedPerformance = {
            employee_id: new ObjectId(employee_id),
            review_date: new Date(review_date),
            rating: parseInt(rating)
        };

        const result = await collection.updateOne(
            { _id: new ObjectId(performanceId) },
            { $set: updatedPerformance }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: 'Performance record not found or no changes made' });
        }

        res.json({ message: 'Performance record updated successfully' });
    } catch (error) {
        console.error('Update error:', error.stack);
        res.status(500).json({ error: 'Failed to update performance record', details: error.message });
    }
});

router.delete('/DeletePerformance/:id', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('performance_rating');

        const performanceId = req.params.id;
        const result = await collection.deleteOne({ _id: new ObjectId(performanceId) });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Performance record not found' });
        }
        
        res.status(200).json({ message: 'Performance record deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error.stack);
        res.status(500).json({ error: 'Failed to delete performance record', details: error.message });
    }
});

module.exports = router;