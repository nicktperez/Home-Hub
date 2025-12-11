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
  "order" INTEGER DEFAULT 0,
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

-- Energy usage table
CREATE TABLE energy_usage (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  usage_kwh DECIMAL(10, 2) NOT NULL,
  export_kwh DECIMAL(10, 2) DEFAULT 0,
  import_kwh DECIMAL(10, 2),
  cost DECIMAL(10, 2),
  updatedat TEXT NOT NULL DEFAULT NOW()::TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_usage ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations (for simplicity)
-- In production, you'd want more restrictive policies
CREATE POLICY "Allow all operations on projects" ON projects
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on notes" ON notes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on shopping" ON shopping
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on energy_usage" ON energy_usage
  FOR ALL USING (true) WITH CHECK (true);
```

**To add completion tracking and date fields to notes** (for Today view with historical tracking), run this migration:

```sql
-- Add done and notedate columns to notes table
ALTER TABLE notes 
  ADD COLUMN IF NOT EXISTS done BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS notedate TEXT DEFAULT NULL;
```

**To add drag-and-drop ordering for projects**, run this migration:

```sql
-- Add order column to projects table for drag-and-drop prioritization
ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- Set initial order based on updatedat for existing projects
-- Use a CTE to calculate row numbers, then update
WITH ordered_projects AS (
  SELECT id, row_number() OVER (ORDER BY updatedat DESC) - 1 AS new_order
  FROM projects
  WHERE "order" IS NULL OR "order" = 0
)
UPDATE projects p
SET "order" = op.new_order
FROM ordered_projects op
WHERE p.id = op.id;
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

4. **Enphase API (Optional - for solar production data):**
   
   **Option 1: Use API Key (Simpler, but may have limitations)**
   ```bash
   vercel env add ENPHASE_API_KEY
   ```
   - Paste your Enphase API key (from your application page)
   - Example: `341f6138d4d964bdfe78cb7b4adafb56`
   
   **Option 2: Use OAuth (Recommended for API v4)**
   
   Step 1: Add OAuth credentials:
   ```bash
   vercel env add ENPHASE_CLIENT_ID
   # Paste your Client ID: cc821057d4e10bab029b88eb059836a8
   
   vercel env add ENPHASE_CLIENT_SECRET
   # Paste your Client Secret: f3cf33fc18147150dc7c5e67cb5405b2
   
   vercel env add ENPHASE_REDIRECT_URI
   # Paste: https://home-hub-six.vercel.app/api/enphase-oauth
   # IMPORTANT: This MUST match EXACTLY what you set in your Enphase app's redirect URI settings
   # Go to your Enphase developer portal and make sure the redirect URI matches
   ```
   
   Step 2: Get Access Token:
   - After deploying, visit: `https://your-vercel-app.vercel.app/api/enphase-oauth`
   - This will redirect you to Enphase to authorize
   - After authorization, you'll get an access token
   - Add it as: `vercel env add ENPHASE_ACCESS_TOKEN`
   - Paste the token you received
   
   **Required for both options:**
   ```bash
   vercel env add ENPHASE_SYSTEM_ID
   ```
   - Paste your Enphase System ID
   - Find it in your Enphase account under "Systems" → Your System → System Details
   - Or check your Enphase app/portal
   - **Important**: The System ID is the number in the URL when viewing your system in MyEnlighten

3. **Enable API Access in Enphase Account:**
   - Log into your Enlighten account at https://enlighten.enphaseenergy.com
   - Go to **Settings** → **Privacy Settings**
   - Scroll to **API Settings**
   - **Check the box** next to "Allow API access"
   - Click **Save**

4. **OAuth Setup (Required for API v4):**
   The Enphase API v4 requires OAuth 2.0 authentication. You have two options:
   
   **Option A: Use Access Token (Simpler)**
   - You'll need to get an access token through OAuth flow
   - Add it as: `vercel env add ENPHASE_ACCESS_TOKEN`
   - To get a token, you may need to use a tool or follow Enphase's OAuth documentation
   
   **Option B: Use Client ID + Secret (More Complex)**
   - If you have Client ID and Client Secret from Enphase developer portal:
   ```bash
   vercel env add ENPHASE_CLIENT_ID
   vercel env add ENPHASE_CLIENT_SECRET
   ```
   - Note: This still requires OAuth flow to get an access token
   
   **Troubleshooting:**
   - If you see "no applications using API" in Enphase app, you need to enable API access in Settings
   - The API key alone may not work with v4 - you likely need OAuth
   - Check browser console for detailed error messages
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
   - (Optional) Add `ENPHASE_API_KEY` with your Enphase API key for solar production data
   - (Optional) Add `ENPHASE_SYSTEM_ID` with your Enphase system ID (found in your Enphase account)
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

