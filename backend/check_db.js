import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkRooms() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crammerly_dev');
        console.log("Connected to DB:", process.env.MONGO_URI || 'mongodb://localhost:27017/crammerly_dev');
        const count = await mongoose.connection.collection('rooms').countDocuments();
        const rooms = await mongoose.connection.collection('rooms').find().toArray();
        console.log("Rooms count:", count);
        console.log("Rooms:", JSON.stringify(rooms, null, 2));
        
        const userCount = await mongoose.connection.collection('users').countDocuments();
        console.log("Users count:", userCount);
    } catch(err) {
        console.error("DB Error:", err);
    } finally {
        mongoose.disconnect();
    }
}
checkRooms();
