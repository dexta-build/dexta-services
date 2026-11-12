import type { NextConfig } from "next";

function getCloudflareR2ImageRemotePattern() {
  const publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL?.trim();

  if (!publicBaseUrl) {
    return null;
  }

  try {
    const url = new URL(publicBaseUrl);

    if (url.protocol !== "https:") {
      return null;
    }

    return {
      protocol: "https" as const,
      hostname: url.hostname,
    };
  } catch {
    return null;
  }
}

const cloudflareR2ImageRemotePattern = getCloudflareR2ImageRemotePattern();

const nextConfig: NextConfig = {
  // Lets QA builds use a separate folder (NEXT_DIST_DIR=.next-qa) so they
  // don't disturb a running dev server. Normal builds use .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      ...(cloudflareR2ImageRemotePattern
        ? [cloudflareR2ImageRemotePattern]
        : []),
    ],
  },
  async redirects() {
    return [
      // The old portfolio page moved to /works. Query strings carry over,
      // so /projects?tab=build lands on the Build filter.
      { source: "/projects", destination: "/works", statusCode: 301 },
      // The team now lives on the About page; profiles are at /[slug]
      // (old /team/[slug] links redirect from src/app/(public)/team/[slug]).
      { source: "/team", destination: "/about#team", statusCode: 301 },
      // Devs Day has passed; events now live under /events.
      { source: "/devs-day", destination: "/events", statusCode: 301 },
      { source: "/dev-day", destination: "/events", statusCode: 301 },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
