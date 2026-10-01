/**
 * StudyPlanner Settings Controller
 * Handles user interactions, avatar management, live validation,
 * accessibility attributes, notification permissions, and persistent saving.
 */

import {
  validateAllSettings,
  validateName,
  validateEmail,
  validatePasswordChange,
  validateStudyReminders,
  validateBreakAndTargets,
  validateAvatar
} from "./validator.js";

// Preset Avatar SVG Assets (Data URLs)
export const PRESET_AVATARS = {
  "preset-1": {
    id: "preset-1",
    name: "Scholar Blue",
    dataUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='50' fill='%233b82f6'/><circle cx='50' cy='38' r='20' fill='%23eff6ff'/><path d='M22 84c0-16 12-28 28-28s28 12 28 28' fill='%23bfdbfe'/><path d='M35 32h30v4H35z' fill='%231e3a8a'/><polygon points='50,18 25,32 75,32' fill='%231d4ed8'/></svg>"
  },
  "preset-2": {
    id: "preset-2",
    name: "Emerald Scientist",
    dataUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='50' fill='%2310b981'/><circle cx='50' cy='38' r='20' fill='%23ecfdf5'/><path d='M22 84c0-16 12-28 28-28s28 12 28 28' fill='%23a7f3d0'/><circle cx='42' cy='38' r='3' fill='%23065f46'/><circle cx='58' cy='38' r='3' fill='%23065f46'/><path d='M46 45q4 4 8 0' stroke='%23065f46' stroke-width='2' fill='none'/></svg>"
  },
  "preset-3": {
    id: "preset-3",
    name: "Violet Analyst",
    dataUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='50' fill='%238b5cf6'/><circle cx='50' cy='38' r='20' fill='%23f5f3ff'/><path d='M22 84c0-16 12-28 28-28s28 12 28 28' fill='%23ddd6fe'/><circle cx='43' cy='36' r='5' fill='none' stroke='%234c1d95' stroke-width='2'/><circle cx='57' cy='36' r='5' fill='none' stroke='%234c1d95' stroke-width='2'/><line x1='48' y1='36' x2='52' y2='36' stroke='%234c1d95' stroke-width='2'/></svg>"
  },
  "preset-4": {
    id: "preset-4",
    name: "Amber Thinker",
    dataUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='50' fill='%23f59e0b'/><circle cx='50' cy='38' r='20' fill='%23fffbeb'/><path d='M22 84c0-16 12-28 28-28s28 12 28 28' fill='%23fde68a'/><circle cx='43' cy='38' r='3' fill='%2378350f'/><circle cx='57' cy='38' r='3' fill='%2378350f'/><path d='M44 46q6 4 12 0' stroke='%2378350f' stroke-width='2' fill='none'/></svg>"
  },
  "preset-5": {
    id: "preset-5",
    name: "Rose Researcher",
    dataUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='50' fill='%23f43f5e'/><circle cx='50' cy='38' r='20' fill='%23fff1f2'/><path d='M22 84c0-16 12-28 28-28s28 12 28 28' fill='%23fecdd3'/><circle cx='42' cy='37' r='3' fill='%23881337'/><circle cx='58' cy='37' r='3' fill='%23881337'/><ellipse cx='50' cy='46' rx='5' ry='3' fill='%23881337'/></svg>"
  }
};

// Storage Keys
const SETTINGS_STORAGE_KEY = "studyplanner_settings_v2";
const PASSWORD_STORAGE_KEY = "studyplanner_pwd_v2";

// Default Profile Settings
export const DEFAULT_SETTINGS = {
  fullName: "Alex Morgan",
  email: "alex.morgan@university.edu",
  avatarType: "preset",
  presetId: "preset-1",
  customAvatarDataUrl: null,
  reminderEnabled: true,
  reminderTime: "08:30",
  reminderDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  dailyTargetHours: "4.5",
  studyIntervalMinutes: "45",
  shortBreakMinutes: "10",
  longBreakMinutes: "25",
  notifyDesktop: true,
  notifyEmailDigest: true,
  notifySound: true
};

