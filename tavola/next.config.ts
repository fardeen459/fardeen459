import path from "node:path";
import type { NextConfig } from "next";

/**
 * `TAVOLA_EXPORT=1 npm run build` writes a plain static site to ./out
 * (no server needed). Without it you get the normal Next.js build.
 */
const staticExport = process.env.TAVOLA_EXPORT === "1";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  ...(staticExport ? { output: "export" as const } : {}),
  turbopack: {
    // this app lives in a sub-folder of the repository
    root: path.resolve(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
