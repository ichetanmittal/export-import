'use client';

import DashboardLayout from '@/components/shared/DashboardLayout';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ImporterDashboard() {
  const router = useRouter();
  const [ptts, setPtts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchPTTs(parsedUser.id);
    }
  }, []);

  const fetchPTTs = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/ptt/user/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPtts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching PTTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: any = {
      requested: 'bg-yellow-100 text-yellow-800',
      issued: 'bg-blue-100 text-blue-800',
      locked: 'bg-purple-100 text-purple-800',
      transferred: 'bg-indigo-100 text-indigo-800',
      redeemable: 'bg-green-100 text-green-800',
      discounted: 'bg-orange-100 text-orange-800',
      settled: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const stats = {
    active: ptts.filter(p => !['settled', 'cancelled'].includes(p.status)).length,
    pendingApprovals: ptts.filter(p => p.status === 'transferred').length,
    totalValue: ptts.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
    settled: ptts.filter(p => p.status === 'settled').length,
  };

  return (
    <DashboardLayout role="importer">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Active PTTs</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.active}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Pending Approvals</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendingApprovals}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">${stats.totalValue.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Settled</h3>
            <p className="text-3xl font-bold text-gray-600 mt-2">{stats.settled}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/importer/request-ptt')}
              className="p-4 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <div className="text-lg font-semibold">Request New PTT</div>
              <div className="text-sm text-gray-500 mt-1">Create a new PTT request</div>
            </button>
            <button
              onClick={() => router.push('/importer/review-documents')}
              className="p-4 border-2 border-purple-500 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <div className="text-lg font-semibold">Review Documents</div>
              <div className="text-sm text-gray-500 mt-1">Approve shipping documents</div>
            </button>
            <button
              onClick={() => router.push('/importer/history')}
              className="p-4 border-2 border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-lg font-semibold">Transaction History</div>
              <div className="text-sm text-gray-500 mt-1">View all transactions</div>
            </button>
          </div>
        </div>

        {/* Recent PTTs */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">My PTTs</h2>
            <button
              onClick={() => fetchPTTs(user?.id)}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              🔄 Refresh
            </button>
          </div>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : ptts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">No PTTs found. Request a new PTT to get started.</p>
              <button
                onClick={() => router.push('/importer/request-ptt')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Request PTT
              </button>
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
                  {ptts.map((ptt) => (
                    <tr key={ptt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {ptt.ptt_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ptt.currency} {parseFloat(ptt.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(ptt.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(ptt.maturity_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => router.push(`/importer/ptt/${ptt.id}`)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          View Details →
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
