import Record from '../models/Record.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Get all user records with cursor-based pagination
 * @route   GET /api/v1/records
 * @access  Private
 */
export const getRecords = asyncHandler(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const query = { userId: req.user._id };
    const { tags, cursor } = req.query;

    if (tags) {
        query.tags = { $in: tags.split(',') };
    }

    if (cursor) {
        const cursorDate = new Date(cursor);
        if (isNaN(cursorDate.getTime())) {
            return res.sendError('Invalid cursor value', 400, 'VAL_INVALID_CURSOR');
        }
        query.createdAt = { $lt: cursorDate };
    }

    const records = await Record.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

    const hasMore = records.length === limit;
    const nextCursor = hasMore ? records[records.length - 1].createdAt : null;

    return res.sendSuccess({
        records,
        nextCursor,
        hasMore
    }, 200, records.length === 0 && !cursor ? "Your study feed is empty. Start a focus session or create a manual record to begin!" : undefined);
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

    return res.sendSuccess(record, 201);
});


/**
 * @desc    Get single record
 * @route   GET /api/v1/records/:id
 * @access  Private
 */
export const getRecordById = asyncHandler(async (req, res, _next) => {
    const record = await Record.findOne({ _id: req.params.id, userId: req.user._id });

    if (record) {
        return res.sendSuccess(record);
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
        record.title = req.body.title !== undefined ? req.body.title : record.title;
        record.content = req.body.content !== undefined ? req.body.content : record.content;
        record.status = req.body.status !== undefined ? req.body.status : record.status;
        record.tags = req.body.tags !== undefined
            ? (Array.isArray(req.body.tags)
                ? req.body.tags.map(t => t.trim()).filter(t => t !== '' && t.length <= 50)
                : record.tags)
            : record.tags;

        const updatedRecord = await record.save();
        return res.sendSuccess(updatedRecord);
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
        return res.sendSuccess({ message: 'Record removed' });
    } else {

        const error = new Error('Record not found');
        error.statusCode = 404;
        error.code = 'RES_NOT_FOUND';
        throw error;
    }
});
