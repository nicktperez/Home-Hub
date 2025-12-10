const SLIDE_INTERVAL_MS = 15000; // Default interval
// Different intervals for different slides (in milliseconds)
const SLIDE_DURATIONS = {
  0: 15000, // Month - 15 seconds
  1: 15000, // Week - 15 seconds
  2: 30000, // Today - 30 seconds (longer!)
  3: 20000, // Projects - 20 seconds
  4: 15000, // Notes - 15 seconds
  5: 15000, // Shopping - 15 seconds
};

let slides = [];
let currentSlideIndex = 0;
let slideTimer = null;
let snowCtx = null;
let snowParticles = [];

function initSnow() {
  const canvas = document.getElementById("snow-canvas");
  if (!canvas) return;
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener("resize", resize);
  resize();
  const ctx = canvas.getContext("2d");
  snowCtx = ctx;
  snowParticles = Array.from({ length: 120 }).map(() => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + 1,
    v: Math.random() * 0.6 + 0.4,
    drift: Math.random() * 0.5 - 0.25,
  }));
  requestAnimationFrame(updateSnow);
}

function updateSnow() {
  if (!snowCtx) return;
  const canvas = snowCtx.canvas;
  snowCtx.clearRect(0, 0, canvas.width, canvas.height);
  snowCtx.fillStyle = "rgba(255,255,255,0.9)";
  snowParticles.forEach((p) => {
    snowCtx.beginPath();
    snowCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    snowCtx.fill();
    p.y += p.v;
    p.x += p.drift;
    if (p.y > canvas.height) p.y = -p.r;
    if (p.x > canvas.width) p.x = -p.r;
    if (p.x < -p.r) p.x = canvas.width + p.r;
  });
  requestAnimationFrame(updateSnow);
}

function setActiveSlide(index) {
  if (!slides.length) return;
  currentSlideIndex = (index + slides.length) % slides.length;
  slides.forEach((s, i) => {
    if (i === currentSlideIndex) {
      s.classList.add("active");
    } else {
      s.classList.remove("active");
    }
  });
}

let rotationPaused = false;

function pauseRotation() {
  rotationPaused = true;
  if (slideTimer) {
    clearTimeout(slideTimer);
    slideTimer = null;
  }
}

function resumeRotation() {
  rotationPaused = false;
  if (slideTimer) {
    clearTimeout(slideTimer);
    slideTimer = null;
  }
  startRotation();
}

function startRotation() {
  if (rotationPaused) return; // Don't start if paused
  
  if (slideTimer) {
    clearTimeout(slideTimer);
    slideTimer = null;
  }
  
  function advanceSlide() {
    if (rotationPaused) return; // Don't advance if paused
    
    const nextIndex = (currentSlideIndex + 1) % slides.length;
    setActiveSlide(nextIndex);
    
    // Get duration for the next slide
    const duration = SLIDE_DURATIONS[nextIndex] || SLIDE_INTERVAL_MS;
    
    // Schedule next advance
    slideTimer = setTimeout(advanceSlide, duration);
  }
  
  // Start with current slide's duration
  const currentDuration = SLIDE_DURATIONS[currentSlideIndex] || SLIDE_INTERVAL_MS;
  slideTimer = setTimeout(advanceSlide, currentDuration);
}

function renderToday() {
  const todayEl = document.getElementById("today-text");
  if (!todayEl) return;
  const today = new Date();
  const formatted = today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  todayEl.textContent = formatted;
}

// ===== CLOCK =====
function updateClock() {
  const now = new Date();
  const timeEl = document.getElementById("clock-time");
  const dateEl = document.getElementById("clock-date");
  
  if (timeEl) {
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    timeEl.textContent = `${hours}:${minutes}:${seconds}`;
  }
  
  if (dateEl) {
    const dateStr = now.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    dateEl.textContent = dateStr;
  }
}

function startClock() {
  updateClock();
  setInterval(updateClock, 1000); // Update every second
}

async function fetchProjects() {
  const res = await fetch("/api/projects");
  if (!res.ok) return [];
  return res.json();
}

async function updateProject(id, data) {
  try {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Update failed: ${res.status}`);
  } catch (error) {
    console.error("Update project error:", error);
    throw error;
  }
}

async function deleteProject(id) {
  try {
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    
    // 204 No Content is a successful delete response
    if (res.status === 204) {
      return; // Success
    }
    
    // If not 204, check if it's an error
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: `Delete failed: ${res.status}` }));
      throw new Error(errorData.error || `Delete failed: ${res.status}`);
    }
  } catch (error) {
    console.error("Delete project error:", error);
    throw error;
  }
}

async function addProject(title) {
  try {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error(`Add project failed: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Add project error:", error);
    throw error;
  }
}

