'use client';

import DashboardLayout from '@/components/shared/DashboardLayout';
import { useEffect, useState } from 'react';

export default function FunderDashboard() {
  const [offers, setOffers] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch marketplace offers and portfolio from API
    setLoading(false);
  }, []);

  return (
    <DashboardLayout role="funder">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Available Offers</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">0</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Portfolio PTTs</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Portfolio Value</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">$0</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Expected Returns</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">$0</p>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days to Maturity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Offer rows will go here */}
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
                  {/* Portfolio rows will go here */}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
