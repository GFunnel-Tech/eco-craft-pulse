import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  lowStockProducts: number;
  recentOrders: Array<{
    id: string;
    order_number: string;
    total: number;
    status: string;
    created_at: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    lowStockProducts: 0,
    recentOrders: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch products count
      const { count: totalProducts } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      const { count: activeProducts } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Fetch orders stats
      const { data: orders } = await supabase
        .from("orders")
        .select("id, total, status");

      const totalOrders = orders?.length || 0;
      const pendingOrders = orders?.filter((o) => o.status === "pending").length || 0;
      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;

      // Fetch customers count
      const { count: totalCustomers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch low stock variants
      const { count: lowStockProducts } = await supabase
        .from("product_variants")
        .select("*", { count: "exact", head: true })
        .lte("stock_quantity", 10)
        .eq("is_active", true);

      // Fetch recent orders
      const { data: recentOrders } = await supabase
        .from("orders")
        .select("id, order_number, total, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      setStats({
        totalProducts: totalProducts || 0,
        activeProducts: activeProducts || 0,
        totalOrders,
        pendingOrders,
        totalRevenue,
        totalCustomers: totalCustomers || 0,
        lowStockProducts: lowStockProducts || 0,
        recentOrders: recentOrders || [],
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      description: "Lifetime sales",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      description: `${stats.pendingOrders} pending`,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Products",
      value: stats.activeProducts,
      icon: Package,
      description: `${stats.totalProducts} total`,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Customers",
      value: stats.totalCustomers,
      icon: Users,
      description: "Registered users",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }> = {
      pending: { variant: "secondary", icon: Clock },
      confirmed: { variant: "default", icon: CheckCircle },
      processing: { variant: "default", icon: TrendingUp },
      shipped: { variant: "default", icon: TrendingUp },
      delivered: { variant: "default", icon: CheckCircle },
      cancelled: { variant: "destructive", icon: AlertTriangle },
    };
    const { variant, icon: Icon } = config[status] || config.pending;
    return (
      <Badge variant={variant} className="capitalize gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's an overview of your store.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "..." : stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Alerts */}
        {stats.lowStockProducts > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="p-2 rounded-lg bg-orange-100">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-orange-800">Low Stock Alert</p>
                <p className="text-sm text-orange-700">
                  {stats.lowStockProducts} product variant(s) are running low on stock.
                </p>
              </div>
              <Button asChild variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                <Link to="/admin/products">View Products</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/orders">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : stats.recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-4">
                {stats.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(order.status)}
                      <span className="font-semibold">
                        {formatCurrency(Number(order.total))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