function createProjectElement(project, refresh) {
  const li = document.createElement("div");
  li.className = "project-item";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = project.done;
  checkbox.addEventListener("change", async () => {
    await updateProject(project.id, { done: checkbox.checked });
    refresh();
  });

  const title = document.createElement("p");
  title.className = "project-title font-semibold";
  title.textContent = project.title;
  if (project.done) {
    title.classList.add("done");
  }

  const statusSelect = document.createElement("select");
  statusSelect.className = "status-select";
  ["todo", "in_progress", "done"].forEach((val) => {
    const opt = document.createElement("option");
    opt.value = val;
    opt.textContent =
      val === "todo" ? "Todo" : val === "in_progress" ? "In Progress" : "Done";
    if ((project.status || "todo") === val) opt.selected = true;
    statusSelect.appendChild(opt);
  });
  statusSelect.addEventListener("change", async () => {
    const status = statusSelect.value;
    await updateProject(project.id, {
      status,
      done: status === "done",
    });
    refresh();
  });

  const delBtn = document.createElement("button");
  delBtn.className = "delete-btn-simple";
  delBtn.textContent = "Delete";
  delBtn.addEventListener("click", async () => {
    if (confirm(`Delete "${project.title}"?`)) {
      try {
        await deleteProject(project.id);
        await refreshProjects();
      } catch (error) {
        console.error("Error deleting project:", error);
        const errorMessage = error.message || "Failed to delete project";
        alert(`Failed to delete project: ${errorMessage}`);
      }
    }
  });

  // Simple layout: checkbox + title on one row, status + delete on another
  const headerRow = document.createElement("div");
  headerRow.className = "project-header-simple";
  headerRow.appendChild(checkbox);
  headerRow.appendChild(title);

  const actionsRow = document.createElement("div");
  actionsRow.className = "project-actions-simple";
  actionsRow.appendChild(statusSelect);
  actionsRow.appendChild(delBtn);

  li.appendChild(headerRow);
  li.appendChild(actionsRow);
  return li;
}

async function renderProjects() {
  // Get column elements
  const todoCol = document.getElementById("board-todo");
  const inprogressCol = document.getElementById("board-inprogress");
  const doneCol = document.getElementById("board-done");
  
  // If columns don't exist, return early
  if (!todoCol || !inprogressCol || !doneCol) {
    console.warn("Project columns not found in DOM");
    return;
  }
  
  const projects = await fetchProjects();
  console.log("Fetched projects:", projects.length, projects);
  
  // Summary
  const total = projects.length;
  const todo = projects.filter((p) => (p.status || "todo") === "todo").length;
  const inprogress = projects.filter((p) => (p.status || "todo") === "in_progress").length;
  const done = projects.filter((p) => (p.status || "todo") === "done").length;
  const sTotal = document.getElementById("summary-total");
  const sTodo = document.getElementById("summary-todo");
  const sInprogress = document.getElementById("summary-inprogress");
  const sDone = document.getElementById("summary-done");
  if (sTotal) sTotal.textContent = total;
  if (sTodo) sTodo.textContent = todo;
  if (sInprogress) sInprogress.textContent = inprogress;
  if (sDone) sDone.textContent = done;

  // Clear columns
  todoCol.innerHTML = "";
  inprogressCol.innerHTML = "";
  doneCol.innerHTML = "";

  // Populate columns
  projects.forEach((project) => {
    const item = createProjectElement(project, renderProjects);
    const status = project.status || "todo";
    
    if (status === "done") {
      doneCol.appendChild(item);
    } else if (status === "in_progress") {
      inprogressCol.appendChild(item);
    } else {
      todoCol.appendChild(item);
    }
  });
}

function setupForm() {
  const form = document.getElementById("project-form");
  const input = document.getElementById("project-input");
  if (!form || !input) return;

  // Pause rotation when user focuses on input
  input.addEventListener("focus", () => {
    pauseRotation();
  });

  // Resume rotation when user leaves input (with a small delay)
  input.addEventListener("blur", () => {
    setTimeout(() => {
      if (document.activeElement !== input) {
        resumeRotation();
      }
    }, 500);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    try {
      await addProject(value);
      input.value = "";
      await refreshProjects();
      resumeRotation(); // Resume after submitting
    } catch (error) {
      console.error("Error adding project from form:", error);
    }
  });
}

function initSlides() {
  setActiveSlide(0);
  startRotation();
}

