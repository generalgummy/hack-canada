const mongoose = require('mongoose');

const connectDB = async (retries = 5, delay = 5000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`MongoDB connection attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt < retries) {
        console.log(`Retrying in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        console.error('All MongoDB connection attempts failed. Exiting.');
        process.exit(1);
      }
    }
  }
};

module.exports = connectDB;
