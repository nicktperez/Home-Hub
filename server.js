const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 8000;

const dataDir = path.join(__dirname, "data");
const projectsFile = path.join(dataDir, "projects.json");

app.use(express.json());
// Disable static caching to prevent stale assets during local use
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.use(express.static(path.join(__dirname, "public")));

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(projectsFile)) {
    fs.writeFileSync(projectsFile, "[]", "utf8");
  }
}

function readProjects() {
  ensureDataFile();
  const fileData = fs.readFileSync(projectsFile, "utf8");
  try {
    return JSON.parse(fileData);
  } catch (err) {
    console.error("Failed to parse projects file, resetting to []", err);
    fs.writeFileSync(projectsFile, "[]", "utf8");
    return [];
  }
}

function writeProjects(projects) {
  ensureDataFile();
  fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2), "utf8");
}

app.get("/api/projects", (req, res) => {
  const projects = readProjects();
  res.json(projects);
});

app.post("/api/projects", (req, res) => {
  const { title, note, progress, startDate, endDate } = req.body || {};
  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }

  const projects = readProjects();
  const now = new Date().toISOString();
  const cleanProgress =
    typeof progress === "number" && progress >= 0 && progress <= 100
      ? progress
      : 0;
  const newProject = {
    id: Date.now().toString(),
    title: title.trim(),
    done: false,
    status: "todo",
    updatedAt: now,
    note: typeof note === "string" ? note.trim() : "",
    progress: cleanProgress,
    startDate: typeof startDate === "string" ? startDate : "",
    endDate: typeof endDate === "string" ? endDate : "",
    updates: [],
  };
  projects.push(newProject);
  writeProjects(projects);
  res.status(201).json(newProject);
});

app.patch("/api/projects/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: "Project not found" });
  }

  const now = new Date().toISOString();
  const updated = { ...projects[idx] };
  if (typeof updates.title === "string") {
    updated.title = updates.title.trim();
    updated.updatedAt = now;
  }
  if (typeof updates.status === "string") {
    updated.status = updates.status;
    updated.done = updates.status === "done";
    updated.updatedAt = now;
  }
  if (typeof updates.done === "boolean") {
    updated.done = updates.done;
    if (!updates.status) {
      updated.status = updates.done ? "done" : updated.status === "done" ? "todo" : updated.status || "todo";
    }
    updated.updatedAt = now;
  }
  if (typeof updates.note === "string") {
    updated.note = updates.note.trim();
    updated.updatedAt = now;
  }
  if (typeof updates.progress === "number") {
    const p = Math.min(100, Math.max(0, updates.progress));
    updated.progress = p;
    updated.updatedAt = now;
  }
  if (typeof updates.startDate === "string") {
    updated.startDate = updates.startDate;
    updated.updatedAt = now;
  }
  if (typeof updates.endDate === "string") {
    updated.endDate = updates.endDate;
    updated.updatedAt = now;
  }
  if (Array.isArray(updates.updates)) {
    // Replace full updates log if provided.
    updated.updates = updates.updates;
    updated.updatedAt = now;
  }
  if (updates.appendUpdate && typeof updates.appendUpdate === "string") {
    updated.updates = updated.updates || [];
    updated.updates.push({ message: updates.appendUpdate.trim(), at: now });
    updated.updatedAt = now;
  }

  projects[idx] = updated;
  writeProjects(projects);
  res.json(updated);
});

app.delete("/api/projects/:id", (req, res) => {
  const { id } = req.params;
  const projects = readProjects();
  const newProjects = projects.filter((p) => p.id !== id);

  if (newProjects.length === projects.length) {
    return res.status(404).json({ error: "Project not found" });
  }

  writeProjects(newProjects);
  res.status(204).send();
});

app.listen(PORT, () => {
  ensureDataFile();
  console.log(`Family wall dashboard running at http://localhost:${PORT}`);
});

