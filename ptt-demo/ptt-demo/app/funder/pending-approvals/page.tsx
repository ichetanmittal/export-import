'use client';

import DashboardLayout from '@/components/shared/DashboardLayout';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PendingAction {
  id: string;
  action_type: 'accept_offer';
  ptt_id: string | null;
  initiated_by: string;
  approved_by: string | null;
  status: 'pending' | 'approved' | 'rejected';
  action_data: any;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  initiated_by_user: any;
  ptt?: any;
}

export default function FunderPendingApprovalsPage() {
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchPendingActions(parsedUser);
    }
  }, []);

  const fetchPendingActions = async (userData: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/bank/pending-actions?status=pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter for accept_offer actions only
        const funderActions = data.data?.filter((action: any) => action.action_type === 'accept_offer') || [];
        setPendingActions(funderActions);
      }
    } catch (error) {
      console.error('Error fetching pending actions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (actionId: string) => {
    setProcessing(actionId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/bank/pending-actions/${actionId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ approved_by: user.id })
      });

      if (!response.ok) {
        throw new Error('Failed to approve action');
      }

      toast.success('Action Approved!', {
        description: 'The offer has been accepted successfully',
        duration: 4000
      });

      fetchPendingActions(user);
    } catch (error: any) {
      toast.error('Failed to Approve', {
        description: error.message,
        duration: 4000
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (actionId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(actionId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/bank/pending-actions/${actionId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          approved_by: user.id,
          rejection_reason: rejectionReason
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reject action');
      }

      toast.success('Action Rejected', {
        description: 'The action has been rejected',
        duration: 4000
      });

      setSelectedAction(null);
      setRejectionReason('');
      fetchPendingActions(user);
    } catch (error: any) {
      toast.error('Failed to Reject', {
        description: error.message,
        duration: 4000
      });
    } finally {
      setProcessing(null);
    }
  };

  const canApprove = user?.funder_role === 'checker' || user?.funder_role === 'admin';

  return (
    <DashboardLayout role="funder">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Actions Awaiting Approval</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : pendingActions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending actions
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Offer Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asking Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Initiated By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingActions.map((action) => (
                    <tr key={action.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Accept Offer
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Offer ID: {action.action_data?.offer_id?.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                        ${action.action_data?.asking_price ? parseFloat(action.action_data.asking_price).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {action.initiated_by_user?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(action.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {canApprove ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(action.id)}
                              disabled={processing === action.id}
                              className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 disabled:opacity-50"
                            >
                              {processing === action.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => setSelectedAction(action.id)}
                              disabled={processing === action.id}
                              className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">Approval restricted to checkers</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {selectedAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Reject Action</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this action:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Enter rejection reason..."
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleReject(selectedAction)}
                disabled={processing === selectedAction}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {processing === selectedAction ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
              <button
                onClick={() => {
                  setSelectedAction(null);
                  setRejectionReason('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
