/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['jvklkxhejlqmiwatkhld.supabase.co'],
    unoptimized: true,
  },
  // Disable static optimization for specific pages
  experimental: {
    // This ensures not-found is rendered at runtime
    missingSuspenseWithCSRBailout: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
