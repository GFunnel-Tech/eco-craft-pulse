import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Grid3X3, LayoutGrid, X } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductFilters, FilterState } from '@/components/shop/ProductFilters';
import { ProductSort, SortOption } from '@/components/shop/ProductSort';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Product, Category } from '@/types';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [gridCols, setGridCols] = useState<3 | 4>(4);

  // Get initial values from URL
  const initialFilters: FilterState = {
    categories: searchParams.get('category')?.split(',').filter(Boolean) || [],
    priceRange: [
      Number(searchParams.get('minPrice')) || 0,
      Number(searchParams.get('maxPrice')) || 500,
    ],
    sizes: searchParams.get('sizes')?.split(',').filter(Boolean) || [],
    colors: searchParams.get('colors')?.split(',').filter(Boolean) || [],
    onSale: searchParams.get('sale') === 'true',
    inStock: searchParams.get('inStock') === 'true',
  };

  const initialSort = (searchParams.get('sort') as SortOption) || 'newest';
  const searchQuery = searchParams.get('search') || '';
  const filterPreset = searchParams.get('filter');

  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [sortBy, setSortBy] = useState<SortOption>(initialSort);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (data) setCategories(data as Category[]);
    };
    fetchCategories();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          images:product_images(*),
          variants:product_variants(*)
        `)
        .eq('is_active', true);

      // Apply filter preset
      if (filterPreset === 'new') {
        query = query.eq('is_new', true);
      } else if (filterPreset === 'featured') {
        query = query.eq('is_featured', true);
      } else if (filterPreset === 'sale') {
        query = query.not('compare_at_price', 'is', null);
      }

      // Apply search
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Apply category filter
      if (filters.categories.length > 0) {
        // Get category IDs from slugs
        const { data: categoryData } = await supabase
          .from('categories')
          .select('id')
          .in('slug', filters.categories);
        
        if (categoryData && categoryData.length > 0) {
          query = query.in('category_id', categoryData.map(c => c.id));
        }
      }

      // Apply price range
      query = query
        .gte('price', filters.priceRange[0])
        .lte('price', filters.priceRange[1]);

      // Apply sale filter
      if (filters.onSale) {
        query = query.not('compare_at_price', 'is', null);
      }

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'price-asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price-desc':
          query = query.order('price', { ascending: false });
          break;
        case 'name-asc':
          query = query.order('name', { ascending: true });
          break;
        case 'name-desc':
          query = query.order('name', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (!error && data) {
        let filteredProducts = data as unknown as Product[];

        // Client-side filtering for variants (sizes/colors)
        if (filters.sizes.length > 0) {
          filteredProducts = filteredProducts.filter(p => 
            p.variants?.some(v => v.size && filters.sizes.includes(v.size))
          );
        }

        if (filters.colors.length > 0) {
          filteredProducts = filteredProducts.filter(p => 
            p.variants?.some(v => v.color && filters.colors.includes(v.color))
          );
        }

        if (filters.inStock) {
          filteredProducts = filteredProducts.filter(p => 
            p.variants?.some(v => v.stock_quantity > 0)
          );
        }

        setProducts(filteredProducts);
      }
      
      setIsLoading(false);
    };

    fetchProducts();
  }, [filters, sortBy, searchQuery, filterPreset]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.categories.length > 0) params.set('category', filters.categories.join(','));
    if (filters.priceRange[0] > 0) params.set('minPrice', String(filters.priceRange[0]));
    if (filters.priceRange[1] < 500) params.set('maxPrice', String(filters.priceRange[1]));
    if (filters.sizes.length > 0) params.set('sizes', filters.sizes.join(','));
    if (filters.colors.length > 0) params.set('colors', filters.colors.join(','));
    if (filters.onSale) params.set('sale', 'true');
    if (filters.inStock) params.set('inStock', 'true');
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (searchQuery) params.set('search', searchQuery);
    if (filterPreset) params.set('filter', filterPreset);
    
    setSearchParams(params, { replace: true });
  }, [filters, sortBy]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 500) count++;
    if (filters.sizes.length > 0) count++;
    if (filters.colors.length > 0) count++;
    if (filters.onSale) count++;
    if (filters.inStock) count++;
    return count;
  }, [filters]);

  const clearAllFilters = () => {
    setFilters({
      categories: [],
      priceRange: [0, 500],
      sizes: [],
      colors: [],
      onSale: false,
      inStock: false,
    });
  };

  const getPageTitle = () => {
    if (searchQuery) return `Search: "${searchQuery}"`;
    if (filterPreset === 'new') return 'New Arrivals';
    if (filterPreset === 'featured') return 'Featured';
    if (filterPreset === 'sale') return 'Sale';
    return 'All Products';
  };

  return (
    <MainLayout>
      <div className="bg-background min-h-screen">
        {/* Page Header */}
        <div className="border-b border-border bg-muted/30">
          <div className="container py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                {getPageTitle()}
              </h1>
              <p className="text-muted-foreground mt-2">
                {isLoading ? 'Loading...' : `${products.length} products`}
              </p>
            </motion.div>
          </div>
        </div>

        <div className="container py-8">
          <div className="flex gap-8">
            {/* Desktop Sidebar Filters */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-foreground">Filters</h2>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                      Clear all
                    </Button>
                  )}
                </div>
                <ProductFilters
                  filters={filters}
                  onChange={setFilters}
                  categories={categories}
                />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  {/* Mobile Filter Button */}
                  <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="lg:hidden">
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        Filters
                        {activeFilterCount > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {activeFilterCount}
                          </Badge>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80">
                      <SheetHeader>
                        <SheetTitle className="flex items-center justify-between">
                          Filters
                          {activeFilterCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                              Clear all
                            </Button>
                          )}
                        </SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <ProductFilters
                          filters={filters}
                          onChange={(f) => {
                            setFilters(f);
                          }}
                          categories={categories}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Active Filters Tags */}
                  <div className="hidden md:flex flex-wrap gap-2">
                    {filters.categories.map(cat => (
                      <Badge key={cat} variant="secondary" className="gap-1">
                        {categories.find(c => c.slug === cat)?.name || cat}
                        <button
                          onClick={() => setFilters(f => ({
                            ...f,
                            categories: f.categories.filter(c => c !== cat)
                          }))}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {filters.onSale && (
                      <Badge variant="secondary" className="gap-1">
                        On Sale
                        <button onClick={() => setFilters(f => ({ ...f, onSale: false }))}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Grid Toggle */}
                  <div className="hidden md:flex border rounded-md">
                    <Button
                      variant={gridCols === 3 ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-9 w-9 rounded-r-none"
                      onClick={() => setGridCols(3)}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={gridCols === 4 ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-9 w-9 rounded-l-none"
                      onClick={() => setGridCols(4)}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Sort Dropdown */}
                  <ProductSort value={sortBy} onChange={setSortBy} />
                </div>
              </div>

              {/* Product Grid */}
              {isLoading ? (
                <div className={`grid gap-6 ${gridCols === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4'}`}>
                  {Array(8).fill(0).map((_, i) => (
                    <div key={i} className="space-y-4">
                      <Skeleton className="aspect-[3/4] rounded-lg" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-lg font-medium text-foreground">No products found</p>
                  <p className="text-muted-foreground mt-1">
                    Try adjusting your filters or search terms
                  </p>
                  <Button variant="outline" className="mt-4" onClick={clearAllFilters}>
                    Clear all filters
                  </Button>
                </div>
              ) : (
                <div className={`grid gap-6 ${gridCols === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4'}`}>
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}