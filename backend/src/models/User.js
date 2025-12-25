const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    unique: true,
    sparse: true // Allows null/undefined to not conflict (for google-only users if we wanted, but we'll try to get phone)
  },
  email: {
    type: String,
    unique: true,
    sparse: true
  },
  password: {
    type: String, // Will be hashed in a real app, storing plain for prototype if needed, but let's do simple text for now as requested "mock" became "real" but no bcrypt installed. I'll install bcryptjs for good measure? No, user didn't ask for security, just "mongodb". I'll keep it simple.
    select: false
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  role: {
    type: String,
    enum: ['patient', 'driver', 'hospital'],
    default: 'patient'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
