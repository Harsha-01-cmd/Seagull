'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Job {
    _id: string;
    title: string;
    company: string;
    location: string;
    applyLink: string;
    tags: string[];
    source: string;
}

export default function JobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [trackingIds, setTrackingIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadJobs();
    }, []);

    const loadJobs = () => {
        setLoading(true);
        api.get('/api/jobs')
            .then(res => {
                setJobs(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    const handleApplyAndTrack = async (job: Job) => {
        // 1. Open Link immediately (UX)
        window.open(job.applyLink, '_blank');

        // 2. Track in Dashboard
        try {
            await api.post('/api/applications', {
                company: job.company,
                role: job.title,
                jobId: job._id,
                status: 'Applied'
            });
            setTrackingIds(prev => new Set(prev).add(job._id));
            alert(`Success: "${job.title}" added to your Dashboard!`);
        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.status === 401) {
                alert("Please Login with GitHub (top right) to track applications!");
                // Optionally redirect
                // window.location.href = "http://localhost:5000/auth/github";
            } else {
                alert('Failed to track application. Check console for details.');
            }
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold leading-tight text-gray-900">Latest Engineering Jobs</h1>
                    <button onClick={loadJobs} className="text-sm text-primary hover:underline">Refresh Feed</button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {jobs.map((job) => (
                            <div key={job._id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h2 className="text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors">{job.title}</h2>
                                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">{job.source}</span>
                                        </div>
                                        <p className="text-gray-600 font-medium mb-2">{job.company} &bull; {job.location}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {job.tags && job.tags.map(tag => (
                                                <span key={tag} className="inline-flex items-center rounded-full bg-pink-50 px-2 py-1 text-xs font-medium text-pink-700 ring-1 ring-inset ring-pink-700/10">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <button
                                            onClick={() => handleApplyAndTrack(job)}
                                            disabled={trackingIds.has(job._id)}
                                            className={`inline-flex items-center justify-center rounded-md px-6 py-2.5 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all ${trackingIds.has(job._id)
                                                ? 'bg-green-100 text-green-700 cursor-default'
                                                : 'bg-primary text-white hover:bg-blue-600'
                                                }`}
                                        >
                                            {trackingIds.has(job._id) ? 'Applied ✓' : 'Apply & Track'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {jobs.length === 0 && (
                            <div className="text-center py-20 text-gray-500">
                                No jobs found. check back later.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
