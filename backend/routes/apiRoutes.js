const express = require('express');
const router = express.Router();
const { authMiddleware } = require('./authRoutes');
const User = require('../models/User');
const Group = require('../models/Group');
const Message = require('../models/Message');
const Listing = require('../models/Listing');

// Protect all API routes
router.use(authMiddleware);

// PROFILES
router.get('/profiles', async (req, res) => {
  try {
    const users = await User.find({});
    // Map _id to id for frontend compatibility
    const mappedUsers = users.map(u => ({ ...u._doc, id: u._id.toString() }));
    res.json(mappedUsers);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/profiles', async (req, res) => {
  try {
    // upsert logic
    const { id, name, avatar, bio, phone } = req.body;
    if (id && id.length > 10) { // simple check to ensure it's an objectid or valid id
      await User.findByIdAndUpdate(id, { name, avatar, bio, phone });
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GROUPS
router.get('/groups', async (req, res) => {
  try {
    const userId = req.user.id;
    // Return all groups where the current user is a member
    const groups = await Group.find({ members: userId });
    const mappedGroups = groups.map(g => ({ ...g._doc, id: g._id.toString() }));
    res.json(mappedGroups);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/groups', async (req, res) => {
  try {
    const { type, topic, avatar, description, members, admins } = req.body;
    const group = new Group({ type, topic, avatar, description, members: members || [], admins: admins || [] });
    await group.save();
    const mapped = { ...group._doc, id: group._id.toString() };
    res.json(mapped);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// MESSAGES
router.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find({}).sort({ createdAt: 1 });
    // Map _id to id
    const mapped = messages.map(m => ({ ...m._doc, id: m._id.toString() }));
    res.json(mapped);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/messages/:chatId', async (req, res) => {
  try {
    const messages = await Message.find({ chat_id: req.params.chatId }).sort({ createdAt: 1 });
    const mapped = messages.map(m => ({ ...m._doc, id: m._id.toString() }));
    res.json(mapped);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/messages', async (req, res) => {
  try {
    const { chat_id, text, image, sender_id } = req.body;
    const sender = sender_id || req.user.id;
    const msg = new Message({ chat_id, sender_id: sender, text, image });
    await msg.save();
    
    const mappedMsg = { ...msg._doc, id: msg._id.toString() };
    
    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(chat_id).emit('receive_message', mappedMsg);
      io.emit('global_message_update', mappedMsg);
    }
    
    res.json(mappedMsg);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// LISTINGS
router.get('/listings', async (req, res) => {
  try {
    const listings = await Listing.find({}).sort({ createdAt: -1 });
    const mapped = listings.map(l => ({ ...l._doc, id: l._id.toString() }));
    res.json(mapped);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
