'use client';

import DashboardLayout from '@/components/shared/DashboardLayout';
import { useEffect, useState } from 'react';

export default function BankDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [allPtts, setAllPtts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
    fetchAllPtts();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ptt/requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPtts = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch(`/api/ptt/user/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAllPtts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching PTTs:', error);
    }
  };

  const handleIssuePTT = async (pttId: string) => {
    if (!confirm('Are you sure you want to issue this PTT?')) return;

    setIssuing(pttId);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');

      const response = await fetch('/api/ptt/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ptt_id: pttId,
          bank_id: user.id,
          backing_type: 'treasury'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to issue PTT');
      }

      alert('PTT issued successfully!');
      fetchRequests();
      fetchAllPtts();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setIssuing(null);
    }
  };

  const stats = {
    pendingRequests: requests.length,
    issuedPtts: allPtts.filter(p => p.status !== 'requested').length,
    totalExposure: allPtts.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
    pendingSettlements: allPtts.filter(p => p.status === 'discounted').length,
  };

  return (
    <DashboardLayout role="bank">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Pending Requests</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendingRequests}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Issued PTTs</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.issuedPtts}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Exposure</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">${stats.totalExposure.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Pending Settlements</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">{stats.pendingSettlements}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border-2 border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-colors">
              <div className="text-lg font-semibold">Review Requests</div>
              <div className="text-sm text-gray-500 mt-1">Approve PTT requests</div>
            </button>
            <button className="p-4 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
              <div className="text-lg font-semibold">Outstanding PTTs</div>
              <div className="text-sm text-gray-500 mt-1">Monitor active PTTs</div>
            </button>
            <button className="p-4 border-2 border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors">
              <div className="text-lg font-semibold">Process Settlements</div>
              <div className="text-sm text-gray-500 mt-1">Handle maturity payments</div>
            </button>
          </div>
        </div>

        {/* Pending PTT Requests */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Pending PTT Requests</h2>
            <button
              onClick={() => { fetchRequests(); fetchAllPtts(); }}
              className="text-green-600 hover:text-green-700 text-sm"
            >
              🔄 Refresh
            </button>
          </div>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending requests
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PTT Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Importer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Maturity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trade Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {request.ptt_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.original_importer?.organization || request.original_importer?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.currency} {parseFloat(request.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.maturity_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="max-w-xs truncate">
                          {request.incoterms && <span className="font-semibold">{request.incoterms}</span>}
                          {request.trade_description && <span> - {request.trade_description}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleIssuePTT(request.id)}
                          disabled={issuing === request.id}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                          {issuing === request.id ? 'Issuing...' : 'Issue PTT'}
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
