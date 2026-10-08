import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Aynı klasörde birden çok geliştirme sunucusu (ör. demo ve Supabase modu) için ayrı derleme klasörü
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
