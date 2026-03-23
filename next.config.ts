import type { NextConfig } from "next";

const prismaRuntimeLibraryAlias = "./node_modules/prisma/prisma-client/runtime/library.js";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium"],

  experimental: {},
  turbopack: {
    resolveAlias: {
      "@prisma/client/runtime/library": prismaRuntimeLibraryAlias,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@prisma/client/runtime/library": prismaRuntimeLibraryAlias,
    };

    return config;
  },
  outputFileTracingIncludes: {
    "/api/doctor/appointments/[id]/certificate": [
      "./node_modules/@sparticuz/chromium/**/*",
    ],
    "/api/nurse/reports/pdf": ["./node_modules/@sparticuz/chromium/**/*"],
  },

  allowedDevOrigins: ["http://192.168.254.104:3000", "http://localhost:3000"],
  env: {
    TZ: "Asia/Manila",
  },
};

export default nextConfig;
