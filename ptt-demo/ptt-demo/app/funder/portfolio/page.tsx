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

      // For funder users, fetch PTTs by organization instead of individual user
      let response;
      if (user.role === 'funder' && user.organization) {
        response = await fetch(`/api/ptt/funder/${encodeURIComponent(user.organization)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        response = await fetch(`/api/ptt/user/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }

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
    realizedReturns: portfolio.reduce((sum, p) => {
      if (p.status === 'settled') {
        const faceValue = parseFloat(p.amount || 0);
        const acceptedOffer = p.discounting_offers?.find((offer: any) =>
          offer.status === 'accepted' || offer.status === 'paid'
        );
        const purchasePrice = acceptedOffer ? parseFloat(acceptedOffer.asking_price) : faceValue * 0.95;
        return sum + (faceValue - purchasePrice);
      }
      return sum;
    }, 0),
    unrealizedReturns: portfolio.reduce((sum, p) => {
      if (p.status === 'discounted') {
        const faceValue = parseFloat(p.amount || 0);
        const acceptedOffer = p.discounting_offers?.find((offer: any) =>
          offer.status === 'accepted' || offer.status === 'paid'
        );
        const purchasePrice = acceptedOffer ? parseFloat(acceptedOffer.asking_price) : faceValue * 0.95;
        return sum + (faceValue - purchasePrice);
      }
      return sum;
    }, 0),
  };

  return (
    <DashboardLayout role="funder">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">My Portfolio</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Portfolio PTTs</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.portfolioPtts}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Portfolio Value</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">${stats.portfolioValue.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Realized Returns</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">${stats.realizedReturns.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">From settled PTTs</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Unrealized Returns</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">${stats.unrealizedReturns.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">From active PTTs</p>
          </div>
        </div>

        {/* Portfolio Table */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">My PTT Holdings</h2>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exporter Report</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issuing Bank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Face Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Return</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Maturity Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {portfolio.map((ptt) => {
                    const faceValue = parseFloat(ptt.amount || 0);

                    // Get discount offer details (find the accepted offer)
                    const acceptedOffer = ptt.discounting_offers?.find((offer: any) =>
                      offer.status === 'accepted' || offer.status === 'paid'
                    );

                    const purchasePrice = acceptedOffer
                      ? parseFloat(acceptedOffer.asking_price)
                      : faceValue * 0.95; // Fallback estimate

                    const discountRate = acceptedOffer
                      ? acceptedOffer.discount_rate
                      : 5; // Fallback estimate

                    const expectedReturn = faceValue - purchasePrice;

                    const offeredBy = acceptedOffer?.exporter?.name ||
                                     ptt.exporter?.name ||
                                     'N/A';

                    return (
                      <tr key={ptt.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-gray-900">
                              {offeredBy}
                            </span>
                            <a
                              href="/GF_Machining.pdf"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline text-xs"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              View Financial Report
                            </a>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {ptt.issuer_bank?.organization || ptt.issuer_bank?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${purchasePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ptt.currency} {faceValue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                          ${expectedReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-semibold">
                          {discountRate}%
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
