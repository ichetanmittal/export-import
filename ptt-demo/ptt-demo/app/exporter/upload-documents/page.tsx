'use client';

import DashboardLayout from '@/components/shared/DashboardLayout';
import { useRouter } from 'next/navigation';

export default function UploadDocumentsPage() {
  const router = useRouter();

  return (
    <DashboardLayout role="exporter">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Upload Shipping Documents</h1>

        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Document Upload Feature</h3>
          <p className="text-blue-700 mb-4">
            This feature requires Supabase Storage integration for file uploads.
            For the demo, document approval flow can be simulated using the API directly.
          </p>
          <button
            onClick={() => router.push('/exporter/dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
