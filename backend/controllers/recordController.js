import Record from '../models/Record.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Get all user records with cursor-based pagination
 * @route   GET /api/v1/records
 * @access  Private
 */
export const getRecords = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const query = { userId: req.user._id };
    const { tags, cursor } = req.query;

    if (tags) {
        query.tags = { $in: tags.split(',') };
    }

    if (cursor) {
        query.createdAt = { $lt: new Date(cursor) };
    }

    const records = await Record.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

    const hasMore = records.length === limit;
    const nextCursor = hasMore ? records[records.length - 1].createdAt : null;

    res.json({
        success: true,
        data: {
            records,
            nextCursor,
            hasMore
        },
        message: records.length === 0 && !cursor ? "Your study feed is empty. Start a focus session or create a manual record to begin!" : undefined
    });
});

/**
 * @desc    Create new record
 * @route   POST /api/v1/records
 * @access  Private
 */
export const createRecord = asyncHandler(async (req, res) => {
    const { title, content, status, tags } = req.body;

    const cleanTags = Array.isArray(tags)
        ? tags.map(t => t.trim()).filter(t => t !== '')
        : [];

    const record = await Record.create({
        userId: req.user._id,
        title,
        content,
        status: status || 'draft',
        tags: cleanTags,
    });

    res.status(201).json({
        success: true,
        data: record
    });
});

/**
 * @desc    Get single record
 * @route   GET /api/v1/records/:id
 * @access  Private
 */
export const getRecordById = asyncHandler(async (req, res, _next) => {
    const record = await Record.findOne({ _id: req.params.id, userId: req.user._id });

    if (record) {
        res.json({
            success: true,
            data: record
        });
    } else {
        const error = new Error('Record not found');
        error.statusCode = 404;
        error.code = 'RES_NOT_FOUND';
        throw error;
    }
});

/**
 * @desc    Update record
 * @route   PUT /api/v1/records/:id
 * @access  Private
 */
export const updateRecord = asyncHandler(async (req, res) => {
    const record = await Record.findOne({ _id: req.params.id, userId: req.user._id });

    if (record) {
        record.title = req.body.title || record.title;
        record.content = req.body.content || record.content;
        record.status = req.body.status || record.status;
        record.tags = req.body.tags || record.tags;

        const updatedRecord = await record.save();
        res.json({
            success: true,
            data: updatedRecord
        });
    } else {
        const error = new Error('Record not found');
        error.statusCode = 404;
        error.code = 'RES_NOT_FOUND';
        throw error;
    }
});

/**
 * @desc    Delete record
 * @route   DELETE /api/v1/records/:id
 * @access  Private
 */
export const deleteRecord = asyncHandler(async (req, res) => {
    const record = await Record.findOne({ _id: req.params.id, userId: req.user._id });

    if (record) {
        await record.deleteOne();
        res.json({
            success: true,
            message: 'Record removed'
        });
    } else {
        const error = new Error('Record not found');
        error.statusCode = 404;
        error.code = 'RES_NOT_FOUND';
        throw error;
    }
});
