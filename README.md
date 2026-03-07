# 🌾 Northern Harvest

A supply chain platform connecting Canada's northern territories — linking **Hunters/Harvestors**, **Communities/Schools**, and **Mass Suppliers** through a modern mobile app with real-time chat.

## Tech Stack

- **Frontend:** React Native (Expo), React Navigation, Axios, Socket.io-client
- **Backend:** Node.js, Express.js, Socket.io, Mongoose (MongoDB)
- **Auth:** JWT + bcrypt + Expo SecureStore
- **File Storage:** Cloudinary (via multer-storage-cloudinary)
- **Database:** MongoDB Atlas

---

## 🚀 Quick Start

### 1. Set Up External Services

#### MongoDB Atlas (Database)

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and create a free account
2. Click **"Build a Database"** → choose **Free Shared** tier
3. Select a cloud provider & region (choose one closest to Canada for best performance)
4. Create a **Database User** with a username and password (save these!)
5. Under **Network Access**, click **"Add IP Address"** → **"Allow Access from Anywhere"** (for dev)
6. Click **"Connect"** → **"Connect your application"**
7. Copy the connection string — it looks like:
   ```
   mongodb+srv://yourUsername:yourPassword@cluster0.xxxxx.mongodb.net/northern-harvest?retryWrites=true&w=majority
   ```
8. Replace `<password>` with your actual database user password

#### Cloudinary (Image/Document Storage)

