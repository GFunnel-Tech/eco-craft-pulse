import { useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { User, Package, MapPin, Heart, LogOut, Settings } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { AccountOrders } from '@/components/account/AccountOrders';
import { AccountAddresses } from '@/components/account/AccountAddresses';
import { AccountProfile } from '@/components/account/AccountProfile';
import { AccountWishlist } from '@/components/account/AccountWishlist';

const tabs = [
  { value: 'orders', label: 'Orders', icon: Package },
  { value: 'addresses', label: 'Addresses', icon: MapPin },
  { value: 'wishlist', label: 'Wishlist', icon: Heart },
  { value: 'profile', label: 'Profile', icon: Settings },
];

export default function Account() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile, isLoading, signOut } = useAuth();
  
  const activeTab = searchParams.get('tab') || 'orders';

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login?redirect=/account');
    }
  }, [user, isLoading, navigate]);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">
                {profile?.first_name 
                  ? `Welcome, ${profile.first_name}!` 
                  : 'My Account'}
              </h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="orders" className="mt-0">
            <AccountOrders />
          </TabsContent>
          
          <TabsContent value="addresses" className="mt-0">
            <AccountAddresses />
          </TabsContent>
          
          <TabsContent value="wishlist" className="mt-0">
            <AccountWishlist />
          </TabsContent>
          
          <TabsContent value="profile" className="mt-0">
            <AccountProfile />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
