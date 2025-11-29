'use client';

import DashboardLayout from '@/components/shared/DashboardLayout';
import { useEffect, useState } from 'react';

export default function ImporterDashboard() {
  const [ptts, setPtts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    // TODO: Fetch PTTs from API
    setLoading(false);
  }, []);

  return (
    <DashboardLayout role="importer">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Active PTTs</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Pending Approvals</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">0</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">$0</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Settled</h3>
            <p className="text-3xl font-bold text-gray-600 mt-2">0</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
              <div className="text-lg font-semibold">Request New PTT</div>
              <div className="text-sm text-gray-500 mt-1">Create a new PTT request</div>
            </button>
            <button className="p-4 border-2 border-purple-500 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors">
              <div className="text-lg font-semibold">Review Documents</div>
              <div className="text-sm text-gray-500 mt-1">Approve shipping documents</div>
            </button>
            <button className="p-4 border-2 border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-lg font-semibold">Transaction History</div>
              <div className="text-sm text-gray-500 mt-1">View all transactions</div>
            </button>
          </div>
        </div>

        {/* Recent PTTs */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Recent PTTs</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : ptts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No PTTs found. Request a new PTT to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PTT Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Maturity Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* PTT rows will go here */}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
