import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Package, Truck, Mail, Home, ShoppingBag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SITE_NAME } from '@/lib/constants';
import { Order, OrderItem, Address } from '@/types';

export default function OrderConfirmation() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderNumber) return;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single();

      if (orderError || !orderData) {
        setIsLoading(false);
        return;
      }

      // Cast the shipping_address from Json to Address type
      const typedOrder: Order = {
        ...orderData,
        shipping_address: orderData.shipping_address as unknown as Address | null,
        billing_address: orderData.billing_address as unknown as Address | null,
      };
      setOrder(typedOrder);

      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderData.id);

      if (itemsData) {
        setItems(itemsData as OrderItem[]);
      }

      setIsLoading(false);
    };

    fetchOrder();
  }, [orderNumber]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Package className="h-24 w-24 text-muted-foreground mb-6" />
        <h1 className="text-2xl font-display font-semibold mb-2">Order not found</h1>
        <p className="text-muted-foreground mb-8">We couldn't find an order with that number</p>
        <Button asChild>
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  const shippingAddress = order.shipping_address;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="text-2xl font-display font-bold text-primary">
            {SITE_NAME}
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6"
          >
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </motion.div>
          
          <h1 className="text-3xl font-display font-bold mb-2">Thank you for your order!</h1>
          <p className="text-muted-foreground">
            Your order has been received and is being processed.
          </p>
        </motion.div>

        {/* Order Info */}
        <div className="bg-card rounded-lg border p-6 mb-8">
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Order Number</p>
              <p className="font-semibold text-lg">{order.order_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Order Date</p>
              <p className="font-semibold">
                {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <p className="font-medium">{order.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-card rounded-lg border p-6 mb-8">
          <h2 className="font-semibold mb-6">Order Timeline</h2>
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-5 h-0.5 bg-muted" />
            <div className="absolute left-0 w-1/4 top-5 h-0.5 bg-primary" />
            
            {[
              { icon: CheckCircle2, label: 'Order Placed', active: true },
              { icon: Package, label: 'Processing', active: false },
              { icon: Truck, label: 'Shipped', active: false },
              { icon: Home, label: 'Delivered', active: false },
            ].map((step, index) => (
              <div key={step.label} className="relative flex flex-col items-center z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step.active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                <span className={`text-xs mt-2 ${step.active ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-card rounded-lg border p-6 mb-8">
          <h2 className="font-semibold mb-4">Order Details</h2>
          
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  {item.variant_name && (
                    <p className="text-sm text-muted-foreground">{item.variant_name}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium">${item.total_price.toFixed(2)}</p>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="space-y-2 text-sm">
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
          </div>

          <Separator className="my-4" />

          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Shipping Address */}
        {shippingAddress && (
          <div className="bg-card rounded-lg border p-6 mb-8">
            <h2 className="font-semibold mb-4">Shipping Address</h2>
            <div className="text-muted-foreground">
              <p className="font-medium text-foreground">
                {shippingAddress.first_name} {shippingAddress.last_name}
              </p>
              <p>{shippingAddress.address_line_1}</p>
              {shippingAddress.address_line_2 && <p>{shippingAddress.address_line_2}</p>}
              <p>
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}
              </p>
              <p>{shippingAddress.country}</p>
            </div>
          </div>
        )}

        {/* Confirmation Email Notice */}
        <div className="bg-muted/50 rounded-lg p-6 flex items-start gap-4 mb-8">
          <Mail className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium mb-1">Confirmation email sent</p>
            <p className="text-sm text-muted-foreground">
              A confirmation email has been sent to <span className="font-medium">{order.email}</span>.
              You'll receive updates when your order ships.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="outline" size="lg">
            <Link to="/shop">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Continue Shopping
            </Link>
          </Button>
          <Button asChild size="lg">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
