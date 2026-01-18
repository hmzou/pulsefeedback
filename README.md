# GetInsight

**Invisible Feedback, Instant Insights** — Replace surveys with real-time feedback collected during tasks using webcam signals (attention, engagement, micro-expressions, and more).

## 🎯 What is GetInsight?

GetInsight replaces traditional surveys with invisible feedback. Instead of asking users "Did you like this?" or "Rate this 1-5", we capture real reactions:

- **Task replaces Survey**: Watch a short clip or interact with content — that's the stimulus
- **Continuous Sensing**: Record signals from webcam (face presence, gaze direction, expressions, engagement)
- **Automatic Report**: Convert signals into satisfaction scores, tone, and insights — like SurveyMonkey, but automatic
- **Ask only when needed**: If signals are ambiguous, show one micro-question. Otherwise, zero form-filling required

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Git (for cloning)

### Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/hmzou/pulsefeedback.git
   cd pulsefeedback
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   
   Create a `.env.local` file in the root directory (copy from `.env.example`):
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your API keys:
   ```env
   # AI Analysis (at least one required)
   GEMINI_API_KEY=your_gemini_api_key_here
   # OR
   OPENAI_API_KEY=your_openai_api_key_here
   ```
   
   **Note**: Gemini is preferred if both are set. It supports vision analysis for screen snapshots.

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

### Verify Setup

- ✅ All routes work: `/`, `/activity`, `/report`, `/ask`, `/analytics`
- ✅ Build succeeds: `npm run build`
- ✅ AI analysis works (requires API key): Go to `/ask` and test a question

## 📖 Demo Script (For Judges)

**Goal**: Demonstrate the complete feedback loop in ~2 minutes.

### Step-by-Step Demo Flow

1. **Landing Page** (`/`)
   - Explain: "GetInsight replaces surveys with invisible feedback"
   - Show: Clean landing page with value proposition
   - Click: "Start Demo" → `/activity`

2. **Activity Tracking** (`/activity`)
   - Explain: "We track engagement during any activity — YouTube, Zoom, lectures, etc."
   - Show: Demo Flow banner (4 steps)
   - Click: "Start Activity Tracking"
   - Grant permissions: Webcam + Screen Share
   - Show: Live previews (webcam + screen share side-by-side)
   - Show: Live metrics updating in real-time (engagement, emotion, gaze, etc.)
   - Wait: ~10 seconds while tracking (simulate watching content)
   - Show: Confusion snapshots being captured (if any)
   - Click: "Save for Report"
   - Navigate: Click "Go to Report" → `/report`

3. **Report Page** (`/report`)
   - Show: Score cards (Satisfaction, Ease, Clarity)
   - Show: Tone (Positive/Mixed/Negative)
   - Show: Insights (AI-generated bullet points)
   - Show: Key Moments Timeline (stress spikes, low engagement)
   - Show: Snapshot Gallery (if activity mode with snapshots)
   - Explain: "All generated automatically — no forms filled"
   - Click: "Ask AI" → `/ask`

4. **Ask AI** (`/ask`)
   - Show: Session info (mode, data points, snapshots)
   - Click: Suggestion chip (e.g., "What patterns do you see in my engagement?")
   - Click: "Ask AI"
   - Show: Loading state
   - Show: AI response with analysis
   - Explain: "AI analyzes both metrics AND screen snapshots to explain why you felt that way"
   - Optional: Toggle "Show JSON" to see raw response

5. **Wrap-up**
   - Navigate: Back to landing page
   - Explain: "Privacy-first — all processing happens locally. No video uploaded, no data stored on servers."

### Key Talking Points

- **Zero Friction**: Users never fill out forms. Feedback is invisible.
- **Real Reactions**: Capture genuine engagement, confusion, and emotion without leading questions.
- **Context-Aware**: Screen snapshots help AI understand what content triggered confusion.
- **Privacy-First**: All processing happens locally. No data stored on servers.
- **Production-Ready**: Clean UI, error handling, loading states, tooltips.

## 🏗️ Project Structure

