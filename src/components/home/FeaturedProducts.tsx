import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/products/ProductCard';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          images:product_images(*),
          variants:product_variants(*)
        `)
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(4);

      if (!error && data) {
        setProducts(data as unknown as Product[]);
      }
      setIsLoading(false);
    };

    fetchFeaturedProducts();
  }, []);

  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="flex items-end justify-between mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-muted-foreground font-sans font-medium uppercase tracking-wider text-sm">
              Curated Selection
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-medium text-primary mt-2">
              Featured Products
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Button variant="ghost" asChild className="hidden sm:flex font-sans">
              <Link to="/shop?filter=featured">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading
            ? Array(4).fill(0).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[3/4] rounded-lg" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))
            : products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
          }
        </div>

        {products.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-sans">
              No featured products yet. Check back soon!
            </p>
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Button variant="outline" asChild className="font-sans">
            <Link to="/shop?filter=featured">
              View All Featured
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}