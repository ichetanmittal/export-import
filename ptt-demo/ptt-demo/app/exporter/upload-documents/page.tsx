'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useRouter } from 'next/navigation';

interface PTT {
  id: string;
  amount: number;
  currency: string;
  status: string;
  maturity_date: string;
  trade_description?: string;
}

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  file_size_kb: number;
  approval_status: string;
  created_at: string;
}

export default function UploadDocumentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [ptts, setPtts] = useState<PTT[]>([]);
  const [selectedPttId, setSelectedPttId] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('commercial_invoice');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchPTTs(parsedUser.id);
  }, [router]);

  const fetchPTTs = async (userId: string) => {
    try {
      const response = await fetch(`/api/ptt/user/${userId}`);
      const data = await response.json();

      // Filter for transferred PTTs that need documents
      const transferredPtts = data.data?.filter(
        (ptt: PTT) => ptt.status === 'transferred' || ptt.status === 'redeemable'
      ) || [];

      setPtts(transferredPtts);

      if (transferredPtts.length > 0) {
        setSelectedPttId(transferredPtts[0].id);
        fetchDocuments(transferredPtts[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch PTTs:', error);
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

  const handlePttChange = (pttId: string) => {
    setSelectedPttId(pttId);
    fetchDocuments(pttId);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 10MB' });
        return;
      }
      setSelectedFile(file);
      setMessage(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile || !selectedPttId || !user) {
      setMessage({ type: 'error', text: 'Please select a PTT and file to upload' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('ptt_id', selectedPttId);
      formData.append('uploaded_by_id', user.id);
      formData.append('document_type', documentType);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setMessage({ type: 'success', text: 'Document uploaded successfully!' });
      setSelectedFile(null);

      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Refresh documents list
      fetchDocuments(selectedPttId);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload document' });
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout role="exporter">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Upload Shipping Documents</h1>
          <button
            onClick={() => router.push('/exporter/dashboard')}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            ← Back to Dashboard
          </button>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {ptts.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg text-center">
            <p className="text-gray-600">No transferred PTTs found. You need a transferred PTT to upload documents.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Form */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Upload New Document</h2>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select PTT
                  </label>
                  <select
                    value={selectedPttId}
                    onChange={(e) => handlePttChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {ptts.map((ptt) => (
                      <option key={ptt.id} value={ptt.id}>
                        {ptt.currency} {ptt.amount.toLocaleString()} - {ptt.status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Type
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="commercial_invoice">Commercial Invoice</option>
                    <option value="bill_of_lading">Bill of Lading</option>
                    <option value="packing_list">Packing List</option>
                    <option value="certificate_of_origin">Certificate of Origin</option>
                    <option value="insurance_certificate">Insurance Certificate</option>
                    <option value="inspection_certificate">Inspection Certificate</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select File (Max 10MB)
                  </label>
                  <input
                    id="file-input"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Accepted: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG
                  </p>
                </div>

                {selectedFile && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-700">
                      <strong>Selected:</strong> {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Size: {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!selectedFile || uploading}
                  className={`w-full py-2 px-4 rounded-md font-medium ${
                    !selectedFile || uploading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </button>
              </form>
            </div>

            {/* Documents List */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Uploaded Documents</h2>

              {loadingDocs ? (
                <p className="text-gray-500">Loading documents...</p>
              ) : documents.length === 0 ? (
                <p className="text-gray-500">No documents uploaded yet.</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="border border-gray-200 rounded-md p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{doc.file_name}</p>
                          <p className="text-xs text-gray-500">
                            Type: {doc.document_type.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-gray-500">
                            Size: {doc.file_size_kb} KB
                          </p>
                        </div>
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
