# Deployment Guide for SkillFlow

This guide outlines the steps to deploy your MERN stack application.

## 1. Database (MongoDB Atlas)
Since your local MongoDB cannot be accessed by a deployed server, you need a cloud database.

1.  Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  Create a free cluster.
3.  Create a database user (username/password).
4.  Allow access from anywhere (IP `0.0.0.0/0`) in Network Access.
5.  Get the connection string (Driver: Node.js).
    *   Format: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/skillflow?retryWrites=true&w=majority`

## 2. Backend Deployment (Render / Railway)
The backend needs a server to run Node.js.

### Option A: Render (Free Tier)
1.  Push your code to GitHub.
2.  Sign up at [Render](https://render.com/).
3.  Create a **Web Service**.
4.  Connect your GitHub repo.
5.  **Root Directory**: `backend`
6.  **Build Command**: `npm install`
7.  **Start Command**: `node server.js`
8.  **Environment Variables**:
    *   `MONGO_URI`: (Your Atlas connection string)
    *   `JWT_SECRET`: (A secure random string)
    *   `PORT`: `10000` (Render sets this automatically, but good to have)

## 3. Frontend Deployment (Vercel / Netlify)
The frontend is a static site (React/Vite).

### Option A: Vercel
1.  Sign up at [Vercel](https://vercel.com/).
2.  Import your GitHub repo.
3.  **Root Directory**: `.` (default) or `skillflow` if it's in a subfolder.
4.  **Build Command**: `npm run build` (default)
5.  **Output Directory**: `dist` (default)
6.  **Environment Variables**:
    *   You need to tell the frontend where the backend is.
    *   Update `services/storageService.ts` to use an environment variable or manually set the URL before deploying.
    *   Better approach: Use `VITE_API_URL` in `.env.production`.

    **Action Required before deploying frontend:**
    Update `services/storageService.ts`:
    ```typescript
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    ```

## Summary Checklist
- [ ] Create MongoDB Atlas Cluster
- [ ] Push code to GitHub
- [ ] Deploy Backend (Render/Railway)
- [ ] Update Frontend code to use dynamic API URL
- [ ] Deploy Frontend (Vercel)
