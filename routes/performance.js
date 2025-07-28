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

module.exports = router;