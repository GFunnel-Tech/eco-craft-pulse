import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Users, ShoppingBag, Mail, Phone, MapPin } from "lucide-react";
import { format } from "date-fns";

interface CustomerWithStats {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
  order_count: number;
  total_spent: number;
}

interface CustomerDetails extends CustomerWithStats {
  addresses: Array<{
    id: string;
    label: string;
    address_line_1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  }>;
  orders: Array<{
    id: string;
    order_number: string;
    total: number;
    status: string;
    created_at: string;
  }>;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetails | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch order stats for each customer
      const customersWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: orders } = await supabase
            .from("orders")
            .select("total")
            .eq("user_id", profile.user_id);

          const orderCount = orders?.length || 0;
          const totalSpent = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

          return {
            ...profile,
            order_count: orderCount,
            total_spent: totalSpent,
          };
        })
      );

      setCustomers(customersWithStats);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerDetails = async (customer: CustomerWithStats) => {
    try {
      // Fetch addresses
      const { data: addresses } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", customer.user_id);

      // Fetch orders
      const { data: orders } = await supabase
        .from("orders")
        .select("id, order_number, total, status, created_at")
        .eq("user_id", customer.user_id)
        .order("created_at", { ascending: false })
        .limit(10);

      setSelectedCustomer({
        ...customer,
        addresses: addresses || [],
        orders: orders || [],
      });
      setIsDetailsOpen(true);
    } catch (error) {
      console.error("Error fetching customer details:", error);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      customer.email.toLowerCase().includes(searchLower) ||
      customer.first_name?.toLowerCase().includes(searchLower) ||
      customer.last_name?.toLowerCase().includes(searchLower)
    );
  });

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.total_spent, 0);
  const avgOrderValue = totalRevenue / Math.max(customers.reduce((sum, c) => sum + c.order_count, 0), 1);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      delivered: "default",
      shipped: "secondary",
      processing: "secondary",
      pending: "outline",
      cancelled: "destructive",
      refunded: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground">Manage and view customer information</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Customers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCustomers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Order Value
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${avgOrderValue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Customers Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No customers found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        {customer.first_name || customer.last_name
                          ? `${customer.first_name || ""} ${customer.last_name || ""}`.trim()
                          : "—"}
                      </TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.order_count}</TableCell>
                      <TableCell>${customer.total_spent.toFixed(2)}</TableCell>
                      <TableCell>
                        {format(new Date(customer.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fetchCustomerDetails(customer)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-3">
                <h3 className="font-semibold">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{selectedCustomer.order_count} orders</span>
                  <span>•</span>
                  <span>${selectedCustomer.total_spent.toFixed(2)} total spent</span>
                  <span>•</span>
                  <span>Joined {format(new Date(selectedCustomer.created_at), "MMM d, yyyy")}</span>
                </div>
              </div>

              {/* Addresses */}
              {selectedCustomer.addresses.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Addresses</h3>
                  <div className="grid gap-3">
                    {selectedCustomer.addresses.map((address) => (
                      <div
                        key={address.id}
                        className="flex items-start gap-2 p-3 rounded-lg bg-muted/50"
                      >
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="text-sm">
                          <div className="font-medium">{address.label}</div>
                          <div className="text-muted-foreground">
                            {address.address_line_1}, {address.city}, {address.state}{" "}
                            {address.postal_code}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Orders */}
              {selectedCustomer.orders.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Recent Orders</h3>
                  <div className="space-y-2">
                    {selectedCustomer.orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div>
                          <div className="font-medium text-sm">{order.order_number}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(order.created_at), "MMM d, yyyy")}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(order.status)}
                          <span className="font-medium">${Number(order.total).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
