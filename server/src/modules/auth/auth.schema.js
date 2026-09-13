import { Schema, model } from 'mongoose';
const RefreshTokenSchema = new Schema({
    token: {
        type: String,
        required: true,
        unique: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
}, { timestamps: true });
// TTL index: MongoDB will automatically delete documents when expiresAt is reached
// expireAfterSeconds: 0 means "expire at the exact expiresAt date"
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
RefreshTokenSchema.index({ token: 1 }, { unique: true });
RefreshTokenSchema.index({ userId: 1 });
export const RefreshTokenModel = model('RefreshToken', RefreshTokenSchema);