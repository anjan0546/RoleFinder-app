// ============================================================
// auth.js — RoleFinder Authentication Logic
// ============================================================

const API = "http://localhost:5000";

// Redirect if already logged in
if (localStorage.getItem("rf_token")) {
  window.location.href = "index.html";
}

// ===================== TAB SWITCHER =====================
function switchTab(tab) {
  const loginForm  = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const loginTab   = document.getElementById("loginTab");
  const signupTab  = document.getElementById("signupTab");

  clearMessages();

  if (tab === "login") {
    loginForm.style.display  = "block";
    signupForm.style.display = "none";
    loginTab.classList.add("active");
    signupTab.classList.remove("active");
  } else {
    loginForm.style.display  = "none";
    signupForm.style.display = "block";
    signupTab.classList.add("active");
    loginTab.classList.remove("active");
  }
}

// ===================== PASSWORD VISIBILITY =====================
function togglePwd(id, btn) {
  const input = document.getElementById(id);
  const isHidden = input.type === "password";
  input.type = isHidden ? "text" : "password";
  btn.innerHTML = isHidden
    ? `<svg viewBox="0 0 20 20" fill="none"><path d="M3.98 8.223A10.477 10.477 0 001.934 10C3.226 13.17 6.388 15.5 10 15.5c1.113 0 2.18-.22 3.157-.62M6.53 6.53a4.5 4.5 0 016.001 6M9.75 9.75A2.25 2.25 0 0112 12M2 2l16 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`
    : `<svg viewBox="0 0 20 20" fill="none"><path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/></svg>`;
}

// ===================== PASSWORD STRENGTH =====================
document.getElementById("signupPassword").addEventListener("input", function () {
  const val    = this.value;
  const fill   = document.getElementById("strengthFill");
  const label  = document.getElementById("strengthLabel");
  let score    = 0;

  if (val.length >= 6)  score++;
  if (val.length >= 10) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  const levels = [
    { pct: "0%",   color: "",          text: "",           textColor: "" },
    { pct: "20%",  color: "#ef4444",   text: "Very Weak",  textColor: "#ef4444" },
    { pct: "40%",  color: "#f59e0b",   text: "Weak",       textColor: "#f59e0b" },
    { pct: "60%",  color: "#eab308",   text: "Fair",       textColor: "#eab308" },
    { pct: "80%",  color: "#84cc16",   text: "Strong",     textColor: "#84cc16" },
    { pct: "100%", color: "#10b981",   text: "Very Strong",textColor: "#10b981" }
  ];

  const lvl = levels[score] || levels[0];
  fill.style.width      = lvl.pct;
  fill.style.background = lvl.color;
  label.textContent     = lvl.text;
  label.style.color     = lvl.textColor;
});

// ===================== LOGIN =====================
async function handleLogin(e) {
  e.preventDefault();
  const btn      = document.getElementById("loginBtn");
  const errEl    = document.getElementById("loginError");
  const sucEl    = document.getElementById("loginSuccess");
  const email    = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  clearMessages();
  setLoading(btn, true);

  try {
    const res  = await fetch(`${API}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("rf_token", data.token);
      localStorage.setItem("rf_user",  JSON.stringify(data.user));
      showSuccess(sucEl, data.message + " Redirecting…");
      setTimeout(() => { window.location.href = "index.html"; }, 1200);
    } else {
      showError(errEl, data.message || "Login failed.");
    }
  } catch {
    showError(errEl, "Cannot connect to server. Make sure the backend is running.");
  } finally {
    setLoading(btn, false);
  }
}

// ===================== SIGNUP =====================
async function handleSignup(e) {
  e.preventDefault();
  const btn      = document.getElementById("signupBtn");
  const errEl    = document.getElementById("signupError");
  const sucEl    = document.getElementById("signupSuccess");
  const email    = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;

  clearMessages();

  if (password.length < 6) {
    return showError(errEl, "Password must be at least 6 characters.");
  }

  setLoading(btn, true);

  try {
    const res  = await fetch(`${API}/api/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("rf_token", data.token);
      localStorage.setItem("rf_user",  JSON.stringify(data.user));
      showSuccess(sucEl, data.message + " Redirecting…");
      setTimeout(() => { window.location.href = "index.html"; }, 1200);
    } else {
      showError(errEl, data.message || "Signup failed.");
    }
  } catch {
    showError(errEl, "Cannot connect to server. Make sure the backend is running.");
  } finally {
    setLoading(btn, false);
  }
}

// ===================== HELPERS =====================
function setLoading(btn, loading) {
  btn.disabled                                               = loading;
  btn.querySelector(".btn-text").style.display               = loading ? "none" : "inline";
  btn.querySelector(".btn-spinner").style.display            = loading ? "block" : "none";
}

function showError(el, msg)   { el.textContent = "⚠️ " + msg; el.style.display = "block"; }
function showSuccess(el, msg) { el.textContent = "✅ " + msg; el.style.display = "block"; }

function clearMessages() {
  ["loginError","loginSuccess","signupError","signupSuccess"].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.style.display = "none"; el.textContent = ""; }
  });
}
