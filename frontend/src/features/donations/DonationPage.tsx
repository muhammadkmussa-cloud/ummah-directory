import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Heart, ArrowLeft } from 'lucide-react'
import api from '@/lib/api-client'
import { Button, Input, Card } from '@/components/ui'
import { usePayment } from '@/contexts/PaymentContext'

export default function DonationPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const charityId = searchParams.get('charity')

  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('KES')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { initiatePayment } = usePayment()

  const { data: charities } = useQuery({
    queryKey: ['charities', 'list'],
    queryFn: () => api.get('/charities', { params: { size: 50 } }).then(r => r.data),
  })

  const { data: selectedCharity } = useQuery({
    queryKey: ['charity', charityId],
    queryFn: () => api.get(`/charities/${charityId}`).then(r => r.data),
    enabled: !!charityId,
  })

  const handleDonate = async () => {
    setError('')
    setSuccess('')
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }
    if (!charityId) {
      setError('Please select a charity')
      return
    }

    const campaignId = searchParams.get('campaign')

    initiatePayment({
      amount: parseFloat(amount),
      currency,
      reference_type: 'donation',
      reference_id: charityId,
      metadata: campaignId ? { campaign_id: campaignId } : {},
      onSuccess: (payment_id) => {
        setSuccess('Donation successful! Thank you.')
        navigate(`/receipt/${payment_id}`)
      },
      onCancel: () => {
        setError('Payment was cancelled.')
      }
    })
  }

  const presetAmounts = [500, 1000, 2000, 5000, 10000]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-2xl font-bold mb-6">Make a Donation</h1>

      {selectedCharity && (
        <Card className="mb-6">
          <div className="flex items-center gap-3">
            <Heart className="w-10 h-10 text-red-500" />
            <div>
              <h3 className="font-medium">{selectedCharity.name}</h3>
              {selectedCharity.mission_statement && (
                <p className="text-sm text-gray-600">{selectedCharity.mission_statement}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6 space-y-4">
        {!charityId && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Select Charity</label>
            <select
              value={charityId || ''}
              onChange={(e) => {
                const val = e.target.value
                navigate(val ? `/donate?charity=${val}` : '/donate')
              }}
              className="input-field"
            >
              <option value="">Choose a charity</option>
              {charities?.items?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Currency</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input-field">
            <option value="KES">KES - Kenyan Shilling</option>
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {presetAmounts.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset.toString())}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  amount === preset.toString()
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {currency === 'KES' ? 'KSh ' : ''}{preset.toLocaleString()}
              </button>
            ))}
          </div>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Or enter custom amount"
            min="1"
          />
        </div>

        {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

        <Button className="w-full" onClick={handleDonate} loading={loading}>
          <Heart className="w-4 h-4 mr-2" /> Donate {amount ? `${currency} ${parseFloat(amount).toLocaleString()}` : ''}
        </Button>
      </Card>
    </div>
  )
}
