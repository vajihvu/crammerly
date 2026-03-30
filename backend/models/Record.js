import mongoose from 'mongoose';

const recordSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Record must belong to a user'],
        index: true // Efficient lookup for a user's records
    },
    title: {
        type: String,
        required: [true, 'Please provide a title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    content: {
        type: String,
        required: [true, 'Please provide content'],
        maxlength: [50000, 'Content cannot exceed 50,000 characters']
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    tags: {
        type: [String],
        default: []
    }
}, {
    timestamps: true
});

// Compound index for optimized sorting by newest
recordSchema.index({ userId: 1, createdAt: -1 });

// Scalability: Combined index for filtered views 
recordSchema.index({ userId: 1, status: 1, createdAt: -1 });

// Scalability: Multikey index for tag searches
recordSchema.index({ tags: 1 });

const Record = mongoose.model('Record', recordSchema);
export default Record;
