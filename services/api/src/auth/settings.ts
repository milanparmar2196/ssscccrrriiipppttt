/** Platform auth settings (API §3 / A9 / A10 — Admin-tunable later). */
export const AUTH_SETTINGS = {
  passwordMinLength: 10,
  passwordMinStrength: 2, // 0..4 scale; 0-1 ("very weak") rejected
  verifyTokenTtlHours: 24,
  resetTokenTtlHours: 1,
  resendCooldownSec: 60,
  resendDailyMax: 5,
  accessTokenTtlMin: 15,
  refreshTokenTtlDays: 30,
  adminSessionTtlMin: 60, // short-lived (bootstrap sessions especially, A9)
  loginMaxFailures: 5,
  loginWindowMin: 15,
  loginLockoutMin: 15,
  deletionGraceDays: 30,
  emailMaxAttempts: 3,
} as const;
