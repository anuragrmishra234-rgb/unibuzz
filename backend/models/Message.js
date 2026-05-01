const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chat_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  sender_id: { type: String, required: true }, // 'system' or User ObjectId string
  text: { type: String, required: true },
  image: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
