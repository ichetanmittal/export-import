'use client';

import DashboardLayout from '@/components/shared/DashboardLayout';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size_kb: number;
  approval_status: string;
  created_at: string;
  uploaded_by?: any;
}

export default function ReviewDocumentsPage() {
  const router = useRouter();
  const [ptts, setPtts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [selectedPtt, setSelectedPtt] = useState<any | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    fetchPTTsWithDocuments();
  }, []);

  const fetchPTTsWithDocuments = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/ptt/user/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter PTTs that have been transferred and need document approval
        const needsApproval = data.data.filter((ptt: any) =>
          ptt.status === 'transferred' && ptt.original_importer_id === user.id
        );
        setPtts(needsApproval);
      }
    } catch (error) {
      console.error('Error fetching PTTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (pttId: string) => {
    setLoadingDocs(true);
    try {
      const response = await fetch(`/api/documents?ptt_id=${pttId}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const viewDocuments = (ptt: any) => {
    setSelectedPtt(ptt);
    fetchDocuments(ptt.id);
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const supabase = createClient();

      // Get signed URL
      const { data, error } = await supabase.storage
        .from('ptt-documents')
        .createSignedUrl(filePath, 3600); // Valid for 1 hour

      if (error) {
        alert('Failed to generate download link');
        return;
      }

      // Open in new tab
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  const handleApproveDocuments = async (pttId: string) => {
    if (!confirm('Approve all documents and mark PTT as redeemable?')) return;

    setApproving(pttId);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // Approve documents - this will also mark PTT as redeemable
      const response = await fetch('/api/documents/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ptt_id: pttId,
          approved_by_id: user.id,
          approved: true,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to approve documents');
      }

      alert('Documents approved! PTT is now redeemable.');
      fetchPTTsWithDocuments();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setApproving(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: any = {
      transferred: 'bg-indigo-100 text-indigo-800',
      redeemable: 'bg-green-100 text-green-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <DashboardLayout role="importer">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Review Documents</h1>
          <button
            onClick={() => router.push('/importer/dashboard')}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">PTTs Awaiting Document Approval</h2>
            <button
              onClick={fetchPTTsWithDocuments}
              className="text-purple-600 hover:text-purple-700 text-sm"
            >
              🔄 Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : ptts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No PTTs awaiting document approval</p>
              <p className="text-sm mt-2">
                PTTs will appear here after being transferred to exporters
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PTT Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Maturity Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {ptts.map((ptt) => (
                    <tr key={ptt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {ptt.ptt_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ptt.currency} {parseFloat(ptt.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(ptt.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(ptt.maturity_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => viewDocuments(ptt)}
                          className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-xs"
                        >
                          View Docs
                        </button>
                        <button
                          onClick={() => handleApproveDocuments(ptt.id)}
                          disabled={approving === ptt.id}
                          className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 text-xs"
                        >
                          {approving === ptt.id ? 'Approving...' : 'Approve'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <p className="text-sm text-blue-700">
            ℹ️ <strong>Note:</strong> Click "View Docs" to see uploaded documents. Click "Approve" to mark all documents
            as approved and make the PTT redeemable for discounting.
          </p>
        </div>

        {/* Documents Modal */}
        {selectedPtt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold">Documents for PTT</h2>
                    <p className="text-sm text-gray-600">
                      {selectedPtt.currency} {parseFloat(selectedPtt.amount).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPtt(null);
                      setDocuments([]);
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6">
                {loadingDocs ? (
                  <div className="text-center py-8 text-gray-500">Loading documents...</div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No documents uploaded yet for this PTT.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900">{doc.file_name}</h3>
                              <span className={`text-xs px-2 py-1 rounded ${
                                doc.approval_status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : doc.approval_status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {doc.approval_status}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Type:</span> {doc.document_type.replace('_', ' ')}
                              </div>
                              <div>
                                <span className="font-medium">Size:</span> {doc.file_size_kb} KB
                              </div>
                              <div>
                                <span className="font-medium">Uploaded:</span>{' '}
                                {new Date(doc.created_at).toLocaleDateString()}
                              </div>
                              {doc.uploaded_by && (
                                <div>
                                  <span className="font-medium">By:</span> {doc.uploaded_by.name}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => downloadFile(doc.file_path, doc.file_name)}
                            className="ml-4 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setSelectedPtt(null);
                      setDocuments([]);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Close
                  </button>
                  {documents.length > 0 && (
                    <button
                      onClick={() => {
                        handleApproveDocuments(selectedPtt.id);
                        setSelectedPtt(null);
                        setDocuments([]);
                      }}
                      disabled={approving === selectedPtt.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {approving === selectedPtt.id ? 'Approving...' : 'Approve All Documents'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
