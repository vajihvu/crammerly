import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

async function testApi() {
    try {
        console.log("Registering test user...");
        const email = `test${Date.now()}@example.com`;
        const res = await axios.post('http://localhost:5000/api/v1/auth/register', {
            name: 'Test Setup User',
            email: email,
            password: 'Password123!'
        });

        const token = res.data.data.token;
        console.log("Token:", token.substring(0, 15) + "...");

        console.log("Creating room...");
        const roomRes = await axios.post('http://localhost:5000/api/v1/rooms', {
            name: "Test Room Setup",
            task: "Testing save",
            topic: "Code",
            privacy: "Public"
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Room Created:", roomRes.data);

        console.log("Fetching all rooms...");
        const allRooms = await axios.get('http://localhost:5000/api/v1/rooms', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("All Rooms count:", allRooms.data.data.length);
        console.log("First room:", allRooms.data.data[0]);

    } catch (err) {
        console.error("API Error:", err.response ? err.response.data : err.message);
    }
}
testApi();
