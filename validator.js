/**
 * StudyPlanner Settings Validator Module
 * Provides validation rules for user profile, security, study reminders, break and target settings.
 */

// Email regex adhering to RFC 5322 standard patterns
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validate full name
 * @param {string} name
 * @returns {{ isValid: boolean, error: string | null }}
 */
export function validateName(name) {
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return { isValid: false, error: "Full name is required." };
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { isValid: false, error: "Name must be at least 2 characters long." };
  }
  if (trimmed.length > 70) {
    return { isValid: false, error: "Name cannot exceed 70 characters." };
  }
  const namePattern = /^[\p{L}\s'-]+$/u;
  if (!namePattern.test(trimmed)) {
    return { isValid: false, error: "Name contains invalid characters (letters, spaces, hyphens only)." };
  }
  return { isValid: true, error: null };
}

/**
 * Validate user email format
 * @param {string} email
 * @returns {{ isValid: boolean, error: string | null }}
 */
export function validateEmail(email) {
  if (!email || typeof email !== "string" || email.trim().length === 0) {
    return { isValid: false, error: "Email address is required." };
  }
  const trimmed = email.trim();
  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: "Please enter a valid email address (e.g., student@university.edu)." };
  }
  return { isValid: true, error: null };
}

/**
 * Validate password change
 * @param {object} params
 * @param {string} [params.currentPassword]
 * @param {string} [params.newPassword]
 * @param {string} [params.confirmPassword]
 * @param {string} [params.storedPassword]
 * @returns {{ isValid: boolean, errors: { currentPassword?: string, newPassword?: string, confirmPassword?: string } }}
 */
