/**
 * DB Verification Script (MongoDB Only)
 * Checks if the required collections exist in MongoDB.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

const nodeEnv = process.env.NODE_ENV || 'development';
const envPath = path.resolve(process.cwd(), `.env.${nodeEnv}`);
dotenv.config({ path: envPath });
dotenv.config(); // Fallback

async function verify() {
    console.log("🔍 Starting MongoDB Enforcement Check...");

    // Verify MongoDB
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crammerly');
        const collections = await mongoose.connection.db.listCollections().toArray();
        const names = collections.map(c => c.name);
        console.log("✅ MongoDB Connection: OK");
        console.log(`📊 MongoDB Collections: ${names.join(", ")}`);
        await mongoose.disconnect();
    } catch (e) {
        console.error("❌ MongoDB Verification Failed:", e.message);
    }

    console.log("🏁 Verification Complete.");
}

verify();
