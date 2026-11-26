import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Values already present in the environment win over the .env file.
const envFile = resolve(__dirname, '..', '.env');
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

/** 127.0.0.1, not localhost: the compose gateway binds the IPv4 loopback only. */
export const baseUrl = (process.env.OPENMRS_BASE_URL ?? 'http://127.0.0.1:8091/openmrs').replace(
  /\/+$/,
  '',
);

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env (public demo defaults of the OpenMRS distribution).`,
    );
  }
  return value;
}
