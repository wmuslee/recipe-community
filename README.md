# 🍳 Recipe Community

## 🔗 Live Links
- **Frontend:** https://recipe-community-black.vercel.app
- **Backend API:** https://recipe-community-backend.onrender.com
- **Health Check:** https://recipe-community-backend.onrender.com/api/health

## 🎥 Video Demo
[Watch Demo](https://youtu.be/qmydGNgF33E)

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- UploadThing account

### 1. Clone the repository
```cmd
git clone https://github.com/ТВОЙ_НИКНЕЙМ/recipe-community.git
cd recipe-community
```

### 2. Backend
```cmd
cd backend
npm install
copy .env.example .env
```

Заполни `.env`:
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:3000
```

```cmd
node seed.js
npm run dev
```

### 3. Frontend
```cmd
cd frontend
npm install
copy .env.local.example .env.local
```

Заполни `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000
UPLOADTHING_TOKEN=your_token
```

```cmd
npm run dev
```

### 4. Открой браузер
```
http://localhost:3000
```