function setupNavButtons() {
  const buttons = document.querySelectorAll("[data-slide]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.slide);
      if (Number.isFinite(idx)) {
        setActiveSlide(idx);
        startRotation();
        // Close mobile menu if open
        closeMobileMenu();
      }
    });
  });
}

// ===== MOBILE MENU =====
function setupMobileMenu() {
  const hamburgerBtn = document.getElementById("hamburger-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  if (!hamburgerBtn || !mobileMenu) return;

  hamburgerBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMobileMenu();
  });

  // Close menu when clicking backdrop or outside
  const backdrop = document.getElementById("mobile-menu-backdrop");
  if (backdrop) {
    backdrop.addEventListener("click", closeMobileMenu);
  }
  
  document.addEventListener("click", (e) => {
    if (!mobileMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
      closeMobileMenu();
    }
  });

  // Close menu on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMobileMenu();
    }
  });
}

function toggleMobileMenu() {
  const hamburgerBtn = document.getElementById("hamburger-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  
  if (!hamburgerBtn || !mobileMenu) return;

  const isOpen = mobileMenu.classList.contains("menu-open");
  
  if (isOpen) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }
}

function openMobileMenu() {
  const hamburgerBtn = document.getElementById("hamburger-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const backdrop = document.getElementById("mobile-menu-backdrop");
  
  if (!hamburgerBtn || !mobileMenu) return;

  hamburgerBtn.classList.add("active");
  mobileMenu.classList.add("menu-open");
  if (backdrop) backdrop.classList.add("active");
  document.body.style.overflow = "hidden"; // Prevent background scrolling
}

function closeMobileMenu() {
  const hamburgerBtn = document.getElementById("hamburger-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const backdrop = document.getElementById("mobile-menu-backdrop");
  
  if (!hamburgerBtn || !mobileMenu) return;

  hamburgerBtn.classList.remove("active");
  mobileMenu.classList.remove("menu-open");
  if (backdrop) backdrop.classList.remove("active");
  document.body.style.overflow = ""; // Restore scrolling
}

// ===== CALENDAR EVENTS =====
let calendarData = null;
let calendarTimer = null;

async function fetchCalendarEvents() {
  try {
    const res = await fetch("/api/calendar");
    if (!res.ok) throw new Error("Calendar fetch failed");
    const data = await res.json();
    calendarData = data;
    renderCalendarEvents();
  } catch (error) {
    console.error("Calendar error:", error);
    const todayEl = document.getElementById("today-events");
    const tomorrowEl = document.getElementById("tomorrow-events");
    if (todayEl) {
      todayEl.innerHTML = '<p class="text-slate-400 text-center py-4">Unable to load events. Check API configuration.</p>';
    }
    if (tomorrowEl) {
      tomorrowEl.innerHTML = '<p class="text-slate-400 text-center py-2 text-sm">Unable to load events.</p>';
    }
  }
}

function formatEventTime(event) {
  if (event.isAllDay) {
    return "All Day";
  }
  
  try {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    // Format in user's local timezone
    const startTime = startDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    
    const endTime = endDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    
    return `${startTime} - ${endTime}`;
  } catch (error) {
    console.error("Error formatting event time:", error);
    return "Time TBD";
  }
}

function renderCalendarEvents() {
  if (!calendarData) return;

  const todayEl = document.getElementById("today-events");
  const tomorrowEl = document.getElementById("tomorrow-events");

  // Render today's events (compact version)
  if (todayEl) {
    if (calendarData.today && calendarData.today.length > 0) {
      todayEl.innerHTML = calendarData.today
        .map(
          (event) => {
            const timeStr = formatEventTime(event);
            return `
        <div class="calendar-event-item-compact">
          <div class="event-time-compact">${timeStr}</div>
          <div class="event-details-compact">
            <div class="event-title-compact">${escapeHtml(event.title)}</div>
            ${event.location ? `<div class="event-location-compact">📍 ${escapeHtml(event.location)}</div>` : ""}
          </div>
        </div>
      `;
          }
        )
        .join("");
    } else {
      todayEl.innerHTML = '<p class="text-slate-400 text-center py-2 text-sm">No events scheduled for today.</p>';
    }
  }

  // Render tomorrow's events (very compact)
  if (tomorrowEl) {
    if (calendarData.tomorrow && calendarData.tomorrow.length > 0) {
      const previewCount = Math.min(calendarData.tomorrow.length, 2);
      tomorrowEl.innerHTML = calendarData.tomorrow
        .slice(0, previewCount)
        .map(
          (event) => {
            const timeStr = formatEventTime(event);
            return `
        <div class="calendar-event-item-tiny">
          <div class="event-time-tiny">${timeStr}</div>
          <div class="event-title-tiny">${escapeHtml(event.title)}</div>
        </div>
      `;
          }
        )
        .join("");
      if (calendarData.tomorrow.length > previewCount) {
        tomorrowEl.innerHTML += `<p class="text-slate-400 text-xs text-center mt-1">+${calendarData.tomorrow.length - previewCount} more</p>`;
      }
    } else {
      tomorrowEl.innerHTML = '<p class="text-slate-400 text-center py-1 text-xs">No events tomorrow.</p>';
    }
  }
}

function renderTodayNotes() {
  const todayNotesEl = document.getElementById("today-notes");
  if (!todayNotesEl) return;

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Filter notes by today's date
  const todayNotes = notesData.filter(note => {
    const noteDate = note.notedate || note.createdat?.split('T')[0];
    return noteDate === today;
  });

  if (todayNotes.length === 0) {
    todayNotesEl.innerHTML = '<p class="text-slate-400 text-center py-2 text-sm">No notes for today.</p>';
    return;
  }

  // Separate completed and active notes
  const activeNotes = todayNotes.filter(n => !n.done);
  const completedNotes = todayNotes.filter(n => n.done);

  let html = '';
  
  // Active notes
  if (activeNotes.length > 0) {
    html += activeNotes
      .map(
        (note) => `
      <div class="note-card-compact note-${note.color || "yellow"}">
        <div class="flex items-start gap-2">
          <input type="checkbox" class="note-checkbox-today mt-1" data-id="${note.id}" ${note.done ? 'checked' : ''}>
          <div class="note-content-compact flex-1">${escapeHtml(note.content)}</div>
        </div>
      </div>
    `
      )
      .join("");
  }

  // Completed notes (with strikethrough)
  if (completedNotes.length > 0) {
    html += '<div class="mt-3 pt-3 border-t border-slate-700"><p class="text-xs text-slate-400 mb-2">Completed:</p>';
    html += completedNotes
      .map(
        (note) => `
      <div class="note-card-compact note-${note.color || "yellow"} opacity-60">
        <div class="flex items-start gap-2">
          <input type="checkbox" class="note-checkbox-today mt-1" data-id="${note.id}" checked>
          <div class="note-content-compact flex-1 line-through">${escapeHtml(note.content)}</div>
        </div>
      </div>
    `
      )
      .join("");
    html += '</div>';
  }

  todayNotesEl.innerHTML = html;

  // Add event listeners for checkboxes
  todayNotesEl.querySelectorAll('.note-checkbox-today').forEach(checkbox => {
    checkbox.addEventListener('change', async (e) => {
      const noteId = e.target.dataset.id;
      const isDone = e.target.checked;
      try {
        await updateNote(noteId, { done: isDone });
        await refreshNotes();
      } catch (error) {
        console.error('Error updating note:', error);
        e.target.checked = !isDone; // Revert on error
      }
    });
  });
}

// ===== WEATHER =====
let weatherData = null;
let weatherTimer = null;
let userLocation = null;

// Get user's location using browser geolocation API
function getUserLocation() {
  return new Promise((resolve, reject) => {
    // Check if we have a stored location (less than 1 hour old)
    const stored = localStorage.getItem("userLocation");
    if (stored) {
      try {
        const location = JSON.parse(stored);
        const age = Date.now() - location.timestamp;
        // Use stored location if less than 1 hour old
        if (age < 3600000) {
          resolve({ lat: location.lat, lon: location.lon });
          return;
        }
      } catch (e) {
        // Invalid stored data, continue to geolocation
      }
    }

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser");
      reject(new Error("Geolocation not supported"));
      return;
    }

    // Request location with timeout
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          timestamp: Date.now(),
        };
        // Store location for future use
        localStorage.setItem("userLocation", JSON.stringify(location));
        resolve({ lat: location.lat, lon: location.lon });
      },
      (error) => {
        console.warn("Geolocation error:", error.message);
        // If user denies or error occurs, try to use stored location anyway
        if (stored) {
          try {
            const location = JSON.parse(stored);
            resolve({ lat: location.lat, lon: location.lon });
            return;
          } catch (e) {
            // Fall through to reject
          }
        }
        reject(error);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 3600000, // Accept cached location up to 1 hour old
      }
    );
  });
}

