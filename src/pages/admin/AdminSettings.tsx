import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Store, Mail, Truck, CreditCard, Bell, Shield } from "lucide-react";

export default function AdminSettings() {
  const [isLoading, setIsLoading] = useState(false);

  // Store Settings
  const [storeName, setStoreName] = useState("KORR");
  const [storeEmail, setStoreEmail] = useState("support@korr.com");
  const [storePhone, setStorePhone] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("America/New_York");

  // Shipping Settings
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("100");
  const [standardShippingRate, setStandardShippingRate] = useState("9.99");
  const [expressShippingRate, setExpressShippingRate] = useState("19.99");

  // Notification Settings
  const [orderConfirmationEmail, setOrderConfirmationEmail] = useState(true);
  const [shippingUpdateEmail, setShippingUpdateEmail] = useState(true);
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [lowStockThreshold, setLowStockThreshold] = useState("10");

  // Tax Settings
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxRate, setTaxRate] = useState("8.25");

  const handleSaveGeneral = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast.success("General settings saved successfully");
    setIsLoading(false);
  };

  const handleSaveShipping = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast.success("Shipping settings saved successfully");
    setIsLoading(false);
  };

  const handleSaveNotifications = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast.success("Notification settings saved successfully");
    setIsLoading(false);
  };

  const handleSaveTax = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast.success("Tax settings saved successfully");
    setIsLoading(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your store configuration</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="general" className="gap-2">
              <Store className="h-4 w-4 hidden sm:block" />
              General
            </TabsTrigger>
            <TabsTrigger value="shipping" className="gap-2">
              <Truck className="h-4 w-4 hidden sm:block" />
              Shipping
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4 hidden sm:block" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="tax" className="gap-2">
              <CreditCard className="h-4 w-4 hidden sm:block" />
              Tax
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Store Information</CardTitle>
                <CardDescription>
                  Basic information about your store
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input
                      id="storeName"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeEmail">Contact Email</Label>
                    <Input
                      id="storeEmail"
                      type="email"
                      value={storeEmail}
                      onChange={(e) => setStoreEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storePhone">Phone Number</Label>
                    <Input
                      id="storePhone"
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="CAD">CAD ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeAddress">Store Address</Label>
                  <Textarea
                    id="storeAddress"
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    placeholder="Enter your store address"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="max-w-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button onClick={handleSaveGeneral} disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shipping Settings */}
          <TabsContent value="shipping">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Configuration</CardTitle>
                <CardDescription>
                  Configure shipping rates and options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="freeShipping">Free Shipping Threshold ($)</Label>
                    <Input
                      id="freeShipping"
                      type="number"
                      value={freeShippingThreshold}
                      onChange={(e) => setFreeShippingThreshold(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Orders above this amount qualify for free shipping
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="standardRate">Standard Shipping Rate ($)</Label>
                    <Input
                      id="standardRate"
                      type="number"
                      step="0.01"
                      value={standardShippingRate}
                      onChange={(e) => setStandardShippingRate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expressRate">Express Shipping Rate ($)</Label>
                    <Input
                      id="expressRate"
                      type="number"
                      step="0.01"
                      value={expressShippingRate}
                      onChange={(e) => setExpressShippingRate(e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button onClick={handleSaveShipping} disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure email and alert settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Order Confirmation Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Send confirmation email when an order is placed
                      </p>
                    </div>
                    <Switch
                      checked={orderConfirmationEmail}
                      onCheckedChange={setOrderConfirmationEmail}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Shipping Update Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify customers when their order ships
                      </p>
                    </div>
                    <Switch
                      checked={shippingUpdateEmail}
                      onCheckedChange={setShippingUpdateEmail}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Low Stock Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive alerts when products are running low
                      </p>
                    </div>
                    <Switch
                      checked={lowStockAlert}
                      onCheckedChange={setLowStockAlert}
                    />
                  </div>

                  {lowStockAlert && (
                    <div className="space-y-2 pl-4 border-l-2 border-muted">
                      <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                      <Input
                        id="lowStockThreshold"
                        type="number"
                        value={lowStockThreshold}
                        onChange={(e) => setLowStockThreshold(e.target.value)}
                        className="max-w-[200px]"
                      />
                      <p className="text-xs text-muted-foreground">
                        Alert when stock falls below this number
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications} disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax Settings */}
          <TabsContent value="tax">
            <Card>
              <CardHeader>
                <CardTitle>Tax Configuration</CardTitle>
                <CardDescription>
                  Configure tax rates and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Tax Collection</Label>
                    <p className="text-sm text-muted-foreground">
                      Collect tax on orders
                    </p>
                  </div>
                  <Switch
                    checked={taxEnabled}
                    onCheckedChange={setTaxEnabled}
                  />
                </div>

                {taxEnabled && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        step="0.01"
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                        className="max-w-[200px]"
                      />
                      <p className="text-xs text-muted-foreground">
                        This rate will be applied to all orders unless location-based tax is configured
                      </p>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex justify-end">
                  <Button onClick={handleSaveTax} disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
