import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
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
  },
  {
    timestamps: true,
    // Exclude passwordHash from any JSON serialization
    toJSON: {
      transform: (_doc, ret) => {
        const { passwordHash: _pw, ...safeRet } = ret as typeof ret & { passwordHash?: string };
        void _pw;
        return safeRet;
      },
    },
  }
);

// Index on email is implied by unique: true above but explicit for clarity
UserSchema.index({ email: 1 }, { unique: true });

export const UserModel = mongoose.model<IUser>('User', UserSchema);
