/**
 * Server-side reCAPTCHA v3 verification.
 *
 * Uses the standard siteverify endpoint (not Enterprise).
 * Requires RECAPTCHA_SECRET_KEY in env.
 */

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

interface VerifyResult {
  success: boolean;
  score: number;
  action: string;
  error?: string;
}

export async function verifyRecaptcha(
  token: string,
  expectedAction?: string,
): Promise<VerifyResult> {
  if (!token || typeof token !== "string" || !token.trim()) {
    return {
      success: false,
      score: 0,
      action: expectedAction ?? "",
      error: "Missing reCAPTCHA token",
    };
  }

  // Skip verification in development if explicitly mock or not in production
  if (process.env.NODE_ENV !== "production") {
    // If secret is set and token is not mock, try verifying; fallback to pass in local dev
    if (
      !process.env.RECAPTCHA_SECRET_KEY ||
      token === "test" ||
      token === "mock"
    ) {
      return { success: true, score: 1, action: expectedAction ?? "" };
    }
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    console.error("[reCAPTCHA] RECAPTCHA_SECRET_KEY is not configured");
    return {
      success: false,
      score: 0,
      action: "",
      error: "reCAPTCHA not configured",
    };
  }

  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });

    const data = await response.json();

    if (!data.success) {
      console.warn("[reCAPTCHA] Verification failed:", data["error-codes"]);
      return {
        success: false,
        score: 0,
        action: data.action ?? "",
        error: "Token verification failed",
      };
    }

    // Check action matches (prevents token reuse across forms)
    if (expectedAction && data.action !== expectedAction) {
      console.warn(
        `[reCAPTCHA] Action mismatch: expected "${expectedAction}", got "${data.action}"`,
      );
      return {
        success: false,
        score: data.score ?? 0,
        action: data.action ?? "",
        error: "Action mismatch",
      };
    }

    // Score threshold: 0.5+ is likely human
    if (data.score < 0.5) {
      return {
        success: false,
        score: data.score,
        action: data.action ?? "",
        error: "Score too low",
      };
    }

    return {
      success: true,
      score: data.score,
      action: data.action ?? "",
    };
  } catch (err) {
    console.error("[reCAPTCHA] Verification error:", err);
    return {
      success: false,
      score: 0,
      action: "",
      error: "Verification request failed",
    };
  }
}
