// Default student preferences state
const DEFAULT_PREFERENCES = {
  fullName: "Jordan Smith",
  username: "jordansmith",
  email: "jordan.smith@university.edu",
  academicMajor: "cs",
  bio: "Preparing for Midterm Exams, focusing on Distributed Systems & Linear Algebra.",
  dailyStudyGoal: "4.0",
  pomodoroLength: "50",
  primaryExamDate: getFutureDate(14), // 2 weeks out default
  weeklyStudyPace: "25",
  notifyDesktop: true,
  notifyEmailDaily: true,
  streakProtection: true,
  themeSelect: "theme-dark",
  accentColor: "#6366f1"
};

// Form element handles
const form = document.getElementById("studyPlannerSettingsForm");
const fullNameInput = document.getElementById("fullName");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const academicMajorInput = document.getElementById("academicMajor");
const bioInput = document.getElementById("bio");
const bioCounter = document.getElementById("bioCounter");

const dailyStudyGoalInput = document.getElementById("dailyStudyGoal");
const pomodoroLengthInput = document.getElementById("pomodoroLength");
const primaryExamDateInput = document.getElementById("primaryExamDate");
const weeklyStudyPaceInput = document.getElementById("weeklyStudyPace");
const weeklyStudyPaceVal = document.getElementById("weeklyStudyPaceVal");

const notifyDesktopInput = document.getElementById("notifyDesktop");
const notifyEmailDailyInput = document.getElementById("notifyEmailDaily");
const streakProtectionInput = document.getElementById("streakProtection");

const themeSelect = document.getElementById("themeSelect");
const accentColorInput = document.getElementById("accentColor");
const accentColorCode = document.getElementById("accentColorCode");

const statusDot = document.querySelector(".status-dot");
const statusText = document.querySelector(".status-text");
const saveBtn = document.getElementById("saveBtn");
const headerSaveBtn = document.getElementById("headerSaveBtn");
const discardBtn = document.getElementById("discardBtn");
const resetDefaultsBtn = document.getElementById("resetDefaultsBtn");
const toastContainer = document.getElementById("toastContainer");

// Profile elements in sidebar
const sidebarFullName = document.getElementById("sidebarFullName");
const sidebarUsername = document.getElementById("sidebarUsername");
const sidebarAvatar = document.getElementById("sidebarAvatar");

// LocalStorage key
const STORAGE_KEY = "studyplanner_settings_v1";

// Helper: Calculate YYYY-MM-DD for date inputs
function getFutureDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split("T")[0];
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

// Validation rules definition
const validators = {
  fullName: (val) => {
    const trimmed = (val || "").trim();
    if (!trimmed) return "Full Name is required.";
    if (trimmed.length < 3) return "Name must be at least 3 characters.";
    if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) return "Only alphabetic letters, spaces, hyphens, and apostrophes allowed.";
    return null;
  },
  username: (val) => {
    const trimmed = (val || "").trim();
    if (!trimmed) return "Username is required.";
    if (trimmed.length < 3 || trimmed.length > 20) return "Username must be between 3 and 20 characters.";
    if (!/^[a-z0-9_]+$/.test(trimmed)) return "Use lowercase alphanumeric characters or underscores only.";
    return null;
  },
  email: (val) => {
    const trimmed = (val || "").trim();
    if (!trimmed) return "Email address is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) return "Please enter a valid student email address.";
    return null;
  },
  academicMajor: (val) => {
    if (!val) return "Please choose your discipline / field of study.";
    return null;
  },
  dailyStudyGoal: (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return "Target hours must be a number.";
    if (num < 0.5 || num > 16) return "Target must be between 0.5 and 16 hours daily.";
    return null;
  },
  primaryExamDate: (val) => {
    if (!val) return "Milestone or exam target date is required.";
    const today = getTodayDate();
    if (val < today) return "Target milestone date cannot be in the past.";
    return null;
  },
  bio: (val) => {
    if (val && val.length > 160) return "Bio cannot exceed 160 characters.";
    return null;
  }
};

