'use client';

import DashboardLayout from '@/components/shared/DashboardLayout';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function SettlementsPage() {
  const [ptts, setPtts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchSettlementPTTs();
  }, []);

  const fetchSettlementPTTs = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/ptt/user/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter for discounted PTTs that need settlement
        const forSettlement = data.data.filter((ptt: any) =>
          ptt.status === 'discounted'
        );
        setPtts(forSettlement);
      }
    } catch (error) {
      console.error('Error fetching settlement PTTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async (pttId: string, pttNumber: string, amount: number) => {
    setProcessing(pttId);
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/settlement/settle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ptt_id: pttId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to settle PTT');
      }

      toast.success('Settlement Completed!', {
        description: `PTT ${pttNumber} settled. Payment Reference: ${data.data.payment_reference}`,
        duration: 5000,
      });
      fetchSettlementPTTs();
    } catch (error: any) {
      toast.error('Settlement Failed', {
        description: error.message,
        duration: 4000,
      });
    } finally {
      setProcessing(null);
    }
  };

  const calculateDaysToMaturity = (maturityDate: string) => {
    const today = new Date();
    const maturity = new Date(maturityDate);
    const diffTime = maturity.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const stats = {
    pendingSettlements: ptts.length,
    totalAmount: ptts.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
    dueThisWeek: ptts.filter(p => calculateDaysToMaturity(p.maturity_date) <= 7).length,
    overdue: ptts.filter(p => calculateDaysToMaturity(p.maturity_date) < 0).length,
  };

  return (
    <DashboardLayout role="bank">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Settlement Management</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Pending Settlements</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">{stats.pendingSettlements}</p>
            <p className="text-xs text-gray-400 mt-1">Discounted PTTs</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Due This Week</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.dueThisWeek}</p>
            <p className="text-xs text-gray-400 mt-1">Within 7 days</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Overdue</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.overdue}</p>
            <p className="text-xs text-gray-400 mt-1">Past maturity</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">${stats.totalAmount.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">To be settled</p>
          </div>
        </div>

        {/* PTTs Ready for Settlement */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">PTTs Ready for Settlement</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : ptts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No PTTs pending settlement
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PTT Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Beneficiary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount to Pay</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Maturity Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {ptts.map((ptt) => {
                    const daysToMaturity = calculateDaysToMaturity(ptt.maturity_date);
                    const isOverdue = daysToMaturity < 0;
                    const isDueSoon = daysToMaturity <= 7 && daysToMaturity >= 0;

                    return (
                      <tr key={ptt.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {ptt.ptt_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <div>
                            <p className="font-medium">{ptt.current_owner?.name || 'N/A'}</p>
                            <p className="text-xs text-gray-500">{ptt.current_owner?.organization || ''}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          {ptt.currency} {parseFloat(ptt.amount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(ptt.maturity_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            isOverdue ? 'bg-red-100 text-red-800' :
                            isDueSoon ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {isOverdue ? `OVERDUE (${Math.abs(daysToMaturity)}d)` :
                             daysToMaturity === 0 ? 'DUE TODAY' :
                             `${daysToMaturity} DAYS`}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleSettle(ptt.id, ptt.ptt_number, parseFloat(ptt.amount))}
                            disabled={processing === ptt.id}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
                          >
                            {processing === ptt.id ? 'Settling...' : 'Settle PTT'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 How Settlement Works:</h3>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Click <strong>"Settle PTT"</strong> to initiate one-click settlement</li>
            <li>Money is automatically transferred from bank treasury to the beneficiary (funder)</li>
            <li>PTT status changes to "settled" and appears in settlement history</li>
            <li>Both bank and beneficiary balances are updated instantly</li>
            <li>A unique payment reference is auto-generated for tracking</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
