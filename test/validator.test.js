import test from "node:test";
import assert from "node:assert/strict";

import {
  validateName,
  validateEmail,
  validatePasswordChange,
  validateStudyReminders,
  validateBreakAndTargets,
  validateAvatar,
  validateAllSettings
} from "../validator.js";

test("validateName", async (t) => {
  await t.test("accepts valid full student names", () => {
    assert.deepEqual(validateName("Alex Morgan"), { isValid: true, error: null });
    assert.deepEqual(validateName("Marie Curie-Skłodowska"), { isValid: true, error: null });
    assert.deepEqual(validateName("O'Connor"), { isValid: true, error: null });
  });

  await t.test("rejects empty or whitespace-only names", () => {
    const res = validateName("   ");
    assert.equal(res.isValid, false);
    assert.match(res.error, /required/i);
  });

  await t.test("rejects names shorter than 2 characters", () => {
    const res = validateName("A");
    assert.equal(res.isValid, false);
    assert.match(res.error, /at least 2 characters/i);
  });

  await t.test("rejects names with invalid symbols", () => {
    const res = validateName("Alex123!");
    assert.equal(res.isValid, false);
    assert.match(res.error, /invalid characters/i);
  });
});

test("validateEmail", async (t) => {
  await t.test("accepts valid email addresses", () => {
    assert.deepEqual(validateEmail("student@university.edu"), { isValid: true, error: null });
    assert.deepEqual(validateEmail("john.doe@sub.domain.org"), { isValid: true, error: null });
    assert.deepEqual(validateEmail("user+tag@domain.co"), { isValid: true, error: null });
  });

  await t.test("rejects empty or whitespace email", () => {
    const res = validateEmail("");
    assert.equal(res.isValid, false);
    assert.match(res.error, /required/i);
  });

  await t.test("rejects malformed email addresses", () => {
    assert.equal(validateEmail("plainaddress").isValid, false);
    assert.equal(validateEmail("@missinguser.com").isValid, false);
    assert.equal(validateEmail("user@.com").isValid, false);
    assert.equal(validateEmail("user@domain").isValid, false);
    assert.equal(validateEmail("user name@domain.com").isValid, false);
  });
});

test("validatePasswordChange", async (t) => {
  const storedPassword = "StudyPass123!";

  await t.test("allows empty password fields if user is not changing password", () => {
    const res = validatePasswordChange({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      storedPassword
    });
    assert.equal(res.isValid, true);
    assert.deepEqual(res.errors, {});
  });

  await t.test("rejects new password that is identical to previous/stored password", () => {
    const res = validatePasswordChange({
      currentPassword: storedPassword,
      newPassword: storedPassword,
      confirmPassword: storedPassword,
      storedPassword
    });
    assert.equal(res.isValid, false);
    assert.match(res.errors.newPassword, /cannot be the same as your previous password/i);
  });

  await t.test("rejects incorrect current password", () => {
    const res = validatePasswordChange({
      currentPassword: "WrongPassword1!",
      newPassword: "BrandNewPass88!",
      confirmPassword: "BrandNewPass88!",
      storedPassword
    });
    assert.equal(res.isValid, false);
    assert.match(res.errors.currentPassword, /incorrect current password/i);
  });

  await t.test("rejects new password shorter than 8 characters", () => {
    const res = validatePasswordChange({
      currentPassword: storedPassword,
      newPassword: "Short1",
      confirmPassword: "Short1",
      storedPassword
    });
    assert.equal(res.isValid, false);
    assert.match(res.errors.newPassword, /at least 8 characters/i);
  });

  await t.test("rejects new password lacking letters or numbers", () => {
    const res = validatePasswordChange({
      currentPassword: storedPassword,
      newPassword: "justletterslong",
      confirmPassword: "justletterslong",
      storedPassword
    });
    assert.equal(res.isValid, false);
    assert.match(res.errors.newPassword, /at least one letter and one number/i);
  });

  await t.test("rejects mismatched confirm password", () => {
    const res = validatePasswordChange({
      currentPassword: storedPassword,
      newPassword: "BrandNewPass88!",
      confirmPassword: "DifferentPass99!",
      storedPassword
    });
    assert.equal(res.isValid, false);
    assert.match(res.errors.confirmPassword, /confirmation does not match/i);
  });

  await t.test("accepts valid password change meeting all criteria", () => {
    const res = validatePasswordChange({
      currentPassword: storedPassword,
      newPassword: "FreshNewPass2026!",
      confirmPassword: "FreshNewPass2026!",
      storedPassword
    });
    assert.equal(res.isValid, true);
    assert.deepEqual(res.errors, {});
  });
});

