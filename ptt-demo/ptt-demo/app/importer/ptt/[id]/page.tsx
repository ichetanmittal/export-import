'use client';

import DashboardLayout from '@/components/shared/DashboardLayout';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';

export default function PTTDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const pttId = params.id as string;

  const [ptt, setPtt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showLockForm, setShowLockForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);

  // Lock form state
  const [exporterEmail, setExporterEmail] = useState('');

  useEffect(() => {
    fetchPTTDetails();
  }, [pttId]);

  const fetchPTTDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/ptt/${pttId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPtt(data.data);
      }
    } catch (error) {
      console.error('Error fetching PTT details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLockPTT = async () => {
    if (!exporterEmail) {
      toast.warning('Missing Information', {
        description: 'Please enter exporter email',
      });
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Create standard conditions
      const conditions = [
        {
          condition_type: 'time' as const,
          condition_key: 'maturity_date',
          condition_value: ptt.maturity_date,
        },
        {
          condition_type: 'action' as const,
          condition_key: 'document_approval',
          condition_value: 'required',
        },
        {
          condition_type: 'data' as const,
          condition_key: 'beneficiary_email',
          condition_value: exporterEmail,
        },
      ];

      const response = await fetch('/api/ptt/lock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ptt_id: pttId,
          conditions,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to lock PTT');
      }

      toast.success('PTT Locked and Transferred!', {
        description: 'The PTT has been locked with conditions and transferred to exporter',
        duration: 4000,
      });
      setShowLockForm(false);
      fetchPTTDetails();
    } catch (error: any) {
      toast.error('Failed to Lock PTT', {
        description: error.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransferPTT = async () => {
    if (!exporterEmail) {
      toast.warning('Missing Information', {
        description: 'Please enter exporter email to transfer',
      });
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // First, find exporter by email
      const userResponse = await fetch(`/api/auth/user-by-email?email=${exporterEmail}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!userResponse.ok) {
        throw new Error('Exporter not found');
      }

      const exporterData = await userResponse.json();
      const exporterId = exporterData.data.id;

      const response = await fetch('/api/ptt/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ptt_id: pttId,
          from_user_id: user.id,
          to_user_id: exporterId,
          transfer_type: 'conditional_payment',
        })
      });

      if (!response.ok) {
        throw new Error('Failed to transfer PTT');
      }

      toast.success('PTT Transferred Successfully!', {
        description: `Transferred to ${exporterEmail}`,
        duration: 4000,
      });
      setShowTransferForm(false);
      router.push('/importer/dashboard');
    } catch (error: any) {
      toast.error('Failed to Transfer PTT', {
        description: error.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: any = {
      requested: 'bg-yellow-100 text-yellow-800',
      issued: 'bg-blue-100 text-blue-800',
      locked: 'bg-purple-100 text-purple-800',
      transferred: 'bg-indigo-100 text-indigo-800',
      redeemable: 'bg-green-100 text-green-800',
      discounted: 'bg-orange-100 text-orange-800',
      settled: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout role="importer">
        <div className="text-center py-8">Loading PTT details...</div>
      </DashboardLayout>
    );
  }

  if (!ptt) {
    return (
      <DashboardLayout role="importer">
        <div className="text-center py-8 text-red-600">PTT not found</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="importer">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PTT Details</h1>
            <p className="text-gray-600 mt-1">{ptt.ptt_number}</p>
          </div>
          <button
            onClick={() => router.push('/importer/dashboard')}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* PTT Information Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-semibold">PTT Information</h2>
            {getStatusBadge(ptt.status)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="text-lg font-semibold">
                {ptt.currency} {parseFloat(ptt.amount).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Maturity Date</p>
              <p className="text-lg font-semibold">
                {new Date(ptt.maturity_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Backing Type</p>
              <p className="text-lg font-semibold capitalize">{ptt.backing_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Incoterms</p>
              <p className="text-lg font-semibold">{ptt.incoterms || 'N/A'}</p>
            </div>
            {ptt.trade_description && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Trade Description</p>
                <p className="text-base">{ptt.trade_description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {ptt.status === 'issued' && !showLockForm && (
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Next Step: Lock PTT</h3>
            <p className="text-blue-700 mb-4">
              Lock this PTT with conditions before transferring to the exporter.
            </p>
            <button
              onClick={() => setShowLockForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Lock PTT with Conditions
            </button>
          </div>
        )}

        {/* Lock Form */}
        {showLockForm && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Lock PTT with Conditions</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exporter Email *
                </label>
                <input
                  type="email"
                  value={exporterEmail}
                  onChange={(e) => setExporterEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="exporter@demo.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The exporter who will receive this PTT
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm font-semibold mb-2">Conditions to be set:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Time: Maturity date - {new Date(ptt.maturity_date).toLocaleDateString()}</li>
                  <li>• Action: Document approval required</li>
                  <li>• Data: Beneficiary - {exporterEmail || 'Enter email above'}</li>
                </ul>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleLockPTT}
                  disabled={actionLoading}
                  className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Locking...' : 'Lock PTT'}
                </button>
                <button
                  onClick={() => setShowLockForm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {ptt.status === 'locked' && !showTransferForm && (
          <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">Next Step: Transfer PTT</h3>
            <p className="text-purple-700 mb-4">
              Transfer this locked PTT to the exporter.
            </p>
            <button
              onClick={() => setShowTransferForm(true)}
              className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700"
            >
              Transfer to Exporter
            </button>
          </div>
        )}

        {/* Transfer Form */}
        {showTransferForm && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Transfer PTT to Exporter</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exporter Email *
                </label>
                <input
                  type="email"
                  value={exporterEmail}
                  onChange={(e) => setExporterEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="exporter@demo.com"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                <p className="text-sm text-yellow-800">
                  ⚠️ This action will transfer ownership of the PTT to the exporter.
                  The exporter will then be able to upload shipping documents.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleTransferPTT}
                  disabled={actionLoading}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Transferring...' : 'Transfer PTT'}
                </button>
                <button
                  onClick={() => setShowTransferForm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {ptt.status === 'transferred' && (
          <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-2">PTT Transferred</h3>
            <p className="text-green-700">
              This PTT has been transferred to the exporter.
              You will be notified when documents are uploaded for approval.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
