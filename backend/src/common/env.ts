try {
  process.loadEnvFile();
} catch {
  // No .env file: rely on the real environment (Docker, CI).
}

export function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name}`);
  return value;
}
