'use client';

import DashboardLayout from '@/components/shared/DashboardLayout';
import { useEffect, useState } from 'react';

export default function FunderDashboard() {
  const [offers, setOffers] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    fetchMarketplace();
    fetchPortfolio();
  }, []);

  const fetchMarketplace = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/discounting/marketplace', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setOffers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching marketplace:', error);
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  const handleAcceptOffer = async (offerId: string, askingPrice: number) => {
    if (!confirm(`Accept this offer for $${askingPrice.toLocaleString()}?`)) return;

    setAccepting(offerId);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');

      const response = await fetch('/api/discounting/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          offer_id: offerId,
          funder_id: user.id,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to accept offer');
      }

      alert('Offer accepted! Payment processed and PTT transferred to your portfolio.');
      fetchMarketplace();
      fetchPortfolio();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setAccepting(null);
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
    availableOffers: offers.length,
    portfolioPtts: portfolio.length,
    portfolioValue: portfolio.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
    expectedReturns: portfolio.reduce((sum, p) => {
      // Simple calculation - in real system would use actual purchase price
      return sum + parseFloat(p.amount || 0) * 0.05;
    }, 0),
  };

  return (
    <DashboardLayout role="funder">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Available Offers</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">{stats.availableOffers}</p>
          </div>
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

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border-2 border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors">
              <div className="text-lg font-semibold">Browse Marketplace</div>
              <div className="text-sm text-gray-500 mt-1">Find PTTs to purchase</div>
            </button>
            <button className="p-4 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
              <div className="text-lg font-semibold">My Portfolio</div>
              <div className="text-sm text-gray-500 mt-1">View owned PTTs</div>
            </button>
            <button className="p-4 border-2 border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-colors">
              <div className="text-lg font-semibold">Settlement Tracking</div>
              <div className="text-sm text-gray-500 mt-1">Monitor maturity dates</div>
            </button>
          </div>
        </div>

        {/* Marketplace Offers */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Marketplace - Available PTTs</h2>
            <button
              onClick={() => { fetchMarketplace(); fetchPortfolio(); }}
              className="text-orange-600 hover:text-orange-700 text-sm"
            >
              🔄 Refresh
            </button>
          </div>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : offers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No PTTs available in marketplace
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PTT Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Face Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asking Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Maturity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Left</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {offers.map((offer) => (
                    <tr key={offer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {offer.ptt?.ptt_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {offer.ptt?.currency} {parseFloat(offer.ptt?.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                        ${parseFloat(offer.asking_price).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-semibold">
                        {offer.discount_rate}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(offer.ptt?.maturity_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {calculateDaysToMaturity(offer.ptt?.maturity_date)} days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleAcceptOffer(offer.id, parseFloat(offer.asking_price))}
                          disabled={accepting === offer.id}
                          className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50"
                        >
                          {accepting === offer.id ? 'Processing...' : 'Accept Offer'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Portfolio */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">My Portfolio</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : portfolio.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No PTTs in portfolio yet
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
