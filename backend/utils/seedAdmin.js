require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * There is deliberately NO public "register as admin" endpoint anywhere in
 * this app. The only way an admin account is created is by running this
 * script on the server, using credentials from environment variables. Run it
 * once after setting ADMIN_BOOTSTRAP_EMAIL / ADMIN_BOOTSTRAP_PASSWORD in .env:
 *
 *   npm run seed:admin
 */
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
    const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
    const name = process.env.ADMIN_BOOTSTRAP_NAME || 'Super Admin';

    if (!email || !password) {
      throw new Error('Set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD in .env first.');
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.log('An account with this email already exists:', existing.role);
      return;
    }

    const admin = await User.create({ name, email: email.toLowerCase(), password, role: 'admin' });
    console.log(`Admin account created: ${admin.email}`);
    console.log(`Log in at the hidden admin URL using this email/password. See ADMIN_ROUTE_SECRET in .env.`);
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
})();
