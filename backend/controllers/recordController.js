import Record from '../models/Record.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Get all user records
 * @route   GET /api/v1/records
 * @access  Private
 */
export const getRecords = asyncHandler(async (req, res) => {
    const studyRecords = await Record.find({ userId: req.user._id });
    return res.sendSuccess(studyRecords);
});

/**
 * @desc    Create new record
 * @route   POST /api/v1/records
 * @access  Private
 */
export const createRecord = asyncHandler(async (req, res) => {
    const { title, content, status, tags } = req.body;
    const studyRecord = await Record.create({
        userId: req.user._id,
        title,
        content,
        status: status || 'draft',
        tags: Array.isArray(tags) ? tags : []
    });
    return res.sendSuccess(studyRecord, 201);
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
        return res.sendError('Record not found', 404, 'RES_NOT_FOUND');
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
        return res.sendError('Record not found', 404, 'RES_NOT_FOUND');
    }
});

/**
 * @desc    Delete record
 * @route   DELETE /api/v1/records/:id
 * @access  Private
 */
export const deleteRecord = asyncHandler(async (req, res) => {
    const studyRecord = await Record.findOne({ _id: req.params.id, userId: req.user._id });
    if (!studyRecord) {
        return res.sendError('Record not found', 404, 'RES_NOT_FOUND');
    }
    await studyRecord.deleteOne();
    return res.sendSuccess({ message: 'Record removed successfully' });
});
