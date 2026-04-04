import mongoose from 'mongoose';

const bugReportSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['Look/Design', 'Broken', 'Sound/Video'],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        maxlength: 2000
    },
    image: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Resolved', 'Closed'],
        default: 'Pending'
    }
}, {
    timestamps: true
});

const BugReport = mongoose.model('BugReport', bugReportSchema);

export default BugReport;
