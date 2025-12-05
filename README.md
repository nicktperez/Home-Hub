# Family Wall Dashboard

A local, dark-themed wall display with rotating calendar slides and a simple projects list for quick household tasks.

## Run locally

1) Install dependencies  
`npm install`

2) Start the server  
`npm start`

3) Open in your browser  
`http://localhost:8000`

## Using it

- Mirror this browser window to an Apple TV for a full-screen wall display.
- On the same Wi‑Fi, you can also open `http://<your-mac-local-ip>:8000` on your phone to add or edit projects on the fly.

## Google Calendar embeds

In `public/index.html`, replace the two iframe `src` values with your Google Calendar embed URLs:
- `YOUR_GOOGLE_CALENDAR_EMBED_URL_FOR_MONTH` for the month view.
- `YOUR_GOOGLE_CALENDAR_EMBED_URL_FOR_AGENDA` for the week/agenda view.

