// Fail fast at startup if any required environment variable is missing.
// Imported by prisma.ts so it runs whenever server code touches the database.

const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "JWT_SECRET",
  "GEMINI_API_KEY",
  "OPENROUTER_API_KEY",
] as const;

function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        `Set them in your .env file (see .env.example).`,
    );
  }
}

validateEnv();

export {};
