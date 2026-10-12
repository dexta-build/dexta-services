"use server";

import { headers } from "next/headers";
import { verifyRecaptcha } from "@/lib/recaptcha";
import {
  rateLimit,
  RATE_LIMITS,
  getClientIp,
  formatRateLimitWaitTime,
} from "@/lib/rate-limit";

/**
 * Pre-login check: rate limit + reCAPTCHA verification.
 * Called before signIn("credentials") on the client.
 */
export async function verifyLoginRequest(
  recaptchaToken?: string,
): Promise<{ success: boolean; message?: string }> {
  const headersList = await headers();
  const ip = getClientIp(headersList);

  // Rate limit login attempts by IP
  const limit = rateLimit(`login:${ip}`, RATE_LIMITS.login);
  if (!limit.success) {
    const waitTime = formatRateLimitWaitTime(limit.resetMs);
    return {
      success: false,
      message: `Too many login attempts. Try again in ${waitTime}.`,
    };
  }

  // Verify reCAPTCHA
  if (recaptchaToken) {
    const result = await verifyRecaptcha(recaptchaToken, "login");
    if (!result.success) {
      return {
        success: false,
        message: "reCAPTCHA verification failed. Please try again.",
      };
    }
  }

  return { success: true };
}
