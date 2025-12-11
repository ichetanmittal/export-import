'use client';

import DashboardLayout from '@/components/shared/DashboardLayout';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function BankBlacklistPage() {
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [exporters, setExporters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    exporterId: '',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchBlacklist(parsedUser.organization);
      fetchExporters();
    }
  }, []);

  const fetchBlacklist = async (organization: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/bank/blacklist?organization=${encodeURIComponent(organization)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setBlacklist(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching blacklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExporters = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/by-role?role=exporter', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setExporters(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching exporters:', error);
    }
  };

  const handleAddToBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/bank/blacklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bank_id: user.id,
          blacklisted_org_id: formData.exporterId,
          reason: formData.reason,
          notes: formData.notes,
          blacklisted_by: user.id,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to blacklist organization');
      }

      toast.success('Organization Blacklisted!', {
        description: 'The exporter has been added to the blacklist',
        duration: 3000,
      });

      setShowAddForm(false);
      setFormData({ exporterId: '', reason: '', notes: '' });
      fetchBlacklist(user.organization);
    } catch (error: any) {
      toast.error('Failed to Blacklist', {
        description: error.message,
      });
    }
  };

  const handleRemoveFromBlacklist = async (id: string, orgName: string) => {
    if (!confirm(`Are you sure you want to remove "${orgName}" from the blacklist?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/bank/blacklist?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to remove from blacklist');
      }

      toast.success('Removed from Blacklist', {
        description: `${orgName} has been removed from the blacklist`,
        duration: 3000,
      });

      fetchBlacklist(user.organization);
    } catch (error: any) {
      toast.error('Failed to Remove', {
        description: error.message,
      });
    }
  };

  // Filter out already blacklisted exporters
  const availableExporters = exporters.filter(exp =>
    !blacklist.some(bl => bl.blacklisted_org_id === exp.id)
  );

  return (
    <DashboardLayout role="bank">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Blacklisted Organizations</h1>
            <p className="text-gray-600 mt-1">Manage exporters restricted from your bank</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            {showAddForm ? 'Cancel' : '+ Add to Blacklist'}
          </button>
        </div>

        {/* Add to Blacklist Form */}
        {showAddForm && (
          <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-red-900 mb-4">Add Organization to Blacklist</h2>
            <form onSubmit={handleAddToBlacklist} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Exporter *
                </label>
                <select
                  required
                  value={formData.exporterId}
                  onChange={(e) => setFormData({...formData, exporterId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">-- Select Exporter --</option>
                  {availableExporters.map((exporter) => (
                    <option key={exporter.id} value={exporter.id}>
                      {exporter.name} - {exporter.organization}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Blacklisting *
                </label>
                <select
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">-- Select Reason --</option>
                  <option value="fraud">Fraudulent Activity</option>
                  <option value="non_payment">Non-Payment / Default</option>
                  <option value="document_forgery">Document Forgery</option>
                  <option value="sanctions">Sanctions Violation</option>
                  <option value="repeated_violations">Repeated Contract Violations</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Add any additional details..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
              >
                Add to Blacklist
              </button>
            </form>
          </div>
        )}

        {/* Blacklist Table */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            Blacklisted Exporters ({blacklist.length})
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : blacklist.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-2 text-gray-500">No blacklisted organizations</p>
              <p className="text-sm text-gray-400">Add exporters to the blacklist to restrict them</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Blacklisted Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {blacklist.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{entry.blacklisted_org?.name}</div>
                          <div className="text-sm text-gray-500">{entry.blacklisted_org?.organization}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.blacklisted_org?.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          {entry.reason?.replace('_', ' ').toUpperCase() || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(entry.blacklisted_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {entry.notes || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleRemoveFromBlacklist(entry.id, entry.blacklisted_org?.organization)}
                          className="text-green-600 hover:text-green-800 font-medium"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
