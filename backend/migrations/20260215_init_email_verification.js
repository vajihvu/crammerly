/**
 * Migration: Initialize Email Verification Status
 * Sets isEmailVerified to true for all existing users who don't have it set.
 */
export const up = async (db) => {
    const usersCollection = db.collection('users');

    const result = await usersCollection.updateMany(
        { isEmailVerified: { $exists: false } },
        { $set: { isEmailVerified: true } }
    );

    console.log(`Updated ${result.modifiedCount} users with default verification status.`);
};

export const down = async (_db) => {
    // Optional: How to undo this migration
};