test("validateStudyReminders", async (t) => {
  await t.test("valid when reminders are disabled", () => {
    const res = validateStudyReminders({ enabled: false, time: "", days: [] });
    assert.equal(res.isValid, true);
  });

  await t.test("requires time and at least one day when enabled", () => {
    const res = validateStudyReminders({ enabled: true, time: "", days: [] });
    assert.equal(res.isValid, false);
    assert.ok(res.errors.reminderTime);
    assert.ok(res.errors.reminderDays);
  });

  await t.test("rejects invalid time format", () => {
    const res = validateStudyReminders({ enabled: true, time: "25:99", days: ["Mon"] });
    assert.equal(res.isValid, false);
    assert.match(res.errors.reminderTime, /invalid reminder time format/i);
  });

  await t.test("accepts valid time and active days", () => {
    const res = validateStudyReminders({ enabled: true, time: "09:00", days: ["Mon", "Tue"] });
    assert.equal(res.isValid, true);
  });
});

test("validateBreakAndTargets", async (t) => {
  await t.test("accepts standard study and break settings", () => {
    const res = validateBreakAndTargets({
      dailyTargetHours: 4.5,
      studyIntervalMinutes: 45,
      shortBreakMinutes: 10,
      longBreakMinutes: 25
    });
    assert.equal(res.isValid, true);
  });

  await t.test("rejects daily target out of range", () => {
    const tooLow = validateBreakAndTargets({
      dailyTargetHours: 0.2,
      studyIntervalMinutes: 45,
      shortBreakMinutes: 10,
      longBreakMinutes: 25
    });
    assert.equal(tooLow.isValid, false);
    assert.match(tooLow.errors.dailyTargetHours, /between 0\.5 and 16 hours/i);

    const tooHigh = validateBreakAndTargets({
      dailyTargetHours: 20,
      studyIntervalMinutes: 45,
      shortBreakMinutes: 10,
      longBreakMinutes: 25
    });
    assert.equal(tooHigh.isValid, false);
    assert.match(tooHigh.errors.dailyTargetHours, /between 0\.5 and 16 hours/i);
  });

  await t.test("rejects long break shorter than short break", () => {
    const res = validateBreakAndTargets({
      dailyTargetHours: 4,
      studyIntervalMinutes: 50,
      shortBreakMinutes: 20,
      longBreakMinutes: 15
    });
    assert.equal(res.isValid, false);
    assert.match(res.errors.longBreakMinutes, /longer than or equal to short break/i);
  });
});

test("validateAvatar", async (t) => {
  await t.test("accepts preset avatar", () => {
    assert.deepEqual(validateAvatar({ avatarType: "preset", presetId: "preset-1" }), {
      isValid: true,
      error: null
    });
  });

  await t.test("rejects custom file upload exceeding 5MB", () => {
    const largeFile = { name: "photo.jpg", size: 6 * 1024 * 1024, type: "image/jpeg" };
    const res = validateAvatar({ avatarType: "custom", file: largeFile });
    assert.equal(res.isValid, false);
    assert.match(res.error, /less than 5MB/i);
  });

  await t.test("rejects unsupported custom file types", () => {
    const pdfFile = { name: "doc.pdf", size: 50000, type: "application/pdf" };
    const res = validateAvatar({ avatarType: "custom", file: pdfFile });
    assert.equal(res.isValid, false);
    assert.match(res.error, /unsupported image format/i);
  });
});

test("validateAllSettings integration", () => {
  const validData = {
    fullName: "Alex Morgan",
    email: "alex@university.edu",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    reminderEnabled: true,
    reminderTime: "08:30",
    reminderDays: ["Mon"],
    dailyTargetHours: "4.0",
    studyIntervalMinutes: "45",
    shortBreakMinutes: "10",
    longBreakMinutes: "25",
    avatarType: "preset",
    presetId: "preset-1"
  };

  const res = validateAllSettings(validData);
  assert.equal(res.isValid, true);
  assert.deepEqual(res.errors, {});
});
