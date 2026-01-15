import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { CartItem, Product, ProductVariant } from '@/types';
import { toast } from 'sonner';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  addItem: (productId: string, variantId?: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const getSessionId = (): string => {
  let sessionId = localStorage.getItem('cart_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('cart_session_id', sessionId);
  }
  return sessionId;
};

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCart = useCallback(async () => {
    setIsLoading(true);
    
    let query = supabase
      .from('cart_items')
      .select(`
        *,
        product:products(*),
        variant:product_variants(*)
      `);
    
    if (user) {
      query = query.eq('user_id', user.id);
    } else {
      query = query.eq('session_id', getSessionId());
    }
    
    const { data, error } = await query;
    
    if (!error && data) {
      setItems(data as unknown as CartItem[]);
    }
    
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Migrate cart when user logs in
  useEffect(() => {
    if (user) {
      const migrateCart = async () => {
        const sessionId = getSessionId();
        
        // Update any anonymous cart items to belong to this user
        await supabase
          .from('cart_items')
          .update({ user_id: user.id, session_id: null })
          .eq('session_id', sessionId);
        
        fetchCart();
      };
      
      migrateCart();
    }
  }, [user, fetchCart]);

  const addItem = async (productId: string, variantId?: string, quantity: number = 1) => {
    const existingItem = items.find(
      item => item.product_id === productId && item.variant_id === variantId
    );
    
    if (existingItem) {
      await updateQuantity(existingItem.id, existingItem.quantity + quantity);
      return;
    }
    
    const newItem = {
      product_id: productId,
      variant_id: variantId || null,
      quantity,
      user_id: user?.id || null,
      session_id: user ? null : getSessionId(),
    };
    
    const { error } = await supabase
      .from('cart_items')
      .insert([newItem]);
    
    if (error) {
      toast.error('Failed to add item to cart');
      return;
    }
    
    toast.success('Added to cart');
    fetchCart();
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      await removeItem(itemId);
      return;
    }
    
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId);
    
    if (error) {
      toast.error('Failed to update quantity');
      return;
    }
    
    setItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const removeItem = async (itemId: string) => {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);
    
    if (error) {
      toast.error('Failed to remove item');
      return;
    }
    
    setItems(prev => prev.filter(item => item.id !== itemId));
    toast.success('Removed from cart');
  };

  const clearCart = async () => {
    let query = supabase.from('cart_items').delete();
    
    if (user) {
      query = query.eq('user_id', user.id);
    } else {
      query = query.eq('session_id', getSessionId());
    }
    
    const { error } = await query;
    
    if (!error) {
      setItems([]);
    }
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const subtotal = items.reduce((sum, item) => {
    const price = item.product?.price || 0;
    const adjustment = item.variant?.price_adjustment || 0;
    return sum + (price + adjustment) * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        isLoading,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}