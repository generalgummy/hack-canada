# 🌾 Northern Harvest

A supply chain platform connecting Canada's northern territories — linking **Hunters/Harvestors**, **Communities/Schools**, and **Mass Suppliers** through a modern mobile app with real-time chat.

## Tech Stack

- **Frontend:** React Native (Expo), React Navigation, Axios, Socket.io-client
- **Backend:** Node.js, Express.js, Socket.io, Mongoose (MongoDB)
- **Auth:** JWT + bcrypt + Expo SecureStore
- **File Storage:** Cloudinary (via multer memory storage)
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
PORT=5001
FRONTEND_URL=http://localhost:8081
```

> 💡 The `backend/.env` file is included in the repo for convenience. If you're setting up your own instance, update the values above.

> 💡 Generate a JWT secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### 3. Start the Backend

```bash
cd backend
npm install
npm start         # or: npm run dev (with nodemon for auto-restart)
```

You should see:

```
🌾 Northern Harvest server running on port 5001
MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net
```

### 4. Configure Frontend API URL

Edit `frontend/services/api.js` and `frontend/services/socket.js`:

- **If using Expo Go on the same machine:** use `http://localhost:5001`
- **If using Expo Go on a physical phone:** use your computer's local IP or ngrok:
  ```
  http://192.168.x.x:5001
  ```
  (Find your IP with `ifconfig | grep "inet "` on macOS)

### 5. Start the Frontend

```bash
cd frontend
npx expo start
```

Scan the QR code with Expo Go app on your phone, or press `w` for web.

---

## 🌐 Web Browser Support (Desktop & Tablet)

The app is **fully responsive** and works on desktop browsers, tablets, and mobile devices:

- **📱 Mobile (< 768px):** Bottom tab navigation, optimized spacing and fonts
- **📱 Tablet (768px - 1024px):** Similar to mobile with slightly larger text
- **🖥️ Desktop (> 1024px):** Sidebar navigation with professional layout, centered content with max-width

### How to Test on Web

```bash
# Start frontend in web mode
npm start
# or with Expo
npx expo start
# then press 'w' to open in browser
```

Open your browser at `http://localhost:8081` and resize to see the responsive layout in action.

### Responsive Design Features

The app uses a custom **`useResponsive` hook** that provides:

- Automatic screen size detection (mobile, tablet, desktop)
- Responsive spacing values
- Responsive font sizes
- Conditional rendering of navigation (sidebar vs bottom tabs)
- Content max-width on desktop for readability

### Extending Responsive Design to Other Screens

To make other screens responsive like `HunterDashboard`:

1. Import the utilities:
   ```javascript
   import { useResponsive } from '../hooks/useResponsive';
   import ResponsiveContainer from '../components/ResponsiveContainer';
   ```

2. Use in your screen:
   ```javascript
   const YourScreen = ({ navigation }) => {
     const { isDesktop, spacing, fontSize } = useResponsive();
     
     return (
       <ResponsiveContainer>
         <Text style={{ fontSize: fontSize.lg, marginVertical: spacing.md }}>
           This text scales on desktop!
         </Text>
       </ResponsiveContainer>
     );
   };
   ```

---

## 📁 Project Structure

```
hack-canada/
├── backend/
│   ├── server.js              ← Express + Socket.io entry point
│   ├── .env                   ← Environment secrets (included for contributors)
│   ├── .env.example           ← Template for .env
│   ├── config/
│   │   ├── db.js              ← MongoDB connection
│   │   └── cloudinary.js      ← Cloudinary + Multer config
│   ├── models/
│   │   ├── User.js            ← User schema (3 types + OTP fields)
│   │   ├── Listing.js         ← Harvest/supply posts
│   │   ├── Order.js           ← Order lifecycle
│   │   └── Message.js         ← Chat messages
│   ├── middleware/
│   │   └── auth.js            ← JWT auth + role restriction
│   └── routes/
│       ├── auth.js            ← Register, Login, OTP verify/resend, Profile
│       ├── listings.js        ← CRUD listings
│       ├── orders.js          ← Order management
│       ├── chat.js            ← Chat history
│       └── users.js           ← Dashboard, nearby, profiles
│
└── frontend/
    ├── App.js                 ← Navigation root (responsive: sidebar + tabs)
    ├── context/
    │   └── AuthContext.js     ← Auth state + JWT persistence + OTP flow
    ├── hooks/
    │   └── useResponsive.js   ← Responsive design utilities (screen size detection)
    ├── services/
    │   ├── api.js             ← Axios + endpoint helpers
    │   └── socket.js          ← Socket.io singleton
    ├── screens/
    │   ├── LoginScreen.js     ← Phone + password login
    │   ├── RegisterScreen.js  ← Multi-step registration
    │   ├── OTPScreen.js       ← 6-digit OTP verification
    │   ├── HunterDashboard.js ← Example responsive screen
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
        ├── CategoryPicker.js
        ├── DesktopSidebar.js  ← Desktop navigation sidebar
        └── ResponsiveContainer.js ← Responsive layout wrapper
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

| Method | Path                         | Access          | Description                            |
| ------ | ---------------------------- | --------------- | -------------------------------------- |
| POST   | `/api/auth/register`         | Public          | Register + send OTP                    |
| POST   | `/api/auth/login`            | Public          | Login with phone + password, sends OTP |
| POST   | `/api/auth/verify-otp`       | Public          | Verify 6-digit OTP code                |
| POST   | `/api/auth/resend-otp`       | Public          | Resend OTP to phone                    |
| GET    | `/api/auth/me`               | Protected       | Auto-login check                       |
| PUT    | `/api/auth/me`               | Protected       | Update profile                         |
| PUT    | `/api/auth/upload-document`  | Protected       | Upload verification doc                |
| GET    | `/api/listings`              | Protected       | Browse listings                        |
| GET    | `/api/listings/mine`         | Hunter/Supplier | My listings                            |
| POST   | `/api/listings`              | Hunter/Supplier | Create listing                         |
| POST   | `/api/listings/:id/interest` | Community       | Express interest                       |
| POST   | `/api/orders`                | Community       | Place order                            |
| GET    | `/api/orders/mine`           | Protected       | My orders                              |
| PUT    | `/api/orders/:id/status`     | Hunter/Supplier | Update order status                    |
| GET    | `/api/chat`                  | Protected       | List chat rooms                        |
| GET    | `/api/chat/:roomId`          | Member only     | Message history                        |
| GET    | `/api/users/dashboard`       | Protected       | Dashboard stats                        |
| GET    | `/api/users/nearby`          | Community       | Find nearby suppliers                  |

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

## 🐳 Docker Setup (Recommended for Collaborators)

The easiest way to run the project — one command starts everything.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/generalgummy/hack-canada.git
cd hack-canada

# 2. Start the backend + ngrok tunnel
docker compose up --build
```

