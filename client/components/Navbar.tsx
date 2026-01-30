'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function Navbar() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        api.get('/auth/user')
            .then(res => setUser(res.data))
            .catch(() => setUser(null));
    }, []);

    return (
        <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                Seagull
                            </Link>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link href="/jobs" className="border-transparent text-gray-500 hover:border-primary hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                Jobs
                            </Link>
                            <Link href="/dashboard" className="border-transparent text-gray-500 hover:border-primary hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                Dashboard
                            </Link>
                            <Link href="/ats" className="border-transparent text-gray-500 hover:border-primary hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                ATS Scanner
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        {user ? (
                            <>
                                <span className="text-sm text-gray-700">Hi, {(user as any).username}</span>
                                <Link href="http://localhost:5000/auth/logout" className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600 transition-colors">
                                    Logout
                                </Link>
                            </>
                        ) : (
                            <Link href="http://localhost:5000/auth/github" className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                                Sign in with GitHub
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
