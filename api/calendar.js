// Calendar events API endpoint - fetches events from Google Calendar
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 
    "19fc18fe1e0342336012fb0530d644d8c3ea9d6e14fe63b65db9b8b1ade07504%40group.calendar.google.com";

  if (!apiKey) {
    return res.status(500).json({ error: "Google Calendar API key not configured" });
  }

  // Get date range for today and tomorrow
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  const timeMin = today.toISOString();
  const timeMax = dayAfterTomorrow.toISOString();

  // Decode calendar ID if it's URL encoded
  const decodedCalendarId = decodeURIComponent(calendarId);

  const url = `https://www.googleapis.com/calendar/v3/calendars/${decodedCalendarId}/events?` +
    `key=${apiKey}&` +
    `timeMin=${encodeURIComponent(timeMin)}&` +
    `timeMax=${encodeURIComponent(timeMax)}&` +
    `singleEvents=true&` +
    `orderBy=startTime&` +
    `maxResults=50`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Calendar API error: ${response.status} - ${errorText}`);
    }
    const data = await response.json();

    // Process events
    const events = (data.items || []).map(event => {
      const start = event.start?.dateTime || event.start?.date;
      const end = event.end?.dateTime || event.end?.date;
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      // Determine if it's all day
      const isAllDay = !event.start?.dateTime;
      
      // Format time
      let timeStr = "";
      if (isAllDay) {
        timeStr = "All Day";
      } else {
        const startTime = startDate.toLocaleTimeString("en-US", { 
          hour: "numeric", 
          minute: "2-digit",
          hour12: true 
        });
        const endTime = endDate.toLocaleTimeString("en-US", { 
          hour: "numeric", 
          minute: "2-digit",
          hour12: true 
        });
        timeStr = `${startTime} - ${endTime}`;
      }

      return {
        id: event.id,
        title: event.summary || "No Title",
        description: event.description || "",
        start: start,
        end: end,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        time: timeStr,
        isAllDay: isAllDay,
        location: event.location || "",
      };
    });

    // Separate into today and tomorrow
    const todayEvents = events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === today.toDateString();
    });

    const tomorrowEvents = events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === tomorrow.toDateString();
    });

    return res.status(200).json({
      today: todayEvents,
      tomorrow: tomorrowEvents,
    });
  } catch (error) {
    console.error("Calendar API Error:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch calendar events" });
  }
};