export const INITIAL_DEFAULT_PASSWORD = "StudyPass123!";

/**
 * Controller class managing DOM state and events
 */
export class SettingsController {
  constructor(root = (typeof document !== "undefined" ? document : null)) {
    this.root = root;
    this.isSubmitting = false;
    this.currentAvatarState = {
      type: "preset",
      presetId: "preset-1",
      customDataUrl: null,
      customFileName: null,
      customFile: null
    };

    if (this.root) {
      this.initElements();
      this.initAvatars();
      this.loadState();
      this.attachEvents();
      this.checkNotificationPermission();
    }
  }

  getWindow() {
    if (this.root && this.root.defaultView) {
      return this.root.defaultView;
    }
    if (typeof window !== "undefined") {
      return window;
    }
    return typeof globalThis !== "undefined" ? globalThis : null;
  }

  getStorage() {
    const win = this.getWindow();
    if (win && win.localStorage) {
      return win.localStorage;
    }
    if (typeof localStorage !== "undefined") {
      return localStorage;
    }
    return null;
  }

  initElements() {
    this.form = this.root.getElementById("settingsForm");
    this.fullNameInput = this.root.getElementById("fullName");
    this.emailInput = this.root.getElementById("email");

    // Passwords
    this.currentPasswordInput = this.root.getElementById("currentPassword");
    this.newPasswordInput = this.root.getElementById("newPassword");
    this.confirmPasswordInput = this.root.getElementById("confirmPassword");

    // Reminders
    this.reminderEnabledCheckbox = this.root.getElementById("reminderEnabled");
    this.reminderDetailsPanel = this.root.getElementById("reminderDetailsPanel");
    this.reminderTimeInput = this.root.getElementById("reminderTime");
    this.reminderDayInputs = Array.from(this.root.querySelectorAll('input[name="reminderDays"]'));

    // Targets & Breaks
    this.dailyTargetInput = this.root.getElementById("dailyTargetHours");
    this.studyIntervalInput = this.root.getElementById("studyIntervalMinutes");
    this.shortBreakInput = this.root.getElementById("shortBreakMinutes");
    this.longBreakInput = this.root.getElementById("longBreakMinutes");

    // Notifications
    this.notifyDesktopCheckbox = this.root.getElementById("notifyDesktop");
    this.notifyEmailDigestCheckbox = this.root.getElementById("notifyEmailDigest");
    this.notifySoundCheckbox = this.root.getElementById("notifySound");
    this.requestPermissionBtn = this.root.getElementById("requestPermissionBtn");
    this.permissionBadge = this.root.getElementById("permissionBadge");
    this.permissionBadgeText = this.root.getElementById("permissionBadgeText");

    // Avatars
    this.activeAvatarImg = this.root.getElementById("activeAvatarImg");
    this.avatarSourcePill = this.root.getElementById("avatarSourcePill");
    this.presetRadios = Array.from(this.root.querySelectorAll('input[name="avatarChoice"]'));
    this.avatarFileInput = this.root.getElementById("avatarFileInput");
    this.resetAvatarBtn = this.root.getElementById("resetAvatarBtn");

    // Sidebar Displays
    this.sidebarAvatarImg = this.root.getElementById("sidebarAvatarImg");
    this.sidebarName = this.root.getElementById("sidebarName");
    this.sidebarEmail = this.root.getElementById("sidebarEmail");

    // Banners & Live Announcement
    this.saveSuccessBanner = this.root.getElementById("saveSuccessBanner");
    this.saveErrorBanner = this.root.getElementById("saveErrorBanner");
    this.saveErrorSummary = this.root.getElementById("saveErrorSummary");
    this.dismissSuccessBtn = this.root.getElementById("dismissSuccessBtn");
    this.dismissErrorBtn = this.root.getElementById("dismissErrorBtn");
    this.liveAnnouncer = this.root.getElementById("liveAnnouncer");
    this.toastContainer = this.root.getElementById("toastContainer");

    // Action Buttons
    this.saveBtn = this.root.getElementById("saveSettingsBtn");
    this.saveBtnText = this.root.getElementById("saveBtnText");
    this.btnSpinner = this.saveBtn ? this.saveBtn.querySelector(".btn-spinner") : null;
    this.normalIcon = this.saveBtn ? this.saveBtn.querySelector(".normal-icon") : null;
    this.discardBtn = this.root.getElementById("discardChangesBtn");
    this.resetDefaultsBtn = this.root.getElementById("resetDefaultsBtn");
  }

