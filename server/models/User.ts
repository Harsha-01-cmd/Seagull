import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  githubId: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  resumeText?: string;
  resumeScore?: number;
  skills?: string[];
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  githubId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  email: { type: String },
  avatarUrl: { type: String },
  resumeText: { type: String },
  resumeScore: { type: Number },
  skills: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>('User', UserSchema);
