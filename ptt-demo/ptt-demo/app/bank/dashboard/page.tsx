'use client';

import DashboardLayout from '@/components/shared/DashboardLayout';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function BankDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [allPtts, setAllPtts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [orgTreasury, setOrgTreasury] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
    fetchRequests();
    fetchAllPtts();
  }, []);

  const fetchUserData = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);

        // Fetch fresh user data from database
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/auth/user/${parsedUser.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          const freshUser = data.user;

          // For bank users, fetch organization treasury
          if (freshUser.role === 'bank' && freshUser.organization) {
            console.log('Fetching treasury for organization:', freshUser.organization);
            const bankResponse = await fetch(`/api/bank/treasury/${encodeURIComponent(freshUser.organization)}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });

            if (bankResponse.ok) {
              const bankData = await bankResponse.json();
              console.log('Treasury data received:', bankData);
              // Set organization treasury
              setOrgTreasury(bankData.totalTreasury || 0);
              // Override individual balance with bank's total treasury
              freshUser.balance = bankData.totalTreasury;
            } else {
              console.error('Failed to fetch treasury:', await bankResponse.text());
            }
          }

          setUser(freshUser);
          // Update localStorage with fresh data
          localStorage.setItem('user', JSON.stringify(freshUser));
        } else {
          // Fallback to localStorage data if API fails
          setUser(parsedUser);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Fallback to localStorage data
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
  };

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

      // For bank users, fetch PTTs by organization (all PTTs from their bank)
      const endpoint = user.role === 'bank' && user.organization
        ? `/api/ptt/bank/${encodeURIComponent(user.organization)}`
        : `/api/ptt/user/${user.id}`;

      const response = await fetch(endpoint, {
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

      // Check if user is a maker or has admin/checker role
      if (user.bank_role === 'maker') {
        // Create pending action for approval
        const response = await fetch('/api/bank/pending-actions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            action_type: 'issue_ptt',
            ptt_id: pttId,
            initiated_by: user.id,
            action_data: {
              ptt_id: pttId,
              bank_id: user.id,
              backing_type: 'treasury'
            }
          })
        });

        if (!response.ok) {
          throw new Error('Failed to submit PTT issuance for approval');
        }

        toast.success('PTT Issuance Submitted!', {
          description: 'Waiting for checker approval to proceed',
          duration: 4000,
        });
      } else {
        // Direct issue for admin/checker or users without bank_role
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
      }

      fetchRequests();
      fetchAllPtts();
      fetchUserData();
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
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Treasury Balance</h3>
            <p className="text-xl font-bold text-green-600 mt-2">
              ₹{orgTreasury > 0 ? orgTreasury.toLocaleString() : (user?.balance ? parseFloat(user.balance).toLocaleString() : '0')}
            </p>
            <p className="text-xs text-gray-400 mt-1">Organization funds</p>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exporter</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exporter Bank</th>
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
                        {request.exporter ? (
                          <div>
                            <div className="font-medium">{request.exporter.name}</div>
                            <div className="text-xs text-gray-500">{request.exporter.organization}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Not specified</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.exporter_bank ? (
                          <div className="font-medium">{request.exporter_bank.organization || request.exporter_bank.name}</div>
                        ) : (
                          <span className="text-gray-400 italic">Not specified</span>
                        )}
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
