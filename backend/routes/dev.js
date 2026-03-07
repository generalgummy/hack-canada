const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ⚠️ WARNING: DEVELOPMENT ONLY - Deletes all users
// Accept both GET and DELETE for convenience during development
router.get('/dev/delete-all-users', async (req, res) => {
  try {
    const result = await User.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} users`);
    
    res.json({
      message: `Deleted ${result.deletedCount} users`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting users', error: error.message });
  }
});

router.delete('/dev/delete-all-users', async (req, res) => {
  try {
    const result = await User.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} users`);
    
    res.json({
      message: `Deleted ${result.deletedCount} users`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting users', error: error.message });
  }
});

module.exports = router;
