import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import api from '@/lib/api-client'
import { Button } from '@/components/ui'

type Status = 'loading' | 'success' | 'error' | 'expired'

export default function InvitationAcceptPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<Status>('loading')
  const [orgName, setOrgName] = useState('')
  const [role, setRole] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMsg('No invitation token found in the URL.')
      return
    }

    const acceptInvitation = async () => {
      try {
        const res = await api.post(`/organizations/invitations/accept`, { token })
        setOrgName(res.data.organization_name || 'the organization')
        setRole(res.data.role || 'member')
        setStatus('success')
      } catch (err: any) {
        const detail = err.response?.data?.detail || ''
        if (detail.toLowerCase().includes('expired') || detail.toLowerCase().includes('invalid')) {
          setStatus('expired')
          setErrorMsg(detail)
        } else {
          setStatus('error')
          setErrorMsg(detail || 'Failed to accept invitation. Please try again or contact support.')
        }
      }
    }

    acceptInvitation()
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Processing Invitation</h1>
            <p className="text-gray-500">Please wait while we verify your invitation...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to the Team!</h1>
            <p className="text-gray-600 mb-2">
              You've successfully joined <span className="font-semibold text-gray-900">{orgName}</span>.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Your role: <span className="font-medium text-primary-600 capitalize">{role}</span>
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/my-organizations')} className="w-full">
                View My Organizations
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                Go to Home
              </Button>
            </div>
          </>
        )}

        {status === 'expired' && (
          <>
            <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitation Expired</h1>
            <p className="text-gray-600 mb-6">
              {errorMsg || 'This invitation has expired or already been used. Please request a new invitation from the organization manager.'}
            </p>
            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
              Return Home
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something Went Wrong</h1>
            <p className="text-gray-600 mb-6">{errorMsg}</p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/login')} className="w-full">
                Log In &amp; Try Again
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                Return Home
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
