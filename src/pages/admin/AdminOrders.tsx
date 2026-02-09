import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { OrderStatus, OrderItem, Address } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getTrackingUrl, SUPPORTED_CARRIERS } from "@/lib/tracking";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Eye, Clock, CheckCircle, Truck, Package, XCircle, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface OrderRow {
  id: string;
  order_number: string;
  user_id: string | null;
  email: string;
  status: OrderStatus;
  subtotal: number;
  shipping_cost: number | null;
  tax_amount: number | null;
  discount_amount: number | null;
  total: number;
  currency: string | null;
  shipping_address: Address | null;
  billing_address: Address | null;
  tracking_number: string | null;
  tracking_carrier: string | null;
  notes: string | null;
  admin_notes: string | null;
  lightspeed_order_id: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  processing: { label: "Processing", color: "bg-purple-100 text-purple-800", icon: Package },
  shipped: { label: "Shipped", color: "bg-indigo-100 text-indigo-800", icon: Truck },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: XCircle },
  refunded: { label: "Refunded", color: "bg-gray-100 text-gray-800", icon: XCircle },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [searchQuery, statusFilter]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as OrderStatus);
      }

      if (searchQuery) {
        query = query.or(`order_number.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Map the data to ensure proper typing
      const mappedOrders: OrderRow[] = (data || []).map((order) => ({
        ...order,
        shipping_address: order.shipping_address as unknown as Address | null,
        billing_address: order.billing_address as unknown as Address | null,
      }));
      
      setOrders(mappedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    const { data } = await supabase.from("order_items").select("*").eq("order_id", orderId);
    return data || [];
  };

  const handleViewOrder = async (order: OrderRow) => {
    const items = await fetchOrderItems(order.id);
    setSelectedOrder({ ...order, items });
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
      toast.success("Order status updated");
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    }
  };

  const handleUpdateTracking = async (orderId: string, trackingNumber: string, trackingCarrier: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ tracking_number: trackingNumber || null, tracking_carrier: trackingCarrier || null })
        .eq("id", orderId);

      if (error) throw error;
      toast.success("Tracking info updated");
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, tracking_number: trackingNumber || null, tracking_carrier: trackingCarrier || null });
      }
    } catch (error) {
      console.error("Error updating tracking:", error);
      toast.error("Failed to update tracking");
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage customer orders ({orders.length} total)</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order # or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(statusConfig).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}><div className="h-12 bg-muted animate-pulse rounded" /></TableCell>
                  </TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No orders found</TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.email}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(Number(order.total))}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleViewOrder(order)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>{getStatusBadge(selectedOrder.status)}</div>
                <Select value={selectedOrder.status} onValueChange={(v) => handleUpdateStatus(selectedOrder.id, v as OrderStatus)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Card>
                <CardHeader><CardTitle className="text-base">Items</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">SKU: {item.sku} × {item.quantity}</p>
                      </div>
                      <p className="font-semibold">{formatCurrency(Number(item.total_price))}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Customer</CardTitle></CardHeader>
                  <CardContent>
                    <p>{selectedOrder.email}</p>
                    {selectedOrder.shipping_address && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {(selectedOrder.shipping_address as any).first_name} {(selectedOrder.shipping_address as any).last_name}
                      </p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(Number(selectedOrder.subtotal))}</span></div>
                    <div className="flex justify-between"><span>Shipping</span><span>{formatCurrency(Number(selectedOrder.shipping_cost))}</span></div>
                    <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(Number(selectedOrder.tax_amount))}</span></div>
                    <div className="flex justify-between font-bold pt-2 border-t"><span>Total</span><span>{formatCurrency(Number(selectedOrder.total))}</span></div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle className="text-base">Tracking</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tracking Number</Label>
                      <Input
                        placeholder="Enter tracking number"
                        defaultValue={selectedOrder.tracking_number || ""}
                        id="tracking-number-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Carrier</Label>
                      <Select
                        defaultValue={selectedOrder.tracking_carrier?.toLowerCase() || ""}
                        onValueChange={() => {}}
                      >
                        <SelectTrigger id="tracking-carrier-select">
                          <SelectValue placeholder="Select carrier" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORTED_CARRIERS.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        const numEl = document.getElementById("tracking-number-input") as HTMLInputElement;
                        const carrierEl = document.querySelector<HTMLButtonElement>("#tracking-carrier-select");
                        const carrier = carrierEl?.textContent || "";
                        const carrierValue = SUPPORTED_CARRIERS.find(c => c.label === carrier)?.value || carrier;
                        handleUpdateTracking(selectedOrder.id, numEl?.value || "", carrierValue);
                      }}
                    >
                      Save Tracking
                    </Button>
                    {selectedOrder.tracking_number && (
                      <a
                        href={getTrackingUrl(selectedOrder.tracking_number, selectedOrder.tracking_carrier)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Track Package <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
