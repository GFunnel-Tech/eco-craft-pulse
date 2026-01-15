import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Truck, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Order, OrderItem, Address } from '@/types';

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle2 },
  processing: { label: 'Processing', color: 'bg-purple-100 text-purple-800', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-800', icon: XCircle },
};

interface OrderWithItems extends Order {
  items: OrderItem[];
}

export function AccountOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error || !ordersData) {
        setIsLoading(false);
        return;
      }

      // Fetch items for each order
      const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
          const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

          return {
            ...order,
            shipping_address: order.shipping_address as unknown as Address | null,
            billing_address: order.billing_address as unknown as Address | null,
            items: (items || []) as OrderItem[],
          } as OrderWithItems;
        })
      );

      setOrders(ordersWithItems);
      setIsLoading(false);
    };

    fetchOrders();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
        <p className="text-muted-foreground mb-6">
          When you place an order, it will appear here.
        </p>
        <Button asChild>
          <Link to="/shop">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Order History</h2>
      
      {orders.map((order) => {
        const status = statusConfig[order.status] || statusConfig.pending;
        const StatusIcon = status.icon;
        const isExpanded = expandedOrder === order.id;

        return (
          <div key={order.id} className="bg-card border rounded-lg overflow-hidden">
            {/* Order Header */}
            <div
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex w-12 h-12 bg-muted rounded-lg items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Badge className={`${status.color} border-0`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                  <p className="font-semibold">${order.total.toFixed(2)}</p>
                  <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
              </div>
            </div>

            {/* Order Details */}
            {isExpanded && (
              <div className="border-t bg-muted/30">
                <div className="p-4 space-y-4">
                  {/* Items */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Items</h4>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <div>
                            <span>{item.product_name}</span>
                            {item.variant_name && (
                              <span className="text-muted-foreground"> - {item.variant_name}</span>
                            )}
                            <span className="text-muted-foreground"> × {item.quantity}</span>
                          </div>
                          <span>${item.total_price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Summary */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Shipping Address</h4>
                      {order.shipping_address ? (
                        <div className="text-sm text-muted-foreground">
                          <p>{order.shipping_address.first_name} {order.shipping_address.last_name}</p>
                          <p>{order.shipping_address.address_line_1}</p>
                          <p>
                            {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">N/A</p>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Order Summary</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>${order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Shipping</span>
                          <span>{order.shipping_cost === 0 ? 'Free' : `$${order.shipping_cost?.toFixed(2)}`}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tax</span>
                          <span>${order.tax_amount?.toFixed(2)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-semibold">
                          <span>Total</span>
                          <span>${order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tracking */}
                  {order.tracking_number && (
                    <>
                      <Separator />
                      <div className="flex items-center gap-2 text-sm">
                        <Truck className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">Tracking:</span>
                        <span className="font-medium">{order.tracking_number}</span>
                        {order.tracking_carrier && (
                          <span className="text-muted-foreground">({order.tracking_carrier})</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
