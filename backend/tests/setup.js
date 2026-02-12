import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

process.env.JWT_SECRET = 'test_secret_for_integration_testing_123';
process.env.CLIENT_URL = 'http://localhost:3000';

let mongo = null;

beforeAll(async () => {
    console.log("Starting MongoMemoryServer...");
    try {
        mongo = await MongoMemoryServer.create({
            binary: {
                version: '4.4.18',
            }
        });
        const uri = mongo.getUri();
        console.log("MongoMemoryServer started at:", uri);
        process.env.MONGO_URI = uri;
        await mongoose.connect(uri);
        console.log("Mongoose connected.");
    } catch (err) {
        console.error("Failed to start MongoMemoryServer:", err);
        throw err;
    }
}, 60000);

beforeEach(async () => {
    if (mongoose.connection.readyState === 1) {
        const collections = await mongoose.connection.db.collections();
        for (let collection of collections) {
            await collection.deleteMany({});
        }
    }
});

afterAll(async () => {
    if (mongo) {
        await mongoose.connection.close();
        await mongo.stop();
        console.log("MongoMemoryServer stopped.");
    }
}, 60000);