// Check individual field
function validateField(name, element) {
  const validator = validators[name];
  if (!validator) return true;

  const error = validator(element.value);
  const formGroup = element.closest(".form-group");
  const errorEl = document.getElementById(`${name}Error`);

  if (error) {
    if (formGroup) {
      formGroup.classList.add("has-error");
      formGroup.classList.remove("is-valid");
    }
    if (errorEl) errorEl.textContent = error;
    return false;
  } else {
    if (formGroup) {
      formGroup.classList.remove("has-error");
      formGroup.classList.add("is-valid");
    }
    if (errorEl) errorEl.textContent = "";
    return true;
  }
}

// Validate whole form
function validateAll() {
  const fields = [
    { name: "fullName", el: fullNameInput },
    { name: "username", el: usernameInput },
    { name: "email", el: emailInput },
    { name: "academicMajor", el: academicMajorInput },
    { name: "dailyStudyGoal", el: dailyStudyGoalInput },
    { name: "primaryExamDate", el: primaryExamDateInput },
    { name: "bio", el: bioInput }
  ];

  let isValid = true;
  let firstInvalidEl = null;

  fields.forEach(({ name, el }) => {
    const fieldValid = validateField(name, el);
    if (!fieldValid) {
      isValid = false;
      if (!firstInvalidEl) firstInvalidEl = el;
    }
  });

  if (!isValid && firstInvalidEl) {
    firstInvalidEl.focus();
  }

  return isValid;
}

// Mark form dirty / touched state
function markDirty() {
  statusDot.className = "status-dot dirty";
  statusText.textContent = "Unsaved changes";
}

function markSaved() {
  statusDot.className = "status-dot";
  statusText.textContent = "All changes saved locally";
}

// Apply visual theme & accent
function applyTheme(themeName) {
  document.body.className = themeName;
}

function applyAccentColor(hexColor) {
  document.documentElement.style.setProperty("--primary-accent", hexColor);
  accentColorCode.textContent = hexColor;

  // convert hex to rgb for rgba CSS variables
  const r = parseInt(hexColor.slice(1, 3), 16) || 99;
  const g = parseInt(hexColor.slice(3, 5), 16) || 102;
  const b = parseInt(hexColor.slice(5, 7), 16) || 241;
  document.documentElement.style.setProperty("--primary-accent-rgb", `${r}, ${g}, ${b}`);
}

// Update avatar and labels in sidebar
function updateSidebarInfo(fullName, username) {
  sidebarFullName.textContent = fullName || "Student";
  sidebarUsername.textContent = username ? `@${username}` : "@student";

  const initials = (fullName || "")
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  sidebarAvatar.textContent = initials || "SP";
}

// Populate form with object
function populateForm(data) {
  fullNameInput.value = data.fullName || "";
  usernameInput.value = data.username || "";
  emailInput.value = data.email || "";
  academicMajorInput.value = data.academicMajor || "";
  bioInput.value = data.bio || "";
  bioCounter.textContent = `${(data.bio || "").length} / 160`;

  dailyStudyGoalInput.value = data.dailyStudyGoal || "4.0";
  pomodoroLengthInput.value = data.pomodoroLength || "50";
  primaryExamDateInput.value = data.primaryExamDate || getFutureDate(14);
  primaryExamDateInput.min = getTodayDate(); // prevent past dates on calendar UI
  weeklyStudyPaceInput.value = data.weeklyStudyPace || "25";
  weeklyStudyPaceVal.textContent = `${data.weeklyStudyPace || "25"} hrs / week`;

  notifyDesktopInput.checked = !!data.notifyDesktop;
  notifyEmailDailyInput.checked = !!data.notifyEmailDaily;
  streakProtectionInput.checked = !!data.streakProtection;

  themeSelect.value = data.themeSelect || "theme-dark";
  applyTheme(themeSelect.value);

  accentColorInput.value = data.accentColor || "#6366f1";
  applyAccentColor(accentColorInput.value);

  updateSidebarInfo(data.fullName, data.username);
  clearValidationState();
}

