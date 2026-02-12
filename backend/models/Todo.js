import mongoose from 'mongoose';

const todoSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    text: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Compound index for optimized lookup and retrieval by date
todoSchema.index({ user_id: 1, createdAt: -1 });

const Todo = mongoose.model('Todo', todoSchema);
export default Todo;
