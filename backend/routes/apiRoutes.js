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
    const groups = await Group.find({ members: userId });
    const mappedGroups = groups.map(g => ({ ...g._doc, id: g._id.toString() }));
    res.json(mappedGroups);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/groups', async (req, res) => {
  try {
    const { type, topic, avatar, description, members, admins } = req.body;
    
    // For direct chats, check if one already exists with the same members
    if (type === 'direct' && members && members.length === 2) {
      const existing = await Group.findOne({ 
        type: 'direct', 
        members: { $all: members, $size: 2 } 
      });
      if (existing) {
        return res.json({ ...existing._doc, id: existing._id.toString() });
      }
    }

    const group = new Group({ type, topic, avatar, description, members: members || [], admins: admins || [] });
    await group.save();
    res.json({ ...group._doc, id: group._id.toString() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/groups/:id/join', async (req, res) => {
  try {
    const userId = req.user.id;
    const group = await Group.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { members: userId } },
      { new: true }
    );
    res.json({ ...group._doc, id: group._id.toString() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/groups/:id/leave', async (req, res) => {
  try {
    const userId = req.user.id;
    const group = await Group.findByIdAndUpdate(
      req.params.id,
      { $pull: { members: userId } },
      { new: true }
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/groups/:id', async (req, res) => {
  try {
    await Group.findByIdAndDelete(req.params.id);
    await Message.deleteMany({ chat_id: req.params.id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// MESSAGES
router.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find({}).sort({ createdAt: 1 });
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
    const { chat_id, text, image } = req.body;
    const sender = req.user.id;
    const msg = new Message({ chat_id, sender_id: sender, text, image });
    await msg.save();
    
    const mappedMsg = { ...msg._doc, id: msg._id.toString() };
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

router.post('/listings', async (req, res) => {
  try {
    const { title, type, description, image_url, contact } = req.body;
    const listing = new Listing({ title, type, description, author_id: req.user.id, image_url, contact });
    await listing.save();

    const mapped = { ...listing._doc, id: listing._id.toString() };
    
    // Emit real-time update for all users
    const io = req.app.get('io');
    if (io) io.emit('global_listing_update', mapped);

    res.json(mapped);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/listings/:id', async (req, res) => {
  try {
    await Listing.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
