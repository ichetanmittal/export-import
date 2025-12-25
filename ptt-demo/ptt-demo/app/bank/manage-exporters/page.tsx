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

export default function ManageExportersPage() {
  const [clients, setClients] = useState<BankClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [funderOrgId, setFunderOrgId] = useState<string>('');

  const [inviteForm, setInviteForm] = useState({
    clientName: '',
    email: '',
    phone: '',
    geography: '',
    country: '',
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

      if (parsedUser.organization_id) {
        setFunderOrgId(parsedUser.organization_id);
        fetchClients(parsedUser.organization_id);
      }
    }
  }, []);

  const fetchClients = async (orgId: string) => {
    try {
      const response = await fetch(`/api/bank/clients?bankOrgId=${orgId}&relationshipType=financing`);
      const data = await response.json();

      if (data.data) {
        setClients(data.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load exporters');
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
          bankOrgId: funderOrgId,
          clientName: inviteForm.clientName,
          clientType: 'exporter',
          email: inviteForm.email,
          phone: inviteForm.phone,
          geography: inviteForm.geography,
          country: inviteForm.country,
          creditLimit: 0, // Exporters don't need credit limits from funders
          relationshipType: 'financing',
          pocName: inviteForm.pocName,
          pocEmail: inviteForm.pocEmail,
          pocPhone: inviteForm.pocPhone,
          pocPassword: inviteForm.pocPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Exporter invited successfully');
        setShowInviteModal(false);
        setInviteForm({
          clientName: '',
          email: '',
          phone: '',
          geography: '',
          country: '',
          pocName: '',
          pocEmail: '',
          pocPhone: '',
          pocPassword: '',
        });
        fetchClients(funderOrgId);

        if (data.data?.invitation) {
          alert(`Exporter Credentials:\nEmail: ${data.data.invitation.email}\nPassword: ${data.data.invitation.temporaryPassword}\n\nPlease share these credentials securely with the exporter.`);
        }
      } else {
        toast.error(data.error || 'Failed to invite exporter');
      }
    } catch (error) {
      console.error('Error inviting exporter:', error);
      toast.error('Failed to invite exporter');
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="bank">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading exporters...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="bank">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Exporters</h1>
            <p className="text-gray-600 mt-1">Financing - Onboard and manage your exporter clients</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            + Invite Exporter
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Exporters</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{clients.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Active Exporters</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {clients.filter(c => c.is_active).length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Geographies Covered</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {new Set(clients.map(c => c.client_org.geography).filter(Boolean)).size}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Exporter Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Geography / Region
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  POC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Onboarded
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{client.client_org.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.client_org.email}</div>
                    <div className="text-sm text-gray-500">{client.client_org.phone || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {client.client_org.geography || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">{client.client_org.country || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.client_org.poc_name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{client.client_org.poc_email || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      client.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {client.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(client.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {clients.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No exporters found. Invite your first exporter to get started.</p>
            </div>
          )}
        </div>

        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Invite New Exporter</h2>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Geography / Region *
                    </label>
                    <input
                      type="text"
                      required
                      value={inviteForm.geography}
                      onChange={(e) => setInviteForm({ ...inviteForm, geography: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., Asia Pacific, Europe, Middle East"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country *
                    </label>
                    <input
                      type="text"
                      required
                      value={inviteForm.country}
                      onChange={(e) => setInviteForm({ ...inviteForm, country: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Point of Contact (POC)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        POC Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={inviteForm.pocName}
                        onChange={(e) => setInviteForm({ ...inviteForm, pocName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Invite Exporter
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
