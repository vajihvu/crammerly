import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 10,

        validate: {
            validator: function (v) {
                // Minimum requirements: 1 upper, 1 lower, 1 number, 1 special
                // This is a basic regex check; controllers use zxcvbn for deeper entropy analysis
                return /[A-Z]/.test(v) && /[a-z]/.test(v) && /[0-9]/.test(v) && /[^A-Za-z0-9]/.test(v);
            },
            message: 'Password must be at least 10 characters and contain an uppercase letter, lowercase letter, number, and special character. It must also have high entropy (not be a common pattern).'
        },
        select: false // Don't return password by default
    },
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true,
        index: true
    },
    username: {
        type: String,
        trim: true,
        unique: true,
        sparse: true,
        minlength: 3,
        maxlength: 30
    },
    institution: { type: String, trim: true },
    course: { type: String, trim: true },
    skills: { type: [String], default: [] },
    interests: { type: [String], default: [] },
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
    totalLockouts: {
        type: Number,
        default: 0
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
    twoFactorSecret: {
        type: String,
        select: false
    },
    isTwoFactorEnabled: {
        type: Boolean,
        default: false
    },
    avatar: {
        type: String,
        default: ''
    },
    tag: {
        type: String,
        unique: true,
        index: true
    },
    interests: {
        type: [String],
        default: []
    },
    tokenVersion: {
        type: Number,
        default: 0,
        select: false
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
        index: true
    },
    emailVerificationToken: {
        type: String,
        select: false,
        index: true
    },
    emailVerificationExpires: {
        type: Date,
        select: false
    },
    resetPasswordToken: {
        type: String,
        select: false,
        index: true
    },
    resetPasswordExpires: {
        type: Date,
        select: false
    },
    pendingEmail: {
        type: String,
        select: false
    },
    pendingEmailToken: {
        type: String,
        select: false,
        index: true
    },
    pendingEmailExpires: {
        type: Date,
        select: false
    },
    settings: {
        language: { type: String, default: 'ENGLISH (US)' },
        privacy: {
            allowInvites: { type: Boolean, default: true },
            showOnlineStatus: { type: Boolean, default: true },
            allowDMs: { type: Boolean, default: false }
        }
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
        updates.$inc.totalLockouts = 1;
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

    // Generate unique tag if it doesn't exist
    if (!this.tag) {
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 5;

        while (!isUnique && attempts < maxAttempts) {
            const newTag = Math.floor(100000 + Math.random() * 900000).toString();
            const existing = await this.constructor.findOne({ tag: newTag });
            if (!existing) {
                this.tag = newTag;
                isUnique = true;
            }
            attempts++;
        }

        if (!isUnique) {
            throw new Error('Could not generate a unique user tag after multiple attempts');
        }
    }

    // 2. Password Hashing & History Safeguard
    if (this.isModified('password')) {
        // If not a new user, we need the OLD hash to move it to history
        if (!this.isNew) {
            // We fetch the latest stored document to get the current hash before updating
            const oldUser = await this.constructor.findById(this._id).select('+password');
            if (oldUser && oldUser.password) {
                if (!this.previousPasswords) this.previousPasswords = [];
                this.previousPasswords.unshift(oldUser.password);
                if (this.previousPasswords.length > 5) {
                    this.previousPasswords.pop();
                }
                // Increment tokenVersion to revoke all existing JWTs on password change
                this.tokenVersion = (this.tokenVersion || 0) + 1;
            }
        }

        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
    }
});



// Method to verify if password was previously used
userSchema.methods.isPasswordPreviouslyUsed = async function (plainPassword) {
    // Check current password
    const isCurrentMatch = await bcrypt.compare(plainPassword, this.password);
    if (isCurrentMatch) return true;

    // Check history (limit 5)
    const history = this.previousPasswords || [];
    for (const oldHash of history) {
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
