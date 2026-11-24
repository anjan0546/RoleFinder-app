// ============================================================
// script.js — RoleFinder Dashboard (JWT-authenticated)
// ============================================================

const API = "http://localhost:5000";

// ===================== AUTH GUARD =====================
const token = localStorage.getItem("rf_token");
if (!token) {
  window.location.href = "auth.html";
}

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", async () => {

  // Set user info in nav
  const user = JSON.parse(localStorage.getItem("rf_user") || "{}");
  if (user.email) {
    document.getElementById("userEmail").textContent = user.email;
    document.getElementById("userAvatar").textContent = user.email[0].toUpperCase();
  }

  // Load saved theme
  if (localStorage.getItem("rf_theme") === "light") {
    document.body.classList.add("light-mode");
    setThemeIcon(true);
  }

  // Load saved skills
  const saved = localStorage.getItem("rf_skills");
  if (saved) {
    document.getElementById("skillsInput").value = saved;
    renderChips(saved.split(",").map(s => s.trim()).filter(Boolean));
  }

  // Event listeners
  document.getElementById("logoutBtn").onclick    = logout;
  document.getElementById("themeToggle").onclick  = toggleTheme;
  document.getElementById("matchBtn").onclick     = matchJobs;
  document.getElementById("backBtn").onclick      = clearResults;

  setupSuggestions();

  // Verify token against server (optional live check)
  try {
    const res  = await fetch(`${API}/api/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) logout(); // token invalid/expired
  } catch {
    // Server offline — still let user use local matching
  }
});

// ===================== LOGOUT =====================
function logout() {
  localStorage.removeItem("rf_token");
  localStorage.removeItem("rf_user");
  window.location.href = "auth.html";
}

// ===================== THEME =====================
function toggleTheme() {
  const isLight = document.body.classList.toggle("light-mode");
  localStorage.setItem("rf_theme", isLight ? "light" : "dark");
  setThemeIcon(isLight);
}

function setThemeIcon(isLight) {
  const icon = document.getElementById("themeIcon");
  icon.innerHTML = isLight
    ? `<circle cx="10" cy="10" r="4" stroke="currentColor" stroke-width="1.5"/>
       <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41"
             stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`
    : `<path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
            stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`;
}

// ===================== JOB DATA =====================
const jobs = [
  { title: "Frontend Developer",          icon: "🖥️",  skills: ["html","css","javascript","react"],              gradient: ["#6366f1","#8b5cf6"] },
  { title: "Backend Developer",           icon: "⚙️",  skills: ["nodejs","mongodb","express"],                   gradient: ["#0ea5e9","#6366f1"] },
  { title: "Full Stack Developer",        icon: "🔧",  skills: ["html","css","javascript","nodejs"],             gradient: ["#8b5cf6","#ec4899"] },
  { title: "Android Developer",           icon: "🤖",  skills: ["java","kotlin","android"],                      gradient: ["#10b981","#0ea5e9"] },
  { title: "iOS Developer",               icon: "🍎",  skills: ["swift","ios"],                                  gradient: ["#f59e0b","#ef4444"] },
  { title: "Flutter Developer",           icon: "💙",  skills: ["flutter","dart"],                               gradient: ["#06b6d4","#6366f1"] },
  { title: "Data Analyst",                icon: "📊",  skills: ["sql","excel","python"],                         gradient: ["#f59e0b","#ef4444"] },
  { title: "Data Scientist",              icon: "🧪",  skills: ["python","pandas","machine learning"],           gradient: ["#10b981","#6366f1"] },
  { title: "Machine Learning Engineer",   icon: "🤖",  skills: ["python","tensorflow","pytorch"],               gradient: ["#8b5cf6","#06b6d4"] },
  { title: "Cloud Engineer",              icon: "☁️",  skills: ["aws","azure","gcp"],                           gradient: ["#0ea5e9","#10b981"] },
  { title: "Cybersecurity Analyst",       icon: "🔒",  skills: ["networking","security","linux"],               gradient: ["#ef4444","#f59e0b"] },
  { title: "UI/UX Designer",              icon: "🎨",  skills: ["figma","design","prototyping"],                gradient: ["#ec4899","#8b5cf6"] },
  { title: "QA Engineer",                 icon: "✅",  skills: ["testing","selenium","automation"],             gradient: ["#10b981","#f59e0b"] },
  { title: "AI Engineer",                 icon: "🧠",  skills: ["python","ai","nlp"],                          gradient: ["#6366f1","#06b6d4"] },
  { title: "Blockchain Developer",        icon: "⛓️",  skills: ["solidity","web3","ethereum"],                 gradient: ["#f59e0b","#8b5cf6"] },
  { title: "DevOps Engineer",             icon: "🚀",  skills: ["docker","kubernetes","aws"],                  gradient: ["#0ea5e9","#10b981"] }
];

// ===================== CHIP STATE =====================
let activeChips = new Set();

function renderChips(skillsArr) {
  activeChips = new Set(skillsArr.filter(Boolean));
  const row = document.getElementById("chipRow");
  row.innerHTML = "";
  activeChips.forEach(skill => {
    const chip = document.createElement("span");
    chip.className = "skill-chip";
    chip.innerHTML = `${skill} <span class="chip-remove" onclick="removeChip('${skill}')">×</span>`;
    row.appendChild(chip);
  });
}

function removeChip(skill) {
  activeChips.delete(skill);
  const input = document.getElementById("skillsInput");
  input.value = [...activeChips].join(", ");
  renderChips([...activeChips]);
}

// ===================== SUGGESTIONS =====================
const allSkills = [
  "html","css","javascript","typescript","react","vue","angular","nextjs",
  "nodejs","express","mongodb","postgresql","mysql","redis",
  "python","java","kotlin","swift","flutter","dart","go","rust","c++","php",
  "docker","kubernetes","aws","azure","gcp","linux","git",
  "figma","design","prototyping","tensorflow","pytorch","pandas",
  "solidity","web3","ethereum","sql","excel","selenium","testing","automation",
  "android","ios","ai","nlp","machine learning","security","networking"
];

function setupSuggestions() {
  const input   = document.getElementById("skillsInput");
  const panel   = document.getElementById("suggestions");

  input.addEventListener("input", () => {
    const raw      = input.value;
    const parts    = raw.split(",");
    const lastPart = parts[parts.length - 1].trim().toLowerCase();

    panel.innerHTML = "";

    if (!lastPart) { panel.style.display = "none"; return; }

    const matches = allSkills.filter(s =>
      s.includes(lastPart) && !activeChips.has(s)
    ).slice(0, 6);

    if (matches.length === 0) { panel.style.display = "none"; return; }

    panel.style.display = "block";
    matches.forEach(skill => {
      const item = document.createElement("div");
      item.className = "suggestion-item";
      item.textContent = skill;
      item.onclick = () => {
        parts[parts.length - 1] = " " + skill;
        input.value = parts.join(",").trim().replace(/^,/, "");
        const newSkills = input.value.split(",").map(s => s.trim()).filter(Boolean);
        renderChips(newSkills);
        panel.style.display = "none";
        input.focus();
      };
      panel.appendChild(item);
    });
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-card")) {
      panel.style.display = "none";
    }
  });
}

// ===================== JOB MATCHING =====================
async function matchJobs() {
  const input      = document.getElementById("skillsInput").value;
  const resultsEl  = document.getElementById("results");
  const section    = document.getElementById("resultsSection");

  if (!input.trim()) {
    toast("⚠️ Please enter at least one skill");
    return;
  }

  // Save skills
  localStorage.setItem("rf_skills", input.trim());

  const userSkills = input.toLowerCase().split(",").map(s => s.trim()).filter(Boolean);
  renderChips(userSkills);

  // Try fetching from API (authenticated)
  let jobList = jobs;
  try {
    const res  = await fetch(`${API}/api/jobs`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) jobList = data.jobs;
  } catch {
    // offline fallback to local jobs array
  }

  // Compute matches
  let matched = jobList.map(job => {
    const jobSkills = job.skills.map(s => s.toLowerCase());
    const matched   = jobSkills.filter(skill =>
      userSkills.some(u => skill.includes(u) || u.includes(skill))
    );
    const pct = Math.round((matched.length / jobSkills.length) * 100);
    return { ...job, pct, matchedSkills: matched };
  })
  .filter(j => j.pct > 0)
  .sort((a, b) => b.pct - a.pct);

  section.style.display = "block";
  document.getElementById("resultsTitle").textContent =
    `${matched.length} Role${matched.length !== 1 ? "s" : ""} Matched ✨`;

  resultsEl.innerHTML = "";

  if (matched.length === 0) {
    resultsEl.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted);">
        <div style="font-size:48px; margin-bottom:16px;">😕</div>
        <p style="font-size:16px;">No roles matched. Try adding more skills!</p>
      </div>`;
    return;
  }

  matched.forEach((job, i) => {
    const isFirst    = i === 0;
    const badgeClass = job.pct >= 70 ? "badge-green" : job.pct >= 40 ? "badge-yellow" : "badge-red";
    const barColor   = job.pct >= 70 ? "#10b981" : job.pct >= 40 ? "#f59e0b" : "#ef4444";
    const gradA      = (job.gradient || ["#6366f1","#8b5cf6"])[0];
    const gradB      = (job.gradient || ["#6366f1","#8b5cf6"])[1];

    const skillTags = job.skills.map(skill => {
      const isMatched = job.matchedSkills && job.matchedSkills.includes(skill.toLowerCase());
      return `<span class="card-skill-tag ${isMatched ? "matched" : ""}">${skill}</span>`;
    }).join("");

    const card = document.createElement("div");
    card.className = "job-card";
    card.style.cssText = `--card-color-a:${gradA}; --card-color-b:${gradB}; animation-delay:${i * 0.06}s`;

    card.innerHTML = `
      <div class="card-top">
        <div class="card-title">${job.icon || "💼"} ${job.title}</div>
        <span class="card-match-badge ${badgeClass}">${job.pct}%</span>
      </div>
      <div class="card-skills">${skillTags}</div>
      <div class="progress-track">
        <div class="progress-fill" style="width:0%; background:${barColor};"></div>
      </div>
      <div class="card-footer">
        <span>${job.matchedSkills ? job.matchedSkills.length : 0}/${job.skills.length} skills matched</span>
        ${isFirst ? '<span class="best-badge">⭐ Best Match</span>' : ""}
      </div>
    `;

    resultsEl.appendChild(card);

    // Animate bar after render
    setTimeout(() => {
      card.querySelector(".progress-fill").style.width = `${job.pct}%`;
    }, 50 + i * 60);
  });

  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ===================== CLEAR =====================
function clearResults() {
  document.getElementById("results").innerHTML = "";
  document.getElementById("resultsSection").style.display = "none";
  document.getElementById("skillsInput").value = "";
  activeChips.clear();
  document.getElementById("chipRow").innerHTML = "";
  localStorage.removeItem("rf_skills");
}

// ===================== TOAST =====================
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("visible");
  setTimeout(() => el.classList.remove("visible"), 2800);
}
