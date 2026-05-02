import mongoose from 'mongoose';

const taskCardSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true,
        maxlength: [200, 'Task title cannot exceed 200 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [2000, 'Task description cannot exceed 2000 characters'],
        default: ''
    },
    status: {
        type: String,
        enum: ['todo', 'in_progress', 'done'],
        default: 'todo'
    },
    role: {
        type: String,
        trim: true,
        maxlength: [50, 'Role name cannot exceed 50 characters'],
        default: ''
    },
    assignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    dueDate: {
        type: Date,
        default: null
    },
    order: {
        type: Number,
        default: 0
    },
    reminderSent: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Compound indexes for performant queries
taskCardSchema.index({ roomId: 1, status: 1, order: 1 });
taskCardSchema.index({ roomId: 1, assignee: 1 });
taskCardSchema.index({ dueDate: 1, reminderSent: 1 }); // For deadline worker

const TaskCard = mongoose.model('TaskCard', taskCardSchema);
export default TaskCard;
