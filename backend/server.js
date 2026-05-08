const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

// 1. Middleware (Must come before routes!)
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// 2. Routes
app.get('/', (req, res) => {
    res.send("Campus Lost & Found Server is LIVE! 🚀");
});
app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));

// 3. Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.log('MongoDB connection error:', err));

// 4. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));