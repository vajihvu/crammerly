import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';

/**
 * @desc    Search for users or get recommendations
 * @route   GET /api/v1/friends/search
 * @access  Private
 */
export const searchFriends = asyncHandler(async (req, res) => {
    const { q } = req.query;

    // 1. Standard Query Search (Find by Username or Name)
    if (q) {
        const queryRegex = new RegExp(q, 'i');
        const users = await User.find({
            _id: { $ne: req.user._id },
            $or: [
                { username: queryRegex },
                { name: queryRegex }
            ]
        }).select('name username avatar_url skills interests isOnline role');

        return res.sendSuccess(users);
    }

    // 2. No Query -> "Suggested For You" Recommendation Algorithm
    // Fetch the active user's skills and interests
    const currentUser = await User.findById(req.user._id).select('skills interests');
    const mySkills = new Set((currentUser.skills || []).map(s => s.toLowerCase()));
    const myInterests = new Set((currentUser.interests || []).map(i => i.toLowerCase()));

    // If the user has zero skills or interests, fail gracefully and return a random sampling or empty
    if (mySkills.size === 0 && myInterests.size === 0) {
        // Fallback: Just return 6 recent users to avoid empty screens if they skipped onboarding
        const fallbackUsers = await User.find({ _id: { $ne: req.user._id } })
            .sort({ createdAt: -1 })
            .limit(6)
            .select('name username avatar_url skills interests');
        return res.sendSuccess(fallbackUsers);
    }

    // Grab everyone else
    const allUsers = await User.find({ _id: { $ne: req.user._id } })
        .select('name username avatar_url skills interests');

    // Score them
    const scoredUsers = allUsers.map(u => {
        let score = 0;
        
        // Match skills
        (u.skills || []).forEach(skill => {
            if (mySkills.has(skill.toLowerCase())) score += 1.5; // Slight heavier weight on skills
        });

        // Match interests
        (u.interests || []).forEach(interest => {
            if (myInterests.has(interest.toLowerCase())) score += 1.0;
        });

        return { user: u, score };
    });

    // Filter out 0 scores, then sort descending, then grab top 10
    const suggestions = scoredUsers
        .filter(entry => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(entry => entry.user);

    // Provide some randomness if the suggestions list is too short
    if (suggestions.length < 6) {
        const needed = 6 - suggestions.length;
        const suggestionIds = suggestions.map(s => s._id.toString());
        const backfills = allUsers
            .filter(u => !suggestionIds.includes(u._id.toString()))
            .sort(() => 0.5 - Math.random())
            .slice(0, needed);
        
        suggestions.push(...backfills);
    }

    return res.sendSuccess(suggestions);
});

// Stubs for future actual friend connections (To be implemented when db friend structure is built)
export const sendFriendRequest = asyncHandler(async (req, res) => {
    return res.sendSuccess({ success: true });
});
export const acceptFriendRequest = asyncHandler(async (req, res) => {
    return res.sendSuccess({ success: true });
});
export const removeFriend = asyncHandler(async (req, res) => {
    return res.sendSuccess({ success: true });
});
export const getFriendsList = asyncHandler(async (req, res) => {
    return res.sendSuccess([]);
});

