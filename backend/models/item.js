const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  type: { type: String, enum: ['lost', 'found'], required: true },
  category: { type: String, required: true },
  image: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['open', 'claimed', 'closed'], default: 'open' },
  claims: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);