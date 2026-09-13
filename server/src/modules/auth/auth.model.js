import mongoose from 'mongoose';

const RefreshTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// MongoDB TTL index — auto-deletes expired tokens, no cron needed
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
RefreshTokenSchema.index({ userId: 1 });

export const RefreshTokenModel = mongoose.model('RefreshToken', RefreshTokenSchema);
