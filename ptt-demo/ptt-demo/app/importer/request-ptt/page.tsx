'use client';

import DashboardLayout from '@/components/shared/DashboardLayout';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function RequestPTTPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    maturityDays: '90',
    tradeDescription: '',
    incoterms: 'FOB'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');

      const response = await fetch('/api/ptt/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          importer_id: user.id,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          maturity_days: parseInt(formData.maturityDays),
          trade_description: formData.tradeDescription,
          incoterms: formData.incoterms
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create PTT request');
      }

      toast.success('PTT Requested Successfully!', {
        description: `PTT Number: ${data.data.ptt_number}`,
        duration: 5000,
      });
      router.push('/importer/dashboard');
    } catch (err: any) {
      toast.error('Failed to Create PTT Request', {
        description: err.message,
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="importer">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Request New PTT</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                required
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="100000"
              />
              <select
                value={formData.currency}
                onChange={(e) => setFormData({...formData, currency: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maturity (Days) *
            </label>
            <input
              type="number"
              required
              value={formData.maturityDays}
              onChange={(e) => setFormData({...formData, maturityDays: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="90"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Incoterms *
            </label>
            <select
              value={formData.incoterms}
              onChange={(e) => setFormData({...formData, incoterms: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="FOB">FOB - Free On Board</option>
              <option value="CIF">CIF - Cost, Insurance & Freight</option>
              <option value="EXW">EXW - Ex Works</option>
              <option value="DDP">DDP - Delivered Duty Paid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trade Description
            </label>
            <textarea
              value={formData.tradeDescription}
              onChange={(e) => setFormData({...formData, tradeDescription: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Import of electronics from China..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Requesting...' : 'Request PTT'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/importer/dashboard')}
              className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