// Extract form data object
function serializeForm() {
  return {
    fullName: fullNameInput.value.trim(),
    username: usernameInput.value.trim(),
    email: emailInput.value.trim(),
    academicMajor: academicMajorInput.value,
    bio: bioInput.value.trim(),
    dailyStudyGoal: dailyStudyGoalInput.value,
    pomodoroLength: pomodoroLengthInput.value,
    primaryExamDate: primaryExamDateInput.value,
    weeklyStudyPace: weeklyStudyPaceInput.value,
    notifyDesktop: notifyDesktopInput.checked,
    notifyEmailDaily: notifyEmailDailyInput.checked,
    streakProtection: streakProtectionInput.checked,
    themeSelect: themeSelect.value,
    accentColor: accentColorInput.value
  };
}

// Clear visual feedback
function clearValidationState() {
  document.querySelectorAll(".form-group").forEach((group) => {
    group.classList.remove("has-error", "is-valid");
  });
  document.querySelectorAll(".error-msg").forEach((msg) => {
    msg.textContent = "";
  });
}

// Toast notification helper
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      ${
        type === "success"
          ? '<polyline points="20 6 9 17 4 12"/>'
          : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
      }
    </svg>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Save action
function handleSave() {
  if (!validateAll()) {
    showToast("Please correct the highlighted form errors.", "error");
    statusDot.className = "status-dot error";
    statusText.textContent = "Validation failed";
    return;
  }

  saveBtn.classList.add("loading");
  saveBtn.disabled = true;

  setTimeout(() => {
    const data = serializeForm();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    updateSidebarInfo(data.fullName, data.username);
    markSaved();
    showToast("StudyPlanner settings successfully saved!", "success");

    saveBtn.classList.remove("loading");
    saveBtn.disabled = false;
  }, 450);
}

// Event Listeners
function initEvents() {
  // Realtime blur / input validation
  const watchedFields = [
    { name: "fullName", el: fullNameInput },
    { name: "username", el: usernameInput },
    { name: "email", el: emailInput },
    { name: "academicMajor", el: academicMajorInput },
    { name: "dailyStudyGoal", el: dailyStudyGoalInput },
    { name: "primaryExamDate", el: primaryExamDateInput }
  ];

  watchedFields.forEach(({ name, el }) => {
    el.addEventListener("blur", () => {
      validateField(name, el);
    });

    el.addEventListener("input", () => {
      markDirty();
      if (el.closest(".form-group").classList.contains("has-error")) {
        validateField(name, el);
      }
    });
  });

  // Bio counter
  bioInput.addEventListener("input", () => {
    markDirty();
    bioCounter.textContent = `${bioInput.value.length} / 160`;
  });

  // Weekly range display
  weeklyStudyPaceInput.addEventListener("input", (e) => {
    markDirty();
    weeklyStudyPaceVal.textContent = `${e.target.value} hrs / week`;
  });

  // Toggles and selects mark dirty
  [notifyDesktopInput, notifyEmailDailyInput, streakProtectionInput, pomodoroLengthInput].forEach((el) => {
    el.addEventListener("change", markDirty);
  });

  // Theme switch
  themeSelect.addEventListener("change", (e) => {
    markDirty();
    applyTheme(e.target.value);
  });

  // Accent color
  accentColorInput.addEventListener("input", (e) => {
    markDirty();
    applyAccentColor(e.target.value);
  });

  // Form submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSave();
  });

  // Header quick save button
  headerSaveBtn.addEventListener("click", () => {
    handleSave();
  });

  // Discard changes
  discardBtn.addEventListener("click", () => {
    loadSavedSettings();
    showToast("Unsaved changes discarded.", "success");
    markSaved();
  });

  // Reset to default settings
  resetDefaultsBtn.addEventListener("click", () => {
    if (confirm("Reset all settings back to default StudyPlanner values?")) {
      populateForm(DEFAULT_PREFERENCES);
      markDirty();
      showToast("Settings reset to defaults. Click 'Save' to confirm.", "success");
    }
  });
}

// Load initial state
function loadSavedSettings() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      populateForm({ ...DEFAULT_PREFERENCES, ...parsed });
      markSaved();
      return;
    } catch (e) {
      console.error("Error reading saved settings:", e);
    }
  }
  populateForm(DEFAULT_PREFERENCES);
  markSaved();
}

// Initialize on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  loadSavedSettings();
  initEvents();
});
