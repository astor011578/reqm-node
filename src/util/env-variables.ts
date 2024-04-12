export function getEnv(variableName: string): string {
  const value = process.env[variableName];
  if (!value) throw new Error(`Missing: process.env.${variableName}`);

  return value.trim();
}
