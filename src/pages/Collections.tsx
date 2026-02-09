import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import fitnessModel from '@/assets/fitness-model.jpeg';
import groupFitness from '@/assets/group-fitness.jpg';
import navyPose from '@/assets/navy-pose.jpg';
import tennisWhite from '@/assets/tennis-white.png';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

const FALLBACK_IMAGES: Record<string, string> = {
  men: navyPose,
  women: fitnessModel,
  accessories: tennisWhite,
};

export default function Collections() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      setCategories(data || []);
      setIsLoading(false);
    };
    fetchCategories();
  }, []);

  const featuredCollections = [
    {
      title: 'New Arrivals',
      description: 'The latest drops — fresh styles built for performance.',
      image: tennisWhite,
      href: '/shop?filter=new',
    },
    {
      title: 'Training Essentials',
      description: 'Gear engineered for every rep, every set, every day.',
      image: groupFitness,
      href: '/shop?tag=training',
    },
  ];

  return (
    <MainLayout>
      <main className="min-h-screen">
        {/* Hero */}
        <section className="relative h-[40vh] min-h-[320px] bg-secondary overflow-hidden">
          <img src={navyPose} alt="Collections" className="absolute inset-0 w-full h-full object-cover object-top opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/70 to-transparent" />
          <div className="relative container h-full flex flex-col justify-end pb-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-4xl md:text-5xl font-bold text-secondary-foreground"
            >
              Collections
            </motion.h1>
            <p className="mt-2 text-secondary-foreground/80 text-lg max-w-xl">
              Explore our curated collections of performance apparel.
            </p>
          </div>
        </section>

        {/* Featured Collections */}
        <section className="container py-16">
          <h2 className="font-display text-2xl font-semibold mb-8">Featured</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {featuredCollections.map((col, i) => (
              <Link key={col.title} to={col.href} className="group">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative aspect-[16/9] rounded-lg overflow-hidden"
                >
                  <img src={col.image} alt={col.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6">
                    <h3 className="font-display text-2xl font-semibold text-white">{col.title}</h3>
                    <p className="text-white/80 text-sm mt-1">{col.description}</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        {/* Shop by Category */}
        <section className="container pb-16">
          <h2 className="font-display text-2xl font-semibold mb-8">Shop by Category</h2>
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat, i) => (
                <Link key={cat.id} to={`/shop/${cat.slug}`} className="group">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative aspect-[3/4] rounded-lg overflow-hidden"
                  >
                    <img
                      src={cat.image_url || FALLBACK_IMAGES[cat.slug] || fitnessModel}
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-6">
                      <h3 className="font-display text-xl font-semibold text-white">{cat.name}</h3>
                      {cat.description && <p className="text-white/70 text-sm mt-1">{cat.description}</p>}
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </MainLayout>
  );
}
