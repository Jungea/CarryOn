import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config) => {
    // WSL에서 Windows 파일시스템(/mnt/d/) 변경 감지를 위해 폴링 사용
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
      ignored: ['**/node_modules/**', '**/.next/**', '**/data/**', '**/public/**'],
    }
    return config
  },
};

export default nextConfig;
