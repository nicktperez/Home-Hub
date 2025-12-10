# Deployment Guide for Vercel

This guide will help you deploy your Family Wall Dashboard to Vercel with Supabase for persistent data storage.

## Prerequisites

- Vercel account (you already have one ✅)
- Supabase account (free tier is fine)

## Step 1: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Create a new project:
   - Click "New Project"
   - Name it (e.g., "family-wall-dashboard")
   - Set a database password (save this!)
   - Choose a region close to you
   - Wait ~2 minutes for setup

3. Create the projects table:
   - In your Supabase dashboard, go to "SQL Editor"
   - Click "New Query"
   - Paste this SQL and run it:

```sql
-- Projects table
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  done BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'todo',
  updatedAt TEXT NOT NULL,
  note TEXT DEFAULT '',
  progress INTEGER DEFAULT 0,
  startDate TEXT DEFAULT '',
  endDate TEXT DEFAULT '',
  updates JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notes table
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  color TEXT DEFAULT 'yellow',
  done BOOLEAN DEFAULT false,
  notedate TEXT DEFAULT NULL,
  updatedAt TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping list table
CREATE TABLE shopping (
  id TEXT PRIMARY KEY,
  item TEXT NOT NULL,
  checked BOOLEAN DEFAULT false,
  "updatedAt" TEXT NOT NULL DEFAULT NOW()::TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations (for simplicity)
-- In production, you'd want more restrictive policies
CREATE POLICY "Allow all operations on projects" ON projects
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on notes" ON notes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on shopping" ON shopping
  FOR ALL USING (true) WITH CHECK (true);
```

**To add completion tracking and date fields to notes** (for Today view with historical tracking), run this migration:

```sql
-- Add done and notedate columns to notes table
ALTER TABLE notes 
  ADD COLUMN IF NOT EXISTS done BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS notedate TEXT DEFAULT NULL;
```

**If you're getting errors about columns**, first check what columns exist, then fix them:

```sql
-- Step 1: Check what columns currently exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'shopping'
ORDER BY ordinal_position;

-- Step 2: Add default values to existing columns (if they don't have defaults)
-- This makes the columns optional so the code doesn't have to provide values
ALTER TABLE shopping 
  ALTER COLUMN createdat SET DEFAULT NOW()::TEXT;

ALTER TABLE shopping 
  ALTER COLUMN updatedat SET DEFAULT NOW()::TEXT;

-- Step 3: If columns don't exist, create them with defaults
ALTER TABLE shopping 
  ADD COLUMN IF NOT EXISTS createdat TEXT NOT NULL DEFAULT NOW()::TEXT;

ALTER TABLE shopping 
  ADD COLUMN IF NOT EXISTS updatedat TEXT NOT NULL DEFAULT NOW()::TEXT;

-- Step 4: Verify the columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'shopping';
```

**Note:** The code now provides values for both `createdat` and `updatedat`, but having defaults ensures it works even if the code misses a value.

-- Option 2: If you want to remove updatedAt completely (requires code changes)
-- ALTER TABLE shopping 
--   DROP COLUMN IF EXISTS "createdAt",
--   DROP COLUMN IF EXISTS "updatedAt",
--   DROP COLUMN IF EXISTS updatedat;
```

4. Get your Supabase credentials:
   - Go to "Settings" → "API"
   - Copy your "Project URL" (looks like `https://xxxxx.supabase.co`)
   - Copy your "anon public" key (long string starting with `eyJ...`)

## Step 2: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

