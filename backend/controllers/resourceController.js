import Resource from '../models/Resource.js';
import Room from '../models/Room.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Get all resources for a room
 * @route   GET /api/v1/rooms/:id/resources
 */
export const getResources = asyncHandler(async (req, res) => {
    const roomId = req.params.id;
    const { tag, search } = req.query;

    const room = await Room.findById(roomId);
    if (!room) return res.sendError('Room not found', 404, 'RES_NOT_FOUND');

    const isMember = room.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.sendError('Not a member of this room', 403, 'AUTH_FORBIDDEN');

    const query = { roomId };
    if (tag) query.tags = tag;
    if (search) {
        query.$or = [
            { title: new RegExp(search, 'i') },
            { description: new RegExp(search, 'i') }
        ];
    }

    const resources = await Resource.find(query)
        .populate('addedBy', 'name avatar')
        .sort({ createdAt: -1 });

    // Collect unique tags for filter UI
    const allTags = await Resource.distinct('tags', { roomId });

    return res.sendSuccess({ resources, tags: allTags });
});

/**
 * @desc    Add a resource
 * @route   POST /api/v1/rooms/:id/resources
 */
export const createResource = asyncHandler(async (req, res) => {
    const roomId = req.params.id;
    const { title, url, type, description, tags } = req.body;

    const room = await Room.findById(roomId);
    if (!room) return res.sendError('Room not found', 404, 'RES_NOT_FOUND');

    const isMember = room.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.sendError('Not a member of this room', 403, 'AUTH_FORBIDDEN');

    const resource = await Resource.create({
        roomId,
        title,
        url,
        type: type || 'link',
        description: description || '',
        tags: tags || [],
        addedBy: req.user._id
    });

    const populated = await Resource.findById(resource._id)
        .populate('addedBy', 'name avatar');

    import('../utils/socket.js').then(({ emitToRoom }) => {
        emitToRoom(roomId, 'resource_added', populated);
    });

    return res.sendSuccess(populated, 201);
});

/**
 * @desc    Update a resource
 * @route   PUT /api/v1/rooms/:id/resources/:resourceId
 */
export const updateResource = asyncHandler(async (req, res) => {
    const { id: roomId, resourceId } = req.params;
    const updates = req.body;

    const resource = await Resource.findOne({ _id: resourceId, roomId });
    if (!resource) return res.sendError('Resource not found', 404, 'RES_NOT_FOUND');

    // Only the adder, room owner, or admin can update
    const room = await Room.findById(roomId);
    const isOwner = room.creatorId.toString() === req.user._id.toString();
    const isAdder = resource.addedBy.toString() === req.user._id.toString();
    const member = room.members.find(m => m.user.toString() === req.user._id.toString());

    if (!isOwner && !isAdder && !member?.isAdmin) {
        return res.sendError('Not authorized to update this resource', 403, 'AUTH_FORBIDDEN');
    }

    if (updates.title !== undefined) resource.title = updates.title;
    if (updates.url !== undefined) resource.url = updates.url;
    if (updates.type !== undefined) resource.type = updates.type;
    if (updates.description !== undefined) resource.description = updates.description;
    if (updates.tags !== undefined) resource.tags = updates.tags;

    await resource.save();

    const populated = await Resource.findById(resource._id)
        .populate('addedBy', 'name avatar');

    return res.sendSuccess(populated);
});

/**
 * @desc    Delete a resource
 * @route   DELETE /api/v1/rooms/:id/resources/:resourceId
 */
export const deleteResource = asyncHandler(async (req, res) => {
    const { id: roomId, resourceId } = req.params;

    const resource = await Resource.findOne({ _id: resourceId, roomId });
    if (!resource) return res.sendError('Resource not found', 404, 'RES_NOT_FOUND');

    const room = await Room.findById(roomId);
    const isOwner = room.creatorId.toString() === req.user._id.toString();
    const isAdder = resource.addedBy.toString() === req.user._id.toString();
    const member = room.members.find(m => m.user.toString() === req.user._id.toString());

    if (!isOwner && !isAdder && !member?.isAdmin) {
        return res.sendError('Not authorized to delete this resource', 403, 'AUTH_FORBIDDEN');
    }

    await resource.deleteOne();

    import('../utils/socket.js').then(({ emitToRoom }) => {
        emitToRoom(roomId, 'resource_deleted', { resourceId });
    });

    return res.sendSuccess(null, 200, 'Resource deleted');
});