```
pulsefeedback/
├── app/
│   ├── components/          # Shared UI components
│   │   ├── Navbar.tsx
│   │   ├── PageLayout.tsx
│   │   ├── DemoFlow.tsx
│   │   └── MetricCard.tsx
│   ├── lib/
│   │   ├── analytics/       # Report generation
│   │   │   ├── report.ts
│   │   │   └── confusion.ts
│   │   ├── design/          # Design system
│   │   │   └── styles.ts
│   │   ├── storage/         # Session storage
│   │   │   └── sessionStore.ts
│   │   └── vision/          # Face tracking (MediaPipe)
│   │       └── faceTracker.ts
│   ├── api/
│   │   └── ask/             # AI analysis endpoint
│   │       └── route.ts
│   ├── activity/            # Activity tracking page
│   ├── session/             # Task session page
│   ├── report/              # Report page
│   ├── ask/                 # AI chat page
│   └── page.tsx             # Landing page
├── public/
│   └── videos/
│       └── task.mp4         # Sample task video
└── .env.local               # Environment variables
```

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: CSS-in-JS (inline styles) + Design System
- **Face Tracking**: MediaPipe FaceLandmarker
- **AI Analysis**: Google Gemini (preferred) or OpenAI
- **Storage**: localStorage (client-side only)

## 📝 Features

### Core Features
- ✅ Task-based feedback collection (video stimulus)
- ✅ Activity tracking with screen share
- ✅ Real-time face tracking (gaze, smile, eyes closed, emotion)
- ✅ Engagement scoring (0-1)
- ✅ Emotion detection (positive, neutral, negative, concentration, frustration, confusion)
- ✅ Confusion detection with screen snapshots
- ✅ Automatic report generation (SurveyMonkey-style)
- ✅ AI analysis with vision support (Gemini)
- ✅ Timeline view of key moments
- ✅ Snapshot gallery

### UI/UX Features
- ✅ Clean, modern design (Apple-like, Notion-like)
- ✅ Consistent navigation (navbar on all pages)
- ✅ Demo flow progress indicator
- ✅ Tooltips for metrics
- ✅ Smooth animations and transitions
- ✅ Loading states and error handling
- ✅ Mobile-responsive (basic)

## 🔒 Privacy & Ethics

All processing happens locally in your browser:
- ✅ No video is uploaded
- ✅ No data is stored on our servers
- ✅ You control what gets saved (localStorage)
- ✅ All AI analysis respects your data

## 🚢 Deployment

### Deploy to Vercel (Step-by-Step)

#### Prerequisites
- GitHub account
- Vercel account (free tier works)
- API key from Gemini or OpenAI

#### Step 1: Push to GitHub

**Prerequisites**: Ensure you're in the project directory:
```powershell
cd C:\Users\hamza\Desktop\hackathons\uottahack\pulsefeedback
```

**If you haven't already:**

1. **Initialize git** (if not already initialized):
   ```powershell
   git init
   ```

2. **Add remote** (replace `hmzou` with your GitHub username if different):
   ```powershell
   git remote add origin https://github.com/hmzou/pulsefeedback.git
   ```
   
   **Note**: If remote already exists, update it:
   ```powershell
   git remote set-url origin https://github.com/hmzou/pulsefeedback.git
   ```

3. **Create .env.example file** (manually):
   ```powershell
   @"
# AI Analysis API Keys (at least one required)
# Gemini is preferred if both are set (supports vision analysis)
GEMINI_API_KEY=
OPENAI_API_KEY=
"@ | Out-File -FilePath .env.example -Encoding utf8
   ```

4. **Stage all files**:
   ```powershell
   git add .
   ```

5. **Verify no secrets are being committed**:
   ```powershell
   git status
   ```
   
   **Important**: Ensure `.env.local` is NOT listed. If it is, check `.gitignore` contains `.env*`.

6. **Commit changes**:
   ```powershell
   git commit -m "feat: Add analytics page with charts and deployment config

- Add /analytics page with engagement vs time, engagement vs gaze charts
- Add Analytics link to navbar
- Improve error messages for missing API keys
- Add comprehensive deployment documentation
- Update README with troubleshooting guide"
   ```

7. **Push to GitHub**:
   ```powershell
   git branch -M main
   git push -u origin main
   ```

**If repository already exists and you want to update:**

1. **Check current remote**:
   ```powershell
   git remote -v
   ```

