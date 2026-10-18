const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ MONGO_URI is not set in backend/.env!');
    console.error('👉 Please copy backend/.env.example to backend/.env and add your MongoDB Atlas URI.');
    console.error('   See MANUAL_SETUP_GUIDE.md for step-by-step instructions.');
    console.error('='.repeat(60) + '\n');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB Error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
