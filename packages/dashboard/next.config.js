/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow better-sqlite3 native module in API routes
  serverExternalPackages: ['better-sqlite3'],
};

module.exports = nextConfig;
