import { Helmet } from 'react-helmet-async';
import LandingNavigation from './LandingNavigation';
import HeroSection from './sections/HeroSection';
import StatisticsSection from './sections/StatisticsSection';
import FeaturesSection from './sections/FeaturesSection';
import CategoriesSection from './sections/CategoriesSection';
import ShowcaseCarousel from './sections/ShowcaseCarousel';
import TimelineSection from './sections/TimelineSection';
import TestimonialsSection from './sections/TestimonialsSection';
import SecuritySection from './sections/SecuritySection';
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
        <StatisticsSection />
        <FeaturesSection />
        <CategoriesSection />
        <ShowcaseCarousel />
        <TimelineSection />
        <TestimonialsSection />
        <SecuritySection />
        <FaqSection />
      </main>

      <LandingFooter />
    </div>
  );
}
