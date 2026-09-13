import { Schema, model } from 'mongoose';
const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    timezone: {
        type: String,
        default: 'UTC',
    },
}, {
    timestamps: true,
    // Exclude passwordHash from any JSON serialization
    toJSON: {
        transform: (_doc, ret) => {
            const { passwordHash: _pw, ...safeRet } = ret;
            void _pw;
            return safeRet;
        },
    },
});
// Index on email is implied by unique: true above but explicit for clarity
UserSchema.index({ email: 1 }, { unique: true });
export const UserModel = model('User', UserSchema);