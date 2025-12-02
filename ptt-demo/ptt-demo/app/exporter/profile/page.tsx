'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string | null;
  phone: string | null;
  bank_account_number: string | null;
  ifsc_code: string | null;
  geography: string | null;
  balance: number;
  created_at: string;
}

export default function ExporterProfile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      fetchUserProfile(parsedUser.id);
    }
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/auth/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="exporter">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout role="exporter">
        <div className="text-center py-12">
          <p className="text-gray-600">Unable to load profile</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="exporter">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

        <div className="grid gap-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Personal Information
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">Full Name</label>
                <p className="text-gray-900 font-medium">{user.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">Email Address</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">Organization</label>
                <p className="text-gray-900">{user.organization || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">Phone Number</label>
                <p className="text-gray-900">{user.phone || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">Geography</label>
                <p className="text-gray-900 flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {user.geography || 'Not specified'}
                </p>
              </div>
            </div>
          </div>

          {/* Banking Information */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Banking Information
            </h2>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4">
                <label className="text-sm font-medium text-gray-500 block mb-1">Bank Name</label>
                <p className="text-xl font-semibold text-gray-900">ICICI Bank</p>
                <p className="text-xs text-gray-500 mt-1">Your banking partner in India</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <label className="text-sm font-medium text-gray-500 block mb-1">Bank Account Number</label>
                <p className="text-xl font-mono font-semibold text-gray-900">{user.bank_account_number || 'Not specified'}</p>
                <p className="text-xs text-gray-500 mt-1">Use this account for receiving PTT settlements</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <label className="text-sm font-medium text-gray-500 block mb-1">IFSC Code</label>
                <p className="text-xl font-mono font-semibold text-gray-900">{user.ifsc_code || 'Not specified'}</p>
                <p className="text-xs text-gray-500 mt-1">Bank identifier for domestic transfers</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <label className="text-sm font-medium text-gray-500 block mb-1">Current Balance</label>
                <p className="text-3xl font-bold text-green-600">${user.balance.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Available funds in your account</p>
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Business Information
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <label className="text-sm font-medium text-gray-600 block mb-2">Business Location</label>
                <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {user.geography || 'Not specified'}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                <label className="text-sm font-medium text-gray-600 block mb-2">Organization</label>
                <p className="text-lg font-semibold text-gray-900">{user.organization || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
