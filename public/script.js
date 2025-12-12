const SLIDE_INTERVAL_MS = 15000; // Default interval
// Different intervals for different slides (in milliseconds)
const SLIDE_DURATIONS = {
  0: 15000, // Month - 15 seconds
  1: 15000, // Week - 15 seconds
  2: 30000, // Today - 30 seconds (longer!)
  3: 20000, // Projects - 20 seconds
  4: 15000, // Notes - 15 seconds
  5: 15000, // Shopping - 15 seconds
  6: 20000, // Energy - 20 seconds
};

let slides = [];
let currentSlideIndex = 0;
let slideTimer = null;
let snowCtx = null;
let snowParticles = [];
let activityTimer = null;
const ACTIVITY_TIMEOUT_MS = 10000; // Resume rotation after 10 seconds of inactivity

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

function handleUserActivity() {
  // Don't pause if user is typing in an input field (that's handled separately)
  const activeElement = document.activeElement;
  if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
    return; // Let the input focus handlers manage pausing
  }
  
  // Pause rotation when user is active
  if (!rotationPaused) {
    pauseRotation();
  }
  
  // Clear existing activity timer
  if (activityTimer) {
    clearTimeout(activityTimer);
  }
  
  // Resume rotation after period of inactivity
  activityTimer = setTimeout(() => {
    // Only resume if not typing and rotation is paused
    const stillActive = document.activeElement;
    if (rotationPaused && 
        stillActive?.tagName !== 'INPUT' && 
        stillActive?.tagName !== 'TEXTAREA') {
      resumeRotation();
    }
  }, ACTIVITY_TIMEOUT_MS);
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
  // Date is now shown in clock widget, no need for separate date display
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
  if (!id) {
    throw new Error("Project ID is required");
  }
  
  try {
    console.log("Deleting project with ID:", id);
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
  li.setAttribute("draggable", "true");
  li.dataset.projectId = project.id;
  li.dataset.order = project.order !== undefined ? project.order : 999999;

  // Create all elements first
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
        const projectId = project.id;
        if (!projectId) {
          throw new Error("Project ID is missing");
        }
        await deleteProject(projectId);
        await refreshProjects();
      } catch (error) {
        console.error("Error deleting project:", error, project);
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

  // Drag and drop handlers - attach AFTER elements are in DOM
  li.addEventListener("mousedown", (e) => {
    // Don't start drag if clicking on interactive elements
    const target = e.target;
    if (target === checkbox || target === statusSelect || target === delBtn || 
        target.tagName === "OPTION" || target.closest("select") === statusSelect ||
        target.closest("button") === delBtn || target.closest("input") === checkbox) {
      return;
    }
  });

  li.addEventListener("dragstart", (e) => {
    // Create a clone of the element as the drag image
    const dragImage = li.cloneNode(true);
    dragImage.style.position = "absolute";
    dragImage.style.top = "-1000px";
    dragImage.style.opacity = "0.8";
    dragImage.style.pointerEvents = "none";
    dragImage.style.transform = "rotate(5deg)";
    document.body.appendChild(dragImage);
    
    // Set the drag image offset to center
    const rect = li.getBoundingClientRect();
    e.dataTransfer.setDragImage(dragImage, rect.width / 2, rect.height / 2);
    
    // Clean up the drag image after drag ends
    setTimeout(() => {
      if (dragImage.parentNode) {
        dragImage.parentNode.removeChild(dragImage);
      }
    }, 100);
    
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", project.id);
    e.dataTransfer.setData("application/json", JSON.stringify({ id: project.id }));
    
    li.classList.add("dragging");
    draggedElement = li;
    pauseRotation();
  });

  li.addEventListener("dragend", (e) => {
    li.classList.remove("dragging");
    
    if (draggedElement === li) {
      draggedElement = null;
    }
    
    resumeRotation();
  });

  // Prevent child elements from interfering - but allow them to work
  checkbox.addEventListener("mousedown", (e) => {
    e.stopPropagation();
  });
  statusSelect.addEventListener("mousedown", (e) => {
    e.stopPropagation();
  });
  delBtn.addEventListener("mousedown", (e) => {
    e.stopPropagation();
  });

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

  // Sort projects by order within each status
  const sortByOrder = (a, b) => {
    const orderA = a.order !== undefined ? a.order : 999999;
    const orderB = b.order !== undefined ? b.order : 999999;
    return orderA - orderB;
  };

  // Populate columns (sorted by order)
  projects.sort(sortByOrder).forEach((project) => {
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

  // Setup drag and drop for each column - do this AFTER all items are added
  setTimeout(() => {
    setupDragAndDrop(todoCol);
    setupDragAndDrop(inprogressCol);
    setupDragAndDrop(doneCol);
  }, 0);
}

// Setup drag and drop handlers for a project column
const dragDropSetup = new WeakMap();
let draggedElement = null;

function setupDragAndDrop(column) {
  // Skip if already set up
  if (dragDropSetup.has(column)) return;
  dragDropSetup.set(column, true);

  column.setAttribute("data-drop-zone", "true");

  column.addEventListener("dragenter", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  column.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    
    if (!draggedElement) return;

    const siblings = Array.from(column.children).filter(
      child => child.classList.contains("project-item") && child !== draggedElement
    );

    let nextSibling = null;
    for (const sibling of siblings) {
      const box = sibling.getBoundingClientRect();
      const middle = box.top + box.height / 2;
      if (e.clientY < middle) {
        nextSibling = sibling;
        break;
      }
    }

    // Move the element
    if (nextSibling) {
      if (draggedElement.nextSibling !== nextSibling) {
        column.insertBefore(draggedElement, nextSibling);
      }
    } else {
      if (draggedElement.parentNode !== column || draggedElement.nextSibling !== null) {
        column.appendChild(draggedElement);
      }
    }
  });

  column.addEventListener("drop", async (e) => {
    e.preventDefault();
    if (!draggedElement) return;

    const allItems = Array.from(column.children).filter(item => 
      item.classList.contains("project-item")
    );
    
    let status = "todo";
    if (column.id === "board-inprogress") {
      status = "in_progress";
    } else if (column.id === "board-done") {
      status = "done";
    }
    
    const projects = await fetchProjects();
    const sameStatusProjects = projects.filter(p => (p.status || "todo") === status);
    
    const orderUpdates = [];
    allItems.forEach((item, index) => {
      const projectId = item.dataset.projectId;
      const proj = sameStatusProjects.find(p => p.id === projectId);
      if (proj && proj.order !== index) {
        orderUpdates.push({ id: projectId, order: index });
      }
    });

    if (orderUpdates.length > 0) {
      await Promise.all(orderUpdates.map(({ id, order }) => 
        updateProject(id, { order }).catch(err => {
          console.error(`Failed to update order for project ${id}:`, err);
        })
      ));
      await renderProjects();
    }
    
    draggedElement = null;
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
function setupUserActivityDetection() {
  // Pause rotation on mouse movement
  let mouseMoveTimeout;
  document.addEventListener("mousemove", () => {
    handleUserActivity();
    // Debounce mouse move events to avoid too many calls
    clearTimeout(mouseMoveTimeout);
    mouseMoveTimeout = setTimeout(() => {
      handleUserActivity();
    }, 100);
  });

  // Pause rotation on clicks
  document.addEventListener("click", handleUserActivity);

  // Pause rotation on scroll
  document.addEventListener("scroll", handleUserActivity, true);

  // Pause rotation on touch (mobile)
  document.addEventListener("touchstart", handleUserActivity);
  document.addEventListener("touchmove", handleUserActivity);

  // Pause rotation on keyboard activity (but not when typing in inputs)
  document.addEventListener("keydown", (e) => {
    // Don't pause if user is typing in an input/textarea
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      handleUserActivity();
    }
  });
}

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

function renderTodayFocus() {
  const focusEl = document.getElementById("today-focus");
  if (!focusEl) return;

  const focusItems = [];

  // Get in-progress projects (top priority)
  if (projectsData && projectsData.length > 0) {
    const inProgress = projectsData
      .filter(p => (p.status || "todo") === "in_progress")
      .sort((a, b) => (a.order || 999999) - (b.order || 999999))
      .slice(0, 3);
    
    inProgress.forEach(project => {
      focusItems.push({
        type: "project",
        title: project.title,
        icon: "📋",
        priority: "high"
      });
    });
  }

  // Get today's calendar events (especially morning/important ones)
  if (calendarData && calendarData.today && calendarData.today.length > 0) {
    const todayEvents = calendarData.today
      .filter(event => {
        // Prioritize events happening in the morning or soon
        if (event.isAllDay) return true;
        try {
          const eventTime = new Date(event.startDate);
          const now = new Date();
          const hoursUntil = (eventTime - now) / (1000 * 60 * 60);
          return hoursUntil >= 0 && hoursUntil <= 12; // Next 12 hours
        } catch {
          return true;
        }
      })
      .slice(0, 2);
    
    todayEvents.forEach(event => {
      const timeStr = formatEventTime(event);
      focusItems.push({
        type: "event",
        title: event.title,
        time: timeStr,
        icon: "📅",
        priority: "medium"
      });
    });
  }

  // Render focus items
  if (focusItems.length > 0) {
    focusEl.innerHTML = focusItems.map(item => `
      <div class="focus-item flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
        <span class="text-xl">${item.icon}</span>
        <div class="flex-1">
          <div class="font-semibold text-sm">${escapeHtml(item.title)}</div>
          ${item.time ? `<div class="text-xs text-slate-400">${escapeHtml(item.time)}</div>` : ""}
        </div>
      </div>
    `).join("");
  } else {
    focusEl.innerHTML = '<p class="text-slate-400 text-center py-2 text-sm">No focus items for today. Great job staying on top of things! 🎉</p>';
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

  // Update Today's Focus when calendar data changes
  renderTodayFocus();
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
  if (locationEl) {
    const locationText = `${current.city}${current.country ? `, ${current.country}` : ""}`;
    // Truncate long location names
    locationEl.textContent = locationText.length > 15 ? locationText.substring(0, 12) + "..." : locationText;
  }

  // Render 5-day forecast (compact version)
  const forecastEl = document.getElementById("weather-forecast");
  if (forecastEl && forecast && forecast.length > 0) {
    forecastEl.innerHTML = forecast
      .map((day, index) => {
        // Skip today (index 0) as we already show it in current weather
        if (index === 0) return "";
        
        const dayName = index === 1 ? "Tomorrow" : day.dayName?.substring(0, 3) || "Day";
        
        return `
          <div class="forecast-day-item-compact">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5 flex-1 min-w-0">
                <img src="https://openweathermap.org/img/wn/${day.icon}.png" alt="${day.description}" class="w-6 h-6 flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-semibold text-slate-200 truncate">${dayName}</div>
                  <div class="text-xs text-slate-400 truncate capitalize">${day.description}</div>
                </div>
              </div>
              <div class="text-right flex-shrink-0">
                <div class="text-xs font-semibold text-slate-200">${day.max}°</div>
                <div class="text-xs text-slate-400">${day.min}°</div>
              </div>
            </div>
          </div>
        `;
      })
      .filter(html => html !== "")
      .join("");
  } else if (forecastEl) {
    forecastEl.innerHTML = '<p class="text-slate-400 text-center py-1 text-xs">No forecast available.</p>';
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

    list.appendChild(li);
    
    // Get elements after they're in the DOM
    const checkbox = li.querySelector(".shopping-checkbox");
    const deleteBtn = li.querySelector(".shopping-delete-btn");

    if (checkbox) {
      checkbox.addEventListener("change", async (e) => {
        e.stopPropagation();
        try {
          await updateShoppingItem(item.id, { checked: checkbox.checked });
        } catch (error) {
          console.error("Error updating shopping item:", error);
          // Revert checkbox state on error
          checkbox.checked = !checkbox.checked;
        }
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          await deleteShoppingItem(item.id);
        } catch (error) {
          console.error("Error deleting shopping item:", error);
          alert(`Failed to delete item: ${error.message || "Unknown error"}`);
        }
      });
    }
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

// ===== ENERGY USAGE =====
async function fetchEnergyData() {
  try {
    const res = await fetch("/api/energy");
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Energy API error:", res.status, errorText);
      throw new Error(`Failed to fetch energy data: ${res.status}`);
    }
    const data = await res.json();
    console.log("Fetched energy data:", data.length, "records");
    renderEnergyData(data);
  } catch (error) {
    console.error("Error fetching energy data:", error);
    // Show error in UI
    const currentEl = document.getElementById("energy-current");
    const chartEl = document.getElementById("energy-chart");
    if (currentEl) {
      currentEl.innerHTML = `<p class="text-red-400 text-center py-4 text-sm">Error loading data: ${error.message}</p>`;
    }
    if (chartEl) {
      chartEl.innerHTML = `<p class="text-red-400 text-center py-4 text-sm">Error loading chart</p>`;
    }
  }
}

function renderEnergyData(data) {
  console.log("Rendering energy data:", data);
  
  if (!data || data.length === 0) {
    const currentEl = document.getElementById("energy-current");
    const chartEl = document.getElementById("energy-chart");
    if (currentEl) {
      currentEl.innerHTML = '<p class="text-slate-400 text-center py-4 text-sm">No energy data available. Upload a CSV file to get started.</p>';
    }
    if (chartEl) {
      chartEl.innerHTML = '<p class="text-slate-400 text-center py-4 text-sm">No energy data available.</p>';
    }
    return;
  }

  // Sort by date (newest first)
  const sortedData = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Get current period stats (most recent billing periods)
  const recentData = sortedData.slice(0, 30);
  const totalUsage = recentData.reduce((sum, d) => sum + (parseFloat(d.usage_kwh) || 0), 0);
  const totalExport = recentData.reduce((sum, d) => sum + (parseFloat(d.export_kwh) || 0), 0);
  const avgUsagePerPeriod = recentData.length > 0 ? totalUsage / recentData.length : 0;
  const avgCostPerPeriod = recentData.length > 0 
    ? recentData.reduce((sum, d) => sum + (parseFloat(d.cost) || 0), 0) / recentData.length 
    : 0;
  const latest = sortedData[0];

  // Render current stats
  const currentEl = document.getElementById("energy-current");
  if (currentEl) {
    currentEl.innerHTML = `
      <div class="space-y-3">
        <div class="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div class="text-xs text-slate-400 mb-1">Latest Billing Period</div>
          <div class="text-2xl font-bold">${latest.usage_kwh ? parseFloat(latest.usage_kwh).toFixed(1) : '--'} kWh</div>
          <div class="text-xs text-slate-400 mt-1">${latest.date ? new Date(latest.date).toLocaleDateString() : ''}</div>
          ${latest.cost ? `<div class="text-sm text-slate-300 mt-1">$${parseFloat(latest.cost).toFixed(2)}</div>` : ''}
        </div>
        <div class="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div class="text-xs text-slate-400 mb-1">Average per Period</div>
          <div class="text-2xl font-bold">${avgUsagePerPeriod.toFixed(1)} kWh</div>
          ${avgCostPerPeriod > 0 ? `<div class="text-sm text-slate-300 mt-1">$${avgCostPerPeriod.toFixed(2)} avg</div>` : ''}
        </div>
        <div class="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div class="text-xs text-slate-400 mb-1">Solar Export (SMUD)</div>
          <div class="text-2xl font-bold">${totalExport > 0 ? totalExport.toFixed(1) : '0.0'} kWh</div>
          <div class="text-xs text-slate-400 mt-1">Total exported to grid</div>
        </div>
        <div id="enphase-solar" class="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div class="text-xs text-slate-400 mb-1">Solar Production (Enphase)</div>
          <div id="enphase-production" class="text-2xl font-bold">-- kWh</div>
          <div class="text-xs text-slate-400 mt-1">Today's production</div>
        </div>
      </div>
    `;
  }

  // Render simple bar chart
  const chartEl = document.getElementById("energy-chart");
  if (chartEl) {
    // Show all available data (up to 30 billing periods), oldest to newest
    const chartData = sortedData.slice(0, 30).reverse();
    const maxUsage = Math.max(...chartData.map(d => parseFloat(d.usage_kwh) || 0), 1);
    const maxCost = Math.max(...chartData.map(d => parseFloat(d.cost) || 0), 1);
    
    if (chartData.length === 0) {
      chartEl.innerHTML = '<p class="text-slate-400 text-center py-4 text-sm">No data to display</p>';
      return;
    }
    
    chartEl.innerHTML = `
      <div class="w-full h-full flex flex-col gap-3" style="min-height: 300px;">
        <!-- Usage Chart -->
        <div class="flex-1 flex flex-col" style="min-height: 120px;">
          <div class="text-xs text-slate-400 mb-2">Usage (kWh)</div>
          <div class="flex-1 flex items-end justify-between gap-0.5" style="height: 100%;">
            ${chartData.map((d, idx) => {
              const usage = parseFloat(d.usage_kwh) || 0;
              const cost = parseFloat(d.cost) || 0;
              const height = maxUsage > 0 ? Math.max((usage / maxUsage) * 100, 2) : 0; // Min 2% height for visibility
              const date = new Date(d.date);
              const tooltipText = `${date.toLocaleDateString()}\n${usage.toFixed(1)} kWh${cost > 0 ? `\n$${cost.toFixed(2)}` : ''}`;
              return `
                <div class="flex-1 flex flex-col items-center justify-end gap-1 h-full energy-bar-container" style="min-width: 0;" data-usage="${usage}" data-cost="${cost}" data-date="${date.toLocaleDateString()}">
                  <div class="w-full bg-gradient-to-t from-blue-500 to-indigo-500 rounded-t transition-all hover:opacity-80 cursor-pointer energy-bar" style="height: ${height}%; min-height: 2px;"></div>
                  <div class="text-[10px] text-slate-400 transform -rotate-45 origin-top-left whitespace-nowrap" style="writing-mode: horizontal-tb; transform-origin: top left;">${date.getMonth() + 1}/${date.getDate()}</div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
        <!-- Cost Chart (if available) -->
        ${maxCost > 0 ? `
        <div class="flex-1 flex flex-col" style="min-height: 120px;">
          <div class="text-xs text-slate-400 mb-2">Cost ($)</div>
          <div class="flex-1 flex items-end justify-between gap-0.5" style="height: 100%;">
            ${chartData.map((d, idx) => {
              const cost = parseFloat(d.cost) || 0;
              const usage = parseFloat(d.usage_kwh) || 0;
              const height = maxCost > 0 ? Math.max((cost / maxCost) * 100, 2) : 0; // Min 2% height for visibility
              const date = new Date(d.date);
              return `
                <div class="flex-1 flex flex-col items-center justify-end gap-1 h-full energy-bar-container" style="min-width: 0;" data-usage="${usage}" data-cost="${cost}" data-date="${date.toLocaleDateString()}">
                  <div class="w-full bg-gradient-to-t from-green-500 to-emerald-500 rounded-t transition-all hover:opacity-80 cursor-pointer energy-bar" style="height: ${height}%; min-height: 2px;"></div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
        ` : ''}
      </div>
    `;
    
    // Add tooltips to bars after rendering
    setTimeout(() => {
      const containers = chartEl.querySelectorAll('.energy-bar-container');
      containers.forEach(container => {
        const usage = parseFloat(container.dataset.usage) || 0;
        const cost = parseFloat(container.dataset.cost) || 0;
        const date = container.dataset.date || '';
        
        if (cost > 0 || usage > 0) {
          const tooltip = document.createElement('div');
          tooltip.className = 'energy-tooltip';
          tooltip.innerHTML = `
            <div class="font-semibold mb-1">${date}</div>
            <div>${usage.toFixed(1)} kWh</div>
            ${cost > 0 ? `<div class="text-green-400 font-semibold">$${cost.toFixed(2)}</div>` : ''}
          `;
          container.appendChild(tooltip);
        }
      });
    }, 100);
  }
}

// ===== ENPHASE SOLAR DATA =====
// DISABLED: API calls disabled to prevent charges
async function fetchEnphaseData() {
  // API calls disabled - function kept for potential future use
  return;
  /*
  try {
    const res = await fetch("/api/enphase");
    const responseData = await res.json();
    
    if (!res.ok) {
      console.error("Enphase API error:", responseData);
      const enphaseEl = document.getElementById("enphase-solar");
      if (enphaseEl) {
        // Show error message instead of hiding
        const productionEl = document.getElementById("enphase-production");
        if (productionEl) {
          productionEl.textContent = "Error";
          productionEl.parentElement.querySelector('.text-xs').textContent = responseData.message || "Check console";
        }
      }
      return;
    }
    
    console.log("Enphase data received:", responseData);
    renderEnphaseData(responseData);
  } catch (error) {
    console.error("Error fetching Enphase data:", error);
    const enphaseEl = document.getElementById("enphase-solar");
    if (enphaseEl) {
      const productionEl = document.getElementById("enphase-production");
      if (productionEl) {
        productionEl.textContent = "Error";
        productionEl.parentElement.querySelector('.text-xs').textContent = "See console";
      }
    }
  }
  */
}

function renderEnphaseData(data) {
  const productionEl = document.getElementById("enphase-production");
  if (!productionEl) return;

  console.log("Rendering Enphase data:", data);
  
  // Handle new combined data structure
  const summary = data.summary || data;
  const lifetime = data.lifetime;
  const productionMeter = data.production_meter;
  
  // Try to get today's production from summary
  let todayProduction = null;
  
  // Check summary data (today/yesterday)
  if (summary) {
    if (summary.current_power) {
      // Summary has current_power (watts), convert to kWh for today
      // This is instantaneous power, not daily total
      const watts = summary.current_power || 0;
      productionEl.textContent = `${(watts / 1000).toFixed(2)} kW`;
      productionEl.parentElement.querySelector('.text-xs').textContent = "Current production";
      todayProduction = { watts, isCurrent: true };
    } else if (summary.energy_today) {
      // energy_today is in watt-hours
      const kwh = (summary.energy_today / 1000).toFixed(1);
      productionEl.textContent = `${kwh} kWh`;
      productionEl.parentElement.querySelector('.text-xs').textContent = "Today's production";
      todayProduction = { kwh: parseFloat(kwh) };
    } else if (summary.production && Array.isArray(summary.production)) {
      // Get most recent production entry
      const latest = summary.production[summary.production.length - 1];
      if (latest && latest.wh_del) {
        const kwh = (latest.wh_del / 1000).toFixed(1);
        productionEl.textContent = `${kwh} kWh`;
        productionEl.parentElement.querySelector('.text-xs').textContent = "Latest production";
        todayProduction = { kwh: parseFloat(kwh) };
      }
    }
  }
  
  // If no summary data, try lifetime data
  if (!todayProduction && lifetime) {
    if (lifetime.production && Array.isArray(lifetime.production)) {
      // Get most recent lifetime entry
      const latest = lifetime.production[lifetime.production.length - 1];
      if (latest && latest.wh_del) {
        const kwh = (latest.wh_del / 1000).toFixed(1);
        productionEl.textContent = `${kwh} kWh`;
        productionEl.parentElement.querySelector('.text-xs').textContent = "Latest production";
        todayProduction = { kwh: parseFloat(kwh) };
      }
    }
  }
  
  // If still no data, show "No data"
  if (!todayProduction) {
    productionEl.textContent = "No data";
    productionEl.parentElement.querySelector('.text-xs').textContent = "Check system connection";
  }
  
  // TODO: Add chart rendering for lifetime/production_meter data if available
  // This would show historical production over time
}

// ===== GOOGLE SHEET DISPLAY =====
let googleSheetRefreshInterval = null;
const GOOGLE_SHEET_REFRESH_INTERVAL = 30000; // Refresh every 30 seconds

function setupSpreadsheetUpload() {
  // Google Sheet form
  const googleForm = document.getElementById("google-sheet-form");
  const googleUrlInput = document.getElementById("google-sheet-url");
  const formContainer = document.getElementById("google-sheet-form-container");
  
  if (googleForm && googleUrlInput) {
    googleForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      pauseRotation();

      const url = googleUrlInput.value.trim();
      if (!url) {
        alert("Please enter a Google Sheet URL");
        resumeRotation();
        return;
      }

      try {
        await loadGoogleSheet(url);
        
        // Save URL to localStorage for persistence
        localStorage.setItem('googleSheetUrl', url);
        
        // Hide the form after successful load
        if (formContainer) {
          formContainer.style.display = 'none';
        }
        
        // Show the add sheet button
        const addButtonContainer = document.getElementById("add-sheet-button-container");
        if (addButtonContainer) {
          addButtonContainer.classList.remove("hidden");
        }
      } catch (error) {
        console.error("Error loading Google Sheet:", error);
        alert(`Error loading Google Sheet: ${error.message}`);
      } finally {
        resumeRotation();
      }
    });
  }
}

async function loadGoogleSheet(url, isAutoRefresh = false) {
  // Parse Google Sheets URL to extract sheet ID and GID
  // Format: https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit#gid={GID}
  // Or: https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit?usp=sharing
  // Or: https://docs.google.com/spreadsheets/d/{SHEET_ID}
  
  let sheetId = null;
  let gid = '0'; // Default to first sheet
  
  // Extract sheet ID
  const sheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (sheetIdMatch) {
    sheetId = sheetIdMatch[1];
  } else {
    throw new Error("Invalid Google Sheets URL. Please use a URL like: https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit");
  }
  
  // Extract GID if present
  const gidMatch = url.match(/[#&]gid=(\d+)/);
  if (gidMatch) {
    gid = gidMatch[1];
  }
  
  // Try to load as CSV (works for publicly shared sheets)
  // Google Sheets CSV export URL format
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  
  try {
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      // If CSV export fails, try HTML export
      throw new Error(`Failed to fetch sheet. Make sure the Google Sheet is shared publicly (Anyone with the link can view).`);
    }
    
    const csvText = await response.text();
    
    // Parse CSV to array
    const csvData = parseCSV(csvText);
    
    // Display the spreadsheet
    displaySpreadsheet(csvData);
    
    // Start auto-refresh if not already running
    startGoogleSheetAutoRefresh(url);
    
    if (!localStorage.getItem('googleSheetUrl')) {
      // Only show alert on first load, not on auto-refresh
      alert("Google Sheet loaded successfully!");
    }
  } catch (error) {
    if (error.message.includes("publicly shared")) {
      throw error;
    }
    throw new Error(`Failed to load Google Sheet. Make sure the sheet is shared publicly (Anyone with the link can view). Error: ${error.message}`);
  }
}

function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    const row = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        if (inQuotes && line[j + 1] === '"') {
          // Escaped quote
          current += '"';
          j++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        row.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add last field
    row.push(current);
    result.push(row);
  }
  
  return result;
}

function displaySpreadsheet(data) {
  const container = document.getElementById("spreadsheet-container");
  if (!container) return;

  if (!data || data.length === 0) {
    container.innerHTML = '<p class="text-slate-400 text-center py-8 text-sm">No data found in spreadsheet</p>';
    return;
  }

  // Find max columns to ensure consistent table structure
  const maxCols = Math.max(...data.map(row => row.length));
  
  // Create table with better styling
  let html = '<div class="overflow-x-auto"><table class="w-full border-collapse bg-slate-800/50 text-sm spreadsheet-table">';
  
  data.forEach((row, rowIndex) => {
    html += '<tr>';
    for (let colIndex = 0; colIndex < maxCols; colIndex++) {
      const cellValue = row[colIndex] !== null && row[colIndex] !== undefined ? String(row[colIndex]) : '';
      const isHeader = rowIndex === 0;
      const cellClass = isHeader 
        ? 'bg-slate-700/70 font-semibold text-slate-100 px-3 py-2 border border-slate-600 sticky top-0 z-10'
        : 'px-3 py-2 border border-slate-600 text-slate-300 bg-slate-800/30 hover:bg-slate-800/50';
      
      html += `<td class="${cellClass}">${escapeHtml(cellValue)}</td>`;
    }
    html += '</tr>';
  });
  
  html += '</table></div>';
  container.innerHTML = html;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function setupAddSheetButton() {
  const addButton = document.getElementById("add-sheet-button");
  const formContainer = document.getElementById("google-sheet-form-container");
  const addButtonContainer = document.getElementById("add-sheet-button-container");
  
  if (addButton && formContainer && addButtonContainer) {
    addButton.addEventListener("click", () => {
      // Show the form again
      formContainer.style.display = 'block';
      // Clear the input and localStorage
      const urlInput = document.getElementById("google-sheet-url");
      if (urlInput) {
        urlInput.value = '';
        urlInput.focus();
      }
      // Clear saved URL so they can enter a new one
      localStorage.removeItem('googleSheetUrl');
      // Stop auto-refresh
      stopGoogleSheetAutoRefresh();
      // Hide the add button
      addButtonContainer.classList.add("hidden");
    });
  }
}

function startGoogleSheetAutoRefresh(url) {
  // Clear any existing interval
  if (googleSheetRefreshInterval) {
    clearInterval(googleSheetRefreshInterval);
  }
  
  // Set up auto-refresh
  googleSheetRefreshInterval = setInterval(async () => {
    try {
      await loadGoogleSheet(url, true); // Pass true to indicate it's an auto-refresh
    } catch (error) {
      console.error("Error auto-refreshing Google Sheet:", error);
      // Don't show alerts on auto-refresh failures, just log them
    }
  }, GOOGLE_SHEET_REFRESH_INTERVAL);
}

function stopGoogleSheetAutoRefresh() {
  if (googleSheetRefreshInterval) {
    clearInterval(googleSheetRefreshInterval);
    googleSheetRefreshInterval = null;
  }
}

async function loadSavedGoogleSheet() {
  const savedUrl = localStorage.getItem('googleSheetUrl');
  if (!savedUrl) return;
  
  try {
    await loadGoogleSheet(savedUrl);
    
    // Start auto-refresh for saved sheet
    startGoogleSheetAutoRefresh(savedUrl);
    
    // Hide the form and show the add button
    const formContainer = document.getElementById("google-sheet-form-container");
    const addButtonContainer = document.getElementById("add-sheet-button-container");
    const urlInput = document.getElementById("google-sheet-url");
    
    if (formContainer) {
      formContainer.style.display = 'none';
    }
    if (addButtonContainer) {
      addButtonContainer.classList.remove("hidden");
    }
    if (urlInput) {
      urlInput.value = savedUrl; // Keep the URL in the input for reference
    }
  } catch (error) {
    console.error("Error loading saved Google Sheet:", error);
    // If loading fails, clear the saved URL and show the form
    localStorage.removeItem('googleSheetUrl');
    stopGoogleSheetAutoRefresh();
    const formContainer = document.getElementById("google-sheet-form-container");
    if (formContainer) {
      formContainer.style.display = 'block';
    }
  }
}

// ===== ENERGY UPLOAD (DISABLED) =====
function setupEnergyUpload() {
  const form = document.getElementById("energy-upload-form");
  const fileInput = document.getElementById("energy-csv-input");
  if (!form || !fileInput) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    pauseRotation();

    const file = fileInput.files[0];
    if (!file) {
      alert("Please select a CSV file");
      resumeRotation();
      return;
    }

    try {
      // Read file as text
      const text = await file.text();
      
      // Send to API
      const res = await fetch("/api/energy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvData: text }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await res.json();
      console.log("Upload result:", result);
      alert(`Successfully imported ${result.count} energy records!`);
      
      // Small delay to ensure database is updated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh energy data
      await fetchEnergyData();
      
      // Clear file input
      fileInput.value = "";
    } catch (error) {
      console.error("Error uploading energy data:", error);
      alert(`Error: ${error.message}`);
    } finally {
      resumeRotation();
    }
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
    renderTodayFocus(); // Update focus when projects change
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
  setupSpreadsheetUpload();
  setupAddSheetButton();
  loadSavedGoogleSheet(); // Load saved Google Sheet if available
  initSlides();
  setupNavButtons();
  setupMobileMenu();
  initVoiceCommands();
  setupUserActivityDetection();
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

