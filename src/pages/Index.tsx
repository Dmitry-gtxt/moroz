import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { PriceCalendarStrip } from '@/components/home/PriceCalendarStrip';
import { HowItWorks } from '@/components/home/HowItWorks';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { TopPerformers } from '@/components/home/TopPerformers';
import { CTASection } from '@/components/home/CTASection';
import { NewYearCountdown } from '@/components/home/NewYearCountdown';
import { SEOHead } from '@/components/seo/SEOHead';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-winter-950">
      <SEOHead />
      <Header />
      <main className="flex-1">
        <HeroSection />
        <NewYearCountdown />
        <PriceCalendarStrip />
        <HowItWorks />
        <TopPerformers />
        <FeaturesSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
