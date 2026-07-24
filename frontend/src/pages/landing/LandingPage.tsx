import { Helmet } from 'react-helmet-async';
import LandingNavigation from './LandingNavigation';
import HeroSection from './sections/HeroSection';
import FeaturesSection from './sections/FeaturesSection';
import TimelineSection from './sections/TimelineSection';
import FaqSection from './sections/FaqSection';
import LandingFooter from './LandingFooter';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-50 font-sans selection:bg-emerald-200 selection:text-emerald-900 overflow-x-hidden">
      <Helmet>
        <title>ummah Directory - Discover Trusted Businesses & Services</title>
        <meta name="description" content="Discover, connect, and support your community with ummah Directory. Find verified businesses, mosques, charities, and services." />
        <meta property="og:title" content="ummah Directory" />
        <meta property="og:description" content="Discover, connect, and support your community." />
      </Helmet>

      <LandingNavigation />
      
      <main>
        <HeroSection />
        <FeaturesSection />
        <TimelineSection />
        <FaqSection />
      </main>

      <LandingFooter />
    </div>
  );
}
