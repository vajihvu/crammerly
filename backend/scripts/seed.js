import dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

import crypto from 'crypto';

import mongoose from 'mongoose';
import User from '../models/User.js';
import Session from '../models/Session.js';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import config from '../config/index.js';

const seedData = async () => {
    // 1. Strict Production Guard
    if (config.isProduction || process.env.NODE_ENV === 'production') {
        console.error('🛑 CRITICAL ERROR: Seeding is blocked in production environments to prevent data loss.');
        process.exit(1);
    }

    console.log('🌱 Starting development database seeding...');

    try {
        await mongoose.connect(config.mongoUri);
        console.log('Connected to MongoDB');

        // 2. Clean existing data (Only safe because we already checked for production)
        await User.deleteMany({});
        await Session.deleteMany({});
        await Room.deleteMany({});
        await Message.deleteMany({});
        console.log('🧹 Cleaned existing development data');

        // Create Dev User
        const devUser = await User.create({
            name: 'Dev Admin',
            email: 'admin@Crammerly.io',

            password: 'Password123!', // Note: This will be hashed by pre-save hook
            role: 'admin',
            isOnboarded: true,
            tag: '0001'
        });

        console.log('✅ Created Dev Admin: admin@Crammerly.io / Password123!');


        // Create a public room
        const demoRoom = await Room.create({
            name: 'General Study Hall',
            task: 'Collaborative Study',
            topic: 'General',
            privacy: 'Public',
            creator_id: devUser._id,
            members: [{ user: devUser._id, progress: [] }]
        });

        console.log(`✅ Created Demo Room: ${demoRoom.name}`);

        // Create a welcome message
        await Message.create({
            room_id: demoRoom._id,
            sender_id: devUser._id,
            content: 'Welcome to Crammerly! This is a fresh MongoDB-powered room.',

            type: 'text'
        });

        console.log('✅ Created welcome message');

        // Create initial session
        await Session.create({
            user: devUser._id,
            refreshTokenHash: crypto.createHash('sha256').update('dev-seed-refresh-token').digest('hex'),
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            deviceName: 'Windows PC',
            ipAddress: '127.0.0.1',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        console.log('✅ Created initial session');

        console.log('🎊 Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
};

seedData();
