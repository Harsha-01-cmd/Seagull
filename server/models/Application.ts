import mongoose, { Document, Schema } from 'mongoose';

export interface IApplication extends Document {
    userId: string;
    company: string;
    role: string;
    jobId?: string;
    status: string;
    appliedDate: Date;
}

const ApplicationSchema: Schema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: String, required: true },
    role: { type: String, required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    status: { type: String, enum: ['Applied', 'Interview', 'Offer', 'Rejected'], default: 'Applied' },
    appliedDate: { type: Date, default: Date.now }
});

export default mongoose.model<IApplication>('Application', ApplicationSchema);
