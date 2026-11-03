/* =========================================================
   SMARTGOAL — APPLICATION ENGINE
   Version 3.0 | Frontend-first | Local storage
========================================================= */

(() => {
  "use strict";

  /* -------------------- CONFIG -------------------- */

  const DATA_KEY = "smartgoal_v3_data";
  const SETTINGS_KEY = "smartgoal_v3_settings";
  const SESSION_KEY = "smartgoal_v3_session";

  const DEFAULT_SETTINGS = {
    language: "uz",
    theme: "light",
    colorTheme: "violet",
    difficulty: "auto",
    sound: false,
    reducedMotion: false
  };

  const PAGE_TITLES = {
    dashboard: "Bosh sahifa",
    goals: "Maqsadlarim",
    schedule: "Vazifalar",
    planner: "Rejalashtiruvchi",
    analytics: "Statistika",
    achievements: "Yutuqlarim",
    rewards: "Mukofotlar do‘koni",
    community: "Hamjamiyat",
    ai: "Smart AI",
    notifications: "Bildirishnomalar",
    settings: "Sozlamalar",
    profile: "Mening profilim"
  };

  const RANKS = [
    { level: 1, name: "Boshlovchi", xp: 0 },
    { level: 2, name: "Izlanuvchi", xp: 100 },
    { level: 3, name: "Harakatdagi", xp: 250 },
    { level: 4, name: "Intiluvchan", xp: 500 },
    { level: 5, name: "Tirishqoq", xp: 850 },
    { level: 6, name: "Mahoratli", xp: 1300 },
    { level: 7, name: "Strateg", xp: 1900 },
    { level: 8, name: "Yetakchi", xp: 2700 },
    { level: 9, name: "Usta", xp: 3700 },
    { level: 10, name: "Afsona", xp: 5000 }
  ];

  const STORE_ITEMS = [
    {
      id: "theme-ocean",
      name: "Ocean mavzusi",
      description: "Profilingiz va interfeysingiz uchun sokin ko‘k rang.",
      type: "theme",
      value: "ocean",
      price: 250,
      icon: "waves"
    },
    {
      id: "theme-emerald",
      name: "Emerald mavzusi",
      description: "Yashil va nafis ko‘rinish.",
      type: "theme",
      value: "emerald",
      price: 400,
      icon: "leaf"
    },
    {
      id: "theme-sunset",
      name: "Sunset mavzusi",
      description: "Iliq ranglardagi maxsus interfeys.",
      type: "theme",
      value: "sunset",
      price: 550,
      icon: "sunset"
    },
    {
      id: "theme-rose",
      name: "Rose mavzusi",
      description: "Nafis pushti ranglar uyg‘unligi.",
      type: "theme",
      value: "rose",
      price: 750,
      icon: "flower-2"
    },
    {
      id: "background-midnight",
      name: "Midnight fon",
      description: "Profil uchun qoramtir, maxsus fon.",
      type: "background",
      value: "midnight",
      price: 1200,
      icon: "moon-star"
    },
    {
      id: "background-galaxy",
      name: "Galaxy fon",
      description: "Maxsus kosmik profil foni.",
      type: "background",
      value: "galaxy",
      price: 2500,
      icon: "orbit"
    },
    {
      id: "background-royal",
      name: "Royal fon",
      description: "Noyob premium profil dizayni.",
      type: "background",
      value: "royal",
      price: 5000,
      icon: "crown"
    },
    {
      id: "badge-focus",
      name: "Focus badge",
      description: "Diqqat va intizom ramzi.",
      type: "badge",
      value: "focus",
      price: 900,
      icon: "crosshair"
    },
    {
      id: "badge-diamond",
      name: "Diamond badge",
      description: "Maxsus premium belgi.",
      type: "badge",
      value: "diamond",
      price: 3000,
      icon: "gem"
    },
    {
      id: "avatar-premium",
      name: "Premium avatar ramkasi",
      description: "Profil rasmingiz uchun maxsus ramka.",
      type: "avatar",
      value: "premium",
      price: 1800,
      icon: "frame"
    }
  ];

  const ACHIEVEMENTS = [
    {
      id: "first-task",
      name: "Birinchi qadam",
      description: "Birinchi vazifangizni bajaring.",
      icon: "flag",
      condition: data => data.tasks.some(task => task.completed)
    },
    {
      id: "five-tasks",
      name: "Harakat boshlandi",
      description: "5 ta vazifani bajaring.",
      icon: "list-checks",
      condition: data => data.tasks.filter(task => task.completed).length >= 5
    },
    {
      id: "ten-tasks",
      name: "Tinimsiz harakat",
      description: "10 ta vazifani bajaring.",
      icon: "zap",
      condition: data => data.tasks.filter(task => task.completed).length >= 10
    },
    {
      id: "first-goal",
      name: "Maqsad sari",
      description: "Birinchi maqsadingizni yakunlang.",
      icon: "target",
      condition: data => data.goals.some(goal => goal.progress >= 100)
    },
    {
      id: "three-goals",
      name: "Maqsadlar ustasi",
      description: "3 ta maqsadni yakunlang.",
      icon: "trophy",
      condition: data => data.goals.filter(goal => goal.progress >= 100).length >= 3
    },
    {
      id: "xp-500",
      name: "500 XP",
      description: "500 ochko to‘plang.",
      icon: "coins",
      condition: data => data.xp >= 500
    },
    {
      id: "xp-1000",
      name: "Minglik marrasi",
      description: "1000 ochko to‘plang.",
      icon: "gem",
      condition: data => data.xp >= 1000
    }
  ];

  /* -------------------- HELPERS -------------------- */

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const uid = () => (
    window.crypto && typeof window.crypto.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

  const safeJSON = (value, fallback) => {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  };

  const today = () => new Date().toISOString().slice(0, 10);

  const formatDate = value => {
    if (!value) return "Sana belgilanmagan";

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) return "Sana belgilanmagan";

    return date.toLocaleDateString(getLocale(), {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const getLocale = () => ({
    uz: "uz-UZ",
    ru: "ru-RU",
    en: "en-US"
  })[settings.language] || "uz-UZ";

  const formatNumber = value => new Intl.NumberFormat(getLocale()).format(value || 0);

  function icon(name, size = 18) {
    return `<i data-lucide="${escapeHTML(name)}" width="${size}" height="${size}"></i>`;
  }

  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  /* -------------------- STORAGE -------------------- */

  function createInitialData() {
    return {
      version: 3,
      profile: {
        name: "SmartGoal foydalanuvchisi",
        username: "",
        birthdate: "",
        age: null,
        bio: "",
        avatar: "",
        background: "default",
        avatarFrame: "default",
        createdAt: new Date().toISOString()
      },
      xp: 0,
      spentXP: 0,
      goals: [],
      tasks: [],
      activity: [],
      achievements: [],
      inventory: [],
      notifications: [
        {
          id: uid(),
          title: "SmartGoal’ga xush kelibsiz!",
          message: "Maqsadlaringizni belgilang va rivojlanishni boshlang.",
          date: new Date().toISOString(),
          read: false
        }
      ],
      memories: [],
      preferences: {
        difficulty: "auto"
      }
    };
  }

  function loadData() {
    const saved = safeJSON(localStorage.getItem(DATA_KEY), null);

    if (!saved || typeof saved !== "object") {
      return createInitialData();
    }

    const initial = createInitialData();

    return {
      ...initial,
      ...saved,
      profile: { ...initial.profile, ...(saved.profile || {}) },
      preferences: { ...initial.preferences, ...(saved.preferences || {}) },
      goals: Array.isArray(saved.goals) ? saved.goals : [],
      tasks: Array.isArray(saved.tasks) ? saved.tasks : [],
      activity: Array.isArray(saved.activity) ? saved.activity : [],
      achievements: Array.isArray(saved.achievements) ? saved.achievements : [],
      inventory: Array.isArray(saved.inventory) ? saved.inventory : [],
      notifications: Array.isArray(saved.notifications) ? saved.notifications : [],
      memories: Array.isArray(saved.memories) ? saved.memories : []
    };
  }

  function loadSettings() {
    const saved = safeJSON(localStorage.getItem(SETTINGS_KEY), {});
    return { ...DEFAULT_SETTINGS, ...(saved || {}) };
  }

  let data = loadData();
  let settings = loadSettings();
  let currentPage = "dashboard";
  let currentSettingsTab = "general";
  let toastTimeout = null;

  function saveData() {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("SmartGoal storage error:", error);
      showToast("Ma’lumotni saqlashda xatolik yuz berdi.", "error");
      return false;
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Settings storage error:", error);
    }
    applySettings();
  }

  /* -------------------- AGE AND DIFFICULTY -------------------- */

  function calculateAge(birthdate) {
    if (!birthdate) return null;

    const birth = new Date(`${birthdate}T00:00:00`);
    const now = new Date();

    if (Number.isNaN(birth.getTime()) || birth > now) return null;

    let age = now.getFullYear() - birth.getFullYear();

    const birthdayNotReached =
      now.getMonth() < birth.getMonth() ||
      (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());

    if (birthdayNotReached) age--;

    return age >= 0 && age <= 120 ? age : null;
  }

  function getDifficulty() {
    if (settings.difficulty !== "auto") return settings.difficulty;

    const age = data.profile.age;

    if (age === null || age === undefined) return "adult";
    if (age <= 11) return "junior";
    if (age <= 17) return "senior";
    return "adult";
  }

  const UI_TEXT = {
    junior: {
      welcome: "Bugun nimaga erishamiz?",
      description: "Kichik qadamlar katta natijalarga olib boradi.",
      addTask: "Vazifa qo‘shish",
      addGoal: "Maqsad qo‘shish",
      emptyTasks: "Hali vazifalar yo‘q. Birinchi vazifangizni qo‘shing!",
      emptyGoals: "Hali maqsad yo‘q. O‘z maqsadingizni belgilang!"
    },
    senior: {
      welcome: "Bugungi rejalaringizga xush kelibsiz",
      description: "Vaqtingizni samarali boshqaring va natijalarni kuzating.",
      addTask: "Yangi vazifa",
      addGoal: "Yangi maqsad",
      emptyTasks: "Hozircha vazifalar mavjud emas.",
      emptyGoals: "Hozircha maqsadlar mavjud emas."
    },
    adult: {
      welcome: "Rivojlanishingizni boshqarishni davom ettiring",
      description: "Ustuvor vazifalarni belgilang, jarayonni kuzating va natijaga erishing.",
      addTask: "Vazifa yaratish",
      addGoal: "Maqsad yaratish",
      emptyTasks: "Rejalashtirilgan vazifalar mavjud emas.",
      emptyGoals: "Hozircha faol maqsadlar mavjud emas."
    }
  };

  function textForUser(key) {
    const level = getDifficulty();
    return UI_TEXT[level]?.[key] || UI_TEXT.adult[key] || "";
  }

  /* -------------------- XP AND RANKS -------------------- */

  function getRank(xp = data.xp) {
    let rank = RANKS[0];

    for (const item of RANKS) {
      if (xp >= item.xp) rank = item;
    }

    const next = RANKS.find(item => item.level === rank.level + 1);

    return {
      ...rank,
      next,
      progress: next
        ? Math.min(100, ((xp - rank.xp) / (next.xp - rank.xp)) * 100)
        : 100,
      remaining: next ? Math.max(0, next.xp - xp) : 0
    };
  }

  function addXP(amount, reason = "Faollik") {
    const points = Math.max(0, Math.floor(Number(amount) || 0));
    if (!points) return;

    const oldRank = getRank().level;

    data.xp += points;
    data.activity.push({
      id: uid(),
      date: today(),
      xp: points,
      reason
    });

    data.activity = data.activity.slice(-180);

    const newRank = getRank().level;

    if (newRank > oldRank) {
      addNotification(
        "Yangi daraja!",
        `Tabriklaymiz! Siz ${newRank}-darajaga ko‘tarildingiz.`
      );
    }

    saveData();
  }

  function spendXP(amount) {
    const points = Math.max(0, Math.floor(Number(amount) || 0));

    if (!points || data.xp < points) {
      showToast("Bu xarid uchun ochkolaringiz yetarli emas.", "error");
      return false;
    }

    data.xp -= points;
    data.spentXP += points;
    saveData();
    return true;
  }

  /* -------------------- NOTIFICATIONS -------------------- */

  function addNotification(title, message) {
    data.notifications.unshift({
      id: uid(),
      title,
      message,
      date: new Date().toISOString(),
      read: false
    });

    data.notifications = data.notifications.slice(0, 60);
    saveData();
  }

  function unreadCount() {
    return data.notifications.filter(item => !item.read).length;
  }

  /* -------------------- TOAST AND MODAL -------------------- */

  function showToast(message, type = "success") {
    const toast = $("#toast");
    const messageElement = $("#toast-message");

    if (!toast || !messageElement) {
      console.log(`[SmartGoal] ${message}`);
      return;
    }

    messageElement.textContent = message;
    toast.classList.remove("hidden", "toast-error");

    const toastIcon = $(".toast-icon", toast);

    if (toastIcon) {
      toastIcon.innerHTML = icon(
        type === "error" ? "alert-circle" : "check-circle-2"
      );
    }

    if (type === "error") toast.classList.add("toast-error");

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.add("hidden"), 3500);

    refreshIcons();
    playSound(type === "error" ? 180 : 650);
  }

  function openModal(title, body, footer = "", eyebrow = "SMARTGOAL") {
    const overlay = $("#modal-overlay");
    const titleElement = $("#modal-title");
    const bodyElement = $("#modal-body");
    const footerElement = $("#modal-footer");
    const eyebrowElement = $("#modal-eyebrow");

    if (!overlay || !titleElement || !bodyElement) return;

    titleElement.textContent = title;
    bodyElement.innerHTML = body;
    if (footerElement) footerElement.innerHTML = footer;
    if (eyebrowElement) eyebrowElement.textContent = eyebrow;

    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    refreshIcons();
  }

  function closeModal() {
    $("#modal-overlay")?.classList.add("hidden");
    document.body.style.overflow = "";
  }

  /* -------------------- SOUND -------------------- */

  function playSound(frequency = 650) {
    if (!settings.sound) return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.035, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start();
      oscillator.stop(context.currentTime + 0.12);
      oscillator.onended = () => context.close();
    } catch {
      // Audio is optional.
    }
  }

  /* -------------------- SETTINGS APPLICATION -------------------- */

  function applySettings() {
    const root = document.documentElement;

    const theme = settings.theme === "system"
      ? (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : settings.theme;

    root.dataset.theme = theme;
    root.dataset.colorTheme = settings.colorTheme || "violet";

    const language = settings.language || "uz";
    root.lang = language;

    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content",
      theme === "dark" ? "#111522" : "#f5f7fb"
    );

    document.body.classList.toggle("reduced-motion", !!settings.reducedMotion);
  }

  /* -------------------- PROFILE -------------------- */

  function normalizedUsername(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/^@/, "")
      .replace(/[^a-z0-9_.]/g, "");
  }

  function isValidUsername(value) {
    return /^[a-z0-9_][a-z0-9_.]{2,19}$/.test(value);
  }

  function updateProfileDisplay() {
    const name = data.profile.name || "Foydalanuvchi";
    const username = data.profile.username || "username";
    const avatar = data.profile.avatar;

    ["#sidebar-name", "#topbar-name"].forEach(selector => {
      const element = $(selector);
      if (element) element.textContent = name;
    });

    const usernameElement = $("#sidebar-username");
    if (usernameElement) usernameElement.textContent = `@${username}`;

    ["#sidebar-avatar", "#topbar-avatar"].forEach(selector => {
      const element = $(selector);
      if (!element) return;

      element.innerHTML = avatar
        ? `<img src="${escapeHTML(avatar)}" alt="Profil rasmi">`
        : icon("user-round");
    });
  }

  function openProfileEditor() {
    const profile = data.profile;

    openModal(
      "Profilni tahrirlash",
      `
        <form id="profile-form" class="form-grid">
          <div class="form-field full-width">
            <label class="field-label" for="profile-name">Ism va familiya</label>
            <input class="field-input" id="profile-name" name="name"
              maxlength="70" required value="${escapeHTML(profile.name)}">
          </div>

          <div class="form-field full-width">
            <label class="field-label" for="profile-username">Username</label>
            <input class="field-input" id="profile-username" name="username"
              minlength="3" maxlength="20" required
              value="${escapeHTML(profile.username)}">
            <small>3–20 belgi. Faqat lotin harflari, raqam, nuqta va pastki chiziq.</small>
          </div>

          <div class="form-field full-width">
            <label class="field-label" for="profile-bio">Biografiya</label>
            <textarea class="field-textarea" id="profile-bio" name="bio"
              maxlength="240" placeholder="O‘zingiz haqingizda qisqacha...">${escapeHTML(profile.bio)}</textarea>
          </div>

          <div class="form-field full-width">
            <label class="field-label" for="profile-avatar">Profil rasmi</label>
            <input class="field-input" id="profile-avatar" name="avatar"
              type="file" accept="image/png,image/jpeg,image/webp">
            <small>PNG, JPG yoki WEBP. Rasm 2 MB dan kichik bo‘lsin.</small>
          </div>
        </form>
      `,
      `
        <button class="secondary-button" type="button" data-action="close-modal">Bekor qilish</button>
        <button class="primary-button" type="submit" form="profile-form">Saqlash</button>
      `
    );
  }

  async function saveProfile(form) {
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const username = normalizedUsername(formData.get("username"));
    const bio = String(formData.get("bio") || "").trim();
    const file = formData.get("avatar");

    if (name.length < 2) {
      showToast("Ism va familiyani to‘g‘ri kiriting.", "error");
      return;
    }

    if (!isValidUsername(username)) {
      showToast("Username formati noto‘g‘ri.", "error");
      return;
    }

    // Real uniqueness checking will be connected to the backend.
    // Local demo can only check the current account.
    if (username !== data.profile.username && username === "admin") {
      showToast("Bu username band.", "error");
      return;
    }

    data.profile.name = name;
    data.profile.username = username;
    data.profile.bio = bio;

    if (file instanceof File && file.size > 0) {
      if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
        showToast("Rasm 2 MB dan kichik bo‘lishi kerak.", "error");
        return;
      }

      try {
        data.profile.avatar = await resizeImage(file);
      } catch {
        showToast("Rasmni yuklashda xatolik yuz berdi.", "error");
        return;
      }
    }

    saveData();
    updateProfileDisplay();
    closeModal();
    render();
    showToast("Profil muvaffaqiyatli yangilandi.");
  }

  function resizeImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onerror = reject;

      reader.onload = () => {
        const image = new Image();

        image.onerror = reject;

        image.onload = () => {
          const canvas = document.createElement("canvas");
          const max = 500;
          const ratio = Math.min(1, max / Math.max(image.width, image.height));

          canvas.width = Math.round(image.width * ratio);
          canvas.height = Math.round(image.height * ratio);

          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0, canvas.width, canvas.height);

          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };

        image.src = reader.result;
      };

      reader.readAsDataURL(file);
    });
  }

  /* -------------------- AUTH DEMO -------------------- */

  function switchAuthTab(tab) {
    const loginForm = $("#login-form");
    const registerForm = $("#register-form");

    if (!loginForm || !registerForm) return;

    const isRegister = tab === "register";

    loginForm.classList.toggle("hidden", isRegister);
    registerForm.classList.toggle("hidden", !isRegister);

    $$("[data-auth-tab]").forEach(button => {
      button.classList.toggle("active", button.dataset.authTab === tab);
    });

    const title = $("#auth-title");
    const description = $("#auth-description");
    const eyebrow = $("#auth-eyebrow");
    const switchText = $("#auth-switch-text");

    if (title) title.textContent = isRegister ? "Yangi hisob yarating" : "Hisobingizga kiring";
    if (description) {
      description.textContent = isRegister
        ? "O‘zingiz haqingizdagi ma’lumotlarni kiriting."
        : "Davom etish uchun ma’lumotlaringizni kiriting.";
    }
    if (eyebrow) eyebrow.textContent = isRegister ? "SMARTGOAL’GA QO‘SHILING" : "XUSH KELIBSIZ";

    if (switchText) {
      switchText.innerHTML = isRegister
        ? `Hisobingiz bormi? <button type="button" class="text-button" data-auth-tab="login">Kirish</button>`
        : `Hali hisobingiz yo‘qmi? <button type="button" class="text-button" data-auth-tab="register">Hisob yarating</button>`;
    }

    refreshIcons();
  }

  function showApplication() {
    $("#auth-screen")?.classList.add("hidden");
    $("#app-shell")?.classList.remove("hidden");
    updateProfileDisplay();
    render();
  }

  function showAuthentication() {
    $("#auth-screen")?.classList.remove("hidden");
    $("#app-shell")?.classList.add("hidden");
  }

  function registerLocal(form) {
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const birthdate = String(formData.get("birthdate") || "");
    const password = String(formData.get("password") || "");
    const terms = formData.get("terms");

    const age = calculateAge(birthdate);

    if (name.length < 2 || !email || !age && age !== 0 || !terms) {
      showToast("Barcha maydonlarni to‘g‘ri to‘ldiring.", "error");
      return;
    }

    if (password.length < 8) {
      showToast("Parol kamida 8 ta belgidan iborat bo‘lsin.", "error");
      return;
    }

    data = createInitialData();
    data.profile.name = name;
    data.profile.birthdate = birthdate;
    data.profile.age = age;
    data.profile.username = normalizedUsername(name.replace(/\s+/g, "."));
    data.profile.email = email;

    if (!isValidUsername(data.profile.username)) {
      data.profile.username = `user_${Date.now().toString().slice(-8)}`;
    }

    settings.difficulty = "auto";
    saveSettings();
    saveData();

    localStorage.setItem(SESSION_KEY, "local-demo");
    showApplication();
    showToast("SmartGoal’ga xush kelibsiz!");
  }

  function loginLocal(form) {
    const formData = new FormData(form);
    const identifier = String(formData.get("identifier") || "").trim();
    const password = String(formData.get("password") || "");

    if (!identifier || !password) {
      showToast("Login va parolni kiriting.", "error");
      return;
    }

    // Frontend-only demonstration login.
    // Real account verification is added when the backend is connected.
    if (!data.profile.name || data.profile.name === "SmartGoal foydalanuvchisi") {
      showToast("Demo hisob hali yaratilmagan. Ro‘yxatdan o‘ting.", "error");
      switchAuthTab("register");
      return;
    }

    localStorage.setItem(SESSION_KEY, "local-demo");
    showApplication();
    showToast("Xush kelibsiz!");
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    showAuthentication();
    showToast("Hisobdan chiqdingiz.");
  }

  /* -------------------- GOALS -------------------- */

  function openGoalForm(goalId = null) {
    const goal = data.goals.find(item => item.id === goalId);

    openModal(
      goal ? "Maqsadni tahrirlash" : "Yangi maqsad",
      `
        <form id="goal-form" class="form-grid">
          <input type="hidden" name="id" value="${escapeHTML(goal?.id || "")}">

          <div class="form-field full-width">
            <label class="field-label">Maqsad nomi</label>
            <input class="field-input" name="title" maxlength="100" required
              placeholder="Masalan: Ingliz tilini o‘rganish"
              value="${escapeHTML(goal?.title || "")}">
          </div>

          <div class="form-field full-width">
            <label class="field-label">Tavsif</label>
            <textarea class="field-textarea" name="description"
              maxlength="400" placeholder="Maqsadingiz haqida...">${escapeHTML(goal?.description || "")}</textarea>
          </div>

          <div class="form-field">
            <label class="field-label">Muddat</label>
            <input class="field-input" type="date" name="deadline"
              value="${escapeHTML(goal?.deadline || "")}">
          </div>

          <div class="form-field">
            <label class="field-label">Ustuvorlik</label>
            <select class="field-select" name="priority">
              <option value="low" ${goal?.priority === "low" ? "selected" : ""}>Past</option>
              <option value="medium" ${!goal || goal.priority === "medium" ? "selected" : ""}>O‘rta</option>
              <option value="high" ${goal?.priority === "high" ? "selected" : ""}>Yuqori</option>
            </select>
          </div>
        </form>
      `,
      `
        <button class="secondary-button" type="button" data-action="close-modal">Bekor qilish</button>
        <button class="primary-button" type="submit" form="goal-form">Saqlash</button>
      `
    );
  }

  function saveGoal(form) {
    const fd = new FormData(form);
    const id = String(fd.get("id") || "");
    const title = String(fd.get("title") || "").trim();

    if (title.length < 2) {
      showToast("Maqsad nomini kiriting.", "error");
      return;
    }

    if (id) {
      const goal = data.goals.find(item => item.id === id);
      if (!goal) return;

      Object.assign(goal, {
        title,
        description: String(fd.get("description") || "").trim(),
        deadline: String(fd.get("deadline") || ""),
        priority: String(fd.get("priority") || "medium")
      });
    } else {
      data.goals.unshift({
        id: uid(),
        title,
        description: String(fd.get("description") || "").trim(),
        deadline: String(fd.get("deadline") || ""),
        priority: String(fd.get("priority") || "medium"),
        progress: 0,
        createdAt: today(),
        completed: false
      });
    }

    saveData();
    closeModal();
    render();
    showToast("Maqsad saqlandi.");
  }

  function deleteGoal(id) {
    const goal = data.goals.find(item => item.id === id);
    if (!goal) return;

    openModal(
      "Maqsadni o‘chirish",
      `<p>“${escapeHTML(goal.title)}” maqsadini o‘chirishni xohlaysizmi?</p>`,
      `
        <button class="secondary-button" type="button" data-action="close-modal">Bekor qilish</button>
        <button class="primary-button" type="button" data-action="confirm-delete-goal" data-id="${escapeHTML(id)}">O‘chirish</button>
      `
    );
  }

  /* -------------------- TASKS -------------------- */

  function openTaskForm(taskId = null) {
    const task = data.tasks.find(item => item.id === taskId);

    openModal(
      task ? "Vazifani tahrirlash" : "Yangi vazifa",
      `
        <form id="task-form" class="form-grid">
          <input type="hidden" name="id" value="${escapeHTML(task?.id || "")}">

          <div class="form-field full-width">
            <label class="field-label">Vazifa nomi</label>
            <input class="field-input" name="title" maxlength="100" required
              placeholder="Masalan: 20 bet kitob o‘qish"
              value="${escapeHTML(task?.title || "")}">
          </div>

          <div class="form-field">
            <label class="field-label">Bajarish sanasi</label>
            <input class="field-input" type="date" name="date"
              value="${escapeHTML(task?.date || today())}">
          </div>

          <div class="form-field">
            <label class="field-label">Mukofot XP</label>
            <select class="field-select" name="reward">
              ${[10, 15, 20, 25, 50, 100].map(value =>
                `<option value="${value}" ${(task?.reward || 10) === value ? "selected" : ""}>${value} XP</option>`
              ).join("")}
            </select>
          </div>

          <div class="form-field full-width">
            <label class="field-label">Bog‘langan maqsad</label>
            <select class="field-select" name="goalId">
              <option value="">Maqsadsiz vazifa</option>
              ${data.goals.map(goal =>
                `<option value="${escapeHTML(goal.id)}" ${task?.goalId === goal.id ? "selected" : ""}>${escapeHTML(goal.title)}</option>`
              ).join("")}
            </select>
          </div>
        </form>
      `,
      `
        <button class="secondary-button" type="button" data-action="close-modal">Bekor qilish</button>
        <button class="primary-button" type="submit" form="task-form">Saqlash</button>
      `
    );
  }

  function saveTask(form) {
    const fd = new FormData(form);
    const id = String(fd.get("id") || "");
    const title = String(fd.get("title") || "").trim();

    if (title.length < 2) {
      showToast("Vazifa nomini kiriting.", "error");
      return;
    }

    const values = {
      title,
      date: String(fd.get("date") || today()),
      reward: Math.min(100, Math.max(5, Number(fd.get("reward")) || 10)),
      goalId: String(fd.get("goalId") || "")
    };

    if (id) {
      const task = data.tasks.find(item => item.id === id);
      if (!task) return;
      Object.assign(task, values);
    } else {
      data.tasks.unshift({
        id: uid(),
        ...values,
        completed: false,
        xpAwarded: false,
        completedAt: null,
        createdAt: new Date().toISOString()
      });
    }

    saveData();
    closeModal();
    render();
    showToast("Vazifa saqlandi.");
  }

  function toggleTask(id) {
    const task = data.tasks.find(item => item.id === id);
    if (!task) return;

    if (!task.completed) {
      task.completed = true;
      task.completedAt = new Date().toISOString();

      if (!task.xpAwarded) {
        task.xpAwarded = true;
        addXP(task.reward || 10, `Vazifa: ${task.title}`);
      }

      if (task.goalId) {
        const goal = data.goals.find(item => item.id === task.goalId);

        if (goal) {
          const linkedTasks = data.tasks.filter(item => item.goalId === goal.id);
          const completed = linkedTasks.filter(item => item.completed).length;

          goal.progress = linkedTasks.length
            ? Math.round((completed / linkedTasks.length) * 100)
            : goal.progress;

          if (goal.progress >= 100 && !goal.completed) {
            goal.completed = true;
            addXP(50, `Maqsad yakunlandi: ${goal.title}`);
            addNotification("Maqsad yakunlandi!", `“${goal.title}” maqsadini bajardingiz.`);
          }
        }
      }

      checkAchievements();
      showToast(`Vazifa bajarildi! +${task.reward || 10} XP`);
    } else {
      // Completed tasks can be reopened, but awarded XP is not deducted.
      task.completed = false;
      task.completedAt = null;
      showToast("Vazifa qayta ochildi.");
    }

    saveData();
    render();
  }

  function deleteTask(id) {
    const task = data.tasks.find(item => item.id === id);
    if (!task) return;

    openModal(
      "Vazifani o‘chirish",
      `<p>“${escapeHTML(task.title)}” vazifasini o‘chirishni xohlaysizmi?</p>`,
      `
        <button class="secondary-button" type="button" data-action="close-modal">Bekor qilish</button>
        <button class="primary-button" type="button" data-action="confirm-delete-task" data-id="${escapeHTML(id)}">O‘chirish</button>
      `
    );
  }

  /* -------------------- ACHIEVEMENTS -------------------- */

  function checkAchievements() {
    ACHIEVEMENTS.forEach(achievement => {
      const alreadyEarned = data.achievements.includes(achievement.id);

      if (!alreadyEarned && achievement.condition(data)) {
        data.achievements.push(achievement.id);
        addNotification(
          "Yangi yutuq ochildi!",
          `Siz “${achievement.name}” yutug‘ini qo‘lga kiritdingiz.`
        );
      }
    });

    saveData();
  }

  /* -------------------- STORE -------------------- */

  function purchaseItem(id) {
    const item = STORE_ITEMS.find(product => product.id === id);
    if (!item) return;

    const owned = data.inventory.some(product => product.id === id);

    if (owned) {
      showToast("Bu mahsulot sizda allaqachon mavjud.", "error");
      return;
    }

    openModal(
      "Xaridni tasdiqlash",
      `
        <div class="empty-state">
          <div class="empty-state-icon">${icon(item.icon, 28)}</div>
          <h3>${escapeHTML(item.name)}</h3>
          <p>${escapeHTML(item.description)}</p>
          <strong>${formatNumber(item.price)} XP</strong>
        </div>
      `,
      `
        <button class="secondary-button" type="button" data-action="close-modal">Bekor qilish</button>
        <button class="primary-button" type="button" data-action="confirm-purchase" data-id="${escapeHTML(id)}">Xarid qilish</button>
      `
    );
  }

  function confirmPurchase(id) {
    const item = STORE_ITEMS.find(product => product.id === id);
    if (!item) return;

    if (data.inventory.some(product => product.id === id)) {
      showToast("Bu mahsulot sizda mavjud.", "error");
      closeModal();
      return;
    }

    if (!spendXP(item.price)) return;

    data.inventory.push({
      id: item.id,
      type: item.type,
      value: item.value,
      purchasedAt: new Date().toISOString()
    });

    saveData();
    closeModal();
    render();
    showToast(`${item.name} muvaffaqiyatli xarid qilindi!`);
  }

  function useItem(id) {
    const owned = data.inventory.find(item => item.id === id);
    const product = STORE_ITEMS.find(item => item.id === id);

    if (!owned || !product) return;

    if (owned.type === "theme") {
      settings.colorTheme = owned.value;
      saveSettings();
    } else if (owned.type === "background") {
      data.profile.background = owned.value;
      saveData();
    } else if (owned.type === "avatar") {
      data.profile.avatarFrame = owned.value;
      saveData();
    } else if (owned.type === "badge") {
      data.profile.activeBadge = owned.value;
      saveData();
    }

    render();
    showToast("Mahsulot profilingizga qo‘llandi.");
  }

  /* -------------------- ACTIVITY AND CHART -------------------- */

  function getLastSevenDays() {
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().slice(0, 10);

      const xp = data.activity
        .filter(item => item.date === key)
        .reduce((sum, item) => sum + item.xp, 0);

      result.push({
        key,
        label: date.toLocaleDateString(getLocale(), { weekday: "short" }),
        xp
      });
    }

    return result;
  }

  function chartMarkup() {
    const days = getLastSevenDays();
    const max = Math.max(50, ...days.map(day => day.xp));
    const width = 640;
    const height = 205;
    const left = 28;
    const right = 12;
    const top = 15;
    const bottom = 35;
    const chartWidth = width - left - right;
    const chartHeight = height - top - bottom;

    const points = days.map((day, index) => {
      const x = left + (chartWidth / 6) * index;
      const y = top + chartHeight - (day.xp / max) * chartHeight;
      return { ...day, x, y };
    });

    const line = points.map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
    ).join(" ");

    const area = `${line} L ${points[6].x} ${top + chartHeight} L ${points[0].x} ${top + chartHeight} Z`;

    return `
      <div class="chart-container">
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="So‘nggi yetti kunlik XP grafigi">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--primary)" />
              <stop offset="100%" stop-color="var(--primary)" stop-opacity="0" />
            </linearGradient>
          </defs>

          ${[0, 1, 2, 3].map(index => {
            const y = top + (chartHeight / 3) * index;
            return `<line class="chart-grid-line" x1="${left}" y1="${y}" x2="${width - right}" y2="${y}"/>`;
          }).join("")}

          <path class="chart-area" d="${area}"/>
          <path class="chart-line" d="${line}"/>

          ${points.map(point => `
            <circle class="chart-point" cx="${point.x}" cy="${point.y}" r="4">
              <title>${escapeHTML(point.label)}: ${point.xp} XP</title>
            </circle>
            <text class="chart-label" x="${point.x}" y="${height - 8}" text-anchor="middle">${escapeHTML(point.label)}</text>
          `).join("")}
        </svg>
      </div>
    `;
  }

  /* -------------------- PAGE LAYOUT HELPERS -------------------- */

  function pageHeader(label, title, description, button = "") {
    return `
      <div class="section-heading">
        <div>
          <span class="section-label">${escapeHTML(label)}</span>
          <h2>${escapeHTML(title)}</h2>
          <p>${escapeHTML(description)}</p>
        </div>
        ${button}
      </div>
    `;
  }

  function actionButton(action, label, iconName = "plus", extra = "") {
    return `
      <button class="primary-button" type="button" data-action="${escapeHTML(action)}" ${extra}>
        ${icon(iconName, 16)}
        <span>${escapeHTML(label)}</span>
      </button>
    `;
  }

  function emptyState(title, description, iconName = "inbox") {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">${icon(iconName, 26)}</div>
        <h3>${escapeHTML(title)}</h3>
        <p>${escapeHTML(description)}</p>
      </div>
    `;
  }

  /* -------------------- DASHBOARD PAGE -------------------- */

  function renderDashboard() {
    const completed = data.tasks.filter(task => task.completed).length;
    const activeGoals = data.goals.filter(goal => !goal.completed).length;
    const todayTasks = data.tasks.filter(task => task.date === today());
    const completedToday = todayTasks.filter(task => task.completed).length;
    const rank = getRank();

    const tasksHTML = todayTasks.length
      ? todayTasks.slice(0, 5).map(task => `
          <div class="task-item ${task.completed ? "task-completed" : ""}">
            <input class="task-checkbox" type="checkbox"
              data-action="toggle-task" data-id="${escapeHTML(task.id)}"
              ${task.completed ? "checked" : ""} aria-label="Vazifani bajarildi deb belgilash">

            <div class="task-info">
              <strong>${escapeHTML(task.title)}</strong>
              <small>${escapeHTML(formatDate(task.date))}</small>
            </div>

            <span class="task-reward">${icon("zap", 12)} ${task.reward || 10} XP</span>
          </div>
        `).join("")
      : emptyState("Buguncha vazifalar yo‘q", textForUser("emptyTasks"), "calendar-check");

    const goalsHTML = data.goals.length
      ? data.goals.filter(goal => !goal.completed).slice(0, 4).map(goal => `
          <div class="goal-item">
            <div class="goal-item-header">
              <div>
                <strong>${escapeHTML(goal.title)}</strong>
                <small>${goal.deadline ? `Muddat: ${escapeHTML(formatDate(goal.deadline))}` : "Muddat belgilanmagan"}</small>
              </div>
              <span class="goal-percentage">${goal.progress || 0}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width:${Math.min(100, goal.progress || 0)}%"></div>
            </div>
          </div>
        `).join("")
      : emptyState("Maqsadlar hali yo‘q", textForUser("emptyGoals"), "target");

    return `
      <section class="welcome-banner">
        <div class="welcome-content">
          <span class="eyebrow">SMARTGOAL • ${escapeHTML(formatDate(today()))}</span>
          <h2>${escapeHTML(textForUser("welcome"))}</h2>
          <p>${escapeHTML(textForUser("description"))}</p>
          <div class="welcome-actions">
            ${actionButton("add-task", textForUser("addTask"), "plus")}
            <button class="secondary-button" type="button" data-page="goals">
              ${icon("target", 15)} Maqsadlarim
            </button>
          </div>
        </div>
        <div class="welcome-visual">${icon("trending-up", 70)}</div>
      </section>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-top">
            <span class="stat-icon purple">${icon("zap")}</span>
          </div>
          <p class="stat-label">Jami XP</p>
          <div class="stat-value">${formatNumber(data.xp)}</div>
          <span class="stat-change">${icon("trending-up")} ${rank.name}</span>
        </div>

        <div class="stat-card">
          <div class="stat-top">
            <span class="stat-icon green">${icon("check-circle-2")}</span>
          </div>
          <p class="stat-label">Bajarilgan vazifalar</p>
          <div class="stat-value">${formatNumber(completed)}</div>
          <span class="stat-change">${completedToday} ta bugun</span>
        </div>

        <div class="stat-card">
          <div class="stat-top">
            <span class="stat-icon blue">${icon("target")}</span>
          </div>
          <p class="stat-label">Faol maqsadlar</p>
          <div class="stat-value">${formatNumber(activeGoals)}</div>
          <span class="stat-change">Rejalaringiz sari</span>
        </div>

        <div class="stat-card">
          <div class="stat-top">
            <span class="stat-icon orange">${icon("award")}</span>
          </div>
          <p class="stat-label">Yutuqlar</p>
          <div class="stat-value">${formatNumber(data.achievements.length)}</div>
          <span class="stat-change">Qo‘lga kiritilgan</span>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="dashboard-column">
          <section class="card">
            <div class="card-header">
              <div>
                <h3 class="card-title">Faollik grafigi</h3>
                <p class="card-description">So‘nggi 7 kun ichidagi to‘plangan XP</p>
              </div>
              <button class="card-action" type="button" data-page="analytics">Batafsil ${icon("arrow-right", 13)}</button>
            </div>
            ${chartMarkup()}
          </section>

          <section class="card">
            <div class="card-header">
              <div>
                <h3 class="card-title">Bugungi vazifalar</h3>
                <p class="card-description">${completedToday}/${todayTasks.length} ta bajarildi</p>
              </div>
              <button class="card-action" type="button" data-action="add-task">+ Qo‘shish</button>
            </div>
            ${tasksHTML}
          </section>
        </div>

        <div class="dashboard-column">
          <section class="card">
            <div class="card-header">
              <div>
                <h3 class="card-title">Maqsadlarim</h3>
                <p class="card-description">Hozirgi rivojlanish jarayoni</p>
              </div>
              <button class="card-action" type="button" data-page="goals">Barchasi ${icon("arrow-right", 13)}</button>
            </div>
            <div class="goal-list">${goalsHTML}</div>
          </section>

          <section class="level-card">
            <span class="section-label">SIZNING DARAJANGIZ</span>
            <div class="level-number">Level ${rank.level}</div>
            <div class="level-title">${escapeHTML(rank.name)}</div>
            <p class="level-description">
              ${rank.next
                ? `Keyingi darajaga o‘tish uchun yana ${formatNumber(rank.remaining)} XP to‘plang.`
                : "Siz eng yuqori mavjud darajaga yetdingiz!"}
            </p>
            <div class="progress-track" style="margin-top:16px">
              <div class="progress-fill" style="width:${rank.progress}%"></div>
            </div>
            <div class="goal-footer">
              <span>${formatNumber(data.xp)} XP</span>
              <span>${rank.next ? `${formatNumber(rank.next.xp)} XP` : "MAX"}</span>
            </div>
            <button class="card-action" type="button" data-page="profile" style="margin-top:16px">
              Darajamni ko‘rish ${icon("arrow-right", 13)}
            </button>
          </section>
        </div>
      </div>
    `;
  }

  /* -------------------- GOALS PAGE -------------------- */

  function renderGoals() {
    const goals = data.goals;

    return `
      ${pageHeader(
        "REJALARINGIZ",
        "Maqsadlarim",
        "Katta natijalarga kichik qadamlar orqali erishing.",
        actionButton("add-goal", "Maqsad qo‘shish")
      )}

      <div class="stats-grid">
        <div class="stat-card">
          <p class="stat-label">Jami maqsadlar</p>
          <div class="stat-value">${goals.length}</div>
        </div>
        <div class="stat-card">
          <p class="stat-label">Faol maqsadlar</p>
          <div class="stat-value">${goals.filter(g => !g.completed).length}</div>
        </div>
        <div class="stat-card">
          <p class="stat-label">Yakunlangan</p>
          <div class="stat-value">${goals.filter(g => g.completed).length}</div>
        </div>
        <div class="stat-card">
          <p class="stat-label">O‘rtacha progress</p>
          <div class="stat-value">${goals.length ? Math.round(goals.reduce((s, g) => s + (g.progress || 0), 0) / goals.length) : 0}%</div>
        </div>
      </div>

      <div class="goal-list">
        ${goals.length ? goals.map(goal => `
          <article class="goal-item">
            <div class="goal-item-header">
              <div>
                <strong>${escapeHTML(goal.title)}</strong>
                <small>${escapeHTML(goal.description || "Maqsad tavsifi kiritilmagan")}</small>
                <small>${goal.deadline ? `Muddat: ${escapeHTML(formatDate(goal.deadline))}` : "Muddat belgilanmagan"}</small>
              </div>
              <span class="goal-percentage">${goal.progress || 0}%</span>
            </div>

            <div class="progress-track">
              <div class="progress-fill" style="width:${Math.min(100, goal.progress || 0)}%"></div>
            </div>

            <div class="goal-footer">
              <span>${goal.completed ? "Yakunlangan" : `Ustuvorlik: ${escapeHTML(goal.priority || "medium")}`}</span>
              <span>
                <button class="card-action" type="button" data-action="edit-goal" data-id="${escapeHTML(goal.id)}">Tahrirlash</button>
                <button class="card-action" type="button" data-action="delete-goal" data-id="${escapeHTML(goal.id)}">O‘chirish</button>
              </span>
            </div>
          </article>
        `).join("") : emptyState("Maqsadlar mavjud emas", "Birinchi maqsadingizni yarating va unga qadam-baqadam yaqinlashing.", "target")}
      </div>
    `;
  }

  /* -------------------- SCHEDULE PAGE -------------------- */

  function renderSchedule() {
    const tasks = [...data.tasks].sort((a, b) => (a.date || "").localeCompare(b.date || ""));

    return `
      ${pageHeader(
        "KUNLIK REJA",
        "Vazifalar",
        "Vazifalaringizni tartibga soling va bajarilganlarini belgilang.",
        actionButton("add-task", "Vazifa qo‘shish")
      )}

      <section class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Barcha vazifalar</h3>
            <p class="card-description">${tasks.filter(t => t.completed).length} / ${tasks.length} ta bajarilgan</p>
          </div>
        </div>

        <div class="task-list">
          ${tasks.length ? tasks.map(task => `
            <div class="task-item ${task.completed ? "task-completed" : ""}">
              <input class="task-checkbox" type="checkbox"
                data-action="toggle-task" data-id="${escapeHTML(task.id)}"
                ${task.completed ? "checked" : ""}>

              <div class="task-info">
                <strong>${escapeHTML(task.title)}</strong>
                <small>${escapeHTML(formatDate(task.date))}</small>
              </div>

              <span class="task-reward">${icon("zap", 12)} ${task.reward || 10} XP</span>

              <button class="icon-button" type="button"
                data-action="edit-task" data-id="${escapeHTML(task.id)}"
                aria-label="Tahrirlash">${icon("pencil", 15)}</button>

              <button class="icon-button" type="button"
                data-action="delete-task" data-id="${escapeHTML(task.id)}"
                aria-label="O‘chirish">${icon("trash-2", 15)}</button>
            </div>
          `).join("") : emptyState("Vazifalar mavjud emas", "Yangi vazifa qo‘shib rejangizni boshlang.", "calendar-check")}
        </div>
      </section>
    `;
  }

  /* -------------------- PLANNER PAGE -------------------- */

  function renderPlanner() {
    const activeGoals = data.goals.filter(goal => !goal.completed);
    const pendingTasks = data.tasks.filter(task => !task.completed);

    return `
      ${pageHeader(
        "VAQTNI BOSHQARISH",
        "Rejalashtiruvchi",
        "Kunlik va haftalik rejalaringizni tartibga soling."
      )}

      <section class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Bugungi reja</h3>
            <p class="card-description">${escapeHTML(formatDate(today()))}</p>
          </div>
          ${actionButton("add-task", "Vazifa qo‘shish")}
        </div>

        ${pendingTasks.length
          ? `<div class="task-list">${pendingTasks.filter(task => task.date === today()).map(task => `
              <div class="task-item">
                <input class="task-checkbox" type="checkbox" data-action="toggle-task" data-id="${escapeHTML(task.id)}">
                <div class="task-info"><strong>${escapeHTML(task.title)}</strong><small>${task.reward} XP</small></div>
              </div>
            `).join("") || emptyState("Bugungi vazifalar yo‘q", "Yangi vazifa qo‘shishingiz mumkin.", "calendar-check")}</div>`
          : emptyState("Reja hali bo‘sh", "Vazifalar qo‘shish orqali rejalashtirishni boshlang.", "calendar")}
      </section>

      <section class="card" style="margin-top:20px">
        <div class="card-header">
          <div>
            <h3 class="card-title">Maqsadlar asosida tavsiyalar</h3>
            <p class="card-description">Hozircha SmartGoal ichidagi oddiy rejalashtirish yordamchisi</p>
          </div>
          <span class="nav-badge">AI keyin ulanadi</span>
        </div>

        ${activeGoals.length ? activeGoals.map(goal => `
          <div class="goal-item">
            <div class="goal-item-header">
              <div><strong>${escapeHTML(goal.title)}</strong><small>${escapeHTML(goal.description || "Maqsadga erishish uchun muntazam ishlang.")}</small></div>
              <span class="goal-percentage">${goal.progress || 0}%</span>
            </div>
            <p class="card-description">Tavsiya: ushbu maqsad uchun bugun kamida bitta kichik vazifa belgilang.</p>
          </div>
        `).join("") : emptyState("Faol maqsad yo‘q", "Avval maqsad yarating.", "target")}
      </section>
    `;
  }

  /* -------------------- ANALYTICS PAGE -------------------- */

  function renderAnalytics() {
    const completed = data.tasks.filter(task => task.completed).length;
    const total = data.tasks.length;
    const completion = total ? Math.round(completed / total * 100) : 0;
    const weeklyXP = getLastSevenDays().reduce((sum, day) => sum + day.xp, 0);

    return `
      ${pageHeader(
        "NATIJALARINGIZ",
        "Statistika",
        "Faolligingiz va rivojlanishingizni tahlil qiling."
      )}

      <div class="stats-grid">
        <div class="stat-card">
          <p class="stat-label">Jami XP</p>
          <div class="stat-value">${formatNumber(data.xp)}</div>
        </div>
        <div class="stat-card">
          <p class="stat-label">Bu haftadagi XP</p>
          <div class="stat-value">${formatNumber(weeklyXP)}</div>
        </div>
        <div class="stat-card">
          <p class="stat-label">Bajarilgan vazifalar</p>
          <div class="stat-value">${completed}</div>
        </div>
        <div class="stat-card">
          <p class="stat-label">Bajarilish foizi</p>
          <div class="stat-value">${completion}%</div>
        </div>
      </div>

      <section class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Haftalik faollik</h3>
            <p class="card-description">Har kuni to‘plangan XP</p>
          </div>
        </div>
        ${chartMarkup()}
      </section>

      <section class="card" style="margin-top:20px">
        <h3 class="card-title">Umumiy natijalar</h3>
        <div class="setting-row">
          <div class="setting-info"><strong>Maqsadlar</strong><small>Yaratilgan maqsadlar soni</small></div>
          <strong>${data.goals.length}</strong>
        </div>
        <div class="setting-row">
          <div class="setting-info"><strong>Yutuqlar</strong><small>Qo‘lga kiritilgan yutuqlar</small></div>
          <strong>${data.achievements.length}</strong>
        </div>
        <div class="setting-row">
          <div class="setting-info"><strong>Xaridlar</strong><small>Do‘kondan olingan mahsulotlar</small></div>
          <strong>${data.inventory.length}</strong>
        </div>
      </section>
    `;
  }

  /* -------------------- ACHIEVEMENTS PAGE -------------------- */

  function renderAchievements() {
    return `
      ${pageHeader(
        "SIZNING NATIJALARINGIZ",
        "Yutuqlarim",
        "Muhim kunlar, sertifikatlar va shaxsiy yutuqlaringizni saqlang.",
        actionButton("add-memory", "Yutuq qo‘shish", "plus")
      )}

      <section class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">SmartGoal yutuqlari</h3>
            <p class="card-description">${data.achievements.length} / ${ACHIEVEMENTS.length} ta ochilgan</p>
          </div>
        </div>

        <div class="badge-grid">
          ${ACHIEVEMENTS.map(item => {
            const earned = data.achievements.includes(item.id);
            return `
              <div class="achievement-card ${earned ? "" : "locked"}">
                <div class="achievement-icon">${icon(earned ? item.icon : "lock", 23)}</div>
                <strong>${escapeHTML(item.name)}</strong>
                <small>${escapeHTML(item.description)}</small>
                <small>${earned ? "Qo‘lga kiritilgan" : "Hali ochilmagan"}</small>
              </div>
            `;
          }).join("")}
        </div>
      </section>

      <section class="card" style="margin-top:20px">
        <div class="card-header">
          <div>
            <h3 class="card-title">Shaxsiy xotiralar</h3>
            <p class="card-description">Sertifikatlar, muhim kunlar va esdaliklar.</p>
          </div>
        </div>

        ${data.memories.length ? data.memories.map(memory => `
          <article class="notification-item">
            <div class="achievement-icon">${icon(memory.type === "certificate" ? "file-badge" : "bookmark", 20)}</div>
            <div>
              <strong>${escapeHTML(memory.title)}</strong>
              <p>${escapeHTML(memory.description || "")}</p>
              <small>${escapeHTML(formatDate(memory.date))}</small>
            </div>
            <button class="icon-button" type="button" data-action="delete-memory" data-id="${escapeHTML(memory.id)}">${icon("trash-2", 14)}</button>
          </article>
        `).join("") : emptyState("Xotiralar hali yo‘q", "Birinchi yutug‘ingiz yoki esdalik kuningizni saqlang.", "bookmark")}
      </section>
    `;
  }

  function openMemoryForm() {
    openModal(
      "Yangi yutuq yoki xotira",
      `
        <form id="memory-form" class="form-grid">
          <div class="form-field full-width">
            <label class="field-label">Sarlavha</label>
            <input class="field-input" name="title" maxlength="100" required placeholder="Masalan: Birinchi sertifikatim">
          </div>
          <div class="form-field full-width">
            <label class="field-label">Tavsif</label>
            <textarea class="field-textarea" name="description" maxlength="500" placeholder="Bu kun nima uchun muhim?"></textarea>
          </div>
          <div class="form-field">
            <label class="field-label">Turi</label>
            <select class="field-select" name="type">
              <option value="memory">Shaxsiy xotira</option>
              <option value="certificate">Sertifikat</option>
              <option value="milestone">Muhim natija</option>
            </select>
          </div>
          <div class="form-field">
            <label class="field-label">Sana</label>
            <input class="field-input" type="date" name="date" value="${today()}">
          </div>
        </form>
      `,
      `
        <button class="secondary-button" type="button" data-action="close-modal">Bekor qilish</button>
        <button class="primary-button" type="submit" form="memory-form">Saqlash</button>
      `
    );
  }

  function saveMemory(form) {
    const fd = new FormData(form);
    const title = String(fd.get("title") || "").trim();

    if (title.length < 2) {
      showToast("Sarlavha kiriting.", "error");
      return;
    }

    data.memories.unshift({
      id: uid(),
      title,
      description: String(fd.get("description") || "").trim(),
      type: String(fd.get("type") || "memory"),
      date: String(fd.get("date") || today())
    });

    saveData();
    closeModal();
    render();
    showToast("Xotirangiz saqlandi.");
  }

  /* -------------------- STORE PAGE -------------------- */

  function renderRewards() {
    return `
      ${pageHeader(
        "MAXSUS IMKONIYATLAR",
        "Mukofotlar do‘koni",
        "Yig‘ilgan XP bilan profilingiz uchun maxsus mahsulotlarni oching."
      )}

      <section class="welcome-banner" style="min-height:120px">
        <div class="welcome-content">
          <span class="eyebrow">SIZNING BALANSINGIZ</span>
          <h2>${formatNumber(data.xp)} XP</h2>
          <p>Har bir vazifa sizni yangi imkoniyatlarga yaqinlashtiradi.</p>
        </div>
        <div class="welcome-visual">${icon("shopping-bag", 65)}</div>
      </section>

      <div class="store-grid">
        ${STORE_ITEMS.map(item => {
          const owned = data.inventory.some(product => product.id === item.id);
          return `
            <article class="store-item">
              <div class="store-preview">
                ${icon(item.icon, 45)}
              </div>
              <div class="store-content">
                <h3>${escapeHTML(item.name)}</h3>
                <p>${escapeHTML(item.description)}</p>
                <div class="store-price">
                  <strong>${formatNumber(item.price)} XP</strong>
                  ${owned
                    ? `<button class="secondary-button" type="button" data-action="use-item" data-id="${escapeHTML(item.id)}">Qo‘llash</button>`
                    : `<button class="primary-button" type="button" data-action="buy-item" data-id="${escapeHTML(item.id)}">Xarid</button>`}
                </div>
              </div>
            </article>
          `;
        }).join("")}
      </div>

      <section class="card" style="margin-top:22px">
        <h3 class="card-title">Sizning kolleksiyangiz</h3>
        <p class="card-description">Sotib olgan mahsulotlaringiz shu yerda saqlanadi.</p>
        <div class="badge-grid" style="margin-top:16px">
          ${data.inventory.length ? data.inventory.map(owned => {
            const item = STORE_ITEMS.find(product => product.id === owned.id);
            return item ? `
              <div class="achievement-card">
                <div class="achievement-icon">${icon(item.icon, 22)}</div>
                <strong>${escapeHTML(item.name)}</strong>
                <button class="card-action" type="button" data-action="use-item" data-id="${escapeHTML(item.id)}">Qo‘llash</button>
              </div>
            ` : "";
          }).join("") : emptyState("Kolleksiyangiz hozircha bo‘sh", "Do‘kondan birinchi mahsulotingizni xarid qiling.", "package")}
        </div>
      </section>
    `;
  }

  /* -------------------- COMMUNITY PAGE -------------------- */

  function renderCommunity() {
    return `
      ${pageHeader(
        "HAMJAMIYAT",
        "Foydalanuvchilar",
        "Username orqali boshqa foydalanuvchilarni toping."
      )}

      <section class="card">
        <div class="form-field">
          <label class="field-label" for="community-search">Username bo‘yicha qidirish</label>
          <div class="input-wrap">
            ${icon("search")}
            <input id="community-search" type="search" placeholder="@username">
          </div>
          <small>Hozircha demo rejim. Haqiqiy foydalanuvchilar qidiruvi backend ulanganda ishlaydi.</small>
        </div>

        <div id="community-results" style="margin-top:20px">
          ${emptyState("Qidiruvga tayyor", "Username kiriting. Haqiqiy foydalanuvchilar ro‘yxati backend bilan ulanadi.", "users")}
        </div>
      </section>

      <section class="card" style="margin-top:20px">
        <h3 class="card-title">Sizning darajangiz</h3>
        <p class="card-description">Boshqalar profilingizni ko‘rganda darajangiz va yutuqlaringizni ko‘rishi mumkin bo‘ladi.</p>
        <div class="profile-meta">
          <span>${icon("at-sign")} @${escapeHTML(data.profile.username || "username")}</span>
          <span>${icon("award")} Level ${getRank().level} · ${escapeHTML(getRank().name)}</span>
        </div>
      </section>
    `;
  }

  /* -------------------- AI PAGE -------------------- */

  function renderAI() {
    return `
      ${pageHeader(
        "SHAXSIY YORDAMCHI",
        "Smart AI",
        "Maqsadlaringiz va rejalaringiz bo‘yicha aqlli yordamchi."
      )}

      <section class="ai-panel">
        <span class="eyebrow">SMARTGOAL INTELLIGENCE</span>
        <h2>Rivojlanishingiz uchun aqlli yordam.</h2>
        <p>
          Kelajakda AI yoshingiz, maqsadlaringiz va tanlagan interfeys
          murakkabligingizga mos tavsiyalar beradi.
        </p>
      </section>

      <section class="card" style="margin-top:20px">
        <h3 class="card-title">AI bilan suhbat</h3>
        <p class="card-description">Hozircha demo rejim. AI xizmati keyingi backend bosqichida ulanadi.</p>

        <div class="ai-chat" id="ai-chat">
          <div class="ai-message">
            Salom! Men SmartGoal yordamchisiman. Hozircha maqsadlaringiz asosida oddiy tavsiyalar bera olaman.
          </div>
        </div>

        <form id="ai-form" class="ai-input-row" style="margin-top:18px">
          <input name="message" placeholder="Savolingizni yozing..." maxlength="500" required>
          <button class="primary-button" type="submit">${icon("send", 16)}</button>
        </form>
      </section>
    `;
  }

  function sendAIMessage(form) {
    const input = form.elements.message;
    const message = String(input.value || "").trim();
    if (!message) return;

    const chat = $("#ai-chat");
    if (!chat) return;

    chat.insertAdjacentHTML("beforeend", `
      <div class="ai-message user">${escapeHTML(message)}</div>
      <div class="ai-message">
        Hozircha AI xizmati ulanmagan. Maqsadlaringizni “Maqsadlarim” bo‘limida belgilang.
        Keyingi bosqichda sizga mos AI tavsiyalarini ulaymiz.
      </div>
    `);

    input.value = "";
    chat.scrollTop = chat.scrollHeight;
  }

  /* -------------------- NOTIFICATIONS PAGE -------------------- */

  function renderNotifications() {
    return `
      ${pageHeader(
        "YANGILIKLAR",
        "Bildirishnomalar",
        "Faolligingiz va yutuqlaringiz haqidagi xabarlar."
      )}

      <section class="card">
        <div class="card-header">
          <h3 class="card-title">Barcha bildirishnomalar</h3>
          <button class="card-action" type="button" data-action="mark-all-read">Barchasini o‘qilgan qilish</button>
        </div>

        <div class="notification-list">
          ${data.notifications.length ? data.notifications.map(item => `
            <article class="notification-item ${item.read ? "" : "unread"}">
              <div class="achievement-icon">${icon(item.title.includes("yutuq") ? "trophy" : "bell", 19)}</div>
              <div>
                <strong>${escapeHTML(item.title)}</strong>
                <p>${escapeHTML(item.message)}</p>
                <small>${escapeHTML(new Date(item.date).toLocaleString(getLocale()))}</small>
              </div>
              ${!item.read ? `<button class="card-action" type="button" data-action="read-notification" data-id="${escapeHTML(item.id)}">O‘qildi</button>` : ""}
            </article>
          `).join("") : emptyState("Bildirishnomalar yo‘q", "Yangi xabarlar shu yerda paydo bo‘ladi.", "bell")}
        </div>
      </section>
    `;
  }

  /* -------------------- PROFILE PAGE -------------------- */

  function renderProfile() {
    const rank = getRank();
    const profile = data.profile;
    const completedTasks = data.tasks.filter(task => task.completed).length;

    const backgroundStyles = {
      default: "linear-gradient(120deg,#5145cf,#9282f6)",
      midnight: "linear-gradient(120deg,#101827,#283958)",
      galaxy: "radial-gradient(circle at 80% 20%,#7256c9,#161b43 65%)",
      royal: "linear-gradient(120deg,#7c4a20,#d3a24b)"
    };

    const bg = backgroundStyles[profile.background] || backgroundStyles.default;

    return `
      <div class="profile-cover" style="background:${bg}"></div>

      <section class="profile-main-card">
        <div class="profile-avatar-wrap">
          <span class="avatar">
            ${profile.avatar
              ? `<img src="${escapeHTML(profile.avatar)}" alt="Profil rasmi">`
              : icon("user-round", 42)}
          </span>
          <button class="profile-edit-avatar" type="button" data-action="edit-profile" aria-label="Profilni tahrirlash">
            ${icon("pencil", 15)}
          </button>
        </div>

        <div class="profile-name">${escapeHTML(profile.name || "Foydalanuvchi")}</div>
        <div class="profile-username">@${escapeHTML(profile.username || "username")}</div>

        <p class="profile-bio">${escapeHTML(profile.bio || "Hali biografiya qo‘shilmagan.")}</p>

        <div class="profile-meta">
          ${profile.age !== null && profile.age !== undefined ? `<span>${icon("calendar")} ${profile.age} yosh</span>` : ""}
          <span>${icon("calendar-days")} ${escapeHTML(formatDate((profile.createdAt || "").slice(0, 10)))}</span>
          <span>${icon("check-circle")} ${completedTasks} ta vazifa</span>
        </div>

        <div class="profile-actions">
          <button class="primary-button" type="button" data-action="edit-profile">${icon("pencil", 15)} Profilni tahrirlash</button>
          <button class="secondary-button" type="button" data-action="share-profile">${icon("share-2", 15)} Profilni ulashish</button>
        </div>
      </section>

      <div class="dashboard-grid">
        <section class="level-card">
          <span class="section-label">SIZNING DARAJANGIZ</span>
          <div class="level-number">Level ${rank.level}</div>
          <div class="level-title">${escapeHTML(rank.name)}</div>
          <p class="level-description">
            Mukammal bo‘lish shart emas. Muhimi, har kuni oldinga yurish.
          </p>

          <div class="progress-track" style="margin-top:17px">
            <div class="progress-fill" style="width:${rank.progress}%"></div>
          </div>

          <div class="goal-footer">
            <span>${formatNumber(data.xp)} XP</span>
            <span>${rank.next ? `${formatNumber(rank.next.xp)} XP` : "MAX"}</span>
          </div>
        </section>

        <section class="card">
          <h3 class="card-title">Profil statistikasi</h3>
          <div class="setting-row">
            <div class="setting-info"><strong>Jami XP</strong></div>
            <strong>${formatNumber(data.xp)}</strong>
          </div>
          <div class="setting-row">
            <div class="setting-info"><strong>Bajarilgan vazifalar</strong></div>
            <strong>${completedTasks}</strong>
          </div>
          <div class="setting-row">
            <div class="setting-info"><strong>Yutuqlar</strong></div>
            <strong>${data.achievements.length}</strong>
          </div>
        </section>
      </div>

      <section class="card" style="margin-top:20px">
        <div class="card-header">
          <h3 class="card-title">Olingan badge’lar</h3>
          <button class="card-action" type="button" data-page="achievements">Barcha yutuqlar</button>
        </div>
        <div class="badge-grid">
          ${data.achievements.length
            ? data.achievements.map(id => {
                const achievement = ACHIEVEMENTS.find(item => item.id === id);
                return achievement ? `
                  <div class="achievement-card">
                    <div class="achievement-icon">${icon(achievement.icon, 22)}</div>
                    <strong>${escapeHTML(achievement.name)}</strong>
                  </div>
                ` : "";
              }).join("")
            : emptyState("Hali badge yo‘q", "Vazifalarni bajaring va yutuqlarni oching.", "award")}
        </div>
      </section>
    `;
  }

  /* -------------------- SETTINGS PAGE -------------------- */

  function renderSettings() {
    const age = data.profile.age;
    const difficulty = getDifficulty();

    return `
      ${pageHeader(
        "SHAXSIY MOSLAMALAR",
        "Sozlamalar",
        "SmartGoal’ni o‘zingizga moslang."
      )}

      <div class="settings-layout">
        <nav class="settings-nav" aria-label="Sozlamalar bo‘limlari">
          <button type="button" class="${currentSettingsTab === "general" ? "active" : ""}" data-settings-tab="general">${icon("sliders-horizontal")} Umumiy</button>
          <button type="button" class="${currentSettingsTab === "appearance" ? "active" : ""}" data-settings-tab="appearance">${icon("palette")} Ko‘rinish</button>
          <button type="button" class="${currentSettingsTab === "difficulty" ? "active" : ""}" data-settings-tab="difficulty">${icon("brain")} Murakkablik</button>
          <button type="button" class="${currentSettingsTab === "sound" ? "active" : ""}" data-settings-tab="sound">${icon("volume-2")} Ovoz</button>
          <button type="button" class="${currentSettingsTab === "data" ? "active" : ""}" data-settings-tab="data">${icon("database")} Ma’lumotlar</button>
        </nav>

        <div class="settings-panel">
          ${renderSettingsPanel(age, difficulty)}
        </div>
      </div>
    `;
  }

  function renderSettingsPanel(age, difficulty) {
    if (currentSettingsTab === "appearance") {
      return `
        <div class="settings-section">
          <h3>Interfeys ko‘rinishi</h3>
          <p>O‘zingizga qulay rang va mavzuni tanlang.</p>

          <div class="setting-row">
            <div class="setting-info"><strong>Kun / tun rejimi</strong><small>Interfeys ranglarini o‘zgartirish</small></div>
            <select class="field-select" style="max-width:150px" data-setting="theme">
              <option value="light" ${settings.theme === "light" ? "selected" : ""}>Yorug‘</option>
              <option value="dark" ${settings.theme === "dark" ? "selected" : ""}>Qorong‘i</option>
              <option value="system" ${settings.theme === "system" ? "selected" : ""}>Qurilma bo‘yicha</option>
            </select>
          </div>

          <div class="settings-section">
            <h3>Rang mavzusi</h3>
            <p>Ba’zi ranglar do‘kondan ochko evaziga olinadi.</p>
            <div class="theme-options">
              ${["violet", "ocean", "emerald", "sunset", "rose"].map(theme => {
                const free = theme === "violet";
                const owned = data.inventory.some(item => item.id === `theme-${theme}`);
                const available = free || owned;
                return `
                  <button type="button"
                    class="theme-option ${settings.colorTheme === theme ? "active" : ""}"
                    data-color-theme="${theme}"
                    data-action="${available ? "set-theme" : "locked-theme"}"
                    title="${theme}${available ? "" : " — do‘kondan xarid qiling"}">
                  </button>
                `;
              }).join("")}
            </div>
          </div>
        </div>
      `;
    }

    if (currentSettingsTab === "difficulty") {
      return `
        <div class="settings-section">
          <h3>Interfeys murakkabligi</h3>
          <p>Matnlar, tushuntirishlar va interfeysning murakkabligini o‘zingizga moslang.</p>

          <div class="setting-row">
            <div class="setting-info">
              <strong>Avtomatik tanlash</strong>
              <small>${age === null ? "Yosh aniqlanmagan" : `Tug‘ilgan sanangiz bo‘yicha yosh: ${age}`}</small>
            </div>
            <input type="radio" name="difficulty" value="auto" ${settings.difficulty === "auto" ? "checked" : ""}>
          </div>

          <div class="setting-row">
            <div class="setting-info"><strong>Kichik yoshdagilar uchun</strong><small>Sodda matnlar va tushunarli interfeys.</small></div>
            <input type="radio" name="difficulty" value="junior" ${settings.difficulty === "junior" ? "checked" : ""}>
          </div>

          <div class="setting-row">
            <div class="setting-info"><strong>Yuqori sinf va o‘smirlar uchun</strong><small>Muvozanatli, batafsilroq interfeys.</small></div>
            <input type="radio" name="difficulty" value="senior" ${settings.difficulty === "senior" ? "checked" : ""}>
          </div>

          <div class="setting-row">
            <div class="setting-info"><strong>Kattalar uchun</strong><small>Professional va batafsil interfeys.</small></div>
            <input type="radio" name="difficulty" value="adult" ${settings.difficulty === "adult" ? "checked" : ""}>
          </div>

          <p style="margin-top:15px">Hozirgi tanlov: <strong>${escapeHTML(difficulty)}</strong></p>
        </div>
      `;
    }

    if (currentSettingsTab === "sound") {
      return `
        <div class="settings-section">
          <h3>Ovoz va animatsiyalar</h3>
          <p>Bildirish va harakatlarni o‘zingizga moslang.</p>

          <div class="setting-row">
            <div class="setting-info"><strong>Ovoz effektlari</strong><small>Vazifa bajarilganda qisqa ovoz.</small></div>
            <button class="toggle ${settings.sound ? "active" : ""}" type="button" data-action="toggle-sound" aria-label="Ovoz sozlamasi"></button>
          </div>

          <div class="setting-row">
            <div class="setting-info"><strong>Kamaytirilgan animatsiya</strong><small>Harakatlar sonini kamaytirish.</small></div>
            <button class="toggle ${settings.reducedMotion ? "active" : ""}" type="button" data-action="toggle-motion" aria-label="Animatsiya sozlamasi"></button>
          </div>
        </div>
      `;
    }

    if (currentSettingsTab === "data") {
      return `
        <div class="settings-section">
          <h3>Ma’lumotlaringiz</h3>
          <p>Ma’lumotlarni zaxiralash yoki qayta tiklash.</p>

          <div class="setting-row">
            <div class="setting-info"><strong>Ma’lumotlarni eksport qilish</strong><small>Profil, vazifalar va maqsadlarni JSON faylga saqlash.</small></div>
            <button class="secondary-button" type="button" data-action="export-data">${icon("download")} Eksport</button>
          </div>

          <div class="setting-row">
            <div class="setting-info"><strong>Zaxira nusxasini tiklash</strong><small>Oldin saqlangan SmartGoal faylini yuklash.</small></div>
            <button class="secondary-button" type="button" data-action="import-data">${icon("upload")} Import</button>
          </div>

          <div class="setting-row">
            <div class="setting-info"><strong>Ma’lumotlarni tozalash</strong><small>Mahalliy demo ma’lumotlarini o‘chirish.</small></div>
            <button class="secondary-button" type="button" data-action="reset-data">${icon("trash-2")} Tozalash</button>
          </div>
        </div>
      `;
    }

    return `
      <div class="settings-section">
        <h3>Umumiy sozlamalar</h3>
        <p>Til va shaxsiy ma’lumotlar.</p>

        <div class="setting-row">
          <div class="setting-info"><strong>Interfeys tili</strong><small>SmartGoal tilini tanlang.</small></div>
          <select class="field-select" style="max-width:150px" data-setting="language">
            <option value="uz" ${settings.language === "uz" ? "selected" : ""}>O‘zbekcha</option>
            <option value="ru" ${settings.language === "ru" ? "selected" : ""}>Русский</option>
            <option value="en" ${settings.language === "en" ? "selected" : ""}>English</option>
          </select>
        </div>

        <div class="setting-row">
          <div class="setting-info"><strong>Ism va familiya</strong><small>${escapeHTML(data.profile.name)}</small></div>
          <button class="secondary-button" type="button" data-action="edit-profile">Tahrirlash</button>
        </div>

        <div class="setting-row">
          <div class="setting-info"><strong>Username</strong><small>@${escapeHTML(data.profile.username || "username")}</small></div>
          <button class="secondary-button" type="button" data-action="edit-profile">Tahrirlash</button>
        </div>

        <div class="setting-row">
          <div class="setting-info"><strong>Tug‘ilgan sana</strong><small>${data.profile.birthdate ? escapeHTML(formatDate(data.profile.birthdate)) : "Kiritilmagan"}</small></div>
          <button class="secondary-button" type="button" data-action="edit-birthdate">O‘zgartirish</button>
        </div>
      </div>
    `;
  }

  function openBirthdateEditor() {
    openModal(
      "Tug‘ilgan sanani o‘zgartirish",
      `
        <form id="birthdate-form">
          <label class="field-label" for="new-birthdate">Tug‘ilgan sana</label>
          <input class="field-input" id="new-birthdate" name="birthdate"
            type="date" max="${today()}" required
            value="${escapeHTML(data.profile.birthdate || "")}">
        </form>
      `,
      `
        <button class="secondary-button" type="button" data-action="close-modal">Bekor qilish</button>
        <button class="primary-button" type="submit" form="birthdate-form">Saqlash</button>
      `
    );
  }

  /* -------------------- DATA EXPORT / IMPORT -------------------- */

  function exportData() {
    const backup = {
      exportedAt: new Date().toISOString(),
      data,
      settings
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `smartgoal-backup-${today()}.json`;
    link.click();

    URL.revokeObjectURL(url);
    showToast("Zaxira fayli tayyorlandi.");
  }

  function importData() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";

    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        showToast("Fayl hajmi 5 MB dan oshmasligi kerak.", "error");
        return;
      }

      try {
        const backup = safeJSON(await file.text(), null);
        const imported = backup?.data || backup;

        if (!imported || !Array.isArray(imported.tasks) || !Array.isArray(imported.goals)) {
          throw new Error("Invalid backup");
        }

        data = {
          ...createInitialData(),
          ...imported,
          profile: { ...createInitialData().profile, ...(imported.profile || {}) }
        };

        if (backup.settings) {
          settings = { ...DEFAULT_SETTINGS, ...backup.settings };
          saveSettings();
        }

        saveData();
        updateProfileDisplay();
        render();
        showToast("Ma’lumotlar tiklandi.");
      } catch {
        showToast("Bu SmartGoal zaxira fayli emas yoki buzilgan.", "error");
      }
    });

    input.click();
  }

  function resetData() {
    openModal(
      "Ma’lumotlarni tozalash",
      "<p>Barcha mahalliy ma’lumotlar, XP, vazifalar va maqsadlar o‘chiriladi. Bu amalni ortga qaytarib bo‘lmaydi.</p>",
      `
        <button class="secondary-button" type="button" data-action="close-modal">Bekor qilish</button>
        <button class="primary-button" type="button" data-action="confirm-reset">Barchasini o‘chirish</button>
      `
    );
  }

  /* -------------------- SEARCH -------------------- */

  function toggleSearch(show) {
    const search = $("#global-search");
    if (!search) return;

    search.classList.toggle("hidden", show === false ? true : !search.classList.contains("hidden"));

    if (!search.classList.contains("hidden")) {
      $("#global-search-input")?.focus();
    }
  }

  function runGlobalSearch(value) {
    const query = String(value || "").trim().toLowerCase();
    if (!query) return;

    const task = data.tasks.find(item => item.title.toLowerCase().includes(query));
    if (task) {
      navigate("schedule");
      showToast(`Vazifa topildi: ${task.title}`);
      return;
    }

    const goal = data.goals.find(item => item.title.toLowerCase().includes(query));
    if (goal) {
      navigate("goals");
      showToast(`Maqsad topildi: ${goal.title}`);
      return;
    }

    navigate("community");
    const communityInput = $("#community-search");
    if (communityInput) {
      communityInput.value = value;
      communityInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  /* -------------------- NAVIGATION -------------------- */

  function navigate(page) {
    if (!PAGE_TITLES[page]) return;

    currentPage = page;

    $$(".nav-link").forEach(button => {
      button.classList.toggle("active", button.dataset.page === page);
    });

    const title = $("#page-title");
    if (title) title.textContent = PAGE_TITLES[page];

    $("#sidebar")?.classList.remove("open");
    render();
  }

  /* -------------------- RENDER -------------------- */

  function render() {
    const content = $("#content");
    if (!content) return;

    const pages = {
      dashboard: renderDashboard,
      goals: renderGoals,
      schedule: renderSchedule,
      planner: renderPlanner,
      analytics: renderAnalytics,
      achievements: renderAchievements,
      rewards: renderRewards,
      community: renderCommunity,
      ai: renderAI,
      notifications: renderNotifications,
      settings: renderSettings,
      profile: renderProfile
    };

    content.innerHTML = (pages[currentPage] || renderDashboard)();

    updateProfileDisplay();
    updateSidebarPoints();
    updateNotificationIndicators();
    updateCurrentDate();
    refreshIcons();
  }

  function updateSidebarPoints() {
    const element = $("#sidebar-xp");
    if (element) element.textContent = `${formatNumber(data.xp)} XP`;
  }

  function updateNotificationIndicators() {
    const count = unreadCount();
    const dot = $("#notification-dot");
    const indicator = $(".notification-indicator");

    if (dot) dot.style.display = count ? "block" : "none";
    if (indicator) indicator.style.display = count ? "block" : "none";
  }

  function updateCurrentDate() {
    const element = $("#current-date");
    if (!element) return;

    element.textContent = new Date().toLocaleDateString(getLocale(), {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  /* -------------------- EVENT HANDLING -------------------- */

  function handleClick(event) {
    const pageButton = event.target.closest("[data-page]");
    if (pageButton) {
      event.preventDefault();
      navigate(pageButton.dataset.page);
      return;
    }

    const authTab = event.target.closest("[data-auth-tab]");
    if (authTab) {
      switchAuthTab(authTab.dataset.authTab);
      return;
    }

    const settingsTab = event.target.closest("[data-settings-tab]");
    if (settingsTab) {
      currentSettingsTab = settingsTab.dataset.settingsTab;
      render();
      return;
    }

    const actionElement = event.target.closest("[data-action]");
    if (!actionElement) return;

    const action = actionElement.dataset.action;
    const id = actionElement.dataset.id;

    switch (action) {
      case "add-goal":
        openGoalForm();
        break;
      case "edit-goal":
        openGoalForm(id);
        break;
      case "delete-goal":
        deleteGoal(id);
        break;
      case "confirm-delete-goal":
        data.goals = data.goals.filter(item => item.id !== id);
        saveData();
        closeModal();
        render();
        showToast("Maqsad o‘chirildi.");
        break;

      case "add-task":
        openTaskForm();
        break;
      case "edit-task":
        openTaskForm(id);
        break;
      case "delete-task":
        deleteTask(id);
        break;
      case "confirm-delete-task":
        data.tasks = data.tasks.filter(item => item.id !== id);
        saveData();
        closeModal();
        render();
        showToast("Vazifa o‘chirildi.");
        break;

      case "edit-profile":
        openProfileEditor();
        break;
      case "share-profile":
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(`${location.origin}/@${data.profile.username || ""}`)
            .then(() => showToast("Profil havolasi nusxalandi."))
            .catch(() => showToast("Havolani nusxalab bo‘lmadi.", "error"));
        } else {
          showToast(`Username: @${data.profile.username}`);
        }
        break;

      case "add-memory":
        openMemoryForm();
        break;
      case "delete-memory":
        data.memories = data.memories.filter(item => item.id !== id);
        saveData();
        render();
        showToast("Xotira o‘chirildi.");
        break;

      case "buy-item":
        purchaseItem(id);
        break;
      case "confirm-purchase":
        confirmPurchase(id);
        break;
      case "use-item":
        useItem(id);
        break;
      case "set-theme":
        settings.colorTheme = actionElement.dataset.colorTheme;
        saveSettings();
        render();
        showToast("Rang mavzusi o‘zgartirildi.");
        break;
      case "locked-theme":
        navigate("rewards");
        showToast("Bu mavzuni avval do‘kondan xarid qiling.");
        break;

      case "toggle-sound":
        settings.sound = !settings.sound;
        saveSettings();
        render();
        showToast(settings.sound ? "Ovoz yoqildi." : "Ovoz o‘chirildi.");
        break;
      case "toggle-motion":
        settings.reducedMotion = !settings.reducedMotion;
        saveSettings();
        render();
        break;

      case "export-data":
        exportData();
        break;
      case "import-data":
        importData();
        break;
      case "reset-data":
        resetData();
        break;
      case "confirm-reset":
        data = createInitialData();
        saveData();
        closeModal();
        render();
        showToast("Mahalliy ma’lumotlar tozalandi.");
        break;

      case "edit-birthdate":
        openBirthdateEditor();
        break;

      case "mark-all-read":
        data.notifications.forEach(item => item.read = true);
        saveData();
        render();
        break;
      case "read-notification": {
        const notification = data.notifications.find(item => item.id === id);
        if (notification) notification.read = true;
        saveData();
        render();
        break;
      }

      case "close-modal":
        closeModal();
        break;
      case "close-toast":
        $("#toast")?.classList.add("hidden");
        break;
      case "open-sidebar":
        $("#sidebar")?.classList.add("open");
        break;
      case "close-sidebar":
        $("#sidebar")?.classList.remove("open");
        break;
      case "toggle-search":
        toggleSearch();
        break;
      case "close-search":
        $("#global-search")?.classList.add("hidden");
        break;
      case "logout":
        logout();
        break;
      case "forgot-password":
        showToast("Parolni tiklash backend ulanganda qo‘shiladi.");
        break;
      case "toggle-password": {
        const input = document.getElementById(actionElement.dataset.target);
        if (!input) break;
        input.type = input.type === "password" ? "text" : "password";
        break;
      }
    }
  }

  function handleChange(event) {
    const target = event.target;

    if (target.matches("[data-action='toggle-task']")) {
      toggleTask(target.dataset.id);
      return;
    }

    if (target.matches("[data-setting]")) {
      const key = target.dataset.setting;
      if (!["language", "theme"].includes(key)) return;

      settings[key] = target.value;
      saveSettings();
      render();
      return;
    }

    if (target.matches("input[name='difficulty']")) {
      settings.difficulty = target.value;
      saveSettings();
      render();
      showToast("Interfeys murakkabligi yangilandi.");
      return;
    }
  }

  function handleSubmit(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    switch (form.id) {
      case "login-form":
        event.preventDefault();
        loginLocal(form);
        break;
      case "register-form":
        event.preventDefault();
        registerLocal(form);
        break;
      case "profile-form":
        event.preventDefault();
        saveProfile(form);
        break;
      case "goal-form":
        event.preventDefault();
        saveGoal(form);
        break;
      case "task-form":
        event.preventDefault();
        saveTask(form);
        break;
      case "memory-form":
        event.preventDefault();
        saveMemory(form);
        break;
      case "birthdate-form": {
        event.preventDefault();
        const birthdate = String(new FormData(form).get("birthdate") || "");
        const age = calculateAge(birthdate);

        if (age === null) {
          showToast("Tug‘ilgan sanani tekshiring.", "error");
          return;
        }

        data.profile.birthdate = birthdate;
        data.profile.age = age;
        saveData();
        closeModal();
        render();
        showToast("Tug‘ilgan sana yangilandi.");
        break;
      }
      case "ai-form":
        event.preventDefault();
        sendAIMessage(form);
        break;
    }
  }

  function handleInput(event) {
    const target = event.target;

    if (target.id === "global-search-input" && event.key === "Enter") {
      runGlobalSearch(target.value);
    }

    if (target.id === "community-search") {
      const query = normalizedUsername(target.value);
      const results = $("#community-results");
      if (!results) return;

      if (!query) {
        results.innerHTML = emptyState("Qidiruvga tayyor", "Username kiriting.", "users");
      } else if (query === data.profile.username) {
        results.innerHTML = `
          <div class="user-item">
            <span class="avatar avatar-medium">${data.profile.avatar ? `<img src="${escapeHTML(data.profile.avatar)}" alt="">` : icon("user-round")}</span>
            <div class="user-item-info">
              <strong>${escapeHTML(data.profile.name)}</strong>
              <small>@${escapeHTML(data.profile.username)} · Sizning profilingiz</small>
            </div>
            <span class="user-rank">Level ${getRank().level}</span>
          </div>
        `;
        refreshIcons();
      } else {
        results.innerHTML = emptyState(
          "Foydalanuvchi topilmadi",
          "Haqiqiy foydalanuvchilarni qidirish uchun backend va hamjamiyat tizimi ulanishi kerak.",
          "user-search"
        );
      }
    }
  }

  /* -------------------- INITIALIZATION -------------------- */

  function initializeSmartGoal() {
    applySettings();

    const maxDate = $("#register-birthdate");
    if (maxDate) maxDate.max = today();

    const session = localStorage.getItem(SESSION_KEY);

    if (session && data.profile.name && data.profile.name !== "SmartGoal foydalanuvchisi") {
      showApplication();
    } else {
      showAuthentication();
      switchAuthTab("login");
    }

    updateProfileDisplay();
    refreshIcons();
  }

  function syncSmartGoalData() {
    // Backend synchronization will be implemented in the next integration stage.
    saveData();
    render();
  }

  function attachEvents() {
    document.addEventListener("click", handleClick);
    document.addEventListener("change", handleChange);
    document.addEventListener("submit", handleSubmit);
    document.addEventListener("keydown", handleInput);

    document.addEventListener("input", event => {
      if (event.target.id === "community-search") handleInput(event);
    });

    $("#modal-overlay")?.addEventListener("click", event => {
      if (event.target.id === "modal-overlay") closeModal();
    });

    window.addEventListener("storage", event => {
      if (event.key === DATA_KEY) {
        data = loadData();
        render();
      }

      if (event.key === SETTINGS_KEY) {
        settings = loadSettings();
        applySettings();
        render();
      }
    });

    window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
      if (settings.theme === "system") applySettings();
    });
  }

  /* -------------------- PUBLIC API -------------------- */

  window.render = render;
  window.initializeSmartGoal = initializeSmartGoal;
  window.syncSmartGoalData = syncSmartGoalData;

  window.SmartGoal = {
    getData: () => structuredClone(data),
    getSettings: () => ({ ...settings }),
    getRank,
    calculateAge,
    navigate,
    addXP,
    render
  };

  /* -------------------- START -------------------- */

  function start() {
    attachEvents();
    checkAchievements();
    initializeSmartGoal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

})();