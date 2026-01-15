import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Package, Truck, CreditCard, ShoppingBag, Minus, Plus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { SITE_NAME } from '@/lib/constants';
import { Address } from '@/types';

const shippingSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  address1: z.string().min(1, 'Address is required'),
  address2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().optional(),
  saveAddress: z.boolean().optional(),
});

type ShippingFormData = z.infer<typeof shippingSchema>;

const shippingOptions = [
  { id: 'standard', name: 'Standard Shipping', price: 0, time: '5-7 business days' },
  { id: 'express', name: 'Express Shipping', price: 12.99, time: '2-3 business days' },
  { id: 'overnight', name: 'Overnight Shipping', price: 24.99, time: '1 business day' },
];

type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'confirmation';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, updateQuantity, removeItem, clearCart, isLoading } = useCart();
  const { user, profile } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('cart');
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [shippingData, setShippingData] = useState<ShippingFormData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const form = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      email: profile?.email || user?.email || '',
      firstName: profile?.first_name || '',
      lastName: profile?.last_name || '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'United States',
      phone: profile?.phone || '',
      saveAddress: false,
    },
  });

  // Fetch saved addresses for logged-in users
  useEffect(() => {
    if (user) {
      const fetchAddresses = async () => {
        const { data } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false });
        
        if (data) {
          setSavedAddresses(data as Address[]);
          const defaultAddr = data.find(a => a.is_default);
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
            populateAddressForm(defaultAddr as Address);
          }
        }
      };
      fetchAddresses();
    }
  }, [user]);

  const populateAddressForm = (address: Address) => {
    form.setValue('firstName', address.first_name);
    form.setValue('lastName', address.last_name);
    form.setValue('address1', address.address_line_1);
    form.setValue('address2', address.address_line_2 || '');
    form.setValue('city', address.city);
    form.setValue('state', address.state);
    form.setValue('postalCode', address.postal_code);
    form.setValue('country', address.country);
    form.setValue('phone', address.phone || '');
  };

  const selectedShipping = shippingOptions.find(s => s.id === shippingMethod)!;
  const taxRate = 0.08; // 8% tax
  const taxAmount = subtotal * taxRate;
  const total = subtotal + selectedShipping.price + taxAmount;

  const steps: { key: CheckoutStep; label: string; icon: typeof ShoppingBag }[] = [
    { key: 'cart', label: 'Cart', icon: ShoppingBag },
    { key: 'shipping', label: 'Shipping', icon: Truck },
    { key: 'payment', label: 'Payment', icon: CreditCard },
    { key: 'confirmation', label: 'Confirm', icon: Check },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);

  const handleShippingSubmit = (data: ShippingFormData) => {
    setShippingData(data);
    setCurrentStep('payment');
  };

  const handlePlaceOrder = async () => {
    if (!shippingData) return;
    
    setIsProcessing(true);
    
    try {
      // Create the order
      const shippingAddress = {
        first_name: shippingData.firstName,
        last_name: shippingData.lastName,
        address_line_1: shippingData.address1,
        address_line_2: shippingData.address2 || null,
        city: shippingData.city,
        state: shippingData.state,
        postal_code: shippingData.postalCode,
        country: shippingData.country,
        phone: shippingData.phone || null,
      };

      // Generate a temporary order number (will be replaced by DB trigger)
      const tempOrderNumber = `KORR-${Date.now()}`;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user?.id || null,
          email: shippingData.email,
          order_number: tempOrderNumber,
          subtotal: subtotal,
          shipping_cost: selectedShipping.price,
          tax_amount: taxAmount,
          total: total,
          shipping_address: shippingAddress,
          billing_address: shippingAddress,
          status: 'pending' as const,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: item.product?.name || 'Unknown Product',
        variant_name: item.variant ? `${item.variant.size || ''} ${item.variant.color || ''}`.trim() : null,
        sku: item.variant?.sku || item.product?.sku || 'N/A',
        quantity: item.quantity,
        unit_price: (item.product?.price || 0) + (item.variant?.price_adjustment || 0),
        total_price: ((item.product?.price || 0) + (item.variant?.price_adjustment || 0)) * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Save address if requested
      if (shippingData.saveAddress && user) {
        await supabase.from('addresses').insert({
          user_id: user.id,
          ...shippingAddress,
          is_default: savedAddresses.length === 0,
        });
      }

      // Clear the cart
      await clearCart();

      // Navigate to confirmation with order details
      navigate(`/order-confirmation/${order.order_number}`);
      
    } catch (error: any) {
      console.error('Order error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (items.length === 0 && currentStep !== 'confirmation') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Package className="h-24 w-24 text-muted-foreground mb-6" />
        <h1 className="text-2xl font-display font-semibold mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground mb-8">Add some items to get started</p>
        <Button asChild>
          <Link to="/shop">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-display font-bold text-primary">
              {SITE_NAME}
            </Link>
            <span className="text-sm text-muted-foreground">Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-2 md:gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.key === currentStep;
              const isCompleted = index < currentStepIndex;
              
              return (
                <div key={step.key} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'bg-primary text-primary-foreground'
                          : isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <span className={`text-xs mt-1 hidden sm:block ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 md:w-16 h-0.5 mx-2 ${index < currentStepIndex ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* Cart Review Step */}
              {currentStep === 'cart' && (
                <motion.div
                  key="cart"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-display font-semibold">Review Your Cart</h1>
                    <Link to="/shop" className="text-sm text-primary hover:underline">
                      Continue Shopping
                    </Link>
                  </div>

                  <div className="space-y-4">
                    {items.map((item) => {
                      const price = (item.product?.price || 0) + (item.variant?.price_adjustment || 0);
                      const primaryImage = item.product?.images?.find(img => img.is_primary) || item.product?.images?.[0];
                      
                      return (
                        <div key={item.id} className="bg-card rounded-lg p-4 flex gap-4">
                          <div className="w-24 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0">
                            {primaryImage ? (
                              <img
                                src={primaryImage.url}
                                alt={item.product?.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium truncate">{item.product?.name}</h3>
                                {item.variant && (
                                  <p className="text-sm text-muted-foreground">
                                    {item.variant.size && `Size: ${item.variant.size}`}
                                    {item.variant.size && item.variant.color && ' / '}
                                    {item.variant.color && `Color: ${item.variant.color}`}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                            
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="w-8 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                              <p className="font-semibold">${(price * item.quantity).toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => setCurrentStep('shipping')} size="lg">
                      Continue to Shipping
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Shipping Step */}
              {currentStep === 'shipping' && (
                <motion.div
                  key="shipping"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setCurrentStep('cart')}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-2xl font-display font-semibold">Shipping Information</h1>
                  </div>

                  {/* Saved Addresses */}
                  {savedAddresses.length > 0 && (
                    <div className="space-y-3">
                      <Label>Saved Addresses</Label>
                      <RadioGroup
                        value={selectedAddressId || ''}
                        onValueChange={(id) => {
                          setSelectedAddressId(id);
                          const addr = savedAddresses.find(a => a.id === id);
                          if (addr) populateAddressForm(addr);
                        }}
                      >
                        {savedAddresses.map((addr) => (
                          <div key={addr.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                            <RadioGroupItem value={addr.id!} id={addr.id} />
                            <label htmlFor={addr.id} className="flex-1 cursor-pointer">
                              <p className="font-medium">{addr.first_name} {addr.last_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {addr.address_line_1}, {addr.city}, {addr.state} {addr.postal_code}
                              </p>
                            </label>
                          </div>
                        ))}
                        <div className="flex items-center space-x-2 p-3 border rounded-lg">
                          <RadioGroupItem value="new" id="new-address" />
                          <label htmlFor="new-address" className="cursor-pointer">
                            Use a new address
                          </label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  <form onSubmit={form.handleSubmit(handleShippingSubmit)} className="space-y-6">
                    {/* Contact */}
                    <div className="bg-card rounded-lg p-6 space-y-4">
                      <h2 className="font-semibold">Contact Information</h2>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          {...form.register('email')}
                          className="mt-1"
                        />
                        {form.formState.errors.email && (
                          <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Address */}
                    <div className="bg-card rounded-lg p-6 space-y-4">
                      <h2 className="font-semibold">Shipping Address</h2>
                      
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input id="firstName" {...form.register('firstName')} className="mt-1" />
                          {form.formState.errors.firstName && (
                            <p className="text-sm text-destructive mt-1">{form.formState.errors.firstName.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input id="lastName" {...form.register('lastName')} className="mt-1" />
                          {form.formState.errors.lastName && (
                            <p className="text-sm text-destructive mt-1">{form.formState.errors.lastName.message}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="address1">Address</Label>
                        <Input id="address1" {...form.register('address1')} className="mt-1" />
                        {form.formState.errors.address1 && (
                          <p className="text-sm text-destructive mt-1">{form.formState.errors.address1.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="address2">Apartment, suite, etc. (optional)</Label>
                        <Input id="address2" {...form.register('address2')} className="mt-1" />
                      </div>

                      <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input id="city" {...form.register('city')} className="mt-1" />
                          {form.formState.errors.city && (
                            <p className="text-sm text-destructive mt-1">{form.formState.errors.city.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="state">State</Label>
                          <Input id="state" {...form.register('state')} className="mt-1" />
                          {form.formState.errors.state && (
                            <p className="text-sm text-destructive mt-1">{form.formState.errors.state.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="postalCode">Postal Code</Label>
                          <Input id="postalCode" {...form.register('postalCode')} className="mt-1" />
                          {form.formState.errors.postalCode && (
                            <p className="text-sm text-destructive mt-1">{form.formState.errors.postalCode.message}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone (optional)</Label>
                        <Input id="phone" type="tel" {...form.register('phone')} className="mt-1" />
                      </div>

                      {user && (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="saveAddress"
                            checked={form.watch('saveAddress')}
                            onCheckedChange={(checked) => form.setValue('saveAddress', checked as boolean)}
                          />
                          <label htmlFor="saveAddress" className="text-sm cursor-pointer">
                            Save this address for future orders
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Shipping Method */}
                    <div className="bg-card rounded-lg p-6 space-y-4">
                      <h2 className="font-semibold">Shipping Method</h2>
                      <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
                        {shippingOptions.map((option) => (
                          <div
                            key={option.id}
                            className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                              shippingMethod === option.id ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground'
                            }`}
                            onClick={() => setShippingMethod(option.id)}
                          >
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value={option.id} id={option.id} />
                              <div>
                                <p className="font-medium">{option.name}</p>
                                <p className="text-sm text-muted-foreground">{option.time}</p>
                              </div>
                            </div>
                            <p className="font-semibold">
                              {option.price === 0 ? 'Free' : `$${option.price.toFixed(2)}`}
                            </p>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="flex justify-between">
                      <Button type="button" variant="ghost" onClick={() => setCurrentStep('cart')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button type="submit" size="lg">
                        Continue to Payment
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Payment Step */}
              {currentStep === 'payment' && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setCurrentStep('shipping')}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-2xl font-display font-semibold">Payment</h1>
                  </div>

                  {/* Shipping Summary */}
                  <div className="bg-card rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="font-semibold">Shipping to</h2>
                      <button
                        onClick={() => setCurrentStep('shipping')}
                        className="text-sm text-primary hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    {shippingData && (
                      <div className="text-sm text-muted-foreground">
                        <p>{shippingData.firstName} {shippingData.lastName}</p>
                        <p>{shippingData.address1}</p>
                        {shippingData.address2 && <p>{shippingData.address2}</p>}
                        <p>{shippingData.city}, {shippingData.state} {shippingData.postalCode}</p>
                        <p>{shippingData.country}</p>
                      </div>
                    )}
                  </div>

                  {/* Payment Placeholder */}
                  <div className="bg-card rounded-lg p-6 space-y-4">
                    <h2 className="font-semibold">Payment Method</h2>
                    <div className="bg-muted/50 border-2 border-dashed rounded-lg p-8 text-center">
                      <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-2">
                        Payment integration coming soon
                      </p>
                      <p className="text-sm text-muted-foreground">
                        For demo purposes, click "Place Order" to complete your order.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="ghost" onClick={() => setCurrentStep('shipping')}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      size="lg"
                      onClick={handlePlaceOrder}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <span className="animate-spin mr-2">⟳</span>
                          Processing...
                        </>
                      ) : (
                        <>
                          Place Order
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {items.map((item) => {
                  const price = (item.product?.price || 0) + (item.variant?.price_adjustment || 0);
                  return (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <p className="truncate">{item.product?.name}</p>
                        <p className="text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">${(price * item.quantity).toFixed(2)}</p>
                    </div>
                  );
                })}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{selectedShipping.price === 0 ? 'Free' : `$${selectedShipping.price.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (8%)</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              {!user && currentStep !== 'cart' && (
                <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                  <p className="text-muted-foreground">
                    <Link to="/login" className="text-primary hover:underline">Sign in</Link>
                    {' '}to save your order history
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
