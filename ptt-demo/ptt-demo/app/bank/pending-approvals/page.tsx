'use client';

import DashboardLayout from '@/components/shared/DashboardLayout';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PendingAction {
  id: string;
  action_type: 'issue_ptt' | 'settle_ptt';
  ptt_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
  action_data: any;
  created_at: string;
  initiated_by_user?: {
    id: string;
    name: string;
    email: string;
    organization: string;
  };
  ptt?: {
    ptt_number: string;
    amount: number;
    currency: string;
    maturity_date: string;
    original_importer?: {
      id: string;
      name: string;
      email: string;
      organization: string;
    };
  };
}

export default function PendingApprovalsPage() {
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchPendingActions();
  }, []);

  const fetchPendingActions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/bank/pending-actions?status=pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingActions(data.data || []);
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
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const response = await fetch(`/api/bank/pending-actions/${actionId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          approved_by: user.id
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to approve action');
      }

      toast.success('Action Approved!', {
        description: 'The action has been executed successfully',
        duration: 4000,
      });
      fetchPendingActions();
    } catch (error: any) {
      toast.error('Approval Failed', {
        description: error.message,
        duration: 4000,
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (actionId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Rejection Reason Required', {
        description: 'Please provide a reason for rejection',
        duration: 3000,
      });
      return;
    }

    setProcessing(actionId);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

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
        const data = await response.json();
        throw new Error(data.error || 'Failed to reject action');
      }

      toast.success('Action Rejected', {
        description: 'The action has been rejected',
        duration: 4000,
      });
      setSelectedAction(null);
      setRejectionReason('');
      fetchPendingActions();
    } catch (error: any) {
      toast.error('Rejection Failed', {
        description: error.message,
        duration: 4000,
      });
    } finally {
      setProcessing(null);
    }
  };

  const getActionTypeLabel = (type: string) => {
    switch (type) {
      case 'issue_ptt':
        return 'Issue PTT';
      case 'settle_ptt':
        return 'Settle PTT';
      default:
        return type;
    }
  };

  const getActionTypeColor = (type: string) => {
    switch (type) {
      case 'issue_ptt':
        return 'bg-blue-100 text-blue-800';
      case 'settle_ptt':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if user is a checker or admin
  const canApprove = user?.bank_role === 'checker' || user?.bank_role === 'admin';

  return (
    <DashboardLayout role="bank">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
          <div className="text-sm text-gray-600">
            {canApprove ? (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                Checker Access
              </span>
            ) : (
              <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full font-medium">
                View Only
              </span>
            )}
          </div>
        </div>

        {!canApprove && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              ℹ️ <strong>Note:</strong> You need Checker or Admin role to approve actions.
            </p>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Actions Awaiting Approval</h2>
            <span className="text-sm text-gray-600">
              {pendingActions.length} pending {pendingActions.length === 1 ? 'action' : 'actions'}
            </span>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : pendingActions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No pending actions</p>
              <p className="text-sm mt-2">
                Actions submitted by makers will appear here for approval
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PTT Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requester</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Initiated By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingActions.map((action) => (
                    <tr key={action.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionTypeColor(action.action_type)}`}>
                          {getActionTypeLabel(action.action_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {action.ptt?.ptt_number || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {action.ptt ? `${action.ptt.currency} ${parseFloat(action.ptt.amount.toString()).toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div>
                          <p className="font-medium">{action.ptt?.original_importer?.name || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{action.ptt?.original_importer?.organization || ''}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div>
                          <p className="font-medium">{action.initiated_by_user?.name || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{action.initiated_by_user?.organization || ''}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(action.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        {canApprove ? (
                          <>
                            <button
                              onClick={() => handleApprove(action.id)}
                              disabled={processing === action.id}
                              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
                            >
                              {processing === action.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAction(action.id);
                                setRejectionReason('');
                              }}
                              disabled={processing === action.id}
                              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 font-medium"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs">Approval restricted</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Rejection Modal */}
        {selectedAction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">Reject Action</h2>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for rejecting this action:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-3 mb-4 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={4}
                placeholder="Enter rejection reason..."
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setSelectedAction(null);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedAction)}
                  disabled={processing === selectedAction || !rejectionReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {processing === selectedAction ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
