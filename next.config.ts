import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // WSL에서 Windows 파일시스템(/mnt/d/) 변경 감지를 위해 폴링 사용
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    }
    return config
  },
};

export default nextConfig;
