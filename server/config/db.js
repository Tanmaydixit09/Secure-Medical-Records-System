const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Attempt to connect to the database using the link in your .env file
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Stop the server if database connection fails
  }
};

module.exports = connectDB;