export function validatePasswordChange({
  currentPassword = "",
  newPassword = "",
  confirmPassword = "",
  storedPassword = ""
} = {}) {
  const errors = {};
  const hasAnyPasswordInput = Boolean(
    (currentPassword && currentPassword.length > 0) ||
    (newPassword && newPassword.length > 0) ||
    (confirmPassword && confirmPassword.length > 0)
  );

  // If user is not attempting to change password, return valid
  if (!hasAnyPasswordInput) {
    return { isValid: true, errors };
  }

  // 1. Current password check
  if (!currentPassword) {
    errors.currentPassword = "Current password is required to change your password.";
  } else if (storedPassword && currentPassword !== storedPassword) {
    errors.currentPassword = "Incorrect current password. Please try again.";
  }

  // 2. New password check
  if (!newPassword) {
    errors.newPassword = "New password cannot be empty.";
  } else {
    if (newPassword.length < 8) {
      errors.newPassword = "New password must be at least 8 characters long.";
    } else if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      errors.newPassword = "Password must include at least one letter and one number.";
    }

    // Must not be the same as previous/current password
    if (currentPassword && newPassword === currentPassword) {
      errors.newPassword = "New password cannot be the same as your previous password.";
    } else if (storedPassword && newPassword === storedPassword) {
      errors.newPassword = "New password cannot be the same as your previous password.";
    }
  }

  // 3. Confirm password check
  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your new password.";
  } else if (newPassword && newPassword !== confirmPassword) {
    errors.confirmPassword = "Password confirmation does not match the new password.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate study reminder settings
 * @param {object} params
 * @param {boolean} params.enabled
 * @param {string} params.time
 * @param {string[]} params.days
 * @returns {{ isValid: boolean, errors: { reminderTime?: string, reminderDays?: string } }}
 */
export function validateStudyReminders({ enabled = false, time = "", days = [] } = {}) {
  const errors = {};

  if (enabled) {
    if (!time || typeof time !== "string" || time.trim() === "") {
      errors.reminderTime = "Reminder time is required when reminders are enabled.";
    } else {
      // Validate HH:MM 24hr format
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(time.trim())) {
        errors.reminderTime = "Invalid reminder time format. Use HH:MM.";
      }
    }

    if (!Array.isArray(days) || days.length === 0) {
      errors.reminderDays = "Please select at least one day for your daily study reminder.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate study break & target settings
 * @param {object} params
 * @param {number|string} params.dailyTargetHours
 * @param {number|string} params.studyIntervalMinutes
 * @param {number|string} params.shortBreakMinutes
 * @param {number|string} params.longBreakMinutes
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateBreakAndTargets({
  dailyTargetHours,
  studyIntervalMinutes,
  shortBreakMinutes,
  longBreakMinutes
} = {}) {
  const errors = {};

  // Daily target hours
  const target = parseFloat(dailyTargetHours);
  if (isNaN(target)) {
    errors.dailyTargetHours = "Daily target must be a valid number.";
  } else if (target < 0.5 || target > 16) {
    errors.dailyTargetHours = "Daily study target must be between 0.5 and 16 hours.";
  }

  // Study interval minutes (Pomodoro session)
  const interval = parseInt(studyIntervalMinutes, 10);
  if (isNaN(interval)) {
    errors.studyIntervalMinutes = "Study interval must be a valid number.";
  } else if (interval < 15 || interval > 180) {
    errors.studyIntervalMinutes = "Study interval must be between 15 and 180 minutes.";
  }

  // Short break minutes
  const shortBreak = parseInt(shortBreakMinutes, 10);
  if (isNaN(shortBreak)) {
    errors.shortBreakMinutes = "Short break duration must be a valid number.";
  } else if (shortBreak < 3 || shortBreak > 30) {
    errors.shortBreakMinutes = "Short break must be between 3 and 30 minutes.";
  }

  // Long break minutes
  const longBreak = parseInt(longBreakMinutes, 10);
  if (isNaN(longBreak)) {
    errors.longBreakMinutes = "Long break duration must be a valid number.";
  } else if (longBreak < 10 || longBreak > 60) {
    errors.longBreakMinutes = "Long break must be between 10 and 60 minutes.";
  } else if (!isNaN(shortBreak) && longBreak < shortBreak) {
    errors.longBreakMinutes = "Long break must be longer than or equal to short break.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate profile picture selection or upload
 * @param {object} params
 * @param {string} [params.avatarType] - 'preset' or 'custom'
 * @param {string} [params.presetId]
 * @param {object} [params.file] - { name, size, type }
 * @returns {{ isValid: boolean, error: string | null }}
 */
export function validateAvatar({ avatarType = "preset", presetId = "", file = null } = {}) {
  if (avatarType === "preset") {
    if (!presetId) {
      return { isValid: false, error: "Please choose a preset avatar." };
    }
  } else if (avatarType === "custom") {
    if (!file) {
      return { isValid: false, error: "Please select an image file to upload." };
    }
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (file.type && !validTypes.includes(file.type)) {
      return { isValid: false, error: "Unsupported image format. Use JPG, PNG, WebP, or GIF." };
    }
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (file.size && file.size > maxSizeBytes) {
      return { isValid: false, error: "Image size must be less than 5MB." };
    }
  }
  return { isValid: true, error: null };
}

/**
 * Validate entire form data
 * @param {object} formData
 * @param {object} [options]
 * @param {string} [options.storedPassword]
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateAllSettings(formData, options = {}) {
  const errors = {};

  // Name
  const nameRes = validateName(formData.fullName);
  if (!nameRes.isValid) {
    errors.fullName = nameRes.error;
  }

  // Email
  const emailRes = validateEmail(formData.email);
  if (!emailRes.isValid) {
    errors.email = emailRes.error;
  }

  // Password
  const pwdRes = validatePasswordChange({
    currentPassword: formData.currentPassword,
    newPassword: formData.newPassword,
    confirmPassword: formData.confirmPassword,
    storedPassword: options.storedPassword
  });
  if (!pwdRes.isValid) {
    Object.assign(errors, pwdRes.errors);
  }

  // Study Reminders
  const reminderRes = validateStudyReminders({
    enabled: formData.reminderEnabled,
    time: formData.reminderTime,
    days: formData.reminderDays
  });
  if (!reminderRes.isValid) {
    Object.assign(errors, reminderRes.errors);
  }

  // Break & Targets
  const targetRes = validateBreakAndTargets({
    dailyTargetHours: formData.dailyTargetHours,
    studyIntervalMinutes: formData.studyIntervalMinutes,
    shortBreakMinutes: formData.shortBreakMinutes,
    longBreakMinutes: formData.longBreakMinutes
  });
  if (!targetRes.isValid) {
    Object.assign(errors, targetRes.errors);
  }

  // Avatar
  const avatarRes = validateAvatar({
    avatarType: formData.avatarType,
    presetId: formData.presetId,
    file: formData.avatarFile
  });
  if (!avatarRes.isValid) {
    errors.avatar = avatarRes.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
