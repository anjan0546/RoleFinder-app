const API = "http://localhost:5000";
let isLogin = false;

// INIT
document.addEventListener("DOMContentLoaded", () => {

  if (localStorage.getItem("loggedIn") === "true") {
    showJobs();
  }

  document.getElementById("authBtn").onclick = handleAuth;
  document.getElementById("toggleLink").onclick = toggleAuth;
  document.getElementById("logoutBtn").onclick = logout;
  document.getElementById("matchBtn").onclick = matchJobs;
  document.getElementById("backBtn").onclick = goBack;
  document.getElementById("themeToggle").onclick = toggleTheme;

  setupSuggestions();
});

// ================= AUTH =================
function toggleAuth() {
  isLogin = !isLogin;

  document.getElementById("formTitle").innerText = isLogin ? "Login" : "Signup";
  document.getElementById("authBtn").innerText = isLogin ? "Login" : "Signup";
}

async function handleAuth() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const endpoint = isLogin ? "/login" : "/signup";

  const res = await fetch(API + endpoint, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  toast(data.message);

  if (data.message === "Login successful") {
    localStorage.setItem("loggedIn", "true");
    showJobs();
  }
}

function logout() {
  localStorage.removeItem("loggedIn");
  location.reload();
}

function showJobs() {
  document.getElementById("authSection").style.display = "none";
  document.getElementById("jobSection").style.display = "block";
}

// ================= THEME =================
function toggleTheme() {
  document.body.classList.toggle("light-mode");
}

// ================= JOB MATCH =================
const jobs = [
  { title: "Frontend Developer", skills: ["html","css","javascript","react"] },
  { title: "Backend Developer", skills: ["nodejs","mongodb","express"] },
  { title: "Full Stack Developer", skills: ["html","css","javascript","nodejs"] },
  { title: "Android Developer", skills: ["java","kotlin","android"] },
  { title: "DevOps Engineer", skills: ["docker","kubernetes","aws"] },
  { title: "iOS Developer", skills: ["swift", "ios"] },
  { title: "Flutter Developer", skills: ["flutter", "dart"] },
   { title: "Data Analyst", skills: ["sql", "excel", "python"] },
  { title: "Data Scientist", skills: ["python", "pandas", "machine learning"] },
  { title: "Machine Learning Engineer", skills: ["python", "tensorflow", "pytorch"] },
  { title: "DevOps Engineer", skills: ["docker", "kubernetes", "aws"] },
  { title: "Cloud Engineer", skills: ["aws", "azure", "gcp"] },
   { title: "Cybersecurity Analyst", skills: ["networking", "security", "linux"] },
     { title: "UI/UX Designer", skills: ["figma", "design", "prototyping"] },
       { title: "QA Engineer", skills: ["testing", "selenium", "automation"] },
       { title: "AI Engineer", skills: ["python", "ai", "nlp"] },
  { title: "Blockchain Developer", skills: ["solidity", "web3", "ethereum"] }

];

function matchJobs() {
  let input = document.getElementById("skillsInput").value;
  let results = document.getElementById("results");
  let backBtn = document.getElementById("backBtn");

  if (!input) return alert("Enter skills");

  backBtn.style.display = "inline-block";
  results.innerHTML = "<h3>🎯 Your Matches</h3>";

  let userSkills = input.toLowerCase().split(",").map(s => s.trim());

  let matched = jobs.map(job => {
    let count = job.skills.filter(skill =>
      userSkills.some(u => skill.includes(u) || u.includes(skill))
    ).length;

    let percent = Math.round((count / job.skills.length) * 100);

    return { ...job, match: percent };
  });

  matched = matched.filter(j => j.match > 0).sort((a,b)=>b.match-a.match);

  if (matched.length === 0) {
    results.innerHTML += "<p>No matches 😢</p>";
    return;
  }

  matched.forEach((job,i) => {

    let emoji = job.match >= 75 ? "😄" : job.match >= 40 ? "😐" : "😢";
    let best = i === 0 ? "⭐ Best Match" : "";

    let div = document.createElement("div");
    div.className = "job-card";

    div.innerHTML = `
      <h3>${job.title} ${best}</h3>
      <p>${job.skills.join(", ")}</p>
      <p>${job.match}% ${emoji}</p>

      <div class="progress-bar">
        <div class="progress-fill" style="width:${job.match}%"></div>
      </div>
    `;

    let fill = div.querySelector(".progress-fill");

    if (job.match >= 75) fill.style.background = "lime";
    else if (job.match >= 40) fill.style.background = "orange";
    else fill.style.background = "red";

    results.appendChild(div);
  });
}

// ================= BACK =================
function goBack() {
  document.getElementById("results").innerHTML = "";
  document.getElementById("backBtn").style.display = "none";
}

// ================= TOAST =================
function toast(msg) {
  let t = document.getElementById("toast");
  t.innerText = msg;
  t.style.display = "block";

  setTimeout(()=> t.style.display="none", 2000);
}

// ================= SUGGESTIONS =================
function setupSuggestions() {
  const skills = ["html","css","javascript","nodejs","java","aws","docker"];

  const input = document.getElementById("skillsInput");
  const box = document.getElementById("suggestions");

  input.addEventListener("input", () => {
    box.innerHTML = "";

    let val = input.value.toLowerCase();
    if (!val) return;

    skills.filter(s => s.includes(val)).forEach(skill => {

      let d = document.createElement("div");
      d.className = "suggestion-item";
      d.innerText = skill;

      d.onclick = () => {
        let arr = input.value.split(",").map(x=>x.trim());
        if (!arr.includes(skill)) arr.push(skill);
        input.value = arr.join(", ");
        box.innerHTML = "";
      };

      box.appendChild(d);
    });
  });
}