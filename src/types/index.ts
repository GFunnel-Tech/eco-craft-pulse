// Core E-commerce Types

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  compare_at_price: number | null;
  cost_price: number | null;
  category_id: string | null;
  brand: string;
  material: string | null;
  care_instructions: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  color: string | null; // Links image to specific color, null = general image
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  size: string | null;
  color: string | null;
  color_hex: string | null;
  price_adjustment: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  user_id: string | null;
  session_id: string | null;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: Product;
  variant?: ProductVariant;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  email: string;
  status: OrderStatus;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  currency: string;
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

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Address {
  id?: string;
  user_id?: string;
  label?: string;
  first_name: string;
  last_name: string;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string | null;
  is_default?: boolean;
}

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  marketing_opt_in: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'customer';
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  is_active: boolean;
  subscribed_at: string;
  unsubscribed_at: string | null;
}