import dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

import mongoose from 'mongoose';
import User from '../models/User.js';
import Session from '../models/Session.js';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import config from '../config/index.js';

const seedData = async () => {
    console.log('🌱 Starting database seeding...');

    try {
        await mongoose.connect(config.mongoUri);
        console.log('Connected to MongoDB');

        // Clean existing data
        await User.deleteMany({});
        await Session.deleteMany({});
        await Room.deleteMany({});
        await Message.deleteMany({});
        console.log('Cleaned existing Users, Sessions, Rooms, and Messages');

        // Create Dev User
        const devUser = await User.create({
            name: 'Dev Admin',
            email: 'admin@crammerly.io',
            password: 'Password123!', // Note: This will be hashed by pre-save hook
            role: 'admin',
            isOnboarded: true,
            tag: '0001'
        });

        console.log('✅ Created Dev Admin: admin@crammerly.io / Password123!');

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
            refreshTokenHash: 'dummy_hash',
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
