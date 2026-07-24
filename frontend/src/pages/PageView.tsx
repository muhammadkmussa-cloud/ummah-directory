import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api-client'

const fallbackContent: Record<string, { title: string; body: string }> = {
  privacy: {
    title: 'Privacy Policy',
    body: `## Privacy Policy\n\nWe collect information you provide when creating an account, submitting listings, or making donations. This includes your name, email address, phone number, and payment references.\n\nWe use this information to operate the platform, process donations, and communicate with you about your account.\n\nWe do not store credit card numbers. All payment processing is handled by trusted third-party payment providers.\n\nYou may request deletion of your account and associated data by contacting us.\n\nLast updated: July 2026`,
  },
  terms: {
    title: 'Terms of Service',
    body: `## Terms of Service\n\nBy using ummah Directory, you agree to provide accurate information and not misuse the platform for fraudulent purposes.\n\nListing owners are responsible for the accuracy of their information. The platform reserves the right to remove content that violates community guidelines.\n\nDonations are processed through third-party payment gateways. The platform is not responsible for disputes between donors and charities.`,
  },
  cookies: {
    title: 'Cookie Policy',
    body: `## Cookie Policy\n\nWe use essential cookies for authentication and security. We may use analytics cookies to improve the platform experience.\n\nYou can control cookies through your browser settings.\n\nWe do not use cookies for tracking or advertising purposes without your consent.`,
  },
  'donation-policy': {
    title: 'Donation Policy',
    body: `## Donation Policy\n\nAll donations are processed through verified charities. Donors receive a receipt for each completed donation.\n\nRefunds are processed only in cases of duplicate payments, technical failures, or cancelled campaigns where funds have not yet been distributed.\n\nCompleted donations to successful campaigns are generally final.`,
  },
  'refund-policy': {
    title: 'Refund Policy',
    body: `## Refund Policy\n\nRefund requests must be submitted within 14 days of the donation.\n\nEligible reasons include: duplicate payment, technical payment failure, or campaign cancellation before fund distribution.\n\nRefunds are processed within 5-10 business days after approval.`,
  },
}

export default function PageView() {
  const { slug } = useParams<{ slug: string }>()

  const { data: cmsPage } = useQuery({
    queryKey: ['cms-page', slug],
    queryFn: () => api.get(`/cms/pages/${slug}`).then(r => r.data).catch(() => null),
  })

  const fallback = slug ? fallbackContent[slug] : null

  const title = cmsPage?.title || fallback?.title || 'Page Not Found'
  const body = cmsPage?.content || fallback?.body || 'The requested page could not be found.'

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">{title}</h1>
      <div className="prose max-w-none text-gray-700">
        {body.split('\n').map((line: string, i: number) => {
          if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-semibold mt-6 mb-2">{line.slice(3)}</h2>
          if (line.startsWith('- ')) return <li key={i} className="ml-4 text-gray-600">{line.slice(2)}</li>
          if (line.trim() === '') return <br key={i} />
          return <p key={i} className="mb-2 text-gray-600">{line}</p>
        })}
      </div>
    </div>
  )
}