1. Go to [https://cloudinary.com](https://cloudinary.com) and create a free account
2. After logging in, go to your **Dashboard**
3. You'll see three values you need:
   - **Cloud Name** (e.g., `dxxxxxxxx`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefg-hijklmn_opqrst`)
4. Copy all three values

### 2. Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and fill in your values:

```env
MONGO_URI=mongodb+srv://yourUser:yourPass@cluster0.xxxxx.mongodb.net/northern-harvest?retryWrites=true&w=majority
JWT_SECRET=generate_a_long_random_string_here
JWT_EXPIRE=30d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=5000
FRONTEND_URL=http://localhost:8081
```

> 💡 Generate a JWT secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### 3. Start the Backend

```bash
cd backend
npm run dev       # Starts with nodemon (auto-restart on changes)
```

You should see:

```
🌾 Northern Harvest server running on port 5000
MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net
```

### 4. Configure Frontend API URL

Edit `frontend/services/api.js` and `frontend/services/socket.js`:

- **If using Expo Go on the same machine:** use `http://localhost:5000`
- **If using Expo Go on a physical phone:** use your computer's local IP:
  ```
  http://192.168.x.x:5000
  ```
  (Find your IP with `ifconfig | grep "inet "` on macOS)

### 5. Start the Frontend

```bash
cd frontend
npx expo start
```

Scan the QR code with Expo Go app on your phone, or press `w` for web.

---

## 📁 Project Structure

```
hack-canada/
├── backend/
│   ├── server.js              ← Express + Socket.io entry point
│   ├── .env                   ← Environment secrets (DO NOT COMMIT)
│   ├── config/
│   │   ├── db.js              ← MongoDB connection
│   │   └── cloudinary.js      ← Cloudinary + Multer config
│   ├── models/
│   │   ├── User.js            ← User schema (3 types)
│   │   ├── Listing.js         ← Harvest/supply posts
│   │   ├── Order.js           ← Order lifecycle
│   │   └── Message.js         ← Chat messages
│   ├── middleware/
│   │   └── auth.js            ← JWT auth + role restriction
│   └── routes/
│       ├── auth.js            ← Register, Login, Profile
│       ├── listings.js        ← CRUD listings
│       ├── orders.js          ← Order management
│       ├── chat.js            ← Chat history
│       └── users.js           ← Dashboard, nearby, profiles
│
└── frontend/
    ├── App.js                 ← Navigation root
    ├── context/
    │   └── AuthContext.js     ← Auth state + JWT persistence
    ├── services/
    │   ├── api.js             ← Axios + endpoint helpers
    │   └── socket.js          ← Socket.io singleton
    ├── screens/
    │   ├── LoginScreen.js
    │   ├── RegisterScreen.js
    │   ├── HunterDashboard.js
    │   ├── CommunityDashboard.js
    │   ├── SupplierDashboard.js
    │   ├── ListingsScreen.js
    │   ├── ListingDetailScreen.js
    │   ├── CreateListingScreen.js
    │   ├── OrdersScreen.js
    │   ├── OrderDetailScreen.js
    │   ├── ChatListScreen.js
    │   ├── ChatRoomScreen.js
    │   └── ProfileScreen.js
    └── components/
        ├── ListingCard.js
        ├── OrderCard.js
        ├── StatusBadge.js
        ├── ChatBubble.js
        └── CategoryPicker.js
```

---

## 👤 User Types

| Type                 | Can Do                                              | Dashboard Shows                           |
| -------------------- | --------------------------------------------------- | ----------------------------------------- |
| **Hunter/Harvestor** | Post harvests, manage orders, chat with buyers      | Active listings, pending/delivered orders |
| **Community/School** | Browse food, place orders, express interest, chat   | Available food count, order tracking      |
| **Mass Supplier**    | Post bulk supplies, manage orders, chat with buyers | Supply inventory, order fulfillment stats |

---

## 🔌 API Endpoints

| Method | Path                         | Access          | Description                |
| ------ | ---------------------------- | --------------- | -------------------------- |
| POST   | `/api/auth/register`         | Public          | Register + document upload |
| POST   | `/api/auth/login`            | Public          | Login, get JWT             |
| GET    | `/api/auth/me`               | Protected       | Auto-login check           |
| PUT    | `/api/auth/me`               | Protected       | Update profile             |
| GET    | `/api/listings`              | Protected       | Browse listings            |
| GET    | `/api/listings/mine`         | Hunter/Supplier | My listings                |
| POST   | `/api/listings`              | Hunter/Supplier | Create listing             |
| POST   | `/api/listings/:id/interest` | Community       | Express interest           |
| POST   | `/api/orders`                | Community       | Place order                |
| GET    | `/api/orders/mine`           | Protected       | My orders                  |
| PUT    | `/api/orders/:id/status`     | Hunter/Supplier | Update order status        |
| GET    | `/api/chat`                  | Protected       | List chat rooms            |
| GET    | `/api/chat/:roomId`          | Member only     | Message history            |
| GET    | `/api/users/dashboard`       | Protected       | Dashboard stats            |
| GET    | `/api/users/nearby`          | Community       | Find nearby suppliers      |

---

## 🔐 Environment Variables Checklist

| Variable                | Where to Get It                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------ |
| `MONGO_URI`             | MongoDB Atlas → Connect → Connection String                                          |
| `JWT_SECRET`            | Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary dashboard                                                                 |
| `CLOUDINARY_API_KEY`    | Cloudinary Dashboard                                                                 |
| `CLOUDINARY_API_SECRET` | Cloudinary Dashboard                                                                 |

---

## License

Built for Hack Canada 🇨🇦

---

## 🐳 Docker Setup

Run the entire backend + tunnel with a single command using Docker Compose.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- A configured `backend/.env` file (see [Configure Backend Environment](#2-configure-backend-environment) above)
- *(Optional)* An [ngrok account](https://dashboard.ngrok.com/signup) for a stable tunnel URL

### Quick Start (Backend + ngrok Tunnel)

```bash
# 1. Clone the repo and enter it
git clone https://github.com/generalgummy/hack-canada.git
cd hack-canada

# 2. Set up your backend/.env (copy example and fill in your values)
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB, Cloudinary, and JWT credentials

# 3. (Optional but recommended) Set ngrok auth token for a stable tunnel
#    Get your free token from https://dashboard.ngrok.com/get-started/your-authtoken
export NGROK_AUTHTOKEN=your_ngrok_auth_token_here

# 4. Start everything
docker compose up --build
```

This starts:
- **Backend API** on `http://localhost:5001`
- **ngrok tunnel** with a public HTTPS URL (check `http://localhost:4040` to find it)

### Finding Your ngrok Public URL

After `docker compose up`, open **http://localhost:4040** in your browser. You'll see the ngrok dashboard showing your public URL, e.g.:

```
https://xxxx-xxx-xxx-xxx-xxx.ngrok-free.app
```

Copy this URL and update the frontend:

1. Edit `frontend/services/api.js` — set `API_URL` to `https://YOUR-URL.ngrok-free.app/api`
2. Edit `frontend/services/socket.js` — set `SOCKET_URL` to `https://YOUR-URL.ngrok-free.app`

### Using a Stable ngrok Domain (Recommended)

Free ngrok tunnels get a random URL every restart. To fix this:

1. Sign up at [ngrok.com](https://ngrok.com) (free)
2. Go to **Domains** → claim a free static domain (e.g., `my-app.ngrok-free.app`)
3. Set your auth token:
   ```bash
   export NGROK_AUTHTOKEN=your_token_here
   ```
4. Update `docker-compose.yml` ngrok command:
   ```yaml
   command: ["http", "backend:5001", "--domain=my-app.ngrok-free.app", "--log=stdout"]
   ```
5. Now the URL never changes — set it once in `api.js` and `socket.js` and forget about it!

### Running the Frontend

The frontend is a React Native (Expo) app that runs on your **physical phone** via Expo Go — it can't run inside Docker. Run it locally:

```bash
cd frontend
npm install
npx expo start --tunnel
```

Scan the QR code with Expo Go on your phone.

### Running Frontend in Docker (Optional)

If you want to run the Expo dev server in Docker too:

```bash
docker compose --profile with-frontend up --build
```

### Docker Commands Reference

```bash
# Start services (backend + ngrok)
docker compose up --build

# Start in background (detached)
docker compose up --build -d

# View logs
docker compose logs -f

# View only backend logs (to see OTP codes)
docker compose logs -f backend

# Stop everything
docker compose down

# Rebuild after code changes
docker compose up --build

# Remove everything (containers + images)
docker compose down --rmi all
```

### Docker Environment Variables

| Variable         | Where to Set     | Description                          |
| ---------------- | ---------------- | ------------------------------------ |
| `MONGO_URI`      | `backend/.env`   | MongoDB Atlas connection string      |
| `JWT_SECRET`     | `backend/.env`   | JWT signing secret                   |
| `CLOUDINARY_*`   | `backend/.env`   | Cloudinary credentials (3 values)    |
| `PORT`           | `backend/.env`   | Backend port (default: `5001`)       |
| `NGROK_AUTHTOKEN`| Shell / `.env`   | ngrok auth token (optional but recommended) |

### Troubleshooting Docker

| Issue                          | Fix                                                            |
| ------------------------------ | -------------------------------------------------------------- |
| `port 5001 already in use`     | Stop local backend: `lsof -ti:5001 \| xargs kill -9`          |
| ngrok says `too many sessions` | Free plan allows 1 tunnel — stop any local ngrok first         |
| Can't connect from phone       | Check ngrok URL at `http://localhost:4040`, update `api.js`    |
| Backend won't start            | Check `backend/.env` exists with valid MongoDB URI             |
| OTP not showing                | Run `docker compose logs -f backend` to see OTP in logs        |
