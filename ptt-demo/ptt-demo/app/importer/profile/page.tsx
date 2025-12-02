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
  credit_limit: number;
  credit_used: number;
  created_at: string;
}

export default function ImporterProfile() {
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
      <DashboardLayout role="importer">
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
      <DashboardLayout role="importer">
        <div className="text-center py-12">
          <p className="text-gray-600">Unable to load profile</p>
        </div>
      </DashboardLayout>
    );
  }

  const creditUtilization = user.credit_limit > 0
    ? ((user.credit_used / user.credit_limit) * 100).toFixed(1)
    : 0;

  const availableCredit = user.credit_limit - user.credit_used;

  return (
    <DashboardLayout role="importer">
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Banking Information
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">Bank Name</label>
                <p className="text-gray-900 font-semibold">DBS Bank</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">Bank Account Number</label>
                <p className="text-gray-900 font-mono">{user.bank_account_number || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">IFSC / SWIFT Code</label>
                <p className="text-gray-900 font-mono">{user.ifsc_code || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">Account Balance</label>
                <p className="text-2xl font-bold text-green-600">${user.balance.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Credit Information */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-sm border border-purple-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Credit Facility
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-4">
                <label className="text-sm font-medium text-gray-500 block mb-2">Credit Limit</label>
                <p className="text-2xl font-bold text-gray-900">${user.credit_limit.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <label className="text-sm font-medium text-gray-500 block mb-2">Credit Used</label>
                <p className="text-2xl font-bold text-orange-600">${user.credit_used.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <label className="text-sm font-medium text-gray-500 block mb-2">Available Credit</label>
                <p className="text-2xl font-bold text-green-600">${availableCredit.toLocaleString()}</p>
              </div>
            </div>

            {/* Credit Utilization Bar */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">Credit Utilization</label>
                <span className={`text-sm font-bold ${
                  Number(creditUtilization) > 90 ? 'text-red-600' :
                  Number(creditUtilization) > 75 ? 'text-orange-600' :
                  'text-green-600'
                }`}>
                  {creditUtilization}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    Number(creditUtilization) > 90 ? 'bg-red-500' :
                    Number(creditUtilization) > 75 ? 'bg-orange-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${creditUtilization}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
