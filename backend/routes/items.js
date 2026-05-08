const express = require('express');
const router = express.Router();
const multer = require('multer');
const Item = require('../models/Item');
const auth = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const item = new Item({
      ...req.body,
      image: req.file ? req.file.path : null,
      owner: req.userId
    });
    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { type, category, search } = req.query;
    let query = {};
    
    if (type) query.type = type;
    if (category) query.category = category;
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];

    const items = await Item.find(query).populate('owner', 'name department');
    res.json(items);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});
// Resolve/Delete an item
// Resolve/Archive an item (Instead of deleting)
router.put('/:id/resolve', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ msg: 'Item not found' });
    
    // Ensure only the person who posted it can close it
    if (item.owner._id.toString() !== req.userId.toString()) {
      return res.status(401).json({ msg: 'Not authorized to close this record' });
    }

    // Change the status to closed instead of deleting the item
    item.status = 'closed';
    await item.save();
    
    res.json({ msg: 'Record successfully archived', item });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

module.exports = router;