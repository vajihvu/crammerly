import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false // Don't return password by default
    },
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    loginAttempts: {
        type: Number,
        required: true,
        default: 0
    },
    lockUntil: {
        type: Date
    },
    requiresCaptcha: {
        type: Boolean,
        default: false
    },
    previousPasswords: {
        type: [String],
        default: [],
        select: false
    },
    isOnboarded: {
        type: Boolean,
        default: false
    },
    avatar: {
        type: String,
        default: ''
    },
    tag: {
        type: String,
        default: () => Math.floor(1000 + Math.random() * 9000).toString()
    },
    interests: {
        type: [String],
        default: []
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual to check if account is locked
userSchema.virtual('isLocked').get(function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Method to handle failed login attempts
userSchema.methods.incLoginAttempts = async function () {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }

    // Otherwise increment
    const updates = { $inc: { loginAttempts: 1 } };

    // Lock for 30 minutes after 5 attempts
    if (this.loginAttempts + 1 >= 5) {
        updates.$set = {
            lockUntil: Date.now() + 30 * 60 * 1000,
            requiresCaptcha: true
        };
    }

    return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function () {
    return this.updateOne({
        $set: { loginAttempts: 0, requiresCaptcha: false },
        $unset: { lockUntil: 1 }
    });
};

// Normalization and Password Hashing
userSchema.pre('save', async function () {
    // 1. Canonicalization (Unicode Normalization)
    if (this.email) {
        this.email = this.email.normalize('NFKC').toLowerCase().trim();
    }
    if (this.name) {
        this.name = this.name.normalize('NFKC').trim();
    }

    // 2. Password Hashing & History
    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(12); // Increased cost for production

    // If this is an update (not a new user), we might want to move current password to history
    // but wait, usually we check reuse BEFORE calling save() in the controller 
    // to give a better error message.
    // However, as a safeguard, we'll store the hash.

    this.password = await bcrypt.hash(this.password, salt);
});

// Method to verify if password was previously used
userSchema.methods.isPasswordPreviouslyUsed = async function (plainPassword) {
    // Check current password
    const isCurrentMatch = await bcrypt.compare(plainPassword, this.password);
    if (isCurrentMatch) return true;

    // Check history (limit 5)
    for (const oldHash of this.previousPasswords) {
        if (await bcrypt.compare(plainPassword, oldHash)) {
            return true;
        }
    }
    return false;
};

// Method to check password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
