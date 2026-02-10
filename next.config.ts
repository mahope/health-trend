import type { NextConfig } from "next";
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";

const securityHeaders: Array<{ key: string; value: string }> = [
  // Basic hardening
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },

  // Clickjacking protection (modern + legacy)
  { key: "X-Frame-Options", value: "DENY" },

  // Limit powerful APIs (keep it conservative; relax only when needed)
  {
    key: "Permissions-Policy",
    value: [
      "accelerometer=()",
      "ambient-light-sensor=()",
      "autoplay=()",
      "battery=()",
      "camera=()",
      "display-capture=()",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "microphone=()",
      "midi=()",
      "payment=()",
      "usb=()",
    ].join(", "),
  },

  // CSP-lite: strong defaults, but avoid breaking Next/Convex/PWA assets.
  // NOTE: If we later add external analytics/fonts, update the allowlist intentionally.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline'",
      // Convex + any future HTTPS APIs; include ws/http for local dev.
      "connect-src 'self' https: http: wss: ws:",
      // Allow PWA manifest + other fetches; keep it same-origin by default.
    ].join("; "),
  },
];

if (process.env.NODE_ENV === "production") {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    // 2 years + preload. Only meaningful on HTTPS.
    value: "max-age=63072000; includeSubDomains; preload",
  });
}

function getAppVersion(): string {
  try {
    const raw = fs.readFileSync(path.join(__dirname, "package.json"), "utf8");
    const json = JSON.parse(raw) as { version?: string };
    return json.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function getGitSha(): string {
  try {
    return execSync("git rev-parse --short HEAD", {
      cwd: __dirname,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

const nextConfig: NextConfig = {
  turbopack: {
    // Prevent Turbopack from picking the wrong workspace root (multiple lockfiles on this machine)
    root: path.resolve(__dirname),
  },

  env: {
    NEXT_PUBLIC_APP_VERSION: getAppVersion(),
    NEXT_PUBLIC_GIT_SHA: getGitSha(),
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
