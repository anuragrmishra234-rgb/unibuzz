const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['lost', 'found'], required: true },
  description: { type: String, required: true },
  author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  image_url: { type: String },
  contact: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Listing', listingSchema);
