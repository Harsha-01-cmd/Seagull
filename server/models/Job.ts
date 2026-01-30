import mongoose, { Document, Schema } from 'mongoose';

export interface IJob extends Document {
    title: string;
    company: string;
    location?: string;
    description?: string;
    applyLink: string;
    source?: string;
    postedDate?: Date;
    scrapedAt: Date;
    tags?: string[];
}

const JobSchema: Schema = new Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String },
    description: { type: String },
    applyLink: { type: String, required: true },
    source: { type: String }, // e.g., 'Google', 'LinkedIn', 'Scraper'
    postedDate: { type: Date },
    scrapedAt: { type: Date, default: Date.now },
    tags: [{ type: String }],
});

export default mongoose.model<IJob>('Job', JobSchema);