2. **If remote is incorrect, update it**:
   ```powershell
   git remote set-url origin https://github.com/hmzou/pulsefeedback.git
   ```

3. **Pull latest changes** (if working with others):
   ```powershell
   git pull origin main
   ```

4. **Stage, commit, and push**:
   ```powershell
   git add .
   git commit -m "feat: Add analytics page and deployment improvements"
   git push origin main
   ```

#### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (use GitHub to connect)
2. Click **"Add New"** → **"Project"**
3. **Import Git Repository**: Find `hmzou/pulsefeedback` in the list
4. Click **"Import"**

#### Step 3: Configure Project

1. **Framework Preset**: Should auto-detect "Next.js" ✅
2. **Root Directory**: Leave as `./` (root)
3. **Build Command**: Should be `npm run build` ✅
4. **Output Directory**: Leave as default (`.next`)
5. **Install Command**: Should be `npm install` ✅

#### Step 4: Add Environment Variables

**IMPORTANT**: Before clicking "Deploy", add environment variables:

1. Click **"Environment Variables"** section
2. Add each variable:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your Gemini API key
   - **Environment**: Select all (Production, Preview, Development)
   - Click **"Add"**
   
   Repeat for OpenAI (if using):
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key
   - **Environment**: Select all
   - Click **"Add"**

**Note**: At least one API key is required for `/ask` to work. Gemini is preferred for vision support.

#### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~1-2 minutes)
3. Once deployed, you'll see a URL like: `https://pulsefeedback-xxx.vercel.app`

#### Step 6: Verify Deployment

1. **Test all routes**:
   - `/` - Landing page
   - `/activity` - Activity tracking
   - `/report` - Report page (needs saved session)
   - `/ask` - AI analysis (needs API key)
   - `/analytics` - Analytics charts (needs saved session)

2. **Test AI functionality**:
   - Go to `/activity`
   - Start tracking, save session
   - Go to `/ask`
   - Ask a question - should work if API key is set

#### Step 7: Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS setup instructions

### Environment Variables

⚠️ **Security**: Ensure `.env.local` is **never committed** to Git. It's already in `.gitignore`.

- ✅ Local: Use `.env.local` (not tracked by git)
- ✅ Vercel: Add via dashboard (Settings → Environment Variables)
- ✅ Example: See `.env.example` for format

## 📄 License

This is a hackathon project. Use freely for demonstration purposes.

## 🤝 Contributing

This is a hackathon prototype. Contributions welcome for:
- Better face tracking accuracy
- Additional metrics (HR/BR via Presage)
- More sophisticated emotion detection
- Export formats (PDF, CSV)

## 🙏 Acknowledgments

- MediaPipe for face tracking
- Google Gemini / OpenAI for AI analysis
- Next.js team for the excellent framework

## 🔧 Troubleshooting

### Common Issues

#### 0. **/api/ask Returns 404 on Vercel**

**Symptoms**: GET or POST to `/api/ask` returns 404 Not Found

**Cause**: Root Directory is pointing to the wrong folder, so the API route isn't being deployed.

**Solutions**:
- ✅ **Test route**: Open `https://<your-domain>.vercel.app/api/ask` in browser
  - Should return: `{"ok": true, "route": "/api/ask", "message": "GET ping works", ...}`
  - If 404: Root Directory is wrong
- ✅ **Fix Root Directory**: 
  - Vercel Dashboard → Project → Settings → General → Root Directory
  - Set to folder containing `package.json` (usually `./` or leave blank)
- ✅ **Redeploy**: After changing Root Directory, go to Deployments → Redeploy
- ✅ **Verify**: Test `GET /api/ask` again after redeploy

#### 1. **"No AI API key found" Error**

**Symptoms**: Error message in `/ask` page when trying to analyze

