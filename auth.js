// SMARTGOAL AUTH — Cloudflare Worker bilan kirish va ro‘yxatdan o‘tish

const AUTH_API = "https://smart-goal.hyuhyu3268-4d9.workers.dev";
const AUTH_TOKEN_KEY = "sg_auth_token";

let authMode = "login";
let authBusy = false;

// Auth oynasi uchun dizayn
const authStyle = document.createElement("style");
authStyle.textContent = `
  #auth-screen {
    position: fixed; inset: 0; z-index: 9999;
    display: grid; place-items: center;
    padding: 20px; background: var(--bg, #f8f8f5);
    color: var(--text, #252923); font-family: "DM Sans", sans-serif;
  }
  .auth-card {
    width: 100%; max-width: 420px; padding: 34px;
    background: var(--surface, #fff);
    border: 1px solid var(--border, #e9ebe5);
    border-radius: 16px; box-shadow: 0 15px 50px #0000000d;
  }
  .auth-brand { text-align: center; margin-bottom: 26px; }
  .auth-logo {
    width: 48px; height: 48px; margin: 0 auto 12px;
    display: grid; place-items: center; border-radius: 14px;
    background: var(--green, #426b52); color: white;
    font-size: 25px; font-weight: 800;
  }
  .auth-brand h1 { font-size: 25px; margin: 0 0 7px; }
  .auth-brand p { color: var(--muted); font-size: 12px; margin: 0; }
  .auth-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 5px;
    padding: 4px; border-radius: 8px; background: var(--surface-2); margin-bottom: 22px; }
  .auth-tabs button {
    border: 0; border-radius: 6px; padding: 10px 5px;
    background: transparent; color: var(--muted); cursor: pointer;
    font: inherit; font-size: 12px;
  }
  .auth-tabs button.active {
    color: var(--text); background: var(--surface); font-weight: 700;
    box-shadow: 0 2px 8px #0000000a;
  }
  .auth-field { margin-bottom: 15px; }
  .auth-field label { display: block; font-size: 11px; font-weight: 700; margin-bottom: 7px; }
  .auth-field input {
    width: 100%; padding: 12px; border-radius: 7px;
    border: 1px solid var(--border); background: var(--surface);
    color: var(--text); font: inherit; font-size: 13px; outline: none;
  }
  .auth-field input:focus { border-color: var(--green); }
  .auth-submit {
    width: 100%; border: 0; border-radius: 7px; padding: 13px;
    background: var(--green, #426b52); color: white;
    font: inherit; font-size: 13px; font-weight: 700; cursor: pointer;
    margin-top: 5px;
  }
  .auth-submit:disabled { opacity: .6; cursor: wait; }
  .auth-error {
    display: none; padding: 10px 12px; border-radius: 7px;
    background: var(--red, #f8e9e5); color: #b65d50;
    font-size: 11px; line-height: 1.5; margin-bottom: 14px;
  }
  .auth-footer { text-align: center; color: var(--muted); font-size: 10px; margin-top: 20px; }
  .auth-logout {
    border: 1px solid var(--border); background: var(--surface);
    color: var(--text); border-radius: 6px; padding: 8px 11px;
    font: inherit; font-size: 11px; cursor: pointer;
  }
  @media(max-width: 460px) {
    .auth-card { padding: 25px 20px; }
  }
`;
document.head.appendChild(authStyle);

// Auth oynasini yaratish
const authScreen = document.createElement("div");
authScreen.id = "auth-screen";
authScreen.style.display = "none";
document.body.appendChild(authScreen);

function showAuthScreen() {
  document.querySelector(".app").style.display = "none";
  authScreen.style.display = "grid";
  drawAuthForm();
}

