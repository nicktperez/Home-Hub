# Family Wall Dashboard

A beautiful, dark-themed wall display with rotating calendar slides and a project management board. Perfect for family organization!

## Quick Start

### Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open in your browser:
   ```
   http://localhost:8000
   ```

### Deploy to Vercel (Recommended)

For 24/7 access without keeping your computer on, deploy to Vercel! See **[DEPLOY.md](./DEPLOY.md)** for complete instructions.

## Features

- **Rotating Slides**: Auto-rotates through Month, Week, Today, and Projects views
- **Google Calendar Integration**: Embed your shared family calendar
- **Project Management**: Kanban-style board with status tracking, progress, notes, and updates
- **Responsive Design**: Works on desktop, phone, and TV displays
- **Festive Animations**: Snow effects and smooth transitions

## Using It

- **Wall Display**: Mirror the browser window to an Apple TV for a full-screen display
- **Mobile Access**: On the same Wi‑Fi, open `http://<your-mac-local-ip>:8000` on your phone to manage projects
- **Always Online**: Deploy to Vercel to access from anywhere, anytime

## Google Calendar Setup

In `public/index.html`, replace the iframe `src` values with your Google Calendar embed URLs:
- Month view: Replace the `src` in the first calendar iframe
- Week view: Replace the `src` in the second calendar iframe

To get your embed URL:
1. Open Google Calendar
2. Go to Settings → Your calendar → Integrate calendar
3. Copy the "Embed code" URL

## Project Structure

```
Home-Hub/
├── api/              # Vercel serverless functions (for deployment)
├── public/           # Frontend files (HTML, CSS, JS)
├── data/             # Local JSON storage (local dev only)
├── server.js         # Express server (local dev)
├── vercel.json       # Vercel configuration
└── DEPLOY.md         # Deployment guide
```

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript with Tailwind CSS
- **Backend**: Express (local) or Vercel Serverless Functions (deployed)
- **Database**: JSON file (local) or Supabase (deployed)

