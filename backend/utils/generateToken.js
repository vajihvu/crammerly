import jwt from 'jsonwebtoken';

/**
 * Generate a JWT token for a user
 * @param {string} id - The user ID to encode
 * @returns {string} - The signed JWT
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d', // Token expires in 7 days
    });
};

export default generateToken;
