import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: [true, 'Resource title is required'],
        trim: true,
        maxlength: [200, 'Resource title cannot exceed 200 characters']
    },
    type: {
        type: String,
        enum: ['link', 'pdf', 'document', 'image', 'video', 'other'],
        default: 'link'
    },
    url: {
        type: String,
        required: [true, 'Resource URL is required'],
        trim: true,
        maxlength: [2000, 'URL cannot exceed 2000 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters'],
        default: ''
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: 30
    }],
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Indexes for queries and search
resourceSchema.index({ roomId: 1, createdAt: -1 });
resourceSchema.index({ roomId: 1, tags: 1 });

const Resource = mongoose.model('Resource', resourceSchema);
export default Resource;
