'use client';

import DashboardLayout from '@/components/shared/DashboardLayout';
import { useEffect, useState } from 'react';

export default function SettlementsPage() {
  const [ptts, setPtts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchSettlementPTTs();
  }, []);

  const fetchSettlementPTTs = async () => {
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

  const handleTriggerSettlement = async (pttId: string) => {
    if (!confirm('Trigger settlement for this PTT?')) return;

    setProcessing(pttId);
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/settlement/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ptt_id: pttId })
      });

      if (!response.ok) {
        throw new Error('Failed to trigger settlement');
      }

      alert('Settlement triggered successfully!');
      fetchSettlementPTTs();
    } catch (error: any) {
      alert('Error: ' + error.message);
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
  };

  return (
    <DashboardLayout role="bank">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Process Settlements</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Pending Settlements</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">{stats.pendingSettlements}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Due This Week</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.dueThisWeek}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Settlement Amount</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">${stats.totalAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* Settlements Table */}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Owner (Funder)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount to Pay</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Maturity Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days to Maturity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                          {ptt.current_owner?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          {ptt.currency} {parseFloat(ptt.amount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(ptt.maturity_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`font-semibold ${
                            isOverdue ? 'text-red-600' :
                            isDueSoon ? 'text-orange-600' :
                            'text-gray-600'
                          }`}>
                            {isOverdue ? `Overdue by ${Math.abs(daysToMaturity)} days` :
                             daysToMaturity === 0 ? 'Due today' :
                             `${daysToMaturity} days`}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleTriggerSettlement(ptt.id)}
                            disabled={processing === ptt.id}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                          >
                            {processing === ptt.id ? 'Processing...' : 'Trigger Settlement'}
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

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <p className="text-sm text-blue-700">
            ℹ️ <strong>Note:</strong> Settlement means paying the face value of the PTT to the current owner (funder)
            at maturity date. The bank is responsible for making this payment.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
