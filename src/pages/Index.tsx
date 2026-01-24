import { MainLayout } from '@/components/layout/MainLayout';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { CategoryShowcase } from '@/components/home/CategoryShowcase';
import { NewArrivals } from '@/components/home/NewArrivals';
import { PromoSection } from '@/components/home/PromoSection';

const Index = () => {
  return (
    <MainLayout>
      <HeroSection />
      <FeaturedProducts />
      <CategoryShowcase />
      <NewArrivals />
      <PromoSection />
    </MainLayout>
  );
};

export default Index;