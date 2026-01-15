import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, X } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/constants';
import { toast } from 'sonner';

export function AccountWishlist() {
  const { items, removeItem, isLoading } = useWishlist();
  const { addItem: addToCart } = useCart();

  const handleAddToCart = async (productId: string) => {
    await addToCart(productId);
    toast.success('Added to cart');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
        <p className="text-muted-foreground mb-6">
          Save items you love to your wishlist.
        </p>
        <Button asChild>
          <Link to="/shop">Browse Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Wishlist ({items.length} items)</h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item) => {
          const product = item.product;
          if (!product) return null;

          const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
          const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;

          return (
            <div
              key={item.id}
              className="bg-card border rounded-lg overflow-hidden group"
            >
              {/* Image */}
              <div className="relative aspect-[3/4] bg-muted">
                <Link to={`/product/${product.slug}`}>
                  {primaryImage ? (
                    <img
                      src={primaryImage.url}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No image
                    </div>
                  )}
                </Link>
                
                {/* Remove button */}
                <button
                  onClick={() => removeItem(product.id)}
                  className="absolute top-2 right-2 w-8 h-8 bg-card/90 rounded-full flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {hasDiscount && (
                    <span className="bg-destructive text-destructive-foreground text-xs font-medium px-2 py-1 rounded">
                      Sale
                    </span>
                  )}
                  {product.is_new && (
                    <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded">
                      New
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <Link to={`/product/${product.slug}`}>
                  <h3 className="font-medium hover:text-primary transition-colors line-clamp-2 mb-2">
                    {product.name}
                  </h3>
                </Link>
                
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-semibold text-lg">
                    {formatPrice(product.price)}
                  </span>
                  {hasDiscount && (
                    <span className="text-muted-foreground line-through text-sm">
                      {formatPrice(product.compare_at_price!)}
                    </span>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={() => handleAddToCart(product.id)}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
