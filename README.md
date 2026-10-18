# 🎨 ParthCraft12 — Handmade Art & Craft Creator Platform

A full-stack **MERN** craft creator website, art-sharing community, and handmade-product shop in one installable Progressive Web App (PWA). Built for **ParthCraft12** to showcase YouTube tutorials, connect with fellow craft creators, and sell handmade artwork with QR UPI checkout and WhatsApp order confirmations.

---

## 🌟 What is ParthCraft12?

ParthCraft12 blends three pillars into a unified experience:
1. **The Creator Showcase & Shop:** Discover unique handmade paintings, origami, calligraphy, knitwear, and decor crafted by ParthCraft12. Direct ordering via UPI QR code payment and instant WhatsApp confirmation.
2. **The Craft Community:** An art-sharing platform where anyone can register, share photos of their own crafts or link YouTube tutorials, like, bookmark, and discuss creative ideas.
3. **The Creator Hub:** Integrated with ParthCraft12's YouTube channel tutorials, about page, and maker story.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite 8, React Router v6, Axios, Vanilla CSS design system (warm craft aesthetic: terracotta `#C65B3D`, warm paper `#F6F0E4`, sage green `#4A6B5D`, charcoal `#2C221E`, Google Fonts *Fraunces* + *DM Sans*).
- **Backend:** Node.js, Express 4 (CommonJS), MongoDB Atlas (Mongoose 8), JWT Auth, Multer, Helmet, Mongo-Sanitize, HPP, Rate-Limiting.
- **Media & Storage:** Cloudinary CDN for persistent product, community, and payment proof images (with local disk fallback).
- **Email:** Resend API for OTP registration, password resets, and instant admin order notifications.
- **PWA:** Installable Progressive Web App with custom service worker caching, manifest, and icons (192×192, 512×512).

---

## 📁 Repository Structure

```
parth_website/
├── backend/
│   ├── config/          # Admin email allowlist, database connection
│   ├── middleware/      # Auth, Admin, OptionalAuth, error handling
│   ├── models/          # Mongoose models (User, Product, Order, CommunityPost, SiteSettings, etc.)
│   ├── routes/          # Express API endpoints
│   ├── utils/           # Resend email, Cloudinary uploader, Order emails
│   ├── server.js        # Express app entry point
│   ├── .env.example     # Environment variable template
│   └── package.json
├── frontend/
│   ├── public/          # Manifest, PWA icons, Service Worker (sw.js)
│   ├── src/
│   │   ├── api/         # Axios client with JWT interceptor
│   │   ├── components/  # Navbar, Footer, BottomNav, ProductCard, AdminBadge, etc.
│   │   ├── context/     # AuthContext (login, register, session)
│   │   ├── pages/       # Home, Shop, ProductDetail, Community, CreatePost, OrderFlow, MyOrders, AdminDashboard, Profile, About, etc.
│   │   ├── utils/       # Image helpers, error handlers, WhatsApp deep links
│   │   ├── index.css    # Complete craft design system
│   │   ├── App.jsx      # Route tree
│   │   └── main.jsx     # App entry & service worker registration
│   ├── vite.config.js   # Vite config with backend proxy
│   └── package.json
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v20/v25)
- **MongoDB Atlas** database connection string (or local MongoDB)
- **Cloudinary** account (free tier — for persistent image uploads)
- **Resend** account (free tier — for OTP verification & order emails)

---

### 2. Backend Setup

1. Open a terminal and navigate to `backend`:
   ```bash
   cd backend
   npm install
   ```

2. Create your `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   # On Windows PowerShell:
   Copy-Item .env.example .env
   ```

3. Fill in your environment variables in `backend/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/parthcraft12?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_jwt_key_here
   FRONTEND_URL=http://localhost:3000
   ADMIN_EMAILS=prathamraj2411@gmail.com

   # Cloudinary (Image uploads)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Resend (Email OTP & Order notifications)
   RESEND_API_KEY=re_your_api_key_here
   RESEND_FROM_EMAIL=onboarding@resend.dev
   ```

4. Start the backend:
   ```bash
   npm run dev
   # Runs on http://localhost:5000
   ```

> 💡 **Local Development OTP bypass:** If you don't have a Resend key yet, leave `RESEND_API_KEY=re_your_api_key_here`. In development mode, the OTP is printed directly to your backend console!

---

### 3. Frontend Setup

1. Open a terminal and navigate to `frontend`:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   # Runs on http://localhost:3000
   ```

3. Open your browser at `http://localhost:3000`.

---

## 📱 Core Features

### 🛍️ Storefront & Checkout
- **Photography-First Shop:** Filter products by craft category (Paintings, Origami, Crochet, Pottery, etc.), search by title, filter made-to-order vs in-stock items.
- **Product Details:** Multi-photo gallery, craft specifications (dimensions, materials, prep time), made-to-order badges, and direct order options.
- **Cart-Free 3-Step Checkout:**
  1. **Delivery Details:** Customer name, phone, email, full shipping address, order notes.
  2. **UPI QR Payment:** Interactive QR code displayed for instant UPI scanning with payment instructions. Customer uploads payment screenshot proof.
  3. **Order Confirmation & WhatsApp:** Generates unique order reference (`PC-...`), sends automated email notification to admin, and provides a direct WhatsApp link pre-filled with order details.
- **Customer Order Tracking:** "My Orders" tab with status badges: *Awaiting Verification*, *Payment Confirmed*, *Processing*, *Shipped*, *Delivered*.

### 🎨 Community Sharing
- **Art Feed:** Visual masonry grid showcasing community creations with category badges and engagement metrics.
- **Create Post:** Upload craft photos (up to 4) or submit YouTube tutorial video URLs with title, description, category, and tags.
- **Post Interactions:** Like, bookmark to personal collection, and comment discussions.
- **Safety & Moderation:** Report button on posts with reasons (Spam, Inappropriate, Harassment, Copyright). Admins review reported content in the dashboard.

### ⚙️ Admin Dashboard
- **Store Management:** Create, edit, and feature products with craft attributes.
- **Order Management:** View all incoming orders, inspect payment screenshot proofs, and update status (*Payment Confirmed*, *Processing*, *Shipped* with tracking info, *Delivered*).
- **Community Moderation:** Approve, hide, or remove flagged community posts and resolve user reports.
- **Site Settings:** Update store branding, creator bio, YouTube channel link, UPI QR image, shipping rates, and return policies directly from the UI.

---

## 🌐 API Overview

| Resource | Route Prefix | Description |
|---|---|---|
| **Auth** | `/api/auth` | Register (OTP), Login, Forgot Password, Profile |
| **Products** | `/api/products` | Browse, Filter, Search, Create (Admin), Update, Delete |
| **Community** | `/api/community` | Feed, Create Post, Post Details, Comments, Likes, Bookmarks, Reports |
| **Orders** | `/api/orders` | Create Order, Upload Proof, User Orders, Order Tracking |
| **Settings** | `/api/settings` | Public site configuration, UPI QR, Social links |
| **Admin** | `/api/admin` | Dashboard stats, Order status updates, Moderation queue |

---

## 🚢 Deployment

### Frontend (Vercel)
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables:
  - `VITE_API_URL`: Your Render backend URL (e.g. `https://parthcraft12-backend.onrender.com`)

### Backend (Render)
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `node server.js`
- Environment Variables:
  - All variables from `backend/.env.example`
