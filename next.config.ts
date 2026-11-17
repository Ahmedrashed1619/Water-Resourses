import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["exceljs", "bcryptjs", "docx"],
  /**
   * Client Router Cache (visited pages stay warm while navigating).
   * - dynamic: default Link prefetch / soft navigations
   * - static: Link prefetch={true} and loading boundaries
   * Next 15 defaults dynamic to 0 (always refetch) — we restore a real cache window.
   */
  experimental: {
    staleTimes: {
      dynamic: 120,
      static: 300,
    },
  },
};

export default nextConfig;