function drawAuthForm(errorMessage = "") {
  const isRegister = authMode === "register";

  authScreen.innerHTML = `
    <div class="auth-card">
      <div class="auth-brand">
        <div class="auth-logo">S</div>
        <h1>SmartGoal</h1>
        <p>Maqsadlaring sari aqlli qadam</p>
      </div>

      <div class="auth-tabs">
        <button type="button" class="${!isRegister ? "active" : ""}"
          onclick="switchAuthMode('login')">Kirish</button>
        <button type="button" class="${isRegister ? "active" : ""}"
          onclick="switchAuthMode('register')">Ro‘yxatdan o‘tish</button>
      </div>

      <div class="auth-error" id="auth-error"
        style="display:${errorMessage ? "block" : "none"}">${escapeAuthText(errorMessage)}</div>

      <form id="auth-form">
        ${isRegister ? `
          <div class="auth-field">
            <label for="auth-name">Ismingiz</label>
            <input id="auth-name" name="name" type="text"
              placeholder="Ismingizni kiriting" required minlength="2" maxlength="60">
          </div>
        ` : ""}

        <div class="auth-field">
          <label for="auth-email">Email manzil</label>
          <input id="auth-email" name="email" type="email"
            placeholder="example@gmail.com" required autocomplete="email">
        </div>

        <div class="auth-field">
          <label for="auth-password">Parol</label>
          <input id="auth-password" name="password" type="password"
            placeholder="Kamida 8 ta belgi" required minlength="8"
            autocomplete="${isRegister ? "new-password" : "current-password"}">
        </div>

        <button class="auth-submit" id="auth-submit" type="submit">
          ${isRegister ? "Hisob yaratish" : "Tizimga kirish"}
        </button>
      </form>

      <div class="auth-footer">
        SmartGoal — maqsadlaringiz sari har kuni bir qadam.
      </div>
    </div>
  `;

  document.getElementById("auth-form").addEventListener("submit", submitAuth);
}

function escapeAuthText(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  }[char]));
}

function switchAuthMode(mode) {
  authMode = mode;
  drawAuthForm();
}

async function submitAuth(event) {
  event.preventDefault();
  if (authBusy) return;

  const form = new FormData(event.target);
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const name = String(form.get("name") || "").trim();

  if (password.length < 8) {
    drawAuthForm("Parol kamida 8 ta belgidan iborat bo‘lishi kerak.");
    return;
  }

  if (authMode === "register" && name.length < 2) {
    drawAuthForm("Ism kamida 2 ta belgidan iborat bo‘lishi kerak.");
    return;
  }

  const button = document.getElementById("auth-submit");
  authBusy = true;
  button.disabled = true;
  button.textContent = "Kuting...";

  try {
    const endpoint = authMode === "register" ? "/api/register" : "/api/login";
    const payload = authMode === "register"
      ? { name, email, password }
      : { email, password };

    const response = await fetch(AUTH_API + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.success || !result.token) {
      throw new Error(result.message || "Ma’lumotlarni tekshirib qayta urinib ko‘ring.");
    }

    localStorage.setItem(AUTH_TOKEN_KEY, result.token);
    openSmartGoal(result.user);

  } catch (error) {
    drawAuthForm(error.message || "Server bilan bog‘lanishda xatolik yuz berdi.");
  } finally {
    authBusy = false;
  }
}

// Serverdagi foydalanuvchini tekshirish
async function checkAuth() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (!token) {
    showAuthScreen();
    return;
  }

  try {
    const response = await fetch(AUTH_API + "/api/me", {
      headers: { "Authorization": "Bearer " + token }
    });

    const result = await response.json();

    if (!response.ok || !result.success || !result.user) {
      throw new Error("Sessiya tugagan");
    }

    openSmartGoal(result.user);
  } catch {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    showAuthScreen();
  }
}

// Ilovani foydalanuvchi bilan ochish
function openSmartGoal(user) {
  authScreen.style.display = "none";
  document.querySelector(".app").style.display = "";

  const userName = user?.name || user?.email || "Foydalanuvchi";
  const profileName = document.querySelector(".profile-info strong");
  const avatar = document.querySelector(".profile-mini .avatar");
  const smallAvatar = document.querySelector(".small-avatar");

  if (profileName) profileName.textContent = userName;
  if (avatar) avatar.textContent = userName.charAt(0).toUpperCase();
  if (smallAvatar) smallAvatar.textContent = userName.charAt(0).toUpperCase();

  // Kirgan foydalanuvchi uchun chiqish tugmasi
  const topActions = document.querySelector(".top-actions");
  if (topActions && !document.getElementById("auth-logout")) {
    const logoutButton = document.createElement("button");
    logoutButton.id = "auth-logout";
    logoutButton.className = "auth-logout";
    logoutButton.textContent = "Chiqish";
    logoutButton.addEventListener("click", logoutSmartGoal);
    topActions.appendChild(logoutButton);
  }
 
  if (typeof render === "function") render();
}

// Hisobdan chiqish
async function logoutSmartGoal() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  try {
    await fetch(AUTH_API + "/api/logout", {
      method: "POST",
      headers: { "Authorization": "Bearer " + token }
    });
  } catch (error) {
    console.warn("Serverdan chiqish so‘rovi bajarilmadi:", error);
  }

  localStorage.removeItem(AUTH_TOKEN_KEY);
  authMode = "login";
  document.getElementById("auth-logout")?.remove();
  showAuthScreen();
}

// Sahifa yuklangach sessiyani tekshirish
checkAuth();