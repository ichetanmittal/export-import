'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'importer' as 'importer' | 'bank' | 'exporter' | 'funder',
    organization: '',
    phone: '',
    geography: '',
    bankAccountNumber: '',
    ifscCode: '',
    bankRole: null as 'maker' | 'checker' | 'admin' | null,
    funderRole: null as 'maker' | 'checker' | 'admin' | null,
    // POC fields - user becomes POC by default
    isPoc: true,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.role === 'bank' && !formData.bankRole) {
      setError('Please select a bank role (Maker/Checker/Admin)');
      return;
    }

    if (formData.role === 'funder' && !formData.funderRole) {
      setError('Please select a funder role (Maker/Checker/Admin)');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role,
          organization: formData.organization,
          phone: formData.phone,
          geography: formData.geography,
          bank_account_number: formData.bankAccountNumber,
          ifsc_code: formData.ifscCode,
          bank_role: formData.bankRole,
          funder_role: formData.funderRole,
          is_poc: formData.isPoc,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Auto-login after registration
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));

      // Redirect based on role
      router.push(`/${formData.role}/dashboard`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-2xl w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            PTT Demo - Register
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create your account (You will be the Point of Contact)
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password *
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role *
              </label>
              <select
                id="role"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="importer">Importer</option>
                <option value="exporter">Exporter</option>
                <option value="bank">Bank</option>
                <option value="funder">Funder</option>
              </select>
            </div>

            {/* Organization */}
            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
                Organization Name *
              </label>
              <input
                id="organization"
                type="text"
                required
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., ICICI Bank, ABC Importers Ltd"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="phone"
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="+91-9876543210"
              />
            </div>

            {/* Geography */}
            <div>
              <label htmlFor="geography" className="block text-sm font-medium text-gray-700">
                Geography / Country
              </label>
              <input
                id="geography"
                type="text"
                value={formData.geography}
                onChange={(e) => setFormData({ ...formData, geography: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., India, Singapore"
              />
            </div>

            {/* Bank Account */}
            <div>
              <label htmlFor="bankAccountNumber" className="block text-sm font-medium text-gray-700">
                Bank Account Number
              </label>
              <input
                id="bankAccountNumber"
                type="text"
                value={formData.bankAccountNumber}
                onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* IFSC Code */}
            <div>
              <label htmlFor="ifscCode" className="block text-sm font-medium text-gray-700">
                IFSC / SWIFT Code
              </label>
              <input
                id="ifscCode"
                type="text"
                value={formData.ifscCode}
                onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Bank Role - Only show if role is bank */}
            {formData.role === 'bank' && (
              <div>
                <label htmlFor="bankRole" className="block text-sm font-medium text-gray-700">
                  Bank Role *
                </label>
                <select
                  id="bankRole"
                  required
                  value={formData.bankRole || ''}
                  onChange={(e) => setFormData({ ...formData, bankRole: e.target.value as any })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select role...</option>
                  <option value="maker">Maker</option>
                  <option value="checker">Checker</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            {/* Funder Role - Only show if role is funder */}
            {formData.role === 'funder' && (
              <div>
                <label htmlFor="funderRole" className="block text-sm font-medium text-gray-700">
                  Funder Role *
                </label>
                <select
                  id="funderRole"
                  required
                  value={formData.funderRole || ''}
                  onChange={(e) => setFormData({ ...formData, funderRole: e.target.value as any })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select role...</option>
                  <option value="maker">Maker</option>
                  <option value="checker">Checker</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> You will be registered as the Point of Contact (POC) for {formData.organization}.
              {(formData.role === 'bank' || formData.role === 'funder') && ' Other banks/funders will see your contact information when interacting with your organization.'}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <div className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
