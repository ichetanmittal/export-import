'use client';

import DashboardLayout from '@/components/shared/DashboardLayout';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function BankDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [allPtts, setAllPtts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
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

      toast.success('PTT Issued Successfully!', {
        description: 'The PTT has been issued and credit has been allocated',
        duration: 4000,
      });
      fetchRequests();
      fetchAllPtts();
    } catch (error: any) {
      toast.error('Failed to Issue PTT', {
        description: error.message,
        duration: 4000,
      });
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
            <h3 className="text-sm font-medium text-gray-500">Treasury Balance</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              ${user?.balance ? parseFloat(user.balance).toLocaleString() : '0'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Available funds</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Pending Requests</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendingRequests}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Issued PTTs</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">{stats.issuedPtts}</p>
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

        {/* Pending PTT Requests */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Pending PTT Requests</h2>
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