async function fetchWeather() {
  try {
    // Get user location first
    let locationParams = "";
    try {
      const location = await getUserLocation();
      locationParams = `?lat=${location.lat}&lon=${location.lon}`;
    } catch (error) {
      console.warn("Could not get user location, using default:", error.message);
      // Will use default (Los Angeles) if no location provided
    }

    const res = await fetch(`/api/weather${locationParams}`);
    if (!res.ok) throw new Error("Weather fetch failed");
    const data = await res.json();
    weatherData = data;
    renderWeather();
  } catch (error) {
    console.error("Weather error:", error);
    // Set error states for all weather elements
    const elements = {
      "weather-temp-now": "--°",
      "weather-desc-now": "Unable to load",
      "weather-feels-like": "--°",
      "weather-humidity": "--%",
      "weather-wind": "-- mph",
      "weather-location": "--",
      "weather-desc-today": "--",
      "weather-temp-range": "--° / --°",
    };
    Object.entries(elements).forEach(([id, text]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    });
    const forecastEl = document.getElementById("weather-forecast");
    if (forecastEl) {
      forecastEl.innerHTML = '<p class="text-slate-400 text-center py-2 text-sm">Unable to load forecast.</p>';
    }
  }
}

function renderWeather() {
  if (!weatherData || !weatherData.current) return;

  const { current, today, forecast } = weatherData;

  // Render current weather
  const iconNowEl = document.getElementById("weather-icon-now");
  const tempNowEl = document.getElementById("weather-temp-now");
  const descNowEl = document.getElementById("weather-desc-now");
  const feelsLikeEl = document.getElementById("weather-feels-like");
  const humidityEl = document.getElementById("weather-humidity");
  const windEl = document.getElementById("weather-wind");
  const locationEl = document.getElementById("weather-location");

  if (iconNowEl) {
    iconNowEl.src = `https://openweathermap.org/img/wn/${current.icon}@2x.png`;
    iconNowEl.alt = current.description;
  }
  if (tempNowEl) tempNowEl.textContent = `${current.temp}°`;
  if (descNowEl) {
    descNowEl.textContent = current.description.charAt(0).toUpperCase() + current.description.slice(1);
  }
  if (feelsLikeEl) feelsLikeEl.textContent = `${current.feelsLike}°`;
  if (humidityEl) humidityEl.textContent = `${current.humidity}%`;
  if (windEl) windEl.textContent = `${current.windSpeed} mph`;
  if (locationEl) locationEl.textContent = `${current.city}${current.country ? `, ${current.country}` : ""}`;

  // Render today's summary
  const iconTodayEl = document.getElementById("weather-icon-today");
  const descTodayEl = document.getElementById("weather-desc-today");
  const tempRangeEl = document.getElementById("weather-temp-range");

  if (iconTodayEl && today) {
    iconTodayEl.src = `https://openweathermap.org/img/wn/${today.icon}@2x.png`;
    iconTodayEl.alt = today.description;
  }
  if (descTodayEl && today) {
    descTodayEl.textContent = today.description.charAt(0).toUpperCase() + today.description.slice(1);
  }
  if (tempRangeEl && today) {
    tempRangeEl.textContent = `${today.min}° / ${today.max}°`;
  }

  // Render 5-day forecast
  const forecastEl = document.getElementById("weather-forecast");
  if (forecastEl && forecast && forecast.length > 0) {
    forecastEl.innerHTML = forecast
      .map((day, index) => {
        // Skip today (index 0) as we already show it
        if (index === 0) return "";
        
        const date = new Date(day.date);
        const dayName = index === 1 ? "Tomorrow" : day.dayName;
        
        return `
          <div class="forecast-day-item">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3 flex-1">
                <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${day.description}" class="w-10 h-10" />
                <div class="flex-1">
                  <div class="text-sm font-semibold text-slate-200">${dayName}</div>
                  <div class="text-xs text-slate-400 capitalize">${day.description}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm font-semibold text-slate-200">${day.max}°</div>
                <div class="text-xs text-slate-400">${day.min}°</div>
              </div>
            </div>
          </div>
        `;
      })
      .filter(html => html !== "")
      .join("");
  } else if (forecastEl) {
    forecastEl.innerHTML = '<p class="text-slate-400 text-center py-2 text-sm">No forecast available.</p>';
  }
}

