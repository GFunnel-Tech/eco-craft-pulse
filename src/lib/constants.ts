// Application constants

export const SITE_NAME = 'KORR';
export const SITE_TAGLINE = 'Performance Apparel';
export const SITE_DESCRIPTION = 'Premium performance apparel designed for athletes who demand excellence. Shop KORR for high-quality athletic wear.';

export const NAVIGATION = {
  main: [
    { name: 'Shop', href: '/shop' },
    { name: 'New Arrivals', href: '/shop?filter=new' },
    { name: 'Collections', href: '/collections' },
    { name: 'About', href: '/about' },
  ],
  categories: [
    { name: 'Men', href: '/shop/men' },
    { name: 'Women', href: '/shop/women' },
    { name: 'Accessories', href: '/shop/accessories' },
  ],
  support: [
    { name: 'Shipping', href: '/shipping' },
    { name: 'Returns', href: '/returns' },
    { name: 'Contact', href: '/contact' },
    { name: 'FAQ', href: '/faq' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
  ],
  social: [
    { name: 'Instagram', href: 'https://instagram.com', icon: 'Instagram' },
    { name: 'Twitter', href: 'https://twitter.com', icon: 'Twitter' },
    { name: 'Facebook', href: 'https://facebook.com', icon: 'Facebook' },
  ],
};

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const COLORS = [
  { name: 'Black', hex: '#1a1a1a' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Coral', hex: '#e07b54' },
  { name: 'Navy', hex: '#1e3a5f' },
  { name: 'Stone', hex: '#a8a29e' },
  { name: 'Sage', hex: '#87a96b' },
];

export const ORDER_STATUSES: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  processing: { label: 'Processing', color: 'bg-indigo-100 text-indigo-800' },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-800' },
};

export const CURRENCY = {
  code: 'USD',
  symbol: '$',
  locale: 'en-US',
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
  }).format(price);
};