const SLIDE_INTERVAL_MS = 15000;

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

function startRotation() {
  if (slideTimer) clearInterval(slideTimer);
  slideTimer = setInterval(() => {
    setActiveSlide((currentSlideIndex + 1) % slides.length);
  }, SLIDE_INTERVAL_MS);
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

async function fetchProjects() {
  const res = await fetch("/api/projects");
  if (!res.ok) return [];
  return res.json();
}

async function updateProject(id, data) {
  await fetch(`/api/projects/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

async function deleteProject(id) {
  await fetch(`/api/projects/${id}`, { method: "DELETE" });
}

async function addProject(title) {
  await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
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

  const meta = document.createElement("div");
  meta.className = "project-meta";
  const pill = document.createElement("span");
  pill.className = `status-pill ${(project.status || "todo").replace(" ", "_")}`;
  pill.textContent =
    project.status === "done"
      ? "Done"
      : project.status === "in_progress"
        ? "In Progress"
        : "Todo";

  const updated = document.createElement("span");
  const updatedAt = project.updatedAt
    ? new Date(project.updatedAt).toLocaleString()
    : "n/a";
  updated.textContent = `Updated: ${updatedAt}`;

  meta.appendChild(pill);
  meta.appendChild(updated);

  // Progress row
  const progressRow = document.createElement("div");
  progressRow.className = "progress-row";
  const progressBar = document.createElement("div");
  progressBar.className = "progress-bar";
  const progressFill = document.createElement("div");
  progressFill.className = "progress-fill";
  const progressValue = document.createElement("span");
  progressValue.className = "progress-value";
  const pct = Number.isFinite(project.progress) ? project.progress : 0;
  progressFill.style.width = `${pct}%`;
  progressValue.textContent = `${pct}%`;
  progressBar.appendChild(progressFill);

  const progressInput = document.createElement("input");
  progressInput.type = "range";
  progressInput.min = "0";
  progressInput.max = "100";
  progressInput.value = pct;
  progressInput.addEventListener("input", () => {
    progressFill.style.width = `${progressInput.value}%`;
    progressValue.textContent = `${progressInput.value}%`;
  });
  progressInput.addEventListener("change", async () => {
    await updateProject(project.id, { progress: Number(progressInput.value) });
    refresh();
  });

  progressRow.appendChild(progressBar);
  progressRow.appendChild(progressValue);
  progressRow.appendChild(progressInput);

  // Dates row
  const datesRow = document.createElement("div");
  datesRow.className = "dates-row";
  const startLabel = document.createElement("label");
  startLabel.textContent = "Start";
  const startInput = document.createElement("input");
  startInput.type = "date";
  startInput.value = project.startDate || "";
  startInput.addEventListener("change", async () => {
    await updateProject(project.id, { startDate: startInput.value });
    refresh();
  });
  startLabel.appendChild(startInput);

  const endLabel = document.createElement("label");
  endLabel.textContent = "End";
  const endInput = document.createElement("input");
  endInput.type = "date";
  endInput.value = project.endDate || "";
  endInput.addEventListener("change", async () => {
    await updateProject(project.id, { endDate: endInput.value });
    refresh();
  });
  endLabel.appendChild(endInput);

  datesRow.appendChild(startLabel);
  datesRow.appendChild(endLabel);

  // Note box
  const noteBox = document.createElement("div");
  noteBox.className = "note-box";
  const noteArea = document.createElement("textarea");
  noteArea.className = "note-textarea";
  noteArea.placeholder = "Notes / working on...";
  noteArea.value = project.note || "";
  const noteSave = document.createElement("button");
  noteSave.className = "note-save";
  noteSave.textContent = "Save note";
  noteSave.addEventListener("click", async () => {
    await updateProject(project.id, { note: noteArea.value });
    refresh();
  });
  noteBox.appendChild(noteArea);
  noteBox.appendChild(noteSave);

  // Updates log
  const updatesBox = document.createElement("div");
  updatesBox.className = "updates-box";
  const updatesTitle = document.createElement("strong");
  updatesTitle.textContent = "Updates";
  const updatesList = document.createElement("ul");
  updatesList.className = "updates-list";
  (project.updates || []).forEach((u) => {
    const liUpdate = document.createElement("li");
    liUpdate.textContent = u.message || "";
    const when = u.at ? new Date(u.at).toLocaleString() : "";
    const small = document.createElement("small");
    small.textContent = when;
    liUpdate.appendChild(document.createTextNode(" "));
    liUpdate.appendChild(small);
    updatesList.appendChild(liUpdate);
  });

  const updateRow = document.createElement("div");
  updateRow.className = "update-input-row";
  const updateInput = document.createElement("input");
  updateInput.type = "text";
  updateInput.placeholder = "Add update...";
  const updateBtn = document.createElement("button");
  updateBtn.textContent = "Add";
  updateBtn.addEventListener("click", async () => {
    const msg = updateInput.value.trim();
    if (!msg) return;
    await updateProject(project.id, { appendUpdate: msg });
    updateInput.value = "";
    refresh();
  });
  updateRow.appendChild(updateInput);
  updateRow.appendChild(updateBtn);

  updatesBox.appendChild(updatesTitle);
  updatesBox.appendChild(updatesList);
  updatesBox.appendChild(updateRow);

  const delBtn = document.createElement("button");
  delBtn.className = "delete-btn";
  delBtn.textContent = "Delete";
  delBtn.addEventListener("click", async () => {
    await deleteProject(project.id);
    refresh();
  });

  li.appendChild(checkbox);
  li.appendChild(title);
  li.appendChild(statusSelect);
  li.appendChild(delBtn);
  li.appendChild(meta);
  li.appendChild(progressRow);
  li.appendChild(datesRow);
  li.appendChild(noteBox);
  li.appendChild(updatesBox);
  return li;
}

async function renderProjects() {
  const listEl = document.getElementById("projects-list");
  if (!listEl) return;
  listEl.innerHTML = "";
  const projects = await fetchProjects();
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

  const column = document.createElement("div");
  column.className = "grid md:grid-cols-2 xl:grid-cols-3 gap-4";
  projects.forEach((project) => {
    const item = createProjectElement(project, renderProjects);
    column.appendChild(item);
  });
  listEl.appendChild(column);
}

function setupForm() {
  const form = document.getElementById("project-form");
  const input = document.getElementById("project-input");
  if (!form || !input) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    await addProject(value);
    input.value = "";
    renderProjects();
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
      }
    });
  });
}

// ===== WEATHER =====
let weatherData = null;
let weatherTimer = null;

async function fetchWeather() {
  try {
    const res = await fetch("/api/weather");
    if (!res.ok) throw new Error("Weather fetch failed");
    const data = await res.json();
    weatherData = data;
    renderWeather();
  } catch (error) {
    console.error("Weather error:", error);
    document.getElementById("weather-temp").textContent = "--°";
    document.getElementById("weather-desc").textContent = "Unable to load";
  }
}

function renderWeather() {
  if (!weatherData) return;
  const iconEl = document.getElementById("weather-icon");
  const tempEl = document.getElementById("weather-temp");
  const descEl = document.getElementById("weather-desc");
  const detailsEl = document.getElementById("weather-details");

  if (iconEl) {
    const iconMap = {
      "01d": "☀️", "01n": "🌙",
      "02d": "⛅", "02n": "☁️",
      "03d": "☁️", "03n": "☁️",
      "04d": "☁️", "04n": "☁️",
      "09d": "🌧️", "09n": "🌧️",
      "10d": "🌦️", "10n": "🌧️",
      "11d": "⛈️", "11n": "⛈️",
      "13d": "❄️", "13n": "❄️",
      "50d": "🌫️", "50n": "🌫️",
    };
    iconEl.textContent = iconMap[weatherData.icon] || "⛅";
  }
  if (tempEl) tempEl.textContent = `${weatherData.temp}°`;
  if (descEl) descEl.textContent = weatherData.description.charAt(0).toUpperCase() + weatherData.description.slice(1);
  if (detailsEl) {
    detailsEl.innerHTML = `
      Feels like ${weatherData.feelsLike}°<br>
      ${weatherData.humidity}% humidity • ${weatherData.windSpeed} mph wind<br>
      ${weatherData.city}, ${weatherData.country}
    `;
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
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, color }),
    });
    await refreshNotes();
  } catch (error) {
    console.error("Add note error:", error);
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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const content = input.value.trim();
    const color = colorSelect?.value || "yellow";
    if (!content) return;
    await addNote(content, color);
    input.value = "";
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
    await fetch("/api/shopping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item }),
    });
    await refreshShopping();
  } catch (error) {
    console.error("Add shopping error:", error);
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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const item = input.value.trim();
    if (!item) return;
    await addShoppingItem(item);
    input.value = "";
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
  projectsData = await fetchProjects();
  renderProjects();
  updateQuickStats();
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
  fetchWeather();
  refreshProjects();
  refreshNotes();
  refreshShopping();
  setupForm();
  setupNotesForm();
  setupShoppingForm();
  initSlides();
  setupNavButtons();
  initSnow();
  lazyLoadCalendars();
  startRealTimeSync();

  // Refresh weather every 10 minutes
  weatherTimer = setInterval(fetchWeather, 600000);
}

document.addEventListener("DOMContentLoaded", init);

