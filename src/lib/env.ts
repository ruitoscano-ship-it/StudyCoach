import { z } from "zod";

const baseEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET should have at least 16 chars"),
});

export type AppEnv = z.infer<typeof baseEnvSchema>;

export function readAppEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  return baseEnvSchema.parse(source);
}
