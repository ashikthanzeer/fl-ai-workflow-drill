import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

import { SettingsController, DEFAULT_SETTINGS, INITIAL_DEFAULT_PASSWORD } from "../script.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const htmlContent = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

function setupDOM() {
  const dom = new JSDOM(htmlContent, {
    url: "http://localhost:3000",
    runScripts: "outside-only"
  });

  const { window } = dom;
  const { document } = window;

  // Mock localStorage
  const store = {};
  const mockLocalStorage = {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, val) => {
      store[key] = String(val);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    }
  };

  Object.defineProperty(window, "localStorage", {
    value: mockLocalStorage,
    writable: true
  });
  globalThis.localStorage = mockLocalStorage;

  // Mock Notification API
  window.Notification = {
    permission: "default",
    requestPermission: async () => "granted"
  };
  globalThis.Notification = window.Notification;

  // Mock scrollIntoView
  window.HTMLElement.prototype.scrollIntoView = () => {};

  const controller = new SettingsController(document);

  return { dom, window, document, controller, store };
}

test("UI Interaction: Initial render and default values", () => {
  const { document } = setupDOM();

  const fullNameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("email");
  const dailyTargetInput = document.getElementById("dailyTargetHours");
  const saveBtn = document.getElementById("saveSettingsBtn");

  assert.equal(fullNameInput.value, DEFAULT_SETTINGS.fullName);
  assert.equal(emailInput.value, DEFAULT_SETTINGS.email);
  assert.equal(dailyTargetInput.value, DEFAULT_SETTINGS.dailyTargetHours);
  assert.equal(saveBtn.disabled, false);
});

test("UI Interaction: Form submission with invalid inputs keeps values & displays errors", async () => {
  const { document, controller, store } = setupDOM();

  const fullNameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("email");
  const saveBtn = document.getElementById("saveSettingsBtn");
  const saveErrorBanner = document.getElementById("saveErrorBanner");
  const emailError = document.getElementById("emailError");

  // Enter invalid email while keeping entered value
  const badEmail = "invalid-email-address";
  emailInput.value = badEmail;

  // Trigger submit
  const submitEvent = new document.defaultView.Event("submit", { cancelable: true });
  document.getElementById("settingsForm").dispatchEvent(submitEvent);

  // Verification 1: Value is PRESERVED and not wiped
  assert.equal(emailInput.value, badEmail);

  // Verification 2: Error banner is shown and aria-invalid is set
  assert.equal(saveErrorBanner.classList.contains("hidden"), false);
  assert.equal(emailInput.getAttribute("aria-invalid"), "true");
  assert.equal(emailInput.classList.contains("is-invalid"), true);
  assert.match(emailError.textContent, /valid email/i);

  // Verification 3: Save was NOT persisted to localStorage
  assert.equal(store.studyplanner_settings_v2, undefined);
  assert.equal(saveBtn.disabled, false);
});

test("UI Interaction: Password change validation prevents identical previous password", async () => {
  const { document, store } = setupDOM();

  const currentPasswordInput = document.getElementById("currentPassword");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const newPasswordError = document.getElementById("newPasswordError");

  // Try to use the exact same password as the current/previous password
  currentPasswordInput.value = INITIAL_DEFAULT_PASSWORD;
  newPasswordInput.value = INITIAL_DEFAULT_PASSWORD;
  confirmPasswordInput.value = INITIAL_DEFAULT_PASSWORD;

  const submitEvent = new document.defaultView.Event("submit", { cancelable: true });
  document.getElementById("settingsForm").dispatchEvent(submitEvent);

  // Verify error
  assert.equal(newPasswordInput.getAttribute("aria-invalid"), "true");
  assert.match(newPasswordError.textContent, /cannot be the same as your previous password/i);
  assert.equal(store.studyplanner_settings_v2, undefined);
});

test("UI Interaction: Study reminder validation requires active days when enabled", async () => {
  const { document } = setupDOM();

  const reminderEnabled = document.getElementById("reminderEnabled");
  const dayInputs = Array.from(document.querySelectorAll('input[name="reminderDays"]'));
  const reminderDaysError = document.getElementById("reminderDaysError");

  reminderEnabled.checked = true;
  dayInputs.forEach((input) => (input.checked = false)); // Uncheck all days

  const submitEvent = new document.defaultView.Event("submit", { cancelable: true });
  document.getElementById("settingsForm").dispatchEvent(submitEvent);

  assert.match(reminderDaysError.textContent, /select at least one day/i);
});

test("UI Interaction: Valid form submission saves data, keeps values, and shows loading/success", async () => {
  const { document, controller, store } = setupDOM();

  const fullNameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("email");
  const saveSuccessBanner = document.getElementById("saveSuccessBanner");
  const saveBtn = document.getElementById("saveSettingsBtn");
  const saveBtnText = document.getElementById("saveBtnText");

  fullNameInput.value = "Taylor Swift";
  emailInput.value = "taylor.swift@campus.edu";

  const submitEvent = new document.defaultView.Event("submit", { cancelable: true });
  const formPromise = controller.handleSubmit(submitEvent);

  // While in flight: check loading state
  assert.equal(controller.isSubmitting, true);
  assert.equal(saveBtn.disabled, true);
  assert.equal(saveBtnText.textContent, "Saving Changes...");

  // Prevent duplicate submit during in-flight save
  const duplicateSubmitEvent = new document.defaultView.Event("submit", { cancelable: true });
  controller.handleSubmit(duplicateSubmitEvent); // Should be safely ignored

  await formPromise;

  // After save completion:
  assert.equal(controller.isSubmitting, false);
  assert.equal(saveBtn.disabled, false);
  assert.equal(saveBtnText.textContent, "Save Settings");

  // Success banner shown
  assert.equal(saveSuccessBanner.classList.contains("hidden"), false);

  // Values preserved!
  assert.equal(fullNameInput.value, "Taylor Swift");
  assert.equal(emailInput.value, "taylor.swift@campus.edu");

  // LocalStorage updated
  assert.ok(store.studyplanner_settings_v2);
  const parsed = JSON.parse(store.studyplanner_settings_v2);
  assert.equal(parsed.fullName, "Taylor Swift");
  assert.equal(parsed.email, "taylor.swift@campus.edu");
});

test("UI Interaction: Switching avatar preset updates preview", () => {
  const { document, controller } = setupDOM();

  const radio2 = document.querySelector('input[name="avatarChoice"][value="preset-2"]');
  const activeAvatarImg = document.getElementById("activeAvatarImg");
  const avatarSourcePill = document.getElementById("avatarSourcePill");

  radio2.checked = true;
  radio2.dispatchEvent(new document.defaultView.Event("change"));

  assert.equal(controller.currentAvatarState.presetId, "preset-2");
  assert.match(avatarSourcePill.textContent, /Emerald Scientist/i);
  assert.ok(activeAvatarImg.src.startsWith("data:image/svg+xml"));
});
