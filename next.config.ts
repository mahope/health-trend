import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    // Prevent Turbopack from picking the wrong workspace root (multiple lockfiles on this machine)
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
