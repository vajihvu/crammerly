import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

// We'll mimic auth by grabbing an existing user and generating a token
async function test() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crammerly_dev');

    // find a user
    const db = mongoose.connection.db;
    const user = await db.collection('users').findOne({});
    if (!user) {
        console.log("No user found.");
        process.exit(1);
    }

    // Create session
    const sessionId = new mongoose.Types.ObjectId();
    await db.collection('sessions').insertOne({
        _id: sessionId,
        user: user._id,
        userAgent: "Test script",
        ipAddress: "127.0.0.1",
        refreshTokenHash: "test_" + Date.now() + Math.random(),
        isValid: true,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
    });

    // Generate token
    const token = jwt.sign(
        { id: user._id.toString(), sessionId: sessionId.toString(), tokenVersion: user.tokenVersion || 0 },
        process.env.JWT_SECRET || 'test_secret_placeholder_at_least_64_characters_long_for_validation_safety_'
    );

    console.log("Got token for user", user.email);

    try {
        const roomRes = await axios.post('http://localhost:5000/api/v1/rooms', {
            name: "Direct API Test",
            task: "Testing room post",
            topic: "Science",
            privacy: "Public"
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'X-CSRF-Token': 'XMLHttpRequest'
            }
        });
        console.log("Success POST!", roomRes.data);
    } catch (e) {
        console.error("POST failed:", e.response ? e.response.status + ' ' + JSON.stringify(e.response.data) : e.message);
    }

    process.exit(0);
}
test();
