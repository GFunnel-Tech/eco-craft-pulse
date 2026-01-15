# Lightspeed eCom API Integration Guide
## Technical Reference for Coral Project

**Document Purpose:** This is a technical supplement to the main Coral Project Specification. Use this document for API integration details when connecting the Lovable-built frontend to Lightspeed eCom backend.

**Platform:** Lightspeed eCom (E-Series) - formerly Ecwid  
**Client Admin URL:** https://my.business.shop/store/125773046  
**API Documentation:** https://api.ecwid.com/api/v3

---

## Table of Contents
1. [Authentication Setup](#authentication-setup)
2. [API Endpoints Reference](#api-endpoints-reference)
3. [Integration Architecture](#integration-architecture)
4. [Data Sync Strategy](#data-sync-strategy)
5. [Webhook Configuration](#webhook-configuration)
6. [CSV Import Implementation](#csv-import-implementation)
7. [Payment Integration Options](#payment-integration-options)
8. [Error Handling](#error-handling)
9. [Rate Limits & Best Practices](#rate-limits--best-practices)
10. [Testing Strategy](#testing-strategy)

---

## Authentication Setup

### Required Credentials

To integrate with Lightspeed eCom, you'll need:

1. **Store ID** - `125773046` (from the URL)
2. **API Access Token** - Obtain from Lightspeed eCom admin panel
3. **OAuth Client ID & Secret** (for advanced integrations)

### Getting API Access Token

**Steps:**
1. Log into https://my.business.shop/store/125773046
2. Navigate to: Settings → Apps → API
3. Click "Create API Key" or "Generate Token"
4. Copy the token (it will only be shown once)
5. Store securely in environment variables

### API Authentication Methods

**Method 1: Bearer Token (Recommended for Server-Side)**
```javascript
const headers = {
  'Authorization': `Bearer ${API_TOKEN}`,
  'Content-Type': 'application/json'
};
```

**Method 2: Token in URL (Alternative)**
```javascript
const url = `https://app.ecwid.com/api/v3/${STORE_ID}/products?token=${API_TOKEN}`;
```

**Method 3: OAuth 2.0 (For Multi-Store Apps)**
- Use for applications managing multiple stores
- Not necessary for single-store integration
- Documentation: https://api.ecwid.com/oauth

### Environment Variables Setup

**Required Environment Variables:**
```bash
LIGHTSPEED_STORE_ID=125773046
LIGHTSPEED_API_TOKEN=secret_xxx_xxxxx_xxxxxxxxxxxxxxxxxxxx
LIGHTSPEED_API_BASE_URL=https://app.ecwid.com/api/v3
```

---

## API Endpoints Reference

### Base URL Structure
```
https://app.ecwid.com/api/v3/{STORE_ID}/{endpoint}
```

### Products API

#### Get All Products
```http
GET /products
```

**Query Parameters:**
- `limit` - Number of products (default: 100, max: 100)
- `offset` - Pagination offset
- `enabled` - Filter by enabled status (true/false)
- `inStock` - Filter by stock status (true/false)
- `category` - Filter by category ID
- `createdFrom` - Filter by creation date (timestamp)
- `updatedFrom` - Filter by update date (timestamp)

**Example Request:**
```javascript
const response = await fetch(
  `${API_BASE_URL}/${STORE_ID}/products?token=${API_TOKEN}&limit=100&enabled=true`,
  {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  }
);

const data = await response.json();
console.log(data.items); // Array of products
console.log(data.count); // Total count
console.log(data.offset); // Current offset
```

**Response Structure:**
```json
{
  "total": 250,
  "count": 100,
  "offset": 0,
  "limit": 100,
  "items": [
    {
      "id": 123456,
      "sku": "LS-LEG-001",
      "name": "High-Waist Performance Leggings",
      "price": 59.99,
      "compareToPrice": 79.99,
      "enabled": true,
      "quantity": 50,
      "unlimited": false,
      "inStock": true,
      "description": "Premium performance leggings...",
      "categoryIds": [12345],
      "defaultCategoryId": 12345,
      "imageUrl": "https://...",
      "media": {
        "images": [
          {
            "id": "987654",
            "url": "https://...",
            "orderBy": 0
          }
        ]
      },
      "options": [
        {
          "type": "SELECT",
          "name": "Size",
          "choices": [
            {"text": "Small", "priceModifier": 0},
            {"text": "Medium", "priceModifier": 0},
            {"text": "Large", "priceModifier": 0}
          ]
        }
      ],
      "created": "2025-01-01T00:00:00.000Z",
      "updated": "2025-01-10T00:00:00.000Z"
    }
  ]
}
```

#### Get Single Product
```http
GET /products/{productId}
```

#### Create Product
```http
POST /products
```

**Request Body:**
```json
{
  "sku": "LS-BRA-001",
  "name": "Performance Sports Bra",
  "price": 45.00,
  "compareToPrice": 60.00,
  "quantity": 100,
  "enabled": true,
  "description": "<p>High-impact sports bra with logo</p>",
  "categoryIds": [12345],
  "weight": 0.2,
  "dimensions": {
    "length": 10,
    "width": 8,
    "height": 2
  },
  "options": [
    {
      "type": "SELECT",
      "name": "Size",
      "choices": [
        {"text": "XS", "priceModifier": 0},
        {"text": "S", "priceModifier": 0},
        {"text": "M", "priceModifier": 0},
        {"text": "L", "priceModifier": 0},
        {"text": "XL", "priceModifier": 0}
      ],
      "required": true
    },
    {
      "type": "SELECT",
      "name": "Color",
      "choices": [
        {"text": "Black", "priceModifier": 0},
        {"text": "Navy", "priceModifier": 0},
        {"text": "Gray", "priceModifier": 0}
      ],
      "required": true
    }
  ]
}
```

**Response:**
```json
{
  "id": 123457
}
```

#### Update Product
```http
PUT /products/{productId}
```

**Request Body:** (Only include fields to update)
```json
{
  "price": 49.99,
  "quantity": 75,
  "enabled": true
}
```

#### Delete Product
```http
DELETE /products/{productId}
```

#### Upload Product Image
```http
POST /products/{productId}/image
```

**Request:**
- Content-Type: `multipart/form-data` or `image/jpeg`
- Body: Binary image data or file

**Example:**
```javascript
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch(
  `${API_BASE_URL}/${STORE_ID}/products/${productId}/image?token=${API_TOKEN}`,
  {
    method: 'POST',
    body: formData
  }
);
```

### Orders API

#### Get All Orders
```http
GET /orders
```

**Query Parameters:**
- `limit` - Number of orders (default: 100, max: 100)
- `offset` - Pagination offset
- `createdFrom` - Filter by creation date (timestamp)
- `createdTo` - Filter by creation date (timestamp)
- `updatedFrom` - Filter by update date (timestamp)
- `updatedTo` - Filter by update date (timestamp)
- `customer` - Filter by customer email or name
- `fulfillmentStatus` - Filter by status (AWAITING_PROCESSING, PROCESSING, SHIPPED, DELIVERED, etc.)
- `paymentStatus` - Filter by payment status (PAID, AWAITING_PAYMENT, etc.)

**Example:**
```javascript
const response = await fetch(
  `${API_BASE_URL}/${STORE_ID}/orders?token=${API_TOKEN}&fulfillmentStatus=AWAITING_PROCESSING&paymentStatus=PAID`,
  {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  }
);

const orders = await response.json();
```

**Response Structure:**
```json
{
  "total": 50,
  "count": 50,
  "offset": 0,
  "limit": 100,
  "items": [
    {
      "id": "123456",
      "orderNumber": 1001,
      "vendorOrderNumber": "CORAL-1001",
      "createDate": "2025-01-15T10:30:00.000Z",
      "updateDate": "2025-01-15T10:35:00.000Z",
      "email": "customer@example.com",
      "total": 125.50,
      "subtotal": 110.00,
      "tax": 9.50,
      "shipping": 6.00,
      "discount": 0,
      "paymentStatus": "PAID",
      "fulfillmentStatus": "AWAITING_PROCESSING",
      "paymentMethod": "Credit Card",
      "billingPerson": {
        "name": "Jane Doe",
        "companyName": "",
        "street": "123 Main St",
        "city": "Charlotte",
        "stateOrProvinceCode": "NC",
        "postalCode": "28202",
        "countryCode": "US",
        "phone": "704-555-0123"
      },
      "shippingPerson": {
        "name": "Jane Doe",
        "street": "123 Main St",
        "city": "Charlotte",
        "stateOrProvinceCode": "NC",
        "postalCode": "28202",
        "countryCode": "US",
        "phone": "704-555-0123"
      },
      "items": [
        {
          "id": 987654,
          "productId": 123456,
          "name": "High-Waist Performance Leggings",
          "sku": "LS-LEG-001",
          "quantity": 2,
          "price": 55.00,
          "productPrice": 55.00,
          "selectedOptions": [
            {
              "name": "Size",
              "value": "Medium"
            },
            {
              "name": "Color",
              "value": "Black"
            }
          ]
        }
      ],
      "shippingOption": {
        "shippingCarrierName": "USPS",
        "shippingMethodName": "Priority Mail",
        "shippingRate": 6.00
      },
      "trackingNumber": "9400111899223344556677",
      "trackingUrl": "https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223344556677"
    }
  ]
}
```

#### Get Single Order
```http
GET /orders/{orderNumber}
```

#### Update Order
```http
PUT /orders/{orderNumber}
```

**Request Body:**
```json
{
  "fulfillmentStatus": "SHIPPED",
  "trackingNumber": "9400111899223344556677",
  "shippingTrackingUrl": "https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223344556677"
}
```

#### Create Order (For Admin Portal)
```http
POST /orders
```

**Request Body:**
```json
{
  "email": "customer@example.com",
  "items": [
    {
      "productId": 123456,
      "quantity": 1,
      "selectedOptions": [
        {"name": "Size", "value": "Medium"}
      ]
    }
  ],
  "shippingPerson": {
    "name": "Jane Doe",
    "street": "123 Main St",
    "city": "Charlotte",
    "stateOrProvinceCode": "NC",
    "postalCode": "28202",
    "countryCode": "US",
    "phone": "704-555-0123"
  },
  "billingPerson": {
    "name": "Jane Doe",
    "street": "123 Main St",
    "city": "Charlotte",
    "stateOrProvinceCode": "NC",
    "postalCode": "28202",
    "countryCode": "US"
  }
}
```

### Customers API

#### Get All Customers
```http
GET /customers
```

#### Get Single Customer
```http
GET /customers/{customerId}
```

#### Create Customer
```http
POST /customers
```

**Request Body:**
```json
{
  "email": "customer@example.com",
  "password": "securePassword123!",
  "customerGroupId": 0,
  "billingPerson": {
    "name": "Jane Doe",
    "companyName": "",
    "street": "123 Main St",
    "city": "Charlotte",
    "stateOrProvinceCode": "NC",
    "postalCode": "28202",
    "countryCode": "US",
    "phone": "704-555-0123"
  },
  "shippingAddresses": [
    {
      "id": 1,
      "name": "Jane Doe",
      "companyName": "",
      "street": "123 Main St",
      "city": "Charlotte",
      "stateOrProvinceCode": "NC",
      "postalCode": "28202",
      "countryCode": "US",
      "phone": "704-555-0123"
    }
  ],
  "acceptMarketing": true
}
```

#### Update Customer
```http
PUT /customers/{customerId}
```

### Categories API

#### Get All Categories
```http
GET /categories
```

#### Get Single Category
```http
GET /categories/{categoryId}
```

#### Create Category
```http
POST /categories
```

**Request Body:**
```json
{
  "name": "Leggings",
  "enabled": true,
  "description": "High-performance leggings for any activity",
  "orderBy": 10
}
```

### Cart API

#### Get Cart
```http
GET /carts/{cartId}
```

#### Create Cart
```http
POST /carts
```

#### Update Cart
```http
PUT /carts/{cartId}
```

### Store Profile API

#### Get Store Profile
```http
GET /profile
```

**Response includes:**
- Store name
- Store URL
- Company information
- Settings
- Payment methods
- Shipping methods

---

## Integration Architecture

### Recommended Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Lovable Frontend                    │
│  (Website, Client Portal, Admin Portal)             │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ HTTPS/REST API
                   │
┌──────────────────▼──────────────────────────────────┐
│              API Gateway Layer                       │
│  (Optional: Rate limiting, caching, auth)           │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌───────────────┐    ┌────────────────┐
│  Lightspeed   │    │     N8N        │
│   eCom API    │◄───┤   Workflows    │
│               │    │   (Optional)   │
└───────────────┘    └────────────────┘
```

### Component Breakdown

**1. Lovable Frontend (React/Next.js)**
- Public website (product catalog, product pages, checkout)
- Client portal (order tracking, account management)
- Admin portal (product management, order management)

**2. API Integration Layer (Serverless Functions or Backend)**
- Handles authentication with Lightspeed
- Implements business logic
- Manages rate limiting
- Error handling and retries
- Caching for performance

**3. Lightspeed eCom Backend**
- Product database
- Order processing
- Payment processing
- Customer database
- Inventory management

**4. N8N (Optional Automation)**
- Webhook listeners
- Scheduled sync jobs
- Email notifications
- Data transformations

### Data Flow Examples

#### Customer Places Order
```
1. Customer adds product to cart (Lovable frontend - local state)
2. Customer proceeds to checkout
3. Frontend calls Lovable backend API
4. Backend validates cart items against Lightspeed inventory
5. Backend creates order in Lightspeed via API
6. Lightspeed processes payment
7. Lightspeed returns order confirmation
8. Backend stores order ID mapping
9. Frontend shows confirmation page
10. Webhook triggers email notification (N8N)
```

#### Admin Adds Product
```
1. Admin logs into admin portal
2. Admin fills out product form
3. Admin uploads product images
4. Frontend sends request to backend
5. Backend uploads images to Lightspeed
6. Backend creates product via Lightspeed API
7. Lightspeed returns product ID
8. Frontend shows success message
9. Product appears on website immediately
```

---

## Data Sync Strategy

### Real-Time vs Batch Sync

**Real-Time Sync (Recommended):**
- Use webhooks for order updates
- API calls on-demand for product views
- Immediate inventory checks before checkout

**Batch Sync (For Heavy Operations):**
- Initial product import from CSV
- Nightly inventory reconciliation
- Bulk product updates

### Sync Frequency Recommendations

| Data Type | Sync Method | Frequency |
|-----------|-------------|-----------|
| Product Views | API Call | On-demand (with 5-min cache) |
| Product Updates | Webhook | Real-time |
| Order Creation | API Call | Immediate |
| Order Status Updates | Webhook | Real-time |
| Inventory Levels | API Call | Before checkout + hourly batch |
| Customer Data | API Call | On-demand |
| Categories | API Call | Daily batch or on-demand |

### Caching Strategy

**Cache Product Catalog:**
```javascript
// Example: Cache product list for 5 minutes
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getProducts(params) {
  const cacheKey = JSON.stringify(params);
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  const data = await fetchFromLightspeed(params);
  cache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  
  return data;
}
```

**Don't Cache:**
- Order status (always fetch fresh)
- Inventory before checkout (always verify)
- Customer sensitive data

---

## Webhook Configuration

### Available Webhooks

Lightspeed eCom supports webhooks for real-time notifications:

- `order.created` - New order placed
- `order.updated` - Order status changed
- `order.deleted` - Order cancelled
- `product.created` - New product added
- `product.updated` - Product modified
- `product.deleted` - Product removed
- `application.uninstalled` - App removed (if using OAuth)

### Setting Up Webhooks

**1. Create Webhook Endpoint in Lovable:**
```javascript
// Example: /api/webhooks/lightspeed
export async function POST(request) {
  const payload = await request.json();
  
  // Verify webhook signature (if configured)
  const signature = request.headers.get('X-Ecwid-Webhook-Signature');
  if (!verifySignature(payload, signature)) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Handle event
  switch (payload.eventType) {
    case 'order.created':
      await handleNewOrder(payload.data);
      break;
    case 'order.updated':
      await handleOrderUpdate(payload.data);
      break;
    // ... other events
  }
  
  return new Response('OK', { status: 200 });
}
```

**2. Register Webhook in Lightspeed:**
```javascript
const registerWebhook = async () => {
  const response = await fetch(
    `${API_BASE_URL}/${STORE_ID}/webhooks?token=${API_TOKEN}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventType: 'order.created',
        url: 'https://your-lovable-app.com/api/webhooks/lightspeed',
        enabled: true
      })
    }
  );
  
  return response.json();
};
```

**3. List All Webhooks:**
```http
GET /webhooks
```

**4. Delete Webhook:**
```http
DELETE /webhooks/{webhookId}
```

### Webhook Payload Example

```json
{
  "eventId": "12345678-1234-1234-1234-123456789012",
  "eventCreated": 1642521600,
  "eventType": "order.created",
  "storeId": 125773046,
  "entityId": 1001,
  "data": {
    "id": "123456",
    "orderNumber": 1001,
    "email": "customer@example.com",
    "total": 125.50,
    "paymentStatus": "PAID",
    "fulfillmentStatus": "AWAITING_PROCESSING",
    // ... full order object
  }
}
```

---

## CSV Import Implementation

### CSV Format Requirements

**Product CSV Columns:**
```csv
SKU,Name,Description,Price,CompareToPrice,Quantity,Category,Image1URL,Image2URL,Image3URL,Size,Color,Weight,Enabled
LS-LEG-001,High-Waist Performance Leggings,"Premium performance leggings",59.99,79.99,50,Leggings,https://example.com/img1.jpg,https://example.com/img2.jpg,,S;M;L;XL,Black;Navy;Gray,0.3,true
LS-BRA-001,Performance Sports Bra,"High-impact sports bra",45.00,60.00,100,Sports Bras,https://example.com/bra1.jpg,,,XS;S;M;L;XL,Black;White;Pink,0.2,true
```

### Import Process Flow

```
1. Admin uploads CSV file
2. Parse CSV and validate format
3. Map columns to Lightspeed fields
4. Preview import (show first 10 rows)
5. Admin confirms import
6. Process in batches (10-20 products at a time)
7. For each product:
   a. Download images from URLs
   b. Create product via API
   c. Upload images via API
   d. Handle errors (log and continue)
8. Generate import report
9. Show success/error summary
```

### Implementation Example

```javascript
async function importProductsFromCSV(csvFile) {
  // 1. Parse CSV
  const products = await parseCSV(csvFile);
  
  // 2. Validate
  const validationErrors = validateProducts(products);
  if (validationErrors.length > 0) {
    return { success: false, errors: validationErrors };
  }
  
  // 3. Process in batches
  const batchSize = 10;
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };
  
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (product) => {
      try {
        // Create product
        const productData = {
          sku: product.SKU,
          name: product.Name,
          description: product.Description,
          price: parseFloat(product.Price),
          compareToPrice: parseFloat(product.CompareToPrice),
          quantity: parseInt(product.Quantity),
          enabled: product.Enabled === 'true',
          weight: parseFloat(product.Weight)
        };
        
        // Add options (Size, Color)
        if (product.Size) {
          productData.options = productData.options || [];
          productData.options.push({
            type: 'SELECT',
            name: 'Size',
            choices: product.Size.split(';').map(size => ({
              text: size,
              priceModifier: 0
            })),
            required: true
          });
        }
        
        if (product.Color) {
          productData.options = productData.options || [];
          productData.options.push({
            type: 'SELECT',
            name: 'Color',
            choices: product.Color.split(';').map(color => ({
              text: color,
              priceModifier: 0
            })),
            required: true
          });
        }
        
        // Create product
        const createResponse = await fetch(
          `${API_BASE_URL}/${STORE_ID}/products?token=${API_TOKEN}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
          }
        );
        
        const { id: productId } = await createResponse.json();
        
        // Upload images
        const imageURLs = [
          product.Image1URL,
          product.Image2URL,
          product.Image3URL
        ].filter(Boolean);
        
        for (const imageUrl of imageURLs) {
          try {
            const imageBlob = await fetch(imageUrl).then(r => r.blob());
            const formData = new FormData();
            formData.append('file', imageBlob);
            
            await fetch(
              `${API_BASE_URL}/${STORE_ID}/products/${productId}/image?token=${API_TOKEN}`,
              {
                method: 'POST',
                body: formData
              }
            );
          } catch (imageError) {
            console.error(`Failed to upload image ${imageUrl}:`, imageError);
          }
        }
        
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          product: product.SKU,
          error: error.message
        });
      }
    }));
    
    // Rate limiting: wait between batches
    if (i + batchSize < products.length) {
      await sleep(2000); // 2 seconds
    }
  }
  
  return results;
}
```

### CSV Template Download

Provide a CSV template for download in the admin portal:

```javascript
function downloadCSVTemplate() {
  const template = `SKU,Name,Description,Price,CompareToPrice,Quantity,Category,Image1URL,Image2URL,Image3URL,Size,Color,Weight,Enabled
EXAMPLE-001,Product Name,Product description here,29.99,39.99,100,Category Name,https://example.com/image1.jpg,https://example.com/image2.jpg,,S;M;L,Red;Blue;Green,0.5,true`;

  const blob = new Blob([template], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'product-import-template.csv';
  link.click();
}
```

---

## Payment Integration Options

### Option 1: Embed Lightspeed Checkout (Recommended)

**Pros:**
- PCI compliant out of the box
- Handles all payment processing
- Supports multiple payment methods
- No additional development needed
- Secure and tested

**Cons:**
- Customer leaves your site briefly
- Less customization of checkout UI

**Implementation:**
```javascript
// Redirect to Lightspeed checkout
function proceedToCheckout(cartId) {
  window.location.href = `https://my.business.shop/store/125773046/checkout?cart=${cartId}`;
}
```

### Option 2: Lightspeed Payments API

**Pros:**
- Custom checkout experience
- Customer stays on your site
- Full control over UI/UX

**Cons:**
- More complex implementation
- PCI compliance requirements
- Additional security considerations

**Implementation:**
```javascript
// Create payment session
const createPaymentSession = async (orderData) => {
  const response = await fetch(
    `${API_BASE_URL}/${STORE_ID}/payment-sessions?token=${API_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: orderData.total,
        currency: 'USD',
        orderId: orderData.orderId,
        returnUrl: 'https://yoursite.com/order-confirmation',
        cancelUrl: 'https://yoursite.com/checkout'
      })
    }
  );
  
  const { paymentUrl } = await response.json();
  return paymentUrl;
};
```

### Option 3: Third-Party Payment Gateway

If Lightspeed allows, integrate with Stripe/Square/PayPal directly and sync to Lightspeed after payment.

**Steps:**
1. Process payment through Stripe/Square/PayPal
2. On success, create order in Lightspeed via API
3. Mark as paid in Lightspeed

---

## Error Handling

### Common Error Codes

| HTTP Code | Meaning | Action |
|-----------|---------|--------|
| 400 | Bad Request | Check request format, missing required fields |
| 401 | Unauthorized | Verify API token, check expiration |
| 403 | Forbidden | Check API permissions, plan limitations |
| 404 | Not Found | Verify resource ID exists |
| 409 | Conflict | Resource already exists (duplicate SKU) |
| 429 | Too Many Requests | Implement rate limiting, retry with backoff |
| 500 | Server Error | Retry with exponential backoff |
| 503 | Service Unavailable | Lightspeed maintenance, retry later |

### Error Response Format

```json
{
  "errorMessage": "Product with SKU 'LS-LEG-001' already exists",
  "errorCode": "DUPLICATE_SKU",
  "httpStatusCode": 409
}
```

### Retry Logic Implementation

```javascript
async function apiCallWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.ok) {
        return await response.json();
      }
      
      // Don't retry client errors (400-499)
      if (response.status >= 400 && response.status < 500) {
        const error = await response.json();
        throw new Error(error.errorMessage || 'Client error');
      }
      
      // Retry server errors (500+) and rate limits (429)
      if (response.status >= 500 || response.status === 429) {
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          await sleep(waitTime);
          continue;
        }
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry
      const waitTime = Math.pow(2, attempt) * 1000;
      await sleep(waitTime);
    }
  }
}
```

### Logging Errors

```javascript
function logAPIError(endpoint, error, context = {}) {
  console.error('Lightspeed API Error:', {
    timestamp: new Date().toISOString(),
    endpoint,
    error: error.message,
    stack: error.stack,
    context
  });
  
  // Send to error tracking service (e.g., Sentry)
  // Sentry.captureException(error, { extra: context });
}
```

---

## Rate Limits & Best Practices

### Rate Limits

**Lightspeed eCom API Limits:**
- **Standard Plan:** 100 requests per minute
- **Plus Plan:** 300 requests per minute
- **Enterprise:** Custom limits

**Best Practices:**
1. Implement request throttling
2. Use caching aggressively
3. Batch operations when possible
4. Use webhooks instead of polling
5. Implement exponential backoff on rate limit errors

### Rate Limiting Implementation

```javascript
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }
  
  async throttle() {
    const now = Date.now();
    
    // Remove old requests outside window
    this.requests = this.requests.filter(
      time => now - time < this.windowMs
    );
    
    if (this.requests.length >= this.maxRequests) {
      // Wait until oldest request expires
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      await sleep(waitTime);
      return this.throttle(); // Recursive check
    }
    
    this.requests.push(now);
  }
}

const rateLimiter = new RateLimiter(90, 60000); // 90 req/min (safety margin)

async function makeAPICall(url, options) {
  await rateLimiter.throttle();
  return fetch(url, options);
}
```

### Optimization Tips

**1. Reduce API Calls:**
```javascript
// BAD: Individual calls for each product
for (const productId of productIds) {
  await getProduct(productId);
}

// GOOD: Batch fetch
const products = await getProducts({ 
  productId: productIds.join(','),
  limit: 100 
});
```

**2. Use Conditional Requests:**
```javascript
// Store ETag from previous request
const etag = previousResponse.headers.get('ETag');

// Use If-None-Match header
const response = await fetch(url, {
  headers: {
    'If-None-Match': etag
  }
});

if (response.status === 304) {
  // Use cached data
  return cachedData;
}
```

**3. Paginate Efficiently:**
```javascript
async function getAllProducts() {
  const allProducts = [];
  let offset = 0;
  const limit = 100;
  
  while (true) {
    const response = await getProducts({ limit, offset });
    allProducts.push(...response.items);
    
    if (response.items.length < limit) {
      break; // No more products
    }
    
    offset += limit;
    await sleep(100); // Small delay between requests
  }
  
  return allProducts;
}
```

---

## Testing Strategy

### Testing Environments

**Development:**
- Use Lightspeed sandbox/test account (if available)
- Mock API responses for rapid development
- Use test payment methods

**Staging:**
- Connect to actual Lightspeed store (non-production)
- Test with real data flow
- Verify webhooks work

**Production:**
- Monitor API calls and errors
- Set up alerts for failures
- Have rollback plan

### Unit Tests

```javascript
import { describe, it, expect, vi } from 'vitest';

describe('Lightspeed API Integration', () => {
  it('should fetch products successfully', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          { id: 1, name: 'Test Product', price: 10.00 }
        ],
        total: 1
      })
    });
    
    global.fetch = mockFetch;
    
    const products = await getProducts();
    
    expect(products.items).toHaveLength(1);
    expect(products.items[0].name).toBe('Test Product');
  });
  
  it('should handle API errors gracefully', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        errorMessage: 'Product not found'
      })
    });
    
    global.fetch = mockFetch;
    
    await expect(getProduct(999)).rejects.toThrow('Product not found');
  });
});
```

### Integration Tests

```javascript
describe('Product Creation Flow', () => {
  it('should create product and upload images', async () => {
    // Create product
    const productData = {
      sku: 'TEST-001',
      name: 'Test Product',
      price: 29.99
    };
    
    const product = await createProduct(productData);
    expect(product.id).toBeDefined();
    
    // Upload image
    const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    await uploadProductImage(product.id, imageFile);
    
    // Verify product has image
    const updatedProduct = await getProduct(product.id);
    expect(updatedProduct.imageUrl).toBeDefined();
    
    // Cleanup
    await deleteProduct(product.id);
  });
});
```

### Manual Testing Checklist

**Products:**
- [ ] Create product via API
- [ ] Update product price/inventory
- [ ] Upload product images
- [ ] Delete product
- [ ] Create product with variants (size, color)
- [ ] Import products from CSV
- [ ] Handle duplicate SKU errors

**Orders:**
- [ ] Create order via API
- [ ] Update order status
- [ ] Add tracking number
- [ ] Cancel order
- [ ] Process refund

**Customers:**
- [ ] Create customer account
- [ ] Update customer information
- [ ] Retrieve customer order history
- [ ] Handle duplicate email errors

**Webhooks:**
- [ ] Receive order.created webhook
- [ ] Receive order.updated webhook
- [ ] Receive product.updated webhook
- [ ] Handle webhook failures gracefully

**Edge Cases:**
- [ ] API rate limit handling
- [ ] Network timeout handling
- [ ] Invalid API token handling
- [ ] Product out of stock during checkout
- [ ] Concurrent order updates
- [ ] Large file uploads (images > 5MB)

---

## Quick Reference

### Environment Variables
```bash
LIGHTSPEED_STORE_ID=125773046
LIGHTSPEED_API_TOKEN=secret_xxx_xxxxx_xxxxxxxxxxxxxxxxxxxx
LIGHTSPEED_API_BASE_URL=https://app.ecwid.com/api/v3
```

### Common API Calls
```javascript
// Get all products
GET /products?token={TOKEN}

// Create product
POST /products?token={TOKEN}

// Update product
PUT /products/{productId}?token={TOKEN}

// Get orders
GET /orders?token={TOKEN}&fulfillmentStatus=AWAITING_PROCESSING

// Update order
PUT /orders/{orderNumber}?token={TOKEN}

// Get customers
GET /customers?token={TOKEN}
```

### Useful Links
- **API Documentation:** https://api.ecwid.com/api/v3
- **Admin Panel:** https://my.business.shop/store/125773046
- **Developer Portal:** https://developers.ecwid.com
- **API Status:** https://status.ecwid.com

---

## Next Steps

1. **Obtain API Credentials:**
   - Log into Lightspeed admin
   - Generate API token
   - Store securely in environment variables

2. **Test API Connection:**
   - Make test API call to GET /profile
   - Verify authentication works
   - Check current product count

3. **Set Up Development Environment:**
   - Configure environment variables
   - Install API client libraries (if using)
   - Set up error logging

4. **Begin Integration:**
   - Start with read-only operations (GET products)
   - Test product display on website
   - Implement product detail page
   - Add cart functionality
   - Integrate checkout
   - Build admin portal features

5. **Test Thoroughly:**
   - Run through all user flows
   - Test error scenarios
   - Verify webhook delivery
   - Load test with expected traffic

6. **Launch:**
   - Monitor API usage
   - Set up alerts
   - Have support plan ready

---

**Document Version:** 1.0  
**Last Updated:** January 15, 2026  
**For:** Coral E-Commerce Project - Christy Perlosky
