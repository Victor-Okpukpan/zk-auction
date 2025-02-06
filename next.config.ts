import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    config.stats = "verbose";
    return config;
  },
  trailingSlash: true,
        images: {
          unoptimized: true,
          remotePatterns: [
            {
              protocol: 'https',
              hostname: '*',
              pathname: '**',
            },
          ],
        },
};

export default nextConfig;