// ===== NOTES =====
let notesData = [];
let notesTimer = null;

async function fetchNotes() {
  try {
    const res = await fetch("/api/notes");
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Notes fetch error:", error);
    return [];
  }
}

async function addNote(content, color) {
  try {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, color }),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to add note: ${res.status} - ${errorText}`);
    }
    await refreshNotes();
    return await res.json();
  } catch (error) {
    console.error("Add note error:", error);
    throw error; // Re-throw so caller can handle it
  }
}

async function updateNote(id, data) {
  try {
    await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await refreshNotes();
  } catch (error) {
    console.error("Update note error:", error);
  }
}

async function deleteNote(id) {
  try {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    await refreshNotes();
  } catch (error) {
    console.error("Delete note error:", error);
  }
}

async function refreshNotes() {
  notesData = await fetchNotes();
  renderNotes();
  renderTodayNotes(); // Also render notes on Today page
  updateQuickStats();
}

function renderNotes() {
  const grid = document.getElementById("notes-grid");
  if (!grid) return;
  grid.innerHTML = "";

  if (notesData.length === 0) {
    grid.innerHTML = '<p class="text-slate-400 text-center py-8">No notes yet. Add one above!</p>';
    return;
  }

  notesData.forEach((note) => {
    const card = document.createElement("div");
    card.className = `note-card note-${note.color || "yellow"}`;
    card.innerHTML = `
      <div class="note-content">${escapeHtml(note.content)}</div>
      <div class="note-actions">
        <button class="note-edit-btn" data-id="${note.id}">Edit</button>
        <button class="note-delete-btn" data-id="${note.id}">Delete</button>
      </div>
    `;

    const editBtn = card.querySelector(".note-edit-btn");
    const deleteBtn = card.querySelector(".note-delete-btn");

    editBtn.addEventListener("click", () => {
      const newContent = prompt("Edit note:", note.content);
      if (newContent && newContent.trim()) {
        updateNote(note.id, { content: newContent.trim() });
      }
    });

    deleteBtn.addEventListener("click", () => {
      if (confirm("Delete this note?")) {
        deleteNote(note.id);
      }
    });

    grid.appendChild(card);
  });
}

function setupNotesForm() {
  const form = document.getElementById("note-form");
  const input = document.getElementById("note-input");
  const colorSelect = document.getElementById("note-color");
  if (!form || !input) return;

  // Pause rotation when user focuses on input
  input.addEventListener("focus", () => {
    pauseRotation();
  });

  // Resume rotation when user leaves input
  input.addEventListener("blur", () => {
    setTimeout(() => {
      if (document.activeElement !== input) {
        resumeRotation();
      }
    }, 500);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const content = input.value.trim();
    const color = colorSelect?.value || "yellow";
    if (!content) return;
    await addNote(content, color);
    input.value = "";
    resumeRotation(); // Resume after submitting
  });
}

// ===== SHOPPING LIST =====
let shoppingData = [];
let shoppingTimer = null;

async function fetchShopping() {
  try {
    const res = await fetch("/api/shopping");
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Shopping fetch error:", error);
    return [];
  }
}

async function addShoppingItem(item) {
  try {
    const res = await fetch("/api/shopping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item }),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to add shopping item: ${res.status} - ${errorText}`);
    }
    await refreshShopping();
    return await res.json();
  } catch (error) {
    console.error("Add shopping error:", error);
    throw error; // Re-throw so caller can handle it
  }
}

