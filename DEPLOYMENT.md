# Deployment Guide for GetInsight

Complete step-by-step guide for deploying GetInsight to Vercel.

## 📋 Pre-Deployment Checklist

Before deploying, ensure:

- ✅ `npm run build` succeeds locally
- ✅ No hardcoded API keys in code (use `process.env` only)
- ✅ `.env.local` is in `.gitignore` (already included)
- ✅ `.env.example` exists (template for env vars)
- ✅ All routes work locally: `/`, `/activity`, `/report`, `/ask`, `/analytics`

## 🚀 Quick Deployment (PowerShell)

### 1. Verify Build Locally

```powershell
cd C:\Users\hamza\Desktop\hackathons\uottahack\pulsefeedback
npm run build
```

**Expected output**: Build successful, all routes static/dynamic.

### 2. Create .env.example (if not exists)

```powershell
@"
# AI Analysis API Keys (at least one required)
# Gemini is preferred if both are set (supports vision analysis)
GEMINI_API_KEY=
OPENAI_API_KEY=
"@ | Out-File -FilePath .env.example -Encoding utf8
```

### 3. Verify No Secrets Are Tracked

```powershell
git status
```

**Check**: `.env.local` should NOT appear in the list. If it does, verify `.gitignore` contains `.env*`.

### 4. Commit and Push

```powershell
git add .
git commit -m "feat: Ready for deployment with analytics and improved config"
git push origin main
```

## 📦 Vercel Deployment Steps

### Step 1: Import Project

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **"Add New"** → **"Project"**
4. Find `hmzou/pulsefeedback` in the list
5. Click **"Import"**

### Step 2: Configure Build Settings

Vercel should auto-detect Next.js. Verify:

- **Framework Preset**: Next.js ✅
- **Root Directory**: `./` ✅
- **Build Command**: `npm run build` ✅
- **Output Directory**: `.next` (default) ✅
- **Install Command**: `npm install` ✅

### Step 3: Add Environment Variables

**⚠️ CRITICAL**: Add these BEFORE clicking "Deploy":

1. Click **"Environment Variables"** section
2. Add `GEMINI_API_KEY`:
   - Name: `GEMINI_API_KEY`
   - Value: Your Gemini API key
   - Environment: Select all (Production, Preview, Development)
   - Click **"Add"**
3. Add `OPENAI_API_KEY` (if using OpenAI instead):
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key
   - Environment: Select all
   - Click **"Add"**

**Note**: At least ONE API key is required for `/ask` to work. Gemini is preferred for vision support.

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build (~1-2 minutes)
3. You'll see a URL like: `https://pulsefeedback-xxx.vercel.app`

### Step 5: Verify Deployment

Test all routes:

- ✅ `/` - Landing page loads
- ✅ `/activity` - Activity tracking page
- ✅ `/report` - Report page (empty if no session)
- ✅ `/ask` - AI page (shows error if no API key)
- ✅ `/analytics` - Analytics charts (empty if no session)

**Test AI functionality**:
1. Go to `/activity`
2. Start tracking (grant permissions)
3. Wait 10+ seconds
4. Click "Save for Report"
5. Go to `/ask`
6. Ask a question - should work if API key is set

## 🔧 Post-Deployment

### Verify Environment Variables

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Ensure variables are set for all environments
3. If missing, add them and **redeploy**

### Update Environment Variables

If you need to update API keys:

1. Go to Settings → Environment Variables
2. Edit the variable
3. Click **"Save"**
4. **Redeploy**: Go to Deployments → Click "..." → "Redeploy"

### View Logs

- **Build logs**: Deployments → Click deployment → "Build Logs"
- **Function logs**: Deployments → Click deployment → "Functions" tab
- **Real-time logs**: Project → "Logs" tab (for runtime errors)

## 🐛 Troubleshooting

### Build Fails on Vercel

**Check**:
1. Build logs in Vercel dashboard
2. Node.js version (should be 18+)
3. Ensure `package.json` has correct scripts

**Fix**:
```powershell
# Test locally first
npm run build
```

### "No AI API key found" Error

**Check**:
1. Environment variables in Vercel dashboard
2. Variables are set for Production environment
3. Variable names match exactly: `GEMINI_API_KEY` or `OPENAI_API_KEY`

**Fix**:
1. Add environment variable in Vercel
2. Redeploy the project

### Routes Don't Work

**Check**:
1. Build succeeded (no errors)
2. Routes are accessible (check Vercel URL)
3. Browser console for errors (F12)

**Fix**:
- Check Vercel deployment logs
- Verify all files are pushed to GitHub
- Rebuild locally to catch errors

## 📝 Notes

- **HTTPS**: Vercel provides HTTPS automatically (required for camera permissions)
- **Custom Domain**: Add in Settings → Domains
- **Automatic Deployments**: Pushes to `main` branch auto-deploy
- **Preview Deployments**: Pull requests get preview URLs automatically

---

**Need help?** Check the main README.md troubleshooting section or Vercel documentation.
