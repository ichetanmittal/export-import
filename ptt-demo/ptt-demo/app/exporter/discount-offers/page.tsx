'use client';

import DashboardLayout from '@/components/shared/DashboardLayout';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function DiscountOffersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pttIdFromQuery = searchParams.get('ptt');

  const [ptts, setPtts] = useState<any[]>([]);
  const [selectedPtt, setSelectedPtt] = useState<string>(pttIdFromQuery || '');
  const [discountRate, setDiscountRate] = useState('5');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingOffer, setExistingOffer] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchRedeemablePTTs();
  }, []);

  const fetchRedeemablePTTs = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/ptt/user/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const redeemable = data.data.filter((ptt: any) => ptt.status === 'redeemable');
        setPtts(redeemable);

        if (pttIdFromQuery && redeemable.find((p: any) => p.id === pttIdFromQuery)) {
          setSelectedPtt(pttIdFromQuery);
          checkExistingOffer(pttIdFromQuery);
        }
      }
    } catch (error) {
      console.error('Error fetching PTTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingOffer = async (pttId: string) => {
    try {
      const response = await fetch(`/api/discounting/marketplace`);
      if (response.ok) {
        const data = await response.json();
        const offer = data.offers?.find((o: any) =>
          o.ptt_id === pttId && o.status === 'available'
        );

        if (offer) {
          setExistingOffer(offer);
          setDiscountRate(offer.discount_rate.toString());
          setIsEditing(true);
        } else {
          setExistingOffer(null);
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error('Error checking existing offer:', error);
    }
  };

  const handlePttChange = (pttId: string) => {
    setSelectedPtt(pttId);
    checkExistingOffer(pttId);
  };

  const handleSubmitOffer = async () => {
    if (!selectedPtt) {
      alert('Please select a PTT');
      return;
    }

    const rate = parseFloat(discountRate);
    if (rate < 0.1 || rate > 20) {
      alert('Discount rate must be between 0.1% and 20%');
      return;
    }

    setSubmitting(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      const ptt = ptts.find(p => p.id === selectedPtt);

      if (!ptt) {
        throw new Error('Selected PTT not found');
      }

      const faceValue = parseFloat(ptt.amount);
      const askingPrice = faceValue * (1 - rate / 100);

      if (isEditing && existingOffer) {
        // Update existing offer
        const response = await fetch('/api/discounting/offer', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            offer_id: existingOffer.id,
            asking_price: askingPrice,
            discount_rate: rate,
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update discount offer');
        }

        alert('Discount offer updated successfully!');
      } else {
        // Create new offer
        const response = await fetch('/api/discounting/offer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ptt_id: selectedPtt,
            exporter_id: user.id,
            asking_price: askingPrice,
            discount_rate: rate,
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create discount offer');
        }

        alert('Discount offer created successfully! Your PTT is now listed in the marketplace.');
      }

      router.push('/exporter/dashboard');
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const calculateAskingPrice = () => {
    if (!selectedPtt) return 0;
    const ptt = ptts.find(p => p.id === selectedPtt);
    if (!ptt) return 0;

    const faceValue = parseFloat(ptt.amount);
    const rate = parseFloat(discountRate) || 0;
    return faceValue * (1 - rate / 100);
  };

  const selectedPttData = ptts.find(p => p.id === selectedPtt);

  return (
    <DashboardLayout role="exporter">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{isEditing ? 'Edit' : 'Create'} Discount Offer</h1>
          <button
            onClick={() => router.push('/exporter/dashboard')}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ← Back to Dashboard
          </button>
        </div>

        {isEditing && existingOffer && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              ℹ️ <strong>Editing existing offer</strong> - An offer already exists for this PTT. Update the discount rate below.
            </p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : ptts.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">No Redeemable PTTs</h3>
            <p className="text-yellow-700">
              You don't have any redeemable PTTs yet. PTTs become redeemable after the importer approves your documents.
            </p>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Offer Details</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select PTT *
                  </label>
                  <select
                    value={selectedPtt}
                    onChange={(e) => handlePttChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">-- Select a PTT --</option>
                    {ptts.map((ptt) => (
                      <option key={ptt.id} value={ptt.id}>
                        {ptt.ptt_number} - {ptt.currency} {parseFloat(ptt.amount).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPttData && (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-semibold mb-2">Selected PTT Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">PTT Number</p>
                        <p className="font-medium">{selectedPttData.ptt_number}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Face Value</p>
                        <p className="font-medium">
                          {selectedPttData.currency} {parseFloat(selectedPttData.amount).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Maturity Date</p>
                        <p className="font-medium">
                          {new Date(selectedPttData.maturity_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Days to Maturity</p>
                        <p className="font-medium">
                          {Math.ceil((new Date(selectedPttData.maturity_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Rate (%) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="20"
                    value={discountRate}
                    onChange={(e) => setDiscountRate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="5.0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Rate between 0.1% and 20%
                  </p>
                </div>

                {selectedPtt && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-md">
                    <h4 className="font-semibold text-green-900 mb-2">Calculation Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Face Value:</span>
                        <span className="font-medium">
                          {selectedPttData?.currency} {parseFloat(selectedPttData?.amount || '0').toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Discount Rate:</span>
                        <span className="font-medium">{discountRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Discount Amount:</span>
                        <span className="font-medium text-red-600">
                          - ${(parseFloat(selectedPttData?.amount || '0') * parseFloat(discountRate) / 100).toLocaleString()}
                        </span>
                      </div>
                      <div className="border-t border-green-300 pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="text-gray-900 font-semibold">You Receive:</span>
                          <span className="font-bold text-green-700 text-lg">
                            ${calculateAskingPrice().toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
              <p className="text-sm text-blue-700">
                ℹ️ <strong>Note:</strong> Once you create this offer, your PTT will be listed in the marketplace for funders to purchase.
                You'll receive the asking price immediately upon acceptance.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSubmitOffer}
                disabled={!selectedPtt || submitting}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {submitting
                  ? (isEditing ? 'Updating Offer...' : 'Creating Offer...')
                  : (isEditing ? 'Update Discount Offer' : 'Create Discount Offer')
                }
              </button>
              <button
                onClick={() => router.push('/exporter/dashboard')}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function DiscountOffersPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <DiscountOffersContent />
    </Suspense>
  );
}
