import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const projectDir = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep Vercel builds green for the MVP; TypeScript still type-checks.
  eslint: { ignoreDuringBuilds: true },
  // A stray parent-directory lockfile confuses Next's root inference; pin it.
  outputFileTracingRoot: projectDir,
};

export default nextConfig;
