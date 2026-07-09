import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["bcryptjs", "@libsql/client"],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      tls: false,
      net: false,
      fs: false,
      child_process: false,
      dns: false,
      os: false,
      path: false,
      crypto: false,
    };
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.b-cdn.net" },
    ],
  },
};

export default nextConfig;