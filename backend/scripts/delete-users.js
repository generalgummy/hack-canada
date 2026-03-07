const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/northern-harvest';

async function deleteAllUsers() {
  try {
    console.log('🔗 Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    const result = await usersCollection.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} users from the database`);
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteAllUsers();