async function updateShoppingItem(id, data) {
  try {
    await fetch(`/api/shopping/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await refreshShopping();
  } catch (error) {
    console.error("Update shopping error:", error);
  }
}

async function deleteShoppingItem(id) {
  try {
    await fetch(`/api/shopping/${id}`, { method: "DELETE" });
    await refreshShopping();
  } catch (error) {
    console.error("Delete shopping error:", error);
  }
}

async function refreshShopping() {
  shoppingData = await fetchShopping();
  renderShopping();
  updateQuickStats();
}

function renderShopping() {
  const list = document.getElementById("shopping-list");
  if (!list) return;
  list.innerHTML = "";

  if (shoppingData.length === 0) {
    list.innerHTML = '<p class="text-slate-400 text-center py-8">Shopping list is empty. Add items above!</p>';
    return;
  }

  const checked = shoppingData.filter((item) => item.checked);
  const unchecked = shoppingData.filter((item) => !item.checked);

  [...unchecked, ...checked].forEach((item) => {
    const li = document.createElement("div");
    li.className = `shopping-item ${item.checked ? "checked" : ""}`;
    li.innerHTML = `
      <label class="shopping-checkbox-label">
        <input type="checkbox" ${item.checked ? "checked" : ""} data-id="${item.id}" class="shopping-checkbox" />
        <span class="shopping-item-text">${escapeHtml(item.item)}</span>
      </label>
      <button class="shopping-delete-btn" data-id="${item.id}">×</button>
    `;

    const checkbox = li.querySelector(".shopping-checkbox");
    const deleteBtn = li.querySelector(".shopping-delete-btn");

    checkbox.addEventListener("change", () => {
      updateShoppingItem(item.id, { checked: checkbox.checked });
    });

    deleteBtn.addEventListener("click", () => {
      deleteShoppingItem(item.id);
    });

    list.appendChild(li);
  });
}

function setupShoppingForm() {
  const form = document.getElementById("shopping-form");
  const input = document.getElementById("shopping-input");
  if (!form || !input) return;

  // Pause rotation when user focuses on input
  input.addEventListener("focus", () => {
    pauseRotation();
  });

  // Resume rotation when user leaves input
  input.addEventListener("blur", () => {
    setTimeout(() => {
      if (document.activeElement !== input) {
        resumeRotation();
      }
    }, 500);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const item = input.value.trim();
    if (!item) return;
    await addShoppingItem(item);
    input.value = "";
    resumeRotation(); // Resume after submitting
  });
}

// ===== QUICK STATS =====
function updateQuickStats() {
  const projects = projectsData || [];
  const activeProjects = projects.filter((p) => p.status !== "done").length;
  const shoppingCount = shoppingData.filter((item) => !item.checked).length;
  const notesCount = notesData.length;
  const doneToday = projects.filter((p) => {
    if (p.status !== "done") return false;
    const updated = new Date(p.updatedAt);
    const today = new Date();
    return updated.toDateString() === today.toDateString();
  }).length;

  const quickProjects = document.getElementById("quick-projects");
  const quickShopping = document.getElementById("quick-shopping");
  const quickNotes = document.getElementById("quick-notes");
  const quickDone = document.getElementById("quick-done");

  if (quickProjects) quickProjects.textContent = activeProjects;
  if (quickShopping) quickShopping.textContent = shoppingCount;
  if (quickNotes) quickNotes.textContent = notesCount;
  if (quickDone) quickDone.textContent = doneToday;
}

// ===== REAL-TIME SYNC =====
const SYNC_INTERVAL_MS = 5000; // Poll every 5 seconds
let syncTimer = null;
let projectsData = [];

function startRealTimeSync() {
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = setInterval(async () => {
    // Only sync if not actively editing (simple debounce)
    if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
      return;
    }
    await Promise.all([refreshProjects(), refreshNotes(), refreshShopping()]);
  }, SYNC_INTERVAL_MS);
}

async function refreshProjects() {
  try {
    projectsData = await fetchProjects();
    await renderProjects();
    updateQuickStats();
  } catch (error) {
    console.error("Error refreshing projects:", error);
  }
}

// ===== UTILITY =====
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ===== PERFORMANCE OPTIMIZATIONS =====
// Lazy load calendar iframes
function lazyLoadCalendars() {
  const iframes = document.querySelectorAll(".frame-wrapper iframe");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !entry.target.dataset.loaded) {
        entry.target.dataset.loaded = "true";
        // Iframe src is already set, just mark as loaded
      }
    });
  });
  iframes.forEach((iframe) => observer.observe(iframe));
}

// Debounce resize events
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (snowCtx) {
      const canvas = snowCtx.canvas;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }, 250);
});


function init() {
  slides = Array.from(document.querySelectorAll(".slide"));
  renderToday();
  startClock();
  fetchWeather();
  fetchCalendarEvents();
  refreshProjects();
  refreshNotes();
  refreshShopping();
  setupForm();
  setupNotesForm();
  setupShoppingForm();
  initSlides();
  setupNavButtons();
  setupMobileMenu();
  initVoiceCommands();
  initSnow();
  lazyLoadCalendars();
  startRealTimeSync();

  // Refresh weather every 10 minutes
  weatherTimer = setInterval(fetchWeather, 600000);
  // Refresh calendar events every 5 minutes
  calendarTimer = setInterval(fetchCalendarEvents, 300000);
}

// ===== VOICE COMMANDS =====
let recognition = null;
let isListening = false;

function initVoiceCommands() {
  // Check if browser supports Web Speech API
  if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
    const voiceBtn = document.getElementById("voice-btn");
    if (voiceBtn) {
      voiceBtn.style.display = "none";
    }
    console.warn("Voice recognition not supported in this browser");
    return;
  }

  // Initialize speech recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    isListening = true;
    showVoiceIndicator();
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();
    console.log("Raw transcript:", transcript);
    processVoiceCommand(transcript.toLowerCase());
    hideVoiceIndicator();
  };

  recognition.onerror = (event) => {
    console.error("Voice recognition error:", event.error);
    hideVoiceIndicator();
    if (event.error === "not-allowed") {
      alert("Microphone permission denied. Please enable microphone access in your browser settings.");
    }
  };

  recognition.onend = () => {
    isListening = false;
    hideVoiceIndicator();
  };

  // Setup voice button
  const voiceBtn = document.getElementById("voice-btn");
  if (voiceBtn) {
    voiceBtn.addEventListener("click", toggleVoiceListening);
  }
}

function toggleVoiceListening() {
  if (!recognition) return;

  if (isListening) {
    recognition.stop();
    isListening = false;
    hideVoiceIndicator();
  } else {
    try {
      recognition.start();
    } catch (error) {
      console.error("Error starting recognition:", error);
    }
  }
}

function showVoiceIndicator() {
  const indicator = document.getElementById("voice-indicator");
  if (indicator) {
    indicator.classList.remove("hidden");
  }
}

function hideVoiceIndicator() {
  const indicator = document.getElementById("voice-indicator");
  if (indicator) {
    indicator.classList.add("hidden");
  }
}

function processVoiceCommand(transcript) {
  console.log("Voice command:", transcript);

  // Add to shopping list - improved regex patterns
  let shoppingMatch = transcript.match(/add (.+?)(?: to (?:the )?shopping list| to shopping| shopping list)/i);
  if (!shoppingMatch) {
    shoppingMatch = transcript.match(/shopping list (.+)/i);
  }
  if (!shoppingMatch) {
    shoppingMatch = transcript.match(/add (.+?) to shopping/i);
  }
  
  if (shoppingMatch) {
    const item = shoppingMatch[1].trim();
    console.log("Matched shopping command, item:", item);
    if (item) {
      addShoppingItem(item)
        .then(() => {
          console.log("Successfully added shopping item:", item);
          showVoiceFeedback(`Added "${item}" to shopping list`);
        })
        .catch((error) => {
          console.error("Error adding shopping item:", error);
          showVoiceFeedback(`Error: Could not add "${item}" to shopping list. Check console for details.`);
        });
      return;
    }
  }

  // Add note
  const noteMatch = transcript.match(/add (.+?) to (?:the )?notes/i) ||
    transcript.match(/note (.+)/i) ||
    transcript.match(/remember (.+)/i);
  if (noteMatch) {
    const content = noteMatch[1].trim();
    if (content) {
      addNote(content, "yellow")
        .then(() => {
          showVoiceFeedback(`Added note: "${content}"`);
        })
        .catch((error) => {
          console.error("Error adding note:", error);
          showVoiceFeedback(`Error: Could not add note`);
        });
      return;
    }
  }

  // Add project
  const projectMatch = transcript.match(/add (.+?) to (?:the )?projects/i) ||
    transcript.match(/project (.+)/i) ||
    transcript.match(/new project (.+)/i);
  if (projectMatch) {
    const title = projectMatch[1].trim();
    if (title) {
      addProject(title)
        .then(async () => {
          await refreshProjects();
          showVoiceFeedback(`Added project: "${title}"`);
        })
        .catch((error) => {
          console.error("Error adding project:", error);
          showVoiceFeedback(`Error: Could not add project`);
        });
      return;
    }
  }

  // Navigation commands
  const navCommands = {
    "show month": 0,
    "go to month": 0,
    "month view": 0,
    "show week": 1,
    "go to week": 1,
    "week view": 1,
    "show today": 2,
    "go to today": 2,
    "today view": 2,
    "show projects": 3,
    "go to projects": 3,
    "projects view": 3,
    "show notes": 4,
    "go to notes": 4,
    "notes view": 4,
    "show shopping": 5,
    "go to shopping": 5,
    "shopping view": 5,
    "shopping list": 5,
  };

  for (const [command, slideIndex] of Object.entries(navCommands)) {
    if (transcript.includes(command)) {
      setActiveSlide(slideIndex);
      startRotation();
      showVoiceFeedback(`Navigating to ${command}`);
      return;
    }
  }

  // Default feedback
  showVoiceFeedback("Command not recognized. Try: 'Add [item] to shopping list'");
}

function showVoiceFeedback(message) {
  // Create temporary feedback element
  const feedback = document.createElement("div");
  feedback.className = "voice-feedback";
  feedback.textContent = message;
  document.body.appendChild(feedback);

  setTimeout(() => {
    feedback.classList.add("show");
  }, 10);

  setTimeout(() => {
    feedback.classList.remove("show");
    setTimeout(() => feedback.remove(), 300);
  }, 3000);
}

document.addEventListener("DOMContentLoaded", init);

