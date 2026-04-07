import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';
import Notification from '../models/Notification.js';
import Room from '../models/Room.js';
import { emitToUser } from '../utils/socket.js';

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

/**
 * @desc    Send a friend request
 * @route   POST /api/v1/friends/request
 * @access  Private
 */
export const sendFriendRequest = asyncHandler(async (req, res) => {
    const { toUserId } = req.body;
    const fromUserId = req.user._id;

    if (toUserId === fromUserId.toString()) {
        return res.sendError('You cannot send a friend request to yourself', 400, 'VAL_SELF_FRIEND');
    }

    const recipient = await User.findById(toUserId);
    if (!recipient) {
        return res.sendError('User not found', 404, 'RES_NOT_FOUND');
    }

    // Check if already friends
    const sender = await User.findById(fromUserId);
    if (sender.friends.includes(toUserId)) {
        return res.sendError('You are already friends', 400, 'VAL_ALREADY_FRIENDS');
    }

    // Check if already pending
    const existingRequest = await FriendRequest.findOne({
        from: fromUserId,
        to: toUserId,
        status: 'pending'
    });

    if (existingRequest) {
        return res.sendError('Friend request already sent', 400, 'VAL_REQUEST_PENDING');
    }

    const request = await FriendRequest.create({
        from: fromUserId,
        to: toUserId
    });

    // Create Notification
    const notification = await Notification.create({
        recipient: toUserId,
        sender: fromUserId,
        type: 'FRIEND_REQUEST',
        content: `${sender.name} sent you a friend request`,
        relatedId: request._id
    });

    // Emit Socket Event
    emitToUser(toUserId, 'new_notification', {
        id: notification._id,
        type: 'FRIEND_REQUEST',
        sender: {
            id: sender._id,
            name: sender.name,
            username: sender.username,
            avatar_url: sender.avatar_url,
            tag: sender.tag
        },
        content: notification.content,
        timestamp: notification.createdAt,
        relatedId: request._id
    });

    return res.sendSuccess({ message: 'Friend request sent successfully', requestId: request._id });
});

/**
 * @desc    Accept a friend request
 * @route   POST /api/v1/friends/accept/:id
 * @access  Private
 */
export const acceptFriendRequest = asyncHandler(async (req, res) => {
    const requestId = req.params.id;
    const userId = req.user._id;

    const request = await FriendRequest.findById(requestId);
    if (!request) {
        return res.sendError('Friend request not found', 404, 'RES_NOT_FOUND');
    }

    if (request.to.toString() !== userId.toString()) {
        return res.sendError('Unauthorized', 403, 'AUTH_FORBIDDEN');
    }

    if (request.status !== 'pending') {
        return res.sendError('Request already handled', 400, 'VAL_ALREADY_HANDLED');
    }

    // Update Request
    request.status = 'accepted';
    await request.save();

    // Add to friends lists
    const userA = await User.findById(request.from);
    const userB = await User.findById(request.to);

    if (!userA.friends.includes(userB._id)) userA.friends.push(userB._id);
    if (!userB.friends.includes(userA._id)) userB.friends.push(userA._id);

    await userA.save();
    await userB.save();

    // Create Notification for the sender
    const notification = await Notification.create({
        recipient: request.from,
        sender: request.to,
        type: 'FRIEND_ACCEPT',
        content: `${userB.name} accepted your friend request`,
        relatedId: request._id
    });

    // Emit Socket Event
    emitToUser(request.from, 'new_notification', {
        id: notification._id,
        type: 'FRIEND_ACCEPT',
        sender: {
            id: userB._id,
            name: userB.name,
            username: userB.username,
            avatar_url: userB.avatar_url,
            tag: userB.tag
        },
        content: notification.content,
        timestamp: notification.createdAt
    });

    // Automatically create a DM Room
    const dmRoom = await Room.create({
        name: `DM: ${userA.name} & ${userB.name}`,
        creator_id: userA._id,
        isDM: true,
        roomType: 'DM',
        privacy: 'Private',
        members: [
            { user: userA._id, isAdmin: true },
            { user: userB._id, isAdmin: true }
        ]
    });

    return res.sendSuccess({ message: 'Friend request accepted', dmRoomId: dmRoom._id });
});

/**
 * @desc    Decline a friend request
 * @route   POST /api/v1/friends/decline/:id
 * @access  Private
 */
export const declineFriendRequest = asyncHandler(async (req, res) => {
    const requestId = req.params.id;
    const userId = req.user._id;

    const request = await FriendRequest.findById(requestId);
    if (!request) {
        return res.sendError('Friend request not found', 404, 'RES_NOT_FOUND');
    }

    if (request.to.toString() !== userId.toString()) {
        return res.sendError('Unauthorized', 403, 'AUTH_FORBIDDEN');
    }

    request.status = 'declined';
    await request.save();

    return res.sendSuccess({ message: 'Friend request declined' });
});

/**
 * @desc    Remove a friend
 * @route   DELETE /api/v1/friends/:id
 * @access  Private
 */
export const removeFriend = asyncHandler(async (req, res) => {
    const friendId = req.params.id;
    const userId = req.user._id;

    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (user) {
        user.friends = user.friends.filter(f => f.toString() !== friendId);
        await user.save();
    }

    if (friend) {
        friend.friends = friend.friends.filter(f => f.toString() !== userId.toString());
        await friend.save();
    }

    return res.sendSuccess({ message: 'Friend removed successfully' });
});

/**
 * @desc    Get current friends list
 * @route   GET /api/v1/friends
 * @access  Private
 */
export const getFriendsList = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate('friends', 'name username avatar_url isOnline tag');
    
    // For each friend, find the DM room
    const friendsWithRooms = await Promise.all((user.friends || []).map(async (friend) => {
        const dmRoom = await Room.findOne({
            roomType: 'DM',
            'members.user': { $all: [req.user._id, friend._id] }
        });
        
        return {
            ...friend.toObject(),
            dmRoomId: dmRoom ? dmRoom._id : null
        };
    }));

    return res.sendSuccess(friendsWithRooms);
});

