'use client';

import DashboardLayout from '@/components/shared/DashboardLayout';
import { useEffect, useState } from 'react';

export default function FunderPortfolio() {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/ptt/user/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPortfolio(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    portfolioPtts: portfolio.length,
    portfolioValue: portfolio.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
    expectedReturns: portfolio.reduce((sum, p) => {
      return sum + parseFloat(p.amount || 0) * 0.05;
    }, 0),
  };

  return (
    <DashboardLayout role="funder">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">My Portfolio</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Portfolio PTTs</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.portfolioPtts}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Portfolio Value</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">${stats.portfolioValue.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Expected Returns</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">${stats.expectedReturns.toLocaleString()}</p>
          </div>
        </div>

        {/* Portfolio Table */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">My PTT Holdings</h2>
            <button
              onClick={fetchPortfolio}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              🔄 Refresh
            </button>
          </div>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : portfolio.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">No PTTs in portfolio yet</p>
              <p className="text-sm">Browse the marketplace to purchase PTTs</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PTT Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Face Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Return</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Maturity Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {portfolio.map((ptt) => {
                    const faceValue = parseFloat(ptt.amount || 0);
                    const purchasePrice = faceValue * 0.95; // Estimate based on typical discount
                    const expectedReturn = faceValue - purchasePrice;

                    return (
                      <tr key={ptt.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {ptt.ptt_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${purchasePrice.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ptt.currency} {faceValue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                          ${expectedReturn.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(ptt.maturity_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            ptt.status === 'discounted' ? 'bg-blue-100 text-blue-800' :
                            ptt.status === 'active' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {ptt.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
