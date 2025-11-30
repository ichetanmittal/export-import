'use client';

import DashboardLayout from '@/components/shared/DashboardLayout';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ExporterDashboard() {
  const router = useRouter();
  const [ptts, setPtts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPTTs();
  }, []);

  const fetchPTTs = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/ptt/user/${user.id}`, {
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
    receivedPtts: ptts.length,
    pendingUploads: ptts.filter(p => p.status === 'transferred').length,
    availableForDiscount: ptts.filter(p => p.status === 'redeemable').length,
    totalValue: ptts.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
  };

  return (
    <DashboardLayout role="exporter">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Received PTTs</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">{stats.receivedPtts}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Pending Uploads</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendingUploads}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Available for Discount</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.availableForDiscount}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">${stats.totalValue.toLocaleString()}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/exporter/upload-documents')}
              className="p-4 border-2 border-purple-500 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <div className="text-lg font-semibold">Upload Documents</div>
              <div className="text-sm text-gray-500 mt-1">Submit shipping documents</div>
            </button>
            <button
              onClick={() => router.push('/exporter/discount-offers')}
              className="p-4 border-2 border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
            >
              <div className="text-lg font-semibold">Discount PTTs</div>
              <div className="text-sm text-gray-500 mt-1">Offer PTTs for early payment</div>
            </button>
          </div>
        </div>

        {/* Received PTTs */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Received PTTs</h2>
            <button
              onClick={fetchPTTs}
              className="text-purple-600 hover:text-purple-700 text-sm"
            >
              🔄 Refresh
            </button>
          </div>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : ptts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No PTTs received yet
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {ptt.status === 'transferred' && (
                          <button
                            onClick={() => router.push(`/exporter/upload-documents?ptt=${ptt.id}`)}
                            className="text-purple-600 hover:text-purple-900 font-medium"
                          >
                            Upload Docs →
                          </button>
                        )}
                        {ptt.status === 'redeemable' && (
                          <button
                            onClick={() => router.push(`/exporter/discount-offers?ptt=${ptt.id}`)}
                            className="text-green-600 hover:text-green-900 font-medium"
                          >
                            Offer Discount →
                          </button>
                        )}
                        {(ptt.status === 'discounted' || ptt.status === 'settled') && (
                          <span className="text-gray-500">Completed</span>
                        )}
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
