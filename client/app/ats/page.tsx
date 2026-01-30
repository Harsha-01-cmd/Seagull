'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import api from '@/lib/api';
import Link from 'next/link';

export default function ATSPage() {
    const [file, setFile] = useState<File | null>(null);
    const [jobDesc, setJobDesc] = useState('');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [userProfile, setUserProfile] = useState<any>(null);
    const [useProfileResume, setUseProfileResume] = useState(false);

    useEffect(() => {
        // Fetch User Profile to check for saved resume
        api.get('/api/user/profile')
            .then(res => {
                setUserProfile(res.data);
                if (res.data && res.data.resumeText) {
                    setUseProfileResume(true); // Default to using saved resume if available
                }
            })
            .catch(err => console.log('Not logged in or no profile'));
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setUseProfileResume(false); // If user uploads new file, switch off profile usage
        }
    };

    const handleAnalyze = async () => {
        if ((!file && !useProfileResume) || !jobDesc) {
            setError("Please upload a resume (or use saved one) and paste a job description.");
            return;
        }
        setError('');
        setLoading(true);

        const formData = new FormData();
        formData.append('job_description', jobDesc);

        try {
            let res;
            if (useProfileResume && userProfile?.resumeText) {
                // Use Text Endpoint
                formData.append('resume_text', userProfile.resumeText);
                res = await axios.post('http://localhost:8000/predict-shortlist-text', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else if (file) {
                // Use File Endpoint
                formData.append('resume', file);
                res = await axios.post('http://localhost:8000/predict-shortlist-file', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            setResult(res?.data);
        } catch (err) {
            console.error(err);
            setError("Error analyzing resume. Please ensure the analysis service is running.");
        }
        setLoading(false);
    };

    return (
        <div className="bg-gray-50 min-h-screen py-10">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold leading-tight text-gray-900 mb-8">ATS Resume Scanner</h1>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Resume Column */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Resume Source</label>

                        {/* Option A: Saved Profile Resume */}
                        {userProfile?.resumeText && (
                            <div className={`mb-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${useProfileResume ? 'border-primary bg-blue-50' : 'border-gray-200 bg-white'}`}
                                onClick={() => { setUseProfileResume(true); setFile(null); }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${useProfileResume ? 'border-primary bg-primary' : 'border-gray-400'}`}>
                                        {useProfileResume && <span className="text-white text-xs">✓</span>}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Use Saved Profile Resume</p>
                                        <p className="text-xs text-gray-500">Uploaded on {userProfile.resumeUploadedAt ? new Date(userProfile.resumeUploadedAt).toLocaleDateString() : 'Previously'}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Option B: Upload New */}
                        <div className={`relative ${useProfileResume ? 'opacity-50 hover:opacity-100' : ''}`}>
                            {userProfile?.resumeText && <p className="text-xs text-center text-gray-500 mb-2">- OR -</p>}
                            <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-100 ${!useProfileResume && file ? 'border-primary bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" fill="none" viewBox="0 0 20 16">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                                    </svg>
                                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Upload New Resume</span></p>
                                    <p className="text-xs text-gray-500">PDF or DOCX</p>
                                </div>
                                <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.docx,.doc" />
                            </label>
                            {file && <p className="mt-2 text-sm text-center text-primary font-semibold">Selected: {file.name}</p>}
                        </div>
                    </div>

                    {/* JD Column */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
                        <textarea
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary h-64 p-2 text-sm"
                            value={jobDesc}
                            onChange={(e) => setJobDesc(e.target.value)}
                            placeholder="Paste the job description here..."
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-center">
                    <button
                        onClick={handleAnalyze}
                        disabled={loading || (!file && !useProfileResume) || !jobDesc}
                        className="rounded-md bg-gradient-to-r from-primary to-secondary px-8 py-3 text-lg font-semibold text-white shadow-lg hover:from-blue-600 hover:to-pink-600 disabled:opacity-50 transition-all transform hover:scale-105"
                    >
                        {loading ? 'Analyzing...' : 'Analyze My Chances'}
                    </button>
                    {!userProfile?.resumeText && !loading && (
                        <p className="ml-4 flex items-center text-sm text-gray-500">
                            Tip: <Link href="/dashboard" className="text-primary underline ml-1">Save your resume to profile</Link> to skip upload next time.
                        </p>
                    )}
                </div>

                {/* Result Section (Same as before) */}
                {result && (
                    <div className="mt-10 bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Analysis Report</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className={`p-6 rounded-xl border-l-8 ${result.ats_score > 70 ? 'bg-green-50 border-green-500' : 'bg-yellow-50 border-yellow-500'}`}>
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Success Probability</p>
                                <div className="flex items-end gap-2">
                                    <p className={`text-5xl font-extrabold ${result.ats_score > 70 ? 'text-green-600' : 'text-yellow-600'}`}>
                                        {(result.shortlist_probability * 100).toFixed(0)}%
                                    </p>
                                    <span className="mb-2 text-gray-500 font-medium">match</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Missing Keywords</h3>
                                <div className="flex flex-wrap gap-2">
                                    {result.missing_keywords.map((k: string) => (
                                        <span key={k} className="bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full text-sm font-medium">
                                            {k}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Improvement Suggestions</h3>
                                <ul className="list-disc leading-relaxed pl-5 text-gray-600 space-y-1">
                                    {result.suggestions && result.suggestions.map((s: string, i: number) => (
                                        <li key={i}>{s}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
