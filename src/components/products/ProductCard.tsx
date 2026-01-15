import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Product } from '@/types';
import { formatPrice } from '@/lib/constants';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const primaryImage = product.images?.find(img => img.is_primary)?.url 
    || product.images?.[0]?.url;
  const secondaryImage = product.images?.find(img => !img.is_primary)?.url;
  
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount 
    ? Math.round((1 - product.price / product.compare_at_price!) * 100)
    : 0;

  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAddingToCart(true);
    
    // If product has variants, we need to let user choose - for now add first variant
    const defaultVariant = product.variants?.find(v => v.is_active);
    await addItem(product.id, defaultVariant?.id);
    
    setIsAddingToCart(false);
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleItem(product.id);
  };

  return (
    <motion.div
      className={cn('group relative', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <Link to={`/product/${product.slug}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted">
          {/* Primary Image */}
          <img
            src={primaryImage || '/placeholder.svg'}
            alt={product.name}
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-all duration-500',
              isHovered && secondaryImage ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
            )}
          />
          
          {/* Secondary Image (on hover) */}
          {secondaryImage && (
            <img
              src={secondaryImage}
              alt={`${product.name} - alternate view`}
              className={cn(
                'absolute inset-0 h-full w-full object-cover transition-all duration-500',
                isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              )}
            />
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.is_new && (
              <Badge className="bg-secondary text-secondary-foreground">New</Badge>
            )}
            {product.is_featured && (
              <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                Featured
              </Badge>
            )}
            {hasDiscount && (
              <Badge variant="destructive">-{discountPercent}%</Badge>
            )}
          </div>

          {/* Quick Actions */}
          <motion.div 
            className="absolute top-3 right-3 flex flex-col gap-2"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 10 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              variant="secondary"
              size="icon"
              className={cn(
                'h-9 w-9 rounded-full shadow-md',
                inWishlist && 'text-primary'
              )}
              onClick={handleToggleWishlist}
            >
              <Heart className={cn('h-4 w-4', inWishlist && 'fill-current')} />
            </Button>
          </motion.div>

          {/* Add to Cart Button */}
          <motion.div
            className="absolute bottom-3 inset-x-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              className="w-full shadow-lg"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              {isAddingToCart ? 'Adding...' : 'Add to Cart'}
            </Button>
          </motion.div>
        </div>

        {/* Product Info */}
        <div className="mt-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {product.category?.name || product.brand}
          </p>
          <h3 className="font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.compare_at_price!)}
              </span>
            )}
          </div>

          {/* Color Swatches (if available) */}
          {product.variants && product.variants.length > 0 && (
            <div className="flex gap-1 pt-2">
              {[...new Set(product.variants.map(v => v.color_hex).filter(Boolean))].slice(0, 4).map((hex, i) => (
                <div
                  key={i}
                  className="h-4 w-4 rounded-full border border-border"
                  style={{ backgroundColor: hex || undefined }}
                  title={product.variants?.find(v => v.color_hex === hex)?.color || ''}
                />
              ))}
              {[...new Set(product.variants.map(v => v.color_hex).filter(Boolean))].length > 4 && (
                <span className="text-xs text-muted-foreground">
                  +{[...new Set(product.variants.map(v => v.color_hex).filter(Boolean))].length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}