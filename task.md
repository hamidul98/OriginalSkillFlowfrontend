# Deployment Checklist

- [x] **Database**: Set up MongoDB Atlas and get connection string
- [x] **Backend**: Upload to GitHub
- [x] **Backend**: Deploy to Render
    - [x] Configure Environment Variables
    - [x] Click "Deploy Web Service"
    - [x] Wait for "MongoDB Connected" log
    - [x] Copy Backend URL (https://skillflow-backend-xc26.onrender.com)
- [/] **Frontend**: Prepare for Deployment
    - [ ] Update `services/storageService.ts` to use `VITE_API_URL`
    - [ ] Create `.env.production` with the Render Backend URL
- [ ] **Frontend**: Deploy to Vercel
    - [ ] Upload to GitHub (Frontend files)
    - [ ] Connect to Vercel
    - [ ] Add Environment Variables in Vercel
