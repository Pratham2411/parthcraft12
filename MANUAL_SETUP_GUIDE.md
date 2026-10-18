# 📋 ParthCraft12 — Manual Setup Checklist & Configuration Guide

This guide covers everything you need to set up manually to run, configure, and deploy **ParthCraft12**.

---

## 📑 Quick Summary of External Services

| Service | Purpose | Free Tier Available? | Required for Local Dev? |
|---|---|---|---|
| **MongoDB Atlas** | Database (Products, Orders, Community, Users) | Yes (512MB M0 cluster) | **Yes** (or local MongoDB) |
| **Cloudinary** | Image storage (Products, Community photos, Payment proofs) | Yes (25GB storage/credits) | Recommended (local uploads work as fallback) |
| **Resend** | Email OTP & Order notifications | Yes (3,000 emails/mo) | Optional (local dev prints OTP to terminal) |
| **UPI QR Code** | Customer payments | N/A (Your GPay / PhonePe / Paytm QR) | Needed for real payments |
| **WhatsApp** | Order notifications & customer chats | N/A (Your phone number) | Needed for WhatsApp buttons |
| **Render** | Backend hosting | Yes | Only for live deployment |
| **Vercel** | Frontend hosting | Yes | Only for live deployment |

---

## 1. 🗄️ Database Setup (MongoDB Atlas)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in or create a free account.
2. Create a new **Free Shared Cluster (M0)**.
3. Under **Database Access**:
   - Create a database user (e.g. `parth_admin`).
   - Choose a secure password and save it.
4. Under **Network Access**:
   - Add IP Address `0.0.0.0/0` (Allow access from anywhere) so Render and your local machine can connect.
5. Under **Database**:
   - Click **Connect** → **Drivers (Node.js)**.
   - Copy the connection string. It looks like:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/parthcraft12?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with your credentials.
   - Set the database name to `parthcraft12`.

---

## 2. 🔑 Backend Environment Variables (`backend/.env`)

In your `backend` folder, create a file named `.env` and add:

```env
# ─── Server Configuration ─────────────────────
PORT=5000
NODE_ENV=development

# ─── MongoDB Atlas ───────────────────────────
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/parthcraft12?retryWrites=true&w=majority

# ─── JWT Authentication ──────────────────────
# Generate a random 32+ character string (e.g., node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=replace_with_a_secure_random_string_here

# ─── Frontend Origin ─────────────────────────
FRONTEND_URL=http://localhost:3000

# ─── Admin Allowlist ─────────────────────────
# Comma-separated list of admin email addresses
ADMIN_EMAILS=prathamraj2411@gmail.com

# ─── Cloudinary (Image Hosting) ──────────────
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# ─── Resend (Transactional Emails) ───────────
# If left as re_your_api_key_here, dev mode prints OTPs to console
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev
```

---

## 3. 🖼️ Cloudinary Setup (For Image Uploads)

1. Sign up for a free account at [Cloudinary](https://cloudinary.com).
2. Go to your **Cloudinary Dashboard**.
3. Copy the three credentials:
   - **Cloud Name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`
4. Paste these into `backend/.env`.

*(Note: If Cloudinary is not configured, the backend will automatically save uploads to the local `backend/uploads/` directory during local testing.)*

---

## 4. 📧 Email Setup (Resend)

1. Sign up at [Resend](https://resend.com).
2. Go to **API Keys** and click **Create API Key**.
3. Paste the key into `backend/.env` under `RESEND_API_KEY`.
4. While developing locally or testing with a free account, `RESEND_FROM_EMAIL=onboarding@resend.dev` will send emails to your verified account email. When you connect a custom domain in Resend, update `RESEND_FROM_EMAIL` to `orders@yourdomain.com`.

---

## 5. 💳 Store & Payment Configuration (In the App)

Once the backend and frontend are running:

1. **Register your Admin Account**:
   - Register on the website with an email listed in `ADMIN_EMAILS` (e.g. `prathamraj2411@gmail.com`).
   - The user will automatically receive `role: "admin"`.
2. **Open the Admin Dashboard** (`http://localhost:3000/admin`):
   - Navigate to the **⚙️ Site Settings** tab.
3. **Configure your Store**:
   - **WhatsApp Number**: Enter your 10-digit or international WhatsApp phone number (e.g., `919876543210` with country code, no `+` or spaces).
   - **UPI QR Code Image**: Upload an image of your Google Pay / PhonePe / Paytm / BHIM QR code. This will be shown to buyers during the 3-step checkout.
   - **Payment Instructions**: Custom instructions for buyers (e.g. "Pay the exact amount and upload the screenshot with transaction UTR/reference number").
   - **YouTube Channel**: Set your channel URL (e.g. `https://www.youtube.com/@parthcraft12`).
   - **Shipping Charges & Policies**: Set standard shipping rates, return policy, and store bio.
4. Click **Save Settings**.

---

## 6. 🚀 Running the App Locally

### Terminal 1 — Backend:
```bash
cd backend
npm run dev
# Starts on http://localhost:5000
```

### Terminal 2 — Frontend:
```bash
cd frontend
npm run dev
# Starts on http://localhost:3000
```

---

## 7. 🌐 Production Deployment Steps

### A. Deploy Backend to Render (Free Web Service)
1. Push your repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Under **Environment Variables**, add all keys from your `backend/.env`:
   - `NODE_ENV`: `production`
   - `MONGO_URI`: (Your Atlas connection string)
   - `JWT_SECRET`: (Your secret)
   - `ADMIN_EMAILS`: (Your admin emails)
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
   - `FRONTEND_URL`: (Your Vercel frontend URL, e.g. `https://parthcraft12.vercel.app`)
6. Deploy and note your Render backend URL (e.g., `https://parthcraft12-backend.onrender.com`).

### B. Deploy Frontend to Vercel (Free Static / SPA)
1. In [Vercel Dashboard](https://vercel.com), click **Add New** → **Project**.
2. Import your GitHub repository.
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
4. Under **Environment Variables**:
   - `VITE_API_URL`: Your Render backend URL (e.g., `https://parthcraft12-backend.onrender.com`)
5. Click **Deploy**.

---

## 8. 📱 PWA Mobile Installation Test
- Open your live site in Chrome or Safari on mobile.
- Click **Add to Home Screen** or the install prompt.
- The app will install with the ParthCraft12 warm icon and launch in full-screen standalone mode.
