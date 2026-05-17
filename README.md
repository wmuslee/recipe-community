# 🍳 Recipe Community

A full-stack social platform for sharing recipes — built with the MERN stack + Next.js.

## 🗂 Project Structure

```
recipe-community/
├── backend/          # Node.js + Express + MongoDB + WebSocket
└── frontend/         # Next.js 14 App Router
```

---

## ✅ Requirements Checklist

| Requirement | Status | Details |
|---|---|---|
| 4+ Mongoose models (5 fields each) | ✅ | User, Recipe, Category, Tag, Comment |
| One-to-many relationship | ✅ | User → Recipe (author field) |
| Many-to-many relationship | ✅ | Recipe ↔ Tag (tags array) + User ↔ Recipe (savedRecipes) |
| JWT Auth + bcrypt | ✅ | register/login/protect middleware |
| WebSocket (ws library) | ✅ | Real-time comments + online users |
| Next.js App Router | ✅ | Server + Client Components |
| Plain CSS / CSS Modules | ✅ | No Tailwind anywhere |
| Responsive design | ✅ | Mobile-first |
| UploadThing (2 types) | ✅ | avatarImage + recipeImage endpoints |
| State management (Context) | ✅ | AuthContext |
| 10+ Jest tests | ✅ | Unit + Integration (backend + frontend) |
| CRUD for 2 resources | ✅ | Recipe + Comment |
| Search + Filter | ✅ | By name, ingredient, category, tag, difficulty, time |
| Real-time feature | ✅ | Live comments + online user count |
| Online users list | ✅ | Shows who's viewing a recipe right now |

---

## 🚀 Setup & Running

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- UploadThing account (uploadthing.com)

---

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGO_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/recipe-community
JWT_SECRET=your_very_secret_key_here
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:3000
```

Seed initial categories and tags:
```bash
node seed.js
```

Start the backend:
```bash
npm run dev      # development (nodemon)
npm start        # production
```

Backend runs on **http://localhost:5000**

---

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000
UPLOADTHING_SECRET=sk_live_your_secret_here
UPLOADTHING_APP_ID=your_app_id_here
```

Start the frontend:
```bash
npm run dev
```

Frontend runs on **http://localhost:3000**

---

### 3. Run Tests

**Backend tests:**
```bash
cd backend
npm test
```

**Frontend tests:**
```bash
cd frontend
npm test
```

---

## 🔧 UploadThing Setup

1. Go to [uploadthing.com](https://uploadthing.com) and create a free account
2. Create a new app
3. Copy `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID` to your `.env.local`
4. The file router is in `frontend/src/app/api/uploadthing/core.js`
5. In `recipes/create/page.js` and `profile/page.js`, replace the URL input with:

```jsx
import { UploadButton } from '@uploadthing/react';

<UploadButton
  endpoint="recipeImage"
  onClientUploadComplete={(res) => {
    if (res?.[0]?.url) setImage(res[0].url);
  }}
  onUploadError={(error) => alert(error.message)}
/>
```

---

## 🌐 Deployment

### Backend → Render

1. Push code to GitHub
2. Create a new Web Service on [render.com](https://render.com)
3. Set root directory to `backend`
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add environment variables from `.env`

### Frontend → Vercel

1. Push code to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Set root directory to `frontend`
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL` → your Render backend URL
   - `NEXT_PUBLIC_WS_URL` → `wss://your-backend.onrender.com`
   - `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID`

---

## 📁 Key Files

### Backend
| File | Purpose |
|---|---|
| `server.js` | HTTP server + WebSocket init |
| `app.js` | Express app + all routes |
| `websocket/wsServer.js` | Real-time WebSocket logic |
| `models/User.js` | User model (auth + savedRecipes) |
| `models/Recipe.js` | Recipe model (one-to-many + many-to-many) |
| `models/Comment.js` | Comment model |
| `models/Category.js` | Category model |
| `models/Tag.js` | Tag model |
| `middleware/protect.js` | JWT auth middleware |
| `seed.js` | Seed categories and tags |
| `tests/app.test.js` | 11 backend tests |

### Frontend
| File | Purpose |
|---|---|
| `app/layout.js` | Root layout + AuthProvider |
| `app/page.js` | Home page (Server Component) |
| `app/recipes/page.js` | Recipe list + search/filter |
| `app/recipes/[id]/page.js` | Recipe detail (Server Component) |
| `app/recipes/[id]/CommentSection.js` | Real-time comments (Client Component) |
| `app/recipes/create/page.js` | Create recipe form |
| `app/recipes/[id]/edit/page.js` | Edit recipe |
| `app/profile/page.js` | My profile + avatar upload |
| `app/favorites/page.js` | Saved recipes |
| `context/AuthContext.js` | Auth state management |
| `lib/api.js` | API helper functions |
| `lib/ws.js` | WebSocket hook |
| `app/api/uploadthing/` | UploadThing route handler |

---

## 🏗 Data Models

### Relationships
```
User ──(1:many)──► Recipe        (author field)
Recipe ──(many:many)──► Tag      (tags[] array)
User ──(many:many)──► Recipe     (savedRecipes[] array)
User ──(1:many)──► Comment
Recipe ──(1:many)──► Comment
```

### WebSocket Message Types
| Type | Direction | Description |
|---|---|---|
| `AUTH` | Client→Server | Authenticate with JWT |
| `JOIN_RECIPE` | Client→Server | Join a recipe room |
| `LEAVE_RECIPE` | Client→Server | Leave a recipe room |
| `NEW_COMMENT` | Client→Server | Broadcast new comment |
| `DELETE_COMMENT` | Client→Server | Broadcast deleted comment |
| `COMMENT_ADDED` | Server→Client | New comment received |
| `COMMENT_DELETED` | Server→Client | Comment removed |
| `ONLINE_USERS` | Server→Client | Current viewers list |

---

## 🔑 API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me              🔒
PUT    /api/auth/profile         🔒

GET    /api/recipes              (search, filter, pagination)
GET    /api/recipes/:id
POST   /api/recipes              🔒
PUT    /api/recipes/:id          🔒 (author only)
DELETE /api/recipes/:id          🔒 (author only)
POST   /api/recipes/:id/like     🔒
POST   /api/recipes/:id/save     🔒
GET    /api/recipes/user/:userId

GET    /api/comments/:recipeId
POST   /api/comments/:recipeId   🔒
PUT    /api/comments/:id         🔒 (author only)
DELETE /api/comments/:id         🔒 (author only)
POST   /api/comments/:id/like    🔒

GET    /api/categories
GET    /api/tags

GET    /api/users/:id
GET    /api/users/:id/saved      🔒

GET    /api/health
```

🔒 = requires JWT token in `Authorization: Bearer <token>` header
