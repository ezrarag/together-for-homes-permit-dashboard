/** @type {import('next').NextConfig} */

// Determine allowed frame-ancestors for the /embed/* route.
//
// Priority:
//   1. EMBED_FRAME_ANCESTORS env var (explicit, any environment)
//   2. Production with no env var → fail closed to "'self'" and emit a
//      console warning so deployments don't silently allow open framing.
//   3. Development / staging with no env var → permissive "*" for convenience.
//
// Before going live set on your deployment platform:
//   EMBED_FRAME_ANCESTORS=https://togetherforhomes.org https://www.togetherforhomes.org
let EMBED_FRAME_ANCESTORS;
if (process.env.EMBED_FRAME_ANCESTORS) {
  EMBED_FRAME_ANCESTORS = process.env.EMBED_FRAME_ANCESTORS;
} else if (process.env.NODE_ENV === "production") {
  console.warn(
    "[next.config] WARNING: EMBED_FRAME_ANCESTORS is not set in production. " +
      "Defaulting to 'self'-only framing to prevent open embedding. " +
      "Set EMBED_FRAME_ANCESTORS='https://togetherforhomes.org https://www.togetherforhomes.org' " +
      "on your deployment platform to allow the Together For Homes site to embed the dashboard.",
  );
  EMBED_FRAME_ANCESTORS = "'self'";
} else {
  // Development / CI / staging — allow all origins for convenience.
  EMBED_FRAME_ANCESTORS = "*";
}

const nextConfig = {
  async headers() {
    return [
      {
        // Embed routes: allow iframing from configured origins.
        // X-Frame-Options is intentionally absent on embed routes so that the
        // CSP frame-ancestors directive is the sole authority.
        source: "/embed/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors ${EMBED_FRAME_ANCESTORS}`,
          },
        ],
      },
      {
        // All other routes: block framing to prevent clickjacking.
        source: "/((?!embed).*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
