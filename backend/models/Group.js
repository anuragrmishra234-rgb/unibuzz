const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  type: { type: String, enum: ['group', 'community', 'direct'], required: true },
  topic: { type: String, required: true },
  avatar: { type: String },
  members: [{ type: String }],
  admins: [{ type: String }],
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);
