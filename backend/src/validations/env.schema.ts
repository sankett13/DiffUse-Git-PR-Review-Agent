import zod from "zod";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export const envSchema = zod.object({
  NODE_ENV: zod
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: zod.string().default("3000").transform(Number),
});

export const ENV = envSchema.parse(process.env);
