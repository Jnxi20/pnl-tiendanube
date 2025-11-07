/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Use server mode to avoid static generation issues
  // This is required for client components with hooks
}

module.exports = nextConfig
