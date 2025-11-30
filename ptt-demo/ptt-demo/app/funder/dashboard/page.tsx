'use client';

import DashboardLayout from '@/components/shared/DashboardLayout';
import { useEffect, useState } from 'react';

export default function FunderDashboard() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    fetchMarketplace();
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

  return (
    <DashboardLayout role="funder">
      <div className="space-y-6">
        {/* Marketplace Offers */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Marketplace - Available PTTs</h2>
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
      </div>
    </DashboardLayout>
  );
}