  initAvatars() {
    // Populate preset thumbnail images in the UI
    const presetThumbs = this.root.querySelectorAll(".preset-thumb-img");
    presetThumbs.forEach((img) => {
      const presetKey = img.getAttribute("data-preset");
      if (PRESET_AVATARS[presetKey]) {
        img.src = PRESET_AVATARS[presetKey].dataUrl;
      }
    });
  }

  getStoredPassword() {
    try {
      const storage = this.getStorage();
      return (storage && storage.getItem(PASSWORD_STORAGE_KEY)) || INITIAL_DEFAULT_PASSWORD;
    } catch {
      return INITIAL_DEFAULT_PASSWORD;
    }
  }

  setStoredPassword(pwd) {
    try {
      const storage = this.getStorage();
      if (storage) {
        storage.setItem(PASSWORD_STORAGE_KEY, pwd);
      }
    } catch (e) {
      console.warn("Storage write error", e);
    }
  }

  loadState() {
    let settings = DEFAULT_SETTINGS;
    try {
      const storage = this.getStorage();
      const stored = storage ? storage.getItem(SETTINGS_STORAGE_KEY) : null;
      if (stored) {
        settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      settings = DEFAULT_SETTINGS;
    }

    this.applySettingsToForm(settings);
  }

  applySettingsToForm(settings) {
    if (this.fullNameInput) this.fullNameInput.value = settings.fullName;
    if (this.emailInput) this.emailInput.value = settings.email;

    // Reset password inputs
    if (this.currentPasswordInput) this.currentPasswordInput.value = "";
    if (this.newPasswordInput) this.newPasswordInput.value = "";
    if (this.confirmPasswordInput) this.confirmPasswordInput.value = "";

    // Study Reminders
    if (this.reminderEnabledCheckbox) {
      this.reminderEnabledCheckbox.checked = Boolean(settings.reminderEnabled);
      this.updateReminderPanelVisibility();
    }
    if (this.reminderTimeInput) this.reminderTimeInput.value = settings.reminderTime || "08:30";

    const days = settings.reminderDays || [];
    this.reminderDayInputs.forEach((input) => {
      input.checked = days.includes(input.value);
    });

    // Targets & Breaks
    if (this.dailyTargetInput) this.dailyTargetInput.value = settings.dailyTargetHours;
    if (this.studyIntervalInput) this.studyIntervalInput.value = settings.studyIntervalMinutes;
    if (this.shortBreakInput) this.shortBreakInput.value = settings.shortBreakMinutes;
    if (this.longBreakInput) this.longBreakInput.value = settings.longBreakMinutes;

    // Notifications
    if (this.notifyDesktopCheckbox) this.notifyDesktopCheckbox.checked = Boolean(settings.notifyDesktop);
    if (this.notifyEmailDigestCheckbox) this.notifyEmailDigestCheckbox.checked = Boolean(settings.notifyEmailDigest);
    if (this.notifySoundCheckbox) this.notifySoundCheckbox.checked = Boolean(settings.notifySound);

    // Avatar state
    if (settings.avatarType === "custom" && settings.customAvatarDataUrl) {
      this.setCustomAvatar(settings.customAvatarDataUrl, "Custom Image");
    } else {
      const presetKey = settings.presetId || "preset-1";
      this.setPresetAvatar(presetKey);
    }

    // Update sidebar view
    this.updateSidebar(settings.fullName, settings.email);
  }

  setPresetAvatar(presetKey) {
    const preset = PRESET_AVATARS[presetKey] || PRESET_AVATARS["preset-1"];
    this.currentAvatarState = {
      type: "preset",
      presetId: preset.id,
      customDataUrl: null,
      customFileName: null,
      customFile: null
    };

    if (this.activeAvatarImg) this.activeAvatarImg.src = preset.dataUrl;
    if (this.sidebarAvatarImg) this.sidebarAvatarImg.src = preset.dataUrl;
    if (this.avatarSourcePill) this.avatarSourcePill.textContent = `Preset: ${preset.name}`;

    const matchingRadio = this.presetRadios.find((r) => r.value === preset.id);
    if (matchingRadio) matchingRadio.checked = true;

    if (this.avatarFileInput) this.avatarFileInput.value = "";
    this.clearFieldError("avatar");
  }

  setCustomAvatar(dataUrl, fileName = "Custom Upload", file = null) {
    this.currentAvatarState = {
      type: "custom",
      presetId: null,
      customDataUrl: dataUrl,
      customFileName: fileName,
      customFile: file
    };

    if (this.activeAvatarImg) this.activeAvatarImg.src = dataUrl;
    if (this.sidebarAvatarImg) this.sidebarAvatarImg.src = dataUrl;
    if (this.avatarSourcePill) this.avatarSourcePill.textContent = fileName;

    // Uncheck preset radios
    this.presetRadios.forEach((r) => (r.checked = false));
    this.clearFieldError("avatar");
  }

  updateSidebar(name, email) {
    if (this.sidebarName && name) this.sidebarName.textContent = name;
    if (this.sidebarEmail && email) this.sidebarEmail.textContent = email;
  }

  updateReminderPanelVisibility() {
    if (!this.reminderDetailsPanel || !this.reminderEnabledCheckbox) return;
    if (this.reminderEnabledCheckbox.checked) {
      this.reminderDetailsPanel.classList.remove("disabled-state");
      this.reminderDetailsPanel.removeAttribute("aria-disabled");
    } else {
      this.reminderDetailsPanel.classList.add("disabled-state");
      this.reminderDetailsPanel.setAttribute("aria-disabled", "true");
      this.clearFieldError("reminderTime");
      this.clearFieldError("reminderDays");
    }
  }

  attachEvents() {
    // Preset radio selection
    this.presetRadios.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        if (e.target.checked) {
          this.setPresetAvatar(e.target.value);
        }
      });
    });

    // External file upload
    if (this.avatarFileInput) {
      this.avatarFileInput.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const validation = validateAvatar({ avatarType: "custom", file });
        if (!validation.isValid) {
          this.showFieldError("avatar", validation.error);
          return;
        }

        const win = this.getWindow();
        const FileReaderClass = (win && win.FileReader) || (typeof FileReader !== "undefined" ? FileReader : null);
        if (FileReaderClass) {
          const reader = new FileReaderClass();
          reader.onload = (loadEvt) => {
            this.setCustomAvatar(loadEvt.target.result, file.name, file);
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Reset avatar button
    if (this.resetAvatarBtn) {
      this.resetAvatarBtn.addEventListener("click", () => {
        this.setPresetAvatar("preset-1");
        this.announce("Avatar reset to Scholar Blue preset.");
      });
    }

    // Password visibility toggles
    const pwdToggles = this.root.querySelectorAll(".pwd-toggle-btn");
    pwdToggles.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-target");
        const input = this.root.getElementById(targetId);
        if (!input) return;
        const isCurrentlyPassword = input.type === "password";
        input.type = isCurrentlyPassword ? "text" : "password";
        btn.setAttribute(
          "aria-label",
          isCurrentlyPassword ? `Hide ${targetId} password` : `Show ${targetId} password`
        );
      });
    });

    // Reminder toggle
    if (this.reminderEnabledCheckbox) {
      this.reminderEnabledCheckbox.addEventListener("change", () => {
        this.updateReminderPanelVisibility();
      });
    }

    // Inline blur validations
    if (this.fullNameInput) {
      this.fullNameInput.addEventListener("blur", () => {
        const res = validateName(this.fullNameInput.value);
        if (!res.isValid) {
          this.showFieldError("fullName", res.error);
        } else {
          this.clearFieldError("fullName");
        }
      });
      this.fullNameInput.addEventListener("input", () => {
        if (this.fullNameInput.classList.contains("is-invalid")) {
          const res = validateName(this.fullNameInput.value);
          if (res.isValid) this.clearFieldError("fullName");
        }
      });
    }

    if (this.emailInput) {
      this.emailInput.addEventListener("blur", () => {
        const res = validateEmail(this.emailInput.value);
        if (!res.isValid) {
          this.showFieldError("email", res.error);
        } else {
          this.clearFieldError("email");
        }
      });
      this.emailInput.addEventListener("input", () => {
        if (this.emailInput.classList.contains("is-invalid")) {
          const res = validateEmail(this.emailInput.value);
          if (res.isValid) this.clearFieldError("email");
        }
      });
    }

    // Discard & Reset Defaults
    if (this.discardBtn) {
      this.discardBtn.addEventListener("click", () => {
        this.clearAllErrors();
        this.hideBanners();
        this.loadState();
        this.showToast("Changes discarded", "info");
        this.announce("Form changes have been discarded.");
      });
    }

    if (this.resetDefaultsBtn) {
      this.resetDefaultsBtn.addEventListener("click", () => {
        this.clearAllErrors();
        this.hideBanners();
        this.applySettingsToForm(DEFAULT_SETTINGS);
        this.showToast("Restored default settings", "info");
        this.announce("Default settings have been restored to the form.");
      });
    }

    // Banner dismiss buttons
    if (this.dismissSuccessBtn) {
      this.dismissSuccessBtn.addEventListener("click", () => {
        if (this.saveSuccessBanner) this.saveSuccessBanner.classList.add("hidden");
      });
    }
    if (this.dismissErrorBtn) {
      this.dismissErrorBtn.addEventListener("click", () => {
        if (this.saveErrorBanner) this.saveErrorBanner.classList.add("hidden");
      });
    }

    // Browser Notification permission trigger
    if (this.requestPermissionBtn) {
      this.requestPermissionBtn.addEventListener("click", () => {
        this.requestNotificationPermission();
      });
    }

    // Form Submit
    if (this.form) {
      this.form.addEventListener("submit", (e) => this.handleSubmit(e));
    }
  }

  checkNotificationPermission() {
    const win = this.getWindow();
    if (!win || !("Notification" in win)) {
      this.updatePermissionBadge("unsupported");
      return;
    }
    this.updatePermissionBadge(win.Notification.permission);
  }

  async requestNotificationPermission() {
    const win = this.getWindow();
    if (!win || !("Notification" in win)) {
      alert("Browser notifications are not supported on this browser.");
      return;
    }
    try {
      const permission = await win.Notification.requestPermission();
      this.updatePermissionBadge(permission);
      if (permission === "granted") {
        this.showToast("Notifications enabled!", "success");
        this.announce("Browser notification permission granted.");
      } else if (permission === "denied") {
        this.showToast("Notifications blocked in browser settings", "danger");
      }
    } catch (e) {
      console.warn("Permission request error", e);
    }
  }

  updatePermissionBadge(status) {
    if (!this.permissionBadge || !this.permissionBadgeText) return;
    this.permissionBadge.className = "permission-badge";

    if (status === "granted") {
      this.permissionBadge.classList.add("status-granted");
      this.permissionBadgeText.textContent = "System: Granted";
      if (this.requestPermissionBtn) {
        this.requestPermissionBtn.disabled = true;
        this.requestPermissionBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Permission Active</span>
        `;
      }
    } else if (status === "denied") {
      this.permissionBadge.classList.add("status-denied");
      this.permissionBadgeText.textContent = "System: Blocked";
      if (this.requestPermissionBtn) {
        this.requestPermissionBtn.disabled = true;
        this.requestPermissionBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <span>Blocked by Browser</span>
        `;
      }
    } else {
      this.permissionBadge.classList.add("status-default");
      this.permissionBadgeText.textContent = "System: Not Enabled";
    }
  }

  getFormData() {
    const selectedDays = this.reminderDayInputs
      .filter((input) => input.checked)
      .map((input) => input.value);

    return {
      fullName: this.fullNameInput ? this.fullNameInput.value : "",
      email: this.emailInput ? this.emailInput.value : "",
      currentPassword: this.currentPasswordInput ? this.currentPasswordInput.value : "",
      newPassword: this.newPasswordInput ? this.newPasswordInput.value : "",
      confirmPassword: this.confirmPasswordInput ? this.confirmPasswordInput.value : "",
      reminderEnabled: this.reminderEnabledCheckbox ? this.reminderEnabledCheckbox.checked : false,
      reminderTime: this.reminderTimeInput ? this.reminderTimeInput.value : "",
      reminderDays: selectedDays,
      dailyTargetHours: this.dailyTargetInput ? this.dailyTargetInput.value : "",
      studyIntervalMinutes: this.studyIntervalInput ? this.studyIntervalInput.value : "",
      shortBreakMinutes: this.shortBreakInput ? this.shortBreakInput.value : "",
      longBreakMinutes: this.longBreakInput ? this.longBreakInput.value : "",
      notifyDesktop: this.notifyDesktopCheckbox ? this.notifyDesktopCheckbox.checked : false,
      notifyEmailDigest: this.notifyEmailDigestCheckbox ? this.notifyEmailDigestCheckbox.checked : false,
      notifySound: this.notifySoundCheckbox ? this.notifySoundCheckbox.checked : false,
      avatarType: this.currentAvatarState.type,
      presetId: this.currentAvatarState.presetId,
      avatarFile: this.currentAvatarState.customFile
    };
  }

  showFieldError(fieldKey, message) {
    const errorEl = this.root.getElementById(`${fieldKey}Error`);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove("hidden");
    }

    const inputEl = this.root.getElementById(fieldKey);
    if (inputEl) {
      inputEl.classList.add("is-invalid");
      inputEl.setAttribute("aria-invalid", "true");
    }
  }

  clearFieldError(fieldKey) {
    const errorEl = this.root.getElementById(`${fieldKey}Error`);
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.classList.add("hidden");
    }

    const inputEl = this.root.getElementById(fieldKey);
    if (inputEl) {
      inputEl.classList.remove("is-invalid");
      inputEl.removeAttribute("aria-invalid");
    }
  }

  clearAllErrors() {
    const errorKeys = [
      "fullName",
      "email",
      "currentPassword",
      "newPassword",
      "confirmPassword",
      "reminderTime",
      "reminderDays",
      "dailyTargetHours",
      "studyIntervalMinutes",
      "shortBreakMinutes",
      "longBreakMinutes",
      "avatar"
    ];
    errorKeys.forEach((key) => this.clearFieldError(key));
  }

  hideBanners() {
    if (this.saveSuccessBanner) this.saveSuccessBanner.classList.add("hidden");
    if (this.saveErrorBanner) this.saveErrorBanner.classList.add("hidden");
  }

  announce(text) {
    if (this.liveAnnouncer) {
      this.liveAnnouncer.textContent = "";
      setTimeout(() => {
        this.liveAnnouncer.textContent = text;
      }, 50);
    }
  }

  showToast(message, type = "success") {
    if (!this.toastContainer) return;
    const toast = this.root.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.setAttribute("role", "status");

    const iconSvg =
      type === "success"
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

    toast.innerHTML = `
      <span aria-hidden="true">${iconSvg}</span>
      <span>${message}</span>
    `;

    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(30px)";
      toast.style.transition = "all 250ms ease";
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  setSubmissionLoading(loading) {
    this.isSubmitting = loading;
    if (this.saveBtn) {
      this.saveBtn.disabled = loading;
      if (loading) {
        if (this.btnSpinner) this.btnSpinner.classList.remove("hidden");
        if (this.normalIcon) this.normalIcon.classList.add("hidden");
        if (this.saveBtnText) this.saveBtnText.textContent = "Saving Changes...";
        this.form.setAttribute("aria-busy", "true");
      } else {
        if (this.btnSpinner) this.btnSpinner.classList.add("hidden");
        if (this.normalIcon) this.normalIcon.classList.remove("hidden");
        if (this.saveBtnText) this.saveBtnText.textContent = "Save Settings";
        this.form.removeAttribute("aria-busy");
      }
    }
  }

  async handleSubmit(event) {
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    }

    // Prevent duplicate submissions while in-flight
    if (this.isSubmitting) {
      return;
    }

    this.clearAllErrors();
    this.hideBanners();

    const formData = this.getFormData();
    const storedPassword = this.getStoredPassword();

    // Run Validation
    const validation = validateAllSettings(formData, { storedPassword });

    if (!validation.isValid) {
      // 1. Keep the user's entered values intact (they remain in the input elements)
      // 2. Display the relevant errors
      // 3. Do not perform the save operation
      for (const [fieldKey, errorMsg] of Object.entries(validation.errors)) {
        this.showFieldError(fieldKey, errorMsg);
      }

      const errorCount = Object.keys(validation.errors).length;
      if (this.saveErrorSummary) {
        this.saveErrorSummary.textContent = `Found ${errorCount} error${errorCount > 1 ? "s" : ""}. Please fix before saving.`;
      }
      if (this.saveErrorBanner) {
        this.saveErrorBanner.classList.remove("hidden");
      }

      this.announce(`Form submission failed with ${errorCount} errors. First error: ${Object.values(validation.errors)[0]}`);

      // Accessibility: Focus first invalid input
      const firstInvalidFieldKey = Object.keys(validation.errors)[0];
      const firstInvalidInput = this.root.getElementById(firstInvalidFieldKey);
      if (firstInvalidInput && typeof firstInvalidInput.focus === "function") {
        firstInvalidInput.focus();
        if (typeof firstInvalidInput.scrollIntoView === "function") {
          firstInvalidInput.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }

      return;
    }

    // Form is VALID: Execute save flow
    this.setSubmissionLoading(true);

    try {
      // Simulate network latency (300ms)
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Handle password update if specified
      if (formData.newPassword) {
        this.setStoredPassword(formData.newPassword);
        // Clear sensitive password inputs
        if (this.currentPasswordInput) this.currentPasswordInput.value = "";
        if (this.newPasswordInput) this.newPasswordInput.value = "";
        if (this.confirmPasswordInput) this.confirmPasswordInput.value = "";
      }

      // Persist user settings to storage
      const settingsToPersist = {
        fullName: formData.fullName,
        email: formData.email,
        avatarType: this.currentAvatarState.type,
        presetId: this.currentAvatarState.presetId,
        customAvatarDataUrl: this.currentAvatarState.customDataUrl,
        reminderEnabled: formData.reminderEnabled,
        reminderTime: formData.reminderTime,
        reminderDays: formData.reminderDays,
        dailyTargetHours: formData.dailyTargetHours,
        studyIntervalMinutes: formData.studyIntervalMinutes,
        shortBreakMinutes: formData.shortBreakMinutes,
        longBreakMinutes: formData.longBreakMinutes,
        notifyDesktop: formData.notifyDesktop,
        notifyEmailDigest: formData.notifyEmailDigest,
        notifySound: formData.notifySound
      };

      try {
        const storage = this.getStorage();
        if (storage) {
          storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsToPersist));
        }
      } catch (storageErr) {
        console.warn("Storage write error", storageErr);
      }

      // Update sidebar displays
      this.updateSidebar(formData.fullName, formData.email);

      // Display successful save state WITHOUT losing entered values
      if (this.saveSuccessBanner) {
        this.saveSuccessBanner.classList.remove("hidden");
        if (typeof this.saveSuccessBanner.scrollIntoView === "function") {
          this.saveSuccessBanner.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }

      this.showToast("Settings saved successfully!", "success");
      this.announce("All settings and preferences have been successfully saved.");
    } finally {
      this.setSubmissionLoading(false);
    }
  }
}

// Auto-instantiate when running in browser
if (typeof window !== "undefined" && typeof document !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    window.studyPlannerSettings = new SettingsController(document);
  });
}
