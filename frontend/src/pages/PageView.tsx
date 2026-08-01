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
  about: {
    title: 'About Us',
    body: `## About ummah Directory\n\nummah Directory is the premier platform connecting the global Muslim community with verified halal businesses, mosques, charities, and educational institutions.\n\n## Our Mission\n\nTo build a trusted, transparent directory that empowers community members to discover, support, and connect with organizations that share their values.\n\n## What We Offer\n\n- Verified halal businesses and services\n- Local mosque listings with prayer times\n- Trusted charities and donation campaigns\n- Islamic educational institutions\n- Community events and gatherings\n\n## Our Values\n\nTransparency, trust, and community empowerment guide everything we build. Every organization on our platform goes through a verification process to ensure authenticity.`,
  },
  contact: {
    title: 'Contact Us',
    body: `## Get in Touch\n\nWe would love to hear from you. Whether you have a question, feedback, or partnership inquiry, our team is here to help.\n\n## Email\n\nsupport@ummahdirectory.com\n\n## Business Inquiries\n\npartnerships@ummahdirectory.com\n\n## Support\n\nFor account or listing issues, please log in and use the notification system to reach our support team.\n\n## Response Time\n\nWe aim to respond to all inquiries within 24-48 business hours.`,
  },
  faq: {
    title: 'Frequently Asked Questions',
    body: `## General Questions\n\n- **Is it free to list my business?** Yes! Basic listings are completely free.\n- **How do you verify organizations?** Our moderation team manually reviews every submission with documentation checks.\n- **Can I accept donations?** Yes, registered charities can integrate with Stripe, PayPal, and M-Pesa.\n- **Do I need an account?** No, anyone can browse. An account is needed to leave reviews and save favorites.\n\n## For Businesses\n\n- **How do I claim my listing?** Register an account and use the Claim feature on your business page.\n- **What is Premier status?** Premier listings get priority ranking and enhanced visibility.\n- **Can I upgrade later?** Yes, you can upgrade to Premier at any time from your dashboard.`,
  },
  pricing: {
    title: 'Pricing',
    body: `## Simple, Transparent Pricing\n\n## Free Plan\n\n- Basic listing with essential details\n- Community reviews and ratings\n- Map visibility\n- Basic analytics\n\n## Premier — $49/month\n\n- Priority search ranking\n- Enhanced profile with cover photos and gallery\n- Featured placement in category results\n- Advanced analytics dashboard\n- Ad campaign access\n- Premier badge on listing\n\n## Enterprise\n\nFor multi-location organizations and large charities, contact us for custom pricing and dedicated support.`,
  },
  resources: {
    title: 'Resources',
    body: `## Community Resources\n\n## For Business Owners\n\n- Listing optimization guide\n- Photography best practices\n- Review management tips\n- Analytics dashboard walkthrough\n\n## For Charities\n\n- Campaign setup guide\n- Donor engagement strategies\n- Payment integration walkthrough\n- Compliance and transparency best practices\n\n## For Mosques\n\n- Prayer times configuration\n- Community event management\n- Member engagement tools\n\n## Help Center\n\nNeed help? Log in and contact our support team through the notifications panel.`,
  },
  verification: {
    title: 'Verification Process',
    body: `## How Verification Works\n\nEvery organization on ummah Directory goes through a thorough verification process to ensure trust and authenticity.\n\n## Step 1: Submission\n\nSubmit your organization details including official registration documents, contact information, and proof of address.\n\n## Step 2: Document Review\n\nOur moderation team reviews all submitted documentation for authenticity and completeness.\n\n## Step 3: Cross-Reference\n\nWe cross-reference your information with public records and community sources.\n\n## Step 4: Approval\n\nOnce verified, your listing receives a Verified badge and becomes fully visible in the directory.\n\n## Timeline\n\nMost verifications are completed within 3-5 business days. Complex cases may take longer.`,
  },
  premier: {
    title: 'Premier Listings',
    body: `## Premier Listings\n\nStand out from the crowd with a Premier listing on ummah Directory.\n\n## Benefits\n\n- Priority ranking in search results\n- Premier verification badge\n- Enhanced profile with gallery and cover photos\n- Featured placement in category pages\n- Access to advertising campaigns\n- Advanced analytics and insights\n\n## Pricing\n\n$49/month with no long-term commitment. Cancel anytime.\n\n## How to Upgrade\n\n1. Claim your organization listing\n2. Navigate to your dashboard\n3. Click the Premier Upgrade option\n4. Complete payment\n\nYour Premier status activates immediately after payment confirmation.`,
  },
  advertise: {
    title: 'Advertise on ummah Directory',
    body: `## Reach Our Community\n\nAdvertise your business, event, or campaign to our engaged community of users.\n\n## Ad Formats\n\n- **Homepage Banner** — High visibility placement on the main explore page\n- **Search Results** — Appear alongside organic search results\n- **Sidebar** — Contextual ads in the right sidebar\n\n## How It Works\n\n1. Create an account and claim your organization\n2. Navigate to your Owner Dashboard\n3. Open the Advertising tab\n4. Create your campaign with image, link, and budget\n5. Submit for review\n\n## Budget\n\nCampaigns start at $50 minimum budget. You only pay for approved campaigns.\n\n## Contact Sales\n\nFor custom advertising packages, email partnerships@ummahdirectory.com.`,
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
