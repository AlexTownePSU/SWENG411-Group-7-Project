const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://group7db:lSSiu4rXTW0Sh2u4@cluster0.ve13uvk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);
const dbName = 'raise_tracker_db';

let db;

async function connectToDatabase() {
  if (!db) {
    await client.connect();
    db = client.db(dbName);
    console.log('✅ Connected to MongoDB');
  }
  return db;
}

module.exports = connectToDatabase;