### Run only the backend (fast iteration)

```bash
# build & start only backend service
docker compose up --build backend

# or in background
docker compose up -d --build backend

# follow backend logs
docker compose logs -f backend
```

### Run backend + frontend together (Expo in Docker)

> Note: the frontend service runs the Expo dev server inside the container. When the frontend runs in Docker it cannot reach `http://localhost:5001` on the host — inside Compose the backend is reachable at `http://backend:5001`.

1. Start both services (frontend is behind a profile `with-frontend`):

```bash
docker compose --profile with-frontend up --build
# or detached
docker compose --profile with-frontend up -d --build
```

2. If you run the frontend inside Docker you should update the API base URL used by the app (temporary change for containerized frontend):

Edit `frontend/services/api.js` and set:

```js
// when running inside docker-compose
const API_URL = "http://backend:5001/api";
```

3. Open the Expo Metro URL printed by the frontend container (it will show `exp://<container-ip>:8081`) or open web at `http://localhost:8081` on the host.

4. To let a physical phone reach the backend when frontend runs in Docker, use the included `ngrok` service (visit `http://localhost:4040` to copy the public tunnel URL and set that as `API_URL` in `frontend/services/api.js`).

### Quick troubleshooting & tips

- If the backend container becomes `unhealthy` check Mongo connection and `.env` (`MONGO_URI`) and then:

```bash
docker compose logs -f backend
# or inspect container status
docker ps --filter name=northern-harvest-backend
```

- To see OTP codes (server prints them), follow backend logs:

```bash
docker compose logs -f backend
```

````

That's it! The `.env` file is already included in the repo with working credentials.

### What Gets Started

| Service  | URL                     | Description                  |
| -------- | ----------------------- | ---------------------------- |
| Backend  | `http://localhost:5001` | Express API server           |
| ngrok UI | `http://localhost:4040` | Shows your public tunnel URL |

### Connecting the Frontend (Mobile App)

1. After `docker compose up`, open **http://localhost:4040** in your browser
2. Copy the **public URL** shown (e.g. `https://xxxx-xxx-xxx.ngrok-free.app`)
3. Edit `frontend/services/api.js`:
   ```js
   const API_URL = "https://xxxx-xxx-xxx.ngrok-free.app/api";
````

4. Edit `frontend/services/socket.js`:
   ```js
   const SOCKET_URL = "https://xxxx-xxx-xxx.ngrok-free.app";
   ```
5. Run the frontend locally:
   ```bash
   cd frontend
   npm install
   npx expo start --tunnel
   ```
6. Scan the QR code with **Expo Go** on your phone

### Using a Stable ngrok URL (Optional)

Free ngrok gives a random URL every restart. To get a **fixed URL**:

1. Create a free account at [ngrok.com](https://ngrok.com)
2. Go to **Domains** → claim a free static domain
3. Set your auth token before starting:
   ```bash
   export NGROK_AUTHTOKEN=your_token_here
   docker compose up --build
   ```

### Docker Commands

```bash
# Start everything
docker compose up --build

# Start in background
docker compose up --build -d

# View backend logs (to see OTP codes)
docker compose logs -f backend

# Stop everything
docker compose down

# Full rebuild (after code changes)
docker compose down && docker compose up --build
```

### Troubleshooting

| Problem                   | Solution                                                |
| ------------------------- | ------------------------------------------------------- |
| Port 5001 already in use  | `lsof -ti:5001 \| xargs kill -9` then retry             |
| ngrok "too many sessions" | Stop any local ngrok: `pkill -f ngrok`                  |
| Can't connect from phone  | Check URL at `http://localhost:4040`, update `api.js`   |
| OTP not showing           | Run `docker compose logs -f backend` to see OTP in logs |

- Made for Hack Canada by Tarun philip, Isla Mukheef, Lukman ❤️
