import type { NextConfig } from "next";

/**
 * Content Security Policy headers.
 *
 * Policy decisions:
 * - `default-src 'self'`      — only same-origin resources by default
 * - `script-src 'self'`       — NO unsafe-inline / unsafe-eval for scripts
 * - `style-src 'self' 'unsafe-inline'` — inline styles kept for CSS-in-JS / Tailwind
 * - `img-src 'self' data:`    — data URIs needed for base64 images / favicons
 * - `font-src 'self'`         — self-hosted fonts only
 * - `connect-src 'self'`      — XHR/fetch to same origin only
 * - `frame-ancestors 'none'`  — prevents clickjacking (replaces X-Frame-Options)
 * - `object-src 'none'`       — disables Flash / plugins
 * - `base-uri 'self'`         — prevents base-tag injection attacks
 * - `form-action 'self'`      — form submissions to same origin only
 *
 * Applied in production only so that Next.js Fast Refresh (which uses
 * inline scripts) continues to work in development without errors.
 */
const ContentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy,
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    // Apply security headers in production only.
    // In development, Next.js Fast Refresh injects inline scripts that would
    // be blocked by a strict script-src 'self' policy.
    if (process.env.NODE_ENV !== "production") {
      return [];
    }

    return [
      {
        // Apply to every route in the application.
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
