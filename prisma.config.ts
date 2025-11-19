import { defineConfig } from "@prisma/config";
import { config as loadEnv } from "dotenv";
import path from "node:path";

loadEnv({ path: path.resolve(process.cwd(), ".env") });
loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const datasourceUrl = process.env.DATABASE_URL;

if (!datasourceUrl) {
    throw new Error(
        "DATABASE_URL is not set. Add it to your .env (or .env.local) file before running Prisma commands.",
    );
}

export default defineConfig({
    schema: "./prisma/schema.prisma",
    engine: "classic",
    datasource: {
        url: datasourceUrl,
    },
});
