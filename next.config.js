/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    DATA_ROOT: process.env.DATA_ROOT || './data',
  },
  // Enable standalone output for Docker
  output: 'standalone',
}

module.exports = nextConfig
