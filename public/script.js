const SLIDE_INTERVAL_MS = 15000;

const slides = Array.from(document.querySelectorAll(".slide"));
let currentSlideIndex = 0;
let slideTimer = null;
let isManualScroll = false;
let scrollDebounce;

function scrollToSlide(index) {
  if (!slides.length) return;
  currentSlideIndex = index % slides.length;
  const targetTop = currentSlideIndex * window.innerHeight;
  window.scrollTo({ top: targetTop, behavior: "smooth" });
}

function startRotation() {
  if (slideTimer) clearInterval(slideTimer);
  slideTimer = setInterval(() => {
    scrollToSlide((currentSlideIndex + 1) % slides.length);
  }, SLIDE_INTERVAL_MS);
}

function alignCurrentSlide() {
  scrollToSlide(currentSlideIndex);
}

function syncCurrentSlideFromScroll() {
  const idx = Math.round(window.scrollY / window.innerHeight);
  if (!Number.isNaN(idx)) {
    currentSlideIndex = Math.max(0, Math.min(slides.length - 1, idx));
  }
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
  const li = document.createElement("li");
  li.className = "project-item";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = project.done;
  checkbox.addEventListener("change", async () => {
    await updateProject(project.id, { done: checkbox.checked });
    refresh();
  });

  const title = document.createElement("p");
  title.className = "project-title";
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
  return li;
}

async function renderProjects() {
  const listEl = document.getElementById("projects-list");
  if (!listEl) return;
  listEl.innerHTML = "";
  const projects = await fetchProjects();
  projects.forEach((project) => {
    const item = createProjectElement(project, renderProjects);
    listEl.appendChild(item);
  });
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
  startRotation();
  window.addEventListener("resize", alignCurrentSlide);
}

function setupNavButtons() {
  const buttons = document.querySelectorAll("[data-slide]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.slide);
      if (Number.isFinite(idx)) {
        scrollToSlide(idx);
        startRotation();
        isManualScroll = true;
        setTimeout(() => {
          isManualScroll = false;
        }, 800);
      }
    });
  });
}

function init() {
  renderToday();
  renderProjects();
  setupForm();
  initSlides();
  setupNavButtons();
  window.addEventListener("scroll", () => {
    isManualScroll = true;
    if (scrollDebounce) clearTimeout(scrollDebounce);
    scrollDebounce = setTimeout(() => {
      isManualScroll = false;
    }, 600);
    syncCurrentSlideFromScroll();
    startRotation();
  });
}

document.addEventListener("DOMContentLoaded", init);

