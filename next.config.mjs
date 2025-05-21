/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['jvklkxhejlqmiwatkhld.supabase.co'],
    unoptimized: true,
  },
  // Disable static optimization for specific pages
  experimental: {
    // Add only valid Next.js 15.x experimental options here if needed
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
