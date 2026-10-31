# BlueCode OS — PayU MERN Payment Integration

A full-stack MERN payment integration with **deep blue theme UI**, PayU India payment gateway, and MongoDB.

## Tech Stack
- **Frontend**: React 18 + Vite (Deep Blue Theme UI, port 5173/5174)
- **Backend**: Express + Node.js (port 5001)
- **Database**: MongoDB (local or Atlas) with automatic in-memory fallback
- **Payment**: PayU India (Test Sandbox & Production Ready)

---

## 🚀 Quick Start (Run from GitHub)

### Option 1: One-Click Windows Launcher
Double-click `start.bat` in the root folder. It will automatically launch both the Backend and Frontend in separate windows!

---

### Option 2: Run via NPM

#### 1. Clone the repository
```bash
git clone https://github.com/hareeni2007-dot/blueCode.git
cd blueCode
```

#### 2. Install dependencies
```bash
# In the project root:
npm install
npm --prefix BlueCodeOS-PayU-MERN/server install
npm --prefix BlueCodeOS-PayU-MERN/client install
```

#### 3. Start both Backend and Frontend concurrently
```bash
npm run dev
```

Or run them individually in two separate terminals:

**Terminal 1 — Backend:**
```bash
cd BlueCodeOS-PayU-MERN/server
npm run dev
```
👉 Backend starts at: **http://localhost:5001**

**Terminal 2 — Frontend:**
```bash
cd BlueCodeOS-PayU-MERN/client
npm run dev
```
👉 Frontend starts at: **http://localhost:5173**

---

## 🎨 Theme & UI
- **Theme**: Deep Navy Blue (`#020b18`, `#041529`, `#2563eb`, `#60a5fa`)
- **Plans**: Starter (₹99), Product (₹299), Team (₹799)
- **Checkout**: Seamless checkout modal connected directly to PayU India test sandbox.

---

## ⚙️ Configuration & Environment

Pre-configured sandbox credentials are included by default, so it runs **out of the box** without setup!

To customize credentials, create `.env` files:

### Backend (`BlueCodeOS-PayU-MERN/server/.env`)
```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/bluecodeos_payments
PAYU_MERCHANT_KEY=0pu2TB
PAYU_MERCHANT_SALT=hsSPhuQHRnuEIK3CmS7hMcXFrHiyRyYd
PAYU_PAYMENT_URL=https://test.payu.in/_payment
PAYU_POST_SERVICE_URL=https://test.payu.in/merchant/postservice?form=2
ADMIN_SECRET_KEY=bluecode_admin_secret_key_2026
CLIENT_URL=http://localhost:5173,http://localhost:5174
SERVER_URL=http://localhost:5001
```

### Frontend (`BlueCodeOS-PayU-MERN/client/.env`)
```env
VITE_API_URL=http://localhost:5001
```

---

## 💳 Payment Flow
1. User selects a subscription plan.
2. User enters name, email, phone number in checkout modal.
3. Express server calculates amount and generates SHA-512 cryptographic request hash.
4. User is redirected to PayU hosted checkout page.
5. PayU returns response to backend callback (`/api/payments/callback`).
6. Backend verifies reverse SHA-512 hash and records payment in MongoDB.
7. Frontend displays confirmed payment status with Transaction ID.
