'use client';

import DashboardLayout from '@/components/shared/DashboardLayout';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReviewDocumentsPage() {
  const router = useRouter();
  const [ptts, setPtts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    fetchPTTsWithDocuments();
  }, []);

  const fetchPTTsWithDocuments = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/ptt/user/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter PTTs that have been transferred and need document approval
        const needsApproval = data.data.filter((ptt: any) =>
          ptt.status === 'transferred' && ptt.original_importer_id === user.id
        );
        setPtts(needsApproval);
      }
    } catch (error) {
      console.error('Error fetching PTTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDocuments = async (pttId: string) => {
    if (!confirm('Approve all documents and mark PTT as redeemable?')) return;

    setApproving(pttId);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // Approve documents - this will also mark PTT as redeemable
      const response = await fetch('/api/documents/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ptt_id: pttId,
          approved_by_id: user.id,
          approved: true,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to approve documents');
      }

      alert('Documents approved! PTT is now redeemable.');
      fetchPTTsWithDocuments();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setApproving(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: any = {
      transferred: 'bg-indigo-100 text-indigo-800',
      redeemable: 'bg-green-100 text-green-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <DashboardLayout role="importer">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Review Documents</h1>
          <button
            onClick={() => router.push('/importer/dashboard')}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">PTTs Awaiting Document Approval</h2>
            <button
              onClick={fetchPTTsWithDocuments}
              className="text-purple-600 hover:text-purple-700 text-sm"
            >
              🔄 Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : ptts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No PTTs awaiting document approval</p>
              <p className="text-sm mt-2">
                PTTs will appear here after being transferred to exporters
              </p>
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
                        <button
                          onClick={() => handleApproveDocuments(ptt.id)}
                          disabled={approving === ptt.id}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                          {approving === ptt.id ? 'Approving...' : 'Approve Documents'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <p className="text-sm text-blue-700">
            ℹ️ <strong>Note:</strong> For this demo, clicking "Approve Documents" will automatically mark the PTT as redeemable,
            allowing the exporter to offer it for discounting. In production, this would show uploaded document files for review.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
