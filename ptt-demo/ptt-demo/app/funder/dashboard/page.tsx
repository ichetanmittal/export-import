'use client';

import DashboardLayout from '@/components/shared/DashboardLayout';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function FunderDashboard() {
  const [offers, setOffers] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
    fetchMarketplace();
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

          // For funder users, fetch total treasury from all users in the same organization
          if (freshUser.role === 'funder' && freshUser.organization) {
            const funderResponse = await fetch(`/api/funder/treasury/${encodeURIComponent(freshUser.organization)}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });

            if (funderResponse.ok) {
              const funderData = await funderResponse.json();
              // Override individual balance with funder's total treasury
              freshUser.balance = funderData.totalTreasury;
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

  const fetchMarketplace = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/discounting/marketplace', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        let filteredOffers = data.data || [];

        // Get pending accept_offer actions to filter them out
        const pendingActionsRes = await fetch(
          '/api/bank/pending-actions?status=pending',
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (pendingActionsRes.ok) {
          const pendingData = await pendingActionsRes.json();
          const pendingOfferIds = new Set(
            pendingData.data
              ?.filter((action: any) => action.action_type === 'accept_offer')
              ?.map((action: any) => action.action_data?.offer_id) || []
          );

          // Filter out offers that have pending actions
          filteredOffers = filteredOffers.filter(
            (offer: any) => !pendingOfferIds.has(offer.id)
          );
        }

        setOffers(filteredOffers);
      }
    } catch (error) {
      console.error('Error fetching marketplace:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (offerId: string, askingPrice: number) => {
    setAccepting(offerId);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');

      // Check if user is a maker or has admin/checker role
      if (user.funder_role === 'maker') {
        // Create pending action for approval
        const response = await fetch('/api/bank/pending-actions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            action_type: 'accept_offer',
            initiated_by: user.id,
            action_data: {
              offer_id: offerId,
              funder_id: user.id,
              asking_price: askingPrice
            }
          })
        });

        if (!response.ok) {
          throw new Error('Failed to submit offer acceptance for approval');
        }

        toast.success('Offer Acceptance Submitted!', {
          description: 'Waiting for checker approval to proceed',
          duration: 4000,
        });
      } else {
        // Direct accept for admin/checker or users without funder_role
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

        toast.success('Offer Accepted!', {
          description: 'Payment processed and PTT transferred to your portfolio',
          duration: 5000,
        });
      }

      fetchMarketplace();
    } catch (error: any) {
      toast.error('Failed to Accept Offer', {
        description: error.message,
        duration: 4000,
      });
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
    totalInvestmentAvailable: offers.reduce((sum, o) => sum + parseFloat(o.asking_price || 0), 0),
  };

  return (
    <DashboardLayout role="funder">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Account Balance</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              ${user?.balance ? parseFloat(user.balance).toLocaleString() : '0'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Available funds</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Available Offers</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.availableOffers}</p>
            <p className="text-xs text-gray-400 mt-1">In marketplace</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Investment Available</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">${stats.totalInvestmentAvailable.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">Combined asking price</p>
          </div>
        </div>

        {/* Marketplace Offers */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Available PTTs for Investment</h2>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exporter Report</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issuing Bank</th>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-gray-900">
                            {offer.exporter?.name || 'N/A'}
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
                        {offer.ptt?.issuer_bank?.organization || offer.ptt?.issuer_bank?.name || 'N/A'}
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
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
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
