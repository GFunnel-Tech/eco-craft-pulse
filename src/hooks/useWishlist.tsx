import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { WishlistItem } from '@/types';
import { toast } from 'sonner';

interface WishlistContextType {
  items: WishlistItem[];
  itemCount: number;
  isLoading: boolean;
  isInWishlist: (productId: string) => boolean;
  addItem: (productId: string) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  toggleItem: (productId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('wishlist')
      .select(`
        *,
        product:products(*)
      `)
      .eq('user_id', user.id);
    
    if (!error && data) {
      setItems(data as unknown as WishlistItem[]);
    }
    
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const isInWishlist = (productId: string) => {
    return items.some(item => item.product_id === productId);
  };

  const addItem = async (productId: string) => {
    if (!user) {
      toast.error('Please sign in to save items to your wishlist');
      return;
    }
    
    const { error } = await supabase
      .from('wishlist')
      .insert({ user_id: user.id, product_id: productId });
    
    if (error) {
      if (error.code === '23505') { // Unique violation
        toast.info('Already in wishlist');
      } else {
        toast.error('Failed to add to wishlist');
      }
      return;
    }
    
    toast.success('Added to wishlist');
    fetchWishlist();
  };

  const removeItem = async (productId: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);
    
    if (error) {
      toast.error('Failed to remove from wishlist');
      return;
    }
    
    setItems(prev => prev.filter(item => item.product_id !== productId));
    toast.success('Removed from wishlist');
  };

  const toggleItem = async (productId: string) => {
    if (isInWishlist(productId)) {
      await removeItem(productId);
    } else {
      await addItem(productId);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        itemCount: items.length,
        isLoading,
        isInWishlist,
        addItem,
        removeItem,
        toggleItem,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}