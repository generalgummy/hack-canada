/**
 * Seed the admin account.
 * Run:  node scripts/seed-admin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN = {
  name: 'Admin',
  email: 'admin@northernharvest.ca',
  password: 'Admin@2026',
  phone: '+10000000000',
  userType: 'community',   // needs a valid type to pass validation
  isAdmin: true,
  isPhoneVerified: true,
  isActive: true,
  location: 'System',
};

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const exists = await User.findOne({ email: ADMIN.email });
    if (exists) {
      // Update existing user to be admin
      exists.isAdmin = true;
      await exists.save({ validateBeforeSave: false });
      console.log('✅ Existing user promoted to admin:', exists.email);
    } else {
      await User.create(ADMIN);
      console.log('✅ Admin account created');
    }

    console.log('\n  Email:    ', ADMIN.email);
    console.log('  Password: ', ADMIN.password);
    console.log('  Phone:    ', ADMIN.phone);
    console.log();

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
})();
