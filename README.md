# BlueCode OS — PayU MERN Application

A full-stack MERN application featuring a modern **Deep Blue Theme UI** and seamless **PayU India Payment Gateway** integration.

---

## ⚡ Quick Start (How to Run)

### 1. Clone the repository
```bash
git clone https://github.com/hareeni2007-dot/blueCode.git
cd blueCode
```

### 2. Install Dependencies
```bash
npm install
npm --prefix BlueCodeOS-PayU-MERN/server install
npm --prefix BlueCodeOS-PayU-MERN/client install
```

### 3. Run the Application

#### Option A: One-Click (Windows)
Double-click `start.bat`.

#### Option B: Single Command (Concurrently)
```bash
npm run dev
```

#### Option C: Run Separately in 2 Terminals
**Backend (Terminal 1):**
```bash
cd BlueCodeOS-PayU-MERN/server
npm run dev
```
🌐 Server running on: `http://localhost:5001`

**Frontend (Terminal 2):**
```bash
cd BlueCodeOS-PayU-MERN/client
npm run dev
```
🌐 Client running on: `http://localhost:5173`

---

## 🎨 Features
- **Blue Theme UI**: Clean, professional dark blue theme replacing all purple accents.
- **PayU Payment Gateway**: Complete test checkout with SHA-512 cryptographic hashing.
- **Auto Fallback**: Works immediately out of the box even without local MongoDB or `.env` configuration.
- **Full-Stack Connectivity**: Frontend and backend are connected and configured for Port 5001.
