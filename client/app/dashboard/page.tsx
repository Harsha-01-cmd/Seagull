'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import axios from 'axios';
import Link from 'next/link';

interface Application {
    _id: string;
    company: string;
    role: string;
    status: string;
    appliedDate: string;
}

export default function Dashboard() {
    const [user, setUser] = useState<any>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadingResume, setUploadingResume] = useState(false);

    const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        setUploadingResume(true);
        const file = e.target.files[0];

        const formData = new FormData();
        formData.append('resume', file);

        try {
            // 1. Parse text via Worker
            const parseRes = await axios.post(`${process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8000'}/parse-resume`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const text = parseRes.data.text;

            // 2. Save text to Profile
            await api.post('/api/user/resume', { resumeText: text });

            alert('Resume saved to profile! You can now use it in ATS Scanner.');

            // Refresh User
            const userRes = await api.get('/api/user/profile');
            setUser(userRes.data);

        } catch (err) {
            console.error(err);
            alert('Failed to process resume.');
        } finally {
            setUploadingResume(false);
        }
    };

    useEffect(() => {
        // Fetch User and Applications
        const fetchData = async () => {
            try {
                const userRes = await api.get('/auth/user');
                setUser(userRes.data);

                if (userRes.data) {
                    const appsRes = await api.get('/api/applications');
                    setApplications(appsRes.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-10 text-center">Loading Dashboard...</div>;
    if (!user) return <div className="p-10 text-center">Please <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/auth/github`} className="text-primary underline">Login</a> to view dashboard.</div>;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Applied': return 'border-blue-500';
            case 'Interview': return 'border-purple-500';
            case 'Offer': return 'border-green-500';
            case 'Rejected': return 'border-red-500';
            default: return 'border-gray-500';
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-center gap-4">
                    <img src={user.avatarUrl} alt="Avatar" className="h-16 w-16 rounded-full border-2 border-white shadow" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.username}</h1>
                        <p className="text-gray-600">You have applied to <span className="font-bold">{applications.length}</span> jobs.</p>

                        <div className="mt-4">
                            {user.resumeText ? (
                                <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1 rounded-md border border-green-200">
                                    <span className="text-sm font-semibold">✓ Resume Saved on Profile</span>
                                    <label className="text-xs underline cursor-pointer text-green-800 hover:text-green-900">
                                        Update
                                        <input type="file" className="hidden" onChange={handleResumeUpload} accept=".pdf" />
                                    </label>
                                </div>
                            ) : (
                                <label className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-md cursor-pointer hover:bg-blue-200 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                    <span className="text-sm font-medium">{uploadingResume ? 'Processing...' : 'Upload Resume to Profile'}</span>
                                    <input type="file" className="hidden" onChange={handleResumeUpload} accept=".pdf" disabled={uploadingResume} />
                                </label>
                            )}
                        </div>
                    </div>
                </div>

                {applications.length === 0 ? (
                    <div className="bg-white p-10 rounded-lg shadow text-center">
                        <h2 className="text-xl font-semibold text-gray-700">No applications yet</h2>
                        <p className="text-gray-500 mt-2">Start applying to jobs to track them here!</p>
                        <Link href="/jobs" className="mt-4 inline-block bg-primary text-white px-6 py-2 rounded-md hover:bg-blue-600">
                            Browse Jobs
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {applications.map(app => (
                            <div key={app._id} className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${getStatusColor(app.status)}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-900">{app.role}</h3>
                                        <p className="text-sm text-gray-600">{app.company}</p>
                                    </div>
                                    <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded text-gray-600">{app.status}</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-4">Applied on {new Date(app.appliedDate).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
