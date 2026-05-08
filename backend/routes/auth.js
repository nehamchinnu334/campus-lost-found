const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, department, contact } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: 'User already exists' });

    const user = new User({ name, email, password, department, contact });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name, email, department } });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email, department: user.department, role: user.role } });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});
// Update Profile Route
router.put('/profile', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.name = name || user.name;
    // We lock the email so it cannot be changed, matching your UI design
    
    await user.save();

    res.json({ 
        msg: 'Profile updated successfully', 
        user: { id: user._id, name: user.name, email: user.email, department: user.department } 
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});
module.exports = router;