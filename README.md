# Vanam Store - Online Plant Nursery

A fully functional e-commerce platform for an online plant nursery built with Next.js 14, PostgreSQL, and Razorpay.

## 🌿 Features

- **Product Catalog** - Plants, Pots, Combos, Gift Hampers
- **Shopping Cart** - Guest cart (localStorage) + Merge on login
- **Razorpay Payments** - UPI, Cards, NetBanking
- **WhatsApp Integration** - Secondary CTA for orders
- **Admin Dashboard** - Manage products, orders, categories
- **Role-Based Access** - Customer & Admin roles

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Update `.env` with your credentials:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/vanam_store"
JWT_SECRET="your-secret-key"
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."
RAZORPAY_WEBHOOK_SECRET="..."
CLOUDINARY_CLOUD_NAME="your-cloud"
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

### 3. Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database
npm run seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Seed data
├── src/
│   ├── app/             # Next.js App Router pages
│   │   ├── api/         # API routes
│   │   ├── admin/       # Admin dashboard
│   │   ├── cart/        # Cart page
│   │   ├── checkout/    # Checkout page
│   │   ├── login/       # Auth page
│   │   ├── plants/      # Plants catalog
│   │   └── product/     # Product detail
│   ├── components/      # React components
│   ├── context/         # React contexts (Auth, Cart)
│   └── lib/             # Utilities
│       ├── auth.ts      # JWT utilities
│       ├── cloudinary.ts
│       ├── middleware.ts
│       ├── prisma.ts
│       ├── razorpay.ts
│       └── whatsapp.ts
```

## 🔑 Admin Access

After seeding, login as admin:
- **Mobile**: 8897249374
- **Password**: admin123

Access admin panel at `/admin`

## 💳 Payment Integration

Razorpay is integrated with:
- Payment order creation
- Signature verification
- Webhook for payment status updates

## 📱 API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Products
- `GET /api/products`
- `POST /api/products` (Admin)
- `GET/PUT/DELETE /api/products/[id]`

### Cart
- `GET/POST/PUT/DELETE /api/cart`

### Orders
- `GET/POST /api/orders`
- `GET/PUT /api/orders/[id]`

### Payments
- `POST /api/payments/create-order`
- `POST /api/payments/verify`
- `POST /api/webhooks/razorpay`

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **Payments**: Razorpay
- **Images**: Cloudinary
- **Auth**: JWT + bcrypt
