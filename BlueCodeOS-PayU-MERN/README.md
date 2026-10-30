# BlueCode OS — PayU MERN starter

This is a **PayU-only MERN-style starter** converted from the PHP sample:
- MongoDB: stores payment attempts and subscription records
- Express + Node.js: creates PayU requests and verifies PayU callback hashes
- React + Vite: subscription selection and checkout UI

## Important
This is a starter/demo, not a production-ready billing system. It uses PayU's **test environment** by default. Do not use real payments until your PayU account, current PayU integration documentation, callback URLs, deployment HTTPS, and security review are complete.

## Requirements
- Node.js 20+ recommended
- MongoDB local or MongoDB Atlas
- PayU merchant test key and salt

## Setup

### 1. Configure backend
```bash
cd server
npm install
```
Copy `.env.example` to `.env`, then fill in:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/bluecodeos_payments
PAYU_MERCHANT_KEY=your_test_key
PAYU_MERCHANT_SALT=your_test_salt
PAYU_PAYMENT_URL=https://test.payu.in/_payment
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000
PORT=5000
```
Keep the `.env` file private. Never put the PayU salt in React/frontend code or commit it to GitHub.

### 2. Start backend
```bash
npm run dev
```
The API starts at `http://localhost:5000`.

### 3. Configure and start frontend
Open a second terminal:
```bash
cd client
npm install
```
Copy `client/.env.example` to `client/.env` if needed. Then:
```bash
npm run dev
```
Open `http://localhost:5173`.

## Flow
1. User selects a plan in React.
2. React sends plan ID and customer details to `POST /api/payments/create`.
3. Express validates the plan and calculates the amount on the server.
4. Express creates a transaction ID, generates the SHA-512 request hash, and saves a pending payment record in MongoDB.
5. React submits the returned fields to PayU's hosted checkout.
6. PayU posts the result to Express `POST /api/payments/callback`.
7. Express verifies the response hash and stores the result; it redirects the browser to the React result page.

## Plans
Edit `server/src/config/plans.js`. Amounts are defined on the server and the client cannot choose an arbitrary amount.

## Before production
- Confirm the exact request/response hash sequence against the PayU product and account you use.
- Configure HTTPS callback URLs and a stable public `SERVER_URL`.
- Add your existing BlueCode OS authentication and associate orders with the authenticated user ID.
- Verify callback authenticity and reconcile payment status with PayU's server-side verification/status API as required by your PayU integration.
- Add idempotency, duplicate-callback handling, monitoring, rate limits, CSRF/origin controls where appropriate, and database backups.
- Subscription renewals/recurring mandates, cancellations, refunds, GST/invoices, and failed-renewal recovery are **not implemented** by this basic one-time checkout sample.
