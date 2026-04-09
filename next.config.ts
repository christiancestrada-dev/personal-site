import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/content/[key]": ["./data/**"],
  },
};

export default nextConfig;
