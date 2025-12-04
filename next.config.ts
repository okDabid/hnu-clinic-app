import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  serverExternalPackages: ["@sparticuz/chromium"],

  experimental: {

  },
  outputFileTracingIncludes: {
    "/api/doctor/appointments/[id]/certificate": [
      "./node_modules/@sparticuz/chromium/**/*",
    ],
    "/api/nurse/reports/pdf": ["./node_modules/@sparticuz/chromium/**/*"],
  },

  allowedDevOrigins: [
    "http://192.168.254.104:3000",
    "http://localhost:3000",
  ],
  env: {
    TZ: "Asia/Manila",
  },
};

export default nextConfig;
