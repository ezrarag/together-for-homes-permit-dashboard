/** @type {import('next').NextConfig} */

// TODO: Before locking down frame-ancestors for production, set this env var
// to the exact Together For Homes domain(s), e.g.:
//   EMBED_FRAME_ANCESTORS="https://togetherforhomes.org https://www.togetherforhomes.org"
// Leave unset (or set to "*") during development and staging.
const EMBED_FRAME_ANCESTORS = process.env.EMBED_FRAME_ANCESTORS ?? "*";

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