**Solutions**:
- ✅ **Local**: Check `.env.local` exists and contains `GEMINI_API_KEY` or `OPENAI_API_KEY`
- ✅ **Local**: Restart dev server after adding env vars: `Ctrl+C` then `npm run dev`
- ✅ **Vercel**: Go to Vercel dashboard → Project → Settings → Environment Variables
- ✅ **Vercel**: Ensure variables are set for "Production", "Preview", and "Development"
- ✅ **Vercel**: Redeploy after adding env vars (they don't auto-update)

#### 2. **Camera/Screen Share Permissions Denied**

**Symptoms**: Cannot access webcam or screen share

**Solutions**:
- ✅ Check browser permissions (Chrome: Settings → Privacy → Camera/Microphone)
- ✅ Use HTTPS (Vercel provides this automatically)
- ✅ For local dev: Use `localhost` (not `127.0.0.1`)
- ✅ Try a different browser (Chrome/Edge recommended)

#### 3. **Build Failures**

**Symptoms**: `npm run build` fails or Vercel deployment fails

**Solutions**:
- ✅ Check Node.js version: `node --version` (should be 18+)
- ✅ Delete `node_modules` and `.next`: 
  ```powershell
  Remove-Item -Recurse -Force node_modules, .next
  npm install
  npm run build
  ```
- ✅ Check TypeScript errors: `npm run build` shows exact errors
- ✅ Ensure no syntax errors in recent changes

#### 4. **No Data in Report/Analytics**

**Symptoms**: Report page shows "No saved session" or empty charts

**Solutions**:
- ✅ Go to `/activity` or `/session`
- ✅ Start tracking and let it run for 10+ seconds
- ✅ Click "Save for Report" before navigating away
- ✅ Check browser console for errors (F12)

**If you haven't already:**

1. **Initialize git** (if not already initialized):
   ```powershell
   git init
   ```

2. **Add remote** (replace `hmzou` with your GitHub username if different):
   ```powershell
   git remote add origin https://github.com/hmzou/pulsefeedback.git
   ```
   
   **Note**: If remote already exists, update it:
   ```powershell
   git remote set-url origin https://github.com/hmzou/pulsefeedback.git
   ```

3. **Create .env.example file** (manually):
   ```powershell
   @"
# AI Analysis API Keys (at least one required)
# Gemini is preferred if both are set (supports vision analysis)
GEMINI_API_KEY=
OPENAI_API_KEY=
"@ | Out-File -FilePath .env.example -Encoding utf8
   ```

4. **Stage all files**:
   ```powershell
   git add .
   ```

5. **Verify no secrets are being committed**:
   ```powershell
   git status
   ```
   
   **Important**: Ensure `.env.local` is NOT listed. If it is, check `.gitignore` contains `.env*`.

6. **Commit changes**:
   ```powershell
   git commit -m "feat: Add analytics page with charts and deployment config

- Add /analytics page with engagement vs time, engagement vs gaze charts
- Add Analytics link to navbar
- Improve error messages for missing API keys
- Add comprehensive deployment documentation
- Update README with troubleshooting guide"
   ```

7. **Push to GitHub**:
   ```powershell
   git branch -M main
   git push -u origin main
   ```

**If repository already exists and you want to update:**

1. **Check current remote**:
   ```powershell
   git remote -v
   ```

2. **If remote is incorrect, update it**:
   ```powershell
   git remote set-url origin https://github.com/hmzou/pulsefeedback.git
   ```

3. **Pull latest changes** (if working with others):
   ```powershell
   git pull origin main
   ```

4. **Stage, commit, and push**:
   ```powershell
   git add .
   git commit -m "feat: Add analytics page and deployment improvements"
   git push origin main
   ```

#### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (use GitHub to connect)
2. Click **"Add New"** → **"Project"**
3. **Import Git Repository**: Find `hmzou/pulsefeedback` in the list
4. Click **"Import"**

#### Step 3: Configure Project

1. **Framework Preset**: Should auto-detect "Next.js" ✅
2. **Root Directory**: Leave as `./` (root)
3. **Build Command**: Should be `npm run build` ✅
4. **Output Directory**: Leave as default (`.next`)
5. **Install Command**: Should be `npm install` ✅

#### Step 4: Add Environment Variables

**IMPORTANT**: Before clicking "Deploy", add environment variables:

1. Click **"Environment Variables"** section
2. Add each variable:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your Gemini API key
   - **Environment**: Select all (Production, Preview, Development)
   - Click **"Add"**
   
   Repeat for OpenAI (if using):
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key
   - **Environment**: Select all
   - Click **"Add"**

**Note**: At least one API key is required for `/ask` to work. Gemini is preferred for vision support.

#### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~1-2 minutes)
3. Once deployed, you'll see a URL like: `https://pulsefeedback-xxx.vercel.app`

#### Step 6: Verify Deployment

1. **Test all routes**:
   - `/` - Landing page
   - `/activity` - Activity tracking
   - `/report` - Report page (needs saved session)
   - `/ask` - AI analysis (needs API key)
   - `/analytics` - Analytics charts (needs saved session)

2. **Test AI functionality**:
   - Go to `/activity`
   - Start tracking, save session
   - Go to `/ask`
   - Ask a question - should work if API key is set

#### Step 7: Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS setup instructions

### Environment Variables

⚠️ **Security**: Ensure `.env.local` is **never committed** to Git. It's already in `.gitignore`.

- ✅ Local: Use `.env.local` (not tracked by git)
- ✅ Vercel: Add via dashboard (Settings → Environment Variables)
- ✅ Example: See `.env.example` for format

## 📄 License

This is a hackathon project. Use freely for demonstration purposes.

## 🤝 Contributing

This is a hackathon prototype. Contributions welcome for:
- Better face tracking accuracy
- Additional metrics (HR/BR via Presage)
- More sophisticated emotion detection
- Export formats (PDF, CSV)

## 🙏 Acknowledgments

- MediaPipe for face tracking
- Google Gemini / OpenAI for AI analysis
- Next.js team for the excellent framework

## 🔧 Troubleshooting

### Common Issues

#### 1. **"No AI API key found" Error**

**Symptoms**: Error message in `/ask` page when trying to analyze

**Solutions**:
- ✅ **Local**: Check `.env.local` exists and contains `GEMINI_API_KEY` or `OPENAI_API_KEY`
- ✅ **Local**: Restart dev server after adding env vars: `Ctrl+C` then `npm run dev`
- ✅ **Vercel**: Go to Vercel dashboard → Project → Settings → Environment Variables
- ✅ **Vercel**: Ensure variables are set for "Production", "Preview", and "Development"
- ✅ **Vercel**: Redeploy after adding env vars (they don't auto-update)

#### 2. **Camera/Screen Share Permissions Denied**

**Symptoms**: Cannot access webcam or screen share

**Solutions**:
- ✅ Check browser permissions (Chrome: Settings → Privacy → Camera/Microphone)
- ✅ Use HTTPS (Vercel provides this automatically)
- ✅ For local dev: Use `localhost` (not `127.0.0.1`)
- ✅ Try a different browser (Chrome/Edge recommended)

#### 3. **Build Failures**

**Symptoms**: `npm run build` fails or Vercel deployment fails

**Solutions**:
- ✅ Check Node.js version: `node --version` (should be 18+)
- ✅ Delete `node_modules` and `.next`: 
  ```powershell
  Remove-Item -Recurse -Force node_modules, .next
  npm install
  npm run build
  ```
- ✅ Check TypeScript errors: `npm run build` shows exact errors
- ✅ Ensure no syntax errors in recent changes

#### 4. **No Data in Report/Analytics**

**Symptoms**: Report page shows "No saved session" or empty charts

**Solutions**:
- ✅ Go to `/activity` or `/session`
- ✅ Start tracking and let it run for 10+ seconds
- ✅ Click "Save for Report" before navigating away
- ✅ Check browser console for errors (F12)

#### 5. **Charts Not Showing**

**Symptoms**: Analytics page shows no charts

**Solutions**:
- ✅ Ensure session has data points (check `/report` first)
- ✅ Save a session from `/activity` or `/session`
- ✅ Refresh the `/analytics` page after saving

#### 6. **Vercel Deployment Errors**

**Symptoms**: Build fails on Vercel

**Solutions**:
- ✅ Check build logs in Vercel dashboard
- ✅ Ensure `package.json` has correct scripts:
  ```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
  ```
- ✅ Check Node.js version in `package.json` (engines field if present)
- ✅ Ensure all dependencies are in `package.json` (not just devDependencies)

### Getting Help

1. **Check build logs**: `npm run build` locally
2. **Check browser console**: F12 → Console tab
3. **Check Vercel logs**: Dashboard → Deployments → Click deployment → Functions tab
4. **Verify env vars**: Make sure they're set correctly (no extra spaces, correct names)

---

**Built with ❤️ for hackathon judges**
