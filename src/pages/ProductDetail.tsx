import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart, Minus, Plus, Truck, RefreshCw, Shield, Check } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/products/ProductCard';
import { SizeGuideDialog } from '@/components/products/SizeGuideDialog';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductVariant, ProductImage } from '@/types';
import { formatPrice, SIZES } from '@/lib/constants';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          images:product_images(*),
          variants:product_variants(*)
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (!error && data) {
        const productData = data as unknown as Product;
        setProduct(productData);
        
        // Set default selections
        const activeVariants = productData.variants?.filter(v => v.is_active) || [];
        const availableColors = [...new Set(activeVariants.map(v => v.color).filter(Boolean))];
        const availableSizes = [...new Set(activeVariants.map(v => v.size).filter(Boolean))];
        
        if (availableColors.length > 0) setSelectedColor(availableColors[0]!);
        if (availableSizes.length > 0) setSelectedSize(availableSizes[0]!);

        // Fetch related products
        if (productData.category_id) {
          const { data: related } = await supabase
            .from('products')
            .select(`
              *,
              category:categories(*),
              images:product_images(*),
              variants:product_variants(*)
            `)
            .eq('category_id', productData.category_id)
            .eq('is_active', true)
            .neq('id', productData.id)
            .limit(4);
          
          if (related) setRelatedProducts(related as unknown as Product[]);
        }
      }
      
      setIsLoading(false);
    };

    fetchProduct();
    window.scrollTo(0, 0);
  }, [slug]);

  // Get unique colors and sizes from variants
  const availableColors = product?.variants
    ?.filter(v => v.is_active)
    .map(v => ({ color: v.color, hex: v.color_hex }))
    .filter((v, i, arr) => v.color && arr.findIndex(x => x.color === v.color) === i) || [];

  const availableSizes = product?.variants
    ?.filter(v => v.is_active && (!selectedColor || v.color === selectedColor))
    .map(v => v.size)
    .filter((v, i, arr) => v && arr.indexOf(v) === i) || [];

  // Get selected variant
  const selectedVariant = product?.variants?.find(
    v => v.is_active && v.size === selectedSize && v.color === selectedColor
  );

  const isInStock = selectedVariant ? selectedVariant.stock_quantity > 0 : true;
  const finalPrice = (product?.price || 0) + (selectedVariant?.price_adjustment || 0);
  const hasDiscount = product?.compare_at_price && product.compare_at_price > product.price;

  // Sort images
  const sortedImages = product?.images?.sort((a, b) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    return a.sort_order - b.sort_order;
  }) || [];

  const handleAddToCart = async () => {
    if (!product) return;
    
    if (availableSizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }
    
    if (availableColors.length > 0 && !selectedColor) {
      toast.error('Please select a color');
      return;
    }

    setIsAddingToCart(true);
    
    for (let i = 0; i < quantity; i++) {
      await addItem(product.id, selectedVariant?.id);
    }
    
    setIsAddingToCart(false);
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % sortedImages.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + sortedImages.length) % sortedImages.length);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container py-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <Skeleton className="aspect-square rounded-lg" />
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="w-20 h-20 rounded-md" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!product) {
    return (
      <MainLayout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">Product not found</h1>
          <p className="text-muted-foreground mt-2">The product you're looking for doesn't exist.</p>
          <Button asChild className="mt-6">
            <Link to="/shop">Back to Shop</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const inWishlist = isInWishlist(product.id);

  return (
    <MainLayout>
      <div className="bg-background">
        {/* Breadcrumb */}
        <div className="border-b border-border">
          <div className="container py-4">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              <span>/</span>
              <Link to="/shop" className="hover:text-foreground transition-colors">Shop</Link>
              {product.category && (
                <>
                  <span>/</span>
                  <Link 
                    to={`/shop?category=${product.category.slug}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {product.category.name}
                  </Link>
                </>
              )}
              <span>/</span>
              <span className="text-foreground">{product.name}</span>
            </nav>
          </div>
        </div>

        <div className="container py-8 lg:py-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedImage}
                    src={sortedImages[selectedImage]?.url || '/placeholder.svg'}
                    alt={sortedImages[selectedImage]?.alt_text || product.name}
                    className="h-full w-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                </AnimatePresence>

                {/* Navigation Arrows */}
                {sortedImages.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-lg"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.is_new && (
                    <Badge className="bg-secondary text-secondary-foreground">New</Badge>
                  )}
                  {hasDiscount && (
                    <Badge variant="destructive">
                      -{Math.round((1 - product.price / product.compare_at_price!) * 100)}%
                    </Badge>
                  )}
                </div>
              </div>

              {/* Thumbnail Gallery */}
              {sortedImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {sortedImages.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImage(index)}
                      className={cn(
                        'relative shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all',
                        selectedImage === index
                          ? 'border-primary'
                          : 'border-transparent hover:border-border'
                      )}
                    >
                      <img
                        src={image.url}
                        alt={image.alt_text || `${product.name} ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Title & Price */}
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
                  {product.category?.name || product.brand}
                </p>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                  {product.name}
                </h1>
                <div className="flex items-center gap-3 mt-4">
                  <span className="text-2xl font-bold text-foreground">
                    {formatPrice(finalPrice)}
                  </span>
                  {hasDiscount && (
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(product.compare_at_price!)}
                    </span>
                  )}
                </div>
              </div>

              {/* Short Description */}
              {product.short_description && (
                <p className="text-muted-foreground leading-relaxed">
                  {product.short_description}
                </p>
              )}

              <Separator />

              {/* Color Selector */}
              {availableColors.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-foreground">
                      Color: {selectedColor}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {availableColors.map((c) => (
                      <button
                        key={c.color}
                        onClick={() => setSelectedColor(c.color!)}
                        className={cn(
                          'relative w-10 h-10 rounded-full border-2 transition-all',
                          selectedColor === c.color
                            ? 'border-primary ring-2 ring-primary ring-offset-2'
                            : 'border-border hover:border-foreground'
                        )}
                        style={{ backgroundColor: c.hex || undefined }}
                        title={c.color || ''}
                      >
                        {selectedColor === c.color && (
                          <Check className={cn(
                            'absolute inset-0 m-auto h-4 w-4',
                            c.hex && parseInt(c.hex.slice(1), 16) < 0x808080 
                              ? 'text-white' 
                              : 'text-black'
                          )} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              {availableSizes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-foreground">
                      Size: {selectedSize || 'Select a size'}
                    </span>
                    <SizeGuideDialog />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SIZES.map((size) => {
                      const isAvailable = availableSizes.includes(size);
                      const variant = product.variants?.find(
                        v => v.size === size && v.color === selectedColor && v.is_active
                      );
                      const outOfStock = variant && variant.stock_quantity === 0;

                      return (
                        <button
                          key={size}
                          onClick={() => isAvailable && !outOfStock && setSelectedSize(size)}
                          disabled={!isAvailable || outOfStock}
                          className={cn(
                            'min-w-[3rem] px-4 py-2 text-sm font-medium border rounded-md transition-all',
                            !isAvailable && 'opacity-30 cursor-not-allowed',
                            outOfStock && 'opacity-50 cursor-not-allowed line-through',
                            selectedSize === size
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border text-foreground hover:border-foreground'
                          )}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity & Add to Cart */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Quantity Selector */}
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-r-none"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-l-none"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Add to Cart */}
                <Button
                  size="lg"
                  className="flex-1 h-12"
                  onClick={handleAddToCart}
                  disabled={!isInStock || isAddingToCart}
                >
                  {isAddingToCart ? 'Adding...' : isInStock ? 'Add to Cart' : 'Out of Stock'}
                </Button>

                {/* Wishlist */}
                <Button
                  variant="outline"
                  size="lg"
                  className={cn('h-12 w-12 shrink-0', inWishlist && 'text-primary')}
                  onClick={() => toggleItem(product.id)}
                >
                  <Heart className={cn('h-5 w-5', inWishlist && 'fill-current')} />
                </Button>
              </div>

              {/* Stock Status */}
              {selectedVariant && (
                <p className={cn(
                  'text-sm',
                  selectedVariant.stock_quantity > 10 
                    ? 'text-green-600' 
                    : selectedVariant.stock_quantity > 0 
                      ? 'text-orange-500' 
                      : 'text-destructive'
                )}>
                  {selectedVariant.stock_quantity > 10 
                    ? 'In Stock' 
                    : selectedVariant.stock_quantity > 0 
                      ? `Only ${selectedVariant.stock_quantity} left` 
                      : 'Out of Stock'}
                </p>
              )}

              <Separator />

              {/* Benefits */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Free Shipping</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">30-Day Returns</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Secure Payment</span>
                </div>
              </div>

              {/* Product Details Tabs */}
              <Tabs defaultValue="description" className="mt-8">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="care">Care</TabsTrigger>
                </TabsList>
                <TabsContent value="description" className="pt-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description || 'No description available.'}
                  </p>
                </TabsContent>
                <TabsContent value="details" className="pt-4">
                  <dl className="space-y-2">
                    {product.material && (
                      <div className="flex">
                        <dt className="w-24 text-sm font-medium text-foreground">Material</dt>
                        <dd className="text-sm text-muted-foreground">{product.material}</dd>
                      </div>
                    )}
                    <div className="flex">
                      <dt className="w-24 text-sm font-medium text-foreground">SKU</dt>
                      <dd className="text-sm text-muted-foreground">{product.sku}</dd>
                    </div>
                    {product.tags && product.tags.length > 0 && (
                      <div className="flex">
                        <dt className="w-24 text-sm font-medium text-foreground">Tags</dt>
                        <dd className="text-sm text-muted-foreground">
                          {product.tags.join(', ')}
                        </dd>
                      </div>
                    )}
                  </dl>
                </TabsContent>
                <TabsContent value="care" className="pt-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {product.care_instructions || 'Machine wash cold, tumble dry low.'}
                  </p>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="mt-16 lg:mt-24">
              <h2 className="font-display text-2xl font-bold text-foreground mb-8">
                You May Also Like
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {relatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </MainLayout>
  );
}