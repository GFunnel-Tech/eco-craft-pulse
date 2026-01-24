import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useRef } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

// Fallback images for categories without images
const FALLBACK_IMAGES: Record<string, string> = {
  men: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000&auto=format&fit=crop',
  women: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=1000&auto=format&fit=crop',
  accessories: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?q=80&w=1000&auto=format&fit=crop',
  tennis: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=1000&auto=format&fit=crop',
  golf: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=1000&auto=format&fit=crop',
  yoga: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000&auto=format&fit=crop',
  training: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop',
  running: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=1000&auto=format&fit=crop',
  default: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000&auto=format&fit=crop',
};

export function CategoryShowcase() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  const getCategoryImage = (category: { slug: string; image_url: string | null }) => {
    if (category.image_url) return category.image_url;
    return FALLBACK_IMAGES[category.slug.toLowerCase()] || FALLBACK_IMAGES.default;
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <span className="text-muted-foreground font-sans font-medium uppercase tracking-wider text-sm">
              Explore
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-medium text-primary mt-2">
              Shop By Sport
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[4/5] bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!categories?.length) {
    return null;
  }

  return (
    <section className="py-20 bg-background">
      <div className="container">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-muted-foreground font-sans font-medium uppercase tracking-wider text-sm">
            Explore
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-medium text-primary mt-2">
            Shop By Sport
          </h2>
        </motion.div>

        <Carousel
          opts={{
            align: "start",
            loop: categories.length > 3,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {categories.map((category, index) => (
              <CarouselItem key={category.id} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link 
                    to={`/shop/${category.slug}`}
                    className="group block relative aspect-[4/5] rounded-lg overflow-hidden border border-transparent hover:border-muted-foreground transition-colors"
                  >
                    {/* Image */}
                    <img
                      src={getCategoryImage(category)}
                      alt={category.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent" />

                    {/* Content */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                      <h3 className="font-display text-2xl font-medium text-primary-foreground mb-1">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-sm text-primary-foreground/70 mb-4 font-sans line-clamp-2">
                          {category.description}
                        </p>
                      )}
                      <div className="flex items-center text-primary-foreground font-sans font-medium text-sm group-hover:gap-2 transition-all">
                        Shop Now
                        <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {categories.length > 3 && (
            <>
              <CarouselPrevious className="hidden md:flex -left-12 border-border hover:bg-muted hover:border-muted-foreground" />
              <CarouselNext className="hidden md:flex -right-12 border-border hover:bg-muted hover:border-muted-foreground" />
            </>
          )}
        </Carousel>
      </div>
    </section>
  );
}