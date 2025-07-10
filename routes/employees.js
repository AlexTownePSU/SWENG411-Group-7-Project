const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');
const connectToDatabase = require('../db/db.js');

router.get('/employees', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('employees');

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

    // Check for employee_name parameter
    if (req.query.employee_name) {
        const name = req.query.employee_name?.trim(); // Sanitize the name input
        console.log('Searching for: ', req.query.employee_name);
        query.employee_name = { $regex: name, $options: 'i' };
    }

    // Check for hire_date parameter
    if (req.query.hire_date) {
        const date = new Date(req.query.hire_date);
        console.log('Searching for date: ', req.query.hire_date);
        if(!isNaN(date)) {
            const nextDay = new Date(date);
            nextDay.setDate(date.getDate() + 1);

            query.hire_date = {
                $gte: date,
                $lt: nextDay
            };
        }
    }

    // Check for job_title parameter
    if (req.query.job_title) {
      query.job_title = req.query.job_title;
    }

    // Check for active parameter
    if (req.query.active) {
      query.activeValue = req.query.active.toLowerCase();
      if(activeValue === 'true' || activeValue === 'false') {
        query.active = activeValue === 'true';
      }
    }

    const employees = await collection.find(query).toArray();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  } /*finally {
    await client.close();
  }*/
});

module.exports = router;