1. **Install Vercel CLI** (if you haven't already):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from your project directory**:
   ```bash
   cd /Users/nickperez/Home-Hub
   vercel
   ```
   
   - Follow the prompts:
     - "Set up and deploy?" → Yes
     - "Which scope?" → Your account
     - "Link to existing project?" → No (first time)
     - "What's your project's name?" → `family-wall-dashboard` (or your choice)
     - "In which directory is your code located?" → `./` (current directory)

4. **Add Environment Variables**:
   After the first deploy, you need to add your Supabase credentials:
   
   ```bash
   vercel env add SUPABASE_URL
   ```
   - Paste your Supabase Project URL when prompted
   - Select "Production", "Preview", and "Development" (all three)
   
   ```bash
   vercel env add SUPABASE_ANON_KEY
   ```
   - Paste your Supabase anon public key when prompted
   - Select "Production", "Preview", and "Development" (all three)

5. **Add Weather API Key** (Optional but recommended):
   - Get a free API key from [OpenWeatherMap](https://openweathermap.org/api)
   - Sign up for a free account (1000 calls/day free)
   - Copy your API key
   
   ```bash
   vercel env add OPENWEATHER_API_KEY
   ```
   - Paste your OpenWeatherMap API key when prompted
   - Select "Production", "Preview", and "Development" (all three)

6. **Add Google Calendar API Key** (Required for calendar events widget):
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the "Calendar API" for your project
   - Go to "Credentials" → "Create Credentials" → "API Key"
   - Copy your API key
   - (Optional) Restrict the API key to only the Calendar API for security
   
   ```bash
   vercel env add GOOGLE_CALENDAR_API_KEY
   ```
   - Paste your Google Calendar API key when prompted
   - Select "Production", "Preview", and "Development" (all three)
   
   ```bash
   vercel env add GOOGLE_CALENDAR_ID
   ```
   - Paste your Google Calendar ID (found in your calendar embed URL, the part after `src=`)
   - If not set, it will use the default calendar ID from your embed URLs
   - Select "Production", "Preview", and "Development" (all three)

7. **Redeploy** to apply the environment variables:
   ```bash
   vercel --prod
   ```

### Option B: Using Vercel Dashboard (Easier)

1. **Push your code to GitHub** (if not already):
   - Create a new repo on GitHub
   - Push your code:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git remote add origin YOUR_GITHUB_REPO_URL
     git push -u origin main
     ```

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect the settings

3. **Add Environment Variables**:
   - In your project settings, go to "Environment Variables"
   - Add `SUPABASE_URL` with your Supabase project URL
   - Add `SUPABASE_ANON_KEY` with your Supabase anon key
   - (Optional) Add `OPENWEATHER_API_KEY` with your OpenWeatherMap API key for weather widget
   - (Recommended) Add `GOOGLE_CALENDAR_API_KEY` with your Google Calendar API key for events widget
   - (Optional) Add `GOOGLE_CALENDAR_ID` with your specific calendar ID (defaults to the one in your embed URLs)
   - Make sure to select "Production", "Preview", and "Development" for each

4. **Deploy**:
   - Click "Deploy" (or it will auto-deploy when you push to GitHub)

## Step 3: Update Your Frontend (if needed)

The frontend should automatically use the deployed API endpoints. However, if you want to test locally with Supabase:

1. Create a `.env.local` file in your project root:
   ```
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_ANON_KEY=your_anon_key_here
   ```

2. For local development, you can still use the Express server (`npm start`), but you'll need to update `server.js` to use Supabase instead of the JSON file (optional - you can keep local dev with JSON if you prefer).

## Step 4: Access Your Deployed Site

After deployment, Vercel will give you a URL like:
`https://family-wall-dashboard.vercel.app`

You can:
- Share this URL with your family
- Access it from any device
- It will stay online 24/7 (Vercel free tier has generous limits)

## Optional: Custom Domain

If you want a custom domain:
1. Go to your Vercel dashboard
2. Click on your project
3. Go to "Settings" → "Domains"
4. Add your domain and follow the DNS setup instructions

## Troubleshooting

- **API errors**: Check that your Supabase environment variables are set correctly in Vercel
- **CORS issues**: The API functions already include CORS headers
- **Database errors**: Make sure you ran the SQL to create the table and set up the policy
- **Local testing**: You can still run `npm start` locally, but it will use the JSON file (not Supabase)

## Notes

- The free Vercel tier includes:
  - Unlimited deployments
  - 100GB bandwidth/month
  - Serverless functions with generous limits
  
- The free Supabase tier includes:
  - 500MB database
  - 2GB bandwidth/month
  - More than enough for a family dashboard

Your dashboard will now be accessible 24/7, even when your computer is off! 🎉

