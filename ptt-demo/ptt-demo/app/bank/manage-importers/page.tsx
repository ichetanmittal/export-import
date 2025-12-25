'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { toast } from 'sonner';

interface BankClient {
  id: string;
  client_org: {
    id: string;
    name: string;
    email: string;
    phone: string;
    geography: string;
    country: string;
    poc_name: string;
    poc_email: string;
    poc_phone: string;
  };
  credit_limit: number;
  credit_used: number;
  relationship_type: string;
  is_active: boolean;
  created_at: string;
}

export default function ManageImportersPage() {
  const [clients, setClients] = useState<BankClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingLimit, setEditingLimit] = useState<string | null>(null);
  const [newLimit, setNewLimit] = useState('');

  const [user, setUser] = useState<any>(null);
  const [bankOrgId, setBankOrgId] = useState<string>('');

  // Invitation form
  const [inviteForm, setInviteForm] = useState({
    clientName: '',
    email: '',
    phone: '',
    geography: '',
    country: '',
    creditLimit: '',
    pocName: '',
    pocEmail: '',
    pocPhone: '',
    pocPassword: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // Get organization ID
      if (parsedUser.organization_id) {
        setBankOrgId(parsedUser.organization_id);
        fetchClients(parsedUser.organization_id);
      }
    }
  }, []);

  const fetchClients = async (orgId: string) => {
    try {
      const response = await fetch(`/api/bank/clients?bankOrgId=${orgId}&relationshipType=issuing`);
      const data = await response.json();

      if (data.data) {
        setClients(data.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load importers');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/bank/clients/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankOrgId,
          clientName: inviteForm.clientName,
          clientType: 'importer',
          email: inviteForm.email,
          phone: inviteForm.phone,
          geography: inviteForm.geography,
          country: inviteForm.country,
          creditLimit: parseFloat(inviteForm.creditLimit) || 0,
          relationshipType: 'issuing',
          pocName: inviteForm.pocName,
          pocEmail: inviteForm.pocEmail,
          pocPhone: inviteForm.pocPhone,
          pocPassword: inviteForm.pocPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Importer invited successfully');
        setShowInviteModal(false);
        setInviteForm({
          clientName: '',
          email: '',
          phone: '',
          geography: '',
          country: '',
          creditLimit: '',
          pocName: '',
          pocEmail: '',
          pocPhone: '',
          pocPassword: '',
        });
        fetchClients(bankOrgId);

        // Show credentials to bank user
        if (data.data?.invitation) {
          alert(`Importer Credentials:\nEmail: ${data.data.invitation.email}\nPassword: ${data.data.invitation.temporaryPassword}\n\nPlease share these credentials securely with the importer.`);
        }
      } else {
        toast.error(data.error || 'Failed to invite importer');
      }
    } catch (error) {
      console.error('Error inviting importer:', error);
      toast.error('Failed to invite importer');
    }
  };

  const handleUpdateLimit = async (clientId: string) => {
    try {
      const response = await fetch(`/api/bank/clients/${clientId}/limit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditLimit: parseFloat(newLimit) }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Credit limit updated successfully');
        setEditingLimit(null);
        setNewLimit('');
        fetchClients(bankOrgId);
      } else {
        toast.error(data.error || 'Failed to update limit');
      }
    } catch (error) {
      console.error('Error updating limit:', error);
      toast.error('Failed to update limit');
    }
  };

  const calculateAvailableCredit = (limit: number, used: number) => {
    return limit - used;
  };

  const calculateUtilization = (limit: number, used: number) => {
    if (limit === 0) return 0;
    return (used / limit) * 100;
  };

  if (loading) {
    return (
      <DashboardLayout role="bank">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading importers...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="bank">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Importers</h1>
            <p className="text-gray-600 mt-1">Issuing - Onboard and manage your importer clients</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            + Invite Importer
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Importers</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{clients.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Active Importers</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {clients.filter(c => c.is_active).length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Credit Issued</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              ${clients.reduce((sum, c) => sum + c.credit_limit, 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Credit Utilized</div>
            <div className="text-2xl font-bold text-orange-600 mt-1">
              ${clients.reduce((sum, c) => sum + c.credit_used, 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Importers Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Importer Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Geography
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credit Limit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available Credit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{client.client_org.name}</div>
                    <div className="text-sm text-gray-500">POC: {client.client_org.poc_name || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.client_org.email}</div>
                    <div className="text-sm text-gray-500">{client.client_org.phone || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.client_org.geography || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{client.client_org.country || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingLimit === client.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={newLimit}
                          onChange={(e) => setNewLimit(e.target.value)}
                          className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="New limit"
                        />
                        <button
                          onClick={() => handleUpdateLimit(client.id)}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingLimit(null);
                            setNewLimit('');
                          }}
                          className="text-gray-600 hover:text-gray-800 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="text-sm font-medium text-gray-900">
                        ${client.credit_limit.toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${calculateAvailableCredit(client.credit_limit, client.credit_used).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            calculateUtilization(client.credit_limit, client.credit_used) > 80
                              ? 'bg-red-600'
                              : calculateUtilization(client.credit_limit, client.credit_used) > 50
                              ? 'bg-yellow-600'
                              : 'bg-green-600'
                          }`}
                          style={{
                            width: `${Math.min(100, calculateUtilization(client.credit_limit, client.credit_used))}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-900">
                        {calculateUtilization(client.credit_limit, client.credit_used).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {editingLimit !== client.id && (
                      <button
                        onClick={() => {
                          setEditingLimit(client.id);
                          setNewLimit(client.credit_limit.toString());
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit Limit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {clients.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No importers found. Invite your first importer to get started.</p>
            </div>
          )}
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Invite New Importer</h2>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={inviteForm.clientName}
                      onChange={(e) => setInviteForm({ ...inviteForm, clientName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={inviteForm.phone}
                      onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Geography
                    </label>
                    <input
                      type="text"
                      value={inviteForm.geography}
                      onChange={(e) => setInviteForm({ ...inviteForm, geography: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Asia Pacific, Europe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={inviteForm.country}
                      onChange={(e) => setInviteForm({ ...inviteForm, country: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credit Limit (USD) *
                    </label>
                    <input
                      type="number"
                      required
                      value={inviteForm.creditLimit}
                      onChange={(e) => setInviteForm({ ...inviteForm, creditLimit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Point of Contact (POC)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        POC Name
                      </label>
                      <input
                        type="text"
                        value={inviteForm.pocName}
                        onChange={(e) => setInviteForm({ ...inviteForm, pocName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        POC Email
                      </label>
                      <input
                        type="email"
                        value={inviteForm.pocEmail}
                        onChange={(e) => setInviteForm({ ...inviteForm, pocEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Defaults to company email"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        POC Phone
                      </label>
                      <input
                        type="text"
                        value={inviteForm.pocPhone}
                        onChange={(e) => setInviteForm({ ...inviteForm, pocPhone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Temporary Password *
                      </label>
                      <input
                        type="text"
                        required
                        value={inviteForm.pocPassword}
                        onChange={(e) => setInviteForm({ ...inviteForm, pocPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., TempPass123!"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Invite Importer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
