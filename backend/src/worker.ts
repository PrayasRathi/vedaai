import 'dotenv/config';
import mongoose from 'mongoose';

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vedaai')
  .then(() => console.log('✅ Worker MongoDB connected'))
  .catch(console.error);

console.log('🚀 Worker ready (direct mode - no Redis needed)');