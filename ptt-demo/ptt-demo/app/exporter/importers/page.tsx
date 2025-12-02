'use client';

import DashboardLayout from '@/components/shared/DashboardLayout';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function ExporterImportersPage() {
  const [connections, setConnections] = useState<any[]>([]);
  const [receivedInvitations, setReceivedInvitations] = useState<any[]>([]);
  const [sentInvitations, setSentInvitations] = useState<any[]>([]);
  const [allImporters, setAllImporters] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchData(parsedUser);
    }
  }, []);

  const fetchData = async (userData: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Fetch connections
      const connectionsRes = await fetch(
        `/api/connections?user_id=${userData.id}&role=${userData.role}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (connectionsRes.ok) {
        const data = await connectionsRes.json();
        setConnections(data.data || []);
      }

      // Fetch invitations
      const invitationsRes = await fetch(
        `/api/connections/invitations?user_id=${userData.id}&user_email=${userData.email}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (invitationsRes.ok) {
        const data = await invitationsRes.json();
        setReceivedInvitations(data.received || []);
        setSentInvitations(data.sent || []);
      }

      // Fetch all importers
      const importersRes = await fetch(
        `/api/users/by-role?role=importer`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (importersRes.ok) {
        const data = await importersRes.json();
        setAllImporters(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setInviting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/connections/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sender_id: user.id,
          receiver_email: inviteEmail,
          receiver_role: 'importer',
          message: inviteMessage
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send invitation');
      }

      toast.success('Invitation Sent!', {
        description: `An invitation has been sent to ${inviteEmail}`,
        duration: 4000
      });

      setShowInviteModal(false);
      setInviteEmail('');
      setInviteMessage('');
      fetchData(user);
    } catch (error: any) {
      toast.error('Failed to Send Invitation', {
        description: error.message,
        duration: 4000
      });
    } finally {
      setInviting(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/connections/invitations/${invitationId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: user.id })
      });

      if (!response.ok) {
        throw new Error('Failed to accept invitation');
      }

      toast.success('Invitation Accepted!', {
        description: 'You are now connected',
        duration: 4000
      });

      fetchData(user);
    } catch (error: any) {
      toast.error('Failed to Accept Invitation', {
        description: error.message,
        duration: 4000
      });
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/connections/invitations/${invitationId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to reject invitation');
      }

      toast.success('Invitation Rejected');
      fetchData(user);
    } catch (error: any) {
      toast.error('Failed to Reject Invitation', {
        description: error.message,
        duration: 4000
      });
    }
  };

  return (
    <DashboardLayout role="exporter">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">My Importers</h1>
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Invite Importer
          </button>
        </div>

        {/* Received Invitations */}
        {receivedInvitations.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-yellow-800 mb-4">
              Pending Invitations ({receivedInvitations.length})
            </h2>
            <div className="space-y-3">
              {receivedInvitations.map((invitation) => (
                <div key={invitation.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">{invitation.sender?.name}</p>
                    <p className="text-sm text-gray-600">{invitation.sender?.email}</p>
                    {invitation.sender?.organization && (
                      <p className="text-sm text-gray-500">{invitation.sender.organization}</p>
                    )}
                    {invitation.message && (
                      <p className="text-sm text-gray-700 mt-2 italic">"{invitation.message}"</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptInvitation(invitation.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectInvitation(invitation.id)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sent Invitations */}
        {sentInvitations.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-800 mb-4">
              Sent Invitations ({sentInvitations.length})
            </h2>
            <div className="space-y-2">
              {sentInvitations.map((invitation) => (
                <div key={invitation.id} className="bg-white p-3 rounded flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{invitation.receiver_email}</p>
                    <p className="text-xs text-gray-500">
                      Sent {new Date(invitation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connected Importers */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Connected Importers</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : connections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">No importers connected yet</p>
              <p className="text-sm">Click "Invite Importer" to send an invitation</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Connected Since</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {connections.map((connection) => (
                    <tr key={connection.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {connection.user?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {connection.user?.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {connection.user?.organization || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(connection.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* All Importers Directory */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">All Importers</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : allImporters.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No importers available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allImporters.map((importer) => {
                    const isConnected = connections.some(c => c.user?.id === importer.id);
                    const hasSentInvite = sentInvitations.some(inv => inv.receiver_email === importer.email);
                    const hasReceivedInvite = receivedInvitations.some(inv => inv.sender?.email === importer.email);

                    return (
                      <tr key={importer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {importer.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {importer.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {importer.organization || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isConnected ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Connected
                            </span>
                          ) : hasSentInvite ? (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              Invite Sent
                            </span>
                          ) : hasReceivedInvite ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              Pending Response
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                              Not Connected
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {!isConnected && !hasSentInvite && !hasReceivedInvite && (
                            <button
                              onClick={() => {
                                setInviteEmail(importer.email);
                                setShowInviteModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Invite
                            </button>
                          )}
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

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Invite Importer</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Importer Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="importer@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Add a personal message..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSendInvite}
                disabled={inviting}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {inviting ? 'Sending...' : 'Send Invitation'}
              </button>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                  setInviteMessage('');
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
