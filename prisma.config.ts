import { defineConfig, env } from "@prisma/config";

const shadowDatabaseUrl = process.env.SHADOW_DATABASE_URL
    ? env("SHADOW_DATABASE_URL")
    : undefined;

export default defineConfig({
    schema: "./prisma/schema.prisma",
    engine: "classic",
    datasource: {
        url: env("DATABASE_URL"),
        ...(shadowDatabaseUrl ? { shadowDatabaseUrl } : {}),
    },
});
