import { useState, useEffect } from 'react';
import { MapPin, Plus, Pencil, Trash2, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Address } from '@/types';

const addressSchema = z.object({
  label: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  address1: z.string().min(1, 'Address is required'),
  address2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().optional(),
  isDefault: z.boolean().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

export function AccountAddresses() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: 'Home',
      firstName: '',
      lastName: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'United States',
      phone: '',
      isDefault: false,
    },
  });

  const fetchAddresses = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });

    if (!error && data) {
      setAddresses(data as Address[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  const openEditDialog = (address: Address) => {
    setEditingAddress(address);
    form.reset({
      label: address.label || 'Home',
      firstName: address.first_name,
      lastName: address.last_name,
      address1: address.address_line_1,
      address2: address.address_line_2 || '',
      city: address.city,
      state: address.state,
      postalCode: address.postal_code,
      country: address.country,
      phone: address.phone || '',
      isDefault: address.is_default || false,
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingAddress(null);
    form.reset({
      label: 'Home',
      firstName: '',
      lastName: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'United States',
      phone: '',
      isDefault: addresses.length === 0,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: AddressFormData) => {
    if (!user) return;

    const addressData = {
      user_id: user.id,
      label: data.label || 'Home',
      first_name: data.firstName,
      last_name: data.lastName,
      address_line_1: data.address1,
      address_line_2: data.address2 || null,
      city: data.city,
      state: data.state,
      postal_code: data.postalCode,
      country: data.country,
      phone: data.phone || null,
      is_default: data.isDefault || false,
    };

    try {
      // If setting as default, unset other defaults first
      if (data.isDefault) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      if (editingAddress) {
        const { error } = await supabase
          .from('addresses')
          .update(addressData)
          .eq('id', editingAddress.id);

        if (error) throw error;
        toast.success('Address updated');
      } else {
        const { error } = await supabase
          .from('addresses')
          .insert([addressData]);

        if (error) throw error;
        toast.success('Address added');
      }

      setIsDialogOpen(false);
      fetchAddresses();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save address');
    }
  };

  const handleDelete = async (addressId: string) => {
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', addressId);

    if (error) {
      toast.error('Failed to delete address');
      return;
    }

    toast.success('Address deleted');
    fetchAddresses();
  };

  const handleSetDefault = async (addressId: string) => {
    if (!user) return;

    // Unset all defaults first
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id);

    // Set the new default
    const { error } = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', addressId);

    if (error) {
      toast.error('Failed to set default address');
      return;
    }

    toast.success('Default address updated');
    fetchAddresses();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Saved Addresses</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  placeholder="e.g., Home, Work"
                  {...form.register('label')}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...form.register('city')} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input id="state" {...form.register('state')} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input id="postalCode" {...form.register('postalCode')} className="mt-1" />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" type="tel" {...form.register('phone')} className="mt-1" />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  {...form.register('isDefault')}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isDefault" className="cursor-pointer">
                  Set as default address
                </Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingAddress ? 'Save Changes' : 'Add Address'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-lg">
          <MapPin className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No saved addresses</h3>
          <p className="text-muted-foreground mb-4">
            Add an address for faster checkout.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="bg-card border rounded-lg p-4 relative group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{address.label || 'Address'}</span>
                  {address.is_default && (
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditDialog(address)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Address?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This address will be permanently deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(address.id!)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>{address.first_name} {address.last_name}</p>
                <p>{address.address_line_1}</p>
                {address.address_line_2 && <p>{address.address_line_2}</p>}
                <p>{address.city}, {address.state} {address.postal_code}</p>
                <p>{address.country}</p>
                {address.phone && <p className="mt-1">{address.phone}</p>}
              </div>

              {!address.is_default && (
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2 p-0 h-auto"
                  onClick={() => handleSetDefault(address.id!)}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Set as default
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
