# 🖼️ MERN Stack Image Upload App - Setup Guide

## 📋 **Prerequisites**
- Node.js (v14 or higher)
- npm or yarn
- Modern web browser
- MongoDB Atlas account (free)

---

## 🗄️ **Step 1: Set Up MongoDB Atlas Database**

### 1.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Verify your email

### 1.2 Create Database Cluster
1. Click "Build a Database"
2. Choose "FREE" tier (M0)
3. Select cloud provider (AWS/Google Cloud/Azure)
4. Choose region closest to you
5. Click "Create Cluster"

### 1.3 Configure Database Access
1. Go to "Database Access" → "Add New Database User"
2. Username: `imageapp_user`
3. Password: Create a strong password (save this!)
4. Role: "Read and write to any database"
5. Click "Add User"

### 1.4 Configure Network Access
1. Go to "Network Access" → "Add IP Address"
2. Click "Allow Access from Anywhere" (0.0.0.0/0)
3. Click "Confirm"

### 1.5 Get Connection String
1. Go to "Database" → "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your actual password
5. Replace `<dbname>` with `image-upload-app`

**Example connection string:**
```
mongodb+srv://imageapp_user:your_actual_password@cluster0.xxxxx.mongodb.net/image-upload-app?retryWrites=true&w=majority
```

---

## ⚙️ **Step 2: Configure Environment Variables**

### 2.1 Update .env File
1. Open the `.env` file in your project root
2. Replace the MONGODB_URI with your Atlas connection string:

```env
MONGODB_URI=mongodb+srv://imageapp_user:your_actual_password@cluster0.xxxxx.mongodb.net/image-upload-app?retryWrites=true&w=majority
PORT=5000
NODE_ENV=development
```

**⚠️ Important:** 
- Replace `your_actual_password` with the password you created
- Replace the cluster URL with your actual cluster URL
- Keep this file secure and never commit it to version control

---

## 🚀 **Step 3: Start the Application**

### 3.1 Start Backend Server
```bash
# In the root directory (E:\Components)
npm run server
```

**Expected output:**
```
Server running on port 5000
MongoDB Connected
```

### 3.2 Start Frontend (in new terminal)
```bash
# Navigate to frontend directory
cd frontend-new
npm start
```

**Expected output:**
```
Local:            http://localhost:3000
On Your Network:  http://192.168.x.x:3000
```

---

## 🎯 **Step 4: Use the Application**

### 4.1 Access the App
1. Open your browser
2. Go to `http://localhost:3000`
3. You should see the Image Upload & Gallery interface

### 4.2 Upload Images
1. **Drag & Drop**: Drag images directly onto the upload area
2. **Click to Browse**: Click "Choose File" to select images
3. **Supported formats**: JPEG, PNG, GIF, WebP
4. **File size limit**: 5MB per image

### 4.3 View and Manage Images
1. **Gallery view**: All uploaded images appear in a grid
2. **Preview images**: Click any image to open full-screen preview
3. **Zoom functionality**: Use + / - buttons or keyboard shortcuts
4. **Delete images**: Click the delete button on any image card
5. **Refresh gallery**: Click the refresh button to reload images

### 4.4 Preview Features
- **Click image**: Opens preview modal
- **Zoom controls**: Top-left corner buttons
- **Keyboard shortcuts**:
  - `+` = Zoom in
  - `-` = Zoom out
  - `0` = Reset zoom
  - `ESC` = Close preview

---

## 🔧 **Step 5: Troubleshooting**

### 5.1 Common Issues

**Backend won't start:**
```bash
# Check if MongoDB connection is working
# Verify your .env file has correct MONGODB_URI
# Make sure you're in the root directory
```

**Frontend won't start:**
```bash
# Make sure you're in frontend-new directory
cd frontend-new
npm start
```

**Images not uploading:**
```bash
# Check if backend is running on port 5000
# Verify uploads folder exists
# Check browser console for errors
```

**Database connection issues:**
```bash
# Verify MongoDB Atlas cluster is active
# Check network access settings
# Verify username/password in connection string
```

### 5.2 Useful Commands

```bash
# Start backend (from root directory)
npm run server

# Start frontend (from frontend-new directory)
npm start

# Install dependencies (if needed)
npm install

# Check MongoDB connection
# Look for "MongoDB Connected" message when starting server
```

---

## 📱 **Step 6: Deploy to Production (Optional)**

### 6.1 Backend Deployment (Heroku/Railway/Render)
1. Create account on your preferred platform
2. Connect your GitHub repository
3. Set environment variables:
   - `MONGODB_URI`: Your Atlas connection string
   - `NODE_ENV`: `production`
4. Deploy

### 6.2 Frontend Deployment (Netlify/Vercel)
1. Build the React app: `npm run build`
2. Upload build folder to your hosting platform
3. Set environment variables if needed

---

## 🎉 **Success!**

Your MERN stack image upload app is now running with:
- ✅ Online MongoDB Atlas database
- ✅ Image upload with drag & drop
- ✅ Image preview with zoom functionality
- ✅ Responsive design for all devices
- ✅ File validation and error handling

**App URLs:**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

**Database:** MongoDB Atlas (cloud-hosted)

---

## 📞 **Need Help?**

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Ensure MongoDB Atlas cluster is active
4. Check browser console and terminal for error messages

**Happy uploading! 🖼️✨** 