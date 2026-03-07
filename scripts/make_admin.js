import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env.production' });

import mongoose from 'mongoose';
import User from './backend/models/User.js';

/**
 * Admin Promotion Script
 * Promotes an existing user to the 'admin' role.
 *
 * Usage:
 *   ADMIN_EMAIL=your@email.com node scripts/make_admin.js
 *
 * Or on production server:
 *   MONGO_URI=<uri> ADMIN_EMAIL=your@email.com node scripts/make_admin.js
 */
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

if (!ADMIN_EMAIL) {
    console.error('❌ ADMIN_EMAIL env var is required.');
    console.error('   Usage: ADMIN_EMAIL=your@email.com node scripts/make_admin.js');
    process.exit(1);
}

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email: ADMIN_EMAIL.toLowerCase().trim() });

        if (!user) {
            console.error(`❌ No user found with email: ${ADMIN_EMAIL}`);
            process.exit(1);
        }

        if (user.role === 'admin') {
            console.log(`ℹ️  User ${ADMIN_EMAIL} is already an admin.`);
            process.exit(0);
        }

        user.role = 'admin';
        await user.save();

        console.log(`✅ Successfully promoted ${ADMIN_EMAIL} to admin.`);
        console.log(`   User ID: ${user._id}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

run();
