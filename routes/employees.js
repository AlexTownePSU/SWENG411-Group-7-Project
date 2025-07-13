const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');
const connectToDatabase = require('../db/db.js');

router.get('/GetEmployees', async (req, res) => {
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
        console.log('Searching for:', req.query.employee_name);
        query.employee_name = { $regex: name, $options: 'i' };
    }

    // Check for hire_date parameter
    if (req.query.hire_date) {
        const date = new Date(req.query.hire_date);
        console.log('Searching for date:', req.query.hire_date);
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
      const jobTitle = req.query.job_title?.trim();
      console.log('Searching for job title:', req.query.job_title);
      query.job_title = { $regex: jobTitle, $options: 'i' };
    }

    // Check for active parameter
    // TODO fix active search -- HTML/CSS set checkbox values to 'on' or 'off' need a good way to translate that
    if (req.query.active) {
      query.activeValue = req.query.active;
    }
    
    const employees = await collection.find(query).toArray();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

router.post('/SubmitEmployees', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('employees');

    const { employee_name, hire_date, job_title, active } = req.body;

    const newEmployee = {
      employee_name,
      hire_date: new Date(hire_date),
      job_title,
      active
    };

    const result = await collection.insertOne(newEmployee);
    res.status(201).json({ insertedId: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create employee', details: error.message})
  }
});

router.put('/UpdateEmployees/:id', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('employees');

    const employeeId = req.params.id;
    const { employee_name, hire_date, job_title, active } = req.body;

    const updatedEmployee = {
      employee_name,
      hire_date: new Date(hire_date),
      job_title,
      active
    };
    const result = await collection.updateOne(
      { _id: new ObjectId(employeeId) },
      { $set: updatedEmployee }
    );

    res.status(200).json({ modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Update error:', error.stack);
    res.status(500).json({ error: 'Failed to update employee', details: error.message });
  }
});

module.exports = router;
