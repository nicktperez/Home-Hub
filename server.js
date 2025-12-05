const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 8000;

const dataDir = path.join(__dirname, "data");
const projectsFile = path.join(dataDir, "projects.json");

app.use(express.json());
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
  const { title } = req.body || {};
  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }

  const projects = readProjects();
  const newProject = {
    id: Date.now().toString(),
    title: title.trim(),
    done: false,
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

  const updated = { ...projects[idx] };
  if (typeof updates.title === "string") {
    updated.title = updates.title.trim();
  }
  if (typeof updates.done === "boolean") {
    updated.done = updates.done;
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

